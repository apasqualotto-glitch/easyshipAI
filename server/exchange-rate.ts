// Real-time USD to ZAR exchange rate service
export interface ExchangeRateResponse {
  success: boolean;
  rate: number;
  source: string;
  timestamp: string;
  error?: string;
}

export class ExchangeRateService {
  private static instance: ExchangeRateService;
  private cachedRate: { rate: number; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  async getUSDToZARRate(): Promise<ExchangeRateResponse> {
    // Check cache first
    if (this.cachedRate && (Date.now() - this.cachedRate.timestamp) < this.CACHE_DURATION) {
      return {
        success: true,
        rate: this.cachedRate.rate,
        source: "cached",
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Try multiple free APIs for reliability
      const rate = await this.fetchFromMultipleSources();
      
      // Cache the result
      this.cachedRate = {
        rate,
        timestamp: Date.now()
      };

      return {
        success: true,
        rate,
        source: "live_api",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Exchange rate fetch failed:", error);
      
      // Fallback to approximate rate (should be replaced with live data)
      const fallbackRate = 18.5; // Approximate USD/ZAR rate
      return {
        success: false,
        rate: fallbackRate,
        source: "fallback",
        timestamp: new Date().toISOString(),
        error: "Live rate unavailable, using approximate rate"
      };
    }
  }

  private async fetchFromMultipleSources(): Promise<number> {
    // Try exchangerate-api.com (free tier: 1500 requests/month)
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        if (data.rates && data.rates.ZAR) {
          return data.rates.ZAR;
        }
      }
    } catch (error) {
      console.log("exchangerate-api.com failed, trying next source");
    }

    // Try freeforexapi.com
    try {
      const response = await fetch('https://api.freeforexapi.com/api/live?pairs=USDZAR');
      if (response.ok) {
        const data = await response.json();
        if (data.rates && data.rates.USDZAR && data.rates.USDZAR.rate) {
          return data.rates.USDZAR.rate;
        }
      }
    } catch (error) {
      console.log("freeforexapi.com failed, trying next source");
    }

    // Try currencylayer.com (requires API key but has free tier)
    const currencyLayerKey = process.env.CURRENCY_LAYER_API_KEY;
    if (currencyLayerKey) {
      try {
        const response = await fetch(`https://api.currencylayer.com/live?access_key=${currencyLayerKey}&currencies=ZAR&source=USD&format=1`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.quotes && data.quotes.USDZAR) {
            return data.quotes.USDZAR;
          }
        }
      } catch (error) {
        console.log("currencylayer.com failed");
      }
    }

    throw new Error("All exchange rate sources failed");
  }

  convertUSDToZAR(usdAmount: number, rate: number): number {
    return Math.round(usdAmount * rate);
  }

  formatZARCurrency(zarAmount: number): string {
    return `R ${zarAmount.toLocaleString()}`;
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();