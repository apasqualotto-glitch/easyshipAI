/**
 * Estimate Service for EasyShip AI
 * Provides instant, provisional quotes from *minimal* user information.
 * Designed so the Shipping Agent can "process" loose conversational input
 * into a trustworthy number + plain-English explanations.
 *
 * Reuses the core logic from quote-service, storage, and customs-database
 * but applies smart defaults + explicit assumptions instead of requiring everything.
 */

import { storage } from "./storage";
import { customsDatabase } from "./customs-database";
import { ExchangeRateService } from "./cache-service";
import {
  getRouteCosts,
  calculateIncotermCosts,
  isSACUMember,
  calculateCustomsCosts,
} from "./quote-service";

export interface EstimateRequest {
  origin?: string;           // "Shanghai", "China", "CNSHA", "Durban" etc.
  destination?: string;      // "Johannesburg", "Cape Town", "JNB", "Durban"
  containerType?: "20ft" | "40ft" | "40ft-hc" | "partial" | string;
  cargoType?: string;        // "Electronics", "Textiles & Clothing", "Furniture"...
  value?: number;            // USD value of goods
  weight?: number;           // kg
  incoterm?: string;         // "FOB", "CIF", "DDP"...
  deliveryCity?: string;     // for trucking (Johannesburg etc.)
}

export interface EstimateResult {
  isProvisional: true;
  confidence: "high" | "medium" | "low";
  assumptions: string[];
  isExport: boolean;

  // Resolved core data
  originPort: { id: string; name: string; country: string };
  destinationPort: { id: string; name: string };
  finalDestination?: string;

  containerType: string;
  cargoType: string;
  incoterm: string;

  // Core numbers (ZAR)
  exchangeRate: number;
  fobValueZAR: number;
  seaFreight: number;
  trucking: number;
  customsDuties: number;
  vat: number;
  handlingFees: number;
  totalCost: number;

  // Nice breakdown for UI
  breakdown: {
    currency: string;
    fobValueZAR: number;
    seaFreight: number;
    trucking: number;
    customsDuties: number;
    vat: number;
    handlingFees: number;
    total: number;
  };

  // Plain-language explanations the agent can surface or the UI can show inline
  explanations: {
    seaFreight: string;
    trucking: string;
    customsDuties: string;
    vat: string;
    handlingFees: string;
    total: string;
    incotermNote?: string;
  };

  // Education / next steps
  recommendedIncoterm?: string;
  whyThisIncoterm?: string;
  missingForAccurate: string[];   // what would make this "exact"
  tips: string[];

  // For wiring back to the full calculator
  suggestedFormValues: {
    originPort?: string;
    destinationPort?: string;
    deliveryAddress?: string;
    containerType?: string;
    cargoType?: string;
    incoterm?: string;
    value?: number;
    weight?: number;
  };

  timestamp: string;
}

// Reasonable defaults for "instant" experience
const DEFAULTS = {
  containerType: "20ft" as const,
  valueUSD: 8000,
  weightKg: 4500,           // ~ for a typical 20ft mixed load
  incotermForImport: "CIF",
  incotermForExport: "FOB",
  cargoType: "General Cargo",
};

function normalizeContainer(ct?: string): "20ft" | "40ft" | "40ft-hc" | "partial" {
  if (!ct) return DEFAULTS.containerType;
  const s = ct.toLowerCase().replace(/[-_\s]/g, "");
  if (s.includes("40hc") || s.includes("highcube")) return "40ft-hc";
  if (s.includes("40")) return "40ft";
  if (s.includes("partial") || s.includes("lcl") || s.includes("shared")) return "partial";
  return "20ft";
}

function normalizeIncoterm(it?: string, isExport = false): string {
  if (it) {
    const upper = it.toUpperCase();
    if (["FOB", "CIF", "DDP", "EXW", "CIP", "FCA"].includes(upper)) return upper;
  }
  return isExport ? DEFAULTS.incotermForExport : DEFAULTS.incotermForImport;
}

