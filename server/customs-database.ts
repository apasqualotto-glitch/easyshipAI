// Comprehensive South African customs tariff database based on SARS tariff book
export interface CustomsTariff {
  hsCode: string;
  description: string;
  dutyRate: number;
  additionalFees: number;
  vatRate: number;
  category: string;
  restrictions?: string[];
  exemptions?: string[];
  explanation: string;
  relatedCodes?: string[];
  examples: string[];
  searchScore?: number;
}

export class CustomsDatabase {
  private tariffs: Map<string, CustomsTariff> = new Map();

  constructor() {
    this.initializeTariffs();
  }

  private initializeTariffs() {
    const tariffData: CustomsTariff[] = [
      {
        hsCode: "8471.30",
        description: "Portable automatic data processing machines, weighing not more than 10 kg",
        dutyRate: 0.00,
        additionalFees: 1500,
        vatRate: 0.15,
        category: "Electronics",
        restrictions: ["ICASA certificate required for radio equipment"],
        explanation: "Laptops and portable computers are duty-free under SACU agreement to promote digital access. VAT still applies on CIF value.",
        examples: ["Laptops", "Notebooks", "Tablets with keyboards", "Portable computers", "MacBooks", "Chromebooks", "Ultrabooks"],
        relatedCodes: ["8471.41", "8471.49"]
      },
      {
        hsCode: "8517.12",
        description: "Telephones for cellular networks or for other wireless networks",
        dutyRate: 0.00,
        additionalFees: 2000,
        vatRate: 0.15,
        category: "Electronics",
        restrictions: ["ICASA type approval certificate", "SABS safety certificate"],
        explanation: "Mobile phones are duty-free but require telecommunications regulatory approval. Additional fees for certification processing.",
        examples: ["Smartphones", "Mobile phones", "Cell phones", "iPhones", "Android phones", "Feature phones", "Satellite phones"],
        relatedCodes: ["8517.11", "8517.13"]
      },
      {
        hsCode: "6203.42",
        description: "Men's or boys' trousers, breeches and shorts, of cotton",
        dutyRate: 0.40,
        additionalFees: 800,
        vatRate: 0.15,
        category: "Textiles & Clothing",
        explanation: "High duty rate (40%) to protect local textile industry. Part of AGOA/SADC trade protection measures for clothing sector.",
        examples: ["Cotton jeans", "Chino pants", "Cotton shorts", "Work trousers"],
        relatedCodes: ["6203.41", "6203.43", "6203.49"]
      },
      {
        hsCode: "8703.23",
        description: "Motor cars with spark-ignition engine, 1500-3000cc",
        dutyRate: 0.25,
        additionalFees: 15000,
        vatRate: 0.15,
        category: "Automotive",
        restrictions: ["Homologation certificate", "Emissions certificate", "Safety compliance"],
        explanation: "25% duty to support local automotive manufacturing. Additional fees for compliance testing and certification.",
        examples: ["Sedans 1.6-2.5L", "Hatchbacks 1.5-3.0L", "Small SUVs"],
        relatedCodes: ["8703.21", "8703.22", "8703.24"]
      },
      {
        hsCode: "8414.10",
        description: "Vacuum pumps",
        dutyRate: 0.00,
        additionalFees: 2500,
        vatRate: 0.15,
        category: "Machinery",
        explanation: "Duty-free as industrial machinery to support manufacturing competitiveness. Classified as capital equipment.",
        examples: ["Industrial vacuum pumps", "Laboratory vacuum systems", "Manufacturing equipment"],
        relatedCodes: ["8414.20", "8414.30"]
      },
      {
        hsCode: "2204.21",
        description: "Wine of fresh grapes in containers holding 2 litres or less",
        dutyRate: 0.00,
        additionalFees: 1200,
        vatRate: 0.15,
        category: "Food Products",
        restrictions: ["Liquor license", "Health certificate", "Age restriction compliance"],
        explanation: "Wine imports duty-free under various trade agreements. Additional fees for liquor licensing and health inspection.",
        examples: ["Bottled wine", "Champagne", "Sparkling wine"],
        relatedCodes: ["2204.10", "2204.22", "2204.29"]
      },
      {
        hsCode: "3004.90",
        description: "Other medicaments for therapeutic or prophylactic uses",
        dutyRate: 0.00,
        additionalFees: 3500,
        vatRate: 0.00,
        category: "Pharmaceuticals",
        restrictions: ["MCC registration", "Good Manufacturing Practice certificate"],
        exemptions: ["VAT exempt if registered medicine"],
        explanation: "Medicines are duty and VAT free to ensure healthcare access. Requires Medicines Control Council approval.",
        examples: ["Prescription medicines", "Vaccines", "Medical treatments"],
        relatedCodes: ["3004.10", "3004.20", "3004.50"]
      },
      {
        hsCode: "8528.72",
        description: "Reception apparatus for television, colour, with LCD technology",
        dutyRate: 0.00,
        additionalFees: 2200,
        vatRate: 0.15,
        category: "Electronics",
        explanation: "TVs are duty-free to promote digital migration and consumer access to technology.",
        examples: ["LCD TVs", "LED TVs", "Smart TVs", "OLED TVs", "QLED TVs", "4K TVs", "Television sets"],
        relatedCodes: ["8528.71", "8528.73"]
      },
      {
        hsCode: "6402.91",
        description: "Footwear with uppers of leather",
        dutyRate: 0.30,
        additionalFees: 600,
        vatRate: 0.15,
        category: "Footwear",
        explanation: "30% duty to protect local footwear industry and employment. Part of downstream beneficiation strategy.",
        examples: ["Leather shoes", "Boots", "Dress shoes"],
        relatedCodes: ["6402.92", "6402.99"]
      },
      {
        hsCode: "7326.90",
        description: "Other articles of iron or steel",
        dutyRate: 0.15,
        additionalFees: 1800,
        vatRate: 0.15,
        category: "Steel Products",
        explanation: "Moderate duty to balance protection of steel industry with manufacturing input costs.",
        examples: ["Steel brackets", "Metal fittings", "Industrial components"],
        relatedCodes: ["7326.11", "7326.19", "7326.20"]
      }
    ];

    tariffData.forEach(tariff => {
      this.tariffs.set(tariff.hsCode, tariff);
    });
  }

