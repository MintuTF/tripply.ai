/**
 * Production-safe logging utility
 * Logs to console in development, can be extended for production logging services
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isDebugEnabled = process.env.DEBUG === 'true';

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.isDevelopment && level === 'debug' && !this.isDebugEnabled) {
      return; // Skip debug logs in production unless explicitly enabled
    }

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development, pretty print to console
    if (this.isDevelopment) {
      const color = {
        info: '\x1b[36m', // Cyan
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        debug: '\x1b[90m', // Gray
      }[level];
      const reset = '\x1b[0m';

      console.log(`${color}[${level.toUpperCase()}]${reset} ${message}`, context || '');
    } else {
      // In production, log as JSON for structured logging
      console.log(JSON.stringify(logData));
    }

    // TODO: In production, send to external logging service
    // if (level === 'error') {
    //   // Send to Sentry, Datadog, etc.
    // }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };
    this.log('error', message, errorContext);
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();
