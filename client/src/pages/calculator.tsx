import Header from "../components/header";
import Hero from "../components/hero";
import CalculatorForm from "../components/calculator-form";
import CostBreakdown from "../components/cost-breakdown";
import InfoCards from "../components/info-cards";
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
            <CostBreakdown 
              quoteData={quoteData}
              quoteResult={quoteResult}
            />
          </div>
        </div>

        <InfoCards />
      </main>
    </div>
  );
}
