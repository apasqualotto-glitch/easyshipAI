import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingDown, TrendingUp, Clock, MessageCircle } from "lucide-react";
import { type QuoteRequest } from "@shared/schema";
import { useState } from "react";
import { ChatPopup } from "@/components/chat-popup";

interface CostBreakdownProps {
  quoteData: QuoteRequest | null;
  quoteResult: any;
}

export default function CostBreakdown({ quoteData, quoteResult }: CostBreakdownProps) {
  const [showChat, setShowChat] = useState(false);
  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-material sticky top-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
          {quoteResult && quoteResult.id && (
            <div className="mb-4 p-2 bg-green-100 text-green-800 rounded text-sm flex items-center justify-between">
              <span>✅ Quote generated! Booking section available below.</span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowChat(true)}
                className="text-green-700 hover:text-green-900"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Ask about this quote
              </Button>
            </div>
          )}
          
          {/* Incoterm Information */}
          {quoteResult?.incotermExplanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-semibold">{quoteResult.incoterm}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Incoterm Cost Impact</h4>
                  <p className="text-xs text-blue-700">{quoteResult.incotermExplanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center">
                <span className="material-icons text-primary-500 text-sm mr-2">directions_boat</span>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700">Sea Freight {quoteResult?.incoterm && `(${quoteResult.incoterm})`}</span>
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

            <div className="py-2 border-b border-gray-100">
              <div className="flex justify-between items-center">
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
              {quoteResult?.customsInfo?.breakdown && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                  <div className="text-gray-600 font-medium">SARS Duty Calculation (FOB Basis):</div>
                  <div>FOB Value (USD): ${quoteResult.customsInfo.breakdown.fobValueUSD?.toLocaleString() || quoteResult.value.toLocaleString()}</div>
                  <div>Exchange Rate: 1 USD = {quoteResult.customsInfo.breakdown.exchangeRate?.toFixed(4) || 'N/A'} ZAR</div>
                  <div>FOB Value (ZAR): {formatCurrency(quoteResult.customsInfo.breakdown.fobValueZAR || quoteResult.valueZAR || 0)}</div>
                  <div>Duty Rate: {(quoteResult.customsInfo.breakdown.dutyRate * 100).toFixed(1)}%</div>
                  <div className="font-medium text-secondary-700">
                    Formula: FOB Value (ZAR) × Duty Rate = {formatCurrency(quoteResult.customsDuties)}
                  </div>
                </div>
              )}
            </div>

            <div className="py-2 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="material-icons text-secondary-500 text-sm mr-2">receipt</span>
                  <span className="text-sm text-gray-700">VAT (15%)</span>
                </div>
                <span className="text-sm font-medium">
                  {quoteResult ? formatCurrency(quoteResult.vat) : "—"}
                </span>
              </div>
              {quoteResult?.customsInfo?.breakdown && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs space-y-1">
                  <div className="text-gray-600 font-medium">SARS VAT Calculation:</div>
                  <div>FOB Value (ZAR): {formatCurrency(quoteResult.customsInfo.breakdown.fobValueZAR || quoteResult.valueZAR || 0)}</div>
                  {quoteResult.customsInfo.breakdown.markupApplied && (
                    <div>10% Markup: {formatCurrency(quoteResult.customsInfo.breakdown.markupAmount)} (Non-SACU)</div>
                  )}
                  <div>Customs Duty: {formatCurrency(quoteResult.customsDuties)}</div>
                  <div>ATV (Added Tax Value): {formatCurrency(quoteResult.customsInfo.breakdown.atvValue)}</div>
                  <div className="font-medium text-blue-700">
                    {quoteResult.customsInfo.breakdown.formula} = {formatCurrency(quoteResult.vat)}
                  </div>
                  {!quoteResult.customsInfo.breakdown.markupApplied && (
                    <div className="text-green-600 text-xs mt-1">✓ SACU country - no 10% markup applied</div>
                  )}
                </div>
              )}
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

                {quoteResult?.customsInfo && (
                  <div className="space-y-3">
                    {quoteResult.customsInfo.isAdvancedCalculation && (
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
                    
                    {quoteResult.customsInfo.calculationMethod && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start">
                          <span className="material-icons text-gray-600 text-sm mr-2 mt-0.5">calculate</span>
                          <div className="flex-1">
                            <div className="text-xs text-gray-700 mb-2 font-medium">SARS Calculation Method</div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div><strong>Duty Formula:</strong> {quoteResult.customsInfo.calculationMethod.dutyFormula}</div>
                              <div><strong>VAT Formula:</strong> {quoteResult.customsInfo.calculationMethod.vatFormula}</div>
                              <div><strong>Origin Rules:</strong> {quoteResult.customsInfo.calculationMethod.sacuExemption}</div>
                            </div>
                            {quoteResult.customsInfo.exchangeRateInfo && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded border-l-2 border-yellow-300">
                                <div className="text-xs text-yellow-800 font-medium">Live Exchange Rate</div>
                                <div className="text-xs text-yellow-700">
                                  Source: {quoteResult.customsInfo.exchangeRateInfo.source} • Updated: {new Date(quoteResult.customsInfo.exchangeRateInfo.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            )}
                            <div className="mt-2 space-y-1">
                              {quoteResult.customsInfo.calculationMethod.notes.map((note: string, index: number) => (
                                <div key={index} className="text-xs text-gray-500 flex items-start">
                                  <span className="text-gray-400 mr-1">•</span>
                                  <span>{note}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {quoteResult ? (
            <div className="mt-6 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
              >
                Save Quote
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
              >
                Email Quote
              </Button>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  // Store quote data in localStorage for booking page access
                  if (quoteResult?.id) {
                    const quoteInfo = {
                      id: quoteResult.id,
                      originPort: quoteResult.originPort,
                      destinationPort: quoteResult.destinationPort,
                      deliveryAddress: quoteResult.deliveryAddress,
                      containerType: quoteResult.containerType,
                      cargoType: quoteResult.cargoType,
                      weight: quoteResult.weight,
                      value: quoteResult.value,
                      incoterm: quoteResult.incoterm,
                      totalCost: quoteResult.totalCost,
                      partialShipmentDetails: quoteResult.partialShipmentDetails,
                      seaFreightCost: quoteResult.seaFreightCost,
                      truckingCost: quoteResult.truckingCost,
                      customsDuties: quoteResult.customsDuties,
                      vat: quoteResult.vat,
                      handlingFees: quoteResult.handlingFees
                    };
                    localStorage.setItem(`quote-${quoteResult.id}`, JSON.stringify(quoteInfo));
                    window.open(`/booking?quote=${quoteResult.id}`, '_blank');
                  } else {
                    alert('Please generate a quote first to proceed with booking.');
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-sm">local_shipping</span>
                  <span>Book My Shipment</span>
                </div>
              </Button>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-2">
                Fill out the form on the left to get your quote
              </p>
              <Button 
                className="w-full bg-secondary-500 hover:bg-secondary-600"
                disabled
              >
                Waiting for Quote Data...
              </Button>
            </div>
          )}
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
      
      {/* Booking Section */}
      {quoteResult && quoteResult.id && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 shadow-lg border-2 border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              🚢 Book This Shipment
            </CardTitle>
            <CardDescription className="text-base">
              Ready to book? Choose your preferred carrier or compare rates first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-gray-600 mb-2">Quote Details</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Total Cost:</span>
                      <span className="font-semibold ml-2">{formatCurrency(quoteResult.totalCost)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Transit:</span>
                      <span className="font-semibold ml-2">{quoteResult.transitDays} days</span>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    Quote ID: {quoteResult.id}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a 
                    href={`/booking?quote=${quoteResult.id}`}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center flex-1"
                  >
                    🚢 Start Booking Process
                  </a>
                  <Button 
                    variant="outline" 
                    className="px-6 py-3 border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      const compareTab = document.querySelector('[data-state="inactive"][value="compare"]') as HTMLElement;
                      if (compareTab) compareTab.click();
                    }}
                  >
                    📊 Compare Carriers First
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500">
                  Direct API integration with major carrier booking systems
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Chat Popup for Quote Context */}
      {showChat && quoteResult && (
        <ChatPopup 
          context={{
            type: 'quote',
            quoteId: quoteResult.id,
            totalCost: quoteResult.totalCost,
            incoterm: quoteResult.incoterm
          }}
          initialMessage={`I'd like to ask about my quote #${quoteResult.id} with a total cost of R${quoteResult.totalCost.toLocaleString()}`}
        />
      )}
    </div>
  );
}
