import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Ship, Clock, TrendingDown, TrendingUp, Star, MapPin, Calendar } from "lucide-react";

interface CarrierRate {
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  transitTime: string;
  reliability: number; // 0-100%
  route: string[];
  validUntil: string;
  totalCost: number;
  savings?: number;
  ranking: number;
}

interface CarrierComparisonProps {
  rates: CarrierRate[];
  baseCost: number;
  containerType: string;
  route: string;
  quoteId?: string;
}

export default function CarrierComparison({ rates, baseCost, containerType, route, quoteId }: CarrierComparisonProps) {
  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString()}`;
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 95) return "text-green-600";
    if (reliability >= 90) return "text-yellow-600";
    return "text-red-600";
  };

  const getReliabilityBadge = (reliability: number) => {
    if (reliability >= 95) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (reliability >= 90) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Fair</Badge>;
  };

  const getSavingsColor = (savings?: number) => {
    if (!savings) return "text-gray-600";
    return savings > 0 ? "text-green-600" : "text-red-600";
  };

  const bestRate = rates.length > 0 ? rates[0] : null;

  if (rates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-blue-600" />
            Carrier Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Ship className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No live rates available for comparison</p>
            <p className="text-sm text-gray-400 mt-2">Using standard estimated rates</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="h-5 w-5 text-blue-600" />
          Carrier Rate Comparison
        </CardTitle>
        <p className="text-sm text-gray-600">
          Comparing {rates.length} live rates for {containerType} container on {route}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rates.map((rate, index) => (
            <div 
              key={`${rate.carrier}-${rate.service}`}
              className={`p-4 rounded-lg border-2 transition-all ${
                index === 0 
                  ? "border-green-200 bg-green-50" 
                  : "border-gray-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Ship className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-lg">{rate.carrier}</h4>
                      <p className="text-sm text-gray-600">{rate.service}</p>
                    </div>
                  </div>
                  {index === 0 && (
                    <Badge className="bg-green-100 text-green-800">
                      <Star className="h-3 w-3 mr-1" />
                      Best Rate
                    </Badge>
                  )}
                  <Badge variant="outline">#{rate.ranking}</Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(rate.totalCost)}
                  </div>
                  {rate.savings && (
                    <div className={`text-sm font-medium ${getSavingsColor(rate.savings)}`}>
                      {rate.savings > 0 ? (
                        <div className="flex items-center">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Save {formatCurrency(rate.savings)}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{formatCurrency(Math.abs(rate.savings))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Transit Time</span>
                  </div>
                  <div className="font-medium text-lg">{rate.transitTime}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm text-gray-600">Reliability</span>
                      {getReliabilityBadge(rate.reliability)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className={`font-medium ${getReliabilityColor(rate.reliability)}`}>
                      {rate.reliability}%
                    </div>
                    <Progress value={rate.reliability} className="h-2" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Valid Until</span>
                  </div>
                  <div className="font-medium">
                    {new Date(rate.validUntil).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-600">Route: </span>
                    <span className="text-sm font-medium">
                      {rate.route.join(" → ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">
                    Sea freight: {formatCurrency(rate.rate)} | Total with costs: {formatCurrency(rate.totalCost)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={index === 0 ? "default" : "outline"}
                    className={`flex-1 ${index === 0 ? "bg-green-600 hover:bg-green-700" : ""}`}
                  >
                    {index === 0 ? "✓ Best Rate" : "Select Rate"}
                  </Button>
                  {quoteId && (
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                      onClick={() => window.location.href = `/booking?quote=${quoteId}&carrier=${encodeURIComponent(rate.carrier)}&service=${encodeURIComponent(rate.service)}&rate=${rate.totalCost}`}
                    >
                      🚢 Book Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {bestRate && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">Best Option Summary:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Carrier:</span>
                <span className="font-medium ml-2">{bestRate.carrier}</span>
              </div>
              <div>
                <span className="text-blue-700">Total Cost:</span>
                <span className="font-medium ml-2">{formatCurrency(bestRate.totalCost)}</span>
              </div>
              <div>
                <span className="text-blue-700">Transit:</span>
                <span className="font-medium ml-2">{bestRate.transitTime}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}