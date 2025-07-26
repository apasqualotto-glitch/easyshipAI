import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AIChatInterface } from "@/components/ai-chat-interface";
import { 
  Search,
  Ship,
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Plane,
  Building,
  Calendar
} from "lucide-react";

// Mock tracking data for demonstration
const MOCK_TRACKING_DATA = {
  "MAEU123456789": {
    bookingReference: "MAEU123456789",
    carrier: "Maersk",
    service: "Standard Service",
    status: "in_transit",
    origin: "Shanghai, China",
    destination: "Durban, South Africa",
    finalDestination: "Johannesburg, Gauteng",
    containerNumber: "MSKU9876543",
    estimatedArrival: "2025-08-15",
    lastUpdated: "2025-07-26T14:30:00Z",
    events: [
      {
        date: "2025-07-20",
        time: "09:00",
        location: "Shanghai, China",
        status: "loaded",
        description: "Container loaded on vessel MV Maersk Shanghai",
        icon: Ship,
        completed: true
      },
      {
        date: "2025-07-20",
        time: "15:30",
        location: "Shanghai Port",
        status: "departed",
        description: "Vessel departed Shanghai Port",
        icon: Ship,
        completed: true
      },
      {
        date: "2025-08-02",
        time: "08:00",
        location: "Singapore",
        status: "transshipment",
        description: "Container transferred to connecting vessel",
        icon: Package,
        completed: true
      },
      {
        date: "2025-08-14",
        time: "EST",
        location: "Durban Port",
        status: "arriving",
        description: "Expected arrival at Durban Port",
        icon: MapPin,
        completed: false,
        estimated: true
      },
      {
        date: "2025-08-15",
        time: "EST",
        location: "Customs",
        status: "customs",
        description: "Customs clearance process",
        icon: Building,
        completed: false,
        estimated: true
      },
      {
        date: "2025-08-16",
        time: "EST",
        location: "Johannesburg",
        status: "delivered",
        description: "Final delivery to consignee",
        icon: Truck,
        completed: false,
        estimated: true
      }
    ]
  },
  "MSC987654321": {
    bookingReference: "MSC987654321",
    carrier: "MSC",
    service: "Express Service",
    status: "customs",
    origin: "Hamburg, Germany",
    destination: "Cape Town, South Africa",
    finalDestination: "Cape Town, Western Cape",
    containerNumber: "MSCU1234567",
    estimatedArrival: "2025-07-28",
    lastUpdated: "2025-07-26T16:45:00Z",
    events: [
      {
        date: "2025-07-10",
        time: "14:00",
        location: "Hamburg, Germany",
        status: "loaded",
        description: "Container loaded and sealed",
        icon: Package,
        completed: true
      },
      {
        date: "2025-07-11",
        time: "06:30",
        location: "Hamburg Port",
        status: "departed",
        description: "Vessel MSC Lucia departed Hamburg",
        icon: Ship,
        completed: true
      },
      {
        date: "2025-07-25",
        time: "16:00",
        location: "Cape Town Port",
        status: "arrived",
        description: "Vessel arrived at Cape Town Port",
        icon: MapPin,
        completed: true
      },
      {
        date: "2025-07-26",
        time: "09:00",
        location: "Cape Town Customs",
        status: "customs",
        description: "Undergoing customs inspection",
        icon: Building,
        completed: false
      }
    ]
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "loaded": return "bg-blue-100 text-blue-800";
    case "departed": return "bg-purple-100 text-purple-800";
    case "in_transit": return "bg-yellow-100 text-yellow-800";
    case "arrived": return "bg-green-100 text-green-800";
    case "customs": return "bg-orange-100 text-orange-800";
    case "delivered": return "bg-emerald-100 text-emerald-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "loaded": return Package;
    case "departed": return Ship;
    case "in_transit": return Ship;
    case "arrived": return MapPin;
    case "customs": return Building;
    case "delivered": return CheckCircle;
    default: return Clock;
  }
};

export function Tracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleTrackingSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsSearching(true);
    setNotFound(false);
    setTrackingResult(null);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = MOCK_TRACKING_DATA[trackingNumber.toUpperCase() as keyof typeof MOCK_TRACKING_DATA];
    if (result) {
      setTrackingResult(result);
    } else {
      setNotFound(true);
    }
    setIsSearching(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Chat Interface */}
      <AIChatInterface context="tracking" />

      {/* Header */}
      <div className="pt-32 pb-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Track Your Shipment
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Get real-time updates on your container's journey from origin to destination
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter Tracking Information
            </CardTitle>
            <CardDescription>
              Enter your booking reference or container number to track your shipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackingSearch} className="flex gap-4">
              <Input
                placeholder="e.g., MAEU123456789 or MSKU9876543"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isSearching || !trackingNumber.trim()}>
                {isSearching ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track
                  </>
                )}
              </Button>
            </form>

            {/* Demo Links */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Try these demo tracking numbers:</p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTrackingNumber("MAEU123456789")}
                >
                  MAEU123456789 (In Transit)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTrackingNumber("MSC987654321")}
                >
                  MSC987654321 (At Customs)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Not Found Message */}
        {notFound && (
          <Card className="mb-8 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Tracking Information Not Found
                </h3>
                <p className="text-red-700 mb-4">
                  We couldn't find any shipment with tracking number "{trackingNumber}".
                </p>
                <div className="bg-red-50 p-4 rounded-lg text-left">
                  <h4 className="font-semibold text-red-900 mb-2">Possible reasons:</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• The tracking number may be incorrect or incomplete</li>
                    <li>• The shipment hasn't been processed yet</li>
                    <li>• Try using your booking reference instead of container number</li>
                    <li>• Contact your freight forwarder for assistance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking Results */}
        {trackingResult && (
          <div className="space-y-6">
            {/* Shipment Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {trackingResult.bookingReference}
                    </CardTitle>
                    <CardDescription>
                      {trackingResult.carrier} - {trackingResult.service}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(trackingResult.status)}>
                    {trackingResult.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Origin</h4>
                    <p className="text-gray-600">{trackingResult.origin}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Destination Port</h4>
                    <p className="text-gray-600">{trackingResult.destination}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Final Destination</h4>
                    <p className="text-gray-600">{trackingResult.finalDestination}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Container Number</h4>
                    <p className="text-gray-600 font-mono">{trackingResult.containerNumber}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Estimated Arrival</h4>
                    <p className="text-gray-600">{formatDate(trackingResult.estimatedArrival)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Last Updated</h4>
                    <p className="text-gray-600">
                      {new Date(trackingResult.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Shipment Timeline
                </CardTitle>
                <CardDescription>
                  Track your container's journey from origin to destination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {trackingResult.events.map((event: any, index: number) => {
                    const IconComponent = event.icon;
                    const isLast = index === trackingResult.events.length - 1;
                    
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            event.completed 
                              ? 'bg-green-100 text-green-600' 
                              : event.estimated 
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-blue-100 text-blue-600'
                          }`}>
                            {event.completed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <IconComponent className="h-5 w-5" />
                            )}
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 h-12 mt-2 ${
                              event.completed ? 'bg-green-300' : 'bg-gray-300'
                            }`} />
                          )}
                        </div>
                        
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {event.location}
                            </span>
                            {event.estimated && (
                              <Badge variant="outline" className="text-xs">
                                Estimated
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatDate(event.date)}</span>
                            <span>{event.time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>
                  Get assistance with your shipment or ask questions about the process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Report an Issue
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Clock className="mr-2 h-4 w-4" />
                    Update Delivery Address
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}