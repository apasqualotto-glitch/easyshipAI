import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIChatInterface } from "@/components/ai-chat-interface";
import CalculatorForm from "@/components/calculator-form";
import { QuoteDisplay } from "@/components/quote-display";
import { useToast } from "@/hooks/use-toast";
import { 
  Ship,
  Calculator,
  FileText,
  TrendingUp,
  CheckCircle,
  Globe,
  Shield,
  Clock,
  Users
} from "lucide-react";

const FEATURES = [
  {
    icon: Calculator,
    title: "Smart Quote Calculator",
    description: "Get instant shipping quotes with SARS-compliant customs calculations",
    link: "/calculator"
  },
  {
    icon: Ship,
    title: "Carrier Rate Estimates",
    description: "Compare estimated rates for Maersk, MSC, CMA CGM and more",
    link: "/calculator"
  },
  {
    icon: FileText,
    title: "Customs & Incoterms Guide",
    description: "Learn FOB, CIF, DDP with plain language explanations",
    link: "/guides"
  },
  {
    icon: TrendingUp,
    title: "Shipment Tracking",
    description: "Follow your container from port toward your door (demo tracking available)",
    link: "/tracking"
  }
];

const BENEFITS = [
  {
    icon: CheckCircle,
    title: "First-Time Friendly",
    text: "Designed for people new to international shipping"
  },
  {
    icon: Globe,
    title: "South Africa Focused",
    text: "SARS compliant with local customs regulations"
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    text: "Estimate-first quotes with clear SARS-aligned cost breakdowns"
  },
  {
    icon: Clock,
    title: "Save Time",
    text: "Get quotes in minutes, not hours or days"
  }
];

const STATS = [
  { number: "50+", label: "Origin Ports", subtext: "Worldwide coverage" },
  { number: "12", label: "SA Destinations", subtext: "Door-to-door delivery" },
  { number: "15+", label: "Cargo Types", subtext: "Comprehensive classification" },
  { number: "24/7", label: "AI Support", subtext: "Always here to help" }
];

export function Homepage() {
  const { toast } = useToast();
  const [formValues, setFormValues] = useState<any>({});
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [showQuoteDisplay, setShowQuoteDisplay] = useState(false);

  // Ensure page starts at the top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAIChatExtraction = (extractedData: any) => {
    console.log('📝 AI Chat extracted:', extractedData);
    
    // Update form values with extracted data
    setFormValues((prevValues: any) => ({
      ...prevValues,
      ...extractedData
    }));
    
    // Show toast notification for successful extraction
    const fieldCount = Object.keys(extractedData).length;
    if (fieldCount > 0) {
      const fieldNames = Object.keys(extractedData).map(key => {
        // Convert field names to user-friendly labels
        const fieldLabels: Record<string, string> = {
          originPort: 'Origin Port',
          destinationPort: 'Destination Port',
          containerType: 'Container Type',
          finalDestination: 'Final Destination',
          incoterm: 'Incoterm',
          value: 'Cargo Value',
          cargoType: 'Cargo Type',
          weight: 'Weight'
        };
        return fieldLabels[key] || key;
      }).join(', ');
      
      toast({
        title: "Form Auto-Filled! ✓",
        description: `Updated: ${fieldNames}`,
        duration: 4000,
      });
      
      console.log('Form auto-filled:', {
        extractedData,
        fieldCount,
        fieldNames
      });
    }
  };

  const handleQuoteResult = (result: any) => {
    setQuoteResult(result);
    setShowQuoteDisplay(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
              <Ship className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Container Shipping to and from South Africa Made Simple</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Get instant quotes, understand customs, and ship with confidence using our AI-powered platform
          </p>
        </div>
      </section>
      {/* Main Content Section */}
      <section className="px-4 pb-8 mt-[-33px] mb-[-33px]">
        <div className="max-w-7xl mx-auto">
          {/* AI Chat Interface */}
          <div className="mb-8">
            <AIChatInterface 
              context="homepage" 
              onExtractedData={handleAIChatExtraction}
            />
          </div>

          {/* Calculator Form - Always Visible */}
          <Card className="bg-white shadow-xl border-0 mb-8">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-gray-900 mb-2">Shipping Cost Calculator</CardTitle>
              <CardDescription className="text-gray-600">
                Complete the form below to get detailed shipping quotes with all costs included
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalculatorForm 
                onQuoteUpdate={() => {}}
                onQuoteResult={handleQuoteResult}
                initialValues={formValues}
              />
            </CardContent>
          </Card>

          {/* Quote Display */}
          {showQuoteDisplay && quoteResult && (
            <div className="mb-8">
              <QuoteDisplay 
                quote={quoteResult} 
                isVisible={showQuoteDisplay}
                onClose={() => setShowQuoteDisplay(false)}
              />
            </div>
          )}
        </div>
      </section>
      {/* Features Section */}
      <section className="pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            Complete Shipping Platform
          </Badge>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need to
            <span className="block text-blue-600">Ship to South Africa</span>
          </h2>
          
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            From AI-powered quotes to carrier booking, customs guidance, and door-to-door tracking - 
            we make international shipping simple for first-time importers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <Link key={index} href={feature.link}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <feature.icon className="h-12 w-12 text-blue-600 mb-4 mx-auto" />
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose EasyShip AI?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built specifically for South African importers, making international shipping accessible to everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Shipping?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of South African businesses saving time and money on container imports
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/calculator">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 min-h-11">
                <Calculator className="mr-2 h-5 w-5" />
                Get Started Free
              </Button>
            </Link>
            <Link href="/guides">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 min-h-11">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}