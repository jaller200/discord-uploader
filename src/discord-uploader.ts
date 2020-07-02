#!/usr/bin/env node

// -- MARK: Imports
import { Command } from 'commander'
import { LoggerConsole } from './logger/logger-console';



// -- MARK: Setup
const cli = new Command();
const date = new Date();



// -- MARK: Source
cli
  // Information
  .version('0.1.0')
  .usage('[options]')

  // Main Options
  .option('-A, --auth <auth_token>', 'The authentication token. Used in conjunction with "--channel"')
  .option('-C, --channel <channel_id>', 'The channel ID. Used in conjunction with "--auth"')
  .option('-W, --webhook <webhook_url>', 'The webhook URL. Always takes precident. Posts to a single channel only')

  // Required Options
  .option('-d, --dir <directory>', 'A directory of files to upload')
  .option('-f, --file <file>', 'A file to upload')
  .option('-m, --message <message>', 'A message to send')

  // Additional Options
  .option('--file-sort <sort_type>', 'Sorts files. Options are "name", "size", "creationDate". Defaults to "name"')
  .option('--file-sort-order <order_type>', 'Sorts files by an order. Options are "ascending" or "descending". Defaults to "ascending"')
  .option('--file-start-index <start_index>', 'Starts at a specific index based on the sort order. Default is 0. An invalid value will alert the user and quit.')
  .option('--limit-files <file_limit>', 'The maximum number of files before exiting. Defaults to -1 (unlimited).')
  .option('--limit-retries <retry_limit>', 'The maximum number of retries before giving up. Defaults to 3. Infinite retries is -1, and off is 0')
  .option('--limit-time <time_limit>', 'The maximum amount of time before exiting. Finishes the current upload before. Defaults to -1 (unlimited)')
  .option('--log-file <log_file>', 'The log file to save to. Defaults to "discord-uploader-{timestamp}.txt')
  .option('--on-error <handler>', 'How to respond to errors ["ignore" / "pause" / "stop"]. "ignore" ignores errors by default. "pause" lets the user stop or continue, and "quit" just exits')

  // Flags
  .option('--log-verbose', 'Logs more informtion than the default. Useful for additional context')
  .option('--log-debug', 'Logs everything, including requests and responses.')

  // Parse
  .parse(process.argv);

// Now that we've parsed the arguments, make sure we have information
const logger = new LoggerConsole(true);
console.log("\n");
logger.debug("debug");
logger.error("error");
logger.info("info");
logger.success("success");
logger.warn("warn");
console.log("\n");