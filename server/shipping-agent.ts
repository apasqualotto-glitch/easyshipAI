/**
 * Enhanced Shipping AI Agent for EasyShip AI
 * Provides intelligent guidance through three specialized modes:
 * 1. Guide Mode: Step-by-step shipping process walkthrough
 * 2. Analyzer Mode: Shipment needs analysis and recommendations
 * 3. Document Mode: Required documentation preparation
 */

import Anthropic from '@anthropic-ai/sdk';
import { storage } from './storage';

interface ShippingDetails {
  origin?: string;
  destination?: string;
  containerType?: string;
  cargoType?: string;
  hsCode?: string;
  value?: number;
  weight?: number;
  urgency?: 'standard' | 'fast' | 'flexible';
}

interface DocumentRequirement {
  name: string;
  required: boolean;
  description: string;
  whereToGet: string;
  estimatedCost?: number;
}

interface AgentResponse {
  mode: 'guide' | 'analyzer' | 'documentor';
  message: string;
  data?: any;
  nextStep?: string;
  actionItems?: string[];
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

/**
 * MODE 1: GUIDE MODE
 * Walks user through the entire shipping process step-by-step
 */
async function generateGuideResponse(
  userMessage: string,
  shippingDetails: ShippingDetails,
  conversationTurns: number = 0
): Promise<AgentResponse> {
  const guidePrompt = `You are EasyShip's Shipping Guide - helping a first-time shipper understand and complete their shipping journey.

CURRENT STAGE: ${determineGuideStage(shippingDetails, conversationTurns)}

USER DETAILS COLLECTED SO FAR:
- Origin: ${shippingDetails.origin || 'Not yet provided'}
- Destination: ${shippingDetails.destination || 'Not yet provided'}
- Container Type: ${shippingDetails.containerType || 'Not yet determined'}
- Cargo Type: ${shippingDetails.cargoType || 'Not yet specified'}
- Approximate Value: ${shippingDetails.value ? `R${shippingDetails.value}` : 'Not provided'}

YOUR ROLE:
1. Ask ONE clear question at a time to gather missing information
2. Explain why you need each piece of information in simple terms
3. Once you have origin + destination + container type, suggest next steps
4. Guide them toward using the calculator or booking

TONE: Friendly, patient, encouraging - remember they're first-time shippers!

Current user message: "${userMessage}"

Provide your guidance now. End with a CLEAR NEXT STEP.`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 800,
    system: guidePrompt,
    messages: [{ role: 'user', content: userMessage }]
  });

  const guideText = response.content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('');

  return {
    mode: 'guide',
    message: guideText,
    nextStep: extractNextStep(guideText)
  };
}

/**
 * MODE 2: ANALYZER MODE
 * Analyzes shipping needs and recommends optimal routes, Incoterms, and carriers
 */
async function generateAnalyzerResponse(
  shippingDetails: ShippingDetails
): Promise<AgentResponse> {
  // First, validate we have enough information
  if (!shippingDetails.origin || !shippingDetails.destination || !shippingDetails.containerType) {
    return {
      mode: 'analyzer',
      message: "I need more information to analyze your shipment. Please provide: origin country, South African delivery city, and container type (20ft/40ft).",
      actionItems: ['Provide origin location', 'Specify destination in SA', 'Choose container size']
    };
  }

  const analyzerPrompt = `You are EasyShip's Shipping Analyzer - an expert in optimizing shipments for first-time shippers.

SHIPMENT DETAILS:
- From: ${shippingDetails.origin}
- To: ${shippingDetails.destination}, South Africa
- Container: ${shippingDetails.containerType}
- Cargo Type: ${shippingDetails.cargoType || 'General cargo'}
- Value: ${shippingDetails.value ? `R${shippingDetails.value}` : 'Not specified'}
- Weight: ${shippingDetails.weight ? `${shippingDetails.weight}kg` : 'Not specified'}
- Urgency: ${shippingDetails.urgency || 'Standard'}

ANALYZE AND RECOMMEND:

1. INCOTERM ANALYSIS:
   - Assess which Incoterm (FOB, CIF, DDP, EXW, CIF) is best for this shipment
   - Explain cost implications for each
   - Recommend the best one and WHY
   - Show estimated cost difference between options

2. CARRIER RECOMMENDATIONS:
   - Suggest fastest route vs. most economical
   - Estimate transit times
   - Highlight any special requirements (refrigeration, hazmat clearance, etc.)

3. COST OPTIMIZATION:
   - Identify any potential savings (consolidation, timing, Incoterm choice)
   - Warn about unexpected costs (customs, special handling)
   - Show rough cost estimates for recommended option

4. RISK ASSESSMENT:
   - Any restrictions on cargo type from this origin?
   - Special documentation needed?
   - Seasonal factors (peak shipping season surcharges)?

Format your response as conversational advice, not a table. Be specific about numbers and percentages.`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1200,
    system: analyzerPrompt,
    messages: [{ role: 'user', content: 'Analyze my shipment and provide recommendations' }]
  });

  const analyzerText = response.content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('');

  return {
    mode: 'analyzer',
    message: analyzerText,
    actionItems: [
      'Review recommended Incoterm selection',
      'Check carrier options in calculator',
      'Compare quoted prices with recommendations'
    ]
  };
}

/**
 * MODE 3: DOCUMENTOR MODE
 * Provides exact documentation requirements based on cargo type, origin, destination
 */
