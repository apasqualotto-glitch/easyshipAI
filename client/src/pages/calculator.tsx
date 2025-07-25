import Header from "../components/header";
import Hero from "../components/hero";
import CalculatorForm from "../components/calculator-form";
import CostBreakdown from "../components/cost-breakdown";
import InfoCards from "../components/info-cards";
import IncotermsChat from "../components/incoterms-chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useState } from "react";
import { QuoteRequest } from "@shared/schema";

export default function Calculator() {
  const [quoteData, setQuoteData] = useState<QuoteRequest | null>(null);
  const [quoteResult, setQuoteResult] = useState<any>(null);

  const handleQuoteUpdate = (data: QuoteRequest) => {
    setQuoteData(data);
  };

  const handleQuoteResult = (result: any) => {
    setQuoteResult(result);
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
                <TabsTrigger value="incoterms">Incoterms Help</TabsTrigger>
              </TabsList>
              <TabsContent value="costs">
                <CostBreakdown 
                  quoteData={quoteData}
                  quoteResult={quoteResult}
                />
              </TabsContent>
              <TabsContent value="incoterms">
                <IncotermsChat selectedIncoterm={quoteData?.incoterm} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <InfoCards />
      </main>
    </div>
  );
}
