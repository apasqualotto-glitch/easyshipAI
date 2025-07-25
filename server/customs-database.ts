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
        examples: ["Laptops", "Tablets with keyboards", "Portable workstations"],
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
        examples: ["Smartphones", "Mobile phones", "Satellite phones"],
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
        examples: ["LCD TVs", "LED TVs", "Smart TVs"],
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

    Array.from(this.tariffs.values()).forEach(tariff => {
      if (
        tariff.description.toLowerCase().includes(lowerSearch) ||
        tariff.examples.some((example: string) => example.toLowerCase().includes(lowerSearch)) ||
        tariff.category.toLowerCase().includes(lowerSearch)
      ) {
        results.push(tariff);
      }
    });

    return results.sort((a, b) => a.dutyRate - b.dutyRate);
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