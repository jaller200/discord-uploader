/**
 * The various logger types.
 */
export enum LoggerType {
  Debug = "DEBUG",
  Error = "ERROR",
  Info = "INFO",
  Success = "SUCCESS",
  Warn = "WARN"
}

/**
 * The base for various loggers
 */
export interface Logger {

  // -- Methods

  /** Log a debug message */
  debug(message: string): void;

  /** Log an error message */
  error(message: string): void;

  /** Log a debug message */
  info(message: string): void;

  /** Log a success message */
  success(message: string): void;

  /** Log a warning message */
  warn(message: string): void;
}