  searchByDescription(searchTerm: string): CustomsTariff[] {
    const results: CustomsTariff[] = [];
    const lowerSearch = searchTerm.toLowerCase();

    // Create search keywords map for better matching
    const searchKeywords = this.createSearchKeywords();

    Array.from(this.tariffs.values()).forEach(tariff => {
      let score = 0;

      // Direct matches in description, examples, or category
      if (tariff.description.toLowerCase().includes(lowerSearch)) score += 10;
      if (tariff.examples.some((example: string) => example.toLowerCase().includes(lowerSearch))) score += 8;
      if (tariff.category.toLowerCase().includes(lowerSearch)) score += 6;

      // Check against expanded keywords
      const tariffKeywords = searchKeywords.get(tariff.hsCode) || [];
      if (tariffKeywords.some(keyword => keyword.includes(lowerSearch) || lowerSearch.includes(keyword))) {
        score += 5;
      }

      // Partial word matching for better suggestions
      const searchWords = lowerSearch.split(' ');
      searchWords.forEach(word => {
        if (word.length > 2) {
          if (tariff.description.toLowerCase().includes(word)) score += 2;
          if (tariff.examples.some((example: string) => example.toLowerCase().includes(word))) score += 2;
          if (tariffKeywords.some(keyword => keyword.includes(word))) score += 1;
        }
      });

      if (score > 0) {
        results.push({ ...tariff, searchScore: score });
      }
    });

    return results.sort((a: any, b: any) => (b.searchScore || 0) - (a.searchScore || 0));
  }

  private createSearchKeywords(): Map<string, string[]> {
    const keywordMap = new Map<string, string[]>();

    // Electronics keywords
    keywordMap.set("8471.30", [
      "laptop", "notebook", "computer", "pc", "portable computer", "macbook", "chromebook", 
      "tablet", "ipad", "surface", "ultrabook", "netbook", "workstation"
    ]);

    keywordMap.set("8517.12", [
      "phone", "smartphone", "mobile", "cellphone", "cell phone", "iphone", "android", 
      "galaxy", "pixel", "nokia", "huawei", "xiaomi", "oppo", "vivo", "mobile phone",
      "cellular phone", "satellite phone"
    ]);

    keywordMap.set("8528.72", [
      "tv", "television", "smart tv", "lcd tv", "led tv", "oled", "qled", "monitor", 
      "display", "screen", "samsung tv", "lg tv", "sony tv"
    ]);

    // Clothing keywords  
    keywordMap.set("6203.42", [
      "pants", "trousers", "jeans", "shorts", "chinos", "cargo pants", "dress pants",
      "work pants", "cotton pants", "denim", "khakis", "slacks", "bermuda shorts"
    ]);

    // Automotive keywords
    keywordMap.set("8703.23", [
      "car", "automobile", "sedan", "hatchback", "vehicle", "toyota", "honda", "nissan",
      "ford", "volkswagen", "bmw", "mercedes", "audi", "hyundai", "kia", "mazda"
    ]);

    // Machinery keywords
    keywordMap.set("8414.10", [
      "pump", "vacuum pump", "industrial pump", "vacuum system", "suction pump",
      "laboratory equipment", "manufacturing equipment"
    ]);

    // Food/Beverage keywords
    keywordMap.set("2204.21", [
      "wine", "red wine", "white wine", "champagne", "sparkling wine", "alcohol",
      "beverage", "bottle", "vintage", "cabernet", "chardonnay", "merlot"
    ]);

    // Pharmaceutical keywords
    keywordMap.set("3004.90", [
      "medicine", "medication", "drugs", "pharmaceutical", "pills", "tablets",
      "capsules", "prescription", "treatment", "therapy", "vaccine", "antibiotics"
    ]);

    // Footwear keywords
    keywordMap.set("6402.91", [
      "shoes", "boots", "footwear", "sneakers", "dress shoes", "leather shoes",
      "work boots", "safety boots", "hiking boots", "running shoes", "sandals"
    ]);

    // Steel products keywords
    keywordMap.set("7326.90", [
      "steel", "metal", "iron", "brackets", "fittings", "hardware", "fasteners",
      "bolts", "screws", "industrial parts", "metal components", "steel parts"
    ]);

    return keywordMap;
  }

