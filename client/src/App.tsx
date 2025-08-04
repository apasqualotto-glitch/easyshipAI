import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Calculator from "@/pages/calculator";
import Booking from "@/pages/booking";
import BookingConfirmation from "@/pages/booking-confirmation";
import { Homepage } from "@/pages/homepage";
import { Guides } from "@/pages/guides";
import { Tracking } from "@/pages/tracking";
import NotFound from "@/pages/not-found";
import { ChatPopup } from "@/components/chat-popup";
import { 
  Ship, 
  Calculator as CalculatorIcon, 
  BookOpen, 
  TrendingUp, 
  Home,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { ChatProvider } from "@/contexts/chat-context";

function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/calculator", label: "Calculator", icon: CalculatorIcon },
    { path: "/guides", label: "Guides", icon: BookOpen },
    { path: "/tracking", label: "Tracking", icon: TrendingUp }
  ];

  return (
    <nav className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Ship className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EasyShip AI</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-600">Container Shipping Simplified</p>
                  <Badge className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5">
                    AI-Powered
                  </Badge>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={`flex items-center gap-2 ${
                    isActive(item.path) 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={`w-full justify-start gap-2 ${
                      isActive(item.path) 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-600"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/booking" component={Booking} />
      <Route path="/booking/confirmation/:id" component={BookingConfirmation} />
      <Route path="/guides" component={Guides} />
      <Route path="/tracking" component={Tracking} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <Router />
          </div>
          <Toaster />
          <ChatPopup />
        </TooltipProvider>
      </ChatProvider>
    </QueryClientProvider>
  );
}

export default App;
