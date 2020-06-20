#!/usr/bin/env node

// -- MARK: Imports

// Base
const fs = require('fs');
const path = require('path');

// 3rd Party
const colours = require('colors');
const program = require('commander');
const request = require('request-promise');



// -- MARK: Setup

// Set the colour themes
colours.setTheme({
    info: 'bgBlue',
    warn: 'yellow',
    error: 'red',
    success: 'bgGreen',
});

/**
 * The various log messages.
 * @param message All take a message
 */
const log = {
    debug(message) { console.log(message); },
    info(message) { console.log(message.info); },
    warn(message) { console.log(message.warn); },
    error(message) { console.log(message.error); },
    success(message) { console.log(message.success); },
};



// -- MARK: Stats

// Create our stat variables
let failCount = 0;
let successCount = 0;
let throttledCount = 0;
let throttledTotalTime = 0;

// Create our starting rate limit (1000 ms)
let rateLimit = 1000;



// -- MARK: Program

// Create our program
program
    .version('1.0.0')
    
    // Required
    .requiredOption('-a, --auth <auth_token>', 'Authentication Token')
    .requiredOption('-c, --channel <channel_id>', 'Channel ID')

    // Additional
    .option('-d, --dir <dir>', 'Upload Directory')
    .option('-f, --file <file>', 'Upload File')
    .option('-m, --message <message>', 'Post Message')

    // Optional
    .option('--default-rate-limit <limit>', 'Sets the default rate limit in ms. If not specified (or 0 / negative), it defaults to 1000ms', parseInt)

    // Flags
    .option('--include-hidden', 'Includes hidden files / folders')
    .option('--message-all', 'Attaches a sent message to all attachments. Default is only the first')
    .option('--wl-wait-only', 'Only waits when a 429 rate limit error is hit and does not increase the rate limit wait. USE THIS AT YOUR OWN RISK!!!! Will still respect wait limits, but only if a 429 is hit');

// Parse the arguments
program.parse(process.argv);

// If nothing is set, we have a program
if (!program.dir && !program.file && !program.message) {
    log.error("error: please specify either a message or file / directory to send. Type '--help' for help");
    return;
}

// Check if both --dir and --file are set
if (program.dir && program.file) {
    log.error("error: please specify a directory '--dir' or a file '--file' but not both");
    return;
}

// If we have a default rate limit, set it
if (program.defaultRateLimit && program.defaultRateLimit > 0) {
    rateLimit = program.defaultRateLimit;
}

// Now that we have our data, determine what we need
(async () => {

    // Get our data
    let message = program.message;
    let files = [];

    // Get our files if we are reading them
    if (program.dir || program.file) {

        // Determine if we are reading a file or a directory
        let isDirectory = !!program.dir;
        
        // Get our list of files depending on what we are
        if (isDirectory) {

            // Read directory
            try {
                files = await readDirectory(program.dir, program.includeHidden);
            } catch (e) {
                log.error(e);
            }
        } else {
            
            // Stat the file
            const stat = await fs.promises.stat(program.file);
            if (!stat) {
                log.error(`Unable to get stats for file '${program.file}'`);
                return;
            }

            // Check if it's a directory
            if (stat.isDirectory()) {
                log.error("Cannot upload directory as a file!");
                return;
            }

            // Get the filename
            const filename = path.basename(program.file);
            if (filename.charAt(0) !== '.' || (filename.charAt(0) === '.' && program.includeHidden)) {
                files.push({
                    path: program.file,
                    type: stat.isFile() ? "file" : "dir"
                });
            }
        }
    }

    // If we now have no files, we can't do anything
    if (!message && (!files || files.length === 0)) {
        log.error("error: no message or file(s) to send.");
        log.error("error: please chack if the message was blank or the directory was empty.");
        log.error("error: if you want to include hidden files, pass the '--include-hidden' flag");
    }

    // Now that we have our message and/or files, go ahead and upload them
    try {
        await postMessages(program.auth, program.channel, message, files);
    } catch (err) {
        log.error(`An error occurred while posting the messages: ${err}`);
    }
})();



