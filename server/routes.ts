import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { quoteRequestSchema } from "@shared/schema";
import { liveShippingService, type LiveRateRequest } from "./live-shipping-api";
import { carrierComparisonService, type ComparisonRequest } from "./carrier-comparison";
import { customsDatabase } from "./customs-database";
import { bookingService, type BookingRequest, type BookingResponse } from "./booking-service";

// Enhanced currency conversion service with multiple API sources
async function getCurrentExchangeRate(): Promise<{ rate: number; source: string; timestamp: string }> {
  try {
    // Try exchangerate-api.com first (reliable and free)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      if (data.rates?.ZAR) {
        return {
          rate: data.rates.ZAR,
          source: "exchangerate-api.com",
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    console.log('Primary exchange API failed, trying backup');
  }

  try {
    // Backup: exchangerate.host (no API key required)
    const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=ZAR');
    if (response.ok) {
      const data = await response.json();
      if (data.rates?.ZAR) {
        return {
          rate: data.rates.ZAR,
          source: "exchangerate.host",
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    console.log('Backup exchange API failed');
  }
  
  // Fallback exchange rate (USD to ZAR) - updated regularly
  console.warn('All exchange rate APIs unavailable, using fallback rate');
  return {
    rate: 18.2, // Current approximate rate as of 2025
    source: "fallback",
    timestamp: new Date().toISOString()
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all origin ports
  app.get("/api/ports/origin", async (req, res) => {
    try {
      const ports = await storage.getOriginPorts();
      res.json(ports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch origin ports" });
    }
  });

  // Get all destination ports (SA ports)
  app.get("/api/ports/destination", async (req, res) => {
    try {
      const ports = await storage.getDestinationPorts();
      res.json(ports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch destination ports" });
    }
  });

  // Get all final destinations
  app.get("/api/destinations", async (req, res) => {
    try {
      const destinations = await storage.getDestinations();
      res.json(destinations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch destinations" });
    }
  });

  // Get all cargo types
  app.get("/api/cargo-types", async (req, res) => {
    try {
      const cargoTypes = await storage.getCargoTypes();
      res.json(cargoTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cargo types" });
    }
  });

  // Get all incoterms
  app.get("/api/incoterms", async (req, res) => {
    try {
      const incoterms = await storage.getIncoterms();
      res.json(incoterms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch incoterms" });
    }
  });

  // Calculate shipping quote
  app.post("/api/calculate-quote", async (req, res) => {
    try {
      const validatedData = quoteRequestSchema.parse(req.body);
      
      // Find origin and destination ports
      const originPorts = await storage.getOriginPorts();
      const destinationPorts = await storage.getDestinationPorts();
      
      const originPort = originPorts.find(p => p.code === validatedData.originPort);
      const destinationPort = destinationPorts.find(p => p.code === validatedData.destinationPort);
      
      if (!originPort || !destinationPort) {
        return res.status(400).json({ message: "Invalid port selection" });
      }

      // Get route information
      const route = await storage.getRoute(originPort.id, destinationPort.id);
      if (!route) {
        return res.status(400).json({ message: "Route not available" });
      }

      // Get destination for trucking costs
      const destination = await storage.getDestination(validatedData.finalDestination);
      if (!destination) {
        return res.status(400).json({ message: "Invalid final destination" });
      }

      // Get cargo type for duty calculation - be flexible with advanced customs lookup
      let cargoType = await storage.getCargoType(validatedData.cargoType);
      if (!cargoType) {
        // If using advanced customs tariff, try to find a matching cargo type or use a default
        if (validatedData.customsTariff) {
          cargoType = await storage.getCargoType("Other") || await storage.getCargoType("General Cargo");
          if (!cargoType) {
            // Create a temporary cargo type for calculation purposes
            cargoType = {
              id: "temp",
              name: validatedData.cargoType,
              dutyRate: 0.15, // Default fallback rate
              additionalFees: 1000
            };
          }
        } else {
          return res.status(400).json({ message: "Invalid cargo type" });
        }
      }

      // Calculate base sea freight cost
      let baseSeaFreightCost = 0;
      switch (validatedData.containerType) {
        case "20ft":
          baseSeaFreightCost = route.seaFreightCost20ft;
          break;
        case "40ft":
          baseSeaFreightCost = route.seaFreightCost40ft;
          break;
        case "40ft-hc":
          baseSeaFreightCost = route.seaFreightCost40ftHC;
          break;
        case "partial":
          // For partial shipments, calculate based on volume
          const volume = validatedData.cargoVolume || 1; // Default to 1 CBM if not provided
          const baseRate = route.seaFreightCost20ft; // Use 20ft as base rate
          const partialMultiplier = Math.min(volume / 33, 1); // 33 CBM = full 20ft container
          baseSeaFreightCost = baseRate * partialMultiplier;
          break;
        default:
          return res.status(400).json({ message: "Invalid container type" });
      }

      // Apply Incoterm-based cost adjustments (will be calculated after exchange rate)
      let seaFreightCost = baseSeaFreightCost; // Default to base cost, will be adjusted below

      // Calculate trucking cost based on destination port
      let truckingCost = 0;
      switch (destinationPort.code) {
        case "ZADUR":
          truckingCost = destination.fromDurban;
          break;
        case "ZACPT":
          truckingCost = destination.fromCapeTown;
          break;
        case "ZAPEZ":
          truckingCost = destination.fromPortElizabeth;
          break;
        case "ZARBD":
          truckingCost = destination.fromRichardsBay;
          break;
        case "ZAELS":
          truckingCost = destination.fromEastLondon;
          break;
        case "ZAMOB":
          truckingCost = destination.fromMosselBay;
          break;
        case "ZASDB":
          truckingCost = destination.fromSaldanhaBay;
          break;
      }

      // Validate and get origin country from port information for trade agreement calculations
      const allOriginPorts = await storage.getOriginPorts();
      const selectedOriginPort = allOriginPorts.find(p => p.code === validatedData.originPort);
      
      if (!selectedOriginPort) {
        throw new Error(`Origin port ${validatedData.originPort} not found`);
      }
      
      const originCountry = selectedOriginPort.country;

      // Validate container weight limits
      const weightLimits = getContainerWeightLimits(validatedData.containerType);
      if (validatedData.weight > weightLimits.maxWeight) {
        throw new Error(`Cargo weight ${validatedData.weight}kg exceeds ${validatedData.containerType} container limit of ${weightLimits.maxWeight}kg`);
      }

      // Get current USD to ZAR exchange rate
      const exchangeRateData = await getCurrentExchangeRate();
      const usdToZarRate = exchangeRateData.rate;
      
      // Apply Incoterm-based cost adjustments now that we have the exchange rate
      const incotermAdjustments = calculateIncotermCosts(validatedData.incoterm, baseSeaFreightCost, validatedData.value, usdToZarRate);
      seaFreightCost = incotermAdjustments.seaFreightCostToBuyer;
      
      // SARS uses FOB (Free on Board) valuation method per WTO Customs Valuation Agreement
      // FOB excludes international shipping and insurance costs from customs value
      const fobValueUSD = validatedData.value; // User enters FOB value (cargo value only)
      const fobValueZAR = Math.round(fobValueUSD * usdToZarRate);
      
      // Calculate customs duties and VAT using correct SARS methodology
      let customsDuties, vat, handlingFees, customsExplanation, tradeAgreementInfo, customsBreakdown;
      
      // Determine if country is SACU member (no 10% markup)
      const sacuCountries = ["Botswana", "Lesotho", "Namibia", "Eswatini"];
      const isSacuCountry = sacuCountries.includes(originCountry);
      
      if (validatedData.customsTariff) {
        // Use advanced customs calculations with trade agreement rates
        const customsCalculation = customsDatabase.calculateDetailedCustomsCostByCountry(
          validatedData.customsTariff.hsCode, 
          fobValueZAR, 
          originCountry
        );
        
        if (!customsCalculation.error && customsCalculation.calculations && customsCalculation.tradeAgreement) {
          customsDuties = customsCalculation.calculations.customsDuty;
          vat = customsCalculation.calculations.vat;
          handlingFees = customsCalculation.calculations.additionalFees + (seaFreightCost * 0.05);
          customsExplanation = customsCalculation.tradeAgreement.description;
          tradeAgreementInfo = customsCalculation.tradeAgreement;
          customsBreakdown = {
            fobValueUSD,
            fobValueZAR,
            exchangeRate: usdToZarRate,
            dutyRate: customsCalculation.tradeAgreement.dutyRate,
            customsDuty: customsCalculation.calculations.customsDuty,
            markupApplied: !isSacuCountry,
            markupAmount: isSacuCountry ? 0 : fobValueZAR * 0.10,
            atvValue: customsCalculation.calculations.dutiableAmount,
            vatRate: 0.15,
            vat: customsCalculation.calculations.vat,
            formula: isSacuCountry 
              ? "VAT = (FOB Value + Duties) × 15%" 
              : "VAT = (FOB Value + 10% markup + Duties) × 15%"
          };
        } else {
          // Fallback to standard SARS calculation
          const dutyRate = validatedData.customsTariff.dutyRate;
          customsDuties = fobValueZAR * dutyRate;
          
          // SARS VAT Formula: [(FOB Value + 10% markup for non-SACU) + Duties] × 15%
          let atvValue; // Added Tax Value
          if (isSacuCountry) {
            atvValue = fobValueZAR + customsDuties;
          } else {
            atvValue = (fobValueZAR + (fobValueZAR * 0.10)) + customsDuties; // 10% markup for non-SACU
          }
          vat = atvValue * 0.15;
          
          handlingFees = incotermAdjustments.handlingFeesToBuyer || (validatedData.customsTariff.additionalFees + (seaFreightCost * 0.05));
          customsExplanation = validatedData.customsTariff.explanation;
          tradeAgreementInfo = {
            name: "Standard MFN",
            preferential: false,
            description: validatedData.customsTariff.explanation,
            dutyRate: dutyRate
          };
          
          customsBreakdown = {
            fobValueUSD,
            fobValueZAR,
            exchangeRate: usdToZarRate,
            dutyRate,
            customsDuty: customsDuties,
            markupApplied: !isSacuCountry,
            markupAmount: isSacuCountry ? 0 : fobValueZAR * 0.10,
            atvValue,
            vatRate: 0.15,
            vat,
            formula: isSacuCountry 
              ? "VAT = (FOB Value + Duties) × 15%" 
              : "VAT = (FOB Value + 10% markup + Duties) × 15%"
          };
        }
      } else {
        // Use basic cargo type calculations with proper SARS VAT formula
        const dutyRate = cargoType.dutyRate;
        customsDuties = fobValueZAR * dutyRate;
        
        // Apply SARS VAT calculation
        let atvValue;
        if (isSacuCountry) {
          atvValue = fobValueZAR + customsDuties;
        } else {
          atvValue = (fobValueZAR + (fobValueZAR * 0.10)) + customsDuties;
        }
        vat = atvValue * 0.15;
        
        handlingFees = incotermAdjustments.handlingFeesToBuyer || (cargoType.additionalFees + (seaFreightCost * 0.05));
        tradeAgreementInfo = {
          name: "Standard MFN",
          preferential: false,
          description: "No HS code selected - using cargo type rate",
          dutyRate: dutyRate
        };
        
        customsBreakdown = {
          fobValueUSD,
          fobValueZAR,
          exchangeRate: usdToZarRate,
          dutyRate,
          customsDuty: customsDuties,
          markupApplied: !isSacuCountry,
          markupAmount: isSacuCountry ? 0 : fobValueZAR * 0.10,
          atvValue,
          vatRate: 0.15,
          vat,
          formula: isSacuCountry 
            ? "VAT = (FOB Value + Duties) × 15%" 
            : "VAT = (FOB Value + 10% markup + Duties) × 15%"
        };
      }
      
      // Calculate total cost
      const totalCost = seaFreightCost + truckingCost + customsDuties + vat + handlingFees;

      const quote = {
        originPort: originPort.name,
        destinationPort: destinationPort.name,
        finalDestination: validatedData.finalDestination,
        deliveryAddress: validatedData.deliveryAddress || "",
        containerType: validatedData.containerType,
        cargoType: validatedData.cargoType,
        incoterm: validatedData.incoterm,
        weight: validatedData.weight,
        value: validatedData.value,
        valueZAR: fobValueZAR,
        seaFreightCost,
        truckingCost,
        customsDuties,
        vat,
        handlingFees,
        totalCost,
      };

      // Save quote to storage
      const savedQuote = await storage.createQuote(quote);

      res.json({
        ...quote,
        id: savedQuote.id,
        costPerKg: totalCost / validatedData.weight,
        transitDays: route.transitDays,
        originCountry,
        incotermExplanation: incotermAdjustments.incotermExplanation,
        // Include partial shipment details if applicable
        partialShipmentDetails: validatedData.containerType === "partial" ? {
          cargoVolume: validatedData.cargoVolume,
          packageCount: validatedData.packageCount,
          packageLength: validatedData.packageLength,
          packageWidth: validatedData.packageWidth,
          packageHeight: validatedData.packageHeight,
          specialHandling: validatedData.specialHandling,
          volumeUtilization: validatedData.cargoVolume ? `${((validatedData.cargoVolume / 33) * 100).toFixed(1)}%` : null,
          estimatedDeliveryTime: "Additional 1-2 days for consolidation",
          costSavings: `Approx ${(100 - ((validatedData.cargoVolume || 1) / 33) * 100).toFixed(0)}% vs full container`
        } : null,
        customsInfo: {
          hsCode: validatedData.customsTariff?.hsCode,
          dutyRate: tradeAgreementInfo?.dutyRate || (validatedData.customsTariff?.dutyRate) || cargoType.dutyRate,
          vatRate: 0.15,
          explanation: customsExplanation,
          isAdvancedCalculation: !!validatedData.customsTariff,
          tradeAgreement: tradeAgreementInfo,
          breakdown: customsBreakdown,
          exchangeRateInfo: exchangeRateData,
          calculationMethod: {
            description: "Official SARS calculation method",
            dutyFormula: "Customs Duty = FOB Value (ZAR) × Duty Rate",
            vatFormula: customsBreakdown?.formula || "VAT = (CIF Value + 10% markup + Duties) × 15%",
            sacuExemption: isSacuCountry ? "SACU country - no 10% markup applied" : "Non-SACU country - 10% markup applied",
            notes: [
              `FOB Value converted from USD ${fobValueUSD.toLocaleString()} to ZAR ${fobValueZAR.toLocaleString()} at rate ${usdToZarRate.toFixed(4)}`,
              "SARS uses FOB (Free on Board) valuation per WTO Customs Valuation Agreement",
              "FOB excludes international shipping and insurance costs from customs value",
              "VAT rate is 15% as per SARS regulations",
              isSacuCountry ? "SACU members exempt from 10% markup" : "10% markup applied to non-SACU imports",
              "All calculations follow official SARS methodology"
            ]
          }
        }
      });

    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to calculate quote" });
      }
    }
  });

  // Get live shipping rates from carriers
  app.post("/api/live-rates", async (req, res) => {
    try {
      const { originPort, destinationPort, containerType, weight, departure } = req.body;
      
      if (!originPort || !destinationPort || !containerType) {
        return res.status(400).json({ message: "Missing required fields: originPort, destinationPort, containerType" });
      }

      // Validate weight if provided
      if (weight && weight <= 0) {
        return res.status(400).json({ message: "Weight must be greater than 0" });
      }

      // Ensure all cargo data is passed for accurate rate calculation
      const liveRateRequest: LiveRateRequest = {
        fromPort: originPort,
        toPort: destinationPort, 
        containerType,
        weight: weight || 1000, // Use actual weight or reasonable default
        value: req.body.value, // Include cargo value for partial shipments
        departure,
        cargoType: req.body.cargoType // Include cargo type for specialized handling
      };

      const liveRates = await liveShippingService.getAllRates(liveRateRequest);
      
      res.json({
        rates: liveRates,
        source: "live",
        timestamp: new Date().toISOString(),
        message: liveRates.length > 0 ? `Found ${liveRates.length} live rates` : "No live rates available, using estimates"
      });

    } catch (error) {
      console.error("Live rates error:", error);
      res.status(500).json({ 
        message: "Failed to fetch live rates",
        rates: [],
        source: "error"
      });
    }
  });

  // Enhanced quote calculation with live rates integration
  app.post("/api/calculate-quote-with-live", async (req, res) => {
    try {
      const validatedData = quoteRequestSchema.parse(req.body);
      
      // Get standard quote calculation
      const standardQuoteResponse = await fetch("http://localhost:5000/api/calculate-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(validatedData)
      });

      if (!standardQuoteResponse.ok) {
        throw new Error("Failed to calculate standard quote");
      }

      const standardQuote = await standardQuoteResponse.json();

      // Try to get live rates with complete cargo information
      const liveRateRequest: LiveRateRequest = {
        fromPort: validatedData.originPort,
        toPort: validatedData.destinationPort,
        containerType: validatedData.containerType,
        weight: validatedData.weight, // Pass actual weight for accurate rates
        value: validatedData.value, // Pass cargo value for insurance
        cargoType: validatedData.cargoType // Pass cargo type for specialized handling
      };

      const liveRates = await liveShippingService.getAllRates(liveRateRequest);
      
      let enhancedQuote = { ...standardQuote };

      if (liveRates.length > 0) {
        // Use the best live rate for sea freight
        const bestRate = liveRates[0];
        
        // Convert USD to ZAR (using current exchange rate)
        const exchangeRateData = await getCurrentExchangeRate();
        const usdToZarRate = exchangeRateData.rate;
        const liveSeaFreightZAR = bestRate.currency === 'USD' 
          ? bestRate.rate * usdToZarRate 
          : bestRate.rate;
        
        // Recalculate total with live sea freight rate in ZAR
        const difference = liveSeaFreightZAR - standardQuote.seaFreightCost;
        enhancedQuote = {
          ...standardQuote,
          seaFreightCost: liveSeaFreightZAR,
          totalCost: standardQuote.totalCost + difference,
          costPerKg: (standardQuote.totalCost + difference) / validatedData.weight,
          liveRateInfo: {
            carrier: bestRate.carrier,
            service: bestRate.service,
            currency: 'ZAR', // Always convert to ZAR
            originalCurrency: bestRate.currency,
            originalRate: bestRate.rate,
            exchangeRate: usdToZarRate,
            transitTime: bestRate.transitTime,
            validUntil: bestRate.validUntil,
            savings: -difference // Negative means more expensive, positive means savings
          },
          availableLiveRates: liveRates
        };
      }

      res.json({
        ...enhancedQuote,
        hasLiveRates: liveRates.length > 0,
        rateSource: liveRates.length > 0 ? "live" : "estimate"
      });

    } catch (error) {
      console.error("Enhanced quote calculation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to calculate enhanced quote" });
      }
    }
  });

  // Compare rates across multiple carriers
  app.post("/api/compare-carriers", async (req, res) => {
    try {
      const validatedData = quoteRequestSchema.parse(req.body);
      
      // Get base quote first
      const baseQuoteResponse = await fetch("http://localhost:5000/api/calculate-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(validatedData)
      });

      if (!baseQuoteResponse.ok) {
        throw new Error("Failed to calculate base quote");
      }

      const baseQuote = await baseQuoteResponse.json();

      // Get carrier comparison
      const comparisonRequest: ComparisonRequest = {
        quoteData: validatedData,
        baseQuote
      };

      const carrierRates = await carrierComparisonService.compareRates(comparisonRequest);

      res.json({
        baseQuote,
        carrierRates,
        totalCarriers: carrierRates.length,
        bestRate: carrierRates[0],
        route: `${validatedData.originPort} → ${validatedData.destinationPort}`,
        containerType: validatedData.containerType,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Carrier comparison error:", error);
      res.status(500).json({ 
        message: "Failed to compare carrier rates",
        carrierRates: []
      });
    }
  });

  // Validate quote data consistency before processing
  app.post("/api/validate-quote", async (req, res) => {
    try {
      const validatedData = quoteRequestSchema.parse(req.body);
      
      // Comprehensive validation checks
      const validationResults = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        dataConsistency: {
          weight: validatedData.weight,
          value: validatedData.value,
          containerType: validatedData.containerType,
          weightLimits: getContainerWeightLimits(validatedData.containerType),
          exceedsLimit: false
        }
      };

      // Check weight limits for container type
      const weightLimits = getContainerWeightLimits(validatedData.containerType);
      if (validatedData.weight > weightLimits.maxWeight) {
        validationResults.errors.push(`Weight ${validatedData.weight}kg exceeds ${validatedData.containerType} limit of ${weightLimits.maxWeight}kg`);
        validationResults.isValid = false;
        validationResults.dataConsistency.exceedsLimit = true;
      }

      // Check cargo value reasonableness
      const valuePerKg = validatedData.value / validatedData.weight;
      if (valuePerKg < 0.5) {
        validationResults.warnings.push(`Cargo value seems low (R${valuePerKg.toFixed(2)}/kg). Please verify.`);
      }
      if (valuePerKg > 1000) {
        validationResults.warnings.push(`Cargo value seems high (R${valuePerKg.toFixed(2)}/kg). Consider increased insurance.`);
      }

      // Verify port connectivity
      const originPorts = await storage.getOriginPorts();
      const destinationPorts = await storage.getDestinationPorts();
      
      const originExists = originPorts.find(p => p.code === validatedData.originPort);
      const destinationExists = destinationPorts.find(p => p.code === validatedData.destinationPort);
      
      if (!originExists) {
        validationResults.errors.push(`Origin port ${validatedData.originPort} not found`);
        validationResults.isValid = false;
      }
      if (!destinationExists) {
        validationResults.errors.push(`Destination port ${validatedData.destinationPort} not found`);
        validationResults.isValid = false;
      }

      // Check route availability
      if (originExists && destinationExists) {
        const route = await storage.getRoute(originExists.id, destinationExists.id);
        if (!route) {
          validationResults.warnings.push(`No direct route found from ${originExists.name} to ${destinationExists.name}. Using estimate.`);
        }
      }

      res.json({
        ...validationResults,
        message: validationResults.isValid ? "Quote data is valid" : "Quote data has errors",
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ 
          isValid: false,
          errors: [error.message],
          message: "Data validation failed"
        });
      } else {
        res.status(500).json({ 
          isValid: false,
          errors: ["Unknown validation error"],
          message: "Validation service error"
        });
      }
    }
  });

  function getContainerWeightLimits(containerType: string) {
    const limits = {
      "20ft": { maxWeight: 28080, volume: 33.1 },
      "40ft": { maxWeight: 26680, volume: 67.5 },
      "40ft-hc": { maxWeight: 26680, volume: 76.0 }
    };
    return limits[containerType as keyof typeof limits] || { maxWeight: 20000, volume: 30 };
  }

  // Get trade agreement rates for specific HS code
  app.get("/api/trade-agreements/:hsCode", async (req, res) => {
    try {
      const hsCode = req.params.hsCode;
      const rates = customsDatabase.getTradeAgreementRates(hsCode);
      
      res.json({
        hsCode,
        tradeAgreementRates: rates,
        availableCountries: rates.map(r => r.country),
        preferentialCountries: rates.filter(r => r.preferential).map(r => r.country)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trade agreement rates" });
    }
  });

  // Get duty rate for specific country and HS code
  app.post("/api/duty-rate", async (req, res) => {
    try {
      const { hsCode, originCountry } = req.body;
      
      if (!hsCode || !originCountry) {
        return res.status(400).json({ message: "HS code and origin country are required" });
      }

      const dutyInfo = customsDatabase.getDutyRateByCountry(hsCode, originCountry);
      
      res.json({
        hsCode,
        originCountry,
        ...dutyInfo
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate duty rate" });
    }
  });

  // Helper function to find best cargo type match
  function findBestCargoTypeMatch(customsCategory: string, cargoTypes: any[]) {
    const categoryMappings: { [key: string]: string } = {
      'Electronics': 'Electronics',
      'Textiles': 'Textiles',
      'Machinery': 'Machinery',
      'Food Products': 'Food & Beverages',
      'Cosmetics': 'Personal Care Products',
      'Automotive': 'Automotive Parts',
      'Chemicals': 'Chemicals',
      'Pharmaceuticals': 'Medical Equipment'
    };
    
    const targetName = categoryMappings[customsCategory] || 'General Cargo';
    return cargoTypes.find(ct => ct.name === targetName)?.name || 'General Cargo';
  }

  // Unified cargo search endpoint - combines cargo types and customs lookup
  app.post("/api/cargo/search", async (req, res) => {
    try {
      const { searchTerm } = req.body;
      
      if (!searchTerm || searchTerm.trim() === "") {
        return res.status(400).json({ error: "Search term is required" });
      }
      
      const term = searchTerm.trim();
      
      // Search both cargo types and customs database
      const cargoTypes = await storage.getCargoTypes();
      const customsResults = customsDatabase.searchByDescription(term);
      
      // Match cargo types by name (fuzzy matching)
      const matchingCargoTypes = cargoTypes.filter(cargo => 
        cargo.name.toLowerCase().includes(term.toLowerCase()) ||
        term.toLowerCase().includes(cargo.name.toLowerCase())
      );
      
      // Combine results with preference for specific HS codes
      const combinedResults = [
        // HS code results with full customs details (higher priority)
        ...customsResults.map((customs: any) => ({
          type: 'customs',
          id: customs.hsCode,
          name: customs.description,
          searchValue: customs.hsCode,
          category: customs.category,
          dutyRate: customs.dutyRate,
          additionalFees: customs.additionalFees,
          vatRate: customs.vatRate,
          explanation: customs.explanation,
          examples: customs.examples,
          hsCode: customs.hsCode,
          isSpecific: true,
          searchScore: customs.searchScore || 1.0,
          displayText: `${customs.hsCode} - ${customs.description}`,
          subtitle: `Duty: ${(customs.dutyRate * 100).toFixed(1)}% | ${customs.category}`,
          cargoTypeEquivalent: findBestCargoTypeMatch(customs.category, cargoTypes)
        })),
        // Cargo type results as fallback (lower priority)
        ...matchingCargoTypes.map(cargo => ({
          type: 'cargo',
          id: cargo.id,
          name: cargo.name,
          searchValue: cargo.name,
          category: 'General Category',
          dutyRate: cargo.dutyRate,
          additionalFees: cargo.additionalFees,
          vatRate: 0.15,
          explanation: `Standard cargo classification for ${cargo.name}`,
          examples: [cargo.name],
          isSpecific: false,
          searchScore: 0.5,
          displayText: cargo.name,
          subtitle: `Duty: ${(cargo.dutyRate * 100).toFixed(1)}% | General Category`
        }))
      ].sort((a, b) => b.searchScore - a.searchScore);
      
      res.json(combinedResults);
    } catch (error) {
      console.error("Cargo search error:", error);
      res.status(500).json({ error: "Failed to search cargo database" });
    }
  });

  // Search customs tariffs (legacy endpoint - kept for compatibility)
  app.post("/api/customs/search", async (req, res) => {
    try {
      const { searchTerm } = req.body;
      
      if (!searchTerm || typeof searchTerm !== 'string') {
        return res.status(400).json({ message: "Search term is required" });
      }

      const results = customsDatabase.searchByDescription(searchTerm);
      res.json(results);

    } catch (error) {
      console.error("Customs search error:", error);
      res.status(500).json({ message: "Failed to search customs database" });
    }
  });

  // Calculate detailed customs costs
  app.post("/api/customs/calculate", async (req, res) => {
    try {
      const { hsCode, cifValue } = req.body;
      
      if (!hsCode || !cifValue || cifValue <= 0) {
        return res.status(400).json({ message: "HS Code and CIF value are required" });
      }

      const calculation = customsDatabase.calculateDetailedCustomsCost(hsCode, cifValue);
      res.json(calculation);

    } catch (error) {
      console.error("Customs calculation error:", error);
      res.status(500).json({ message: "Failed to calculate customs costs" });
    }
  });

  // Get customs categories
  app.get("/api/customs/categories", async (req, res) => {
    try {
      const categories = customsDatabase.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Categories fetch error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get search suggestions
  app.post("/api/customs/suggestions", async (req, res) => {
    try {
      const { searchTerm } = req.body;
      
      if (!searchTerm || typeof searchTerm !== 'string') {
        return res.status(400).json({ message: "Search term is required" });
      }

      const suggestions = customsDatabase.getSearchSuggestions(searchTerm);
      res.json(suggestions);

    } catch (error) {
      console.error("Suggestions fetch error:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Get current USD to ZAR exchange rate
  app.get("/api/exchange-rate/usd-zar", async (req, res) => {
    try {
      const exchangeRateData = await getCurrentExchangeRate();
      res.json(exchangeRateData);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch exchange rate", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create booking with carrier
  app.post("/api/bookings/create", async (req, res) => {
    try {
      const bookingRequest: BookingRequest = req.body;
      
      // Validate required fields
      if (!bookingRequest.quoteId || !bookingRequest.carrierCode || !bookingRequest.shipper || !bookingRequest.consignee) {
        return res.status(400).json({ 
          message: "Missing required fields: quoteId, carrierCode, shipper, consignee" 
        });
      }

      const bookingResponse = await bookingService.createBooking(bookingRequest);
      
      res.json(bookingResponse);

    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(500).json({ 
        message: "Failed to create booking", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get booking status
  app.get("/api/bookings/:carrierCode/:bookingReference/status", async (req, res) => {
    try {
      const { carrierCode, bookingReference } = req.params;
      
      const status = await bookingService.getBookingStatus(carrierCode, bookingReference);
      res.json(status);

    } catch (error) {
      console.error("Booking status error:", error);
      res.status(500).json({ 
        message: "Failed to fetch booking status", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get available carriers for booking
  app.get("/api/bookings/carriers", async (req, res) => {
    try {
      const carriers = [
        {
          code: 'MAEU',
          name: 'Maersk Line',
          description: 'World\'s largest container shipping company',
          apiStatus: process.env.MAERSK_API_KEY ? 'AVAILABLE' : 'SETUP_REQUIRED',
          services: ['FCL', 'LCL'],
          coverage: 'Global',
          bookingSupport: true
        },
        {
          code: 'MSCU',
          name: 'Mediterranean Shipping Company',
          description: 'Global container shipping leader',
          apiStatus: process.env.MSC_API_KEY ? 'AVAILABLE' : 'SETUP_REQUIRED',
          services: ['FCL', 'LCL'],
          coverage: 'Global',
          bookingSupport: true
        },
        {
          code: 'CMDU',
          name: 'CMA CGM',
          description: 'Leading worldwide shipping group',
          apiStatus: 'COMING_SOON',
          services: ['FCL', 'LCL'],
          coverage: 'Global',
          bookingSupport: false
        },
        {
          code: 'COSU',
          name: 'COSCO Shipping',
          description: 'Chinese global shipping company',
          apiStatus: 'COMING_SOON',
          services: ['FCL'],
          coverage: 'Global',
          bookingSupport: false
        }
      ];
      
      res.json(carriers);

    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch carrier information" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Incoterm cost calculation function
function calculateIncotermCosts(incoterm: string, baseSeaFreightCost: number, cargoValueUSD: number, exchangeRate: number) {
  const cargoValueZAR = cargoValueUSD * exchangeRate;
  const insuranceCost = Math.round(cargoValueZAR * 0.003); // Standard 0.3% insurance rate
  
  switch (incoterm.toUpperCase()) {
    case 'EXW': // Ex Works - Buyer pays everything including local transport
      return {
        seaFreightCostToBuyer: baseSeaFreightCost + 3000, // Add local transport costs
        handlingFeesToBuyer: baseSeaFreightCost * 0.08, // Higher handling as buyer manages everything
        insuranceCostToBuyer: insuranceCost,
        incotermExplanation: "EXW: You pay all transportation costs including local pickup, export clearance, and sea freight. Highest buyer responsibility.",
        additionalCosts: { localTransport: 3000, exportClearance: 1500 }
      };
      
    case 'FOB': // Free on Board - Current baseline (buyer pays sea freight only)
      return {
        seaFreightCostToBuyer: baseSeaFreightCost,
        handlingFeesToBuyer: baseSeaFreightCost * 0.05,
        insuranceCostToBuyer: insuranceCost,
        incotermExplanation: "FOB: Seller delivers to port. You pay sea freight, insurance, and import costs. Standard choice for importers.",
        additionalCosts: {}
      };
      
    case 'CFR': // Cost and Freight - Seller pays sea freight, buyer pays insurance
      return {
        seaFreightCostToBuyer: 0, // Seller pays sea freight
        handlingFeesToBuyer: baseSeaFreightCost * 0.03,
        insuranceCostToBuyer: insuranceCost,
        incotermExplanation: "CFR: Seller pays sea freight. You pay insurance and import costs. Good for cost predictability.",
        additionalCosts: {}
      };
      
    case 'CIF': // Cost, Insurance, and Freight - Seller pays both
      return {
        seaFreightCostToBuyer: 0, // Seller pays sea freight
        handlingFeesToBuyer: baseSeaFreightCost * 0.03,
        insuranceCostToBuyer: 0, // Seller pays basic insurance
        incotermExplanation: "CIF: Seller pays sea freight and insurance. You only pay import duties and local delivery. Convenient but typically more expensive overall.",
        additionalCosts: {}
      };
      
    case 'DDP': // Delivered Duty Paid - Seller pays almost everything
      return {
        seaFreightCostToBuyer: 0,
        handlingFeesToBuyer: 1000, // Minimal handling fees
        insuranceCostToBuyer: 0,
        incotermExplanation: "DDP: Seller handles everything including duties and delivery. You pay the highest product price but minimal logistics costs.",
        additionalCosts: {}
      };
      
    default: // Default to FOB behavior
      return {
        seaFreightCostToBuyer: baseSeaFreightCost,
        handlingFeesToBuyer: baseSeaFreightCost * 0.05,
        insuranceCostToBuyer: insuranceCost,
        incotermExplanation: "Standard terms applied. FOB equivalent - you pay sea freight and import costs.",
        additionalCosts: {}
      };
  }
}
