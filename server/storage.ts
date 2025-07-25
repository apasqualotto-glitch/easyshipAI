import { type ShippingQuote, type InsertShippingQuote, type Port, type Route, type Destination, type CargoType, type Incoterm } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Ports
  getPorts(): Promise<Port[]>;
  getOriginPorts(): Promise<Port[]>;
  getDestinationPorts(): Promise<Port[]>;
  
  // Routes
  getRoute(originPortId: string, destinationPortId: string): Promise<Route | undefined>;
  
  // Destinations
  getDestinations(): Promise<Destination[]>;
  getDestination(name: string): Promise<Destination | undefined>;
  
  // Cargo Types
  getCargoTypes(): Promise<CargoType[]>;
  getCargoType(name: string): Promise<CargoType | undefined>;
  
  // Incoterms
  getIncoterms(): Promise<Incoterm[]>;
  getIncoterm(code: string): Promise<Incoterm | undefined>;
  
  // Quotes
  createQuote(quote: InsertShippingQuote): Promise<ShippingQuote>;
  getQuote(id: string): Promise<ShippingQuote | undefined>;
}

export class MemStorage implements IStorage {
  private ports: Map<string, Port>;
  private routes: Map<string, Route>;
  private destinations: Map<string, Destination>;
  private cargoTypes: Map<string, CargoType>;
  private incoterms: Map<string, Incoterm>;
  private quotes: Map<string, ShippingQuote>;

  constructor() {
    this.ports = new Map();
    this.routes = new Map();
    this.destinations = new Map();
    this.cargoTypes = new Map();
    this.incoterms = new Map();
    this.quotes = new Map();
    
    this.initializeData();
  }