// -- MARK: Discord Functions

/**
 * Posts an array of files to a channel.
 * @param {string} authToken The authentication token
 * @param {string} channelID The channel ID
 * @param {array} files An array of files
 * @param {string} message An optional message
 * @param {boolean} messageAll Whether or not to attach the optional message to all files. Default is only first
 */
async function postFiles(authToken, channelID, files, message = undefined, messageAll = false) {
    
    // Check if we have data
    if (!authToken || !authToken.length || authToken.length === 0) throw new TypeError("Please provide a valid authentication token!");
    if (!channelID || !channelID.length || channelID.length === 0) throw new TypeError("Please provide a valid channel ID!");
    if (!files || !files.length) throw new TypeError("Please provide a valid array of files");

    // Create our small helper function
    const msToHMS = s => `${s / 3.6e6 | 0}h ${(s % 3.6e6) / 6e4 | 0}m ${(s% 6e6) / 1000 | 0}s`;

    // Create the URL
    const API_URL = `https://discord.com/api/v6/channels/${channelID}/messages`;

    // Create our options
    let options = {
        url: API_URL,
        method: "POST",
        headers: {
            "Authorization": authToken,
        },
        formData: {
            "tts": "false",
        },
        resolveWithFullResponse: true,
    };

    // Now iterate through each of our files
    const start = new Date();
    for (let i = 0; i < files.length; ++i) {

        // Make sure the file is not a directory
        if (files[i].type === "dir") continue;

        // Add the file
        options.formData.file = fs.createReadStream(files[i].path);
        options.formData.content = '';

        // Attach our message if need be
        if (message && message.length && message.length !== 0 && (messageAll || i === 0)) {
            options.formData.content = `${message}`;
        }

        const startTime = new Date();
        try {
            const response = await request.post(options);
            if (!response || response.statusCode !== 200) {
                if (response)
                    log.error(`Error uploading file, API responded with status ${response.statusCode}!`);
                else
                    log.error(`Error uploading file, API returned nothing!`);

                failCount++;
            } else {
                successCount++;
            }
        } catch (err) {

            // If the error is 429, we were rate limited
            if (err && err.statusCode === 429) {

                // Parse the error data
                const errorData = JSON.parse(err.error);

                // Get the time
                const wait = errorData.retry_after;

                // Update our stats
                throttledCount++;
                throttledTotalTime += wait;

                // Update our rate limit
                rateLimit += wait;
                log.info(`Being rate limited by the API for ${wait}ms! Adjusting upload delay to ${rateLimit}ms.`);

                // Sleep for twice the amount and retry
                log.info(`Cooling down for ${wait*2}ms before retrying...`);
                await sleep(wait*2);
                i--;
            } else {
                log.error(`Error uploading file, API responded with status ${err.statusCode}!`);
                log.debug(`Error: ${err}`);
                failCount++;
            }
        }

        if (!program.wlWaitOnly) {

            const endTime = new Date();
            const timeDelta = endTime.getTime() - startTime.getTime();
            
            const waitTime = rateLimit - timeDelta;
            if (waitTime > 0) {
                await sleep(waitTime);
            }
        }
    }

    log.success(`Ended at ${new Date().toLocaleString()}! Total time: ${msToHMS(Date.now() - start.getTime())}`);
    log.info(`Rate Limited: ${throttledCount} times. Total time throttled: ${msToHMS(throttledTotalTime)}.`);
    log.info(`Uploaded ${successCount} files, ${failCount} failed`);
    return true;
}

/**
 * Posts a message to a channel.
 * @param {string} authToken The authentication token
 * @param {string} channelID The channel ID
 * @param {string} message The message to post
 */
