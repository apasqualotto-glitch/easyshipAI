// Carrier Booking Service Integration
import { randomUUID } from "crypto";

export interface BookingRequest {
  quoteId: string;
  carrierCode: string; // 'MAEU' (Maersk), 'MSCU' (MSC), 'CMDU' (CMA CGM), etc.
  
  // Shipper Information
  shipper: {
    name: string;
    address: string;
    city: string;
    country: string;
    email: string;
    phone: string;
  };
  
  // Consignee Information
  consignee: {
    name: string;
    address: string;
    city: string;
    country: string;
    email: string;
    phone: string;
  };
  
  // Cargo Details
  cargo: {
    commodityCode: string; // HS Code
    description: string;
    weight: number;
    volume: number;
    dangerousGoods?: boolean;
    value: number;
    currency: string;
  };
  
  // Container Requirements
  container: {
    type: string; // '20GP', '40GP', '40HC'
    quantity: number;
  };
  
  // Service Details
  serviceType: 'FCL' | 'LCL';
  incoterm: string;
  preferredDeparture?: string; // ISO date
  specialInstructions?: string;
}

export interface BookingResponse {
  success: boolean;
  bookingReference?: string;
  carrierBookingNumber?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  estimatedDeparture?: string;
  estimatedArrival?: string;
  documentRequirements?: string[];
  nextSteps?: string[];
  error?: string;
  contactInfo?: {
    agentName: string;
    email: string;
    phone: string;
  };
}

export interface BookingStatus {
  bookingReference: string;
  status: 'PENDING' | 'CONFIRMED' | 'DOCS_REQUIRED' | 'LOADED' | 'IN_TRANSIT' | 'DISCHARGED' | 'DELIVERED';
  lastUpdate: string;
  milestones: {
    event: string;
    location: string;
    timestamp: string;
    completed: boolean;
  }[];
  documents: {
    type: string; // 'BILL_OF_LADING', 'COMMERCIAL_INVOICE', 'PACKING_LIST'
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    downloadUrl?: string;
  }[];
}

class CarrierBookingService {
  private static instance: CarrierBookingService;

  static getInstance(): CarrierBookingService {
    if (!CarrierBookingService.instance) {
      CarrierBookingService.instance = new CarrierBookingService();
    }
    return CarrierBookingService.instance;
  }

