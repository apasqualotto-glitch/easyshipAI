/**
 * Exchange Rate Caching Service
 * Caches currency conversion rates to reduce API calls and improve performance
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl: number = 60 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Global cache manager
export const cacheManager = new CacheManager();

// Run cache cleanup every 5 minutes
setInterval(() => {
  const cleaned = cacheManager.cleanup();
  if (cleaned > 0 && process.env.DEBUG_CACHE) {
    console.log(`Cache cleanup: Removed ${cleaned} expired entries`);
  }
}, 5 * 60 * 1000);

/**
 * Exchange Rate Service with caching
 */
export class ExchangeRateService {
  private static readonly CACHE_KEY_PREFIX = "exchange_rate_";
  private static readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Get USD to ZAR exchange rate (with caching)
   * Tries multiple providers for reliability
   */
  static async getUSDtoZAR(): Promise<{
    rate: number;
    source: string;
    timestamp: string;
    cached: boolean;
  }> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}USD_ZAR`;

    // Check cache first
    const cachedRate = cacheManager.get<{
      rate: number;
      source: string;
      timestamp: string;
    }>(cacheKey);

    if (cachedRate) {
      return {
        ...cachedRate,
        cached: true,
      };
    }

    // Fetch from API if not cached
    const result = await this.fetchExchangeRate("USD", "ZAR");

    // Cache the result for 1 hour
    cacheManager.set(
      cacheKey,
      {
        rate: result.rate,
        source: result.source,
        timestamp: result.timestamp,
      },
      this.DEFAULT_TTL
    );

    return {
      ...result,
      cached: false,
    };
  }

  /**
   * Get exchange rate between any two currencies (with caching)
   */
  static async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<{
    rate: number;
    source: string;
    timestamp: string;
    cached: boolean;
  }> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${fromCurrency}_${toCurrency}`;

    // Check cache first
    const cachedRate = cacheManager.get<{
      rate: number;
      source: string;
      timestamp: string;
    }>(cacheKey);

    if (cachedRate) {
      return {
        ...cachedRate,
        cached: true,
      };
    }

    // Fetch from API if not cached
    const result = await this.fetchExchangeRate(fromCurrency, toCurrency);

    // Cache the result for 1 hour
    cacheManager.set(
      cacheKey,
      {
        rate: result.rate,
        source: result.source,
        timestamp: result.timestamp,
      },
      this.DEFAULT_TTL
    );

    return {
      ...result,
      cached: false,
    };
  }

  /**
   * Private: Fetch exchange rate from API with fallbacks
   */
  private static async fetchExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<{
    rate: number;
    source: string;
    timestamp: string;
  }> {
    // Try exchangerate-api.com first
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        const rate = data.rates?.[toCurrency];

        if (rate) {
          return {
            rate,
            source: "exchangerate-api.com",
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      if (process.env.DEBUG_CACHE) {
        console.log("Primary exchange API failed:", error);
      }
    }

    // Fallback: exchangerate.host (no API key required)
    try {
      const response = await fetch(
        `https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        const rate = data.rates?.[toCurrency];

        if (rate) {
          return {
            rate,
            source: "exchangerate.host",
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      if (process.env.DEBUG_CACHE) {
        console.log("Fallback exchange API failed:", error);
      }
    }

    // Final fallback: Use cached rate or hardcoded fallback
    console.warn(
      `All exchange rate APIs unavailable for ${fromCurrency}/${toCurrency}, using fallback`
    );

    // Hardcoded fallback rates (updated periodically)
    const fallbackRates: Record<string, Record<string, number>> = {
      USD: {
        ZAR: 18.5, // Current approximate rate
        EUR: 0.92,
        GBP: 0.79,
      },
      EUR: {
        USD: 1.09,
        ZAR: 20.1,
        GBP: 0.86,
      },
      GBP: {
        USD: 1.27,
        EUR: 1.16,
        ZAR: 23.4,
      },
    };

    const rate =
      fallbackRates[fromCurrency]?.[toCurrency] ||
      fallbackRates[toCurrency]?.[fromCurrency] ||
      1;

    return {
      rate: fallbackRates[fromCurrency]?.[toCurrency] || 18.2,
      source: "fallback",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear exchange rate cache
   * Useful for testing or manual cache invalidation
   */
  static clearCache(): void {
    const pattern = this.CACHE_KEY_PREFIX;
    const stats = cacheManager.getStats();

    stats.keys.forEach((key) => {
      if (key.startsWith(pattern)) {
        cacheManager.delete(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    cachedRates: number;
    keys: string[];
  } {
    const stats = cacheManager.getStats();
    const exchangeRateKeys = stats.keys.filter((k) =>
      k.startsWith(this.CACHE_KEY_PREFIX)
    );

    return {
      cachedRates: exchangeRateKeys.length,
      keys: exchangeRateKeys,
    };
  }
}

// Extend AbortSignal with timeout support (polyfill for older Node versions)
if (!AbortSignal.timeout) {
  (AbortSignal as any).timeout = function (ms: number) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}
