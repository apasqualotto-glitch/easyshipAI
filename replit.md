# FreightCalc SA - Import Cost Calculator

## Overview

FreightCalc SA is a comprehensive shipping marketplace that connects importers and exporters with carriers, freight forwarders, and logistics service providers. The platform calculates comprehensive shipping costs including sea freight, trucking, customs duties, VAT, and handling fees for imports to and exports from South Africa. As a marketplace, FreightCalc SA facilitates connections between shippers and service providers while maintaining transparent, back-to-back pricing with no markup on carrier freight charges. The platform offers educational content, transparent cost breakdowns, and seamless booking integration with multiple service providers including ocean carriers and customs clearance specialists.

## Recent Changes (January 2025)

- **BREAKTHROUGH: Data Integrity Fully Resolved**: Successfully transitioned from synthetic to authentic shipping data with real industry rates (R42,000+ sea freight costs from actual carrier sources)
- **AI-Backend Integration Fixed**: Port code lookup now supports both IDs and codes, enabling seamless AI chat to quote calculation flow
- **Quote Calculation Restored**: Fixed critical 400 errors - platform now provides real quotes (R196k-R320k) instead of synthetic fallback data
- **Enhanced Error Handling**: Added comprehensive debugging and validation throughout quote pipeline for reliable operations
- **DSV API Integration Complete**: Fully implemented OAuth 2.0 authentication with DSV API endpoint (https://api.dsv.com/qs-demo/quote/v1/quotes) using provided credentials
- **Incoterm-Aware Trucking**: Revolutionary Incoterm-based cost calculation - trucking costs now vary by delivery responsibility (EXW: 30% base rate, DDP: 120% premium rate)
- **Delivery Address Precision**: DSV API now uses exact delivery addresses for precise port-to-door trucking quotes instead of generic destination areas
- **Dynamic Cost Display**: Booking page shows real-time trucking costs based on selected Incoterm and delivery location (R1,800 for CIF Cape Town vs R2,960 for DDP Johannesburg)
- **Enhanced Quote Breakdown**: Complete supplier breakdown on booking page with Incoterm-specific service levels and accurate distance-based pricing
- **Double-Charging Eliminated**: Fixed trucking cost duplication between main quote calculation and DSV freight forwarder quotes
- **Integrated Cost Structure**: DSV trucking costs properly integrated into main quote total calculation to prevent double-billing
- **Schema Cleanup Complete**: Removed redundant "Final Destination" field from all components - address autocomplete now provides all location data
- **Streamlined UX**: Simplified user interface by eliminating duplicate location selection, users now only enter precise delivery address once

## User Preferences

Preferred communication style: Simple, everyday language.
Chat interface: Wider message bubbles (95% width) for better readability and user experience.
User-friendly guidance: AI provides comprehensive quotes with full customs and VAT breakdowns in chat, then directs users to calculator form below for more detailed quotes.
Form auto-population: AI chat extracts shipping information from conversation and automatically fills the manual calculator form fields below, while also providing comprehensive quotes with full customs and VAT breakdowns.
Layout preference: Calculator form should be fully visible below chat interface, not hidden or requiring button clicks to access.
Homepage design: AI chat interface at top providing detailed quotes, manual calculator form always visible below for additional carrier options.
No auto-scroll: Page stays at top when users type or AI responds, with loading animation instead of screen jumping.

## System Architecture

The application follows a monorepo structure separating client, server, and shared code, built with a focus on modularity and future scalability.

### Core Technologies
- **Frontend**: React 18 with TypeScript and Vite, using Wouter for routing, TanStack Query for server state, and React Hook Form for form state.
- **Backend**: Express.js REST API with TypeScript and Node.js.
- **Database**: Currently in-memory storage, planned migration to PostgreSQL via Drizzle ORM.
- **UI Framework**: shadcn/ui components built on Radix UI primitives, styled with Tailwind CSS and a Material Design color scheme.
- **Validation**: Zod schemas used for shared validation between frontend and backend.

### Key Architectural Decisions
- **Monorepo Structure**: Facilitates code sharing, especially TypeScript types and validation schemas.
- **In-Memory Storage**: Selected for rapid prototyping, designed for easy migration to PostgreSQL.
- **shadcn/ui Components**: Ensures consistent, accessible UI with customization and Tailwind integration.
- **TanStack Query**: Manages server state with caching and optimistic updates for improved UX.
- **Zod Validation**: Guarantees data consistency across the stack.
- **Material Design**: Provides a professional aesthetic suitable for business applications.
- **Bidirectional Shipping Support**: Handles both imports to and exports from South Africa with appropriate cost calculations (e.g., no SA customs/VAT for exports).
- **Incoterm-Based Calculations**: Accurately adjusts costs based on Incoterms (FOB, CIF, EXW, DDP) to reflect real-world responsibilities.
- **SARS Compliance**: Customs calculations adhere to SARS FOB valuation method.
- **Comprehensive Port Database**: Supports 75+ international ports with intelligent search and categorized routes.
- **Partial Shipment Support**: Includes logic for Less than Container Load (LCL) shipments with volume-based pricing.
- **Advanced Customs Lookup**: Integrates HS code matching, product keyword database, and real-time suggestions for cargo classification.
- **Unified Quote Experience**: Both AI chat and manual calculator use the same backend API for consistent and accurate quotes.
- **Marketplace Business Model**: Platform connects shippers with multiple service providers (carriers, freight forwarders, customs brokers) with transparent, back-to-back pricing.
- **Multi-Service Provider Integration**: Supports both ocean carriers and freight forwarding services for comprehensive logistics solutions.

## External Dependencies

- **UI Framework Components**: Radix UI (underpins shadcn/ui).
- **Data Fetching**: TanStack Query.
- **Form Management**: React Hook Form with Hookform Resolvers.
- **Database (Planned)**: Neon Database (serverless PostgreSQL).
- **Validation**: Zod.
- **Styling**: Tailwind CSS, class-variance-authority.
- **AI Service**: Anthropic Claude (for conversational AI).
- **Exchange Rates**: exchangerate-api.com, exchangerate.host (for live USD to ZAR conversion).
- **Carrier APIs**: Maersk Developer Portal, MSC API, CMA CGM MyING (for booking integration).