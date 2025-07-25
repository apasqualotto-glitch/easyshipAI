# FreightCalc SA - Import Cost Calculator

## Overview

FreightCalc SA is a full-stack web application that calculates comprehensive shipping costs for imports to South Africa. The application provides door-to-door cost estimates including sea freight, trucking, customs duties, VAT, and handling fees. It features a modern React frontend with shadcn/ui components and an Express.js backend with in-memory data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with a clear separation between client, server, and shared code:

- **Frontend**: React SPA with TypeScript and Vite
- **Backend**: Express.js REST API with TypeScript
- **Database**: Currently using in-memory storage with plans for PostgreSQL integration via Drizzle ORM
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with Material Design color scheme

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for monorepo setup
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state, React Hook Form for form state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Material Design color variables

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API**: RESTful endpoints for quotes, ports, destinations, and cargo types
- **Storage**: In-memory storage implementation with interface for future database integration
- **Validation**: Zod schemas shared between frontend and backend

### Database Schema (Prepared for PostgreSQL)
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Tables**: ports, routes, destinations, cargo_types, shipping_quotes
- **Validation**: Drizzle-Zod integration for type-safe schema validation

## Data Flow

1. **User Input**: Multi-step form collects shipping requirements (origin, destination, cargo details)
2. **Validation**: Client-side validation using react-hook-form and Zod schemas
3. **API Request**: Form data sent to `/api/calculate-quote` endpoint
4. **Calculation**: Server calculates costs using stored rates and rules
5. **Response**: Detailed cost breakdown returned and displayed in real-time

### Cost Calculation Logic
- Sea freight costs based on origin-destination routes and container types
- Trucking costs from SA ports to final destinations
- Customs duties calculated by cargo type and value
- VAT applied to total dutiable amount
- Additional handling fees included in final quote

## External Dependencies

### Production Dependencies
- **UI Framework**: Radix UI components for accessibility and behavior
- **Data Fetching**: TanStack Query for server state management
- **Forms**: React Hook Form with Hookform Resolvers for validation
- **Database**: Neon Database serverless PostgreSQL (configured but not yet implemented)
- **Validation**: Zod for runtime type validation
- **Styling**: Tailwind CSS with class-variance-authority for component variants

### Development Dependencies
- **Build Tools**: Vite, esbuild for production builds
- **TypeScript**: Full type coverage across frontend and backend
- **Development**: tsx for TypeScript execution, Replit-specific development tools

## Deployment Strategy

### Development
- **Dev Server**: Vite dev server with HMR for frontend, tsx for backend hot reload
- **Environment**: Development mode with Replit integration and error overlays
- **File Structure**: Monorepo with shared TypeScript configuration

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Assets**: Static files served from built frontend directory
- **Database**: Configured for PostgreSQL with environment variable for connection

### Key Architectural Decisions

1. **Monorepo Structure**: Enables code sharing between frontend and backend, particularly for TypeScript types and validation schemas

2. **In-Memory Storage**: Chosen for rapid prototyping with clear interface for future PostgreSQL migration via Drizzle ORM

3. **shadcn/ui Components**: Provides consistent, accessible UI components with full customization control and Tailwind integration

4. **TanStack Query**: Manages server state with caching, background updates, and optimistic updates for better UX

5. **Zod Validation**: Shared validation schemas ensure data consistency between frontend and backend

6. **Material Design**: Custom color scheme provides professional appearance suitable for business shipping calculations

The application is designed for easy migration from in-memory storage to PostgreSQL database, with all database operations abstracted behind a storage interface.

## Recent Changes

- **Carrier Booking API Integration System** - July 25, 2025
  - Implemented comprehensive booking service supporting Maersk, MSC, and CMA CGM APIs
  - Added DCSA (Digital Container Shipping Association) standards compliance for industry standardization
  - Created complete booking workflow: quote → carrier selection → booking form → status tracking
  - Integrated with major carrier APIs (Maersk Developer Portal, MSC API, CMA CGM MyING)
  - Real-time booking status updates with milestone tracking and document management
  - Direct API connections to carrier booking systems with proper authentication and error handling
  - Enhanced freight calculator with "Book This Shipment" functionality for seamless user experience

- **CRITICAL FIX: SARS Compliance - FOB Valuation Method** - July 25, 2025
  - Discovered and corrected major compliance issue: SARS uses FOB (Free on Board) valuation method, NOT CIF
  - Updated all customs calculations to use FOB basis per WTO Customs Valuation Agreement
  - FOB excludes international shipping and insurance costs from customs value calculation
  - Enhanced cost breakdown to clearly show FOB values and proper SARS methodology
  - System now fully compliant with official SARS customs valuation rules

- **Live USD to ZAR Currency Conversion System** - July 25, 2025
  - Implemented real-time exchange rate fetching from multiple API sources (exchangerate-api.com, exchangerate.host)
  - Added automatic USD to ZAR conversion for all SARS customs calculations
  - Enhanced cost breakdown to show both USD cargo value and ZAR converted amounts
  - Live exchange rate displayed with source and timestamp information
  - Fallback protection ensures system works even if exchange APIs are unavailable

- **CRITICAL FIX: Resolved 400 "Route not available" errors** - July 25, 2025
  - Fixed route lookup system that was causing quote calculation failures
  - Added comprehensive route coverage for ALL origin ports to ALL SA destination ports
  - Enhanced route lookup to handle both port IDs and port codes for backwards compatibility
  - System now properly calculates quotes for Shanghai→Durban, Hamburg→Cape Town, etc.

- **Data Consistency & Validation System** - July 25, 2025
  - Implemented comprehensive data validation before quote calculations
  - Added container weight limit enforcement (20ft: 28,080kg, 40ft: 26,680kg)
  - Created real-time cargo value per kg validation with warnings
  - Enhanced live shipping API to consistently pass weight and cargo details
  - All APIs now receive synchronized cargo information (weight, value, dimensions)

- **Trade Agreement Integration** - July 25, 2025
  - Integrated country-specific customs duty calculations based on origin port
  - Added major trade agreements: SACU (0% duty), AGOA (USA preferences), EPA (EU benefits)
  - Quote results now show which trade agreement applies and actual duty rate used
  - Enhanced customs calculations with preferential rates for qualifying countries

- Successfully integrated advanced customs lookup with main calculator form cargo type selection
- Enhanced customs search system with intelligent HS code matching and comprehensive product keyword database
- Implemented search scoring, real-time suggestions, and user guidance for complex HS code classification
- Massively expanded product coverage to accommodate "everything" people import:
  - Agricultural products, food products, textiles & clothing, electronics
  - Medical equipment, industrial machinery, cosmetics, building materials
  - Toys, sports equipment, musical instruments, jewelry, art, books
  - Kitchen items, garden tools, photography equipment, baby products
- Added real-time search suggestions as users type
- Created helpful "no results found" guidance with popular search examples
- System now handles diverse search terms from common names to technical descriptions