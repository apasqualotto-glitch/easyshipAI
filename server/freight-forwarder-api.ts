import { z } from 'zod';

// Freight forwarder service types
export interface FreightForwarderQuote {
  provider: string;
  providerLogo?: string;
  services: {
    customsClearance: number;
    portClearance: number;
    trucking: number;
    documentation?: number;
    inspection?: number;
  };
  totalCost: number;
  currency: string;
  transitTime: string;
  features: string[];
}

// Quote request schema
const freightForwarderQuoteRequest = z.object({
  originPort: z.string(),
  destinationPort: z.string(),
  deliveryAddress: z.string(),
  containerType: z.enum(['20ft', '40ft', '40ft-hc']),
  cargoValue: z.number(),
  weight: z.number(),
  hsCode: z.string().optional(),
  incoterm: z.string(),
  isHazardous: z.boolean().default(false),
});

export type FreightForwarderQuoteRequest = z.infer<typeof freightForwarderQuoteRequest>;

// Mock implementation for now - will be replaced with real APIs
export class FreightForwarderService {
  async getQuotes(request: FreightForwarderQuoteRequest): Promise<FreightForwarderQuote[]> {
    console.log('Getting freight forwarder quotes for:', request);
    
    // For now, return mock data until API keys are configured
    // This will be replaced with real DHL, DSV, FedEx, UPS API calls
    
    const quotes: FreightForwarderQuote[] = [];
    
    // DHL Global Forwarding Quote
    if (process.env.DHL_API_KEY) {
      // TODO: Implement real DHL API call
      console.log('DHL API key configured, would call DHL API here');
    } else {
      // Mock DHL quote
      quotes.push({
        provider: 'DHL Global Forwarding',
        providerLogo: '/logos/dhl.svg',
        services: {
          customsClearance: 850,
          portClearance: 450,
          trucking: this.calculateTruckingCost(request.containerType, request.deliveryAddress, request.incoterm),
          documentation: 150,
          inspection: 200,
        },
        totalCost: 0, // Will be calculated
        currency: 'USD',
        transitTime: '3-5 business days',
        features: [
          'SARS integrated customs clearing',
          'End-to-end visibility',
          'Duty/tax payment service',
          'Door-to-door delivery'
        ]
      });
    }
    
    // DSV Quote - live path when credentials configured
    const dsvQuote = await this.callDSVAPI(request);
    if (dsvQuote) {
      quotes.push(dsvQuote);
    } else {
      // Fallback DSV quote with accurate South African rates
      quotes.push({
        provider: 'DSV South Africa',
        providerLogo: '/logos/dsv.svg',
        services: {
          customsClearance: 1200, // Updated SA customs clearance rate
          portClearance: 650, // Port handling
          trucking: this.calculateTruckingCost(request.containerType, request.deliveryAddress, request.incoterm),
          documentation: 180,
        },
        totalCost: 0,
        currency: 'ZAR',
        transitTime: '3-5 business days',
        features: [
          'DSV Road Transport Network',
          'SARS customs clearance',
          'Tracking when available (estimate)',
          'Door-to-door delivery',
          'Temperature-controlled options'
        ]
      });
    }
    
    // FedEx Trade Networks Quote
    if (process.env.FEDEX_API_KEY) {
      // TODO: Implement real FedEx API call
      console.log('FedEx API key configured, would call FedEx API here');
    } else {
      // Mock FedEx quote
      quotes.push({
        provider: 'FedEx Trade Networks',
        providerLogo: '/logos/fedex.svg',
        services: {
          customsClearance: 920,
          portClearance: 480,
          trucking: this.calculateTruckingCost(request.containerType, request.deliveryAddress, request.incoterm),
          documentation: 180,
          inspection: 250,
        },
        totalCost: 0,
        currency: 'USD',
        transitTime: '3-4 business days',
        features: [
          'Express customs clearance',
          'Global trade management',
          'HS code classification',
          'Priority handling'
        ]
      });
    }
    
    // UPS Supply Chain Solutions Quote
    if (process.env.UPS_API_KEY) {
      // TODO: Implement real UPS API call
      console.log('UPS API key configured, would call UPS API here');
    } else {
      // Mock UPS quote
      quotes.push({
        provider: 'UPS Supply Chain Solutions',
        providerLogo: '/logos/ups.svg',
        services: {
          customsClearance: 890,
          portClearance: 460,
          trucking: this.calculateTruckingCost(request.containerType, request.deliveryAddress, request.incoterm),
          documentation: 160,
        },
        totalCost: 0,
        currency: 'USD',
        transitTime: '4-5 business days',
        features: [
          'Licensed customs broker',
          'Forwarding hub platform',
          'Consolidated billing',
          'Hazmat certified'
        ]
      });
    }
    
    // Calculate total costs
    quotes.forEach(quote => {
      quote.totalCost = Object.values(quote.services).reduce((sum, cost) => sum + cost, 0);
    });
    
    // Sort by total cost
    return quotes.sort((a, b) => a.totalCost - b.totalCost);
  }
  
