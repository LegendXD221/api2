'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: isDev
        ? format.combine(format.colorize(), format.simple())
        : format.json()
    })
  ]
});

// File logging only outside serverless (Vercel ephemeral fs)
if (!process.env.VERCEL && !isDev) {
  try {
    const DailyRotate = require('winston-daily-rotate-file');
    logger.add(new DailyRotate({
      filename: path.join(process.cwd(), 'logs', 'bypass-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      maxSize: '20m'
    }));
  } catch (_) { /* skip if DailyRotate unavailable */ }
}

module.exports = logger;
