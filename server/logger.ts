/**
 * Structured Logging Service for EasyShip AI
 * Provides JSON-formatted logs with request tracking,  error handling, and performance monitoring
 */

import fs from "fs";
import path from "path";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  context?: string;
  data?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number; // milliseconds
}

/**
 * Logger Class - Singleton pattern for application-wide logging
 */
class Logger {
  private static instance: Logger;
  private logDir: string;
  private enableConsole: boolean;
  private enableFile: boolean;
  private enableJSON: boolean;

  private constructor() {
    this.logDir = process.env.LOG_DIR || "./logs";
    this.enableConsole =
      process.env.LOG_CONSOLE !== "false" && process.env.NODE_ENV !== "production";
    this.enableFile = process.env.LOG_FILE !== "false";
    this.enableJSON = process.env.LOG_JSON === "true";

    // Create logs directory if it doesn't exist
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get logger instance (singleton)
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log with structured format
   */
  private log(entry: LogEntry): void {
    const timestamp = new Date().toISOString();

    // Prepare log output
    if (this.enableJSON) {
      // JSON format for log aggregation
      const jsonLog = {
        ...entry,
        timestamp,
      };

      if (this.enableConsole) {
        console.log(JSON.stringify(jsonLog));
      }

      if (this.enableFile) {
        this.writeToFile(jsonLog);
      }
    } else {
      // Human-readable format
      const logLine = this.formatReadable(entry, timestamp);

      if (this.enableConsole) {
        this.logToConsole(entry.level, logLine);
      }

      if (this.enableFile) {
        this.writeToFile(logLine);
      }
    }
  }

  // Public logging methods
  debug(message: string, context?: string, data?: Record<string, any>): void {
    this.log({ timestamp: "", level: "debug", message, context, data });
  }

  info(message: string, context?: string, data?: Record<string, any>): void {
    this.log({ timestamp: "", level: "info", message, context, data });
  }

  warn(message: string, context?: string, data?: Record<string, any>): void {
    this.log({ timestamp: "", level: "warn", message, context, data });
  }

  error(
    message: string,
    error?: Error,
    context?: string,
    data?: Record<string, any>
  ): void {
    this.log({
      timestamp: "",
      level: "error",
      message,
      context,
      data,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  fatal(
    message: string,
    error?: Error,
    context?: string,
    data?: Record<string, any>
  ): void {
    this.log({
      timestamp: "",
      level: "fatal",
      message,
      context,
      data,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });

    // Fatal errors should exit process
    process.exit(1);
  }

  /**
   * Log API request with response tracking
   */
  apiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId?: string,
    error?: Error
  ): void {
    this.log({
      timestamp: "",
      level: statusCode >= 400 ? "warn" : "info",
      message: `${method} ${path} - ${statusCode}`,
      requestId,
      userId,
      context: "API",
      duration,
      data: {
        method,
        path,
        statusCode,
      },
      error: error
        ? {
            name: error.name,
            message: error.message,
          }
        : undefined,
    });
  }

  /**
   * Log performance metrics
   */
  performance(
    operation: string,
    duration: number,
    success: boolean,
    data?: Record<string, any>
  ): void {
    this.log({
      timestamp: "",
      level: success ? "info" : "warn",
      message: `Performance: ${operation} - ${duration}ms`,
      context: "PERFORMANCE",
      duration,
      data: {
        operation,
        success,
        ...data,
      },
    });
  }

  /**
   * Log database operations
   */
  database(queryType: string, duration: number, success: boolean, table?: string): void {
    this.log({
      timestamp: "",
      level: success ? "debug" : "warn",
      message: `Database ${queryType} on ${table || "unknown"} - ${duration}ms`,
      context: "DATABASE",
      duration,
      data: {
        queryType,
        table,
        success,
      },
    });
  }

  /**
   * Format log for human reading
   */
  private formatReadable(entry: LogEntry, timestamp: string): string {
    const { level, message, context, data, error } = entry;
    const levelUpper = level.toUpperCase().padEnd(6);
    const contextStr = context ? `[${context}]` : "";

    let output = `${timestamp} ${levelUpper} ${contextStr} ${message}`;

    if (data && Object.keys(data).length > 0) {
      output += ` | ${JSON.stringify(data)}`;
    }

    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`;
      if (
        error.stack &&
        process.env.LOG_STACK !== "false"
      ) {
        output += `\n  Stack: ${error.stack}`;
      }
    }

    return output;
  }

  /**
   * Console output with colors
   */
  private logToConsole(level: LogLevel, message: string): void {
    const colors: Record<LogLevel, string> = {
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m", // Green
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
      fatal: "\x1b[35m", // Magenta
    };

    const reset = "\x1b[0m";
    const color = colors[level] || "";

    console.log(`${color}${message}${reset}`);
  }

  /**
   * Write log to file (rotated daily)
   */
  private writeToFile(entry: LogEntry | string): void {
    try {
      const date = new Date();
      const filename = `easyship-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.log`;
      const filePath = path.join(this.logDir, filename);

      const content =
        typeof entry === "string"
          ? entry
          : JSON.stringify(entry);

      fs.appendFileSync(filePath, content + "\n");
    } catch (error) {
      console.error("Failed to write log to file:", error);
    }
  }

  /**
   * Get log files list
   */
  getLogFiles(): string[] {
    if (!fs.existsSync(this.logDir)) {
      return [];
    }
    return fs
      .readdirSync(this.logDir)
      .filter((f) => f.startsWith("easyship-") && f.endsWith(".log"));
  }

  /**
   * Clear old logs (keep last N days)
   */
  clearOldLogs(daysToKeep: number = 30): number {
    const files = this.getLogFiles();
    const now = Date.now();
    let deleted = 0;

    files.forEach((file) => {
      const filePath = path.join(this.logDir, file);
      const stats = fs.statSync(filePath);
      const ageInDays = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      if (ageInDays > daysToKeep) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    });

    if (deleted > 0) {
      this.info(`Cleaned up ${deleted} old log files`);
    }

    return deleted;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Clean up old logs on startup
logger.clearOldLogs(30);

// Clean up old logs daily
setInterval(() => logger.clearOldLogs(30), 24 * 60 * 60 * 1000);
