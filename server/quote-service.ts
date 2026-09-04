/**
 * Quote Calculation Service
 * Extracts complex quote calculation logic from routes
 * Handles all shipping cost calculations in one place
 */

import { storage } from "./storage";
import { customsDatabase } from "./customs-database";
import { ExchangeRateService } from "./cache-service";

export interface QuoteRequest {
  originPortId: string;
  destinationId: string;
  containerType: "20ft" | "40ft" | "40ft-HC" | "partial";
  weight: number;
  volume: number;
  incoterm: string;
  value: number;
  currencyCode: string;
  customsTariff?: { hsCode: string; dutyRate: number };
  cargoTypeId?: string;
}

export interface QuoteResult {
  quoteId: string;
  originPort: { id: string; name: string; country: string };
  destinationPort: { id: string; name: string };
  containerType: string;
  weight: number;
  volume: number;
  incoterm: string;
  fobValue: number;
  exchangeRate: number;
  seaFreight: number;
  trucking: number;
  customsDuties: number;
  vat: number;
  handlingFees: number;
  totalCost: number;
  breakdown: {
    currency: string;
    fobValue: number;
    seaFreight: number;
    trucking: number;
    customsDuties: number;
    vat: number;
    handlingFees: number;
    total: number;
  };
  customs?: any;
  tradeAgreement?: any;
  timestamp: string;
}

/**
 * Main quote calculation orchestrator
 */
