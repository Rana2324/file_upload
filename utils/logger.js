import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log formats
const formats = {
  console: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf((info) => {
      const { timestamp, level, message, ...rest } = info;
      const metadata = Object.keys(rest).length
        ? JSON.stringify(rest, null, 2)
        : "";
      return `[${timestamp}] ${level}: ${message} ${metadata}`;
    })
  ),
  file: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
};

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "user-service" },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: formats.console,
    }),

    // Rotate file transport - all logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "application-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      format: formats.file,
    }),

    // Separate error logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      level: "error",
      maxSize: "20m",
      maxFiles: "30d",
      format: formats.file,
    }),
  ],
});

// If we're not in production, add more verbose logging
if (process.env.NODE_ENV !== "production") {
  logger.debug("Logging initialized at debug level");
}

export default logger;
