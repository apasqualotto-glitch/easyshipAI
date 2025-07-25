export interface ShippingCalculation {
  seaFreightCost: number;
  truckingCost: number;
  customsDuties: number;
  vat: number;
  handlingFees: number;
  totalCost: number;
  costPerKg: number;
}

export interface ContainerSpecs {
  maxWeight: number;
  volume: number; // cubic meters
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export const containerSpecs: Record<string, ContainerSpecs> = {
  "20ft": {
    maxWeight: 28080,
    volume: 33.2,
    dimensions: { length: 5.9, width: 2.35, height: 2.39 }
  },
  "40ft": {
    maxWeight: 26680,
    volume: 67.7,
    dimensions: { length: 12.03, width: 2.35, height: 2.39 }
  },
  "40ft-hc": {
    maxWeight: 26680,
    volume: 76.3,
    dimensions: { length: 12.03, width: 2.35, height: 2.69 }
  }
};

export const validateCargoWeight = (containerType: string, weight: number): boolean => {
  const specs = containerSpecs[containerType];
  return weight <= specs.maxWeight;
};

export const calculateVolumetricWeight = (
  length: number, 
  width: number, 
  height: number
): number => {
  // Standard volumetric weight calculation for sea freight (1 m³ = 1000 kg)
  return (length * width * height) / 1000;
};

export const getOptimalContainer = (weight: number, volume: number): string[] => {
  const suitable: string[] = [];
  
  Object.entries(containerSpecs).forEach(([type, specs]) => {
    if (weight <= specs.maxWeight && volume <= specs.volume) {
      suitable.push(type);
    }
  });
  
  return suitable;
};

export const formatCurrency = (amount: number, currency: string = "ZAR"): string => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateEstimatedDelivery = (transitDays: number): Date => {
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + transitDays + 3); // +3 for customs clearance
  return deliveryDate;
};
