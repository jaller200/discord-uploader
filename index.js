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
    .requiredOption('-a, --auth <auth_token>', 'Authentication Token')
    .requiredOption('-c, --channel <channel_id>', 'Channel ID')
    .option('-d, --dir <dir>', 'Upload Directory')
    .option('-f, --file <file>', 'Upload File')
    .option('-m, --message <message>', 'Post Message')
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
        let dir = !!program.dir;
        
        // Get our list of files depending on what we are
        let files = [];
        if (dir) {
            // TODO: Read directory
        } else {
            files.push(program.file);
        }
    }
})();