import { QuoteRequest } from "@shared/schema";

export interface CarrierRate {
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  transitTime: string;
  reliability: number; // 0-100%
  route: string[];
  validUntil: string;
  totalCost: number;
  savings?: number;
  ranking: number;
}

export interface ComparisonRequest {
  quoteData: QuoteRequest;
  baseQuote: any;
}

// Mock data for demonstration - in production this would come from real APIs
export class CarrierComparisonService {
  
  async compareRates(request: ComparisonRequest): Promise<CarrierRate[]> {
    const { quoteData, baseQuote } = request;
    
    // Generate comparison data based on route and container type
    const rates = await this.generateCarrierRates(quoteData, baseQuote);
    
    // Sort by total cost (best rate first)
    rates.sort((a, b) => a.totalCost - b.totalCost);
    
    // Add rankings and savings calculations
    return rates.map((rate, index) => ({
      ...rate,
      ranking: index + 1,
      savings: rates[0].totalCost - rate.totalCost
    }));
  }

  private async generateCarrierRates(quoteData: QuoteRequest, baseQuote: any): Promise<CarrierRate[]> {
    const baseSeaFreight = baseQuote.seaFreightCost;
    const baseTotalCost = baseQuote.totalCost;
    
    // Calculate route details
    const route = this.getRouteDetails(quoteData.originPort, quoteData.destinationPort);
    
    const carriers: CarrierRate[] = [
      {
        carrier: "Maersk",
        service: "AE7 Asia-Europe",
        rate: this.adjustRateByRoute(baseSeaFreight, "maersk", route.distance),
        currency: "ZAR",
        transitTime: this.calculateTransitTime("maersk", route.distance),
        reliability: 96,
        route: route.ports,
        validUntil: this.getValidUntilDate(7),
        totalCost: 0, // Will be calculated
        ranking: 0
      },
      {
        carrier: "MSC",
        service: "Indus Express",
        rate: this.adjustRateByRoute(baseSeaFreight, "msc", route.distance),
        currency: "ZAR", 
        transitTime: this.calculateTransitTime("msc", route.distance),
        reliability: 94,
        route: route.ports,
        validUntil: this.getValidUntilDate(5),
        totalCost: 0,
        ranking: 0
      },
      {
        carrier: "CMA CGM",
        service: "Asia Middle East Express", 
        rate: this.adjustRateByRoute(baseSeaFreight, "cma", route.distance),
        currency: "ZAR",
        transitTime: this.calculateTransitTime("cma", route.distance),
        reliability: 92,
        route: route.ports,
        validUntil: this.getValidUntilDate(10),
        totalCost: 0,
        ranking: 0
      },
      {
        carrier: "COSCO",
        service: "Asia South Africa Express",
        rate: this.adjustRateByRoute(baseSeaFreight, "cosco", route.distance),
        currency: "ZAR",
        transitTime: this.calculateTransitTime("cosco", route.distance),
        reliability: 90,
        route: route.ports,
        validUntil: this.getValidUntilDate(14),
        totalCost: 0,
        ranking: 0
      },
      {
        carrier: "Hapag-Lloyd",
        service: "Middle East Express",
        rate: this.adjustRateByRoute(baseSeaFreight, "hapag", route.distance),
        currency: "ZAR",
        transitTime: this.calculateTransitTime("hapag", route.distance), 
        reliability: 93,
        route: route.ports,
        validUntil: this.getValidUntilDate(6),
        totalCost: 0,
        ranking: 0
      }
    ];

    // Calculate total cost for each carrier (sea freight + other costs)
    const otherCosts = baseTotalCost - baseSeaFreight;
    carriers.forEach(carrier => {
      carrier.totalCost = carrier.rate + otherCosts;
    });

    return carriers;
  }

  private adjustRateByRoute(baseRate: number, carrier: string, distance: number): number {
    // Carrier-specific pricing adjustments
    const carrierFactors = {
      maersk: 1.02,   // Premium carrier, slightly higher
      msc: 0.98,      // Competitive pricing
      cma: 1.01,      // Moderate premium
      cosco: 0.95,    // Budget option
      hapag: 1.03     // Premium service
    };

    // Distance-based adjustments
    const distanceFactor = distance > 10000 ? 1.1 : distance > 5000 ? 1.05 : 1.0;
    
    // Random market variation (±10%)
    const marketVariation = 0.9 + Math.random() * 0.2;
    
    const factor = carrierFactors[carrier as keyof typeof carrierFactors] || 1.0;
    
    return Math.round(baseRate * factor * distanceFactor * marketVariation);
  }

  private calculateTransitTime(carrier: string, distance: number): string {
    // Base transit times by carrier efficiency
    const carrierSpeeds = {
      maersk: 25,   // knots average
      msc: 24,
      cma: 23,
      cosco: 22,
      hapag: 24
    };

    const speed = carrierSpeeds[carrier as keyof typeof carrierSpeeds] || 23;
    const hours = distance / speed;
    const days = Math.ceil(hours / 24);
    
    // Add port time (2-3 days)
    const totalDays = days + 2 + Math.floor(Math.random() * 2);
    
    return `${totalDays} days`;
  }

  private getRouteDetails(originPort: string, destinationPort: string) {
    // Route mapping for major shipping lanes
    const routeMap: Record<string, { ports: string[], distance: number }> = {
      "Shanghai-Durban": {
        ports: ["Shanghai", "Singapore", "Colombo", "Durban"],
        distance: 8500
      },
      "Shanghai-Cape Town": {
        ports: ["Shanghai", "Singapore", "Suez", "Cape Town"], 
        distance: 9200
      },
      "Hamburg-Cape Town": {
        ports: ["Hamburg", "Rotterdam", "Las Palmas", "Cape Town"],
        distance: 6800
      },
      "Rotterdam-Durban": {
        ports: ["Rotterdam", "Suez", "Salalah", "Durban"],
        distance: 7200
      },
      "Singapore-Durban": {
        ports: ["Singapore", "Colombo", "Durban"],
        distance: 4200
      }
    };

    const routeKey = `${originPort}-${destinationPort}`;
    return routeMap[routeKey] || {
      ports: [originPort, destinationPort],
      distance: 7000 // Default distance
    };
  }

  private getValidUntilDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }
}

export const carrierComparisonService = new CarrierComparisonService();