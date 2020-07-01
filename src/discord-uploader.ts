#!/usr/bin/env node

// -- MARK: Imports
import { Command } from 'commander'



// -- MARK: Setup
const cli = new Command();



// -- MARK: Source
cli
  // Information
  .version('0.1.0')
  .usage('[options]')

  // Main Options
  .option('-A', '--auth <auth_token>', 'The authentication token. Used in conjunction with "--channel"')
  .option('-C', '--channel <channel_id>', 'The channel ID. Used in conjunction with "--auth"')
  .option('-W', '--webhook <webhook_url>', 'The webhook URL. Always takes precident. Posts to a single channel only')

  // Additional Options
  .option('--retry-limit <limit>', 'The number of limits to retry. Defaults to 3')

  // Flags
  .option('--error-halt', 'Halts the program if it encounters an error. Default is set to ignore')

  // Parse
  .parse(process.argv);
