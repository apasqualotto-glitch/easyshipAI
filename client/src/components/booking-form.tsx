import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface BookingFormProps {
  quoteData: any;
  onBookingCreated: (booking: any) => void;
}

interface CarrierInfo {
  code: string;
  name: string;
  description: string;
  apiStatus: 'AVAILABLE' | 'SETUP_REQUIRED' | 'COMING_SOON';
  services: string[];
  coverage: string;
  bookingSupport: boolean;
}

export function BookingForm({ quoteData, onBookingCreated }: BookingFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [carriers, setCarriers] = useState<CarrierInfo[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [preSelectedCarrier, setPreSelectedCarrier] = useState<string>('');
  const [preSelectedService, setPreSelectedService] = useState<string>('');
  const [preSelectedRate, setPreSelectedRate] = useState<number>(0);
  
  const [formData, setFormData] = useState({
    // Shipper Information
    shipperName: '',
    shipperAddress: '',
    shipperCity: '',
    shipperCountry: '',
    shipperEmail: '',
    shipperPhone: '',
    
    // Consignee Information
    consigneeName: '',
    consigneeAddress: '',
    consigneeCity: '',
    consigneeCountry: 'South Africa',
    consigneeEmail: '',
    consigneePhone: '',
    
    // Cargo Details
    commodityCode: quoteData?.customsInfo?.hsCode || '',
    cargoDescription: '',
    dangerousGoods: false,
    
    // Service Details
    serviceType: 'FCL',
    preferredDeparture: '',
    specialInstructions: ''
  });

  // Load available carriers and check for pre-selected carrier from URL
  useState(() => {
    // Check URL parameters for pre-selected carrier
    const urlParams = new URLSearchParams(window.location.search);
    const carrierFromUrl = urlParams.get('carrier');
    const serviceFromUrl = urlParams.get('service');
    const rateFromUrl = urlParams.get('rate');
    
    if (carrierFromUrl) {
      setPreSelectedCarrier(decodeURIComponent(carrierFromUrl));
      setSelectedCarrier(getCarrierCode(decodeURIComponent(carrierFromUrl)));
    }
    if (serviceFromUrl) {
      setPreSelectedService(decodeURIComponent(serviceFromUrl));
    }
    if (rateFromUrl) {
      setPreSelectedRate(parseFloat(rateFromUrl));
    }
    
    fetch('/api/bookings/carriers')
      .then(res => res.json())
      .then(data => setCarriers(data))
      .catch(err => console.error('Failed to load carriers:', err));
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to map carrier names to codes
  const getCarrierCode = (carrierName: string): string => {
    const mapping: Record<string, string> = {
      'Maersk': 'MAEU',
      'Maersk Line': 'MAEU',
      'MSC': 'MSCU',
      'Mediterranean Shipping Company': 'MSCU',
      'CMA CGM': 'CMDU',
      'COSCO': 'COSU'
    };
    return mapping[carrierName] || carrierName.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCarrier) {
      toast({
        title: "Carrier Required",
        description: "Please select a shipping carrier",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const bookingRequest = {
        quoteId: quoteData.id,
        carrierCode: selectedCarrier,
        
        shipper: {
          name: formData.shipperName,
          address: formData.shipperAddress,
          city: formData.shipperCity,
          country: formData.shipperCountry,
          email: formData.shipperEmail,
          phone: formData.shipperPhone
        },
        
        consignee: {
          name: formData.consigneeName,
          address: formData.consigneeAddress,
          city: formData.consigneeCity,
          country: formData.consigneeCountry,
          email: formData.consigneeEmail,
          phone: formData.consigneePhone
        },
        
        cargo: {
          commodityCode: formData.commodityCode,
          description: formData.cargoDescription,
          weight: quoteData.weight,
          volume: quoteData.containerType === '20ft' ? 33.1 : 67.5, // Estimate
          dangerousGoods: formData.dangerousGoods,
          value: quoteData.value,
          currency: 'USD'
        },
        
        container: {
          type: quoteData.containerType,
          quantity: 1
        },
        
        serviceType: formData.serviceType,
        incoterm: quoteData.incoterm,
        preferredDeparture: formData.preferredDeparture,
        specialInstructions: formData.specialInstructions
      };

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingRequest)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Booking Created Successfully!",
          description: `Booking reference: ${result.bookingReference}`,
        });
        onBookingCreated(result);
      } else {
        toast({
          title: "Booking Failed",
          description: result.error || "Unable to create booking",
          variant: "destructive"
        });
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="default">Available</Badge>;
      case 'SETUP_REQUIRED':
        return <Badge variant="secondary">Setup Required</Badge>;
      case 'COMING_SOON':
        return <Badge variant="outline">Coming Soon</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Book Your Shipment</CardTitle>
          <CardDescription>
            Create a booking with your preferred shipping carrier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Carrier Selection - Show selection or pre-selected carrier */}
            {preSelectedCarrier ? (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Selected Carrier</Label>
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-800">{preSelectedCarrier}</span>
                        <Badge className="bg-green-100 text-green-800">Selected from Comparison</Badge>
                      </div>
                      {preSelectedService && (
                        <p className="text-sm text-green-700 mt-1">Service: {preSelectedService}</p>
                      )}
                      {preSelectedRate > 0 && (
                        <p className="text-sm text-green-700">Quote Rate: R {preSelectedRate.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Select Shipping Carrier</Label>
                <div className="grid gap-3">
                  {carriers.map((carrier) => (
                    <div
                      key={carrier.code}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCarrier === carrier.code 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!carrier.bookingSupport ? 'opacity-50' : ''}`}
                      onClick={() => carrier.bookingSupport && setSelectedCarrier(carrier.code)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{carrier.name}</span>
                            {getStatusBadge(carrier.apiStatus)}
                          </div>
                        <p className="text-sm text-gray-600">{carrier.description}</p>
                        <p className="text-xs text-gray-500">
                          Services: {carrier.services.join(', ')} • Coverage: {carrier.coverage}
                        </p>
                      </div>
                      {selectedCarrier === carrier.code && (
                        <div className="w-4 h-4 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Shipper Information */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Shipper Information</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipperName">Company/Name *</Label>
                  <Input
                    id="shipperName"
                    value={formData.shipperName}
                    onChange={(e) => handleInputChange('shipperName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipperEmail">Email *</Label>
                  <Input
                    id="shipperEmail"
                    type="email"
                    value={formData.shipperEmail}
                    onChange={(e) => handleInputChange('shipperEmail', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipperAddress">Address *</Label>
                  <Input
                    id="shipperAddress"
                    value={formData.shipperAddress}
                    onChange={(e) => handleInputChange('shipperAddress', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipperPhone">Phone *</Label>
                  <Input
                    id="shipperPhone"
                    value={formData.shipperPhone}
                    onChange={(e) => handleInputChange('shipperPhone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipperCity">City *</Label>
                  <Input
                    id="shipperCity"
                    value={formData.shipperCity}
                    onChange={(e) => handleInputChange('shipperCity', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipperCountry">Country *</Label>
                  <Input
                    id="shipperCountry"
                    value={formData.shipperCountry}
                    onChange={(e) => handleInputChange('shipperCountry', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Consignee Information */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Consignee Information (South Africa)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="consigneeName">Company/Name *</Label>
                  <Input
                    id="consigneeName"
                    value={formData.consigneeName}
                    onChange={(e) => handleInputChange('consigneeName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="consigneeEmail">Email *</Label>
                  <Input
                    id="consigneeEmail"
                    type="email"
                    value={formData.consigneeEmail}
                    onChange={(e) => handleInputChange('consigneeEmail', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="consigneeAddress">Address *</Label>
                  <Input
                    id="consigneeAddress"
                    value={formData.consigneeAddress}
                    onChange={(e) => handleInputChange('consigneeAddress', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="consigneePhone">Phone *</Label>
                  <Input
                    id="consigneePhone"
                    value={formData.consigneePhone}
                    onChange={(e) => handleInputChange('consigneePhone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="consigneeCity">City *</Label>
                  <Input
                    id="consigneeCity"
                    value={formData.consigneeCity}
                    onChange={(e) => handleInputChange('consigneeCity', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Cargo Details */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Cargo Details</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cargoDescription">Cargo Description *</Label>
                  <Input
                    id="cargoDescription"
                    value={formData.cargoDescription}
                    onChange={(e) => handleInputChange('cargoDescription', e.target.value)}
                    required
                    placeholder="e.g., Electronics, Textiles, Machinery"
                  />
                </div>
                <div>
                  <Label htmlFor="commodityCode">HS Code</Label>
                  <Input
                    id="commodityCode"
                    value={formData.commodityCode}
                    onChange={(e) => handleInputChange('commodityCode', e.target.value)}
                    placeholder="Auto-filled from quote"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                  placeholder="Any special handling requirements or instructions"
                  rows={3}
                />
              </div>
            </div>

            {/* Quote Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Shipment Summary</h4>
              <div className="text-sm space-y-1">
                <div>Route: {quoteData?.originPort} → {quoteData?.destinationPort}</div>
                <div>Container: {quoteData?.containerType} • Weight: {quoteData?.weight}kg</div>
                <div>Total Cost: R {quoteData?.totalCost?.toLocaleString()}</div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !selectedCarrier}
            >
              {loading ? "Creating Booking..." : preSelectedCarrier ? `Book with ${preSelectedCarrier}` : "Create Booking"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}