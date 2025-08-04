import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Ship, Truck, Package, DollarSign, FileText, Calendar, MapPin } from "lucide-react";
import CostBreakdown from "@/components/cost-breakdown";
import CarrierComparison from "@/components/carrier-comparison";

const formatCurrency = (amount: number) => {
  return `R ${amount.toLocaleString()}`;
};

interface QuoteData {
  id: string;
  originPort: string;
  destinationPort: string;
  deliveryAddress: string;
  containerType: string;
  cargoType: string;
  incoterm: string;
  weight: number;
  value: number;
  seaFreightCost: number;
  truckingCost: number;
  customsDuties: number;
  vat: number;
  handlingFees: number;
  totalCost: number;
  createdAt: string;
  freightForwarders?: Array<{
    provider: string;
    services: {
      customsClearance: number;
      portClearance: number;
      trucking: number;
    };
    documentation: number;
    insurance: number;
    totalCost: number;
  }>;
}

export default function QuoteResults() {
  const [, params] = useRoute("/quote/:id");
  const [, setLocation] = useLocation();
  const [carrierComparison, setCarrierComparison] = useState<any>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle both stored quotes and API fetched quotes
  useEffect(() => {
    const loadQuote = async () => {
      if (params?.id === 'latest') {
        // Load from session storage for immediate quotes
        const storedQuote = sessionStorage.getItem('latestQuote');
        if (storedQuote) {
          const parsedQuote = JSON.parse(storedQuote);
          setQuote(parsedQuote);
          setIsLoading(false);
          return;
        }
      } else if (params?.id) {
        // Load from API for saved quotes
        try {
          const response = await fetch(`/api/quotes/${params.id}`);
          if (response.ok) {
            const quoteData = await response.json();
            setQuote(quoteData);
          }
        } catch (error) {
          console.error('Failed to load quote:', error);
        }
      }
      setIsLoading(false);
    };

    loadQuote();
  }, [params?.id]);

  // Fetch carrier comparison when quote loads
  useEffect(() => {
    if (quote) {
      fetchCarrierComparison(quote);
    }
  }, [quote]);

  const fetchCarrierComparison = async (quoteData: QuoteData) => {
    try {
      const response = await fetch("/api/compare-carriers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteData),
      });
      
      if (response.ok) {
        const comparison = await response.json();
        setCarrierComparison(comparison);
      }
    } catch (error) {
      console.error("Failed to fetch carrier comparison:", error);
    }
  };

  const handleBookNow = (carrierName: string, freightForwarder?: string) => {
    const params = new URLSearchParams({
      quoteId: quote?.id || '',
      carrier: carrierName,
    });
    
    if (freightForwarder) {
      params.append('freightForwarder', freightForwarder);
    }
    
    setLocation(`/booking?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Quote Not Found</h1>
          <Button onClick={() => setLocation("/calculator")}>
            Get New Quote
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/calculator")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Calculator
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Shipping Quote</CardTitle>
                    <CardDescription>
                      Complete breakdown for your shipment
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    Quote #{quote.id.slice(-6).toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Route */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Ship className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Route</p>
                      <p className="text-sm text-gray-600">
                        {quote.originPort} → {quote.destinationPort}
                      </p>
                    </div>
                  </div>

                  {/* Container */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Container</p>
                      <p className="text-sm text-gray-600">
                        {quote.containerType} • {quote.weight.toLocaleString()} kg
                      </p>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">Final Delivery</p>
                      <p className="text-sm text-gray-600">
                        {quote.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <CostBreakdown 
              quoteData={{
                originPort: quote.originPort,
                destinationPort: quote.destinationPort,
                deliveryAddress: quote.deliveryAddress,
                containerType: quote.containerType,
                cargoType: quote.cargoType,
                incoterm: quote.incoterm,
                weight: quote.weight,
                value: quote.value,
              }}
              quoteResult={quote}
            />

            {/* Carrier Comparison */}
            {carrierComparison && (
              <CarrierComparison 
                rates={carrierComparison?.carrierRates || []}
                baseCost={quote.totalCost}
                containerType={quote.containerType}
                route={`${quote.originPort} → ${quote.destinationPort}`}
                quoteId={quote.id}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-600">
                    {formatCurrency(quote.totalCost)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    All-inclusive price
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sea Freight:</span>
                    <span className="font-medium">{formatCurrency(quote.seaFreightCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Trucking:</span>
                    <span className="font-medium">{formatCurrency(quote.truckingCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customs & VAT:</span>
                    <span className="font-medium">{formatCurrency(quote.customsDuties + quote.vat)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Handling:</span>
                    <span className="font-medium">{formatCurrency(quote.handlingFees)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Transit Time: 25-30 days</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>Incoterm: {quote.incoterm}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleBookNow("Ocean Carrier")}
                >
                  Book This Shipment
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  Quote valid for 7 days • Prices include all fees
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}