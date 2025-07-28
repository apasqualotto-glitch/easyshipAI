import request from 'supertest';
import express from 'express';
import { router } from '../server/routes';

// Create test app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('API Endpoints', () => {
  describe('POST /api/calculate-quote', () => {
    test('should return a shipping quote for valid request', async () => {
      const requestBody = {
        originPort: 'shanghai',
        destinationPort: 'durban',
        containerType: '20ft',
        cargoValue: 50000,
        cargoWeight: 15000,
        incoterm: 'FOB'
      };

      const response = await request(app)
        .post('/api/calculate-quote')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('quote');
      expect(response.body.quote).toHaveProperty('total');
      expect(response.body.quote).toHaveProperty('breakdown');
      expect(response.body.quote.breakdown).toHaveProperty('seaFreight');
      expect(response.body.quote.breakdown).toHaveProperty('trucking');
      expect(response.body.quote.breakdown).toHaveProperty('customs');
      expect(response.body.quote.breakdown).toHaveProperty('vat');
    });

    test('should return 400 for invalid container type', async () => {
      const requestBody = {
        originPort: 'shanghai',
        destinationPort: 'durban',
        containerType: 'invalid-type',
        cargoValue: 50000,
        cargoWeight: 15000
      };

      const response = await request(app)
        .post('/api/calculate-quote')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for missing required fields', async () => {
      const requestBody = {
        originPort: '',
        destinationPort: 'durban',
        containerType: '20ft'
      };

      const response = await request(app)
        .post('/api/calculate-quote')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/chat', () => {
    test('should return AI chat response', async () => {
      const requestBody = {
        message: 'Get a shipping quote from Shanghai to Durban',
        context: { page: 'homepage' },
        conversationHistory: []
      };

      const response = await request(app)
        .post('/api/chat')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.response).toBe('string');
    });

    test('should handle empty messages', async () => {
      const requestBody = {
        message: '',
        context: { page: 'homepage' },
        conversationHistory: []
      };

      const response = await request(app)
        .post('/api/chat')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/ports', () => {
    test('should return list of available ports', async () => {
      const response = await request(app)
        .get('/api/ports')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('code');
        expect(response.body[0]).toHaveProperty('country');
      }
    });
  });

  describe('GET /api/destinations', () => {
    test('should return list of available destinations', async () => {
      const response = await request(app)
        .get('/api/destinations')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('truckingRate');
      }
    });
  });

  describe('GET /api/cargo-types', () => {
    test('should return list of available cargo types', async () => {
      const response = await request(app)
        .get('/api/cargo-types')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('dutyRate');
      }
    });
  });

  describe('GET /api/exchange-rate', () => {
    test('should return current USD to ZAR exchange rate', async () => {
      const response = await request(app)
        .get('/api/exchange-rate')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('rate');
      expect(response.body).toHaveProperty('source');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.rate).toBe('number');
      expect(response.body.rate).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);
    });

    test('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/calculate-quote')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });
});