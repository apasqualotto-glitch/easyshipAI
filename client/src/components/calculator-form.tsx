import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quoteRequestSchema, type QuoteRequest } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Truck, Ship, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProgressStepper from "./progress-stepper";
import { Port, Destination, CargoType, Incoterm } from "@shared/schema";

interface CustomsTariff {
  hsCode: string;
  description: string;
  dutyRate: number;
  additionalFees: number;
  vatRate: number;
  category: string;
  explanation: string;
  examples: string[];
}
import { useState, useEffect } from "react";

interface CalculatorFormProps {
  onQuoteUpdate: (data: QuoteRequest) => void;
  onQuoteResult: (result: any) => void;
}

export default function CalculatorForm({ onQuoteUpdate, onQuoteResult }: CalculatorFormProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [useLiveRates, setUseLiveRates] = useState(false);
  const [customsTariffs, setCustomsTariffs] = useState<CustomsTariff[]>([]);
  const [selectedCustomsTariff, setSelectedCustomsTariff] = useState<CustomsTariff | null>(null);
  const [showCustomsSearch, setShowCustomsSearch] = useState(false);
  const [customsSearchTerm, setCustomsSearchTerm] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const form = useForm<QuoteRequest>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      originPort: "",
      destinationPort: "",
      finalDestination: "",
      containerType: "20ft",
      cargoType: "",
      incoterm: "",
      weight: 0,
      value: 0,
    },
  });

  const { data: originPorts = [] } = useQuery({
    queryKey: ["/api/ports/origin"],
  });

  const { data: destinationPorts = [] } = useQuery({
    queryKey: ["/api/ports/destination"],
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ["/api/destinations"],
  });

  const { data: cargoTypes = [] } = useQuery({
    queryKey: ["/api/cargo-types"],
  });

  const { data: incoterms = [] } = useQuery({
    queryKey: ["/api/incoterms"],
  });

  const calculateQuoteMutation = useMutation({
    mutationFn: async (data: QuoteRequest) => {
      const endpoint = useLiveRates ? "/api/calculate-quote-with-live" : "/api/calculate-quote";
      const response = await apiRequest("POST", endpoint, data);
      return response.json();
    },
    onSuccess: (result) => {
      onQuoteResult(result);
      setCurrentStep(3);
      const rateSource = result.hasLiveRates ? "live carrier rates" : "estimates";
      const savings = result.liveRateInfo?.savings || 0;
      const savingsText = savings > 0 ? ` (Save R ${Math.abs(savings).toLocaleString()})` : 
                          savings < 0 ? ` (R ${Math.abs(savings).toLocaleString()} higher)` : "";
      
      toast({
        title: "Quote calculated successfully! ✅",
        description: `Total cost: R ${result.totalCost.toLocaleString()} using ${rateSource}${savingsText}. Check the "Costs" tab on the right to see full breakdown.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to calculate quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (Object.values(watchedValues).some(value => value !== "" && value !== 0)) {
      onQuoteUpdate(watchedValues);
    }
  }, [watchedValues, onQuoteUpdate]);

  const searchCustomsTariffs = async (searchTerm: string) => {
    console.log("Searching for:", searchTerm);
    if (!searchTerm.trim()) return;
    
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
        console.log("Search results:", results);
        setCustomsTariffs(results);
        
        if (results.length === 0) {
          toast({
            title: "No results found",
            description: `No customs data found for "${searchTerm}". Try different keywords.`,
            variant: "destructive",
          });
        }
      } else {
        console.error("Search response not ok:", response.status);
      }
    } catch (error) {
      console.error("Customs search failed:", error);
      toast({
        title: "Search failed",
        description: "Unable to search customs database. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCustomsTariffSelect = (tariff: CustomsTariff) => {
    setSelectedCustomsTariff(tariff);
    
    // Find matching cargo type or use "Other"
    const cargoTypesData = (cargoTypes as any[]) || [];
    const matchingCargoType = cargoTypesData.find((ct: any) => 
      ct.name.toLowerCase().includes(tariff.category.toLowerCase()) ||
      tariff.category.toLowerCase().includes(ct.name.toLowerCase())
    );
    
    const cargoTypeToUse = matchingCargoType?.name || "Other";
    form.setValue("cargoType", cargoTypeToUse);
    
    setShowCustomsSearch(false);
    setCustomsSearchTerm("");
    
    toast({
      title: "HS Code Selected",
      description: `${tariff.hsCode}: ${tariff.description} (${(tariff.dutyRate * 100).toFixed(1)}% duty)`,
    });
  };

  const onSubmit = (data: QuoteRequest) => {
    // Include customs tariff information if selected
    const enhancedData = {
      ...data,
      customsTariff: selectedCustomsTariff ? {
        hsCode: selectedCustomsTariff.hsCode,
        dutyRate: selectedCustomsTariff.dutyRate,
        vatRate: selectedCustomsTariff.vatRate,
        additionalFees: selectedCustomsTariff.additionalFees,
        explanation: selectedCustomsTariff.explanation
      } : undefined
    };
    
    calculateQuoteMutation.mutate(enhancedData);
  };

  const containerOptions = [
    {
      value: "20ft",
      title: "20ft Standard",
      dimensions: "5.9m × 2.35m × 2.39m",
      weight: "Max: 28,080 kg",
      icon: "inventory_2"
    },
    {
      value: "40ft",
      title: "40ft Standard", 
      dimensions: "12.03m × 2.35m × 2.39m",
      weight: "Max: 26,680 kg",
      icon: "inventory"
    },
    {
      value: "40ft-hc",
      title: "40ft High Cube",
      dimensions: "12.03m × 2.35m × 2.69m", 
      weight: "Max: 26,680 kg",
      icon: "unarchive"
    }
  ];

  return (
    <Card className="shadow-material">
      <CardContent className="p-6">
        <ProgressStepper currentStep={currentStep} />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <h3 className="text-xl font-medium text-gray-900 mb-6">Step 1: Select Your Route</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="originPort" className="flex items-center">
                Origin Port
                <div className="tooltip-trigger relative inline-block ml-1">
                  <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                  <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                    Select the port where your cargo will be shipped from
                  </div>
                </div>
              </Label>
              <Select onValueChange={(value) => form.setValue("originPort", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select origin port" />
                </SelectTrigger>
                <SelectContent>
                  {(originPorts as Port[]).map((port) => (
                    <SelectItem key={port.id} value={port.code}>
                      {port.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="destinationPort" className="flex items-center">
                South African Port
                <div className="tooltip-trigger relative inline-block ml-1">
                  <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                  <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                    Choose which SA port your cargo will arrive at
                  </div>
                </div>
              </Label>
              <Select onValueChange={(value) => form.setValue("destinationPort", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SA port" />
                </SelectTrigger>
                <SelectContent>
                  {(destinationPorts as Port[]).map((port) => (
                    <SelectItem key={port.id} value={port.code}>
                      {port.name} ({port.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="finalDestination" className="flex items-center">
                Final Destination City
                <div className="tooltip-trigger relative inline-block ml-1">
                  <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                  <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                    Select the city for trucking cost calculation
                  </div>
                </div>
              </Label>
              <Select onValueChange={(value) => form.setValue("finalDestination", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination city" />
                </SelectTrigger>
                <SelectContent>
                  {(destinations as Destination[]).map((dest) => (
                    <SelectItem key={dest.id} value={dest.name}>
                      {dest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deliveryAddress" className="flex items-center">
                Delivery Address
                <div className="tooltip-trigger relative inline-block ml-1">
                  <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                  <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                    Enter the specific delivery address for your cargo
                  </div>
                </div>
              </Label>
              <Input
                id="deliveryAddress"
                placeholder="123 Business Street, Industrial Area, City"
                {...form.register("deliveryAddress")}
                className="h-10"
              />
            </div>
          </div>

          <div>
            <Label className="flex items-center mb-3">
              Container Type & Size
              <div className="tooltip-trigger relative inline-block ml-1">
                <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                  Choose based on your cargo volume. HC = High Cube (extra height)
                </div>
              </div>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {containerOptions.map((option) => (
                <label key={option.value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    {...form.register("containerType")}
                    className="sr-only peer"
                  />
                  <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50">
                    <div className="text-center">
                      <span className="material-icons text-3xl text-gray-600 mb-2">{option.icon}</span>
                      <h4 className="font-medium text-gray-900">{option.title}</h4>
                      <p className="text-sm text-gray-500">{option.dimensions}</p>
                      <p className="text-xs text-gray-400 mt-1">{option.weight}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Cargo Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Total Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g., 15000"
                  {...form.register("weight", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="cargoType" className="flex items-center justify-between">
                  <span>Cargo Type</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomsSearch(!showCustomsSearch)}
                    className={`text-xs ${selectedCustomsTariff ? 'bg-green-50 border-green-300 text-green-700' : ''}`}
                  >
                    {selectedCustomsTariff ? `HS: ${selectedCustomsTariff.hsCode}` : 
                     showCustomsSearch ? "Use Basic Types" : "Advanced HS Lookup"}
                  </Button>
                </Label>
                
                {selectedCustomsTariff && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">Selected HS Code: {selectedCustomsTariff.hsCode}</p>
                        <p className="text-xs text-green-600">{selectedCustomsTariff.description}</p>
                        <p className="text-xs text-green-600">Duty: {(selectedCustomsTariff.dutyRate * 100).toFixed(1)}% | VAT: {(selectedCustomsTariff.vatRate * 100).toFixed(1)}%</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomsTariff(null);
                          form.setValue("cargoType", "");
                        }}
                        className="text-green-700 hover:text-green-900"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}
                
                {showCustomsSearch ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm">
                      <div className="flex items-start gap-2">
                        <span className="material-icons text-blue-600 text-sm mt-0.5">info</span>
                        <div>
                          <p className="text-blue-800 font-medium mb-1">HS Code Classification Help</p>
                          <p className="text-blue-700 text-xs leading-relaxed">
                            Describe your product in simple terms. We'll help match it to the correct customs code and show you the exact duty rates and requirements.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Describe your product (e.g., smartphone, laptop, jeans, wine)..."
                        value={customsSearchTerm}
                        onChange={(e) => {
                          setCustomsSearchTerm(e.target.value);
                          if (e.target.value.length > 2) {
                            // Get suggestions as user types
                            fetch("/api/customs/suggestions", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ searchTerm: e.target.value })
                            }).then(res => res.json()).then(setSearchSuggestions).catch(console.error);
                          } else {
                            setSearchSuggestions([]);
                          }
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && searchCustomsTariffs(customsSearchTerm)}
                      />
                      <Button 
                        type="button"
                        onClick={() => searchCustomsTariffs(customsSearchTerm)}
                        size="sm"
                        disabled={!customsSearchTerm.trim()}
                      >
                        Search
                      </Button>
                    </div>

                    {searchSuggestions.length > 0 && customsSearchTerm.length > 2 && (
                      <div className="border rounded-lg p-2 bg-gray-50">
                        <p className="text-xs text-gray-600 mb-2">Suggestions:</p>
                        <div className="flex flex-wrap gap-1">
                          {searchSuggestions.slice(0, 6).map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="text-xs px-2 py-1 bg-white border rounded hover:bg-blue-50 hover:border-blue-300"
                              onClick={() => {
                                setCustomsSearchTerm(suggestion);
                                searchCustomsTariffs(suggestion);
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {customsTariffs.length > 0 && (
                      <div className="max-h-48 overflow-y-auto border rounded-lg">
                        {customsTariffs.map((tariff) => (
                          <div
                            key={tariff.hsCode}
                            className="p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleCustomsTariffSelect(tariff)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-mono text-sm font-medium text-blue-600">
                                  {tariff.hsCode}
                                </div>
                                <div className="text-sm text-gray-700 mb-1">
                                  {tariff.description}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Examples: {tariff.examples.slice(0, 2).join(", ")}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold text-sm ${
                                  tariff.dutyRate === 0 ? 'text-green-600' :
                                  tariff.dutyRate <= 0.1 ? 'text-yellow-600' :
                                  tariff.dutyRate <= 0.25 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  {(tariff.dutyRate * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500">Duty</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedCustomsTariff && (
                      <div className="bg-blue-50 p-3 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-mono text-sm font-medium text-blue-600">
                              {selectedCustomsTariff.hsCode}
                            </div>
                            <div className="text-sm text-gray-700">
                              {selectedCustomsTariff.description}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {selectedCustomsTariff.explanation}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">
                              {(selectedCustomsTariff.dutyRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Duty Rate</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {customsSearchTerm && customsTariffs.length === 0 && searchSuggestions.length === 0 && (
                      <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                        <div className="flex items-start gap-2">
                          <span className="material-icons text-yellow-600 text-sm mt-0.5">lightbulb</span>
                          <div>
                            <p className="text-yellow-800 font-medium mb-2">No exact matches found</p>
                            <p className="text-yellow-700 text-sm mb-3">
                              Try these tips to find your product's customs classification:
                            </p>
                            <ul className="text-yellow-700 text-xs space-y-1 mb-3">
                              <li>• Use common product names (e.g., "phone" instead of "telecommunications device")</li>
                              <li>• Try brand names (e.g., "iPhone", "Samsung Galaxy")</li>
                              <li>• Include material (e.g., "cotton shirt", "leather shoes")</li>
                              <li>• Use category names (e.g., "electronics", "clothing", "automotive")</li>
                            </ul>
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-yellow-700">Popular searches:</span>
                              {["smartphones", "laptops", "clothing", "cars", "shoes", "wine"].map((term) => (
                                <button
                                  key={term}
                                  type="button"
                                  className="text-xs px-2 py-1 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200"
                                  onClick={() => {
                                    setCustomsSearchTerm(term);
                                    searchCustomsTariffs(term);
                                  }}
                                >
                                  {term}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Select onValueChange={(value) => form.setValue("cargoType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cargo type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(cargoTypes as CargoType[]).map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="value">Cargo Value (USD)</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="e.g., 50000"
                  {...form.register("value", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500 mt-1">Used for customs duty calculation</p>
              </div>
              <div>
                <Label htmlFor="incoterm" className="flex items-center">
                  Incoterm
                  <div className="tooltip-trigger relative inline-block ml-1">
                    <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                    <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                      Defines who pays for what and where risk transfers
                    </div>
                  </div>
                </Label>
                <Select onValueChange={(value) => form.setValue("incoterm", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select incoterm" />
                  </SelectTrigger>
                  <SelectContent>
                    {(incoterms as Incoterm[]).map((incoterm) => (
                      <SelectItem key={incoterm.id} value={incoterm.code}>
                        {incoterm.code} - {incoterm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Live Shipping Rates Toggle */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Live Carrier Rates</span>
                </div>
                <Switch
                  checked={useLiveRates}
                  onCheckedChange={setUseLiveRates}
                />
              </div>
              <div className="text-sm text-blue-700">
                {useLiveRates ? "Using real-time rates from Maersk" : "Using rate estimates"}
              </div>
            </div>
            
            <div className="mt-3 text-sm text-blue-600">
              <div className="flex items-start space-x-2">
                <Ship className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Live rates from major shipping carriers:</p>
                  <ul className="mt-1 space-y-1 text-blue-600">
                    <li>• Maersk (free live rates)</li>
                    <li>• MSC (contact for setup)</li>
                    <li>• More carriers coming soon</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" disabled>
              Previous
            </Button>
            <Button 
              type="submit" 
              disabled={calculateQuoteMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {calculateQuoteMutation.isPending ? "Calculating..." : 
               useLiveRates ? "Get Live Quote" : "Calculate Quote"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