export async function calculateQuote(request: QuoteRequest): Promise<QuoteResult> {
  // Validate and fetch port data
  const { originPort, destinationPort } = await validateAndGetPorts(
    request.originPortId,
    request.destinationId
  );

  // Get shipping route costs
  const routeCosts = await getRouteCosts(
    request.originPortId,
    request.destinationId,
    request.containerType,
    request.weight
  );

  // Get exchange rate
  const exchangeRate = await getExchangeRateUSDtoZAR();

  // Calculate FOB value in ZAR
  const fobValueZAR = Math.round(request.value * exchangeRate);

  // Calculate sea freight cost based on incoterm
  const incotermCosts = calculateIncotermCosts(
    request.incoterm,
    routeCosts.seaFreight,
    request.value,
    exchangeRate
  );

  // Determine if country is SACU member
  const isSacuCountry = isSACUMember(originPort.country);
  const isExport = originPort.country === "South Africa";

  // Calculate customs, VAT, and duties
  const customsInfo = await calculateCustomsCosts(
    request.customsTariff,
    request.cargoTypeId,
    fobValueZAR,
    originPort.country,
    isSacuCountry,
    isExport
  );

  // Calculate trucking to destination
  const truckingCost = routeCosts.trucking;

  // Calculate total
  const totalCost =
    incotermCosts.seaFreightCostToBuyer +
    truckingCost +
    customsInfo.customsDuties +
    customsInfo.vat +
    customsInfo.handlingFees;

  return {
    quoteId: generateQuoteId(),
    originPort,
    destinationPort,
    containerType: request.containerType,
    weight: request.weight,
    volume: request.volume,
    incoterm: request.incoterm,
    fobValue: request.value,
    exchangeRate,
    seaFreight: incotermCosts.seaFreightCostToBuyer,
    trucking: truckingCost,
    customsDuties: customsInfo.customsDuties,
    vat: customsInfo.vat,
    handlingFees: customsInfo.handlingFees,
    totalCost,
    breakdown: {
      currency: "ZAR",
      fobValue: fobValueZAR,
      seaFreight: Math.round(incotermCosts.seaFreightCostToBuyer),
      trucking: Math.round(truckingCost),
      customsDuties: Math.round(customsInfo.customsDuties),
      vat: Math.round(customsInfo.vat),
      handlingFees: Math.round(customsInfo.handlingFees),
      total: Math.round(totalCost),
    },
    customs: customsInfo.customsBreakdown,
    tradeAgreement: customsInfo.tradeAgreementInfo,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate and fetch port data
 */
export async function validateAndGetPorts(originPortId: string, destinationId: string) {
  const allPorts = await storage.getPorts();

  const originPort = allPorts.find((p) => p.id === originPortId);
  if (!originPort) {
    throw new Error(`Origin port not found: ${originPortId}`);
  }

  const destinationPort = allPorts.find((p) => p.id === destinationId);
  if (!destinationPort) {
    throw new Error(`Destination port not found: ${destinationId}`);
  }

  return { originPort, destinationPort };
}

/**
 * Get shipping costs from route and add trucking
 */
export async function getRouteCosts(
  originPortId: string,
  destinationId: string,
  containerType: string,
  weight: number
) {
  // Get sea freight from route
  const route = await storage.getRoute(originPortId, destinationId);
  if (!route) {
    throw new Error(`Route not found: ${originPortId} -> ${destinationId}`);
  }

  // Apply container type multiplier
  const containerMultipliers: Record<string, number> = {
    "20ft": 1,
    "40ft": 1.75,
    "40ft-HC": 1.85,
    partial: 0.5,
  };

  const seaFreight =
    (route.seaFreightCost || 2500) * (containerMultipliers[containerType] || 1);

  // Get trucking cost to destination
  const destination = await storage.getDestination(destinationId);
  const truckingCost = destination?.truckingCost || 800;

  return {
    seaFreight,
    trucking: truckingCost,
  };
}

/**
 * Get current exchange rate with caching
 */
async function getExchangeRateUSDtoZAR(): Promise<number> {
  const result = await ExchangeRateService.getUSDtoZAR();
  return result.rate;
}

/**
 * Calculate costs based on incoterm
 */
export function calculateIncotermCosts(
  incoterm: string,
  seaFreightCost: number,
  value: number,
  exchangeRate: number
) {
  const incotermCosts: Record<
    string,
    { seaFreightCostToBuyer: number; insuranceCost: number; handlingFeesToBuyer: number }
  > = {
    FOB: {
      seaFreightCostToBuyer: seaFreightCost,
      insuranceCost: 0,
      handlingFeesToBuyer: seaFreightCost * 0.05,
    },
    CIF: {
      seaFreightCostToBuyer: 0,
      insuranceCost: (value * exchangeRate) * 0.015,
      handlingFeesToBuyer: 0,
    },
    CIP: {
      seaFreightCostToBuyer: 0,
      insuranceCost: (value * exchangeRate) * 0.015,
      handlingFeesToBuyer: 0,
    },
    DDP: {
      seaFreightCostToBuyer: 0,
      insuranceCost: 0,
      handlingFeesToBuyer: 0,
    },
    EXW: {
      seaFreightCostToBuyer: seaFreightCost * 2,
      insuranceCost: (value * exchangeRate) * 0.02,
      handlingFeesToBuyer: seaFreightCost * 0.1,
    },
    FCA: {
      seaFreightCostToBuyer: seaFreightCost,
      insuranceCost: 0,
      handlingFeesToBuyer: seaFreightCost * 0.05,
    },
  };

  const costs = incotermCosts[incoterm] || incotermCosts["FOB"];

  return {
    seaFreightCostToBuyer: costs.seaFreightCostToBuyer,
    insuranceCost: costs.insuranceCost,
    handlingFeesToBuyer: costs.handlingFeesToBuyer,
  };
}

/**
 * Check if country is SACU member
 */
export function isSACUMember(country: string): boolean {
  const sacuCountries = ["Botswana", "Lesotho", "Namibia", "Eswatini"];
  return sacuCountries.includes(country);
}

/**
 * Calculate customs duties and VAT
 */
export async function calculateCustomsCosts(
  customsTariff: any,
  cargoTypeId: string | undefined,
  fobValueZAR: number,
  originCountry: string,
  isSacuCountry: boolean,
  isExport: boolean
) {
  // Exports from SA have no customs or VAT
  if (isExport) {
    return {
      customsDuties: 0,
      vat: 0,
      handlingFees: 800,
      customsBreakdown: { fobValue: fobValueZAR, duties: 0, vat: 0 },
      tradeAgreementInfo: {
        name: "Export",
        preferential: true,
        dutyRate: 0,
      },
    };
  }

  // Import calculations
  let customsDuties = 0;
  let vat = 0;
  let handlingFees = 800;
  let customsBreakdown: any = {};
  let tradeAgreementInfo: any = {};

  if (customsTariff) {
    // Use advanced customs calculations with trade agreement rates
    const customsCalculation = customsDatabase.calculateDetailedCustomsCostByCountry(
      customsTariff.hsCode,
      fobValueZAR,
      originCountry,
      isSacuCountry
    );

    if (!customsCalculation.error && customsCalculation.calculations) {
      customsDuties = customsCalculation.calculations.customsDuty;
      vat = customsCalculation.calculations.vat;
      handlingFees =
        customsCalculation.calculations.additionalFees + fobValueZAR * 0.05;
      customsBreakdown = customsCalculation.breakdown;
      tradeAgreementInfo = customsCalculation.tradeAgreement;
    }
  } else if (cargoTypeId) {
    // Use basic cargo type calculations
    const cargoType = await storage.getCargoType(cargoTypeId);
    if (cargoType) {
      const dutyRate = cargoType.dutyRate;
      customsDuties = fobValueZAR * dutyRate;

      // SARS VAT Formula
      const atvValue = isSacuCountry
        ? fobValueZAR + customsDuties
        : fobValueZAR * 1.1 + customsDuties;

      vat = atvValue * 0.15;
      handlingFees = cargoType.additionalFees + fobValueZAR * 0.05;

      customsBreakdown = {
        fobValue: fobValueZAR,
        duties: customsDuties,
        vat,
      };
    }
  }

  return {
    customsDuties,
    vat,
    handlingFees,
    customsBreakdown,
    tradeAgreementInfo,
  };
}

/**
 * Generate unique quote ID
 */
function generateQuoteId(): string {
  return `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
