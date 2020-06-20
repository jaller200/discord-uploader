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



// -- MARK: Globals

/** The starting rate limit in milliseconds. May be increased over the course of the program. */
let RATE_LIMIT = 500;



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

    // Flags
    .option('--include-hidden', 'Includes hidden files / folders')
    .option('--message-all', 'Attaches a sent message to all attachments. Default is only the first')
    .option('--rate-threshold <rate>', 'The time to wait before sending another message. If this is too low, you will be rate-limited by Discord.', parseFloat);

// Parse the arguments
program.parse(process.argv);

// If nothing is set, we have a program
if (!program.dir && !program.file && !program.message) {
    console.log("error: please specify either a message or file / directory to send. Type '--help' for help");
    return;
}

// Check if both --dir and --file are set
if (program.dir && program.file) {
    console.log("error: please specify a directory '--dir' or a file '--file' but not both");
    return;
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
                console.log(e);
            }
        } else {
            
            // Stat the file
            const stat = await fs.promises.stat(program.file);
            if (stat.name.charAt(0) !== '.' || (stat.name.charAt(0) === '.' && program.includeHidden)) {
                files.push({
                    path: program.file,
                    type: stat.isFile() ? "file" : "dir"
                });
            }
        }
    }

    // If we now have no files, we can't do anything
    if (!message && (!files || files.length === 0)) {
        console.log("error: no message or file(s) to send.");
        console.log("error: please chack if the message was blank or the directory was empty.");
        console.log("error: if you want to include hidden files, pass the '--include-hidden' flag");
    }

    // Now that we have our message and/or files, go ahead and upload them
    try {
        await postMessages(program.auth, program.channel, message, files);
    } catch (e) {
        console.log(e);
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
    // TODO: Implement
}

/**
 * Posts a message to a channel.
 * @param {string} authToken The authentication token
 * @param {string} channelID The channel ID
 * @param {string} message The message to post
 */
async function postMessage(authToken, channelID, message) {

    if (!authToken || authToken.length === 0) throw TypeError("Please provide a valid authentication token");
    if (!channelID || channelID.length === 0) throw TypeError("Please provide a valid channel ID");
    if (!message || message.length === 0) throw TypeError("Please provide a valid message");

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
    try {
        await request.post(options);
    } catch (error) {

        // If the error is 429, we were rate limited
        if (error.statusCode === 429) {

            // Get the time
            const wait = error.error.retry_after;
            log.warn(`Being rate limited by the API for ${w}ms - will resend...`);

            // Sleep for twice the amount and retry
            await sleep(w*2);
            return await postMessage(authToken, channelID, message);
        } else {
            return log.error(`Error posting message - API responded with status ${error.statusCode}!`);
        }
    }

    // Success!
    log.success("Successfully posted message!");
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
    if (!authToken || authToken.length === 0) throw new TypeError("Please provide a valid authentication token!");
    if (!channelID || channelID.length === 0) throw new TypeError("Please provide a valid channel ID!");
    if (!message && (!files || !files.length || files.length === 0)) throw new TypeError("Please provide either a set of files or a message or both!");
    
    // If we have no files, just send a message
    if (!files || !files.length || files.length === 0) {
        await postMessage(authToken, channelID, message);
    } else {
        return log.info("To be implemented...");
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

    // Read our data

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
    } catch (e) {
        throw new Error(e);
    }
}



// -- MARK: Logging

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