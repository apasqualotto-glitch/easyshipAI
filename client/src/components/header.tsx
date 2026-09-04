import { useState } from "react";
import { Sparkles, Menu, X } from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo - Mobile Optimized */}
          <Link href="/">
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900">EasyShip AI</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Container Shipping to South Africa</p>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4 lg:space-x-6">
            <Link href="/">
              <a className="text-blue-600 hover:text-blue-700 font-medium text-sm lg:text-base">Home</a>
            </Link>
            <Link href="/calculator">
              <a className="text-gray-600 hover:text-gray-900 text-sm lg:text-base">Calculator</a>
            </Link>
            <Link href="/booking">
              <a className="text-gray-600 hover:text-gray-900 text-sm lg:text-base">Book</a>
            </Link>
            <Link href="/guides">
              <a className="text-gray-600 hover:text-gray-900 text-sm lg:text-base">Guides</a>
            </Link>
            <Link href="/tracking">
              <a className="text-gray-600 hover:text-gray-900 text-sm lg:text-base">Tracking</a>
            </Link>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-200 bg-white">
            <nav className="space-y-1">
              <Link href="/">
                <a className="block px-3 py-2 text-blue-600 hover:bg-blue-50 font-medium rounded-lg text-sm">
                  Home
                </a>
              </Link>
              <Link href="/calculator">
                <a className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm">
                  Calculator
                </a>
              </Link>
              <Link href="/booking">
                <a className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm">
                  Book
                </a>
              </Link>
              <Link href="/guides">
                <a className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm">
                  Guides
                </a>
              </Link>
              <Link href="/tracking">
                <a className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm">
                  Tracking
                </a>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
