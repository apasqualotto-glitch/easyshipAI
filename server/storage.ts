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
    // Initialize ports
    const portsData: Port[] = [
      { id: "1", name: "Shanghai, China", code: "CNSHA", country: "China", type: "origin" },
      { id: "2", name: "Ningbo, China", code: "CNNGB", country: "China", type: "origin" },
      { id: "3", name: "Tianjin, China", code: "CNTXG", country: "China", type: "origin" },
      { id: "4", name: "Hamburg, Germany", code: "DEHAM", country: "Germany", type: "origin" },
      { id: "5", name: "Rotterdam, Netherlands", code: "NLRTM", country: "Netherlands", type: "origin" },
      { id: "6", name: "Felixstowe, UK", code: "GBFXT", country: "United Kingdom", type: "origin" },
      { id: "7", name: "Mumbai, India", code: "INMUN", country: "India", type: "origin" },
      { id: "8", name: "Singapore", code: "SGSIN", country: "Singapore", type: "origin" },
      { id: "9", name: "Durban", code: "ZADUR", country: "South Africa", type: "destination" },
      { id: "10", name: "Cape Town", code: "ZACPT", country: "South Africa", type: "destination" },
      { id: "11", name: "Port Elizabeth", code: "ZAPEZ", country: "South Africa", type: "destination" },
    ];

    portsData.forEach(port => this.ports.set(port.id, port));

    // Initialize routes with realistic costs in ZAR
    const routesData: Route[] = [
      { id: "1", originPortId: "1", destinationPortId: "9", seaFreightCost20ft: 35000, seaFreightCost40ft: 45000, seaFreightCost40ftHC: 47000, transitDays: 20 },
      { id: "2", originPortId: "1", destinationPortId: "10", seaFreightCost20ft: 38000, seaFreightCost40ft: 48000, seaFreightCost40ftHC: 50000, transitDays: 22 },
      { id: "3", originPortId: "4", destinationPortId: "10", seaFreightCost20ft: 32000, seaFreightCost40ft: 42000, seaFreightCost40ftHC: 44000, transitDays: 16 },
      { id: "4", originPortId: "5", destinationPortId: "9", seaFreightCost20ft: 34000, seaFreightCost40ft: 44000, seaFreightCost40ftHC: 46000, transitDays: 18 },
      { id: "5", originPortId: "8", destinationPortId: "9", seaFreightCost20ft: 28000, seaFreightCost40ft: 38000, seaFreightCost40ftHC: 40000, transitDays: 12 },
    ];

    routesData.forEach(route => this.routes.set(`${route.originPortId}-${route.destinationPortId}`, route));

    // Initialize destinations
    const destinationsData: Destination[] = [
      { id: "1", name: "Johannesburg, Gauteng", province: "Gauteng", fromDurban: 8500, fromCapeTown: 15000, fromPortElizabeth: 12000 },
      { id: "2", name: "Pretoria, Gauteng", province: "Gauteng", fromDurban: 9000, fromCapeTown: 15500, fromPortElizabeth: 12500 },
      { id: "3", name: "Cape Town, Western Cape", province: "Western Cape", fromDurban: 14000, fromCapeTown: 1000, fromPortElizabeth: 7500 },
      { id: "4", name: "Durban, KwaZulu-Natal", province: "KwaZulu-Natal", fromDurban: 1000, fromCapeTown: 14000, fromPortElizabeth: 6000 },
      { id: "5", name: "Bloemfontein, Free State", province: "Free State", fromDurban: 6500, fromCapeTown: 11000, fromPortElizabeth: 8500 },
      { id: "6", name: "Polokwane, Limpopo", province: "Limpopo", fromDurban: 11000, fromCapeTown: 18000, fromPortElizabeth: 15000 },
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
    return this.routes.get(`${originPortId}-${destinationPortId}`);
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
