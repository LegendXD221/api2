/**
 * Core API smoke tests
 */

const request = require('supertest');
const app = require('../src/index');
const { listServices, countByType } = require('../src/config/services');
const { detect } = require('../src/utils/serviceDetector');
const { extractDestination } = require('../src/handlers/serviceHandlers');
const { extractNextFromBody } = require('../src/utils/redirectResolver');
const { resolveAlias, autoDetectAlias, refreshAliases } = require('../src/config/aliases');

describe('Bypass API v3.0.0', () => {
  beforeAll(() => {
    refreshAliases();
  });

  describe('Health & services', () => {
    it('GET /health returns ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.version).toBe('3.0.0');
    });

    it('lists 88 services', () => {
      const counts = countByType();
      expect(counts.total).toBe(88);
      expect(counts.adlink).toBe(49);
      expect(counts.keysystem).toBe(39);
      expect(listServices().length).toBe(88);
    });

    it('GET /api/services', async () => {
      const res = await request(app).get('/api/services');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Auto alias detection', () => {
    it('resolves link-center.net → linkvertise.com', () => {
      expect(resolveAlias('link-center.net')).toBe('linkvertise.com');
      const a = autoDetectAlias('link-center.net');
      expect(a.isAlias).toBe(true);
      expect(a.canonical).toBe('linkvertise.com');
    });

    it('rewrites URL host on detect', () => {
      const d = detect('https://link-center.net/123/foo');
      expect(d.detected).toBe(true);
      expect(d.service.key).toBe('linkvertise');
      expect(d.resolvedUrl).toBe('https://linkvertise.com/123/foo');
    });

    it('ouo.press → ouo.io', () => {
      const d = detect('https://ouo.press/xyz');
      expect(d.service.key).toBe('ouo');
      expect(d.resolvedUrl).toBe('https://ouo.io/xyz');
    });

    it('lnk.to → linkvertise', () => {
      const d = detect('https://lnk.to/abc');
      expect(d.service.key).toBe('linkvertise');
    });
  });

  describe('Detection', () => {
    it('detects Linkvertise', () => {
      const d = detect('https://linkvertise.com/12345/test');
      expect(d.detected).toBe(true);
      expect(d.service.key).toBe('linkvertise');
    });

    it('detects ouo', () => {
      const d = detect('https://ouo.io/xyz');
      expect(d.detected).toBe(true);
      expect(d.service.key).toBe('ouo');
    });
  });

  describe('Multi-hop extract helpers', () => {
    it('extracts JSON destination', () => {
      const html = '{"destination":"https://example.com/file.zip"}';
      expect(extractDestination(html, 'https://x.com')).toBe(
        'https://example.com/file.zip'
      );
    });

    it('extracts meta refresh', () => {
      const html =
        '<meta http-equiv="refresh" content="0;url=https://final.example/a">';
      expect(extractNextFromBody(html, 'https://x.com')).toBe(
        'https://final.example/a'
      );
    });

    it('extracts JS location', () => {
      const html = 'window.location = "https://go.example/b"';
      expect(extractNextFromBody(html, 'https://x.com')).toBe(
        'https://go.example/b'
      );
    });
  });

  describe('Validation', () => {
    it('rejects missing url', async () => {
      const res = await request(app).get('/api/bypass');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('URL_REQUIRED');
    });

    it('rejects invalid url', async () => {
      const res = await request(app).get('/api/bypass?url=not-a-url');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_URL');
    });

    it('rejects localhost', async () => {
      const res = await request(app).get(
        '/api/bypass?url=http://127.0.0.1/secret'
      );
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BLOCKED_DOMAIN');
    });
  });

  describe('Stats & cache', () => {
    it('GET /api/stats', async () => {
      const res = await request(app).get('/api/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/cache/clear', async () => {
      const res = await request(app).post('/api/cache/clear');
      expect(res.status).toBe(200);
      expect(res.body.cleared).toBe(true);
    });
  });
});
