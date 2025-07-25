// Live shipping rate integration for major carriers
// Starting with Maersk (free API) and expanding to other carriers

export interface LiveRate {
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  transitTime: string;
  validUntil: string;
  source: "live" | "estimate";
}

export interface LiveRateRequest {
  fromPort: string;
  toPort: string;
  containerType: string;
  weight: number; // Make weight required for accurate rates
  value?: number; // Add cargo value for insurance calculations
  departure?: string;
  cargoType?: string; // Add cargo type for specialized handling
}

// Maersk API integration (free to use)
class MaerskAPI {
  private baseUrl = "https://api.maersk.com/offers/v2";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.MAERSK_API_KEY;
  }

  async getRates(request: LiveRateRequest): Promise<LiveRate[]> {
    if (!this.apiKey) {
      console.log("Maersk API key not configured, using estimates");
      return [];
    }

    try {
      // Map our port codes to Maersk location codes
      const fromLocation = this.mapPortToMaerskCode(request.fromPort);
      const toLocation = this.mapPortToMaerskCode(request.toPort);
      
      if (!fromLocation || !toLocation) {
        return [];
      }

      const departureDate = request.departure || this.getNextBusinessDay();
      
      // Include weight and container type in API request for accurate pricing
      const requestBody = {
        origin: fromLocation,
        destination: toLocation,
        departureDate,
        containerType: request.containerType,
        weight: request.weight || 0,
        cargoValue: request.value || 0
      };

      const response = await fetch(
        `${this.baseUrl}/offers/brand/MAEU/departuredate/${departureDate}?origin=${fromLocation}&destination=${toLocation}&containerType=${request.containerType}&weight=${request.weight}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Maersk API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseRateResponse(data);
    } catch (error) {
      console.error("Maersk API error:", error);
      return [];
    }
  }

  private mapPortToMaerskCode(portCode: string): string | null {
    const portMapping: Record<string, string> = {
      // Common international ports to Maersk location codes
      "CNSHA": "CNSHA", // Shanghai
      "CNQIN": "CNQIN", // Qingdao  
      "CNSZN": "CNSZN", // Shenzhen
      "CNNBO": "CNNBO", // Ningbo
      "CNGZH": "CNGZH", // Guangzhou
      "CNXMN": "CNXMN", // Xiamen
      
      // Rotterdam and Hamburg
      "NLRTM": "NLRTM", // Rotterdam
      "DEHAM": "DEHAM", // Hamburg
      
      // UK ports
      "GBFXT": "GBFXT", // Felixstowe
      "GBSOU": "GBSOU", // Southampton
      
      // US ports
      "USLAX": "USLAX", // Los Angeles
      "USLGB": "USLGB", // Long Beach
      "USNYC": "USNYC", // New York
      
      // South African ports
      "ZADUR": "ZADUR", // Durban
      "ZACPT": "ZACPT", // Cape Town
      "ZAELS": "ZAELS", // East London
      "ZAPLZ": "ZAPLZ", // Port Elizabeth
    };

    return portMapping[portCode] || null;
  }

  private parseRateResponse(data: any): LiveRate[] {
    if (!data.offers || !Array.isArray(data.offers)) {
      return [];
    }

    return data.offers.map((offer: any) => ({
      carrier: "Maersk",
      service: offer.product?.productName || "Standard Service",
      rate: parseFloat(offer.totalPrice?.amount || "0"),
      currency: offer.totalPrice?.currency || "USD",
      transitTime: offer.transitTime || "Unknown",
      validUntil: offer.validTo || this.getValidUntilDate(),
      source: "live" as const
    })).filter((rate: LiveRate) => rate.rate > 0);
  }

  private getNextBusinessDay(): string {
    const today = new Date();
    const nextBusinessDay = new Date(today);
    
    // Add days until we reach a weekday
    nextBusinessDay.setDate(today.getDate() + 1);
    while (nextBusinessDay.getDay() === 0 || nextBusinessDay.getDay() === 6) {
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
    }
    
    return nextBusinessDay.toISOString().split('T')[0];
  }

  private getValidUntilDate(): string {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7); // Valid for 7 days
    return validUntil.toISOString();
  }
}

// Placeholder for MSC API (requires registration and potential fees)
class MSCAPI {
  private baseUrl = "https://api.msc.com/v1";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.MSC_API_KEY;
  }

  async getRates(request: LiveRateRequest): Promise<LiveRate[]> {
    if (!this.apiKey) {
      console.log("MSC API key not configured");
      return [];
    }

    // MSC API implementation would go here
    // Currently returning empty as setup fees may apply
    console.log("MSC API integration available - contact MSC for setup");
    return [];
  }
}

// Main live rates service
export class LiveShippingRates {
  private maersk = new MaerskAPI();
  private msc = new MSCAPI();

  async getAllRates(request: LiveRateRequest): Promise<LiveRate[]> {
    const rates: LiveRate[] = [];

    try {
      // Get Maersk rates (free API)
      const maerskRates = await this.maersk.getRates(request);
      rates.push(...maerskRates);

      // Get MSC rates (if configured)
      const mscRates = await this.msc.getRates(request);
      rates.push(...mscRates);

      // Sort by rate (lowest first)
      return rates.sort((a, b) => a.rate - b.rate);
    } catch (error) {
      console.error("Error fetching live rates:", error);
      return [];
    }
  }

  // Get the best rate available
  async getBestRate(request: LiveRateRequest): Promise<LiveRate | null> {
    const rates = await this.getAllRates(request);
    return rates.length > 0 ? rates[0] : null;
  }
}

// Export the service
export const liveShippingService = new LiveShippingRates();