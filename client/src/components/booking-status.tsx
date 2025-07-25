import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, AlertCircle, Package, Truck, Ship, MapPin } from "lucide-react";

interface BookingStatusProps {
  bookingData: any;
}

interface Milestone {
  event: string;
  location: string;
  timestamp: string;
  completed: boolean;
}

interface Document {
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  downloadUrl?: string;
}

export function BookingStatus({ bookingData }: BookingStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    if (!bookingData?.carrierCode || !bookingData?.bookingReference) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/bookings/${bookingData.carrierCode}/${bookingData.bookingReference}/status`
      );
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch booking status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingData) {
      fetchStatus();
      // Refresh status every 30 seconds
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [bookingData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'IN_TRANSIT':
        return <Ship className="w-5 h-5 text-blue-500" />;
      case 'DELIVERED':
        return <Package className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="default">Confirmed</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'DOCS_REQUIRED':
        return <Badge variant="destructive">Documents Required</Badge>;
      case 'LOADED':
        return <Badge variant="default">Loaded</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="default">In Transit</Badge>;
      case 'DISCHARGED':
        return <Badge variant="default">Discharged</Badge>;
      case 'DELIVERED':
        return <Badge variant="default">Delivered</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getMilestoneIcon = (event: string) => {
    if (event.includes('Booking')) return <Package className="w-4 h-4" />;
    if (event.includes('Loaded') || event.includes('Departure')) return <Ship className="w-4 h-4" />;
    if (event.includes('Transit')) return <Truck className="w-4 h-4" />;
    if (event.includes('Arrival') || event.includes('Delivered')) return <MapPin className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  if (!bookingData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No booking selected
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Booking Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Booking Status</CardTitle>
              <CardDescription>
                {bookingData.carrierBookingNumber || bookingData.bookingReference}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status?.status || bookingData.status)}
              {getStatusBadge(status?.status || bookingData.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Booking Details</h4>
              <div className="space-y-1 text-sm">
                <div>Carrier: {bookingData.carrierName || 'Maersk Line'}</div>
                <div>Reference: {bookingData.bookingReference}</div>
                {bookingData.carrierBookingNumber && (
                  <div>Carrier Ref: {bookingData.carrierBookingNumber}</div>
                )}
                <div>Status: {status?.status || bookingData.status}</div>
                {status?.lastUpdate && (
                  <div>Last Update: {new Date(status.lastUpdate).toLocaleString()}</div>
                )}
              </div>
            </div>
            
            {bookingData.contactInfo && (
              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm">
                  <div>{bookingData.contactInfo.agentName}</div>
                  <div>{bookingData.contactInfo.email}</div>
                  <div>{bookingData.contactInfo.phone}</div>
                </div>
              </div>
            )}
          </div>

          {bookingData.estimatedDeparture && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm">
                <div className="font-medium">Estimated Schedule</div>
                <div>Departure: {new Date(bookingData.estimatedDeparture).toLocaleDateString()}</div>
                {bookingData.estimatedArrival && (
                  <div>Arrival: {new Date(bookingData.estimatedArrival).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      {status?.milestones && (
        <Card>
          <CardHeader>
            <CardTitle>Shipment Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {status.milestones.map((milestone: Milestone, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    milestone.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {getMilestoneIcon(milestone.event)}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      milestone.completed ? 'text-green-900' : 'text-gray-500'
                    }`}>
                      {milestone.event}
                    </div>
                    <div className="text-sm text-gray-600">
                      {milestone.location} • {new Date(milestone.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {milestone.completed && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {(bookingData.documentRequirements || status?.documents) && (
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bookingData.documentRequirements?.map((doc: string, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">{doc}</span>
                  </div>
                  <Badge variant="secondary">Required</Badge>
                </div>
              ))}
              
              {status?.documents?.map((doc: Document, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {doc.status === 'APPROVED' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : doc.status === 'REJECTED' ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-sm">{doc.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    {doc.downloadUrl && (
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {bookingData.nextSteps && (
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bookingData.nextSteps.map((step: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button onClick={fetchStatus} disabled={loading} variant="outline">
          {loading ? "Refreshing..." : "Refresh Status"}
        </Button>
        <Button variant="outline">
          Download Booking Confirmation
        </Button>
      </div>
    </div>
  );
}