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
import { Badge } from "@/components/ui/badge";
import { Truck, Ship, Zap, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProgressStepper from "./progress-stepper";
import { Port, Destination, CargoType, Incoterm } from "@shared/schema";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import UnifiedCargoSearch from "./unified-cargo-search";
import { AddressAutocomplete } from "./address-autocomplete";

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
  initialValues?: Partial<QuoteRequest>;
  resetTrigger?: number;
}

export default function CalculatorForm({ onQuoteUpdate, onQuoteResult, initialValues, resetTrigger }: CalculatorFormProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [useLiveRates, setUseLiveRates] = useState(true); // Always use live rates by default
  const [selectedCustomsTariff, setSelectedCustomsTariff] = useState<CustomsTariff | null>(null);
  const [originPortOpen, setOriginPortOpen] = useState(false);
  const [destinationPortOpen, setDestinationPortOpen] = useState(false);
  const [selectedOriginPort, setSelectedOriginPort] = useState("");
  const [selectedDestinationPort, setSelectedDestinationPort] = useState("");

  const form = useForm<QuoteRequest>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      originPort: "",
      destinationPort: "",
      deliveryAddress: "",
      containerType: "20ft",
      cargoType: "",
      incoterm: "",
      weight: 0,
      value: 0,
    },
  });

  const { data: originPorts = [] } = useQuery({ queryKey: ["/api/ports/origin"] });
  const { data: destinationPorts = [] } = useQuery({ queryKey: ["/api/ports/destination"] });
  const { data: incoterms = [] } = useQuery({ queryKey: ["/api/incoterms"] });

  // Add validation mutation to check data consistency
  const validateQuoteMutation = useMutation({
    mutationFn: async (data: QuoteRequest) => {
      const response = await apiRequest("POST", "/api/validate-quote", data);
      return response.json();
    },
  });

  const calculateQuoteMutation = useMutation({
    mutationFn: async (data: QuoteRequest) => {
      // First validate the data for consistency
      const validation = await validateQuoteMutation.mutateAsync(data);
      
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(", ")}`);
      }

      // Show warnings about data consistency if any
      if (validation.warnings && validation.warnings.length > 0) {
        toast({
          title: "Data Check Warning",
          description: validation.warnings[0], // Show first warning
          variant: "default",
        });
      }

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
        description: `Total cost: R ${result.totalCost.toLocaleString()} | Weight: ${result.weight}kg | Origin: ${result.originCountry || 'Unknown'} using ${rateSource}${savingsText}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Quote calculation failed",
        description: error.message || "Failed to calculate quote. Please check your input and try again.",
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

  // Update form values when initialValues change (from AI chat)
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      console.log('📝 Updating form with AI extracted values:', initialValues);
      
      // Set each field that has a value
      Object.entries(initialValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          form.setValue(key as keyof QuoteRequest, value as any, { 
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true 
          });
          
          // Update the selected port display values - convert ID to code if needed
          if (key === 'originPort') {
            const port = (originPorts as Port[]).find(p => p.id === value || p.code === value);
            if (port) {
              setSelectedOriginPort(port.code);
              form.setValue("originPort", port.code);
              console.log(`✅ Origin port set: ${port.name} (${port.code})`);
            }
          }
          if (key === 'destinationPort') {
            const port = (destinationPorts as Port[]).find(p => p.id === value || p.code === value);
            if (port) {
              setSelectedDestinationPort(port.code);
              form.setValue("destinationPort", port.code);
              console.log(`✅ Destination port set: ${port.name} (${port.code})`);
            }
          }
        }
      });
      
      // Show toast notification
      toast({
        title: "Form auto-populated! 🚀",
        description: "I've filled in the information from your chat. Please complete any missing fields.",
        duration: 4000,
      });
    }
  }, [initialValues, form, toast, originPorts, destinationPorts]);

  // Reset form when resetTrigger changes
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      console.log('🔄 Starting complete form reset...');
      
      // Reset form to default values
      form.reset({
        originPort: "",
        destinationPort: "",
        deliveryAddress: "",
        containerType: "20ft",
        cargoType: "",
        incoterm: "",
        weight: 0,
        value: 0,
      });
      
      // Clear all local state
      setSelectedOriginPort("");
      setSelectedDestinationPort("");
      setSelectedCustomsTariff(null);
      setCurrentStep(1);
      
      // Clear each form field explicitly to ensure UI updates
      setTimeout(() => {
        form.setValue("originPort", "");
        form.setValue("destinationPort", "");
        form.setValue("deliveryAddress", "");
        form.setValue("containerType", "20ft");
        form.setValue("cargoType", "");
        form.setValue("incoterm", "");
        form.setValue("weight", 0);
        form.setValue("value", 0);
        console.log('✅ Form completely reset - all fields cleared');
      }, 100);
      
      // Show confirmation toast
      toast({
        title: "Reset Complete! 🔄",
        description: "Chat conversation and calculator form have been cleared",
        duration: 3000,
      });
    }
  }, [resetTrigger, form, toast]);

  const onSubmit = (data: QuoteRequest) => {
    console.log('🚀 Form submission triggered with data:', data);
    console.log('📊 Form errors:', form.formState.errors);
    
    // Validate required fields and show user-friendly error messages
    const errors: string[] = [];
    
    if (!data.originPort || data.originPort === "") {
      errors.push("Please select a port of origin");
    }
    
    if (!data.destinationPort || data.destinationPort === "") {
      errors.push("Please select a destination port");
    }
    
    if (!data.deliveryAddress || data.deliveryAddress.trim() === "") {
      errors.push("Please enter your delivery address");
    }
    
    if (!data.containerType || data.containerType === "") {
      errors.push("Please select a container type");
    }
    
    if (!data.cargoType || data.cargoType.trim() === "") {
      errors.push("Please describe your cargo type");
    }
    
    if (!data.incoterm || data.incoterm === "") {
      errors.push("Please select an Incoterm");
    }
    
    if (!data.weight || data.weight <= 0) {
      errors.push("Please enter the cargo weight");
    }
    
    if (!data.value || data.value <= 0) {
      errors.push("Please enter the cargo value");
    }
    
    // Show error messages if any required fields are missing
    if (errors.length > 0) {
      toast({
        title: "Missing Information ⚠️",
        description: (
          <div className="space-y-1">
            <p className="font-medium">Please complete the following:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        ) as any,
        variant: "destructive",
        duration: 6000,
      });
      return; // Stop form submission
    }
    
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
    
    console.log('📦 Enhanced data being sent:', enhancedData);
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
    },
    {
      value: "partial",
      title: "Partial Shipment",
      dimensions: "Shared container space",
      weight: "Based on cargo volume",
      icon: "inventory_2"
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
                Port of Origin
                <div className="tooltip-trigger relative inline-block ml-1">
                  <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                  <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                    Search and select the port where your cargo will be shipped from
                  </div>
                </div>
              </Label>
              <Popover open={originPortOpen} onOpenChange={setOriginPortOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={originPortOpen}
                    className="w-full justify-between"
                  >
                    {selectedOriginPort
                      ? (originPorts as Port[]).find((port) => port.code === selectedOriginPort)?.name
                      : "Search and select origin port..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search ports..." />
                    <CommandEmpty>No port found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup heading="China">
                        {(originPorts as Port[]).filter(port => port.country === "China").map((port) => (
                          <CommandItem
                            key={port.id}
                            value={port.name}
                            onSelect={() => {
                              setSelectedOriginPort(port.code);
                              form.setValue("originPort", port.code);
                              setOriginPortOpen(false);
                            }}
                          >
                            {port.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Europe">
                        {(originPorts as Port[]).filter(port => ["Germany", "Netherlands", "United Kingdom", "Belgium", "Spain", "France", "Italy", "Greece", "Portugal", "Sweden", "Denmark", "Poland"].includes(port.country)).map((port) => (
                          <CommandItem
                            key={port.id}
                            value={port.name}
                            onSelect={() => {
                              setSelectedOriginPort(port.code);
                              form.setValue("originPort", port.code);
                              setOriginPortOpen(false);
                            }}
                          >
                            {port.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Asia Pacific">
                        {(originPorts as Port[]).filter(port => ["India", "Singapore", "Malaysia", "Thailand", "Hong Kong", "South Korea", "Japan", "Taiwan", "Indonesia", "Philippines", "Vietnam", "Sri Lanka", "Pakistan", "Bangladesh"].includes(port.country)).map((port) => (
                          <CommandItem
                            key={port.id}
                            value={port.name}
                            onSelect={() => {
                              setSelectedOriginPort(port.code);
                              form.setValue("originPort", port.code);
                              setOriginPortOpen(false);
                            }}
                          >
                            {port.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Americas">
                        {(originPorts as Port[]).filter(port => ["USA", "Canada", "Brazil", "Argentina", "Chile", "Colombia", "Mexico"].includes(port.country)).map((port) => (
                          <CommandItem
                            key={port.id}
                            value={port.name}
                            onSelect={() => {
                              setSelectedOriginPort(port.code);
                              form.setValue("originPort", port.code);
                              setOriginPortOpen(false);
                            }}
                          >
                            {port.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Middle East & Africa">
                        {(originPorts as Port[]).filter(port => ["UAE", "Morocco", "Egypt", "Saudi Arabia", "Kuwait", "Qatar", "Iran", "Nigeria", "Ghana", "Kenya", "Tanzania"].includes(port.country)).map((port) => (
                          <CommandItem
                            key={port.id}
                            value={port.name}
                            onSelect={() => {
                              setSelectedOriginPort(port.code);
                              form.setValue("originPort", port.code);
                              setOriginPortOpen(false);
                            }}
                          >
                            {port.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="destinationPort" className="flex items-center">
                Destination Port
                <div className="tooltip-trigger relative inline-block ml-1">
                  <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                  <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                    Choose the port where your cargo will arrive
                  </div>
                </div>
              </Label>
              <Popover open={destinationPortOpen} onOpenChange={setDestinationPortOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={destinationPortOpen}
                    className="w-full justify-between"
                  >
                    {selectedDestinationPort
                      ? (destinationPorts as Port[]).find((port) => port.code === selectedDestinationPort)?.name
                      : "Search and select destination port..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search destination ports..." />
                    <CommandEmpty>No port found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup heading="South African Ports">
                        {(destinationPorts as Port[]).filter(port => port.country === "South Africa").map((port) => (
                          <CommandItem
                            key={port.id}
                            value={port.name}
                            onSelect={() => {
                              setSelectedDestinationPort(port.code);
                              form.setValue("destinationPort", port.code);
                              setDestinationPortOpen(false);
                            }}
                          >
                            {port.name} ({port.code})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="International Ports (Exports)">
                        {(destinationPorts as Port[]).filter(port => port.country !== "South Africa").map((port) => (
                          <CommandItem
                            key={port.id}
                            value={port.name}
                            onSelect={() => {
                              setSelectedDestinationPort(port.code);
                              form.setValue("destinationPort", port.code);
                              setDestinationPortOpen(false);
                            }}
                          >
                            {port.name} ({port.code})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <div>
              <Label htmlFor="deliveryAddress" className="flex items-center">
                Delivery Address
                <div className="tooltip-trigger relative inline-block ml-1">
                  <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                  <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                    Start typing for intelligent address suggestions with distance-based trucking costs
                  </div>
                </div>
              </Label>
              <AddressAutocomplete
                value={form.watch("deliveryAddress")}
                onChange={(address, addressData) => {
                  form.setValue("deliveryAddress", address);
                  // Note: Distance data will be used by backend API for precise calculations
                  // No need to store in form as backend will calculate from address
                }}
                portCode={form.watch("destinationPort")}
                incoterm={form.watch("incoterm")}
                containerType={form.watch("containerType")}
                placeholder="Start typing your delivery address..."
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                🎯 Interactive address lookup with precise distance-based trucking costs
              </p>
            </div>
          </div>

          <div>
            <Label className="flex items-center mb-3">
              Container Type & Size
              <div className="tooltip-trigger relative inline-block ml-1">
                <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                  Choose based on your cargo volume. HC = High Cube (extra height). Partial = Shared container space.
                </div>
              </div>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {containerOptions.map((option) => (
                <label key={option.value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    {...form.register("containerType")}
                    className="sr-only peer"
                  />
                  <div className={`border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 ${
                    option.value === "partial" ? "bg-blue-50 border-blue-200" : ""
                  }`}>
                    <div className="text-center">
                      <span className="material-icons text-3xl text-gray-600 mb-2">{option.icon}</span>
                      <h4 className="font-medium text-gray-900">{option.title}</h4>
                      <p className="text-sm text-gray-500">{option.dimensions}</p>
                      <p className="text-xs text-gray-400 mt-1">{option.weight}</p>
                      {option.value === "partial" && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">Cost-effective option</p>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Partial Shipment Additional Fields */}
            {form.watch("containerType") === "partial" && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-4 flex items-center">
                  <span className="material-icons text-blue-600 mr-2">info</span>
                  Partial Shipment Details
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cargoVolume" className="flex items-center">
                      Cargo Volume (CBM)
                      <div className="tooltip-trigger relative inline-block ml-1">
                        <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                        <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                          Cubic meters (Length × Width × Height in meters)
                        </div>
                      </div>
                    </Label>
                    <Input
                      id="cargoVolume"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 2.5"
                      {...form.register("cargoVolume", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-blue-600 mt-1">Required for shared container pricing</p>
                  </div>
                  <div>
                    <Label htmlFor="packageCount">Number of Packages</Label>
                    <Input
                      id="packageCount"
                      type="number"
                      placeholder="e.g., 10"
                      {...form.register("packageCount", { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="packageLength">Package Length (cm)</Label>
                    <Input
                      id="packageLength"
                      type="number"
                      placeholder="e.g., 120"
                      {...form.register("packageLength", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="packageWidth">Package Width (cm)</Label>
                    <Input
                      id="packageWidth"
                      type="number"
                      placeholder="e.g., 80"
                      {...form.register("packageWidth", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="packageHeight">Package Height (cm)</Label>
                    <Input
                      id="packageHeight"
                      type="number"
                      placeholder="e.g., 60"
                      {...form.register("packageHeight", { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="specialHandling">Special Handling Requirements</Label>
                  <Select onValueChange={(value) => form.setValue("specialHandling", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select if any special handling needed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No special handling</SelectItem>
                      <SelectItem value="fragile">Fragile items</SelectItem>
                      <SelectItem value="hazardous">Hazardous materials</SelectItem>
                      <SelectItem value="temperature">Temperature controlled</SelectItem>
                      <SelectItem value="high-value">High value items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Partial shipments</span> are cost-effective for smaller cargo volumes. 
                    Your goods will share container space with other shipments, reducing costs while maintaining security and tracking.
                  </p>
                </div>
              </div>
            )}
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
              <div className="md:col-span-2">
                <UnifiedCargoSearch
                  value={form.watch("cargoType")}
                  customsTariff={selectedCustomsTariff}
                  onCargoSelect={(cargoType) => form.setValue("cargoType", cargoType)}
                  onCustomsSelect={(customsTariff) => setSelectedCustomsTariff(customsTariff)}
                  onClear={() => {
                    setSelectedCustomsTariff(null);
                    form.setValue("cargoType", "");
                  }}
                />
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
                <Select onValueChange={(value) => form.setValue("incoterm", value)} value={form.watch("incoterm")}>
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

          {/* Live Shipping Rates - Always Enabled */}
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Live Carrier Rates Enabled</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
              </div>
              <div className="text-sm text-green-700">
                Getting real-time rates from all major carriers
              </div>
            </div>
            
            <div className="mt-3 text-sm text-green-600">
              <div className="flex items-start space-x-2">
                <span className="material-icons text-green-500 text-sm mt-0.5 flex-shrink-0">check_circle</span>
                <div>
                  <p className="font-medium mb-1">All Carrier Options Included</p>
                  <p className="text-xs leading-relaxed">
                    Comparing real-time rates from Maersk, MSC, CMA CGM, and other major shipping lines to get you the best price and transit time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3"
            disabled={calculateQuoteMutation.isPending}
            onClick={(e) => {
              console.log('🖱️ Quote button clicked');
              console.log('📝 Current form values:', form.getValues());
              console.log('🔍 Form valid?', form.formState.isValid);
              console.log('❌ Form errors:', form.formState.errors);
              
              // If form has validation errors, prevent default and show specific guidance
              if (!form.formState.isValid && Object.keys(form.formState.errors).length > 0) {
                e.preventDefault();
                console.log('❌ Form validation failed, preventing submission');
              }
            }}
          >
            {calculateQuoteMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Calculating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Calculate Shipping Quote</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}