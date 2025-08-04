import Fuse from 'fuse.js';

// South African address database with coordinates for distance calculation
export interface Address {
  id: string;
  formattedAddress: string;
  city: string;
  province: string;
  postalCode: string;
  lat: number;
  lng: number;
  suburb?: string;
  streetName?: string;
}

// Comprehensive South African address database
const southAfricanAddresses: Address[] = [
  // Cape Town Addresses
  {
    id: "cpt_001",
    formattedAddress: "123 Main Street, Observatory, Cape Town 7925",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "7925",
    suburb: "Observatory",
    streetName: "Main Street",
    lat: -33.9281, lng: 18.4716
  },
  {
    id: "cpt_002", 
    formattedAddress: "456 Long Street, Cape Town City Centre, Cape Town 8001",
    city: "Cape Town",
    province: "Western Cape", 
    postalCode: "8001",
    suburb: "City Centre",
    streetName: "Long Street",
    lat: -33.9249, lng: 18.4241
  },
  {
    id: "cpt_003",
    formattedAddress: "789 Kloof Street, Gardens, Cape Town 8001",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8001", 
    suburb: "Gardens",
    streetName: "Kloof Street",
    lat: -33.9290, lng: 18.4145
  },
  {
    id: "cpt_004",
    formattedAddress: "321 Victoria Road, Camps Bay, Cape Town 8005",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8005",
    suburb: "Camps Bay", 
    streetName: "Victoria Road",
    lat: -33.9553, lng: 18.3771
  },
  {
    id: "cpt_005",
    formattedAddress: "654 Beach Road, Sea Point, Cape Town 8005",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8005",
    suburb: "Sea Point",
    streetName: "Beach Road", 
    lat: -33.9105, lng: 18.3927
  },

  // Johannesburg Addresses
  {
    id: "jhb_001",
    formattedAddress: "456 Business Street, Sandton, Johannesburg 2196",
    city: "Johannesburg", 
    province: "Gauteng",
    postalCode: "2196",
    suburb: "Sandton",
    streetName: "Business Street",
    lat: -26.1076, lng: 28.0567
  },
  {
    id: "jhb_002",
    formattedAddress: "789 Commissioner Street, Johannesburg CBD, Johannesburg 2001",
    city: "Johannesburg",
    province: "Gauteng",
    postalCode: "2001", 
    suburb: "CBD",
    streetName: "Commissioner Street",
    lat: -26.2041, lng: 28.0473
  },
  {
    id: "jhb_003",
    formattedAddress: "123 Oxford Road, Rosebank, Johannesburg 2196",
    city: "Johannesburg",
    province: "Gauteng",
    postalCode: "2196",
    suburb: "Rosebank", 
    streetName: "Oxford Road",
    lat: -26.1448, lng: 28.0436
  },
  {
    id: "jhb_004", 
    formattedAddress: "567 Jan Smuts Avenue, Dunkeld, Johannesburg 2196",
    city: "Johannesburg",
    province: "Gauteng",
    postalCode: "2196",
    suburb: "Dunkeld",
    streetName: "Jan Smuts Avenue",
    lat: -26.1367, lng: 28.0364
  },
  {
    id: "jhb_005",
    formattedAddress: "890 Empire Road, Parktown, Johannesburg 2193",
    city: "Johannesburg",
    province: "Gauteng", 
    postalCode: "2193",
    suburb: "Parktown",
    streetName: "Empire Road",
    lat: -26.1849, lng: 28.0436
  },

  // Durban Addresses
  {
    id: "dbn_001",
    formattedAddress: "234 Smith Street, Durban Central, Durban 4001",
    city: "Durban",
    province: "KwaZulu-Natal",
    postalCode: "4001",
    suburb: "Central",
    streetName: "Smith Street", 
    lat: -29.8587, lng: 31.0218
  },
  {
    id: "dbn_002",
    formattedAddress: "567 Marine Parade, South Beach, Durban 4056",
    city: "Durban", 
    province: "KwaZulu-Natal",
    postalCode: "4056",
    suburb: "South Beach",
    streetName: "Marine Parade",
    lat: -29.8674, lng: 31.0344
  },
  {
    id: "dbn_003",
    formattedAddress: "890 Florida Road, Morningside, Durban 4001",
    city: "Durban",
    province: "KwaZulu-Natal", 
    postalCode: "4001",
    suburb: "Morningside",
    streetName: "Florida Road",
    lat: -29.8208, lng: 31.0070
  },

  // Port Elizabeth Addresses
  {
    id: "pe_001",
    formattedAddress: "345 Main Street, Central, Port Elizabeth 6001",
    city: "Port Elizabeth",
    province: "Eastern Cape",
    postalCode: "6001",
    suburb: "Central", 
    streetName: "Main Street",
    lat: -33.9580, lng: 25.6022
  },
  {
    id: "pe_002",
    formattedAddress: "678 Beach Road, Summerstrand, Port Elizabeth 6001",
    city: "Port Elizabeth",
    province: "Eastern Cape",
    postalCode: "6001",
    suburb: "Summerstrand",
    streetName: "Beach Road",
    lat: -33.9751, lng: 25.6421
  },

  // Pretoria Addresses
  {
    id: "pta_001",
    formattedAddress: "123 Church Street, Pretoria Central, Pretoria 0002",
    city: "Pretoria",
    province: "Gauteng",
    postalCode: "0002",
    suburb: "Central",
    streetName: "Church Street",
    lat: -25.7479, lng: 28.2293
  },
  {
    id: "pta_002",
    formattedAddress: "456 Lynnwood Road, Brooklyn, Pretoria 0181",
    city: "Pretoria", 
    province: "Gauteng",
    postalCode: "0181",
    suburb: "Brooklyn",
    streetName: "Lynnwood Road", 
    lat: -25.7679, lng: 28.2454
  }
];