  private calculateTruckingCost(containerType: string, destination: string, incoterm: string): number {
    // Base trucking rates by container type (fallback when DSV API unavailable)
    const baseRates: Record<string, number> = {
      '20ft': 1200,
      '40ft': 1800,
      '40ft-hc': 2100
    };
    
    let rate = baseRates[containerType] || 1200;
    
    // Incoterm-based adjustments
    if (incoterm === 'EXW' || incoterm === 'FCA') {
      // Buyer responsible for transport - minimal port-to-gate only
      rate = rate * 0.3;
    } else if (incoterm === 'FOB' || incoterm === 'CFR' || incoterm === 'CIF') {
      // Standard door-to-door service
      // Add distance-based surcharges for South African destinations
      if (destination.toLowerCase().includes('johannesburg') || destination.toLowerCase().includes('gauteng')) {
        rate += 600; // Inland delivery surcharge to JHB/Gauteng
      } else if (destination.toLowerCase().includes('eastern cape') || destination.toLowerCase().includes('port elizabeth')) {
        rate += 400; // Eastern Cape delivery
      } else if (destination.toLowerCase().includes('western cape') || destination.toLowerCase().includes('cape town')) {
        rate += 0; // Cape Town is closer to port
      } else if (destination.toLowerCase().includes('kwazulu') || destination.toLowerCase().includes('durban')) {
        rate += 300; // KZN delivery
      } else {
        rate += 500; // Other provinces
      }
    } else if (incoterm === 'DDP' || incoterm === 'DAP') {
      // Premium door-to-door with additional services
      rate = rate * 1.2;
      if (destination.toLowerCase().includes('johannesburg') || destination.toLowerCase().includes('gauteng')) {
        rate += 800; // Premium inland delivery
      } else if (destination.toLowerCase().includes('eastern cape')) {
        rate += 600;
      } else if (destination.toLowerCase().includes('kwazulu')) {
        rate += 500;
      }
    }
    
    return Math.round(rate);
  }

  // Helper functions for DSV API
  private extractCity(location: string): string {
    if (location.toLowerCase().includes('cape town')) return 'Cape Town';
    if (location.toLowerCase().includes('johannesburg')) return 'Johannesburg';
    if (location.toLowerCase().includes('durban')) return 'Durban';
    if (location.toLowerCase().includes('port elizabeth')) return 'Port Elizabeth';
    if (location.toLowerCase().includes('pretoria')) return 'Pretoria';
    return 'Cape Town'; // default
  }

  private getPostalCode(location: string): string {
    const postalCodes: Record<string, string> = {
      'cape town': '8001',
      'johannesburg': '2000',
      'durban': '4000',
      'port elizabeth': '6000',
      'pretoria': '0001'
    };
    
    for (const [city, code] of Object.entries(postalCodes)) {
      if (location.toLowerCase().includes(city)) return code;
    }
    return '8001'; // Default to Cape Town
  }

  private calculateVolume(containerType: string): number {
    const volumes: Record<string, number> = {
      '20ft': 33.0, // CBM
      '40ft': 67.5, // CBM  
      '40ft-hc': 76.0 // CBM
    };
    return volumes[containerType] || 67.5;
  }

  private getServiceLevelFromIncoterm(incoterm: string): string {
    switch (incoterm) {
      case 'EXW':
      case 'FCA':
        return 'BASIC'; // Minimal service
      case 'FOB':
      case 'CFR':
      case 'CIF':
        return 'STANDARD'; // Standard door-to-door
      case 'DDP':
      case 'DAP':
        return 'PREMIUM'; // Full service with customs
      default:
        return 'STANDARD';
    }
  }

  private getRequiredServices(incoterm: string): string[] {
    const baseServices = ['PORT_HANDLING', 'DOCUMENTATION'];
    
    switch (incoterm) {
      case 'EXW':
        return ['PORT_PICKUP']; // Minimal - just port pickup
      case 'FCA':
        return [...baseServices]; // Basic services
      case 'FOB':
      case 'CFR':
        return [...baseServices, 'TRUCKING']; // Standard transport
      case 'CIF':
        return [...baseServices, 'TRUCKING', 'CUSTOMS_CLEARANCE']; // With customs
      case 'DDP':
      case 'DAP':
        return [...baseServices, 'TRUCKING', 'CUSTOMS_CLEARANCE', 'DUTY_PAYMENT', 'DOOR_DELIVERY']; // Full service
      default:
        return [...baseServices, 'TRUCKING', 'CUSTOMS_CLEARANCE'];
    }
  }
  
