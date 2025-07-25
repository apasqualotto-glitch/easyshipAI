import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Search, FileText, AlertCircle, CheckCircle, Info } from "lucide-react";

interface CustomsTariff {
  hsCode: string;
  description: string;
  dutyRate: number;
  additionalFees: number;
  vatRate: number;
  category: string;
  restrictions?: string[];
  exemptions?: string[];
  explanation: string;
  examples: string[];
}

interface CustomsCalculation {
  tariff: CustomsTariff;
  calculations: {
    cifValue: number;
    customsDuty: number;
    dutiableAmount: number;
    vat: number;
    additionalFees: number;
    totalCustomsCost: number;
  };
  breakdown: Array<{
    item: string;
    amount: number;
    description: string;
  }>;
}

export default function CustomsLookup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CustomsTariff[]>([]);
  const [selectedTariff, setSelectedTariff] = useState<CustomsTariff | null>(null);
  const [cargoValue, setCargoValue] = useState<number>(0);
  const [calculation, setCalculation] = useState<CustomsCalculation | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString()}`;
  };

  const searchCustomsTariffs = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch("/api/customs/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchTerm }),
      });
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const calculateCustomsCost = async (hsCode: string, value: number) => {
    if (!hsCode || value <= 0) return;
    
    try {
      const response = await fetch("/api/customs/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hsCode, cifValue: value }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setCalculation(result);
      }
    } catch (error) {
      console.error("Calculation failed:", error);
    }
  };

  const handleTariffSelect = (tariff: CustomsTariff) => {
    setSelectedTariff(tariff);
    if (cargoValue > 0) {
      calculateCustomsCost(tariff.hsCode, cargoValue);
    }
  };

  const handleValueChange = (value: number) => {
    setCargoValue(value);
    if (selectedTariff && value > 0) {
      calculateCustomsCost(selectedTariff.hsCode, value);
    }
  };

  const getDutyRateColor = (rate: number) => {
    if (rate === 0) return "text-green-600";
    if (rate <= 0.1) return "text-yellow-600";
    if (rate <= 0.25) return "text-orange-600";
    return "text-red-600";
  };

  const getDutyRateBadge = (rate: number) => {
    if (rate === 0) return <Badge className="bg-green-100 text-green-800">Duty Free</Badge>;
    if (rate <= 0.1) return <Badge className="bg-yellow-100 text-yellow-800">Low Duty</Badge>;
    if (rate <= 0.25) return <Badge className="bg-orange-100 text-orange-800">Medium Duty</Badge>;
    return <Badge className="bg-red-100 text-red-800">High Duty</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Advanced Customs Lookup
        </CardTitle>
        <p className="text-sm text-gray-600">
          Search for your cargo type to get exact customs duty rates and explanations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Section */}
        <div className="space-y-3">
          <Label htmlFor="customs-search">Search for your cargo type</Label>
          <div className="flex gap-2">
            <Input
              id="customs-search"
              placeholder="e.g., laptops, smartphones, clothing, machinery..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCustomsTariffs()}
            />
            <Button onClick={searchCustomsTariffs} disabled={isSearching}>
              <Search className="h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Search Results ({searchResults.length} found)</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((tariff) => (
                <div
                  key={tariff.hsCode}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTariff?.hsCode === tariff.hsCode
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleTariffSelect(tariff)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium">{tariff.hsCode}</span>
                        {getDutyRateBadge(tariff.dutyRate)}
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{tariff.description}</p>
                      <p className="text-xs text-gray-500">
                        Examples: {tariff.examples.slice(0, 3).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getDutyRateColor(tariff.dutyRate)}`}>
                        {(tariff.dutyRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Duty Rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Tariff Details */}
        {selectedTariff && (
          <div className="space-y-4">
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Selected Cargo Type</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-medium">{selectedTariff.hsCode}</span>
                      {getDutyRateBadge(selectedTariff.dutyRate)}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{selectedTariff.description}</p>
                    <p className="text-xs text-gray-600">Category: {selectedTariff.category}</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm mb-1">Why this rate applies:</p>
                      <p className="text-sm text-gray-700">{selectedTariff.explanation}</p>
                    </div>
                  </div>
                </div>

                {selectedTariff.restrictions && selectedTariff.restrictions.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-orange-700 mb-1">Import Requirements:</p>
                        <ul className="text-xs text-orange-600 space-y-1">
                          {selectedTariff.restrictions.map((restriction, index) => (
                            <li key={index}>• {restriction}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTariff.exemptions && selectedTariff.exemptions.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-green-700 mb-1">Exemptions:</p>
                        <ul className="text-xs text-green-600 space-y-1">
                          {selectedTariff.exemptions.map((exemption, index) => (
                            <li key={index}>• {exemption}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cost Calculator */}
            <div className="space-y-3">
              <Label htmlFor="cargo-value">Enter cargo value (CIF in ZAR) to calculate exact costs</Label>
              <Input
                id="cargo-value"
                type="number"
                placeholder="e.g., 50000"
                value={cargoValue || ""}
                onChange={(e) => handleValueChange(Number(e.target.value))}
              />
            </div>

            {/* Calculation Results */}
            {calculation && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium mb-3">Detailed Cost Breakdown</h5>
                <div className="space-y-2">
                  {calculation.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <div>
                        <span className="text-sm font-medium">{item.item}</span>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center py-2 bg-white px-3 rounded">
                    <span className="font-bold">Total Customs Cost</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(calculation.calculations.totalCustomsCost)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {searchTerm && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No results found for "{searchTerm}"</p>
            <p className="text-sm text-gray-400 mt-2">Try different keywords or check spelling</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}