async function resolvePort(input: string | undefined, preferType: "origin" | "destination" | "both"): Promise<any | null> {
  if (!input) return null;
  const all = await storage.getPorts();
  const lower = input.toLowerCase().trim();

  // Exact id or code
  let found = all.find(p => p.id === input || p.code?.toLowerCase() === lower);
  if (found) return found;

  // Name contains
  found = all.find(p => p.name.toLowerCase().includes(lower));
  if (found) return found;

  // Country / city heuristics (expanded from client extraction logic)
  const cityMap: Record<string, string[]> = {
    "shanghai": ["shanghai", "china"],
    "ningbo": ["ningbo"],
    "shenzhen": ["shenzhen", "yantian"],
    "qingdao": ["qingdao"],
    "tianjin": ["tianjin"],
    "hamburg": ["hamburg", "germany"],
    "rotterdam": ["rotterdam", "netherlands"],
    "felixstowe": ["felixstowe", "uk", "england"],
    "antwerp": ["antwerp", "belgium"],
    "durban": ["durban", "dbn"],
    "cape town": ["cape town", "cpt", "capetown"],
    "port elizabeth": ["port elizabeth", "gqeberha", "pe"],
    "johannesburg": ["johannesburg", "joburg", "jnb", "jozi"], // will resolve to nearest port
  };

  for (const [key, aliases] of Object.entries(cityMap)) {
    if (aliases.some(a => lower.includes(a))) {
      // Prefer SA ports for destination when Johannesburg etc mentioned
      if (["johannesburg", "joburg", "jozi"].some(a => lower.includes(a))) {
        return all.find(p => p.name.toLowerCase().includes("durban")) || all.find(p => p.id === "9");
      }
      found = all.find(p => p.name.toLowerCase().includes(key));
      if (found) return found;
    }
  }

  // Fallbacks by broad region
  if (lower.includes("china")) return all.find(p => p.id === "1"); // Shanghai
  if (lower.includes("europe") || lower.includes("germany")) return all.find(p => p.id === "4");
  if (lower.includes("south africa") || lower.includes(" sa")) {
    return preferType === "destination" 
      ? all.find(p => p.id === "9") // Durban default for imports
      : all.find(p => p.id === "10"); // Cape Town for exports
  }

  return null;
}

async function getTruckingToFinal(destinationPortId: string, deliveryCity?: string): Promise<number> {
  // Base from storage destination data
  const dest = await storage.getDestination(destinationPortId);
  if (dest) {
    // Rough mapping for final city trucking uplift
    const city = (deliveryCity || "").toLowerCase();
    if (city.includes("johannesburg") || city.includes("joburg") || city.includes("pretoria")) {
      return Math.round((dest.fromDurban || dest.fromCapeTown || 8500) * 1.15); // inland uplift
    }
    if (city.includes("cape town")) return dest.fromCapeTown || 4500;
    if (city.includes("durban")) return dest.fromDurban || 3200;
    return dest.fromDurban || dest.fromCapeTown || 8000;
  }
  return 8500; // safe default inland
}

