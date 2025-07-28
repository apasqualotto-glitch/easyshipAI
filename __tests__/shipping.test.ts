import { getShippingQuote, validateShippingRequest } from '../server/services/shipping';
import { storage } from '../server/storage';

// Mock the storage module
jest.mock('../server/storage');
const mockedStorage = storage as jest.Mocked<typeof storage>;

describe('Shipping API', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock data
    mockedStorage.getPorts.mockResolvedValue([
      {
        id: 'shanghai',
        name: 'Shanghai',
        code: 'CNSHA',
        country: 'China',
        latitude: 31.2304,
        longitude: 121.4737
      },
      {
        id: 'hamburg',
        name: 'Hamburg',
        code: 'DEHAM',
        country: 'Germany',
        latitude: 53.5511,
        longitude: 9.9937
      }
    ]);
    
    mockedStorage.getDestinations.mockResolvedValue([
      {
        id: 'durban',
        name: 'Durban',
        code: 'ZADUR',
        country: 'South Africa',
        truckingRate: 8500,
        latitude: -29.8587,
        longitude: 31.0218
      },
      {
        id: 'cape-town',
        name: 'Cape Town',
        code: 'ZACPT',
        country: 'South Africa',
        truckingRate: 12000,
        latitude: -33.9249,
        longitude: 18.4241
      }
    ]);
    
    mockedStorage.getRoutes.mockResolvedValue([
      {
        id: 'shanghai-durban',
        originPortId: 'shanghai',
        destinationPortId: 'durban',
        baseRate: 48500,
        transitDays: 18,
        frequency: 'weekly'
      },
      {
        id: 'hamburg-cape-town',
        originPortId: 'hamburg',
        destinationPortId: 'cape-town',
        baseRate: 52000,
        transitDays: 22,
        frequency: 'bi-weekly'
      }
    ]);
  });

  describe('getShippingQuote', () => {
    test('should fetch a shipping quote for Shanghai to Durban', async () => {
      const quote = await getShippingQuote('Shanghai', 'Durban', '20ft');
      
      expect(quote).toBeDefined();
      expect(quote).not.toBeNull();
      
      if (quote) {
        expect(quote).toHaveProperty('price');
        expect(quote).toHaveProperty('currency');
        expect(quote.currency).toBe('ZAR');
        expect(quote.price).toBeGreaterThan(0);
        expect(quote).toHaveProperty('seaFreight');
        expect(quote).toHaveProperty('trucking');
        expect(quote).toHaveProperty('customsDuties');
        expect(quote).toHaveProperty('vat');
        expect(quote).toHaveProperty('handlingFees');
        expect(quote).toHaveProperty('totalDays');
        expect(quote.totalDays).toBe(18);
        expect(quote.route.origin).toBe('Shanghai');
        expect(quote.route.destination).toBe('Durban');
        expect(quote.route.containerType).toBe('20ft');
      }
    });

    test('should fetch a shipping quote for Hamburg to Cape Town', async () => {
      const quote = await getShippingQuote('Hamburg', 'Cape Town', '40ft');
      
      expect(quote).toBeDefined();
      expect(quote).not.toBeNull();
      
      if (quote) {
        expect(quote.price).toBeGreaterThan(0);
        expect(quote.currency).toBe('ZAR');
        expect(quote.totalDays).toBe(22);
        expect(quote.route.origin).toBe('Hamburg');
        expect(quote.route.destination).toBe('Cape Town');
        expect(quote.route.containerType).toBe('40ft');
      }
    });

    test('should handle different container types correctly', async () => {
      const quote20ft = await getShippingQuote('Shanghai', 'Durban', '20ft');
      const quote40ft = await getShippingQuote('Shanghai', 'Durban', '40ft');
      
      expect(quote20ft).toBeDefined();
      expect(quote40ft).toBeDefined();
      
      if (quote20ft && quote40ft) {
        // 40ft should be more expensive than 20ft for sea freight
        expect(quote40ft.seaFreight).toBeGreaterThan(quote20ft.seaFreight);
      }
    });

    test('should apply different incoterm adjustments', async () => {
      const quoteFOB = await getShippingQuote('Shanghai', 'Durban', '20ft', { incoterm: 'FOB' });
      const quoteCIF = await getShippingQuote('Shanghai', 'Durban', '20ft', { incoterm: 'CIF' });
      
      expect(quoteFOB).toBeDefined();
      expect(quoteCIF).toBeDefined();
      
      if (quoteFOB && quoteCIF) {
        // CIF should have lower sea freight costs (seller pays international shipping)
        expect(quoteCIF.seaFreight).toBeLessThan(quoteFOB.seaFreight);
        expect(quoteFOB.incoterm).toBe('FOB');
        expect(quoteCIF.incoterm).toBe('CIF');
      }
    });

    test('should calculate customs duties based on cargo value', async () => {
      const lowValueQuote = await getShippingQuote('Shanghai', 'Durban', '20ft', { cargoValue: 10000 });
      const highValueQuote = await getShippingQuote('Shanghai', 'Durban', '20ft', { cargoValue: 100000 });
      
      expect(lowValueQuote).toBeDefined();
      expect(highValueQuote).toBeDefined();
      
      if (lowValueQuote && highValueQuote) {
        expect(highValueQuote.customsDuties).toBeGreaterThan(lowValueQuote.customsDuties);
        expect(highValueQuote.vat).toBeGreaterThan(lowValueQuote.vat);
      }
    });

    test('should return null for invalid routes', async () => {
      mockedStorage.getRoutes.mockResolvedValue([]);
      
      const quote = await getShippingQuote('Shanghai', 'Durban', '20ft');
      expect(quote).toBeNull();
    });

    test('should return null for non-existent ports', async () => {
      const quote = await getShippingQuote('NonExistentPort', 'Durban', '20ft');
      expect(quote).toBeNull();
    });

    test('should handle port codes as well as names', async () => {
      const quoteByName = await getShippingQuote('Shanghai', 'Durban', '20ft');
      const quoteByCode = await getShippingQuote('CNSHA', 'ZADUR', '20ft');
      
      expect(quoteByName).toBeDefined();
      expect(quoteByCode).toBeDefined();
      
      if (quoteByName && quoteByCode) {
        expect(quoteByName.route.origin).toBe(quoteByCode.route.origin);
        expect(quoteByName.route.destination).toBe(quoteByCode.route.destination);
      }
    });
  });

  describe('validateShippingRequest', () => {
    test('should pass validation for valid request', () => {
      const request = {
        originPort: 'Shanghai',
        destinationPort: 'Durban',
        containerType: '20ft',
        cargoValue: 50000,
        cargoWeight: 15000
      };
      
      const errors = validateShippingRequest(request);
      expect(errors).toHaveLength(0);
    });

    test('should fail validation for missing origin port', () => {
      const request = {
        originPort: '',
        destinationPort: 'Durban',
        containerType: '20ft'
      };
      
      const errors = validateShippingRequest(request);
      expect(errors).toContain('Origin port is required');
    });

    test('should fail validation for missing destination port', () => {
      const request = {
        originPort: 'Shanghai',
        destinationPort: '',
        containerType: '20ft'
      };
      
      const errors = validateShippingRequest(request);
      expect(errors).toContain('Destination port is required');
    });

    test('should fail validation for invalid container type', () => {
      const request = {
        originPort: 'Shanghai',
        destinationPort: 'Durban',
        containerType: 'invalid-type'
      };
      
      const errors = validateShippingRequest(request);
      expect(errors).toContain('Invalid container type. Must be: 20ft, 40ft, 40ft-hc, partial');
    });

    test('should fail validation for invalid cargo value', () => {
      const request = {
        originPort: 'Shanghai',
        destinationPort: 'Durban',
        containerType: '20ft',
        cargoValue: -1000
      };
      
      const errors = validateShippingRequest(request);
      expect(errors).toContain('Cargo value must be between $1 and $10,000,000');
    });

    test('should fail validation for invalid cargo weight', () => {
      const request = {
        originPort: 'Shanghai',
        destinationPort: 'Durban',
        containerType: '20ft',
        cargoWeight: 50000 // Over 30,000kg limit
      };
      
      const errors = validateShippingRequest(request);
      expect(errors).toContain('Cargo weight must be between 1kg and 30,000kg');
    });
  });
});