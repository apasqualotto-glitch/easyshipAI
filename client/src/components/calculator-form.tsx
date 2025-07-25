import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quoteRequestSchema, type QuoteRequest } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProgressStepper from "./progress-stepper";
import { Port, Destination, CargoType, Incoterm } from "@shared/schema";
import { useState, useEffect } from "react";

interface CalculatorFormProps {
  onQuoteUpdate: (data: QuoteRequest) => void;
  onQuoteResult: (result: any) => void;
}

export default function CalculatorForm({ onQuoteUpdate, onQuoteResult }: CalculatorFormProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

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
      const response = await apiRequest("POST", "/api/calculate-quote", data);
      return response.json();
    },
    onSuccess: (result) => {
      onQuoteResult(result);
      setCurrentStep(3);
      toast({
        title: "Quote calculated successfully",
        description: `Total cost: R ${result.totalCost.toLocaleString()}`,
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

  const onSubmit = (data: QuoteRequest) => {
    calculateQuoteMutation.mutate(data);
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

          <div>
            <Label htmlFor="finalDestination" className="flex items-center">
              Final Destination in South Africa
              <div className="tooltip-trigger relative inline-block ml-1">
                <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                  Where should we deliver your cargo? This affects trucking costs.
                </div>
              </div>
            </Label>
            <Select onValueChange={(value) => form.setValue("finalDestination", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select final destination" />
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
                <Label htmlFor="cargoType" className="flex items-center">
                  Cargo Type
                  <div className="tooltip-trigger relative inline-block ml-1">
                    <span className="material-icons text-gray-400 text-sm cursor-help">help_outline</span>
                    <div className="tooltip absolute bottom-6 left-0 bg-gray-900 text-white text-xs p-2 rounded opacity-0 invisible whitespace-nowrap z-10">
                      Cargo type affects customs duties and handling requirements
                    </div>
                  </div>
                </Label>
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

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" disabled>
              Previous
            </Button>
            <Button 
              type="submit" 
              disabled={calculateQuoteMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {calculateQuoteMutation.isPending ? "Calculating..." : "Calculate Quote"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
