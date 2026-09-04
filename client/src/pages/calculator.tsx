import Hero from "../components/hero";
import CalculatorForm from "../components/calculator-form";
import CostBreakdown from "../components/cost-breakdown";
import InfoCards from "../components/info-cards";
import IncotermsChat from "../components/incoterms-chat";
import LiveRatesInfo from "../components/live-rates-info";
import CarrierComparison from "../components/carrier-comparison";
import CustomsLookup from "../components/customs-lookup";
import { AIChatInterface } from "../components/ai-chat-interface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useState } from "react";
import { QuoteRequest } from "@shared/schema";

export default function Calculator() {
  const [quoteData, setQuoteData] = useState<QuoteRequest | null>(null);
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [carrierComparison, setCarrierComparison] = useState<any>(null);
  const [formValues, setFormValues] = useState<Partial<QuoteRequest>>({});
  const [resetTrigger, setResetTrigger] = useState(0);

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

  // Callback to receive extracted data from AI chat
  const handleAIChatExtraction = (extractedData: Partial<QuoteRequest>) => {
    console.log('📝 AI Chat extracted:', extractedData);
    setFormValues(extractedData);
  };

  // Reset function to clear both chat and form
  const handleReset = () => {
    setFormValues({});
    setQuoteData(null);
    setQuoteResult(null);
    setCarrierComparison(null);
    setResetTrigger(prev => prev + 1); // Trigger form reset
    console.log('🔄 Reset chat conversation and calculator form');
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <Hero />
        
        {/* AI Chat Interface directly in the page flow - Recommended starting point for easy quotes */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-blue-700">💡 Recommended: Start here for instant quotes with minimal info</span>
          </div>
          <AIChatInterface 
            context="calculator" 
            onExtractedData={handleAIChatExtraction}
            onReset={handleReset}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CalculatorForm 
              onQuoteUpdate={handleQuoteUpdate}
              onQuoteResult={handleQuoteResult}
              initialValues={formValues}
              resetTrigger={resetTrigger}
            />
          </div>
          
          <div className="lg:col-span-1">
            <Tabs defaultValue="costs" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 h-auto text-xs flex-wrap">
                <TabsTrigger value="costs" className={quoteResult ? "bg-green-100 text-green-800" : ""}>
                  Costs {quoteResult && "✓"}
                </TabsTrigger>
                <TabsTrigger value="compare" className={carrierComparison ? "bg-blue-100 text-blue-800" : ""}>
                  Compare {carrierComparison && "✓"}
                </TabsTrigger>
                <TabsTrigger value="customs">Customs</TabsTrigger>
                <TabsTrigger value="incoterms">Who pays / risk (Incoterms)</TabsTrigger>
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
                  rateSource={carrierComparison?.rateSource === 'live' && (carrierComparison?.carrierRates?.length || 0) >= 1 ? 'live' : 'estimate'}
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
