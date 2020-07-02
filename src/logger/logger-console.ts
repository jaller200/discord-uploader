// -- MARK: Imports
import { Logger, LoggerType } from './logger';
import { red, cyan, blue, green, yellow } from 'chalk';

/**
 * A logger class that will output to STDOUT.
 */
export class LoggerConsole implements Logger {

  // -- Private Variables

  /** Whether or not the console is in debug mode. */
  private _debug: boolean;



  // -- MARK: Constructor

  /**
   * Creates a logger that will output to the console.
   * @param debug Whether the logger is in debug mode
   */
  constructor(debug: boolean = false) {
    this._debug = debug;
  }



  // -- MARK: Public Methods

  /**
   * Outputs a debug message. Generally used for a "verbose" mode.
   * @param message The debug message
   */
  debug(message: string): void {
    if (this._debug)
      this.log(message, LoggerType.Debug)
  }
  
  /**
   * Outputs an error message. Use this when something goes horribly wrong.
   * @param message The error message
   */
  error(message: string): void {
    this.log(message, LoggerType.Error);
  }

  /**
   * Outputs an general info message. Use this for general text.
   * @param message The info message
   */
  info(message: string): void {
    this.log(message, LoggerType.Error);
  }

  /**
   * Outputs a success message. Use this when something goes right, 
   * or is finished.
   * @param message The success message
   */
  success(message: string): void {
    this.log(message, LoggerType.Success);
  }

  /**
   * Outputs a warning message. Use this to alert the user of potential issues.
   * @param message The warning message
   */
  warn(message: string): void {
    this.log(message, LoggerType.Warn);
  }



  // -- MARK: Private Methods

  /**
   * Logs a message to the console
   * @param message The message to log
   */
  private log(message: string, type: LoggerType): void {

    // Get our date as a YYYY:MM:DD hh:mm:ss
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    // Create our message
    let formattedMessage = '[' + date + '] ';
    formattedMessage += '[' + type.padEnd(7) + ']: ';
    formattedMessage += message;

    // Log for the various types
    switch (type) {
      case LoggerType.Debug: { console.log(cyan(message)); break; }
      case LoggerType.Error: { console.log(red(message)); break; }
      case LoggerType.Info: { console.log(blue(message)); break; }
      case LoggerType.Success: { console.log(green(message)); break; }
      case LoggerType.Warn: { console.log(yellow(message)); break; }
      default: { console.log(message); break; }
    }
  }
}