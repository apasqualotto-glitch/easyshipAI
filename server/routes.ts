import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { quoteRequestSchema } from "@shared/schema";
import { liveShippingService, type LiveRateRequest } from "./live-shipping-api";
import { carrierComparisonService, type ComparisonRequest } from "./carrier-comparison";

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

      // Get cargo type for duty calculation
      const cargoType = await storage.getCargoType(validatedData.cargoType);
      if (!cargoType) {
        return res.status(400).json({ message: "Invalid cargo type" });
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

      // Calculate customs duties
      const customsDuties = validatedData.value * cargoType.dutyRate;
      
      // Calculate VAT (15% on cargo value + duties)
      const vat = (validatedData.value + customsDuties) * 0.15;
      
      // Calculate handling fees
      const handlingFees = cargoType.additionalFees + (seaFreightCost * 0.05); // 5% of sea freight
      
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

      const liveRateRequest: LiveRateRequest = {
        fromPort: originPort,
        toPort: destinationPort, 
        containerType,
        weight,
        departure
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

      // Try to get live rates
      const liveRateRequest: LiveRateRequest = {
        fromPort: validatedData.originPort,
        toPort: validatedData.destinationPort,
        containerType: validatedData.containerType,
        weight: validatedData.weight
      };

      const liveRates = await liveShippingService.getAllRates(liveRateRequest);
      
      let enhancedQuote = { ...standardQuote };

      if (liveRates.length > 0) {
        // Use the best live rate for sea freight
        const bestRate = liveRates[0];
        const liveSeaFreight = bestRate.rate;
        
        // Recalculate total with live sea freight rate
        const difference = liveSeaFreight - standardQuote.seaFreightCost;
        enhancedQuote = {
          ...standardQuote,
          seaFreightCost: liveSeaFreight,
          totalCost: standardQuote.totalCost + difference,
          costPerKg: (standardQuote.totalCost + difference) / validatedData.weight,
          liveRateInfo: {
            carrier: bestRate.carrier,
            service: bestRate.service,
            currency: bestRate.currency,
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

  const httpServer = createServer(app);
  return httpServer;
}
