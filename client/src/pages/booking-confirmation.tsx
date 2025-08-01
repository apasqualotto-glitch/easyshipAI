import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Package, 
  Ship, 
  Truck, 
  Calendar, 
  FileText, 
  Mail, 
  Phone,
  ArrowRight,
  Home,
  Download,
  Clock,
  AlertCircle,
  Info
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";


function getIncotermGuidance(booking: any) {
  if (!booking) return null;
  const incoterm = booking?.incoterm?.toUpperCase();
  
  const getIncotermInfo = (term: string) => {
    switch (term) {
      case 'FOB':
        return {
          title: 'FOB (Free On Board)',
          buyerResponsibilities: [
            'Coordinate with your supplier to ensure cargo is ready for collection at origin port',
            'Share shipping schedule with supplier (container ready date)',
            'Arrange marine insurance for your cargo during transit',
            'Handle import customs clearance and duties in South Africa',
            'Arrange trucking from SA port to final destination'
          ],
          supplierAction: 'Your supplier must deliver cargo to the origin port and load it onto the vessel',
          urgentNote: 'Critical: Share container pickup date with your supplier NOW to avoid delays'
        };
      case 'CIF':
        return {
          title: 'CIF (Cost, Insurance, and Freight)',
          buyerResponsibilities: [
            'Confirm delivery address and contact details with your supplier',
            'Prepare for import customs clearance (duties already calculated)',
            'Arrange trucking from SA port to final destination',
            'Be ready to receive cargo at your specified address'
          ],
          supplierAction: 'Your supplier handles shipping, insurance, and delivery to SA port',
          urgentNote: 'Ensure your supplier has correct delivery address and contact information'
        };
      case 'EXW':
        return {
          title: 'EXW (Ex Works)',
          buyerResponsibilities: [
            'Arrange collection from supplier\'s premises/warehouse',
            'Handle all export procedures at origin country',
            'Manage complete shipping process including freight and insurance',
            'Handle import customs clearance and duties in South Africa',
            'Coordinate entire logistics chain from supplier to your door'
          ],
          supplierAction: 'Your supplier only needs to have cargo ready for collection at their facility',
          urgentNote: 'You are responsible for ALL shipping arrangements - start planning immediately'
        };
      case 'DDP':
        return {
          title: 'DDP (Delivered Duty Paid)',
          buyerResponsibilities: [
            'Provide accurate delivery address and contact details',
            'Be available to receive cargo at your premises',
            'Inspect cargo upon delivery and sign receipt'
          ],
          supplierAction: 'Your supplier handles everything including customs duties and final delivery',
          urgentNote: 'Ensure your supplier has your exact delivery address and contact number'
        };
      default:
        return {
          title: `${term} Terms`,
          buyerResponsibilities: [
            'Review your purchase agreement for specific responsibilities',
            'Contact your supplier to clarify shipping arrangements',
            'Prepare for customs clearance if required',
            'Arrange final delivery logistics'
          ],
          supplierAction: 'Check your agreement for supplier responsibilities',
          urgentNote: 'Verify shipping terms with your supplier to avoid misunderstandings'
        };
    }
  };

  const incotermInfo = getIncotermInfo(incoterm || '');

  return (
    <div className="space-y-6">
      {/* Incoterm Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">{incotermInfo.title}</h4>
            <p className="text-sm text-blue-800 mt-1">
              {incotermInfo.supplierAction}
            </p>
          </div>
        </div>
      </div>

      {/* Marketplace Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">FreightCalc SA - Your Shipping Marketplace</h4>
            <p className="text-sm text-blue-800 mt-1">
              We've connected you with {booking?.carrierName || 'your selected carrier'} for freight services. You remain responsible for your shipment and can choose additional service providers below.
            </p>
          </div>
        </div>
      </div>

      {/* Urgent Action Required */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-900">Urgent: Contact Your Supplier</h4>
            <p className="text-sm text-orange-800 mt-1">
              {incotermInfo.urgentNote}
            </p>
          </div>
        </div>
      </div>

      {/* Your Action Items */}
      <div>
        <h4 className="font-semibold mb-3">Your Action Items</h4>
        <div className="space-y-3">
          {incotermInfo.buyerResponsibilities.map((responsibility, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-semibold text-green-700">
                {index + 1}
              </div>
              <p className="text-sm text-gray-700">{responsibility}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 className="font-semibold mb-3">Expected Timeline</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-medium">Booking Confirmed</h5>
              <p className="text-sm text-gray-600">Your booking has been registered with {booking?.carrierName || 'your selected carrier'}</p>
              <p className="text-xs text-gray-500 mt-1">Just now</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-medium">Documentation & Coordination</h5>
              <p className="text-sm text-gray-600">Contact supplier and prepare shipping documents</p>
              <p className="text-xs text-gray-500 mt-1">Next 24-48 hours</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-medium">Cargo Loading</h5>
              <p className="text-sm text-gray-600">Container loading at {booking?.originPort || 'origin port'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {booking?.estimatedDeparture 
                  ? `Scheduled: ${new Date(booking.estimatedDeparture).toLocaleDateString()}`
                  : 'Date to be confirmed'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Ship className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-medium">Ocean Transit</h5>
              <p className="text-sm text-gray-600">Sea freight to {booking?.destinationPort || 'destination port'}</p>
              <p className="text-xs text-gray-500 mt-1">18-25 days transit time</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Truck className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-medium">Final Delivery</h5>
              <p className="text-sm text-gray-600">Customs clearance and delivery to {booking?.finalDestination || 'final destination'}</p>
              <p className="text-xs text-gray-500 mt-1">3-5 days after port arrival</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Services */}
      <div className="mt-8">
        <h4 className="font-semibold mb-4">Need Help with Customs & Port Clearance?</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-4">
            Get quotes from vetted freight forwarders who can handle customs clearance, documentation, and port services for you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium mb-2">Customs Clearance Services</h5>
              <ul className="text-sm text-gray-600 space-y-1 mb-3">
                <li>• Import/Export documentation</li>
                <li>• SARS customs declaration</li>
                <li>• Duty and VAT payment</li>
                <li>• Inspection coordination</li>
              </ul>
              <Button variant="outline" size="sm" className="w-full">
                Get Customs Quotes
              </Button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium mb-2">Port & Logistics Services</h5>
              <ul className="text-sm text-gray-600 space-y-1 mb-3">
                <li>• Container devanning</li>
                <li>• Port handling & storage</li>
                <li>• Final mile delivery</li>
                <li>• Cargo insurance</li>
              </ul>
              <Button variant="outline" size="sm" className="w-full">
                Get Logistics Quotes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmation() {
  const [, params] = useRoute("/booking/confirmation/:id");
  const [, setLocation] = useLocation();
  
  const bookingId = params?.id;
  
  const { data: booking, isLoading } = useQuery({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId,
  });
  
  const { data: trackingEvents } = useQuery({
    queryKey: [`/api/bookings/${bookingId}/tracking`],
    enabled: !!bookingId,
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }
  
  if (!booking) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/")}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-xl text-gray-600 mb-4">
            Your shipment has been successfully booked
          </p>
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            <span className="font-medium">Booking Reference:</span>
            <span className="font-bold text-lg">{booking?.bookingReference || 'Loading...'}</span>
          </div>
        </div>
        
        {/* Important Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Check Your Email</h3>
                <p className="text-blue-800 text-sm">
                  We've sent a confirmation email to <strong>{booking?.shipperEmail || 'your email'}</strong> with your booking details, 
                  shipping documents, and next steps. Please check your inbox and spam folder.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Carrier</span>
                <p className="font-medium">{booking?.carrierName || 'Carrier'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Route</span>
                <p className="font-medium">{booking?.originPort || 'Origin'} → {booking?.destinationPort || 'Destination'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Container Type</span>
                <p className="font-medium">{booking?.containerType || 'Container Type'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Cargo Description</span>
                <p className="font-medium">{booking?.cargoDescription || 'Cargo Description'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Cost</span>
                <p className="font-bold text-lg text-primary">{formatCurrency(booking?.quotedAmount || 0)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Status</span>
                <div className="mt-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {booking?.status === 'pending' ? 'Awaiting Payment' : booking?.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Shipper & Consignee Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Shipping Parties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Shipper (From)</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{booking?.shipperName || 'Shipper Name'}</p>
                  <p className="text-gray-600">{booking?.shipperAddress || 'Shipper Address'}</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-3 w-3" />
                    {booking?.shipperEmail || 'shipper@email.com'}
                  </div>
                  {booking?.shipperPhone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-3 w-3" />
                      {booking.shipperPhone}
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Consignee (To)</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{booking?.consigneeName || 'Consignee Name'}</p>
                  <p className="text-gray-600">{booking?.consigneeAddress || 'Consignee Address'}</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-3 w-3" />
                    {booking?.consigneeEmail || 'consignee@email.com'}
                  </div>
                  {booking?.consigneePhone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-3 w-3" />
                      {booking.consigneePhone}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* What Happens Next - Incoterm-specific guidance */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
            <CardDescription>Your next steps based on your Incoterm terms</CardDescription>
          </CardHeader>
          <CardContent>
            {getIncotermGuidance(booking)}
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/tracking")}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Track Shipment
          </Button>
          <Button 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Documents
          </Button>
          <Button 
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}