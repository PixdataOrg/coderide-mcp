/**
 * Logger utility for consistent logging across the application
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static instance: Logger;
  private level: LogLevel;

  private constructor() {
    // Default to INFO if not specified
    const logLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    
    switch (logLevel) {
      case 'debug':
        this.level = LogLevel.DEBUG;
        break;
      case 'info':
        this.level = LogLevel.INFO;
        break;
      case 'warn':
        this.level = LogLevel.WARN;
        break;
      case 'error':
        this.level = LogLevel.ERROR;
        break;
      default:
        this.level = LogLevel.INFO;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: string, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  // Use stderr for logging to avoid interfering with MCP protocol
  private log(level: string, message: string, context?: Record<string, unknown>): void {
    // Write to stderr to avoid interfering with MCP protocol on stdout
    process.stderr.write(this.formatMessage(level, message, context) + '\n');
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, context);
    }
  }

  public info(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.INFO) {
      this.log('INFO', message, context);
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.WARN) {
      this.log('WARN', message, context);
    }
  }

  public error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.ERROR) {
      const errorContext = error 
        ? { ...context, error: error.message, stack: error.stack }
        : context;
      this.log('ERROR', message, errorContext);
    }
  }
}

export const logger = Logger.getInstance();
