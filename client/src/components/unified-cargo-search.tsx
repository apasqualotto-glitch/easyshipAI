import { useState, useEffect } from "react";
import { Search, Package, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CargoSearchResult {
  type: 'customs' | 'cargo';
  id: string;
  name: string;
  searchValue: string;
  category: string;
  dutyRate: number;
  additionalFees: number;
  vatRate: number;
  explanation: string;
  examples: string[];
  hsCode?: string;
  isSpecific: boolean;
  searchScore: number;
  displayText: string;
  subtitle: string;
  cargoTypeEquivalent?: string;
}

interface UnifiedCargoSearchProps {
  value: string;
  customsTariff?: any;
  onCargoSelect: (cargoType: string) => void;
  onCustomsSelect: (customsTariff: any) => void;
  onClear: () => void;
}

export default function UnifiedCargoSearch({ 
  value, 
  customsTariff,
  onCargoSelect, 
  onCustomsSelect, 
  onClear 
}: UnifiedCargoSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<CargoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<CargoSearchResult | null>(null);

  // Initialize with current values
  useEffect(() => {
    if (customsTariff) {
      setSelectedResult({
        type: 'customs',
        id: customsTariff.hsCode,
        name: customsTariff.explanation,
        searchValue: customsTariff.hsCode,
        category: 'Specific HS Code',
        dutyRate: customsTariff.dutyRate,
        additionalFees: customsTariff.additionalFees,
        vatRate: customsTariff.vatRate,
        explanation: customsTariff.explanation,
        examples: [],
        hsCode: customsTariff.hsCode,
        isSpecific: true,
        searchScore: 1.0,
        displayText: `${customsTariff.hsCode} - ${customsTariff.explanation}`,
        subtitle: `Duty: ${(customsTariff.dutyRate * 100).toFixed(1)}%`
      });
    } else if (value) {
      setSelectedResult({
        type: 'cargo',
        id: value,
        name: value,
        searchValue: value,
        category: 'General Category',
        dutyRate: 0.15, // Default
        additionalFees: 1500,
        vatRate: 0.15,
        explanation: `Standard cargo classification for ${value}`,
        examples: [value],
        isSpecific: false,
        searchScore: 0.5,
        displayText: value,
        subtitle: 'General Category'
      });
    }
  }, [value, customsTariff]);

  const searchCargo = async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/cargo/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchTerm: term }),
      });

      if (response.ok) {
        const searchResults = await response.json();
        setResults(searchResults);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim() === "") {
      setResults([]);
      setShowResults(false);
      return;
    }
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchCargo(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleResultSelect = (result: CargoSearchResult) => {
    setSelectedResult(result);
    setSearchTerm("");
    setShowResults(false);
    
    if (result.type === 'customs') {
      // Set customs tariff data
      onCustomsSelect({
        hsCode: result.hsCode,
        dutyRate: result.dutyRate,
        vatRate: result.vatRate,
        additionalFees: result.additionalFees,
        explanation: result.explanation
      });
      // Also set the cargo type equivalent
      onCargoSelect(result.cargoTypeEquivalent || 'General Cargo');
    } else {
      // Set cargo type only
      onCargoSelect(result.name);
    }
  };

  const handleClear = () => {
    setSelectedResult(null);
    setSearchTerm("");
    setResults([]);
    setShowResults(false);
    onClear();
  };

  const getDutyColor = (dutyRate: number) => {
    if (dutyRate === 0) return "bg-green-100 text-green-800";
    if (dutyRate <= 0.05) return "bg-blue-100 text-blue-800";
    if (dutyRate <= 0.15) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="cargo-search" className="text-sm font-medium">
        What are you shipping? *
      </Label>
      
      {selectedResult ? (
        // Show selected cargo with details
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedResult.type === 'customs' ? (
                    <FileText className="h-4 w-4 text-green-600" />
                  ) : (
                    <Package className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="font-medium text-sm">
                    {selectedResult.displayText}
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getDutyColor(selectedResult.dutyRate)}>
                    {(selectedResult.dutyRate * 100).toFixed(1)}% Duty
                  </Badge>
                  <Badge variant="outline">
                    {selectedResult.category}
                  </Badge>
                  {selectedResult.isSpecific && (
                    <Badge className="bg-purple-100 text-purple-800">
                      Specific HS Code
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 leading-tight">
                  {selectedResult.explanation}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-700"
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Show search interface
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="cargo-search"
              placeholder="Search for your cargo (e.g., 'laptop', 'cotton shirt', 'machine parts')"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              </div>
            )}
          </div>

          {showResults && results.length > 0 && (
            <Card className="absolute z-10 w-full mt-1 max-h-80 overflow-auto border shadow-lg">
              <CardContent className="p-0">
                {results.map((result, index) => (
                  <div key={result.id} className="border-b last:border-b-0">
                    <Button
                      variant="ghost"
                      className="w-full p-3 h-auto justify-start text-left hover:bg-gray-50"
                      onClick={() => handleResultSelect(result)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="mt-1">
                          {result.type === 'customs' ? (
                            <FileText className="h-4 w-4 text-green-600" />
                          ) : (
                            <Package className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {result.displayText}
                            </span>
                            {result.isSpecific && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                Specific
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              className={`${getDutyColor(result.dutyRate)} text-xs`}
                            >
                              {(result.dutyRate * 100).toFixed(1)}% Duty
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {result.subtitle}
                            </span>
                          </div>

                          {result.examples.length > 0 && (
                            <p className="text-xs text-gray-500 line-clamp-1">
                              Examples: {result.examples.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {showResults && results.length === 0 && !isSearching && searchTerm.length >= 2 && (
            <Card className="absolute z-10 w-full mt-1 border shadow-lg">
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  No results found for "{searchTerm}"
                </p>
                <p className="text-xs text-gray-500">
                  Try searching for: laptop, phone, clothing, machinery, electronics
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!selectedResult && (
        <div className="text-xs text-gray-500 space-y-1">
          <p className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-green-600" />
            <span className="font-medium">Specific HS codes</span> provide exact duty rates
          </p>
          <p className="flex items-center gap-1">
            <Package className="h-3 w-3 text-blue-600" />
            <span className="font-medium">General categories</span> use standard rates
          </p>
        </div>
      )}
    </div>
  );
}