import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Ship, 
  Truck, 
  Calculator, 
  Clock, 
  MapPin, 
  DollarSign,
  CheckCircle,
  Star,
  ArrowRight,
  Package,
  FileText
} from "lucide-react";

interface QuoteBreakdown {
  seaFreight: number;
  trucking: number;
  customs: number;
  vat: number;
  handling: number;
  total: number;
}

interface CarrierOption {
  name: string;
  logo: string;
  transitDays: number;
  reliability: number;
  price: number;
  priceRating: 'budget' | 'standard' | 'premium';
  features: string[];
}

interface FreightForwarder {
  provider: string;
  services: {
    customsClearance: number;
    portClearance: number;
    trucking: number;
  };
  documentation: number;
  insurance: number;
  totalCost: number;
  processingTime: string;
  currency: string;
  features: string[];
}

interface QuoteDisplayProps {
  quote: any; // Accept any quote result structure from the API
  isVisible: boolean;
  onClose: () => void;
  onBookShipment?: (carrier: string) => void;
}

// Generate dynamic carrier options based on sea freight costs only
const generateCarrierOptions = (seaFreightCost: number): CarrierOption[] => [
  {
    name: "Maersk",
    logo: "🚢",
    transitDays: 18,
    reliability: 4.8,
    price: Math.round(seaFreightCost * 1.05), // 5% higher sea freight rate
    priceRating: 'standard',
    features: ['Real-time tracking', 'Door-to-door service', 'Insurance included']
  },
  {
    name: "MSC",
    logo: "⚓",
    transitDays: 20,
    reliability: 4.6,
    price: Math.round(seaFreightCost * 0.92), // 8% lower sea freight rate
    priceRating: 'budget',
    features: ['Competitive pricing', 'Regular schedules', 'Global network']
  },
  {
    name: "CMA CGM",
    logo: "🌊",
    transitDays: 19,
    reliability: 4.7,
    price: Math.round(seaFreightCost * 1.12), // 12% higher sea freight rate
    priceRating: 'premium',
    features: ['Premium service', 'Priority handling', 'Dedicated support']
  }
];

