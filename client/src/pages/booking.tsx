import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Truck, DollarSign, Calendar, User, Building, Phone, Mail, MapPin, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Booking form schema
const bookingFormSchema = z.object({
  // Shipper information
  shipperName: z.string().min(1, "Shipper name is required"),
  shipperEmail: z.string().email("Valid email is required"),
  shipperPhone: z.string().min(10, "Valid phone number is required"),
  shipperCompany: z.string().optional(),
  shipperAddress: z.string().min(1, "Pickup address is required"),
  
  // Consignee information
  consigneeName: z.string().min(1, "Consignee name is required"),
  consigneeEmail: z.string().email("Valid email is required"),
  consigneePhone: z.string().min(10, "Valid phone number is required"),
  consigneeCompany: z.string().optional(),
  consigneeAddress: z.string().min(1, "Delivery address is required"),
  
  // Cargo details
  cargoDescription: z.string().min(10, "Please provide a detailed cargo description"),
  
  // Special requirements
  specialInstructions: z.string().optional(),
  preferredDeparture: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function BookingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCarrier, setSelectedCarrier] = useState<string>("");
  const [selectedFreightForwarder, setSelectedFreightForwarder] = useState<string>("");
  
  // Get quote ID and carrier from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const quoteId = urlParams.get("quoteId");
  const carrier = urlParams.get("carrier") || "";
  const freightForwarder = urlParams.get("freightForwarder") || "";
  
  useEffect(() => {
    if (carrier) {
      setSelectedCarrier(carrier);
    }
    if (freightForwarder) {
      setSelectedFreightForwarder(freightForwarder);
    }
  }, [carrier, freightForwarder]);
  
  // Fetch quote details
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: [`/api/quotes/${quoteId}`],
    enabled: !!quoteId,
  });
  
  // Initialize form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      shipperName: "",
      shipperEmail: "",
      shipperPhone: "",
      shipperCompany: "",
      shipperAddress: "",
      consigneeName: "",
      consigneeEmail: "",
      consigneePhone: "",
      consigneeCompany: "",
      consigneeAddress: "",
      cargoDescription: "",
      specialInstructions: "",
      preferredDeparture: "",
    },
  });
  
  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const response = await apiRequest("POST", "/api/bookings", {
        quoteId,
        carrierName: selectedCarrier,
        ...data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Booking Confirmed!",
        description: `Your booking reference is: ${data.bookingReference}`,
      });
      // Navigate to booking confirmation page
      setLocation(`/booking/confirmation/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: BookingFormValues) => {
    if (!selectedCarrier) {
      toast({
        title: "Select Carrier",
        description: "Please select a carrier before proceeding",
        variant: "destructive",
      });
      return;
    }
    createBookingMutation.mutate(data);
  };
  
  if (quoteLoading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }
  
  if (!quote) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Quote Not Found</h1>
          <p className="text-gray-600 mb-6">The quote you're looking for doesn't exist or has expired.</p>
          <Button onClick={() => setLocation("/calculator")}>
            Get New Quote
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/calculator")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Calculator
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Complete Your Booking</h1>
          <p className="text-gray-600">
            Please provide the required information to confirm your shipment booking
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Details</CardTitle>
                <CardDescription>
                  Enter the shipper and consignee information for your shipment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Shipper Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Shipper Information (Origin)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="shipperName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shipperCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="ABC Trading Co." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shipperEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shipperPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 234 567 8900" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shipperAddress"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Pickup Address *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="123 Main Street, Suite 100, City, State, ZIP, Country"
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Consignee Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Consignee Information (Destination)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="consigneeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="consigneeCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="XYZ Imports Ltd." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="consigneeEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="jane@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="consigneePhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="+27 11 123 4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="consigneeAddress"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Delivery Address *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="456 Commerce Road, Johannesburg, 2000, South Africa"
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Cargo Details */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Cargo Details
                      </h3>
                      <FormField
                        control={form.control}
                        name="cargoDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo Description *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Please provide a detailed description of your cargo including type of goods, packaging, and any special handling requirements..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    {/* Additional Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Additional Information
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="preferredDeparture"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Departure Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="specialInstructions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Instructions</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any special requirements or instructions for your shipment..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        size="lg"
                        disabled={createBookingMutation.isPending}
                      >
                        {createBookingMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Processing...
                          </>
                        ) : (
                          "Confirm Booking"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          {/* Quote Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Quote Summary</CardTitle>
                <CardDescription>
                  Review your shipment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Route Information */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Route
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Origin:</span>
                      <span className="font-medium">{quote?.originPort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Destination:</span>
                      <span className="font-medium">{quote?.destinationPort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Final Delivery:</span>
                      <span className="font-medium">{quote?.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Cargo Information */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Cargo
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Container:</span>
                      <span className="font-medium">{quote?.containerType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cargo Type:</span>
                      <span className="font-medium">{quote?.cargoType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium">{quote?.weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-medium">${quote?.value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Incoterm:</span>
                      <span className="font-medium">{quote?.incoterm}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Selected Providers */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Selected Providers
                  </h4>
                  {selectedCarrier ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-800">
                        Selected Carrier: {selectedCarrier} + DSV South Africa
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default" className="text-xs bg-blue-600">
                          {selectedCarrier}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-indigo-600 text-white">
                          DSV South Africa
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">No carrier selected</p>
                  )}
                </div>
                
                <Separator />
                
                {/* Detailed Cost Breakdown by Provider */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cost Breakdown by Provider
                  </h4>
                  
                  {/* MSC (Ocean Carrier) */}
                  {selectedCarrier && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-2">{selectedCarrier} (Ocean Carrier)</h5>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sea Freight:</span>
                          <span className="font-medium text-blue-600">
                            {formatCurrency(Math.round((quote?.breakdown?.seaFreight || 0) * 0.85))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Terminal Handling:</span>
                          <span className="font-medium text-blue-600">
                            {formatCurrency(Math.round((quote?.breakdown?.handling || 0) * 0.7))}
                          </span>
                        </div>
                        <div className="border-t border-blue-300 pt-1 mt-2 flex justify-between font-medium text-blue-800">
                          <span>{selectedCarrier} Total:</span>
                          <span>{formatCurrency(Math.round(((quote?.breakdown?.seaFreight || 0) * 0.85) + ((quote?.breakdown?.handling || 0) * 0.7)))}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DSV South Africa (Freight Forwarder) - Always show for complete bookings */}
                  <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h5 className="font-medium text-indigo-800 mb-2">DSV South Africa (Logistics)</h5>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customs Clearance:</span>
                        <span className="font-medium text-indigo-600">R 1,200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Port Clearance:</span>
                        <span className="font-medium text-indigo-600">R 650</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Local Trucking ({quote?.incoterm || 'FOB'}):
                        </span>
                        <span className="font-medium text-indigo-600">
                          {formatCurrency(quote?.truckingCost || 1800)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Documentation:</span>
                        <span className="font-medium text-indigo-600">R 180</span>
                      </div>
                      <div className="border-t border-indigo-300 pt-1 mt-2 flex justify-between font-medium text-indigo-800">
                        <span>DSV South Africa Total:</span>
                        <span>{formatCurrency((quote?.freightForwarders?.[0]?.totalCost || 3830))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Government Fees (SARS) */}
                  <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h5 className="font-medium text-orange-800 mb-2">Government Fees (SARS)</h5>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customs Duties:</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(quote?.breakdown?.customs || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">VAT (15%):</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(quote?.breakdown?.vat || 0)}
                        </span>
                      </div>
                      <div className="border-t border-orange-300 pt-1 mt-2 flex justify-between font-medium text-orange-800">
                        <span>Government Total:</span>
                        <span>{formatCurrency((quote?.breakdown?.customs || 0) + (quote?.breakdown?.vat || 0))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Final Total - Using integrated DSV trucking costs */}
                  <div className="p-3 bg-green-50 rounded-lg border-2 border-green-400">
                    <div className="flex justify-between text-lg font-bold text-green-800">
                      <span>Complete Total:</span>
                      <span>{formatCurrency(quote?.totalCost || 196320)}</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      All-inclusive door-to-door shipping (no double-charging)
                    </p>
                  </div>
                </div>
                
                {/* Timeline */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Estimated Timeline
                  </h4>
                  <div className="text-sm text-gray-600">
                    <p>Transit time: 18-22 days</p>
                    <p>Customs clearance: 2-3 days</p>
                    <p>Final delivery: 1-2 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}