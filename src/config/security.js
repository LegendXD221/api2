'use strict';

const BLOCKED_DOMAINS = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1',
  '10.0.0.0', '172.16.0.0', '192.168.0.0'
];

const VALID_PROTOCOLS = ['http:', 'https:'];

const BOT_UA_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i,
  /curl\//, /wget\//i, /python-requests/i, /go-http-client/i,
  /java\//i, /ruby/i, /php\//i, /perl/i, /httpclient/i
];

const MAX_URL_LENGTH = 2048;
const MAX_BATCH_SIZE = 20;

module.exports = {
  BLOCKED_DOMAINS,
  VALID_PROTOCOLS,
  BOT_UA_PATTERNS,
  MAX_URL_LENGTH,
  MAX_BATCH_SIZE
};