  // Maersk API Integration
  async bookWithMaersk(request: BookingRequest): Promise<BookingResponse> {
    const apiKey = process.env.MAERSK_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        status: 'REJECTED',
        error: 'Maersk API key not configured. Please contact support to set up carrier booking.'
      };
    }

    try {
      // Maersk Booking API v2 (DCSA compliant)
      const bookingPayload = {
        bookingRequestReference: randomUUID(),
        
        // Service contract details
        serviceContract: {
          carrierServiceCode: 'AE1', // Example service
          universalServiceReference: request.quoteId
        },
        
        // Commodity information
        commodities: [{
          commodityType: request.cargo.description,
          HSCode: request.cargo.commodityCode,
          cargoGrossWeight: request.cargo.weight,
          cargoGrossWeightUnit: 'KGS',
          cargoGrossVolume: request.cargo.volume,
          cargoGrossVolumeUnit: 'CBM',
          numberOfPackages: 1
        }],
        
        // Equipment requirements
        requestedEquipments: [{
          requestedEquipmentSizeType: this.convertContainerType(request.container.type),
          requestedEquipmentUnits: request.container.quantity,
          isShipperOwned: false
        }],
        
        // Route details
        shipmentLocations: [
          {
            location: {
              UNLocationCode: this.extractPortCode(request.quoteId), // Extract from stored quote
            },
            shipmentLocationTypeCode: 'PRE'
          },
          {
            location: {
              UNLocationCode: this.extractDestinationCode(request.quoteId),
            },
            shipmentLocationTypeCode: 'POD'
          }
        ],
        
        // Party information
        parties: [
          {
            partyName: request.shipper.name,
            partyContactDetails: [{
              name: request.shipper.name,
              email: request.shipper.email,
              phone: request.shipper.phone
            }],
            partyAddress: {
              name: request.shipper.name,
              street: request.shipper.address,
              city: request.shipper.city,
              country: request.shipper.country
            },
            partyFunction: 'SHI' // Shipper
          },
          {
            partyName: request.consignee.name,
            partyContactDetails: [{
              name: request.consignee.name,
              email: request.consignee.email,
              phone: request.consignee.phone
            }],
            partyAddress: {
              name: request.consignee.name,
              street: request.consignee.address,
              city: request.consignee.city,
              country: request.consignee.country
            },
            partyFunction: 'CN' // Consignee
          }
        ]
      };

      const response = await fetch('https://api.maersk.com/booking/v2/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'API-Version': '2'
        },
        body: JSON.stringify(bookingPayload)
      });

      if (response.ok) {
        const bookingData = await response.json();
        return {
          success: true,
          bookingReference: bookingData.bookingRequestReference,
          carrierBookingNumber: bookingData.carrierBookingReference,
          status: 'PENDING',
          documentRequirements: [
            'Commercial Invoice',
            'Packing List',
            'Export Declaration',
            'Certificate of Origin (if applicable)'
          ],
          nextSteps: [
            'Submit required documentation',
            'Arrange cargo delivery to port',
            'Complete customs clearance'
          ],
          contactInfo: {
            agentName: 'Maersk Customer Service',
            email: 'booking.support@maersk.com',
            phone: '+1-800-MAERSK'
          }
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          status: 'REJECTED',
          error: `Maersk booking failed: ${error}`
        };
      }

    } catch (error) {
      return {
        success: false,
        status: 'REJECTED',
        error: `Maersk API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // MSC API Integration
  async bookWithMSC(request: BookingRequest): Promise<BookingResponse> {
    const apiKey = process.env.MSC_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        status: 'REJECTED',
        error: 'MSC API key not configured. Please contact support to set up carrier booking.'
      };
    }

    try {
      // MSC DCSA-compliant booking API
      const mscPayload = {
        bookingRequestReference: randomUUID(),
        
        // Shipment details
        shipmentType: request.serviceType,
        serviceContractReference: 'SPOT', // For spot bookings
        
        // Cargo information
        commodities: [{
          commodityType: request.cargo.description,
          HSCode: request.cargo.commodityCode,
          cargoGrossWeight: request.cargo.weight,
          cargoGrossWeightUnit: 'KGS'
        }],
        
        // Container requirements
        requestedEquipments: [{
          requestedEquipmentSizeType: request.container.type,
          requestedEquipmentUnits: request.container.quantity
        }],
        
        // Commercial terms
        incoterms: request.incoterm,
        
        // Documentation
        submissionDateTime: new Date().toISOString(),
        
        // Contact information
        partyContactDetails: [
          {
            partyFunction: 'SHI',
            partyName: request.shipper.name,
            contactEmail: request.shipper.email,
            contactPhone: request.shipper.phone
          },
          {
            partyFunction: 'CN',
            partyName: request.consignee.name,
            contactEmail: request.consignee.email,
            contactPhone: request.consignee.phone
          }
        ]
      };

      const response = await fetch('https://api.msc.com/booking/v2/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mscPayload)
      });

      if (response.ok) {
        const bookingData = await response.json();
        return {
          success: true,
          bookingReference: bookingData.bookingRequestReference,
          carrierBookingNumber: bookingData.mscBookingNumber,
          status: 'PENDING',
          documentRequirements: [
            'Shipper\'s Letter of Instruction',
            'Commercial Invoice',
            'Packing List',
            'Export License (if required)'
          ],
          contactInfo: {
            agentName: 'MSC Customer Care',
            email: 'customer.care@msc.com',
            phone: '+41-22-703-8888'
          }
        };
      } else {
        return {
          success: false,
          status: 'REJECTED',
          error: 'MSC booking request failed. Please try again or contact MSC directly.'
        };
      }

    } catch (error) {
      return {
        success: false,
        status: 'REJECTED',
        error: `MSC API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Unified booking method
  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    switch (request.carrierCode) {
      case 'MAEU':
        return this.bookWithMaersk(request);
      case 'MSCU':
        return this.bookWithMSC(request);
      case 'CMDU':
        return this.bookWithCMACGM(request);
      default:
        return {
          success: false,
          status: 'REJECTED',
          error: `Carrier ${request.carrierCode} booking not yet supported. Supported carriers: Maersk (MAEU), MSC (MSCU), CMA CGM (CMDU)`
        };
    }
  }

  // CMA CGM booking (placeholder for future implementation)
  async bookWithCMACGM(request: BookingRequest): Promise<BookingResponse> {
    return {
      success: false,
      status: 'REJECTED',
      error: 'CMA CGM booking API integration coming soon. Please contact CMA CGM directly for now.'
    };
  }

  // Track booking status
  async getBookingStatus(carrierCode: string, bookingReference: string): Promise<BookingStatus> {
    // Implementation would call carrier-specific tracking APIs
    return {
      bookingReference,
      status: 'PENDING',
      lastUpdate: new Date().toISOString(),
      milestones: [
        {
          event: 'Booking Confirmed',
          location: 'System',
          timestamp: new Date().toISOString(),
          completed: true
        },
        {
          event: 'Documentation Required',
          location: 'Customer Portal',
          timestamp: new Date().toISOString(),
          completed: false
        }
      ],
      documents: [
        {
          type: 'COMMERCIAL_INVOICE',
          status: 'PENDING'
        },
        {
          type: 'PACKING_LIST',
          status: 'PENDING'
        }
      ]
    };
  }

  // Helper methods
  private convertContainerType(type: string): string {
    const mapping: Record<string, string> = {
      '20ft': '20GP',
      '40ft': '40GP',
      '40ft-hc': '40HC'
    };
    return mapping[type] || type;
  }

  private extractPortCode(quoteId: string): string {
    // In real implementation, would fetch from stored quote
    return 'CNSHA'; // Shanghai
  }

  private extractDestinationCode(quoteId: string): string {
    // In real implementation, would fetch from stored quote
    return 'ZADUR'; // Durban
  }
}

export const bookingService = CarrierBookingService.getInstance();