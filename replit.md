# FreightCalc SA - Import Cost Calculator

## Overview

FreightCalc SA is a full-stack web application designed to calculate comprehensive shipping costs for imports to and exports from South Africa. It provides door-to-door cost estimates including sea freight, trucking, customs duties, VAT, and handling fees. The application's vision is to be a comprehensive "EasyShip AI" solution for South African container imports, simplifying the shipping process for first-time importers. It aims to offer transparent cost breakdowns, educational content, and seamless integration with carrier booking systems.

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