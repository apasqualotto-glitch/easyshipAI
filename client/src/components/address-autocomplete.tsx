import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Truck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  formattedAddress: string;
  city: string;
  province: string;
  postalCode: string;
  suburb?: string;
  streetName?: string;
  lat?: number;
  lng?: number;
}

interface DistanceResult {
  distance: number;
  cost: number;
  portName: string;
  deliveryAddress: string;
}

interface AddressAutocompleteProps {
  value?: string;
  onChange: (address: string, addressData?: { distance: number; cost: number }) => void;
  portCode?: string;
  incoterm?: string;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ 
  value = '', 
  onChange, 
  portCode = 'ZACPT', 
  incoterm = 'FOB',
  placeholder = "Start typing your delivery address...",
  className 
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [distanceData, setDistanceData] = useState<DistanceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search for addresses
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/addresses/search?q=${encodeURIComponent(query)}`);
          const addresses = await response.json();
          setSuggestions(addresses);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Address search failed:', error);
          setSuggestions([]);
          setShowSuggestions(true); // Still show dropdown with custom address option
        }
        setIsLoading(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);
  
  // Update parent value when query changes
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Calculate distance when address is selected
  const calculateDistance = async (address: Address | { formattedAddress: string }) => {
    if (!portCode) return;
    
    setIsCalculatingDistance(true);
    try {
      const response = await fetch('/api/addresses/calculate-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: 'id' in address ? address.id : undefined,
          addressString: address.formattedAddress,
          portCode,
          incoterm
        })
      });
      
      const result = await response.json();
      setDistanceData(result);
      
      // Pass distance data back to parent
      onChange(address.formattedAddress, {
        distance: result.distance,
        cost: result.cost
      });
    } catch (error) {
      console.error('Distance calculation failed:', error);
    }
    setIsCalculatingDistance(false);
  };

  const handleAddressSelect = (address: Address) => {
    setQuery(address.formattedAddress);
    setSelectedAddress(address);
    setShowSuggestions(false);
    calculateDistance(address);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    
    // Reset selection if user types manually
    if (selectedAddress && newValue !== selectedAddress.formattedAddress) {
      setSelectedAddress(null);
      setDistanceData(null);
    }
    
    // Always pass the exact typed value to parent
    onChange(newValue);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          onBlur={() => {
            // Ensure the typed value is saved when user leaves the field
            setTimeout(() => {
              setShowSuggestions(false);
              // If no address was selected from dropdown, use what they typed
              if (!selectedAddress || query !== selectedAddress.formattedAddress) {
                onChange(query);
              }
            }, 200);
          }}
          placeholder={placeholder}
          className="pl-10 pr-4"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Address Suggestions Dropdown */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((address) => (
                <button
                  key={address.id}
                  onClick={() => handleAddressSelect(address)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {address.streetName && `${address.streetName}, `}
                        {address.suburb}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {address.city}, {address.province} {address.postalCode}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="p-4">
              {query.trim().length >= 5 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>No matching addresses found in our database</span>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500 mb-2">
                      Use your custom address:
                    </p>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {query}
                      </p>
                      <p className="text-xs text-gray-500">
                        We'll calculate trucking costs based on your location
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full mt-3"
                      onClick={() => {
                        setShowSuggestions(false);
                        // Use exactly what the user typed
                        const customAddress = {
                          id: `custom_${Date.now()}`,
                          formattedAddress: query, // Use exact typed text
                          city: 'Custom Location',
                          province: 'Custom',
                          postalCode: '0000',
                          lat: -26.2041,
                          lng: 28.0473
                        };
                        setSelectedAddress(customAddress);
                        // Pass the exact typed address to parent
                        onChange(query);
                        // Calculate distance for custom address
                        calculateDistance({ formattedAddress: query });
                      }}
                    >
                      Use This Custom Address
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">
                    Type at least 5 characters to search
                  </p>
                  <p className="text-xs text-gray-400">
                    or enter your complete address
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Distance and Cost Display */}
      {selectedAddress && distanceData && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Distance & Trucking Cost
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Truck className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600">Distance:</span>
              <Badge variant="outline" className="text-xs">
                {distanceData.distance} km
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600">Trucking:</span>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                {formatCurrency(distanceData.cost)}
              </Badge>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-blue-600">
            From {distanceData.portName} → {selectedAddress.city}
            {incoterm && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 rounded text-blue-700">
                {incoterm} terms
              </span>
            )}
          </div>
          
          {isCalculatingDistance && (
            <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
              <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full" />
              Calculating precise cost...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;