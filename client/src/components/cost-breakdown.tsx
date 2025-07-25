import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type QuoteRequest } from "@shared/schema";

interface CostBreakdownProps {
  quoteData: QuoteRequest | null;
  quoteResult: any;
}

export default function CostBreakdown({ quoteData, quoteResult }: CostBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-material sticky top-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center">
                <span className="material-icons text-primary-500 text-sm mr-2">directions_boat</span>
                <span className="text-sm text-gray-700">Sea Freight</span>
              </div>
              <span className="text-sm font-medium">
                {quoteResult ? formatCurrency(quoteResult.seaFreightCost) : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center">
                <span className="material-icons text-primary-500 text-sm mr-2">local_shipping</span>
                <span className="text-sm text-gray-700">Trucking</span>
              </div>
              <span className="text-sm font-medium">
                {quoteResult ? formatCurrency(quoteResult.truckingCost) : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center">
                <span className="material-icons text-secondary-500 text-sm mr-2">account_balance</span>
                <span className="text-sm text-gray-700">Customs Duties</span>
              </div>
              <span className="text-sm font-medium">
                {quoteResult ? formatCurrency(quoteResult.customsDuties) : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center">
                <span className="material-icons text-secondary-500 text-sm mr-2">receipt</span>
                <span className="text-sm text-gray-700">VAT (15%)</span>
              </div>
              <span className="text-sm font-medium">
                {quoteResult ? formatCurrency(quoteResult.vat) : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center">
                <span className="material-icons text-accent-500 text-sm mr-2">build</span>
                <span className="text-sm text-gray-700">Handling & Fees</span>
              </div>
              <span className="text-sm font-medium">
                {quoteResult ? formatCurrency(quoteResult.handlingFees) : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
              <span className="text-lg font-medium text-gray-900">Total Cost</span>
              <span className="text-lg font-bold text-primary-600">
                {quoteResult ? formatCurrency(quoteResult.totalCost) : "—"}
              </span>
            </div>

            {quoteResult && (
              <div className="space-y-3 mt-4">
                <div className="bg-primary-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary-700">Cost per kg</span>
                    <span className="text-sm font-medium text-primary-700">
                      {formatCurrency(quoteResult.costPerKg)}
                    </span>
                  </div>
                </div>
                
                {quoteData?.incoterm && (
                  <div className="bg-accent-50 rounded-lg p-3">
                    <div className="flex items-center">
                      <span className="material-icons text-accent-600 text-sm mr-2">assignment</span>
                      <div>
                        <span className="text-xs text-accent-700">Incoterm</span>
                        <div className="text-sm font-medium text-accent-800">{quoteData.incoterm}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button 
            className="w-full mt-6 bg-secondary-500 hover:bg-secondary-600"
            disabled={!quoteResult}
          >
            Generate Detailed Quote
          </Button>

          <Button 
            variant="outline" 
            className="w-full mt-2"
            disabled={!quoteResult}
          >
            Save Quote
          </Button>
        </CardContent>
      </Card>

      {/* Educational Tips */}
      <Card className="bg-accent-50 shadow-material">
        <CardContent className="p-6">
          <div className="flex items-center mb-3">
            <span className="material-icons text-accent-600 mr-2">lightbulb</span>
            <h4 className="font-medium text-accent-800">Shipping Tips</h4>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <span className="material-icons text-accent-500 text-base mr-2 mt-0.5">check_circle</span>
              <p className="text-accent-700">Consolidate shipments to reduce per-unit costs</p>
            </div>
            <div className="flex items-start">
              <span className="material-icons text-accent-500 text-base mr-2 mt-0.5">check_circle</span>
              <p className="text-accent-700">Consider seasonal shipping rates - avoid peak periods</p>
            </div>
            <div className="flex items-start">
              <span className="material-icons text-accent-500 text-base mr-2 mt-0.5">check_circle</span>
              <p className="text-accent-700">Ensure proper documentation to avoid delays</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