async function generateDocumentorResponse(
  shippingDetails: ShippingDetails
): Promise<AgentResponse> {
  if (!shippingDetails.containerType) {
    return {
      mode: 'documentor',
      message: "I need to know what you're shipping to provide the exact documentation requirements. Please specify your container type and cargo type."
    };
  }

  const documentorPrompt = `You are EasyShip's Documentation Specialist. You provide EXACT, actionable documentation checklists.

SHIPMENT CONTEXT:
- From: ${shippingDetails.origin || 'Various countries'}
- To: South Africa
- Cargo Type: ${shippingDetails.cargoType || 'General cargo'}
- Container: ${shippingDetails.containerType}
- HS Code: ${shippingDetails.hsCode || 'Not specified'}

PROVIDE A DOCUMENTATION CHECKLIST including:

FORMAT: For each document, provide:
- Document name
- Who provides it (shipper, carrier, customs agent, government)
- Why it's needed (import clearance, carrier requirement, customs declaration, etc.)
- Estimated cost to obtain (R0 for free, estimated for paid services)
- Where to get it
- Timeline (how quickly can you get it)

DOCUMENTS TO COVER:
1. EXPORT DOCUMENTS (from origin):
   - Shipper/commercial invoice
   - Packing list
   - Export permits (if restricted)
   - Certificate of origin (if applicable)
   - Manufacturer's certification
   - Phytosanitary/health certificates (if food/agricultural)

2. TRANSPORT DOCUMENTS:
   - Bill of lading (sea freight)
   - Negotiable/non-negotiable choice (explain difference)
   - Airway bill alternative
   - Insurance documents (if buyer pays for insurance)

3. CUSTOMS DOCUMENTS (FOR SA IMPORT):
   - Customs declaration form (IEC number needed)
   - HS code documentation
   - Import permit (if restricted goods)
   - SARS compliance
   - Duty/tax calculation proof

4. CARRIER & PORT DOCUMENTS:
   - Port handling documentation
   - Container deposit receipt
   - Demurrage charges explanation

5. SPECIAL CASES:
   - If goods are used/second-hand: Valuation certificate
   - If high value: Insurance certificates
   - If restricted: Compliance certificates, safety approvals, ICASA approvals

Be specific about South African requirements and costs. End with: "Total estimated documentation cost: R[amount] to R[amount]"`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1500,
    system: documentorPrompt,
    messages: [{ role: 'user', content: 'What documents do I need for this shipment?' }]
  });

  const documentorText = response.content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('');

  return {
    mode: 'documentor',
    message: documentorText,
    actionItems: [
      'Gather all required documents',
      'Estimate total documentation costs',
      'Start procurement process early'
    ]
  };
}

/**
 * UNIFIED AGENT INTERFACE
 * Routes user input to appropriate agent mode
 */
export async function generateAgentResponse(
  userMessage: string,
  mode: 'guide' | 'analyzer' | 'documentor' | 'auto',
  shippingDetails: Partial<ShippingDetails> = {},
  conversationTurns: number = 0
): Promise<AgentResponse> {
  try {
    // If mode is 'auto', detect the best mode from user intent
    let selectedMode = mode;
    if (mode === 'auto') {
      selectedMode = detectAgentMode(userMessage);
    }

    const details: ShippingDetails = {
      origin: shippingDetails.origin,
      destination: shippingDetails.destination,
      containerType: shippingDetails.containerType,
      cargoType: shippingDetails.cargoType,
      hsCode: shippingDetails.hsCode,
      value: shippingDetails.value,
      weight: shippingDetails.weight,
      urgency: shippingDetails.urgency || 'standard'
    };

    switch (selectedMode) {
      case 'guide':
        return await generateGuideResponse(userMessage, details, conversationTurns);
      case 'analyzer':
        return await generateAnalyzerResponse(details);
      case 'documentor':
        return await generateDocumentorResponse(details);
      default:
        return await generateGuideResponse(userMessage, details, conversationTurns);
    }
  } catch (error) {
    console.error('Agent error:', error);
    return {
      mode: 'guide',
      message: "I encountered an issue processing your request. Please try again or contact support."
    };
  }
}

/**
 * Helper: Detect which agent mode is most appropriate
 */
function detectAgentMode(message: string): 'guide' | 'analyzer' | 'documentor' {
  const lowerMessage = message.toLowerCase();

  // Documentor: Asking about documents/requirements
  if (lowerMessage.match(/\b(document|need|require|what.*required|import.*doc|customs.*form|bill of lading|invoice|permit)\b/)) {
    return 'documentor';
  }

  // Analyzer: Asking for recommendations/analysis
  if (lowerMessage.match(/\b(recommend|suggest|best|optimize|cheaper|faster|compare|which|should.*choose)\b/)) {
    return 'analyzer';
  }

  // Guide: Asking for help/walkthrough
  if (lowerMessage.match(/\b(help|how|guide|explain|process|step|first time|don.t know)\b/)) {
    return 'guide';
  }

  // Default to guide for general questions
  return 'guide';
}

/**
 * Helper: Determine which stage of shipping process user is at
 */
function determineGuideStage(details: ShippingDetails, turns: number): string {
  if (!details.origin) return 'Stage 1: Identifying Origin Location';
  if (!details.destination) return 'Stage 2: Specifying Destination in SA';
  if (!details.containerType) return 'Stage 3: Choosing Container Type';
  if (!details.cargoType) return 'Stage 4: Describing Cargo';
  if (!details.hsCode) return 'Stage 5: HS Code Classification';
  if (!details.value) return 'Stage 6: Valuation & Costs';
  return 'Stage 7: Finalizing & Next Steps (Calculator or Booking)';
}

/**
 * Helper: Extract next step from agent response
 */
function extractNextStep(response: string): string {
  // Look for common next step patterns in the response
  const patterns = [
    /next.*?:?\s*([^.\n]+)/i,
    /then.*?:?\s*([^.\n]+)/i,
    /should.*?:?\s*([^.\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return 'Continue with the next question';
}