  private initializeData() {
    // Initialize ports - expanded popular origins for better coverage
    const portsData: Port[] = [
      // China - Major manufacturing hubs
      { id: "1", name: "Shanghai, China", code: "CNSHA", country: "China", type: "origin" },
      { id: "2", name: "Ningbo, China", code: "CNNGB", country: "China", type: "origin" },
      { id: "3", name: "Tianjin, China", code: "CNTXG", country: "China", type: "origin" },
      { id: "16", name: "Shenzhen, China", code: "CNSZX", country: "China", type: "origin" },
      { id: "17", name: "Qingdao, China", code: "CNQIN", country: "China", type: "origin" },
      { id: "18", name: "Guangzhou, China", code: "CNGZH", country: "China", type: "origin" },
      { id: "19", name: "Xiamen, China", code: "CNXMN", country: "China", type: "origin" },
      
      // Europe - Major trade hubs
      { id: "4", name: "Hamburg, Germany", code: "DEHAM", country: "Germany", type: "origin" },
      { id: "5", name: "Rotterdam, Netherlands", code: "NLRTM", country: "Netherlands", type: "origin" },
      { id: "6", name: "Felixstowe, UK", code: "GBFXT", country: "United Kingdom", type: "origin" },
      { id: "20", name: "Antwerp, Belgium", code: "BEANR", country: "Belgium", type: "origin" },
      { id: "21", name: "Southampton, UK", code: "GBSOU", country: "United Kingdom", type: "origin" },
      { id: "22", name: "Bremen, Germany", code: "DEBRE", country: "Germany", type: "origin" },
      { id: "23", name: "Valencia, Spain", code: "ESVLC", country: "Spain", type: "origin" },
      { id: "24", name: "Le Havre, France", code: "FRLEH", country: "France", type: "origin" },
      
      // Asia Pacific
      { id: "7", name: "Mumbai, India", code: "INMUN", country: "India", type: "origin" },
      { id: "8", name: "Singapore", code: "SGSIN", country: "Singapore", type: "origin" },
      { id: "25", name: "Chennai, India", code: "INMAA", country: "India", type: "origin" },
      { id: "26", name: "Jawaharlal Nehru Port, India", code: "INJNP", country: "India", type: "origin" },
      { id: "27", name: "Port Klang, Malaysia", code: "MYPKG", country: "Malaysia", type: "origin" },
      { id: "28", name: "Bangkok, Thailand", code: "THBKK", country: "Thailand", type: "origin" },
      { id: "29", name: "Hong Kong", code: "HKHKG", country: "Hong Kong", type: "origin" },
      { id: "30", name: "Busan, South Korea", code: "KRPUS", country: "South Korea", type: "origin" },
      { id: "31", name: "Tokyo, Japan", code: "JPTYO", country: "Japan", type: "origin" },
      
      // Americas
      { id: "32", name: "Los Angeles, USA", code: "USLAX", country: "USA", type: "origin" },
      { id: "33", name: "Long Beach, USA", code: "USLGB", country: "USA", type: "origin" },
      { id: "34", name: "New York, USA", code: "USNYC", country: "USA", type: "origin" },
      { id: "35", name: "Miami, USA", code: "USMIA", country: "USA", type: "origin" },
      { id: "36", name: "Vancouver, Canada", code: "CAVAN", country: "Canada", type: "origin" },
      { id: "37", name: "Santos, Brazil", code: "BRSSZ", country: "Brazil", type: "origin" },
      
      // Middle East & Africa
      { id: "38", name: "Jebel Ali, UAE", code: "AEJEA", country: "UAE", type: "origin" },
      { id: "39", name: "Casablanca, Morocco", code: "MACAS", country: "Morocco", type: "origin" },
      
      // South African ports (destinations)
      { id: "9", name: "Durban", code: "ZADUR", country: "South Africa", type: "destination" },
      { id: "10", name: "Cape Town", code: "ZACPT", country: "South Africa", type: "destination" },
      { id: "11", name: "Port Elizabeth (Gqeberha)", code: "ZAPEZ", country: "South Africa", type: "destination" },
      { id: "12", name: "Richards Bay", code: "ZARBD", country: "South Africa", type: "destination" },
      { id: "13", name: "East London", code: "ZAELS", country: "South Africa", type: "destination" },
      { id: "14", name: "Mossel Bay", code: "ZAMOB", country: "South Africa", type: "destination" },
      { id: "15", name: "Saldanha Bay", code: "ZASDB", country: "South Africa", type: "destination" },
      { id: "14", name: "Mossel Bay", code: "ZAMOB", country: "South Africa", type: "destination" },
      { id: "15", name: "Saldanha Bay", code: "ZASDB", country: "South Africa", type: "destination" },
    ];

    portsData.forEach(port => this.ports.set(port.id, port));

    // Initialize comprehensive routes with realistic costs in ZAR - covering ALL origin ports to ALL SA destination ports
    // Note: These are estimate baselines. Live rates from carriers (Maersk API) will be converted from USD to ZAR using real-time exchange rates
    const routesData: Route[] = [];
    
    // Define SA destination port IDs
    const saDestinationPorts = ["9", "10", "11", "12", "13", "14", "15"]; // Durban, Cape Town, PE, Richards Bay, East London, Mossel Bay, Saldanha
    
    // Define origin ports with base costs for each destination port
    const originPortRoutes = [
      // China ports
      { portId: "1", baseCosts: { "9": 35000, "10": 38000, "11": 36000, "12": 34000, "13": 37000, "14": 39000, "15": 40000 }, transitDays: 20 }, // Shanghai
      { portId: "2", baseCosts: { "9": 34000, "10": 37000, "11": 35000, "12": 33000, "13": 36000, "14": 38000, "15": 39000 }, transitDays: 22 }, // Ningbo
      { portId: "3", baseCosts: { "9": 36000, "10": 39000, "11": 37000, "12": 35000, "13": 38000, "14": 40000, "15": 41000 }, transitDays: 24 }, // Tianjin
      { portId: "16", baseCosts: { "9": 33000, "10": 36000, "11": 34000, "12": 32000, "13": 35000, "14": 37000, "15": 38000 }, transitDays: 19 }, // Shenzhen
      { portId: "17", baseCosts: { "9": 34500, "10": 37500, "11": 35500, "12": 33500, "13": 36500, "14": 38500, "15": 39500 }, transitDays: 21 }, // Qingdao
      
      // Europe ports
      { portId: "4", baseCosts: { "9": 33000, "10": 32000, "11": 34000, "12": 35000, "13": 35000, "14": 37000, "15": 31000 }, transitDays: 17 }, // Hamburg
      { portId: "5", baseCosts: { "9": 34000, "10": 33000, "11": 35000, "12": 36000, "13": 36000, "14": 38000, "15": 32000 }, transitDays: 18 }, // Rotterdam
      { portId: "6", baseCosts: { "9": 35000, "10": 34000, "11": 36000, "12": 37000, "13": 37000, "14": 39000, "15": 33000 }, transitDays: 19 }, // Felixstowe
      { portId: "20", baseCosts: { "9": 33500, "10": 32500, "11": 34500, "12": 35500, "13": 35500, "14": 37500, "15": 31500 }, transitDays: 18 }, // Antwerp
      
      // Asia Pacific
      { portId: "7", baseCosts: { "9": 30000, "10": 32000, "11": 31000, "12": 29000, "13": 31500, "14": 33000, "15": 34000 }, transitDays: 14 }, // Mumbai
      { portId: "8", baseCosts: { "9": 28000, "10": 30000, "11": 29000, "12": 27000, "13": 29500, "14": 31000, "15": 32000 }, transitDays: 12 }, // Singapore
      { portId: "25", baseCosts: { "9": 29000, "10": 31000, "11": 30000, "12": 28000, "13": 30500, "14": 32000, "15": 33000 }, transitDays: 13 }, // Chennai
      
      // Americas
      { portId: "32", baseCosts: { "9": 42000, "10": 45000, "11": 43000, "12": 44000, "13": 44000, "14": 46000, "15": 47000 }, transitDays: 28 }, // Los Angeles
      { portId: "34", baseCosts: { "9": 40000, "10": 43000, "11": 41000, "12": 42000, "13": 42000, "14": 44000, "15": 45000 }, transitDays: 26 }, // New York
      
      // Middle East
      { portId: "38", baseCosts: { "9": 25000, "10": 27000, "11": 26000, "12": 24000, "13": 26500, "14": 28000, "15": 29000 }, transitDays: 10 }, // Jebel Ali
    ];
    
    let routeId = 1;
    originPortRoutes.forEach(origin => {
      saDestinationPorts.forEach(destId => {
        const baseCost = origin.baseCosts[destId as keyof typeof origin.baseCosts] || 35000; // fallback cost
        routesData.push({
          id: routeId.toString(),
          originPortId: origin.portId,
          destinationPortId: destId,
          seaFreightCost20ft: baseCost,
          seaFreightCost40ft: Math.round(baseCost * 1.3),
          seaFreightCost40ftHC: Math.round(baseCost * 1.35),
          transitDays: origin.transitDays
        });
        routeId++;
      });
    });

    routesData.forEach(route => this.routes.set(`${route.originPortId}-${route.destinationPortId}`, route));

    // Initialize destinations with trucking costs from all SA ports
    // Note: These are industry-standard trucking estimates. Future enhancement: integrate with real trucking companies like Imperial Logistics, Unitrans
    const destinationsData: Destination[] = [
      { 
        id: "1", name: "Johannesburg, Gauteng", province: "Gauteng", 
        fromDurban: 8500, fromCapeTown: 15000, fromPortElizabeth: 12000,
        fromRichardsBay: 7800, fromEastLondon: 10500, fromMosselBay: 13000, fromSaldanhaBay: 16500
      },
      { 
        id: "2", name: "Pretoria, Gauteng", province: "Gauteng", 
        fromDurban: 9000, fromCapeTown: 15500, fromPortElizabeth: 12500,
        fromRichardsBay: 8300, fromEastLondon: 11000, fromMosselBay: 13500, fromSaldanhaBay: 17000
      },
      { 
        id: "3", name: "Cape Town, Western Cape", province: "Western Cape", 
        fromDurban: 14000, fromCapeTown: 1000, fromPortElizabeth: 7500,
        fromRichardsBay: 15000, fromEastLondon: 8500, fromMosselBay: 4500, fromSaldanhaBay: 2500
      },
      { 
        id: "4", name: "Durban, KwaZulu-Natal", province: "KwaZulu-Natal", 
        fromDurban: 1000, fromCapeTown: 14000, fromPortElizabeth: 6000,
        fromRichardsBay: 3500, fromEastLondon: 5500, fromMosselBay: 12000, fromSaldanhaBay: 16000
      },
      { 
        id: "5", name: "Bloemfontein, Free State", province: "Free State", 
        fromDurban: 6500, fromCapeTown: 11000, fromPortElizabeth: 8500,
        fromRichardsBay: 7500, fromEastLondon: 7000, fromMosselBay: 9500, fromSaldanhaBay: 13000
      },
      { 
        id: "6", name: "Polokwane, Limpopo", province: "Limpopo", 
        fromDurban: 11000, fromCapeTown: 18000, fromPortElizabeth: 15000,
        fromRichardsBay: 9500, fromEastLondon: 13500, fromMosselBay: 16500, fromSaldanhaBay: 20000
      },
    ];

    destinationsData.forEach(dest => this.destinations.set(dest.name, dest));

    // Initialize cargo types
    const cargoTypesData: CargoType[] = [
      { id: "1", name: "General Cargo", dutyRate: 0.15, additionalFees: 2000 },
      { id: "2", name: "Electronics", dutyRate: 0.20, additionalFees: 3500 },
      { id: "3", name: "Textiles & Clothing", dutyRate: 0.45, additionalFees: 2500 },
      { id: "4", name: "Machinery", dutyRate: 0.10, additionalFees: 4000 },
      { id: "5", name: "Automotive Parts", dutyRate: 0.25, additionalFees: 3000 },
      { id: "6", name: "Food Products", dutyRate: 0.05, additionalFees: 2000 },
      { id: "7", name: "Chemicals", dutyRate: 0.08, additionalFees: 5000 },
      { id: "8", name: "Furniture", dutyRate: 0.20, additionalFees: 2500 },
      { id: "9", name: "Other", dutyRate: 0.15, additionalFees: 2000 },
    ];

    cargoTypesData.forEach(cargo => this.cargoTypes.set(cargo.name, cargo));

    // Initialize incoterms
    const incotermsData: Incoterm[] = [
      {
        id: "1",
        code: "EXW",
        name: "Ex Works",
        description: "Seller makes goods available at their premises. Buyer assumes all transportation risks and costs.",
        sellerResponsibilities: ["Make goods available at named place", "Provide commercial invoice", "Assist with export formalities if requested"],
        buyerResponsibilities: ["Collect goods", "Handle all transportation", "Pay all costs from seller's premises", "Handle export and import clearance"],
        riskTransferPoint: "Seller's premises",
        applicableTransport: ["any"]
      },
      {
        id: "2", 
        code: "FOB",
        name: "Free on Board",
        description: "Seller delivers goods on board vessel at named port. Risk transfers when goods cross ship's rail.",
        sellerResponsibilities: ["Deliver goods on board vessel", "Handle export clearance", "Pay costs until goods on board"],
        buyerResponsibilities: ["Pay sea freight", "Handle import clearance", "Pay costs from vessel onwards"],
        riskTransferPoint: "When goods cross ship's rail at port of shipment",
        applicableTransport: ["sea"]
      },
      {
        id: "3",
        code: "CFR", 
        name: "Cost and Freight",
        description: "Seller pays sea freight to destination port but risk transfers at port of shipment.",
        sellerResponsibilities: ["Deliver goods on board vessel", "Pay sea freight to destination", "Handle export clearance"],
        buyerResponsibilities: ["Handle import clearance", "Pay costs from arrival at destination port", "Arrange insurance"],
        riskTransferPoint: "When goods cross ship's rail at port of shipment",
        applicableTransport: ["sea"]
      },
      {
        id: "4",
        code: "CIF",
        name: "Cost, Insurance and Freight", 
        description: "Seller pays sea freight and minimum insurance to destination port.",
        sellerResponsibilities: ["Deliver goods on board vessel", "Pay sea freight to destination", "Arrange minimum insurance", "Handle export clearance"],
        buyerResponsibilities: ["Handle import clearance", "Pay costs from arrival at destination port"],
        riskTransferPoint: "When goods cross ship's rail at port of shipment",
        applicableTransport: ["sea"]
      },
      {
        id: "5",
        code: "FCA",
        name: "Free Carrier",
        description: "Seller delivers goods to carrier nominated by buyer at named place.",
        sellerResponsibilities: ["Deliver goods to named carrier", "Handle export clearance", "Load goods if at seller's premises"],
        buyerResponsibilities: ["Nominate carrier", "Pay main carriage", "Handle import clearance"],
        riskTransferPoint: "When goods delivered to carrier",
        applicableTransport: ["any"]
      },
      {
        id: "6",
        code: "CPT",
        name: "Carriage Paid To",
        description: "Seller pays main carriage to named destination but risk transfers at first carrier.",
        sellerResponsibilities: ["Deliver goods to carrier", "Pay main carriage to destination", "Handle export clearance"],
        buyerResponsibilities: ["Handle import clearance", "Pay costs from destination", "Arrange insurance"],
        riskTransferPoint: "When goods delivered to first carrier",
        applicableTransport: ["any"]
      },
      {
        id: "7",
        code: "CIP",
        name: "Carriage and Insurance Paid To",
        description: "Seller pays main carriage and insurance to named destination.",
        sellerResponsibilities: ["Deliver goods to carrier", "Pay main carriage to destination", "Arrange insurance", "Handle export clearance"],
        buyerResponsibilities: ["Handle import clearance", "Pay costs from destination"],
        riskTransferPoint: "When goods delivered to first carrier", 
        applicableTransport: ["any"]
      },
      {
        id: "8",
        code: "DDP",
        name: "Delivered Duty Paid",
        description: "Seller delivers goods cleared for import at named destination. Maximum seller obligation.",
        sellerResponsibilities: ["Deliver goods to destination", "Handle all transportation", "Pay all duties and taxes", "Handle export and import clearance"],
        buyerResponsibilities: ["Receive goods at destination", "Unload goods"],
        riskTransferPoint: "At named place of destination",
        applicableTransport: ["any"]
      }
    ];

    incotermsData.forEach(incoterm => this.incoterms.set(incoterm.code, incoterm));
  }

