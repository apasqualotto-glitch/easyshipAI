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
          <>Pay Commission R{commission.toLocaleString()}</>
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
  onPaymentSuccess 
}: CommissionPaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Calculate 5% commission
  const commission = Math.round(totalCost * 0.05);
  const carrierReceives = totalCost - commission;

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-commission-payment", {
        bookingId,
        amount: commission,
        description: `Booking commission for ${carrierName}${freightForwarderName ? ` and ${freightForwarderName}` : ''}`
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
        {/* Commission Breakdown */}
        <div className="bg-blue-50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">How our commission works</h4>
              <p className="text-sm text-blue-700 mt-1">
                FreightCalc SA charges a 5% commission on all bookings to maintain our platform 
                and provide you with the best shipping rates and services.
              </p>
            </div>
          </div>
          
          <div className="border-t border-blue-200 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Shipping Cost:</span>
              <span className="font-medium">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Commission (5%):</span>
              <span className="font-medium text-blue-600">{formatCurrency(commission)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span className="text-gray-700">Carrier Receives:</span>
              <span>{formatCurrency(carrierReceives)}</span>
            </div>
          </div>
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