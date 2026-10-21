'use strict';

process.env.NODE_ENV = 'test';
process.env.API_REQUIRE_AUTH = 'false';

const request = require('supertest');
const app = require('../src/index');

describe('Bypass API v3.0.0', () => {
  describe('GET /health', () => {
    it('returns status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.version).toBe('3.0.0');
    });
  });

  describe('GET /api/services', () => {
    it('returns 88 services', async () => {
      const res = await request(app).get('/api/services');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(88);
      expect(res.body.adlinks).toBe(49);
      expect(res.body.keySystems).toBe(39);
    });
  });

  describe('GET /api/detect', () => {
    it('detects Linkvertise', async () => {
      const res = await request(app).get('/api/detect?url=https://linkvertise.com/123/abc');
      expect(res.status).toBe(200);
      expect(res.body.service.key).toBe('linkvertise');
      expect(res.body.service.type).toBe('adlink');
    });

    it('resolves link-center.net alias to linkvertise', async () => {
      const res = await request(app).get('/api/detect?url=https://link-center.net/abc123');
      expect(res.status).toBe(200);
      expect(res.body.service.key).toBe('linkvertise');
      expect(res.body.service.isCanonical).toBe(false);
    });

    it('detects ouo.io', async () => {
      const res = await request(app).get('/api/detect?url=https://ouo.io/testlink');
      expect(res.status).toBe(200);
      expect(res.body.service.key).toBe('ouoio');
    });

    it('detects delta android key system', async () => {
      const res = await request(app).get('/api/detect?url=https://deltaexecutor.co/key');
      expect(res.status).toBe(200);
      expect(res.body.service.key).toBe('delta_android');
    });

    it('returns null for unknown domain', async () => {
      const res = await request(app).get('/api/detect?url=https://unknown-random-site-xyz.com/abc');
      expect(res.status).toBe(200);
      expect(res.body.service).toBeNull();
    });
  });

  describe('Validation', () => {
    it('rejects missing url', async () => {
      const res = await request(app).get('/api/bypass');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('URL_REQUIRED');
    });

    it('rejects invalid protocol', async () => {
      const res = await request(app).get('/api/bypass?url=ftp://example.com/file');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_URL');
    });

    it('rejects localhost', async () => {
      const res = await request(app).get('/api/bypass?url=http://localhost:3000/secret');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BLOCKED_DOMAIN');
    });

    it('rejects private IPv4 addresses', async () => {
      const res = await request(app).get('/api/bypass?url=http://192.168.1.10/admin');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BLOCKED_DOMAIN');
    });

    it('rejects URLs containing credentials', async () => {
      const res = await request(app).get('/api/bypass?url=http://user%3Apass@example.com/');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_URL');
    });

    it('rejects batch over 20', async () => {
      const urls = Array.from({ length: 21 }, (_, i) => `https://example.com/${i}`);
      const res = await request(app).post('/api/bypass/batch').send({ urls });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BATCH_TOO_LARGE');
    });
  });

  describe('POST /api/bypass/batch', () => {
    it('rejects empty array', async () => {
      const res = await request(app).post('/api/bypass/batch').send({ urls: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/stats', () => {
    it('returns stats object', async () => {
      const res = await request(app).get('/api/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/updates', () => {
    it('returns update status', async () => {
      const res = await request(app).get('/api/updates');
      expect(res.status).toBe(200);
      expect(res.body.version).toBe('3.0.0');
    });
  });

  describe('404', () => {
    it('returns 404 for unknown route', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