  // Future implementation for real API calls
  private async callDHLAPI(request: FreightForwarderQuoteRequest): Promise<FreightForwarderQuote | null> {
    // TODO: Implement DHL Global Forwarding API
    // POST https://api.dhl.com/dgf/shipment-booking
    return null;
  }
  
  private async callDSVAPI(request: FreightForwarderQuoteRequest): Promise<FreightForwarderQuote | null> {
    if (!process.env.DSV_API_KEY || !process.env.DSV_CLIENT_ID || !process.env.DSV_CLIENT_SECRET) {
      console.log('DSV API credentials not configured');
      return null;
    }

    try {
      // Step 1: Get OAuth 2.0 token
      const tokenResponse = await fetch('https://api.dsv.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'grant_type': 'client_credentials',
          'client_id': process.env.DSV_CLIENT_ID,
          'client_secret': process.env.DSV_CLIENT_SECRET,
          'scope': 'quote booking'
        })
      });

      if (!tokenResponse.ok) {
        console.error('DSV OAuth failed:', await tokenResponse.text());
        return null;
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Step 2: Get quote from the provided DSV API endpoint
      const deliveryLocation = request.deliveryAddress || request.deliveryAddress;
      const serviceLevel = this.getServiceLevelFromIncoterm(request.incoterm);
      
      const quotePayload = {
        mode: 'ROAD',
        service: serviceLevel,
        pickup: {
          country: 'ZA',
          city: this.extractCity(request.destinationPort),
          postalCode: this.getPostalCode(request.destinationPort),
          address: 'Container Terminal'
        },
        delivery: {
          country: 'ZA', 
          city: this.extractCity(deliveryLocation),
          postalCode: this.getPostalCode(deliveryLocation),
          address: request.deliveryAddress || 'Commercial District'
        },
        goods: [{
          weight: request.weight,
          volume: this.calculateVolume(request.containerType),
          pieces: 1,
          commodity: 'CONTAINERIZED_CARGO',
          description: `${request.containerType} container import - ${request.incoterm} delivery`,
          containerType: request.containerType
        }],
        declaredValue: {
          amount: request.cargoValue,
          currency: 'USD'
        },
        incoterm: request.incoterm,
        services: this.getRequiredServices(request.incoterm),
        specialRequirements: request.isHazardous ? ['HAZMAT_CERTIFIED'] : []
      };

      // Use the provided DSV API endpoint
      const quoteResponse = await fetch('https://api.dsv.com/qs-demo/quote/v1/quotes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'DSV-Subscription-Key': process.env.DSV_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(quotePayload)
      });

      if (!quoteResponse.ok) {
        const errorText = await quoteResponse.text();
        console.error('DSV Quote API failed:', quoteResponse.status, errorText);
        return null;
      }

      const quoteData = await quoteResponse.json();
      console.log('DSV API Response:', JSON.stringify(quoteData, null, 2));
      
      // Extract costs from DSV response
      const totalCost = quoteData.quote?.totalCost || quoteData.totalAmount || 0;
      const currency = quoteData.quote?.currency || quoteData.currency || 'ZAR';
      
      // Parse individual service costs if available
      const services = quoteData.services || quoteData.quote?.services || {};
      const customsClearance = services.customsClearance || services.customs || 1200;
      const portClearance = services.portHandling || services.port || 650;
      const trucking = services.trucking || services.transport || totalCost * 0.6;
      const documentation = services.documentation || services.docs || 180;
      
      // Convert to ZAR if needed  
      const exchangeRate = 18.5;
      const finalCosts = currency === 'USD' ? {
        customsClearance: Math.round(customsClearance * exchangeRate),
        portClearance: Math.round(portClearance * exchangeRate),
        trucking: Math.round(trucking * exchangeRate),
        documentation: Math.round(documentation * exchangeRate)
      } : {
        customsClearance,
        portClearance,
        trucking,
        documentation
      };

      return {
        provider: 'DSV South Africa',
        services: finalCosts,
        totalCost: Object.values(finalCosts).reduce((sum, cost) => sum + cost, 0),
        currency: 'ZAR',
        transitTime: quoteData.quote?.transitTime || quoteData.transitDays ? `${quoteData.transitDays} days` : '3-5 business days',
        features: [
          'DSV Road Transport Network',
          'API quote when credentials configured',
          'SARS customs clearance',
          'Door-to-door delivery',
          'Professional handling'
        ]
      };

    } catch (error) {
      console.error('DSV API error:', error);
      return null;
    }
  }
  
  private async callFedExAPI(request: FreightForwarderQuoteRequest): Promise<FreightForwarderQuote | null> {
    // TODO: Implement FedEx API
    // Use FedEx Trade Networks endpoints
    return null;
  }
  
  private async callUPSAPI(request: FreightForwarderQuoteRequest): Promise<FreightForwarderQuote | null> {
    // TODO: Implement UPS API
    // Use UPS Forwarding Hub
    return null;
  }
}

export const freightForwarderService = new FreightForwarderService();