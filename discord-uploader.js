// -- MARK: Imports

// Base
const fs = require('fs');
const path = require('path');

// 3rd Party
const program = require('commander');
const request = require('request');



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
    .option('--message-all', 'Attaches a sent message to all attachments. Default is only the first');

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

            // TODO: Read directory
            try {
                files = await readDirectory(program.dir, program.includeHidden);
            } catch (e) {
                console.log(e);
            }
            console.log(files);
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

    console.log(files);

    // If we now have no files, we can't do anything
    if (!message && (!files || files.length === 0)) {
        console.log("error: no message or file(s) to send.");
        console.log("error: please chack if the message was blank or the directory was empty.");
        console.log("error: if you want to include hidden files, pass the '--include-hidden' flag");
    } else {

        // TODO: Remove this soon
        console.log("Message: ", (!!message ? message : "<none>"));
        console.log(files);
    }

    // Now we have our message and/or files. Go ahead and upload them
})();



// -- MARK: Discord Functions

/**
 * Posts a message and/or files to a Discord channel.
 * @param {string} authToken The authentication token
 * @param {string} channelID The channel ID
 * @param {string} message The message to send
 * @param {array} files An array of files
 */
async function postMessages(authToken, channelID, message, files) {
    return new Promise((resolve, reject) => {
        (async () => {
            // TODO: Implement
        })();
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
    return new Promise((resolve, reject) => {

        // Make sure we actually have information
        if (!dir || dir.trim().length === 0) return reject("Please provide a directory");
        
        // Run our code
        (async () => {

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

                // Return our data
                resolve(data);
            } catch (e) {
                return reject(e);
            }
        })();
    });
}