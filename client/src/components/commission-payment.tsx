import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CreditCard, Shield, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Initialize Stripe
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface CommissionPaymentProps {
  bookingId: string;
  totalCost: number;
  carrierName: string;
  freightForwarderName?: string;
  onPaymentSuccess?: () => void;
  // Optional breakdown for showing estimates
  breakdown?: {
    oceanFreight: number;
    trucking: number;
    handling: number;
    customs: number;
    vat: number;
  };
}

function PaymentForm({ bookingId, commission, onSuccess }: { 
  bookingId: string; 
  commission: number; 
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation?bookingId=${bookingId}`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>Processing...</>
        ) : (
          <>Pay Commission {formatCurrency(commission)}</>
        )}
      </Button>
    </form>
  );
}

export function CommissionPayment({ 
  bookingId, 
  totalCost, 
  carrierName, 
  freightForwarderName,
  onPaymentSuccess,
  breakdown
}: CommissionPaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Calculate shipping services cost (excluding customs/VAT)
  const shippingServicesCost = breakdown ? 
    (breakdown.oceanFreight + breakdown.trucking + breakdown.handling) : 
    (totalCost * 0.2); // Only 20% of total for services, rest are government fees
    
  // Calculate 5% commission on shipping services only
  const commission = Math.round(shippingServicesCost * 0.05);
  const actualPaymentAmount = commission; // Only charge commission, not the full shipping cost

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-commission-payment", {
        bookingId,
        amount: actualPaymentAmount,
        description: `Platform commission for ${carrierName}${freightForwarderName ? ` and ${freightForwarderName}` : ''} shipping services`
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Commission payment processed successfully!",
    });
    onPaymentSuccess?.();
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Commission Payment
        </CardTitle>
        <CardDescription>
          Secure payment processing for your booking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Breakdown */}
        <div className="space-y-4">
          {/* What You're Paying For */}
          <div className="bg-green-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Payment Breakdown</h4>
                <p className="text-sm text-green-700 mt-1">
                  You're only paying for carrier shipping and freight forwarding services. 
                  Customs/VAT estimates are shown for transparency but paid separately to authorities.
                </p>
              </div>
            </div>
            
            <div className="border-t border-green-200 pt-3 space-y-2">
              <h5 className="font-medium text-green-800 text-sm">💳 Charged to Your Card:</h5>
              {breakdown && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ocean Freight:</span>
                    <span className="font-medium">{formatCurrency(breakdown.oceanFreight)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Trucking & Delivery:</span>
                    <span className="font-medium">{formatCurrency(breakdown.trucking)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Handling & Documentation:</span>
                    <span className="font-medium">{formatCurrency(breakdown.handling)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-700">Shipping Services Subtotal:</span>
                    <span className="font-medium">{formatCurrency(shippingServicesCost)}</span>
                  </div>
                </>
              )}
              <div className="bg-blue-50 p-2 rounded text-sm mb-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">Carriers/Freight Forwarders Receive:</span>
                  <span className="font-medium text-blue-700">{formatCurrency(shippingServicesCost)}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">✅ Paid directly by FreightCalc after your commission</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform Commission (5% of services):</span>
                <span className="font-medium text-blue-600">{formatCurrency(commission)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 bg-green-100 px-2 py-2 rounded">
                <span className="text-green-800">Your Payment:</span>
                <span className="text-green-800">{formatCurrency(actualPaymentAmount)}</span>
              </div>
              <p className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded">
                💡 You only pay our 5% commission. We handle paying the carriers and freight forwarders directly.
              </p>
            </div>
          </div>

          {/* Government Fees - Estimates Only */}
          {breakdown && (breakdown.customs > 0 || breakdown.vat > 0) && (
            <div className="bg-orange-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-900">Government Fees (Paid Separately)</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    These estimates help you plan. You'll pay them directly to SARS or your customs broker upon arrival.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-orange-200 pt-3 space-y-2">
                <h5 className="font-medium text-orange-800 text-sm">🏛️ Paid to Authorities Later:</h5>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Customs Duties (Est.):</span>
                  <span className="font-medium text-orange-600">{formatCurrency(breakdown.customs)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT 15% (Est.):</span>
                  <span className="font-medium text-orange-600">{formatCurrency(breakdown.vat)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span className="text-orange-700">Est. Government Total:</span>
                  <span className="text-orange-700">{formatCurrency(breakdown.customs + breakdown.vat)}</span>
                </div>
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ Not included in your payment - for planning purposes only
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Service Providers */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Service Providers</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {carrierName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{carrierName}</p>
                  <p className="text-xs text-gray-500">Ocean Carrier</p>
                </div>
              </div>
              <Badge variant="secondary">Primary</Badge>
            </div>
            
            {freightForwarderName && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-accent-700">
                      {freightForwarderName.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{freightForwarderName}</p>
                    <p className="text-xs text-gray-500">Freight Forwarder</p>
                  </div>
                </div>
                <Badge variant="outline">Supporting</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-800">
              Your payment is secure and encrypted. We use Stripe for payment processing, 
              ensuring your financial information is protected.
            </p>
          </div>
        </div>

        {/* Payment Form */}
        {!clientSecret && (
          <Button 
            onClick={() => createPaymentMutation.mutate()}
            disabled={createPaymentMutation.isPending}
            className="w-full"
          >
            {createPaymentMutation.isPending ? "Setting up payment..." : "Proceed to Payment"}
          </Button>
        )}

        {clientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm 
              bookingId={bookingId} 
              commission={commission} 
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        ) : clientSecret && !stripePromise ? (
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-amber-800 text-sm">
              Payment processing is not configured. Please contact support to complete your booking.
            </p>
          </div>
        ) : null}

        {/* Terms */}
        <div className="text-xs text-gray-500 text-center">
          By proceeding with payment, you agree to our{" "}
          <a href="/terms" className="text-primary-600 hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
        </div>
      </CardContent>
    </Card>
  );
}