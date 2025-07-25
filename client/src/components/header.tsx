import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-material border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="material-icons text-white text-xl">local_shipping</span>
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">FreightCalc SA</h1>
              <p className="text-xs text-gray-500">Import Cost Calculator</p>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Calculator</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Guide</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Support</a>
          </nav>
          
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-icons">menu</span>
          </button>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="space-y-2">
              <a href="#" className="block text-primary-600 hover:text-primary-700 font-medium">Calculator</a>
              <a href="#" className="block text-gray-600 hover:text-gray-900">Guide</a>
              <a href="#" className="block text-gray-600 hover:text-gray-900">Support</a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
