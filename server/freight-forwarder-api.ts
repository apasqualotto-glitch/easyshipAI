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
  finalDestination: z.string(),
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
          trucking: this.calculateTruckingCost(request.containerType, request.finalDestination),
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
    
    // DSV Quote - Real API integration
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
          trucking: this.calculateTruckingCost(request.containerType, request.finalDestination),
          documentation: 180,
        },
        totalCost: 0,
        currency: 'ZAR',
        transitTime: '3-5 business days',
        features: [
          'DSV Road Transport Network',
          'SARS customs clearance',
          'Real-time tracking',
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
          trucking: this.calculateTruckingCost(request.containerType, request.finalDestination),
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
          trucking: this.calculateTruckingCost(request.containerType, request.finalDestination),
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
  
  private calculateTruckingCost(containerType: string, destination: string): number {
    // Base trucking rates by container type (fallback when DSV API unavailable)
    const baseRates: Record<string, number> = {
      '20ft': 1200,
      '40ft': 1800,
      '40ft-hc': 2100
    };
    
    let rate = baseRates[containerType] || 1200;
    
    // Add distance-based surcharges for South African destinations
    if (destination.toLowerCase().includes('johannesburg') || destination.toLowerCase().includes('gauteng')) {
      rate += 400; // Inland delivery surcharge to JHB/Gauteng
    } else if (destination.toLowerCase().includes('eastern cape') || destination.toLowerCase().includes('port elizabeth')) {
      rate += 300; // Eastern Cape delivery
    } else if (destination.toLowerCase().includes('western cape') || destination.toLowerCase().includes('cape town')) {
      rate += 0; // Cape Town is closer to port
    } else if (destination.toLowerCase().includes('kwazulu') || destination.toLowerCase().includes('durban')) {
      rate += 200; // KZN delivery
    }
    
    return rate;
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

      // Step 2: Get trucking quote from DSV Quote API
      const quotePayload = {
        transport: {
          mode: 'ROAD',
          service: 'STANDARD',
        },
        pickup: {
          country: 'ZA',
          city: this.extractCity(request.destinationPort),
          postalCode: this.getPostalCode(request.destinationPort)
        },
        delivery: {
          country: 'ZA',
          city: this.extractCity(request.finalDestination),
          postalCode: this.getPostalCode(request.finalDestination)
        },
        goods: {
          totalWeight: request.weight,
          totalVolume: this.calculateVolume(request.containerType),
          pieces: 1,
          commodity: 'GENERAL_CARGO'
        },
        value: {
          amount: request.cargoValue,
          currency: 'USD'
        }
      };

      const quoteResponse = await fetch('https://api.dsv.com/quote/v1/road', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'DSV-Subscription-Key': process.env.DSV_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotePayload)
      });

      if (!quoteResponse.ok) {
        console.error('DSV Quote API failed:', await quoteResponse.text());
        return null;
      }

      const quoteData = await quoteResponse.json();
      
      // Extract costs from DSV response
      const totalCost = quoteData.quote?.totalAmount || 0;
      const currency = quoteData.quote?.currency || 'ZAR';
      
      // Convert to ZAR if needed
      const truckingCostZAR = currency === 'USD' ? totalCost * 18.5 : totalCost;

      return {
        provider: 'DSV South Africa',
        services: {
          customsClearance: 1200, // DSV standard customs fee
          portClearance: 650, // Port clearance
          trucking: truckingCostZAR, // Real DSV trucking quote
          documentation: 180,
        },
        totalCost: 1200 + 650 + truckingCostZAR + 180,
        currency: 'ZAR',
        transitTime: quoteData.quote?.transitDays ? `${quoteData.quote.transitDays} days` : '3-5 business days',
        features: [
          'DSV Road Transport Network',
          'Real-time GPS tracking',
          'Customs brokerage included',
          'Door-to-door delivery',
          'Temperature-controlled options'
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