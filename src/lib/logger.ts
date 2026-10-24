// Lightweight structured logger for production error observability.
// Replaces console.warn/error calls with a utility that can be easily
// extended to send errors to an observability service (Sentry, DataDog, etc.)

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private enabled: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor() {
    // Enable logging when explicitly enabled via localStorage
    this.enabled = this.checkIfEnabled();
  }

  private checkIfEnabled(): boolean {
    try {
      return localStorage.getItem('f1_enable_logging') === 'true';
    } catch {
      return false;
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    // Keep a rolling buffer of recent logs
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // In development, also log to console for debugging
    if (this.enabled) {
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      switch (level) {
        case 'error':
          console.error(`[F1] ${message}${contextStr}`);
          break;
        case 'warn':
          console.warn(`[F1] ${message}${contextStr}`);
          break;
        case 'info':
          console.info(`[F1] ${message}${contextStr}`);
          break;
        case 'debug':
          console.debug(`[F1] ${message}${contextStr}`);
          break;
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  // Get recent logs for debugging or error reporting
  getRecentLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logBuffer.filter(entry => entry.level === level);
    }
    return [...this.logBuffer];
  }

  // Clear the log buffer
  clearLogs(): void {
    this.logBuffer = [];
  }
}

export const logger = new Logger();