  getByHSCode(hsCode: string): CustomsTariff | undefined {
    return this.tariffs.get(hsCode);
  }

  getByCategory(category: string): CustomsTariff[] {
    return Array.from(this.tariffs.values())
      .filter(tariff => tariff.category === category)
      .sort((a, b) => a.dutyRate - b.dutyRate);
  }

  getAllCategories(): string[] {
    const categories = new Set<string>();
    Array.from(this.tariffs.values()).forEach(tariff => {
      categories.add(tariff.category);
    });
    return Array.from(categories).sort();
  }

  getSearchSuggestions(searchTerm: string): string[] {
    const suggestions: string[] = [];
    const lowerSearch = searchTerm.toLowerCase();
    
    if (lowerSearch.length < 2) return suggestions;

    const keywords = this.createSearchKeywords();
    const allKeywords = new Set<string>();
    
    // Collect all keywords
    keywords.forEach(keywordList => {
      keywordList.forEach(keyword => allKeywords.add(keyword));
    });

    // Add examples from tariffs
    Array.from(this.tariffs.values()).forEach(tariff => {
      tariff.examples.forEach(example => allKeywords.add(example.toLowerCase()));
    });

    // Find matching suggestions
    Array.from(allKeywords).forEach(keyword => {
      if (keyword.includes(lowerSearch) && keyword !== lowerSearch) {
        suggestions.push(keyword);
      }
    });

    // Add popular search terms based on categories
    if (lowerSearch.includes('phone') || lowerSearch.includes('cell')) {
      suggestions.push('smartphones', 'mobile phones', 'iphones', 'android phones');
    }
    if (lowerSearch.includes('computer') || lowerSearch.includes('pc')) {
      suggestions.push('laptops', 'notebooks', 'desktop computers', 'tablets');
    }
    if (lowerSearch.includes('car') || lowerSearch.includes('vehicle')) {
      suggestions.push('sedans', 'hatchbacks', 'suvs', 'motorcycles');
    }
    if (lowerSearch.includes('clothes') || lowerSearch.includes('wear')) {
      suggestions.push('pants', 'shirts', 'dresses', 'jackets', 'shoes');
    }

    return [...new Set(suggestions)].slice(0, 8);
  }

  calculateDetailedCustomsCost(hsCode: string, cifValue: number) {
    const tariff = this.getByHSCode(hsCode);
    if (!tariff) {
      return {
        error: "HS Code not found",
        hsCode,
        cifValue
      };
    }

    const customsDuty = cifValue * tariff.dutyRate;
    const dutiableAmount = cifValue + customsDuty;
    const vat = tariff.vatRate > 0 ? dutiableAmount * tariff.vatRate : 0;
    const additionalFees = tariff.additionalFees;
    const totalCustomsCost = customsDuty + vat + additionalFees;

    return {
      tariff,
      calculations: {
        cifValue,
        customsDuty,
        dutiableAmount,
        vat,
        additionalFees,
        totalCustomsCost
      },
      breakdown: [
        {
          item: "CIF Value",
          amount: cifValue,
          description: "Cost, Insurance, Freight value"
        },
        {
          item: "Customs Duty",
          amount: customsDuty,
          description: `${(tariff.dutyRate * 100).toFixed(1)}% of CIF value`
        },
        {
          item: "VAT",
          amount: vat,
          description: tariff.vatRate > 0 
            ? `${(tariff.vatRate * 100).toFixed(0)}% of (CIF + Duty)`
            : "VAT exempt"
        },
        {
          item: "Additional Fees",
          amount: additionalFees,
          description: "Processing, inspection, and certification fees"
        }
      ]
    };
  }
}

export const customsDatabase = new CustomsDatabase();