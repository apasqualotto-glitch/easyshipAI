import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIChatInterface } from "@/components/ai-chat-interface";
import { 
  Ship,
  Calculator,
  FileText,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Globe,
  Shield,
  Clock,
  Users,
  BookOpen,
  MessageSquare
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
    title: "Live Carrier Rates",
    description: "Compare real-time rates from Maersk, MSC, CMA CGM and more",
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
    description: "Real-time tracking from port to your door",
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
    text: "Direct API connections to major shipping lines"
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
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* AI Chat Interface - Always Available */}
      <AIChatInterface context="homepage" />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            ✨ New: AI-Powered Shipping Assistant
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Ship to South Africa
            <span className="block text-blue-600">Made Simple</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            EasyShip AI guides first-time importers through container shipping with plain-language explanations, 
            SARS-compliant quotes, and step-by-step booking assistance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/calculator">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                <Calculator className="mr-2 h-5 w-5" />
                Get Shipping Quote
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-blue-300 text-blue-700 hover:bg-blue-50 px-8 py-4 text-lg"
              onClick={() => document.querySelector('.fixed')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Chat with AI
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 mb-16">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>SARS Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              <span>Major Carriers</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Beginner Friendly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="font-semibold text-gray-900 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.subtext}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Ship Smart
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From instant quotes to customs guidance, we've simplified every step of the shipping process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <Link key={index} href={feature.link}>
                <Card 
                  className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-gray-200 hover:border-blue-300"
                  onMouseEnter={() => setActiveFeature(index)}
                  onMouseLeave={() => setActiveFeature(null)}
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
                      activeFeature === index 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 mb-4">
                      {feature.description}
                    </CardDescription>
                    <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                      Learn more <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose EasyShip AI?
            </h2>
            <p className="text-xl text-gray-600">
              Built specifically for South African importers and first-time shippers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ship in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              Our AI assistant guides you through every step
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Get Your Quote
              </h3>
              <p className="text-gray-600 mb-4">
                Enter your shipping details and get instant SARS-compliant quotes with customs duties and VAT calculated
              </p>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <Calculator className="mr-2 h-4 w-4" />
                Try Calculator
              </Button>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Compare & Book
              </h3>
              <p className="text-gray-600 mb-4">
                Compare live rates from major carriers and book directly with our integrated booking system
              </p>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <Ship className="mr-2 h-4 w-4" />
                View Carriers
              </Button>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Track & Receive
              </h3>
              <p className="text-gray-600 mb-4">
                Monitor your shipment in real-time from origin port to your doorstep with automatic notifications
              </p>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <TrendingUp className="mr-2 h-4 w-4" />
                Track Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Shipping?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Get your first quote in under 2 minutes with our AI-powered calculator
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/calculator">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                <Calculator className="mr-2 h-5 w-5" />
                Calculate Shipping Cost
              </Button>
            </Link>
            <Link href="/guides">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-blue-300 text-white hover:bg-blue-700 px-8 py-4 text-lg"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Learn About Shipping
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}