  async getPorts(): Promise<Port[]> {
    return Array.from(this.ports.values());
  }

  async getOriginPorts(): Promise<Port[]> {
    return Array.from(this.ports.values()).filter(port => port.type === "origin");
  }

  async getDestinationPorts(): Promise<Port[]> {
    return Array.from(this.ports.values()).filter(port => port.type === "destination");
  }

  async getRoute(originPortId: string, destinationPortId: string): Promise<Route | undefined> {
    const route = this.routes.get(`${originPortId}-${destinationPortId}`);
    if (route) {
      return route;
    }
    
    // If no direct route found, try to find by port codes instead of IDs
    const originPort = Array.from(this.ports.values()).find(p => p.code === originPortId);
    const destPort = Array.from(this.ports.values()).find(p => p.code === destinationPortId);
    
    if (originPort && destPort) {
      return this.routes.get(`${originPort.id}-${destPort.id}`);
    }
    
    return undefined;
  }

  async getDestinations(): Promise<Destination[]> {
    return Array.from(this.destinations.values());
  }

  async getDestination(name: string): Promise<Destination | undefined> {
    return this.destinations.get(name);
  }

  async getCargoTypes(): Promise<CargoType[]> {
    return Array.from(this.cargoTypes.values());
  }

  async getCargoType(name: string): Promise<CargoType | undefined> {
    return this.cargoTypes.get(name);
  }

  async getIncoterms(): Promise<Incoterm[]> {
    return Array.from(this.incoterms.values());
  }

  async getIncoterm(code: string): Promise<Incoterm | undefined> {
    return this.incoterms.get(code);
  }

  async createQuote(insertQuote: InsertShippingQuote): Promise<ShippingQuote> {
    const id = randomUUID();
    const quote: ShippingQuote = {
      ...insertQuote,
      id,
      createdAt: new Date().toISOString(),
    };
    this.quotes.set(id, quote);
    return quote;
  }

  async getQuote(id: string): Promise<ShippingQuote | undefined> {
    return this.quotes.get(id);
  }
}

export const storage = new MemStorage();
