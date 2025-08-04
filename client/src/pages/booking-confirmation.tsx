import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, Calendar, FileText, ArrowLeft, CreditCard, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CommissionPayment } from "@/components/commission-payment";
import { useState } from "react";

interface Booking {
  id: string;
  bookingReference: string;
  quoteId: string;
  carrierName: string;
  freightForwarderName?: string;
  status: string;
  originPort: string;
  destinationPort: string;
  finalDestination: string;
  containerType: string;
  shipperName: string;
  shipperEmail: string;
  consigneeName: string;
  consigneeEmail: string;
  cargoDescription: string;
  quotedAmount: number;
  estimatedDeparture?: string;
  createdAt: string;
}

export default function BookingConfirmation() {
  const [, params] = useRoute("/booking/confirmation/:id");
  const [, setLocation] = useLocation();
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Fetch booking details
  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: [`/api/bookings/${params?.id}`],
    enabled: !!params?.id,
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
          <Button onClick={() => setLocation("/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-green-900 mb-2">
                      Booking Created Successfully!
                    </h2>
                    <p className="text-green-700 mb-3">
                      Your shipment booking has been created. Please complete the commission payment below to finalize your booking.
                    </p>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {booking.bookingReference}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission Payment */}
            {!paymentCompleted ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="text-lg font-semibold">Action Required: Complete Payment</h3>
                </div>
                <CommissionPayment
                  bookingId={booking.id}
                  totalCost={booking.quotedAmount}
                  carrierName={booking.carrierName}
                  freightForwarderName={booking.freightForwarderName}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </div>
            ) : (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-900">Payment Completed</h3>
                      <p className="text-sm text-green-700">
                        Commission payment processed successfully. Your booking is now confirmed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>
                  Complete information about your shipment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status */}
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <Badge variant={paymentCompleted ? "default" : "secondary"}>
                    {paymentCompleted ? "Confirmed" : "Awaiting Payment"}
                  </Badge>
                </div>

                <Separator />

                {/* Route Information */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Route Information
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Origin Port</p>
                      <p className="font-medium">{booking.originPort}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Destination Port</p>
                      <p className="font-medium">{booking.destinationPort}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Final Destination</p>
                      <p className="font-medium">{booking.finalDestination}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Parties */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Shipping Parties
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Shipper</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">{booking.shipperName}</p>
                        <p className="text-sm text-gray-600">{booking.shipperEmail}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Consignee</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">{booking.consigneeName}</p>
                        <p className="text-sm text-gray-600">{booking.consigneeEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Cargo */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Cargo Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Container Type</p>
                      <p className="font-medium">{booking.containerType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium">{booking.cargoDescription}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Timeline */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Booking Created</span>
                      <span className="font-medium">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {booking.estimatedDeparture && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estimated Departure</span>
                        <span className="font-medium">
                          {new Date(booking.estimatedDeparture).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className={`flex items-start gap-3 ${paymentCompleted ? 'opacity-50' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      paymentCompleted ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'
                    }`}>
                      {paymentCompleted ? <CheckCircle className="h-5 w-5" /> : '1'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Complete Payment</p>
                      <p className="text-sm text-gray-600">
                        Pay the 5% commission to confirm your booking
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 ${!paymentCompleted ? 'opacity-50' : ''}`}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Prepare Documents</p>
                      <p className="text-sm text-gray-600">
                        Commercial invoice, packing list, and other required documents
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 opacity-50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Track Shipment</p>
                      <p className="text-sm text-gray-600">
                        Monitor your cargo's journey in real-time
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Total Cost</h4>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(booking.quotedAmount)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Including all fees and charges
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.print()}
                >
                  Download Booking Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}