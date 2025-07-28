// Jest setup file for EasyShip AI test suite

// Global test configuration
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test utilities
global.testUtils = {
  createMockShippingQuote: () => ({
    price: 85000,
    currency: 'ZAR',
    seaFreight: 48500,
    trucking: 8500,
    customsDuties: 6000,
    vat: 8400,
    handlingFees: 2500,
    totalDays: 18,
    route: {
      origin: 'Shanghai',
      destination: 'Durban',
      containerType: '20ft'
    },
    incoterm: 'FOB',
    timestamp: new Date('2025-07-28T10:00:00Z')
  }),
  
  createMockPort: (overrides = {}) => ({
    id: 'shanghai',
    name: 'Shanghai',
    code: 'CNSHA',
    country: 'China',
    latitude: 31.2304,
    longitude: 121.4737,
    ...overrides
  }),
  
  createMockDestination: (overrides = {}) => ({
    id: 'durban',
    name: 'Durban',
    code: 'ZADUR',
    country: 'South Africa',
    truckingRate: 8500,
    latitude: -29.8587,
    longitude: 31.0218,
    ...overrides
  })
};

// Type definitions for test utilities
declare global {
  var testUtils: {
    createMockShippingQuote: () => any;
    createMockPort: (overrides?: any) => any;
    createMockDestination: (overrides?: any) => any;
  };
}