// Port coordinates for distance calculation
export const portCoordinates = {
  "ZACPT": { lat: -33.9080, lng: 18.4180, name: "Cape Town Port" },
  "ZADUR": { lat: -29.8674, lng: 31.0344, name: "Durban Port" },
  "ZAPEZ": { lat: -33.9580, lng: 25.6022, name: "Port Elizabeth Port" },
  "ZARBD": { lat: -28.7833, lng: 32.0833, name: "Richards Bay Port" },
  "ZAELS": { lat: -33.0158, lng: 27.9139, name: "East London Port" },
  "ZAMOB": { lat: -34.1833, lng: 22.1500, name: "Mossel Bay Port" },
  "ZASDB": { lat: -33.0167, lng: 17.9667, name: "Saldanha Bay Port" }
};

// Initialize Fuse.js for fuzzy address search
const fuse = new Fuse(southAfricanAddresses, {
  keys: [
    { name: 'formattedAddress', weight: 0.4 },
    { name: 'streetName', weight: 0.3 },
    { name: 'suburb', weight: 0.2 },
    { name: 'city', weight: 0.1 }
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2
});

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Calculate trucking cost based on distance and Incoterm
export function calculateTruckingCost(distanceKm: number, incoterm: string): number {
  const baseRatePerKm = 18; // R18 per kilometer base rate
  let incotermMultiplier = 1.0;
  
  // Apply Incoterm-based pricing
  switch (incoterm?.toUpperCase()) {
    case 'EXW':
    case 'FCA':
      incotermMultiplier = 0.3; // Minimal port service
      break;
    case 'FOB':
    case 'CFR': 
    case 'CIF':
      incotermMultiplier = 1.0; // Standard door-to-door
      break;
    case 'DAP':
    case 'DDP':
      incotermMultiplier = 1.2; // Premium full service
      break;
    default:
      incotermMultiplier = 1.0;
  }
  
  // Minimum charge
  const minimumCharge = 1200;
  const calculatedCost = Math.max(distanceKm * baseRatePerKm * incotermMultiplier, minimumCharge);
  
  // Round to nearest R10
  return Math.round(calculatedCost / 10) * 10;
}

// Search addresses with autocomplete
export function searchAddresses(query: string, limit: number = 8): Address[] {
  if (!query || query.length < 2) {
    // Return all addresses if no query (for ID lookups)
    return southAfricanAddresses.slice(0, limit);
  }
  
  const results = fuse.search(query, { limit });
  return results.map(result => result.item);
}

// Get address by ID
export function getAddressById(id: string): Address | undefined {
  return southAfricanAddresses.find(addr => addr.id === id);
}

// Get distance and cost from port to address
export function getDistanceAndCost(address: Address, portCode: string, incoterm: string = 'FOB') {
  const port = portCoordinates[portCode as keyof typeof portCoordinates];
  if (!port) {
    return { distance: 0, cost: 1800, error: 'Port not found' };
  }
  
  const distance = calculateDistance(port.lat, port.lng, address.lat, address.lng);
  const cost = calculateTruckingCost(distance, incoterm);
  
  return {
    distance: Math.round(distance),
    cost,
    portName: port.name,
    deliveryAddress: address.formattedAddress
  };
}

// Get all addresses for a specific city
export function getAddressesByCity(city: string): Address[] {
  return southAfricanAddresses.filter(addr => 
    addr.city.toLowerCase() === city.toLowerCase()
  );
}

export default {
  searchAddresses,
  getAddressById,
  getDistanceAndCost,
  calculateDistance,
  calculateTruckingCost,
  getAddressesByCity,
  portCoordinates
};