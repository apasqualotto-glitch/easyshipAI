import { useState } from 'react';
import { useLocation } from 'wouter';
import { BookingForm } from '../components/booking-form';
import { BookingStatus } from '../components/booking-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ship } from "lucide-react";

export default function BookingPage() {
  const [location, setLocation] = useLocation();
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [showForm, setShowForm] = useState(true);

  // Get quote data from URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const quoteId = urlParams.get('quote');
  const quoteData = quoteId ? JSON.parse(localStorage.getItem(`quote-${quoteId}`) || '{}') : null;

  const handleBookingCreated = (booking: any) => {
    setCurrentBooking(booking);
    setShowForm(false);
    
    // Store booking for future reference
    localStorage.setItem(`booking-${booking.bookingReference}`, JSON.stringify(booking));
  };

  const goBack = () => {
    setLocation('/calculator');
  };

  const startNewBooking = () => {
    setCurrentBooking(null);
    setShowForm(true);
  };

  if (!quoteData && !currentBooking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="w-6 h-6" />
              Booking Center
            </CardTitle>
            <CardDescription>
              Create and manage your shipping bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No quote data found. Please create a quote first to proceed with booking.
            </p>
            <Button onClick={goBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Calculator
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Ship className="w-8 h-8 text-primary" />
              Shipping Booking
            </h1>
            <p className="text-gray-600 mt-1">
              {showForm ? 'Create your shipment booking' : 'Track your booking status'}
            </p>
          </div>
          <div className="flex gap-2">
            {!showForm && (
              <Button onClick={startNewBooking} variant="outline">
                New Booking
              </Button>
            )}
            <Button onClick={goBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Calculator
            </Button>
          </div>
        </div>
      </div>

      {showForm ? (
        <BookingForm 
          quoteData={quoteData} 
          onBookingCreated={handleBookingCreated}
        />
      ) : (
        <BookingStatus bookingData={currentBooking} />
      )}
    </div>
  );
}