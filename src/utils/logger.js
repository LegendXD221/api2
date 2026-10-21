/**
 * Winston logger with daily rotate
 */

const winston = require('winston');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bypass-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const extra = Object.keys(meta).length && meta.service !== 'bypass-api'
            ? ' ' + JSON.stringify(meta)
            : '';
          return `${timestamp} [${level}] ${message}${extra}`;
        })
      )
    })
  ]
});

// Optional file rotate when not on serverless
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  try {
    const DailyRotateFile = require('winston-daily-rotate-file');
    logger.add(new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'bypass-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }));
  } catch {
    // rotate package optional
  }
}

module.exports = logger;