export function QuoteDisplay({ quote, isVisible, onClose, onBookShipment }: QuoteDisplayProps) {
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [selectedFreightForwarder, setSelectedFreightForwarder] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  if (!isVisible) return null;
  
  // Extract data from the actual quote structure
  const seaFreightCost = quote?.seaFreightCost || 0;
  const CARRIER_OPTIONS = generateCarrierOptions(seaFreightCost);

  // Get dynamic pricing based on selections
  const getSelectedCarrierPrice = () => {
    if (!selectedCarrier) return breakdown.seaFreight;
    const carrier = CARRIER_OPTIONS.find((c: any) => c.name === selectedCarrier);
    return carrier ? carrier.price : breakdown.seaFreight;
  };

  const getSelectedFreightForwarderCost = () => {
    if (!selectedFreightForwarder) return breakdown.handling;
    const forwarder = quote?.freightForwarders?.find((f: any) => f.provider === selectedFreightForwarder);
    return forwarder ? forwarder.totalCost : breakdown.handling;
  };

  // Calculate dynamic total based on selections
  const getDynamicTotal = () => {
    return getSelectedCarrierPrice() + 
           breakdown.trucking + 
           breakdown.customs + 
           breakdown.vat + 
           getSelectedFreightForwarderCost();
  };
  
  const handleBookShipment = (carrier: string) => {
    if (onBookShipment) {
      onBookShipment(carrier);
    }
    // Navigate to booking page with quote ID and carrier
    if (quote?.id) {
      setLocation(`/booking?quoteId=${quote.id}&carrier=${encodeURIComponent(carrier)}`);
    }
  };
  
  // Create a compatible breakdown structure from the quote data
  const breakdown = {
    seaFreight: quote?.seaFreightCost || 0,
    trucking: quote?.truckingCost || 0,
    customs: quote?.customsDuties || 0,
    vat: quote?.vat || 0,
    handling: quote?.handlingFees || 0,
    total: quote?.totalCost || 0
  };

  const route = {
    origin: quote?.originPort || 'Unknown Origin',
    destination: quote?.destinationPort || 'Unknown Destination',
    containerType: quote?.containerType || 'Unknown Container'
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'R0';
    }
    return `R${Math.round(amount).toLocaleString()}`;
  };

  const getPriceColor = (rating: string) => {
    switch (rating) {
      case 'budget': return 'text-green-600 dark:text-green-400';
      case 'premium': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-700 dark:text-gray-300';
    }
  };

  const getPriceBadgeColor = (rating: string) => {
    switch (rating) {
      case 'budget': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'premium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Your Complete Shipping Quote
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                {route.origin} → {route.destination} • {route.containerType}
              </p>
              <div className="mt-4 p-4 bg-blue-100 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm font-medium">
                  📚 <strong>First-time shipper?</strong> This detailed breakdown explains every cost component so you understand exactly what you're paying for and why.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose} className="text-lg px-6 py-3">
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Total Cost Prominent Display */}
          <Card className="border-2 border-primary-300 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-4xl font-bold text-primary-600 mb-2">
                {formatCurrency(breakdown.total)}
              </CardTitle>
              <CardDescription className="text-xl text-gray-700 font-medium">
                Total Door-to-Door Shipping Cost
              </CardDescription>
              <p className="text-sm text-gray-600 mt-3 bg-white p-3 rounded-lg">
                This is your complete cost including sea freight, trucking to your destination, all customs duties, VAT, and handling fees. No hidden charges.
              </p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Educational Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calculator className="h-6 w-6" />
                  Complete Cost Breakdown
                </CardTitle>
                <CardDescription className="text-base">
                  Understanding every component of your shipping cost
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-blue-800 mb-2">Quote Summary</h3>
                    <p className="text-sm text-blue-700">
                      Your quote includes sea freight, local trucking, customs duties, VAT, and handling fees. 
                      Select specific carriers below to see detailed breakdowns and exact pricing.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <Ship className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Sea Freight</span>
                      </div>
                      <span className="font-bold text-lg">{formatCurrency(getSelectedCarrierPrice())}</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Ocean shipping from {route.origin} to {route.destination} via {route.containerType} container
                    </p>
                    <div className="mt-2 text-xs text-blue-600">
                      Base rate varies by carrier: Maersk ~{formatCurrency(breakdown.seaFreight)}, MSC ~{formatCurrency(Math.round(breakdown.seaFreight * 0.95))}, COSCO ~{formatCurrency(Math.round(breakdown.seaFreight * 1.08))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Local Trucking</span>
                      </div>
                      <span className="font-bold text-lg">{formatCurrency(breakdown.trucking)}</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Port to destination - Transport from {route.destination} port to your final destination
                    </p>
                    <div className="mt-2 text-xs text-green-600">
                      Calculated based on distance and container size. Rate: ~R{Math.round(breakdown.trucking / 100) * 100} for {route.containerType} container
                    </div>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Customs & VAT</span>
                      </div>
                      <span className="font-bold text-lg">{formatCurrency(breakdown.customs + breakdown.vat)}</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">
                      SARS import duties & 15% VAT - Government taxes on imported goods
                    </p>
                    {/* Detailed calculations */}
                    {quote?.customsInfo?.breakdown && (
                      <div className="bg-orange-100 p-3 rounded border text-xs space-y-1">
                        <div className="font-medium text-orange-800 mb-2">📊 Calculation Details:</div>
                        <div className="text-orange-700">
                          <div>Cargo Value (FOB): ${quote.customsInfo.breakdown.fobValueUSD?.toLocaleString()} USD = {formatCurrency(quote.customsInfo.breakdown.fobValueZAR)}</div>
                          <div>Exchange Rate: 1 USD = R{quote.customsInfo.breakdown.exchangeRate?.toFixed(4)}</div>
                          <div>Customs Duty Rate: {(quote.customsInfo.breakdown.dutyRate * 100).toFixed(1)}% = {formatCurrency(breakdown.customs)}</div>
                          <div>VAT (15% on FOB + Duties): {formatCurrency(breakdown.vat)}</div>
                          <div className="border-t border-orange-300 pt-1 mt-1 font-medium">
                            Total: {formatCurrency(breakdown.customs + breakdown.vat)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">Handling & Documentation</span>
                      </div>
                      <span className="font-bold text-lg">{formatCurrency(breakdown.handling)}</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      {selectedFreightForwarder ? `${selectedFreightForwarder} services` : 'Select freight forwarder'} - Port handling, customs clearance, documentation
                    </p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border-2 border-blue-300">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Current Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(getDynamicTotal())}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    {selectedCarrier && selectedFreightForwarder 
                      ? `Complete door-to-door cost with ${selectedCarrier} + ${selectedFreightForwarder}`
                      : 'Select specific carriers and freight forwarders below to customize your rate'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Transit: {quote?.transitDays || 18} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Incoterm: {quote?.incoterm || 'FOB'}</span>
                  </div>
                  {quote?.hasLiveRates && (
                    <div className="flex items-center gap-2 col-span-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Live carrier rates included</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Educational Carrier Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Ship className="h-6 w-6" />
                  Choose Your Shipping Line
                </CardTitle>
                <CardDescription className="text-base">
                  Compare carrier options with detailed service information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 text-sm">
                      <strong>💡 Choosing the right carrier:</strong> Budget options offer competitive rates but may have longer transit times. Premium carriers provide faster delivery and enhanced tracking but at higher cost.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {CARRIER_OPTIONS.map((carrier) => (
                      <div
                        key={carrier.name}
                        className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
                          selectedCarrier === carrier.name
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                        onClick={() => setSelectedCarrier(carrier.name)}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">{carrier.logo}</div>
                            <div>
                              <h3 className="font-bold text-xl">{carrier.name}</h3>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm text-gray-600">
                                  {carrier.reliability}/5.0 reliability
                                </span>
                              </div>
                              <Badge className={`mt-2 ${getPriceBadgeColor(carrier.priceRating)}`}>
                                {carrier.priceRating} option
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">Transit Time</div>
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-5 w-5 text-gray-500" />
                              <span className="font-bold text-lg">{carrier.transitDays} days</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Port to port delivery
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">Carrier Cost</div>
                            <div className={`text-3xl font-bold ${getPriceColor(carrier.priceRating)}`}>
                              {formatCurrency(Math.round(breakdown.seaFreight * (carrier.price / breakdown.total)) + Math.round(breakdown.handling * 0.5))}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Ocean freight + handling
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {carrier.features.map((feature) => (
                              <div key={feature} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span className="text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {selectedCarrier === carrier.name && (
                          <div className="mt-4 pt-3 border-t-2 border-blue-200 bg-blue-50 p-3 rounded-lg">
                            <div className="mb-3">
                              <h4 className="font-bold text-blue-800 mb-2 text-sm">{carrier.name} Costs:</h4>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span>• Ocean Freight ({carrier.name}):</span>
                                  <span className="font-medium">{formatCurrency(Math.round(breakdown.seaFreight * (carrier.price / breakdown.total)))}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Terminal Handling:</span>
                                  <span className="font-medium">{formatCurrency(Math.round(breakdown.handling * 0.4))}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Documentation:</span>
                                  <span className="font-medium">{formatCurrency(Math.round(breakdown.handling * 0.1))}</span>
                                </div>
                                <div className="border-t border-blue-300 pt-1 mt-2 flex justify-between font-bold">
                                  <span>{carrier.name} Total:</span>
                                  <span>{formatCurrency(Math.round(breakdown.seaFreight * (carrier.price / breakdown.total)) + Math.round(breakdown.handling * 0.5))}</span>
                                </div>
                              </div>
                              <p className="text-xs text-blue-600 mt-2 italic">
                                This is {carrier.name}'s portion only. Add customs ({formatCurrency(breakdown.customs)}), VAT ({formatCurrency(breakdown.vat)}), and trucking ({formatCurrency(breakdown.trucking)}) for complete cost.
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-blue-800">Selected: {carrier.name}</h4>
                                <p className="text-sm text-blue-600">Ready to proceed with booking</p>
                              </div>
                              <Button 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleBookShipment(carrier.name)}
                              >
                                Book with {carrier.name}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Freight Forwarder Options */}
          {quote?.freightForwarders && quote.freightForwarders.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Package className="h-6 w-6" />
                  Complete Your Service Selection
                </CardTitle>
                <CardDescription className="text-base">
                  Choose freight forwarder for handling & documentation to see your final total cost
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-indigo-800 text-sm">
                      <strong>💡 About Freight Forwarders:</strong> These specialized companies handle customs clearance, port documentation, and local trucking. They ensure your cargo clears customs smoothly and reaches your final destination.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {quote.freightForwarders.map((forwarder: FreightForwarder) => (
                      <div
                        key={forwarder.provider}
                        className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
                          selectedFreightForwarder === forwarder.provider
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-md'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                        onClick={() => setSelectedFreightForwarder(forwarder.provider)}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h3 className="font-bold text-xl mb-2">{forwarder.provider}</h3>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>Processing: {forwarder.processingTime}</span>
                              </div>
                              <Badge className="mt-2">Full Service Provider</Badge>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-600 mb-2">Service Breakdown</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Customs Clearance:</span>
                                <span className="font-medium">{formatCurrency(forwarder.services.customsClearance)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Port Clearance:</span>
                                <span className="font-medium">{formatCurrency(forwarder.services.portClearance)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Local Trucking:</span>
                                <span className="font-medium">{formatCurrency(forwarder.services.trucking)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Documentation:</span>
                                <span className="font-medium">{formatCurrency(forwarder.documentation)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">Total Service Cost</div>
                            <div className="text-3xl font-bold text-indigo-600">
                              {formatCurrency(forwarder.totalCost)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              All-inclusive service package
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {forwarder.features && forwarder.features.length > 0 ? (
                              forwarder.features.map((feature) => (
                                <div key={feature} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  <span className="text-gray-700">{feature}</span>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full text-sm text-gray-500 text-center py-2">
                                Professional logistics services included
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {selectedFreightForwarder === forwarder.provider && (
                          <div className="mt-6 pt-4 border-t-2 border-indigo-200 bg-indigo-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-indigo-800">Selected: {forwarder.provider}</h4>
                                <p className="text-sm text-indigo-600">Professional customs clearance and logistics</p>
                              </div>
                              <Button 
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => handleBookShipment(`${selectedCarrier || 'Maersk'} + ${forwarder.provider}`)}
                              >
                                Book Complete Service
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dynamic Total Cost with Selected Combination */}
          {(selectedCarrier || selectedFreightForwarder) && (
            <Card className="mt-8 border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-green-800">Your Final Total Cost</CardTitle>
                <CardDescription className="text-lg text-green-700">
                  {selectedCarrier && selectedFreightForwarder
                    ? `${selectedCarrier} + ${selectedFreightForwarder}`
                    : selectedCarrier
                    ? `${selectedCarrier} + Select freight forwarder`
                    : `Select carrier + ${selectedFreightForwarder}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="text-sm text-gray-600">Sea Freight</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(getSelectedCarrierPrice())}
                      </div>
                      <div className="text-xs text-gray-500">{selectedCarrier || 'Select carrier'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="text-sm text-gray-600">Customs & VAT</div>
                      <div className="text-lg font-bold text-orange-600">
                        {formatCurrency(breakdown.customs + breakdown.vat)}
                      </div>
                      <div className="text-xs text-gray-500">Government fees</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="text-sm text-gray-600">Handling & Docs</div>
                      <div className="text-lg font-bold text-indigo-600">
                        {formatCurrency(getSelectedFreightForwarderCost())}
                      </div>
                      <div className="text-xs text-gray-500">{selectedFreightForwarder || 'Select forwarder'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="text-sm text-gray-600">Local Trucking</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(breakdown.trucking)}
                      </div>
                      <div className="text-xs text-gray-500">Door delivery</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="text-center p-6 bg-white rounded-lg border-2 border-green-400">
                    <div className="text-lg text-gray-700 mb-2">Complete Door-to-Door Total</div>
                    <div className="text-4xl font-bold text-green-600">
                      {formatCurrency(getDynamicTotal())}
                    </div>
                    <div className="text-sm text-green-700 mt-2">
                      {selectedCarrier && selectedFreightForwarder 
                        ? 'Ready to book your complete shipping solution'
                        : 'Complete your selection above to see final price'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Educational Information Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-6 w-6" />
                What Happens Next?
              </CardTitle>
              <CardDescription className="text-base">
                Understanding your shipping process after booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl mb-3">📋</div>
                  <h4 className="font-bold text-green-800 mb-2">1. Documentation</h4>
                  <p className="text-sm text-green-700">
                    We'll prepare all shipping documents including Bill of Lading, commercial invoice, and packing list
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-3xl mb-3">🚢</div>
                  <h4 className="font-bold text-blue-800 mb-2">2. Ocean Transport</h4>
                  <p className="text-sm text-blue-700">
                    Your cargo travels by sea from {route.origin} to {route.destination} with real-time tracking updates
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-3xl mb-3">🏢</div>
                  <h4 className="font-bold text-purple-800 mb-2">3. Customs Clearance</h4>
                  <p className="text-sm text-purple-700">
                    We handle all SARS customs procedures, pay duties and VAT, then arrange final delivery to your door
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Quote Validity:</strong> This quote is valid for 7 days. Final costs may vary based on actual cargo weight and customs inspection. All prices include door-to-door delivery.
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Save Quote for Later
              </Button>
              {selectedCarrier ? (
                <Button onClick={() => handleBookShipment(selectedCarrier)} className="bg-primary-600 hover:bg-primary-700">
                  Proceed to Booking
                </Button>
              ) : (
                <Button disabled className="opacity-50">
                  Select Carrier to Continue
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}