async function postMessage(authToken, channelID, message) {

    if (!authToken || authToken.length === 0) throw new TypeError("Please provide a valid authentication token");
    if (!channelID || channelID.length === 0) throw new TypeError("Please provide a valid channel ID");
    if (!message || message.length === 0) throw new TypeError("Please provide a valid message");

    // Create our small helper function
    const msToHMS = s => `${s / 3.6e6 | 0}h ${(s % 3.6e6) / 6e4 | 0}m ${(s% 6e6) / 1000 | 0}s`;

    // Create the URL
    const API_URL = `https://discord.com/api/v6/channels/${channelID}/messages`;

    // Create our options
    const options = {
        url: API_URL,
        method: "POST",
        headers: {
            "Authorization": authToken,
            "Content-Type": "application/json",
        },
        json: {
            content: `${message}`,
            tts: "false",
        },
        resolveWithFullResponse: true,
    };

    // Now send the data
    const start = new Date();
    try {
        const response = await request.post(options);
        if (!response || response.statusCode !== 200) {
            if (response)
                log.error(`Error posting message, API responded with status ${response.statusCode}!`);
            else
                log.error(`Error posting message, API returned nothing!`);

            failCount++;
        } else {
            successCount++;
        }
    } catch (err) {

        // If the error is 429, we were rate limited
        if (err && err.statusCode === 429) {

            // Parse the error data
            const errorData = JSON.parse(err.error);

            // Get the time
            const wait = errorData.retry_after;

            // Update our stats
            throttedTotalTime += wait;

            // Sleep for twice the amount and retry
            log.warn(`Being rate limited by the API for ${wait}ms - will resend...`);
            await sleep(wait*2);
            return await postMessage(authToken, channelID, message);
        } else {
            log.error(`Error posting message, API responded with status ${err.statusCode}!`);
            log.debug(`Error: ${err}`);
            return false;
        }
    }

    // Success!
    log.success(`Ended at ${new Date().toLocaleString()}! Total time: ${msToHMS(Date.now() - start.getTime())}`);
    log.info(`Total time throtted: ${msToHMS(throttledTotalTime)}`);
    return true;
}

/**
 * Posts a message and/or files to a Discord channel.
 * @param {string} authToken The authentication token
 * @param {string} channelID The channel ID
 * @param {string} message An optional message to send
 * @param {array} files An optional array of files
 */
async function postMessages(authToken, channelID, message, files) {

    // Check if we have our data
    if (!authToken || !authToken.length || authToken.length === 0) throw new TypeError("Please provide a valid authentication token!");
    if (!channelID || !channelID.length || channelID.length === 0) throw new TypeError("Please provide a valid channel ID!");
    if (!message && (!files || !files.length || files.length === 0)) throw new TypeError("Please provide either a set of files or a message or both!");
    
    // If we have no files, just send a message
    if (!files || !files.length || files.length === 0) {
        await postMessage(authToken, channelID, message);
    } else {
        await postFiles(authToken, channelID, files, message, program.messageAll);
    }
}



// -- MARK: Helper Functions

/**
 * Sleeps for a set period of time.
 * @param {number} ms The time to sleep in milliseconds
 */
async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}



// -- MARK: I/O Functions

/**
 * Reads a directory and returns the resulting information with the 
 * following structure:
 * 
 *  {
 *      "path": <path>,
 *      "type": "dir" | "file" | "unknown"
 *  }
 * 
 * @param {string} dir The directory we want to read
 * @param {boolean} includeHidden Whether to include hidden files. Defaults to false
 */
async function readDirectory(dir, includeHidden = false) {

    // Make sure we actually have information
    if (!dir || !dir.length || dir.length === 0) throw new TypeError("Please provide a valid directory");

    // Make sure we actually have information
    if (!dir || dir.trim().length === 0) return reject("Please provide a directory");
        
    // Read the data
    const data = [];
    try {

        // Get the files in an array
        const files = await fs.promises.readdir(dir);
        for (const file of files) {

            // If the filepath starts with '.', it is a hidden file
            if (!includeHidden && file.charAt(0) === '.') continue;

            // Get the fule path
            const fullPath = path.join(dir, file);
            let type = "unknown";

            // Stat the file to see if we have a file or directory
            const stat = await fs.promises.stat(fullPath);
            if (stat.isFile())
                type = "file";
            else if (stat.isDirectory())
                type = "dir";

            data.push({
                name: file,
                path: fullPath,
                type: type
            });
        }

        return data;
    } catch (err) {
        throw new Error(err);
    }
}