// Comprehensive South African customs tariff database based on SARS tariff book
export interface TradeAgreementRate {
  country: string;
  agreementName: string;
  dutyRate: number;
  preferential: boolean;
  description: string;
}

export interface CustomsTariff {
  hsCode: string;
  description: string;
  dutyRate: number; // Standard MFN rate
  additionalFees: number;
  vatRate: number;
  category: string;
  restrictions?: string[];
  exemptions?: string[];
  explanation: string;
  relatedCodes?: string[];
  examples: string[];
  searchScore?: number;
  tradeAgreementRates?: TradeAgreementRate[]; // Preferential rates by country/agreement
}

export class CustomsDatabase {
  private tariffs: Map<string, CustomsTariff> = new Map();
  private tradeAgreements: Map<string, string[]> = new Map(); // Country -> Agreement names

  constructor() {
    this.initializeTradeAgreements();
    this.initializeTariffs();
  }

  private initializeTradeAgreements() {
    // SACU (Southern African Customs Union) - Zero duties
    this.tradeAgreements.set("SACU", ["Botswana", "Lesotho", "Namibia", "Eswatini"]);
    
    // SADC (Southern African Development Community) - Reduced duties
    this.tradeAgreements.set("SADC", ["Angola", "Democratic Republic of Congo", "Madagascar", "Malawi", "Mauritius", "Mozambique", "Seychelles", "Tanzania", "Zambia", "Zimbabwe"]);
    
    // AGOA (African Growth and Opportunity Act) - US preferential access
    this.tradeAgreements.set("AGOA", ["USA"]);
    
    // EPA (Economic Partnership Agreement) - EU preferential access
    this.tradeAgreements.set("EPA", ["Germany", "France", "Netherlands", "Belgium", "Spain", "Italy", "United Kingdom", "Austria", "Portugal", "Greece", "Ireland", "Denmark", "Sweden", "Finland", "Luxembourg"]);
    
    // MERCOSUR - Limited preferential access
    this.tradeAgreements.set("MERCOSUR", ["Brazil", "Argentina", "Uruguay", "Paraguay"]);
    
    // India Trade Agreement
    this.tradeAgreements.set("INDIA_PREFERENTIAL", ["India"]);
  }

