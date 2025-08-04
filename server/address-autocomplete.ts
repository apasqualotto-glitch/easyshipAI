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

// Comprehensive South African address database - covering all provinces and major areas
const southAfricanAddresses: Address[] = [
  // GAUTENG PROVINCE
  // Johannesburg
  { id: "jhb_001", formattedAddress: "1 Sandton Drive, Sandton, Johannesburg 2196", city: "Johannesburg", province: "Gauteng", postalCode: "2196", suburb: "Sandton", streetName: "Sandton Drive", lat: -26.1076, lng: 28.0567 },
  { id: "jhb_002", formattedAddress: "45 Commissioner Street, Johannesburg CBD, Johannesburg 2001", city: "Johannesburg", province: "Gauteng", postalCode: "2001", suburb: "CBD", streetName: "Commissioner Street", lat: -26.2041, lng: 28.0473 },
  { id: "jhb_003", formattedAddress: "78 Oxford Road, Rosebank, Johannesburg 2196", city: "Johannesburg", province: "Gauteng", postalCode: "2196", suburb: "Rosebank", streetName: "Oxford Road", lat: -26.1448, lng: 28.0436 },
  { id: "jhb_004", formattedAddress: "12 Jan Smuts Avenue, Dunkeld, Johannesburg 2196", city: "Johannesburg", province: "Gauteng", postalCode: "2196", suburb: "Dunkeld", streetName: "Jan Smuts Avenue", lat: -26.1367, lng: 28.0364 },
  { id: "jhb_005", formattedAddress: "89 Empire Road, Parktown, Johannesburg 2193", city: "Johannesburg", province: "Gauteng", postalCode: "2193", suburb: "Parktown", streetName: "Empire Road", lat: -26.1849, lng: 28.0436 },
  { id: "jhb_006", formattedAddress: "23 Barry Hertzog Avenue, Emmarentia, Johannesburg 2195", city: "Johannesburg", province: "Gauteng", postalCode: "2195", suburb: "Emmarentia", streetName: "Barry Hertzog Avenue", lat: -26.1520, lng: 28.0112 },
  { id: "jhb_007", formattedAddress: "67 Rivonia Road, Rivonia, Johannesburg 2128", city: "Johannesburg", province: "Gauteng", postalCode: "2128", suburb: "Rivonia", streetName: "Rivonia Road", lat: -26.0520, lng: 28.0596 },
  { id: "jhb_008", formattedAddress: "34 Main Street, Melville, Johannesburg 2109", city: "Johannesburg", province: "Gauteng", postalCode: "2109", suburb: "Melville", streetName: "Main Street", lat: -26.1886, lng: 28.0142 },
  { id: "jhb_009", formattedAddress: "91 Nelson Mandela Bridge, Newtown, Johannesburg 2001", city: "Johannesburg", province: "Gauteng", postalCode: "2001", suburb: "Newtown", streetName: "Nelson Mandela Bridge", lat: -26.2034, lng: 28.0365 },
  { id: "jhb_010", formattedAddress: "56 7th Avenue, Parkhurst, Johannesburg 2120", city: "Johannesburg", province: "Gauteng", postalCode: "2120", suburb: "Parkhurst", streetName: "7th Avenue", lat: -26.1367, lng: 28.0064 },

  // Pretoria/Tshwane
  { id: "pta_001", formattedAddress: "123 Church Street, Pretoria Central, Pretoria 0002", city: "Pretoria", province: "Gauteng", postalCode: "0002", suburb: "Central", streetName: "Church Street", lat: -25.7479, lng: 28.2293 },
  { id: "pta_002", formattedAddress: "456 Lynnwood Road, Brooklyn, Pretoria 0181", city: "Pretoria", province: "Gauteng", postalCode: "0181", suburb: "Brooklyn", streetName: "Lynnwood Road", lat: -25.7679, lng: 28.2454 },
  { id: "pta_003", formattedAddress: "78 Duncan Street, Hatfield, Pretoria 0028", city: "Pretoria", province: "Gauteng", postalCode: "0028", suburb: "Hatfield", streetName: "Duncan Street", lat: -25.7497, lng: 28.2436 },
  { id: "pta_004", formattedAddress: "34 Burnett Street, Centurion, Pretoria 0157", city: "Pretoria", province: "Gauteng", postalCode: "0157", suburb: "Centurion", streetName: "Burnett Street", lat: -25.8601, lng: 28.1882 },
  { id: "pta_005", formattedAddress: "67 Garsfontein Road, Garsfontein, Pretoria 0081", city: "Pretoria", province: "Gauteng", postalCode: "0081", suburb: "Garsfontein", streetName: "Garsfontein Road", lat: -25.7910, lng: 28.3265 },

  // WESTERN CAPE PROVINCE  
  // Cape Town
  { id: "cpt_001", formattedAddress: "123 Long Street, Cape Town City Centre, Cape Town 8001", city: "Cape Town", province: "Western Cape", postalCode: "8001", suburb: "City Centre", streetName: "Long Street", lat: -33.9249, lng: 18.4241 },
  { id: "cpt_002", formattedAddress: "456 Kloof Street, Gardens, Cape Town 8001", city: "Cape Town", province: "Western Cape", postalCode: "8001", suburb: "Gardens", streetName: "Kloof Street", lat: -33.9290, lng: 18.4145 },
  { id: "cpt_003", formattedAddress: "789 Victoria Road, Camps Bay, Cape Town 8005", city: "Cape Town", province: "Western Cape", postalCode: "8005", suburb: "Camps Bay", streetName: "Victoria Road", lat: -33.9553, lng: 18.3771 },
  { id: "cpt_004", formattedAddress: "321 Beach Road, Sea Point, Cape Town 8005", city: "Cape Town", province: "Western Cape", postalCode: "8005", suburb: "Sea Point", streetName: "Beach Road", lat: -33.9105, lng: 18.3927 },
  { id: "cpt_005", formattedAddress: "654 Lower Main Road, Observatory, Cape Town 7925", city: "Cape Town", province: "Western Cape", postalCode: "7925", suburb: "Observatory", streetName: "Lower Main Road", lat: -33.9281, lng: 18.4716 },
  { id: "cpt_006", formattedAddress: "23 Rhodes Drive, Mowbray, Cape Town 7700", city: "Cape Town", province: "Western Cape", postalCode: "7700", suburb: "Mowbray", streetName: "Rhodes Drive", lat: -33.9467, lng: 18.4709 },
  { id: "cpt_007", formattedAddress: "89 Main Road, Claremont, Cape Town 7708", city: "Cape Town", province: "Western Cape", postalCode: "7708", suburb: "Claremont", streetName: "Main Road", lat: -33.9848, lng: 18.4647 },
  { id: "cpt_008", formattedAddress: "45 Strand Street, Stellenbosch 7600", city: "Stellenbosch", province: "Western Cape", postalCode: "7600", suburb: "Central", streetName: "Strand Street", lat: -33.9321, lng: 18.8602 },
  { id: "cpt_009", formattedAddress: "67 Beach Road, Muizenberg, Cape Town 7945", city: "Cape Town", province: "Western Cape", postalCode: "7945", suburb: "Muizenberg", streetName: "Beach Road", lat: -34.1075, lng: 18.4669 },
  { id: "cpt_010", formattedAddress: "12 Voortrekker Road, Bellville, Cape Town 7530", city: "Cape Town", province: "Western Cape", postalCode: "7530", suburb: "Bellville", streetName: "Voortrekker Road", lat: -33.8904, lng: 18.6292 },

  // KWAZULU-NATAL PROVINCE
  // Durban
  { id: "dbn_001", formattedAddress: "234 Smith Street, Durban Central, Durban 4001", city: "Durban", province: "KwaZulu-Natal", postalCode: "4001", suburb: "Central", streetName: "Smith Street", lat: -29.8587, lng: 31.0218 },
  { id: "dbn_002", formattedAddress: "567 Marine Parade, South Beach, Durban 4056", city: "Durban", province: "KwaZulu-Natal", postalCode: "4056", suburb: "South Beach", streetName: "Marine Parade", lat: -29.8674, lng: 31.0344 },
  { id: "dbn_003", formattedAddress: "890 Florida Road, Morningside, Durban 4001", city: "Durban", province: "KwaZulu-Natal", postalCode: "4001", suburb: "Morningside", streetName: "Florida Road", lat: -29.8208, lng: 31.0070 },
  { id: "dbn_004", formattedAddress: "45 Umhlanga Rocks Drive, Umhlanga, Durban 4320", city: "Durban", province: "KwaZulu-Natal", postalCode: "4320", suburb: "Umhlanga", streetName: "Umhlanga Rocks Drive", lat: -29.7277, lng: 31.0420 },
  { id: "dbn_005", formattedAddress: "78 Westville Road, Westville, Durban 3630", city: "Durban", province: "KwaZulu-Natal", postalCode: "3630", suburb: "Westville", streetName: "Westville Road", lat: -29.8314, lng: 30.9185 },
  { id: "dbn_006", formattedAddress: "23 Pietermaritzburg Road, Pietermaritzburg 3201", city: "Pietermaritzburg", province: "KwaZulu-Natal", postalCode: "3201", suburb: "Central", streetName: "Pietermaritzburg Road", lat: -29.6020, lng: 30.3794 },

  // EASTERN CAPE PROVINCE
  // Port Elizabeth/Gqeberha
  { id: "pe_001", formattedAddress: "345 Main Street, Central, Port Elizabeth 6001", city: "Port Elizabeth", province: "Eastern Cape", postalCode: "6001", suburb: "Central", streetName: "Main Street", lat: -33.9580, lng: 25.6022 },
  { id: "pe_002", formattedAddress: "678 Beach Road, Summerstrand, Port Elizabeth 6001", city: "Port Elizabeth", province: "Eastern Cape", postalCode: "6001", suburb: "Summerstrand", streetName: "Beach Road", lat: -33.9751, lng: 25.6421 },
  { id: "pe_003", formattedAddress: "123 Settlers Way, Settlers Park, Port Elizabeth 6001", city: "Port Elizabeth", province: "Eastern Cape", postalCode: "6001", suburb: "Settlers Park", streetName: "Settlers Way", lat: -33.9698, lng: 25.6254 },
  { id: "ec_001", formattedAddress: "56 Oxford Street, East London 5201", city: "East London", province: "Eastern Cape", postalCode: "5201", suburb: "Central", streetName: "Oxford Street", lat: -33.0158, lng: 27.9139 },

  // FREE STATE PROVINCE  
  { id: "fs_001", formattedAddress: "89 President Brand Street, Bloemfontein 9300", city: "Bloemfontein", province: "Free State", postalCode: "9300", suburb: "Central", streetName: "President Brand Street", lat: -29.0852, lng: 26.1596 },
  { id: "fs_002", formattedAddress: "34 Maitland Street, Welkom 9460", city: "Welkom", province: "Free State", postalCode: "9460", suburb: "Central", streetName: "Maitland Street", lat: -27.9770, lng: 26.7340 },

  // NORTHERN CAPE PROVINCE
  { id: "nc_001", formattedAddress: "67 Kimberley Road, Kimberley 8301", city: "Kimberley", province: "Northern Cape", postalCode: "8301", suburb: "Central", streetName: "Kimberley Road", lat: -28.7282, lng: 24.7499 },
  { id: "nc_002", formattedAddress: "12 Main Street, Upington 8800", city: "Upington", province: "Northern Cape", postalCode: "8800", suburb: "Central", streetName: "Main Street", lat: -28.4478, lng: 21.2561 },

  // NORTH WEST PROVINCE
  { id: "nw_001", formattedAddress: "45 Nelson Mandela Drive, Rustenburg 0300", city: "Rustenburg", province: "North West", postalCode: "0300", suburb: "Central", streetName: "Nelson Mandela Drive", lat: -25.6669, lng: 27.2423 },
  { id: "nw_002", formattedAddress: "78 Potchefstroom Road, Potchefstroom 2520", city: "Potchefstroom", province: "North West", postalCode: "2520", suburb: "Central", streetName: "Potchefstroom Road", lat: -26.7141, lng: 27.0982 },

  // LIMPOPO PROVINCE
  { id: "lp_001", formattedAddress: "23 Church Street, Polokwane 0700", city: "Polokwane", province: "Limpopo", postalCode: "0700", suburb: "Central", streetName: "Church Street", lat: -23.9045, lng: 29.4689 },
  { id: "lp_002", formattedAddress: "89 Thabo Mbeki Street, Lephalale 0555", city: "Lephalale", province: "Limpopo", postalCode: "0555", suburb: "Central", streetName: "Thabo Mbeki Street", lat: -23.6792, lng: 27.7694 },

  // MPUMALANGA PROVINCE
  { id: "mp_001", formattedAddress: "56 Government Boulevard, Nelspruit 1200", city: "Nelspruit", province: "Mpumalanga", postalCode: "1200", suburb: "Central", streetName: "Government Boulevard", lat: -25.4747, lng: 30.9689 },
  { id: "mp_002", formattedAddress: "34 Emalahleni Street, Emalahleni 1035", city: "Emalahleni", province: "Mpumalanga", postalCode: "1035", suburb: "Central", streetName: "Emalahleni Street", lat: -25.8738, lng: 29.2333 },

  // ADDITIONAL MAJOR INDUSTRIAL/COMMERCIAL AREAS
  { id: "ind_001", formattedAddress: "12 Industrial Road, Midrand 1685", city: "Midrand", province: "Gauteng", postalCode: "1685", suburb: "Industrial", streetName: "Industrial Road", lat: -25.9947, lng: 28.1294 },
  { id: "ind_002", formattedAddress: "78 Factory Street, Germiston 1401", city: "Germiston", province: "Gauteng", postalCode: "1401", suburb: "Industrial", streetName: "Factory Street", lat: -26.2054, lng: 28.1772 },
  { id: "ind_003", formattedAddress: "45 Warehouse Avenue, Kempton Park 1619", city: "Kempton Park", province: "Gauteng", postalCode: "1619", suburb: "Industrial", streetName: "Warehouse Avenue", lat: -26.1017, lng: 28.2305 },
  { id: "ind_004", formattedAddress: "23 Logistics Lane, Pinetown 3610", city: "Pinetown", province: "KwaZulu-Natal", postalCode: "3610", suburb: "Industrial", streetName: "Logistics Lane", lat: -29.8269, lng: 30.8669 }
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

// Initialize Fuse.js for fuzzy address search with more flexible matching
const fuse = new Fuse(southAfricanAddresses, {
  keys: [
    { name: 'formattedAddress', weight: 0.3 },
    { name: 'city', weight: 0.25 },
    { name: 'suburb', weight: 0.2 },
    { name: 'streetName', weight: 0.15 },
    { name: 'province', weight: 0.1 }
  ],
  threshold: 0.4, // More liberal matching
  includeScore: true,
  minMatchCharLength: 1, // Allow single character searches
  ignoreLocation: true,
  findAllMatches: true
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

// Common South African city abbreviations and alternative spellings
const cityAbbreviations: { [key: string]: string[] } = {
  'jhb': ['Johannesburg', 'Joburg', 'Jozi'],
  'jozi': ['Johannesburg', 'Joburg', 'Jozi'],
  'joburg': ['Johannesburg', 'Joburg', 'Jozi'],
  'pta': ['Pretoria', 'Tshwane'],
  'tshwane': ['Pretoria', 'Tshwane'],
  'cpt': ['Cape Town', 'Cape'],
  'ct': ['Cape Town', 'Cape'],
  'dbn': ['Durban', 'eThekwini'],
  'ethekwini': ['Durban', 'eThekwini'],
  'pe': ['Port Elizabeth', 'Gqeberha'],
  'gqeberha': ['Port Elizabeth', 'Gqeberha'],
  'el': ['East London'],
  'bloem': ['Bloemfontein'],
  'kimberley': ['Kimberley'],
  'polokwane': ['Polokwane', 'Pietersburg'],
  'pietersburg': ['Polokwane', 'Pietersburg'],
  'nelspruit': ['Nelspruit', 'Mbombela'],
  'mbombela': ['Nelspruit', 'Mbombela']
};

// Search addresses with autocomplete and abbreviation support
export function searchAddresses(query: string, limit: number = 8): Address[] {
  if (!query || query.length < 1) {
    // Return sample addresses if no query
    return southAfricanAddresses.slice(0, limit);
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check for city abbreviations first
  const expandedQueries = [normalizedQuery];
  if (cityAbbreviations[normalizedQuery]) {
    expandedQueries.push(...cityAbbreviations[normalizedQuery].map(term => term.toLowerCase()));
  }
  
  // Search with all expanded terms
  let allResults: { item: Address; score?: number }[] = [];
  
  for (const searchTerm of expandedQueries) {
    const results = fuse.search(searchTerm, { limit: limit * 2 });
    allResults.push(...results);
  }
  
  // Remove duplicates and sort by relevance
  const uniqueResults = allResults.filter((result, index, self) => 
    index === self.findIndex(r => r.item.id === result.item.id)
  );
  
  // Sort by score (lower is better in Fuse.js) and take top results
  uniqueResults.sort((a, b) => (a.score || 0) - (b.score || 0));
  
  return uniqueResults.slice(0, limit).map(result => result.item);
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