export async function estimateQuote(req: EstimateRequest): Promise<EstimateResult> {
  const assumptions: string[] = [];
  const missingForAccurate: string[] = [];

  // 1. Resolve ports (the most important "minimal" piece)
  let originPort = await resolvePort(req.origin, "origin");
  let destinationPort = await resolvePort(req.destination, "destination");

  if (!originPort && req.origin) {
    // last resort broad search
    const all = await storage.getPorts();
    originPort = all.find(p => p.name.toLowerCase().includes("shanghai")) || all[0];
  }
  if (!destinationPort && req.destination) {
    const all = await storage.getPorts();
    destinationPort = all.find(p => p.name.toLowerCase().includes("durban")) || all.find(p => p.id === "9");
  }

  // Strong defaults if still nothing (so we can always give *something*)
  if (!originPort) {
    originPort = { id: "1", name: "Shanghai, China", country: "China", type: "origin" };
    assumptions.push("Assumed origin Shanghai, China (most common manufacturing hub). Tell me the exact city/port for better accuracy.");
  }
  if (!destinationPort) {
    destinationPort = { id: "9", name: "Durban", country: "South Africa", type: "both" };
    assumptions.push("Assumed destination Durban port (primary gateway). Tell me Cape Town / Johannesburg / PE for accurate trucking.");
  }

  const isExport = originPort.country === "South Africa" || (req.origin || "").toLowerCase().includes("south africa") || (req.origin || "").toLowerCase().includes("durban") || (req.origin || "").toLowerCase().includes("cape town");

  // 2. Container, value, weight, incoterm with defaults + assumptions
  const containerType = normalizeContainer(req.containerType);
  if (!req.containerType) {
    assumptions.push(`Using standard 20ft container. A 40ft is ~1.75× the sea freight.`);
    missingForAccurate.push("container size (20ft / 40ft / 40ft-hc / partial)");
  }

  let valueUSD = req.value && req.value > 0 ? req.value : DEFAULTS.valueUSD;
  if (!req.value || req.value <= 0) {
    assumptions.push(`Cargo value assumed at $${DEFAULTS.valueUSD.toLocaleString()} USD (common for small-medium first-time shipments). Accurate value is critical for duties & VAT.`);
    missingForAccurate.push("cargo value in USD (affects duties + 15% VAT)");
  }

  let weightKg = req.weight && req.weight > 0 ? req.weight : DEFAULTS.weightKg;
  if (!req.weight || req.weight <= 0) {
    assumptions.push(`Weight estimated at ${DEFAULTS.weightKg} kg (typical for a 20ft load). Heavier loads may need 40ft or incur extra fees.`);
    missingForAccurate.push("total weight in kg or tons");
  }

  const incoterm = normalizeIncoterm(req.incoterm, isExport);
  if (!req.incoterm) {
    assumptions.push(`Defaulted to ${incoterm} (good starting point for ${isExport ? "exports" : "imports to SA"}). Changing this can save or cost you 15-30%.`);
    missingForAccurate.push("preferred Incoterm (FOB / CIF / DDP / EXW)");
  }

  const cargoType = req.cargoType || DEFAULTS.cargoType;
  if (!req.cargoType) {
    missingForAccurate.push("cargo type (Electronics, Textiles, Furniture, Machinery, etc.) — this sets the exact duty rate");
  }

  // 3. Get exchange + route base costs (reuse real logic)
  const exchangeRate = await (await ExchangeRateService.getUSDtoZAR()).rate;
  const fobValueZAR = Math.round(valueUSD * exchangeRate);

  // Try to get real route; fall back to sensible averages if no exact match
  let seaFreightBase = 48500; // default 20ft China-SA from storage seeds
  let truckingBase = 8500;

  try {
    const routeCosts = await getRouteCosts(originPort.id, destinationPort.id, containerType, weightKg);
    seaFreightBase = routeCosts.seaFreight;
    truckingBase = await getTruckingToFinal(destinationPort.id, req.deliveryCity || req.destination);
  } catch {
    // No exact route in DB — use container-adjusted averages + note it
    const mult = containerType === "40ft" ? 1.75 : containerType === "40ft-hc" ? 1.85 : containerType === "partial" ? 0.55 : 1;
    seaFreightBase = Math.round(48500 * mult);
    assumptions.push("Used typical market sea freight for this corridor (no exact route table entry for the ports chosen). Real quote may vary ±15%.");
  }

  // 4. Incoterm-adjusted sea freight to buyer
  const incotermAdj = calculateIncotermCosts(incoterm, seaFreightBase, valueUSD, exchangeRate);
  const seaToBuyer = incotermAdj.seaFreightCostToBuyer;

  // 5. Customs / VAT (reuse the real engine; fall back to cargo type rates)
  let customsDuties = 0;
  let vat = 0;
  let handling = 1200;

  const isSacu = isSACUMember(originPort.country);
  let cargoTypeForCalc: any = null;

  try {
    // Try to find a matching cargo type from storage for basic rate
    const cargoTypes = await storage.getCargoTypes();
    cargoTypeForCalc = cargoTypes.find((c: any) => 
      c.name.toLowerCase().includes(cargoType.toLowerCase().split(" ")[0])
    ) || cargoTypes.find((c: any) => c.name === "General Cargo");
  } catch {}

  try {
    const customsInfo = await calculateCustomsCosts(
      null, // no specific HS yet — estimator is intentionally "good enough"
      cargoTypeForCalc?.id,
      fobValueZAR,
      originPort.country,
      isSacu,
      isExport
    );
    customsDuties = customsInfo.customsDuties || 0;
    vat = customsInfo.vat || 0;
    handling = customsInfo.handlingFees || handling;
  } catch {
    // Very conservative fallback
    if (!isExport) {
      const dutyRate = cargoType.toLowerCase().includes("electron") ? 0 : 
                       cargoType.toLowerCase().includes("textile") || cargoType.toLowerCase().includes("clothing") ? 0.40 : 0.10;
      customsDuties = Math.round(fobValueZAR * dutyRate);
      const atv = isSacu ? fobValueZAR + customsDuties : fobValueZAR * 1.1 + customsDuties;
      vat = Math.round(atv * 0.15);
      handling = 800 + Math.round(fobValueZAR * 0.05);
    }
    assumptions.push("Customs/VAT used simplified rates because no exact HS code was provided yet. Use the cargo search in the calculator for SARS-precise duty.");
  }

  const trucking = truckingBase;
  const total = seaToBuyer + trucking + customsDuties + vat + handling;

  // 6. Build beautiful plain-language explanations
  const explanations = {
    seaFreight: isExport
      ? `Sea freight you (or your buyer) will pay or arrange. Based on current corridor rates for a ${containerType}.`
      : `Ocean shipping cost from ${originPort.name} to ${destinationPort.name}. ${incoterm === "CIF" || incoterm === "DDP" ? "Included in your quoted price under this Incoterm." : "You arrange/pay this leg."}`,
    trucking: `Trucking / last-mile from the SA port to final delivery city. Higher for inland cities like Johannesburg.`,
    customsDuties: isExport 
      ? "Exports from South Africa normally have $0 customs duties in SA (you may have import duties in the destination country)."
      : `Import duty charged by SARS based on cargo type / HS code. Rate applied to the FOB goods value. Different products pay 0%–45%.`,
    vat: isExport
      ? "No SA VAT on exports."
      : `15% VAT on (FOB value + duties${isSacu ? "" : " + 10% uplift for non-SACU"}). This is the biggest "surprise" cost for first-timers.`,
    handlingFees: "Port handling, documentation, carrier fees, and agent charges. Roughly scales with container size and value.",
    total: `All-in estimated landed cost in South African Rand (ZAR). This is what you should budget before you start.`,
  };

  // Incoterm education
  let whyThisIncoterm = "";
  let recommendedIncoterm = incoterm;
  if (!isExport) {
    if (incoterm === "FOB") {
      whyThisIncoterm = "You control the shipping — often cheapest if you have a forwarder, but you take on more risk and coordination.";
    } else if (incoterm === "CIF") {
      whyThisIncoterm = "Seller handles ocean freight + insurance to SA port. You only handle SA customs + trucking. Popular and lower surprise factor for beginners.";
      recommendedIncoterm = "CIF";
    } else if (incoterm === "DDP") {
      whyThisIncoterm = "Seller does almost everything including SA customs clearance. Highest price but simplest for you.";
    }
  }

  const tips: string[] = [
    isExport ? "For exports, focus on getting a good forwarder and correct export permits if your goods are controlled." : "Get your cargo value and exact HS code right — they drive the biggest variable costs (duty + VAT).",
    "A 40ft container is usually better value per m³ than two 20fts once you have enough volume.",
    "Consider peak season surcharges (Oct–Jan) and book early if possible.",
  ];

  if (missingForAccurate.length > 0) {
    tips.push(`For a precise quote instead of this estimate, also give us: ${missingForAccurate.join(", ")}.`);
  }

  // Suggested values to auto-fill the real calculator
  const suggestedFormValues = {
    originPort: originPort.id,
    destinationPort: destinationPort.id,
    deliveryAddress: req.deliveryCity || (destinationPort.name.includes("Durban") ? "Johannesburg, Gauteng" : destinationPort.name),
    containerType,
    cargoType,
    incoterm,
    value: valueUSD,
    weight: weightKg,
  };

  const confidence: "high" | "medium" | "low" =
    missingForAccurate.length === 0 ? "high" :
    missingForAccurate.length <= 2 ? "medium" : "low";

  return {
    isProvisional: true,
    confidence,
    assumptions,
    isExport,
    originPort: { id: originPort.id, name: originPort.name, country: originPort.country },
    destinationPort: { id: destinationPort.id, name: destinationPort.name },
    finalDestination: req.deliveryCity,
    containerType,
    cargoType,
    incoterm,
    exchangeRate,
    fobValueZAR,
    seaFreight: Math.round(seaToBuyer),
    trucking: Math.round(trucking),
    customsDuties: Math.round(customsDuties),
    vat: Math.round(vat),
    handlingFees: Math.round(handling),
    totalCost: Math.round(total),
    breakdown: {
      currency: "ZAR",
      fobValueZAR,
      seaFreight: Math.round(seaToBuyer),
      trucking: Math.round(trucking),
      customsDuties: Math.round(customsDuties),
      vat: Math.round(vat),
      handlingFees: Math.round(handling),
      total: Math.round(total),
    },
    explanations,
    recommendedIncoterm,
    whyThisIncoterm,
    missingForAccurate,
    tips,
    suggestedFormValues,
    timestamp: new Date().toISOString(),
  };
}

