import morgan from "morgan";
import logger from "../utils/logger.js";

// Create custom token for response time with color
morgan.token("response-time-colored", (req, res) => {
  const duration = res.responseTime;
  if (!duration) return "";

  // Color based on response time
  if (duration < 100) return `\x1b[32m${duration}ms\x1b[0m`; // Green for fast
  if (duration < 500) return `\x1b[33m${duration}ms\x1b[0m`; // Yellow for moderate
  return `\x1b[31m${duration}ms\x1b[0m`; // Red for slow
});

// Custom format that includes colorization and user info
const morganFormat =
  ":method :url :status :response-time-colored - :remote-addr - :user-agent";

// Create response time calculator
const responseTime = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    res.responseTime = Date.now() - start;

    // Add detailed logs for errors
    if (res.statusCode >= 400) {
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        responseTime: res.responseTime,
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user ? req.user._id : "anonymous",
      };

      if (res.statusCode >= 500) {
        logger.error(`Server Error: ${JSON.stringify(logData)}`);
      } else {
        logger.warn(`Client Error: ${JSON.stringify(logData)}`);
      }
    }
  });

  next();
};

// Create request logger middleware
const requestLogger = [
  // Calculate response time first
  responseTime,

  // Apply Morgan
  morgan(morganFormat, { stream: logger.stream }),
];

export default requestLogger;
