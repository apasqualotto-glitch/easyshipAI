import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingDown, TrendingUp, Clock } from "lucide-react";
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
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700">Sea Freight</span>
                  {quoteResult?.liveRateInfo && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Zap className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-blue-600">{quoteResult.liveRateInfo.carrier}</span>
                      {quoteResult.liveRateInfo.savings !== 0 && (
                        <div className="flex items-center space-x-1">
                          {quoteResult.liveRateInfo.savings > 0 ? (
                            <TrendingDown className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingUp className="h-3 w-3 text-orange-500" />
                          )}
                          <span className={`text-xs ${quoteResult.liveRateInfo.savings > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {Math.abs(quoteResult.liveRateInfo.savings).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">
                  {quoteResult ? formatCurrency(quoteResult.seaFreightCost) : "—"}
                </span>
                {quoteResult?.hasLiveRates && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    <Zap className="h-3 w-3 mr-1" />
                    Live Rate
                  </Badge>
                )}
              </div>
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
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700">Customs Duties</span>
                  {quoteResult?.customsInfo?.isAdvancedCalculation && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        HS: {quoteResult.customsInfo.hsCode}
                      </Badge>
                      <span className="text-xs text-blue-600">
                        {(quoteResult.customsInfo.dutyRate * 100).toFixed(1)}% rate
                      </span>
                    </div>
                  )}
                </div>
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

                {quoteResult?.customsInfo?.isAdvancedCalculation && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start">
                      <span className="material-icons text-blue-600 text-sm mr-2 mt-0.5">info</span>
                      <div className="flex-1">
                        <div className="text-xs text-blue-700 mb-1">Customs Information</div>
                        <div className="text-sm font-medium text-blue-800 mb-2">
                          HS Code: {quoteResult.customsInfo.hsCode}
                        </div>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          {quoteResult.customsInfo.explanation}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Duty: {(quoteResult.customsInfo.dutyRate * 100).toFixed(1)}%
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            VAT: {(quoteResult.customsInfo.vatRate * 100).toFixed(0)}%
                          </Badge>
                        </div>
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
