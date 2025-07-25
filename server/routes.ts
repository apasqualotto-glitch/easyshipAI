import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { quoteRequestSchema } from "@shared/schema";
import { liveShippingService, type LiveRateRequest } from "./live-shipping-api";
import { carrierComparisonService, type ComparisonRequest } from "./carrier-comparison";
import { customsDatabase } from "./customs-database";

// Currency conversion service
async function getCurrentExchangeRate(): Promise<number> {
  try {
    // Use a free exchange rate API (exchangerate-api.com)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      return data.rates?.ZAR || 18.5; // Fallback to ~18.5 if API fails
    }
  } catch (error) {
    console.warn('Exchange rate API unavailable, using fallback rate:', error);
  }
  
  // Fallback exchange rate (USD to ZAR)
  return 18.5;
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

      // Calculate costs
      let seaFreightCost = 0;
      switch (validatedData.containerType) {
        case "20ft":
          seaFreightCost = route.seaFreightCost20ft;
          break;
        case "40ft":
          seaFreightCost = route.seaFreightCost40ft;
          break;
        case "40ft-hc":
          seaFreightCost = route.seaFreightCost40ftHC;
          break;
      }

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

      // Use advanced customs tariff with country-specific rates if provided
      let customsDuties, vat, handlingFees, customsExplanation, tradeAgreementInfo;
      
      if (validatedData.customsTariff) {
        // Use advanced customs calculations with trade agreement rates
        const customsCalculation = customsDatabase.calculateDetailedCustomsCostByCountry(
          validatedData.customsTariff.hsCode, 
          validatedData.value, 
          originCountry
        );
        
        if (!customsCalculation.error && customsCalculation.calculations && customsCalculation.tradeAgreement) {
          customsDuties = customsCalculation.calculations.customsDuty;
          vat = customsCalculation.calculations.vat;
          handlingFees = customsCalculation.calculations.additionalFees + (seaFreightCost * 0.05);
          customsExplanation = customsCalculation.tradeAgreement.description;
          tradeAgreementInfo = customsCalculation.tradeAgreement;
        } else {
          // Fallback to standard calculation
          customsDuties = validatedData.value * validatedData.customsTariff.dutyRate;
          vat = validatedData.customsTariff.vatRate > 0 
            ? (validatedData.value + customsDuties) * validatedData.customsTariff.vatRate 
            : 0;
          handlingFees = validatedData.customsTariff.additionalFees + (seaFreightCost * 0.05);
          customsExplanation = validatedData.customsTariff.explanation;
        }
      } else {
        // Use basic cargo type calculations (no trade agreement benefits)
        customsDuties = validatedData.value * cargoType.dutyRate;
        vat = (validatedData.value + customsDuties) * 0.15;
        handlingFees = cargoType.additionalFees + (seaFreightCost * 0.05);
        tradeAgreementInfo = {
          name: "Standard MFN",
          preferential: false,
          description: "No HS code selected - using cargo type rate",
          dutyRate: cargoType.dutyRate
        };
      }
      
      // Calculate total cost
      const totalCost = seaFreightCost + truckingCost + customsDuties + vat + handlingFees;

      const quote = {
        originPort: originPort.name,
        destinationPort: destinationPort.name,
        finalDestination: validatedData.finalDestination,
        deliveryAddress: validatedData.deliveryAddress,
        containerType: validatedData.containerType,
        cargoType: validatedData.cargoType,
        incoterm: validatedData.incoterm,
        weight: validatedData.weight,
        value: validatedData.value,
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
        customsInfo: validatedData.customsTariff ? {
          hsCode: validatedData.customsTariff.hsCode,
          dutyRate: tradeAgreementInfo?.dutyRate || validatedData.customsTariff.dutyRate,
          vatRate: validatedData.customsTariff.vatRate,
          explanation: customsExplanation,
          isAdvancedCalculation: true,
          tradeAgreement: tradeAgreementInfo
        } : {
          isAdvancedCalculation: false,
          tradeAgreement: tradeAgreementInfo
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
        value: undefined, // Add cargo value if available
        departure,
        cargoType: undefined // Add cargo type if available
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
        
        // Convert USD to ZAR (using current exchange rate ~18.5 ZAR per USD)
        const usdToZarRate = await getCurrentExchangeRate();
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

  // Search customs tariffs
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

  const httpServer = createServer(app);
  return httpServer;
}