  private initializeTariffs() {
    const tariffData: CustomsTariff[] = [
      {
        hsCode: "8471.30",
        description: "Portable automatic data processing machines, weighing not more than 10 kg",
        dutyRate: 0.00, // Standard MFN rate
        additionalFees: 1500,
        vatRate: 0.15,
        category: "Electronics",
        restrictions: ["ICASA certificate required for radio equipment"],
        explanation: "Laptops and portable computers are duty-free under most trade agreements to promote digital access.",
        examples: ["Laptops", "Notebooks", "Tablets with keyboards", "Portable computers", "MacBooks", "Chromebooks", "Ultrabooks"],
        relatedCodes: ["8471.41", "8471.49"],
        tradeAgreementRates: [
          { country: "China", agreementName: "Standard MFN", dutyRate: 0.00, preferential: false, description: "Duty-free for WTO members" },
          { country: "USA", agreementName: "AGOA", dutyRate: 0.00, preferential: true, description: "Duty-free under AGOA" },
          { country: "Germany", agreementName: "EPA", dutyRate: 0.00, preferential: true, description: "Duty-free under EU-SADC EPA" },
          { country: "India", agreementName: "India Preferential", dutyRate: 0.00, preferential: true, description: "Duty-free under bilateral agreement" }
        ]
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
        dutyRate: 0.40, // Standard MFN rate
        additionalFees: 800,
        vatRate: 0.15,
        category: "Textiles & Clothing",
        explanation: "Standard rate 40% to protect local textile industry. Significantly reduced under trade agreements.",
        examples: ["Cotton jeans", "Chino pants", "Cotton shorts", "Work trousers"],
        relatedCodes: ["6203.41", "6203.43", "6203.49"],
        tradeAgreementRates: [
          { country: "China", agreementName: "Standard MFN", dutyRate: 0.40, preferential: false, description: "Standard tariff rate" },
          { country: "USA", agreementName: "AGOA", dutyRate: 0.00, preferential: true, description: "Duty-free under AGOA for qualifying products" },
          { country: "Germany", agreementName: "EPA", dutyRate: 0.20, preferential: true, description: "50% reduction under EU-SADC EPA" },
          { country: "Botswana", agreementName: "SACU", dutyRate: 0.00, preferential: true, description: "Duty-free within SACU" },
          { country: "Mauritius", agreementName: "SADC", dutyRate: 0.25, preferential: true, description: "Reduced rate under SADC" }
        ]
      },
      {
        hsCode: "8703.23",
        description: "Motor cars with spark-ignition engine, 1500-3000cc",
        dutyRate: 0.25, // Standard MFN rate
        additionalFees: 15000,
        vatRate: 0.15,
        category: "Automotive",
        restrictions: ["Homologation certificate", "Emissions certificate", "Safety compliance"],
        explanation: "25% standard duty to support local automotive manufacturing. Reduced rates under trade agreements.",
        examples: ["Sedans 1.6-2.5L", "Hatchbacks 1.5-3.0L", "Small SUVs"],
        relatedCodes: ["8703.21", "8703.22", "8703.24"],
        tradeAgreementRates: [
          { country: "Germany", agreementName: "EPA", dutyRate: 0.18, preferential: true, description: "Reduced rate under EU-SADC EPA" },
          { country: "Japan", agreementName: "Standard MFN", dutyRate: 0.25, preferential: false, description: "Standard tariff rate" },
          { country: "USA", agreementName: "Standard MFN", dutyRate: 0.25, preferential: false, description: "No preferential agreement for vehicles" },
          { country: "Brazil", agreementName: "MERCOSUR", dutyRate: 0.20, preferential: true, description: "Limited reduction under MERCOSUR" }
        ]
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
      },
      // Food & Agricultural Products
      {
        hsCode: "1003.90",
        description: "Barley, other than seed",
        dutyRate: 0.00,
        additionalFees: 500,
        vatRate: 0.00,
        category: "Agricultural Products",
        exemptions: ["VAT exempt as basic foodstuff"],
        explanation: "Agricultural products duty-free to support food security and livestock industry.",
        examples: ["Feed barley", "Malting barley", "Animal feed", "Bird seed", "Millet"]
      },
      {
        hsCode: "0207.14",
        description: "Cuts and offal of fowls, frozen",
        dutyRate: 0.37,
        additionalFees: 2500,
        vatRate: 0.00,
        category: "Food Products",
        exemptions: ["VAT exempt as basic foodstuff"],
        explanation: "High duty (37%) to protect local poultry industry and food security.",
        examples: ["Frozen chicken", "Chicken pieces", "Poultry meat", "Chicken portions"]
      },
      {
        hsCode: "0201.30",
        description: "Boneless meat of bovine animals, fresh or chilled",
        dutyRate: 0.40,
        additionalFees: 3000,
        vatRate: 0.00,
        category: "Food Products",
        exemptions: ["VAT exempt as basic foodstuff"],
        explanation: "High duty (40%) to protect local beef industry and ensure food security.",
        examples: ["Beef steaks", "Beef cuts", "Fresh beef", "Boneless beef"]
      },
      // Textiles & Clothing (expanded)
      {
        hsCode: "6109.10",
        description: "T-shirts, singlets and other vests, knitted, of cotton",
        dutyRate: 0.45,
        additionalFees: 600,
        vatRate: 0.15,
        category: "Textiles & Clothing",
        explanation: "Very high duty (45%) to protect local textile manufacturing and employment.",
        examples: ["T-shirts", "Cotton shirts", "Tank tops", "Vests", "Undershirts"]
      },
      {
        hsCode: "6403.99",
        description: "Other footwear with outer soles of rubber or plastics",
        dutyRate: 0.30,
        additionalFees: 800,
        vatRate: 0.15,
        category: "Footwear",
        explanation: "30% duty to protect local footwear manufacturing and jobs.",
        examples: ["Sneakers", "Running shoes", "Casual shoes", "Sports shoes", "Trainers"]
      },
      // Electronics (expanded)
      {
        hsCode: "8507.60",
        description: "Lithium-ion accumulators",
        dutyRate: 0.00,
        additionalFees: 1500,
        vatRate: 0.15,
        category: "Electronics",
        restrictions: ["Battery safety certificate", "ICASA approval for devices"],
        explanation: "Batteries duty-free to support renewable energy and technology adoption.",
        examples: ["Lithium batteries", "Phone batteries", "Laptop batteries", "Power banks"]
      },
      {
        hsCode: "9018.39",
        description: "Other syringes, needles, catheters and similar instruments",
        dutyRate: 0.00,
        additionalFees: 2000,
        vatRate: 0.00,
        category: "Medical Equipment",
        exemptions: ["VAT exempt as medical device"],
        explanation: "Medical equipment duty and VAT free to ensure healthcare access.",
        examples: ["Medical syringes", "Needles", "Medical instruments", "Healthcare equipment"]
      },
      // Industrial & Machinery
      {
        hsCode: "8479.89",
        description: "Other machines and mechanical appliances",
        dutyRate: 0.00,
        additionalFees: 5000,
        vatRate: 0.15,
        category: "Industrial Machinery",
        explanation: "Industrial machinery duty-free to support manufacturing competitiveness.",
        examples: ["Manufacturing equipment", "Industrial machines", "Processing equipment"]
      },
      // Cosmetics & Personal Care
      {
        hsCode: "3304.99",
        description: "Other beauty or make-up preparations",
        dutyRate: 0.20,
        additionalFees: 1200,
        vatRate: 0.15,
        category: "Cosmetics",
        explanation: "20% duty on luxury cosmetic items while allowing basic personal care access.",
        examples: ["Makeup", "Cosmetics", "Beauty products", "Foundation", "Lipstick"]
      },
      // Building Materials
      {
        hsCode: "6810.99",
        description: "Other articles of cement, concrete or artificial stone",
        dutyRate: 0.10,
        additionalFees: 2000,
        vatRate: 0.15,
        category: "Building Materials",
        explanation: "Low duty to support construction industry while protecting local cement production.",
        examples: ["Concrete blocks", "Cement products", "Building stones", "Construction materials"]
      },
      // Toys & Games
      {
        hsCode: "9503.00",
        description: "Tricycles, scooters, pedal cars and similar toys",
        dutyRate: 0.20,
        additionalFees: 800,
        vatRate: 0.15,
        category: "Toys & Recreation",
        explanation: "Moderate duty on toys to balance child access with local manufacturing protection.",
        examples: ["Toys", "Children's toys", "Bicycles", "Scooters", "Pedal cars"]
      },
      // Furniture
      {
        hsCode: "9401.80",
        description: "Other seats",
        dutyRate: 0.20,
        additionalFees: 1500,
        vatRate: 0.15,
        category: "Furniture",
        explanation: "20% duty to protect local furniture industry while allowing consumer choice.",
        examples: ["Chairs", "Office chairs", "Dining chairs", "Stools", "Seating"]
      },
      // Chemicals & Raw Materials
      {
        hsCode: "3901.10",
        description: "Polyethylene having a specific gravity of less than 0.94",
        dutyRate: 0.05,
        additionalFees: 2500,
        vatRate: 0.15,
        category: "Plastics & Chemicals",
        explanation: "Low duty on plastic raw materials to support downstream manufacturing.",
        examples: ["Plastic pellets", "Polyethylene", "Raw plastics", "Industrial plastics"]
      },
      // Paper & Packaging
      {
        hsCode: "4819.20",
        description: "Folding cartons, boxes and cases, of non-corrugated paper",
        dutyRate: 0.15,
        additionalFees: 800,
        vatRate: 0.15,
        category: "Paper & Packaging",
        explanation: "Moderate duty to balance packaging industry protection with cost efficiency.",
        examples: ["Cardboard boxes", "Packaging boxes", "Paper containers", "Gift boxes"]
      },
      // Sports & Recreation
      {
        hsCode: "9506.31",
        description: "Golf clubs, complete",
        dutyRate: 0.20,
        additionalFees: 600,
        vatRate: 0.15,
        category: "Sports Equipment",
        explanation: "20% duty on sports equipment as luxury/recreational items.",
        examples: ["Golf clubs", "Sports equipment", "Golf gear", "Athletic equipment"]
      },
      // Musical Instruments
      {
        hsCode: "9202.90",
        description: "Other string musical instruments",
        dutyRate: 0.20,
        additionalFees: 1000,
        vatRate: 0.15,
        category: "Musical Instruments",
        explanation: "20% duty on musical instruments while supporting cultural activities.",
        examples: ["Guitars", "Violins", "String instruments", "Musical instruments"]
      },
      // Jewelry & Precious Items
      {
        hsCode: "7113.11",
        description: "Articles of jewelry of silver",
        dutyRate: 0.20,
        additionalFees: 3000,
        vatRate: 0.15,
        category: "Jewelry",
        explanation: "20% duty on jewelry with high processing fees due to precious metal controls.",
        examples: ["Silver jewelry", "Necklaces", "Rings", "Bracelets", "Jewelry"]
      },
      // Pets & Animals (live animals/products)
      {
        hsCode: "0106.39",
        description: "Other live birds",
        dutyRate: 0.00,
        additionalFees: 5000,
        vatRate: 0.15,
        category: "Live Animals",
        restrictions: ["Veterinary permit", "CITES permit", "Quarantine certificate"],
        explanation: "Live birds duty-free but extensive permits required for disease control.",
        examples: ["Pet birds", "Parrots", "Canaries", "Exotic birds"]
      },
      // Books & Educational
      {
        hsCode: "4901.99",
        description: "Other printed books, brochures, leaflets",
        dutyRate: 0.00,
        additionalFees: 200,
        vatRate: 0.00,
        category: "Books & Education",
        exemptions: ["VAT exempt for educational purposes"],
        explanation: "Books duty and VAT free to promote education and literacy.",
        examples: ["Books", "Textbooks", "Educational materials", "Printed books"]
      },
      // Art & Collectibles
      {
        hsCode: "9701.10",
        description: "Paintings, drawings and pastels executed entirely by hand",
        dutyRate: 0.00,
        additionalFees: 1500,
        vatRate: 0.15,
        category: "Art & Culture",
        explanation: "Art duty-free to support cultural exchange and artistic expression.",
        examples: ["Paintings", "Artwork", "Art pieces", "Handmade art"]
      },
      // Garden & Outdoor
      {
        hsCode: "8201.30",
        description: "Mattocks, picks, hoes and rakes",
        dutyRate: 0.15,
        additionalFees: 400,
        vatRate: 0.15,
        category: "Garden Tools",
        explanation: "Moderate duty on garden tools to protect local tool manufacturing.",
        examples: ["Garden tools", "Hoes", "Rakes", "Picks", "Farming tools"]
      },
      // Baby & Children Products
      {
        hsCode: "9404.30",
        description: "Sleeping bags",
        dutyRate: 0.20,
        additionalFees: 600,
        vatRate: 0.15,
        category: "Baby Products",
        explanation: "20% duty on specialized bedding and children's products.",
        examples: ["Baby sleeping bags", "Children's bedding", "Sleeping bags"]
      },
      // Office & Stationery
      {
        hsCode: "9608.10",
        description: "Ball point pens",
        dutyRate: 0.20,
        additionalFees: 300,
        vatRate: 0.15,
        category: "Stationery",
        explanation: "20% duty on office supplies to protect local stationery industry.",
        examples: ["Pens", "Ballpoint pens", "Writing instruments", "Office supplies"]
      },
      // Tools & Hardware
      {
        hsCode: "8205.59",
        description: "Other hand tools",
        dutyRate: 0.15,
        additionalFees: 800,
        vatRate: 0.15,
        category: "Tools & Hardware",
        explanation: "Moderate duty on hand tools to support local tool manufacturing.",
        examples: ["Hand tools", "Screwdrivers", "Wrenches", "Tool sets", "Hardware"]
      },
      // Kitchen & Household
      {
        hsCode: "7323.93",
        description: "Table, kitchen or other household articles, of stainless steel",
        dutyRate: 0.20,
        additionalFees: 500,
        vatRate: 0.15,
        category: "Kitchenware",
        explanation: "20% duty on kitchenware to protect domestic manufacturing.",
        examples: ["Kitchen utensils", "Cookware", "Stainless steel items", "Household items"]
      },
      // Cameras & Photography
      {
        hsCode: "9006.30",
        description: "Cameras specially designed for underwater use",
        dutyRate: 0.00,
        additionalFees: 1200,
        vatRate: 0.15,
        category: "Photography",
        explanation: "Cameras duty-free to support tourism and professional photography.",
        examples: ["Cameras", "Photography equipment", "Underwater cameras", "Digital cameras"]
      },
      // Fishing & Marine
      {
        hsCode: "9507.30",
        description: "Fishing reels",
        dutyRate: 0.20,
        additionalFees: 400,
        vatRate: 0.15,
        category: "Fishing Equipment",
        explanation: "20% duty on recreational fishing equipment.",
        examples: ["Fishing reels", "Fishing equipment", "Angling gear", "Fishing tackle"]
      },
      // Cleaning & Maintenance
      {
        hsCode: "3402.20",
        description: "Washing preparations put up for retail sale",
        dutyRate: 0.15,
        additionalFees: 600,
        vatRate: 0.15,
        category: "Cleaning Products",
        explanation: "Moderate duty on cleaning products to protect local chemical industry.",
        examples: ["Detergent", "Washing powder", "Cleaning products", "Laundry soap"]
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

    // Agricultural products keywords
    keywordMap.set("1003.90", [
      "barley", "grain", "feed", "animal feed", "bird seed", "birdseed", "millet", 
      "seeds", "pet food", "livestock feed", "poultry feed", "grain feed"
    ]);

    // Food products keywords
    keywordMap.set("0207.14", [
      "chicken", "poultry", "meat", "frozen chicken", "chicken pieces", "fowl",
      "chicken portions", "poultry meat", "frozen meat"
    ]);

    keywordMap.set("0201.30", [
      "beef", "meat", "steak", "beef cuts", "fresh beef", "bovine", "cattle meat",
      "beef steaks", "red meat", "boneless beef"
    ]);

    // Clothing expanded keywords
    keywordMap.set("6109.10", [
      "t-shirt", "tshirt", "shirt", "cotton shirt", "tank top", "vest", "singlet",
      "undershirt", "casual shirt", "tee", "top"
    ]);

    keywordMap.set("6403.99", [
      "sneakers", "trainers", "running shoes", "sports shoes", "casual shoes",
      "athletic shoes", "tennis shoes", "gym shoes", "walking shoes"
    ]);

    // Electronics expanded keywords
    keywordMap.set("8507.60", [
      "battery", "batteries", "lithium battery", "rechargeable battery", "power bank",
      "phone battery", "laptop battery", "li-ion", "lithium ion", "accumulator"
    ]);

    // Medical equipment keywords
    keywordMap.set("9018.39", [
      "syringe", "needle", "medical equipment", "medical instruments", "catheter",
      "medical supplies", "healthcare equipment", "medical device"
    ]);

    // Industrial machinery keywords
    keywordMap.set("8479.89", [
      "machinery", "industrial equipment", "manufacturing equipment", "machine",
      "industrial machine", "processing equipment", "factory equipment"
    ]);

    // Cosmetics keywords
    keywordMap.set("3304.99", [
      "makeup", "cosmetics", "beauty", "foundation", "lipstick", "mascara",
      "beauty products", "make-up", "cosmetic products"
    ]);

    // Building materials keywords
    keywordMap.set("6810.99", [
      "concrete", "cement", "building materials", "construction materials",
      "concrete blocks", "cement products", "building stones"
    ]);

    // Toys keywords
    keywordMap.set("9503.00", [
      "toys", "toy", "children toys", "kids toys", "tricycle", "scooter",
      "pedal car", "bicycle", "ride-on toys"
    ]);

    // Furniture keywords
    keywordMap.set("9401.80", [
      "chair", "chairs", "seat", "seating", "office chair", "dining chair",
      "furniture", "stool", "office furniture"
    ]);

    // Plastics keywords
    keywordMap.set("3901.10", [
      "plastic", "plastics", "polyethylene", "plastic pellets", "raw plastic",
      "plastic materials", "industrial plastic", "polymer"
    ]);

    // Packaging keywords
    keywordMap.set("4819.20", [
      "box", "boxes", "cardboard", "packaging", "carton", "container",
      "cardboard box", "shipping box", "gift box", "paper box"
    ]);

    // Sports equipment keywords
    keywordMap.set("9506.31", [
      "golf", "golf clubs", "sports equipment", "athletic equipment", "sports gear",
      "golf gear", "sporting goods", "recreation equipment"
    ]);

    // Musical instruments keywords
    keywordMap.set("9202.90", [
      "guitar", "violin", "musical instrument", "string instrument", "music",
      "guitars", "violins", "instruments", "musical equipment"
    ]);

    // Jewelry keywords
    keywordMap.set("7113.11", [
      "jewelry", "jewellery", "silver", "necklace", "ring", "bracelet",
      "silver jewelry", "precious items", "accessories"
    ]);

    // Live animals keywords
    keywordMap.set("0106.39", [
      "bird", "birds", "pet bird", "parrot", "canary", "exotic bird",
      "live animals", "pets", "live birds"
    ]);

    // Books keywords
    keywordMap.set("4901.99", [
      "book", "books", "textbook", "educational material", "printed book",
      "reading material", "literature", "educational books"
    ]);

    // Art keywords
    keywordMap.set("9701.10", [
      "art", "painting", "artwork", "art piece", "handmade art",
      "paintings", "drawings", "artistic work"
    ]);

    // Garden tools keywords
    keywordMap.set("8201.30", [
      "garden tools", "hoe", "rake", "pick", "farming tools",
      "gardening equipment", "agricultural tools", "hand tools"
    ]);

    // Baby products keywords
    keywordMap.set("9404.30", [
      "sleeping bag", "baby sleeping bag", "children's bedding", "baby products",
      "infant products", "children products", "baby items"
    ]);

    // Stationery keywords
    keywordMap.set("9608.10", [
      "pen", "pens", "ballpoint pen", "writing instruments", "office supplies",
      "stationery", "writing pens", "ball pen"
    ]);

    // Tools keywords
    keywordMap.set("8205.59", [
      "hand tools", "screwdriver", "wrench", "tool set", "hardware",
      "tools", "manual tools", "workshop tools"
    ]);

    // Kitchenware keywords
    keywordMap.set("7323.93", [
      "kitchen utensils", "cookware", "stainless steel", "household items",
      "kitchen items", "cooking utensils", "kitchen equipment"
    ]);

    // Photography keywords
    keywordMap.set("9006.30", [
      "camera", "cameras", "photography equipment", "digital camera",
      "underwater camera", "photo equipment", "photographic equipment"
    ]);

    // Fishing keywords
    keywordMap.set("9507.30", [
      "fishing reel", "fishing equipment", "angling gear", "fishing tackle",
      "fishing gear", "fishing supplies", "fishing rod accessories"
    ]);

    // Cleaning products keywords
    keywordMap.set("3402.20", [
      "detergent", "washing powder", "cleaning products", "laundry soap",
      "cleaning supplies", "washing detergent", "household cleaners"
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

    return Array.from(new Set(suggestions)).slice(0, 8);
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

  // Get applicable duty rate for specific country of origin
  public getDutyRateByCountry(hsCode: string, originCountry: string): { dutyRate: number; agreementName: string; preferential: boolean; description: string } {
    const tariff = this.tariffs.get(hsCode);
    if (!tariff) {
      return { dutyRate: 0.10, agreementName: "Standard Rate", preferential: false, description: "Default 10% rate for unknown HS codes" };
    }

    // Check if country has preferential rates
    if (tariff.tradeAgreementRates) {
      const countryRate = tariff.tradeAgreementRates.find(rate => 
        rate.country.toLowerCase() === originCountry.toLowerCase()
      );
      
      if (countryRate) {
        return {
          dutyRate: countryRate.dutyRate,
          agreementName: countryRate.agreementName,
          preferential: countryRate.preferential,
          description: countryRate.description
        };
      }
    }

    // Return standard MFN rate if no preferential rate found
    return {
      dutyRate: tariff.dutyRate,
      agreementName: "Standard MFN",
      preferential: false,
      description: "Most Favored Nation standard tariff rate"
    };
  }

  // Calculate customs cost with country-specific rates
  calculateDetailedCustomsCostByCountry(hsCode: string, fobValue: number, originCountry: string, isSacuCountry: boolean = false) {
    const tariff = this.getByHSCode(hsCode);
    if (!tariff) {
      return {
        error: "HS Code not found",
        hsCode,
        fobValue,
        originCountry
      };
    }

    const countryRate = this.getDutyRateByCountry(hsCode, originCountry);
    // SARS: Apply 10% markup to FOB value for non-SACU countries before calculating duty
    const markupAmount = isSacuCountry ? 0 : fobValue * 0.10;
    const atvValue = fobValue + markupAmount;
    const customsDuty = atvValue * countryRate.dutyRate;
    const dutiableAmount = atvValue + customsDuty;
    const vat = tariff.vatRate > 0 ? dutiableAmount * tariff.vatRate : 0;
    const additionalFees = tariff.additionalFees;
    const totalCustomsCost = customsDuty + vat + additionalFees;

    return {
      tariff,
      originCountry,
      tradeAgreement: {
        name: countryRate.agreementName,
        preferential: countryRate.preferential,
        description: countryRate.description,
        dutyRate: countryRate.dutyRate
      },
      calculations: {
        fobValue,
        markupAmount,
        atvValue,
        customsDuty,
        dutiableAmount,
        vat,
        additionalFees,
        totalCustomsCost
      },
      breakdown: [
        {
          item: "FOB Value",
          amount: fobValue,
          description: "Free on Board value (cargo value only)"
        },
        {
          item: "Markup",
          amount: markupAmount,
          description: markupAmount > 0 ? "10% markup for non-SACU countries per SARS" : "No markup (SACU country)"
        },
        {
          item: "ATV (Added Tax Value)",
          amount: atvValue,
          description: "Base for duty and VAT calculations"
        },
        {
          item: "Customs Duty",
          amount: customsDuty,
          description: `${(countryRate.dutyRate * 100).toFixed(1)}% of ATV (${countryRate.agreementName})`
        },
        {
          item: "VAT",
          amount: vat,
          description: tariff.vatRate > 0
            ? `${(tariff.vatRate * 100).toFixed(0)}% of (ATV + Duty) per SARS`
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

  // Get all available trade agreement rates for an HS code
  public getTradeAgreementRates(hsCode: string): TradeAgreementRate[] {
    const tariff = this.tariffs.get(hsCode);
    return tariff?.tradeAgreementRates || [];
  }
}

export const customsDatabase = new CustomsDatabase();