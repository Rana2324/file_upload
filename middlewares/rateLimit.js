/**
 * Simple rate limiting middleware to prevent abuse
 */

// Store request counts from IPs with timestamps
const ipRequests = new Map();

// Clean up old records periodically (every 15 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    // Remove entries older than the window
    if (now - data.timestamp > data.windowMs) {
      ipRequests.delete(ip);
    }
  }
}, 15 * 60 * 1000);

// Rate limiting middleware
const rateLimit = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute window by default
    max = 100, // 100 requests per window by default
    message = "Too many requests, please try again later",
    statusCode = 429,
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;

    if (!ipRequests.has(ip)) {
      ipRequests.set(ip, {
        count: 1,
        timestamp: Date.now(),
        windowMs,
      });
      return next();
    }

    const data = ipRequests.get(ip);

    // Reset if window has passed
    if (Date.now() - data.timestamp > data.windowMs) {
      data.count = 1;
      data.timestamp = Date.now();
      return next();
    }

    // Increment and check limit
    data.count++;
    if (data.count > max) {
      return res.status(statusCode).json({
        error: message,
        retryAfter: Math.ceil(
          (data.timestamp + data.windowMs - Date.now()) / 1000
        ),
      });
    }

    next();
  };
};

export default rateLimit;
