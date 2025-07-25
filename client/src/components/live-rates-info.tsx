import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Zap, Ship, CheckCircle, Clock, ExternalLink } from "lucide-react";

export default function LiveRatesInfo() {
  const carriers = [
    {
      name: "Maersk",
      status: "available",
      description: "World's largest container shipping company",
      coverage: "Global routes including Asia-South Africa",
      api: "Free API access",
      features: ["Real-time rates", "Instant quotes", "Transit times", "Container tracking"],
      setupLink: "https://developer.maersk.com/"
    },
    {
      name: "MSC",
      status: "setup_required", 
      description: "Mediterranean Shipping Company",
      coverage: "Global shipping network",
      api: "Contact for setup (fees may apply)",
      features: ["Live scheduling", "Rate management", "Booking integration", "Track & trace"],
      setupLink: "https://www.msc.com/en/solutions/digital-solutions/direct-integrations"
    },
    {
      name: "CMA CGM",
      status: "coming_soon",
      description: "French container transportation company", 
      coverage: "Global shipping services",
      api: "API integration planned",
      features: ["Rate quotes", "Schedule access", "Booking management"],
      setupLink: "#"
    },
    {
      name: "COSCO",
      status: "coming_soon",
      description: "China Ocean Shipping Company",
      coverage: "Major Asia-Africa routes",
      api: "Integration under development", 
      features: ["Live rates", "Route optimization", "Container management"],
      setupLink: "#"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Available</Badge>;
      case "setup_required":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Setup Required</Badge>;
      case "coming_soon":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Coming Soon</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="h-5 w-5 text-blue-600" />
          Live Shipping Carriers
        </CardTitle>
        <p className="text-sm text-gray-600">
          Get real-time freight rates from major shipping lines for the most accurate quotes
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {carriers.map((carrier) => (
            <div 
              key={carrier.name}
              className={`p-4 rounded-lg border-2 ${
                carrier.status === "available" 
                  ? "border-green-200 bg-green-50" 
                  : carrier.status === "setup_required"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-lg">{carrier.name}</h4>
                  <p className="text-sm text-gray-600">{carrier.description}</p>
                </div>
                {getStatusBadge(carrier.status)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-sm"><strong>Coverage:</strong> {carrier.coverage}</p>
                  <p className="text-sm"><strong>API Access:</strong> {carrier.api}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Features:</p>
                  <ul className="text-xs space-y-1">
                    {carrier.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Zap className="h-3 w-3 mr-1 text-blue-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {carrier.status === "available" && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-green-700 font-medium">
                    ✓ Ready to use - Toggle "Live Carrier Rates" in the form
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <a href={carrier.setupLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Developer Portal
                    </a>
                  </Button>
                </div>
              )}

              {carrier.status === "setup_required" && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-yellow-700">
                    Contact carrier for API setup and pricing
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <a href={carrier.setupLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Setup Info
                    </a>
                  </Button>
                </div>
              )}

              {carrier.status === "coming_soon" && (
                <div className="mt-3">
                  <span className="text-sm text-gray-600">
                    Integration planned for future release
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">Benefits of Live Rates:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Real-time pricing from carriers</li>
            <li>• Accurate transit times and schedules</li>
            <li>• Compare multiple carriers instantly</li>
            <li>• Eliminate pricing surprises</li>
            <li>• Make informed shipping decisions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}