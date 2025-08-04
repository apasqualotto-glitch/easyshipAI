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
      // Extract request data with port codes
      const requestData = quoteData.requestData || {
        originPort: quoteData.originPort,
        destinationPort: quoteData.destinationPort,
        containerType: quoteData.containerType,
        cargoValue: quoteData.value,
        weight: quoteData.weight,
      };

      const response = await fetch("/api/compare-carriers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      if (response.ok) {
        const comparison = await response.json();
        setCarrierComparison(comparison);
      } else {
        console.error("Carrier comparison failed:", await response.text());
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

        {/* Original Sidebar Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Carrier Comparison - Show loading or error state */}
            {carrierComparison ? (
              <CarrierComparison 
                rates={carrierComparison?.carrierRates || []}
                baseCost={quote.totalCost}
                containerType={quote.containerType}
                route={`${quote.originPort} → ${quote.destinationPort}`}
                quoteId={quote.id}
              />
            ) : (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Carrier Options</CardTitle>
                  <CardDescription>
                    Loading carrier rates... If this takes too long, carrier comparison may be temporarily unavailable.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Cost Breakdown - Original Sidebar Style */}
          <div className="lg:col-span-1">
            <CostBreakdown 
              quoteData={quote.requestData || {
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
          </div>
        </div>
      </div>
    </div>
  );
}