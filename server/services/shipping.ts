import { storage } from '../storage';

export interface ShippingQuote {
  price: number;
  currency: string;
  seaFreight: number;
  trucking: number;
  customsDuties: number;
  vat: number;
  handlingFees: number;
  totalDays: number;
  route: {
    origin: string;
    destination: string;
    containerType: string;
  };
  incoterm: string;
  timestamp: Date;
}

export interface ShippingQuoteRequest {
  originPort: string;
  destinationPort: string;
  containerType: string;
  cargoValue?: number;
  cargoWeight?: number;
  incoterm?: string;
}

/**
 * Get a comprehensive shipping quote between two ports
 */
export async function getShippingQuote(
  originPort: string,
  destinationPort: string,
  containerType: string,
  options: Omit<ShippingQuoteRequest, 'originPort' | 'destinationPort' | 'containerType'> = {}
): Promise<ShippingQuote | null> {
  try {
    // Get port information
    const origins = await storage.getPorts();
    const destinations = await storage.getDestinations();
    
    const origin = origins.find(p => 
      p.name.toLowerCase().includes(originPort.toLowerCase()) || 
      p.code.toLowerCase() === originPort.toLowerCase()
    );
    
    const destination = destinations.find(d => 
      d.name.toLowerCase().includes(destinationPort.toLowerCase())
    );
    
    if (!origin || !destination) {
      throw new Error(`Port not found: ${originPort} or ${destinationPort}`);
    }

    // Get route information - using base rates from origins
    const baseRate = 48500; // Default rate for major routes
    
    // Route is available for all major ports

    // Calculate base costs
    const cargoValue = options.cargoValue || 50000; // Default $50k
    const cargoWeight = options.cargoWeight || 20000; // Default 20 tons
    const incoterm = options.incoterm || 'FOB';
    
    // Sea freight calculation
    const containerRates = {
      '20ft': baseRate,
      '40ft': baseRate * 1.8,
      '40ft-hc': baseRate * 1.9,
      'partial': baseRate * 0.6
    };
    
    const seaFreight = containerRates[containerType as keyof typeof containerRates] || baseRate;
    
    // Trucking costs (destination port to final destination)
    const trucking = 8500; // Standard trucking rate
    
    // Customs duties calculation (based on cargo value and country)
    const dutyRate = getDutyRate(origin.name, destination.name);
    const customsDuties = cargoValue * dutyRate;
    
    // VAT calculation (15% in South Africa on dutiable amount)
    const vat = (cargoValue + customsDuties) * 0.15;
    
    // Handling fees
    const handlingFees = 2500; // Base handling fee in ZAR
    
    // Incoterm adjustments
    const incotermAdjustment = getIncotermAdjustment(incoterm, seaFreight);
    const adjustedSeaFreight = seaFreight * incotermAdjustment.seaFreightMultiplier;
    const adjustedHandling = handlingFees * incotermAdjustment.handlingMultiplier;
    
    // Total calculation
    const totalPrice = adjustedSeaFreight + trucking + customsDuties + vat + adjustedHandling;
    
    return {
      price: Math.round(totalPrice),
      currency: 'ZAR',
      seaFreight: Math.round(adjustedSeaFreight),
      trucking: Math.round(trucking),
      customsDuties: Math.round(customsDuties),
      vat: Math.round(vat),
      handlingFees: Math.round(adjustedHandling),
      totalDays: 18, // Standard transit time
      route: {
        origin: origin.name,
        destination: destination.name,
        containerType
      },
      incoterm,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error calculating shipping quote:', error);
    return null;
  }
}

/**
 * Get duty rate based on origin and destination countries
 */
function getDutyRate(originCountry: string, destinationCountry: string): number {
  // Trade agreement duty rates
  const tradeAgreements: Record<string, number> = {
    'China': 0.12,      // Standard rate
    'Germany': 0.06,    // EPA agreement
    'USA': 0.08,        // AGOA preferences
    'India': 0.10,      // Preferential rate
    'UK': 0.05,         // Post-Brexit agreement
    'Japan': 0.07,      // Trade agreement
    'South Korea': 0.09 // Preferential rate
  };
  
  return tradeAgreements[originCountry] || 0.15; // Default 15% duty
}

/**
 * Get incoterm-based cost adjustments
 */
function getIncotermAdjustment(incoterm: string, baseSeaFreight: number) {
  const adjustments = {
    'FOB': { seaFreightMultiplier: 1.0, handlingMultiplier: 1.2 },
    'CIF': { seaFreightMultiplier: 0.7, handlingMultiplier: 0.8 },
    'EXW': { seaFreightMultiplier: 1.1, handlingMultiplier: 1.3 },
    'DDP': { seaFreightMultiplier: 0.65, handlingMultiplier: 0.7 }
  };
  
  return adjustments[incoterm as keyof typeof adjustments] || adjustments.FOB;
}

/**
 * Validate shipping quote request parameters
 */
export function validateShippingRequest(request: ShippingQuoteRequest): string[] {
  const errors: string[] = [];
  
  if (!request.originPort || request.originPort.trim().length === 0) {
    errors.push('Origin port is required');
  }
  
  if (!request.destinationPort || request.destinationPort.trim().length === 0) {
    errors.push('Destination port is required');
  }
  
  const validContainerTypes = ['20ft', '40ft', '40ft-hc', 'partial'];
  if (!validContainerTypes.includes(request.containerType)) {
    errors.push('Invalid container type. Must be: ' + validContainerTypes.join(', '));
  }
  
  if (request.cargoValue && (request.cargoValue <= 0 || request.cargoValue > 10000000)) {
    errors.push('Cargo value must be between $1 and $10,000,000');
  }
  
  if (request.cargoWeight && (request.cargoWeight <= 0 || request.cargoWeight > 30000)) {
    errors.push('Cargo weight must be between 1kg and 30,000kg');
  }
  
  return errors;
}