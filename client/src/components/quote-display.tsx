import { useState, useEffect } from "react";
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

interface QuoteDisplayProps {
  quote: {
    breakdown: QuoteBreakdown;
    route: {
      origin: string;
      destination: string;
      containerType: string;
    };
    incoterm: string;
    totalDays: number;
  };
  isVisible: boolean;
  onClose: () => void;
  onBookShipment?: (carrier: string) => void;
}

const CARRIER_OPTIONS: CarrierOption[] = [
  {
    name: "Maersk",
    logo: "🚢",
    transitDays: 18,
    reliability: 4.8,
    price: 123000,
    priceRating: 'standard',
    features: ['Real-time tracking', 'Door-to-door service', 'Insurance included']
  },
  {
    name: "MSC",
    logo: "⚓",
    transitDays: 20,
    reliability: 4.6,
    price: 118500,
    priceRating: 'budget',
    features: ['Competitive pricing', 'Regular schedules', 'Global network']
  },
  {
    name: "CMA CGM",
    logo: "🌊",
    transitDays: 19,
    reliability: 4.7,
    price: 128000,
    priceRating: 'premium',
    features: ['Premium service', 'Priority handling', 'Dedicated support']
  }
];

export function QuoteDisplay({ quote, isVisible, onClose, onBookShipment }: QuoteDisplayProps) {
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);

  if (!isVisible) return null;

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
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Detailed Shipping Quote
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {quote.route?.origin || 'Origin'} → {quote.route?.destination || 'Destination'} • {quote.route?.containerType || 'Container'}
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cost Breakdown */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Cost Breakdown
                </CardTitle>
                <CardDescription>
                  Complete pricing breakdown for your shipment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Sea Freight</span>
                  </div>
                  <span className="font-medium">{formatCurrency(quote.breakdown?.seaFreight)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Trucking</span>
                  </div>
                  <span className="font-medium">{formatCurrency(quote.breakdown?.trucking)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Customs Duties</span>
                  </div>
                  <span className="font-medium">{formatCurrency(quote.breakdown?.customs)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">VAT (15%)</span>
                  </div>
                  <span className="font-medium">{formatCurrency(quote.breakdown?.vat)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Handling Fees</span>
                  </div>
                  <span className="font-medium">{formatCurrency(quote.breakdown?.handling)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Cost</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatCurrency(quote.breakdown?.total)}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Estimated transit: {quote.totalDays || 'N/A'} days</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>Incoterm: {quote.incoterm || 'FOB'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Carrier Options */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Carrier</CardTitle>
                <CardDescription>
                  Compare rates and services from major shipping lines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {CARRIER_OPTIONS.map((carrier) => (
                    <div
                      key={carrier.name}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedCarrier === carrier.name
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => setSelectedCarrier(carrier.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{carrier.logo}</div>
                          <div>
                            <h3 className="font-semibold text-lg">{carrier.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {carrier.reliability}/5.0
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {carrier.transitDays} days
                                </span>
                              </div>
                              <Badge className={getPriceBadgeColor(carrier.priceRating)}>
                                {carrier.priceRating}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getPriceColor(carrier.priceRating)}`}>
                            {formatCurrency(carrier.price)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Total delivered price
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        {carrier.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {selectedCarrier === carrier.name && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <Button 
                            className="w-full"
                            onClick={() => onBookShipment?.(carrier.name)}
                          >
                            Book with {carrier.name}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Prices include all fees and are valid for 7 days. Final costs may vary based on actual cargo weight and customs inspection.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Save Quote
              </Button>
              {selectedCarrier && (
                <Button onClick={() => onBookShipment?.(selectedCarrier)}>
                  Proceed to Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}