// Convenience: very loose free-text helper used by the agent layer
export async function estimateFromLooseText(text: string): Promise<EstimateResult | null> {
  // Very lightweight extraction (the client ai-chat-interface already does excellent work;
  // this is a server-side safety net for the agent endpoints)
  const lower = text.toLowerCase();

  const req: EstimateRequest = {};

  // origin / destination crude
  const fromMatch = lower.match(/from\s+([a-zA-Z\s]+?)(?:\s+to|\s+in|\s*,|$)/);
  if (fromMatch) req.origin = fromMatch[1].trim();

  const toMatch = lower.match(/to\s+([a-zA-Z\s]+?)(?:\s*,|\s*$|\s+(20|40|partial))/);
  if (toMatch) req.destination = toMatch[1].trim();

  // container
  if (lower.includes("40ft") || lower.includes("40 ft")) req.containerType = "40ft";
  else if (lower.includes("20ft") || lower.includes("20 ft")) req.containerType = "20ft";
  else if (lower.includes("partial") || lower.includes("lcl")) req.containerType = "partial";

  // value
  const valMatch = lower.match(/\$?\s*(\d[\d,]+)\s*(usd|dollars?)?/);
  if (valMatch) req.value = parseInt(valMatch[1].replace(/,/g, ""));

  // weight
  const wMatch = lower.match(/(\d[\d,]+)\s*(kg|kilo|ton|tons?)/);
  if (wMatch) {
    let w = parseInt(wMatch[1].replace(/,/g, ""));
    if (wMatch[2].includes("ton")) w *= 1000;
    req.weight = w;
  }

  // cargo hint
  if (lower.includes("laptop") || lower.includes("phone") || lower.includes("electron")) req.cargoType = "Electronics";
  else if (lower.includes("clothes") || lower.includes("shirt") || lower.includes("textile")) req.cargoType = "Textiles & Clothing";
  else if (lower.includes("furniture") || lower.includes("chair") || lower.includes("table")) req.cargoType = "Furniture";

  if (!req.origin && !req.destination) return null;

  return estimateQuote(req);
}
