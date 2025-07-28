import { validateShippingRequest } from '../server/services/shipping';

describe('Shipping Service Validation', () => {
  test('should validate shipping request correctly', () => {
    const validRequest = {
      originPort: 'Shanghai',
      destinationPort: 'Durban',
      containerType: '20ft',
      cargoValue: 50000,
      cargoWeight: 15000
    };
    
    const errors = validateShippingRequest(validRequest);
    expect(errors).toHaveLength(0);
  });

  test('should fail validation for empty origin port', () => {
    const invalidRequest = {
      originPort: '',
      destinationPort: 'Durban',
      containerType: '20ft'
    };
    
    const errors = validateShippingRequest(invalidRequest);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain('Origin port is required');
  });

  test('should fail validation for invalid container type', () => {
    const invalidRequest = {
      originPort: 'Shanghai',
      destinationPort: 'Durban',
      containerType: 'invalid-type'
    };
    
    const errors = validateShippingRequest(invalidRequest);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(error => error.includes('Invalid container type'))).toBe(true);
  });
});