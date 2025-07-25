import Header from "../components/header";
import Hero from "../components/hero";
import CalculatorForm from "../components/calculator-form";
import CostBreakdown from "../components/cost-breakdown";
import InfoCards from "../components/info-cards";
import IncotermsChat from "../components/incoterms-chat";
import LiveRatesInfo from "../components/live-rates-info";
import CarrierComparison from "../components/carrier-comparison";
import CustomsLookup from "../components/customs-lookup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useState } from "react";
import { QuoteRequest } from "@shared/schema";

export default function Calculator() {
  const [quoteData, setQuoteData] = useState<QuoteRequest | null>(null);
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [carrierComparison, setCarrierComparison] = useState<any>(null);

  const handleQuoteUpdate = (data: QuoteRequest) => {
    setQuoteData(data);
  };

  const handleQuoteResult = (result: any) => {
    setQuoteResult(result);
    // Automatically fetch carrier comparison when we get a quote result
    if (quoteData) {
      fetchCarrierComparison(quoteData);
    }
  };

  const fetchCarrierComparison = async (data: QuoteRequest) => {
    try {
      const response = await fetch("/api/compare-carriers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const comparison = await response.json();
        setCarrierComparison(comparison);
      }
    } catch (error) {
      console.error("Failed to fetch carrier comparison:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Hero />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CalculatorForm 
              onQuoteUpdate={handleQuoteUpdate}
              onQuoteResult={handleQuoteResult}
            />
          </div>
          
          <div className="lg:col-span-1">
            <Tabs defaultValue="costs" className="w-full">
              <TabsList className="grid w-full grid-cols-5 text-xs">
                <TabsTrigger value="costs" className={quoteResult ? "bg-green-100 text-green-800" : ""}>
                  Costs {quoteResult && "✓"}
                </TabsTrigger>
                <TabsTrigger value="compare" className={carrierComparison ? "bg-blue-100 text-blue-800" : ""}>
                  Compare {carrierComparison && "✓"}
                </TabsTrigger>
                <TabsTrigger value="customs">Customs</TabsTrigger>
                <TabsTrigger value="incoterms">Incoterms</TabsTrigger>
                <TabsTrigger value="carriers">Carriers</TabsTrigger>
              </TabsList>
              <TabsContent value="costs">
                <CostBreakdown 
                  quoteData={quoteData}
                  quoteResult={quoteResult}
                />
              </TabsContent>
              <TabsContent value="compare">
                <CarrierComparison 
                  rates={carrierComparison?.carrierRates || []}
                  baseCost={quoteResult?.totalCost || 0}
                  containerType={quoteData?.containerType || ""}
                  route={carrierComparison?.route || ""}
                  quoteId={quoteResult?.id}
                />
              </TabsContent>
              <TabsContent value="customs">
                <CustomsLookup />
              </TabsContent>
              <TabsContent value="incoterms">
                <IncotermsChat selectedIncoterm={quoteData?.incoterm} />
              </TabsContent>
              <TabsContent value="carriers">
                <LiveRatesInfo />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <InfoCards />
      </main>
    </div>
  );
}
