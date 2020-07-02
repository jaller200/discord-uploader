import { Logger } from "./logger";

/**
 * A pool of loggers that can be used for writing to multiple loggers
 * at once.
 */
export class LoggerPool {

  // -- MARK: Private Variables

  /** A collection of loggers. */
  private _loggers: Logger[];



  // -- MARK: Constructor

  /**
   * Creates a pool of loggers that can hold multiple loggers.
   * @param loggers Optional loggers to add to the start
   */
  constructor(...loggers: Logger[]) {

    // Initialise our logger array
    this._loggers = [];

    // Add any loggers that we have
    if (loggers && loggers.length > 0) {
      for (const logger of loggers) {
        this._loggers.push(logger);
      }
    }
  }



  // -- MARK: Log Methods

  /**
   * Outputs a debug message to the loggers.
   * @param message The debug message
   */
  debug(message: string): void {
    for (const logger of this._loggers) {
      logger.debug(message);
    }
  }

  /**
   * Outputs an error message to the loggers.
   * @param message The error message
   */
  error(message: string): void {
    for (const logger of this._loggers) {
      logger.error(message);
    }
  }

  /**
   * Outputs an info message to the loggers.
   * @param message The info message
   */
  info(message: string): void {
    for (const logger of this._loggers) {
      logger.info(message);
    }
  }

  /**
   * Outputs a success message to the loggers.
   * @param message The success message
   */
  success(message: string): void {
    for (const logger of this._loggers) {
      logger.success(message);
    }
  }

  /**
   * Outputs a warning message to the loggers.
   * @param message The warn message
   */
  warn(message: string): void {
    for (const logger of this._loggers) {
      logger.warn(message);
    }
  }



  // -- MARK: Log Addition Methods

  /**
   * Adds an additional logger to the pool.
   * @param logger The logger to add
   */
  addLogger(logger: Logger): void {
    this._loggers.push(logger);
  }

  /**
   * Clears all loggers.
   */
  clearLoggers(): void {
    this._loggers = [];
  }
}