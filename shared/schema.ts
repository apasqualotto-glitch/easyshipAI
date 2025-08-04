import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  real, 
  timestamp, 
  boolean, 
  jsonb,
  index,
  serial
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ports = pgTable("ports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  country: text("country").notNull(),
  type: text("type").notNull(), // 'origin', 'destination', or 'both'
});

export const routes = pgTable("routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originPortId: varchar("origin_port_id").notNull(),
  destinationPortId: varchar("destination_port_id").notNull(),
  seaFreightCost20ft: real("sea_freight_cost_20ft").notNull(),
  seaFreightCost40ft: real("sea_freight_cost_40ft").notNull(),
  seaFreightCost40ftHC: real("sea_freight_cost_40ft_hc").notNull(),
  transitDays: integer("transit_days").notNull(),
});

export const destinations = pgTable("destinations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  province: text("province").notNull(),
  fromDurban: real("trucking_cost_from_durban").notNull(),
  fromCapeTown: real("trucking_cost_from_cape_town").notNull(),
  fromPortElizabeth: real("trucking_cost_from_port_elizabeth").notNull(),
  fromRichardsBay: real("trucking_cost_from_richards_bay").notNull(),
  fromEastLondon: real("trucking_cost_from_east_london").notNull(),
  fromMosselBay: real("trucking_cost_from_mossel_bay").notNull(),
  fromSaldanhaBay: real("trucking_cost_from_saldanha_bay").notNull(),
});

export const cargoTypes = pgTable("cargo_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  dutyRate: real("duty_rate").notNull(), // percentage
  additionalFees: real("additional_fees").notNull(),
});

export const incoterms = pgTable("incoterms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sellerResponsibilities: text("seller_responsibilities").array().notNull(),
  buyerResponsibilities: text("buyer_responsibilities").array().notNull(),
  riskTransferPoint: text("risk_transfer_point").notNull(),
  applicableTransport: text("applicable_transport").array().notNull(), // sea, air, land, any
});

export const shippingQuotes = pgTable("shipping_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originPort: text("origin_port").notNull(),
  destinationPort: text("destination_port").notNull(),
  finalDestination: text("final_destination").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  containerType: text("container_type").notNull(),
  cargoType: text("cargo_type").notNull(),
  incoterm: text("incoterm").notNull(),
  weight: integer("weight").notNull(),
  value: real("value").notNull(),
  seaFreightCost: real("sea_freight_cost").notNull(),
  truckingCost: real("trucking_cost").notNull(),
  customsDuties: real("customs_duties").notNull(),
  vat: real("vat").notNull(),
  handlingFees: real("handling_fees").notNull(),
  totalCost: real("total_cost").notNull(),
  createdAt: varchar("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertShippingQuoteSchema = createInsertSchema(shippingQuotes).omit({
  id: true,
  createdAt: true,
});

export const customsTariffSchema = z.object({
  hsCode: z.string(),
  dutyRate: z.number(),
  vatRate: z.number().optional(),
  additionalFees: z.number().optional(),
  explanation: z.string(),
});

export const quoteRequestSchema = z.object({
  originPort: z.string().min(1, "Origin port is required"),
  destinationPort: z.string().min(1, "Destination port is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  containerType: z.enum(["20ft", "40ft", "40ft-hc", "partial"], {
    required_error: "Container type is required",
  }),
  cargoType: z.string().min(1, "Cargo type is required"),
  incoterm: z.string().min(1, "Incoterm is required"),
  weight: z.number().min(1, "Weight must be greater than 0"),
  value: z.number().min(1, "Cargo value must be greater than 0"),
  customsTariff: customsTariffSchema.optional(),
  selectedCustomsTariff: customsTariffSchema.optional(), // Add this for consistency
  // Partial shipment specific fields
  cargoVolume: z.number().min(0.1, "Cargo volume must be at least 0.1 CBM").optional(),
  packageCount: z.number().min(1, "Package count must be at least 1").optional(),
  packageLength: z.number().min(0.01, "Package length must be greater than 0").optional(),
  packageWidth: z.number().min(0.01, "Package width must be greater than 0").optional(),
  packageHeight: z.number().min(0.01, "Package height must be greater than 0").optional(),
  specialHandling: z.string().optional(),
});

export type InsertShippingQuote = z.infer<typeof insertShippingQuoteSchema>;
export type ShippingQuote = typeof shippingQuotes.$inferSelect;
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type Port = typeof ports.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type Destination = typeof destinations.$inferSelect;
export type CargoType = typeof cargoTypes.$inferSelect;
export type Incoterm = typeof incoterms.$inferSelect;

// Session storage table for user authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User accounts and profiles
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  company: varchar("company"),
  phone: varchar("phone"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Chat conversations and history
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // nullable for anonymous users
  title: varchar("title").notNull().default("New Conversation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // for storing additional context
  createdAt: timestamp("created_at").defaultNow(),
});

// Shipping bookings and orders
export const shipmentBookings = pgTable("shipment_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // nullable for guest bookings
  quoteId: varchar("quote_id").notNull(), // links to shipping_quotes
  bookingReference: varchar("booking_reference").unique().notNull(),
  carrierCode: varchar("carrier_code").notNull(),
  carrierName: varchar("carrier_name").notNull(),
  serviceType: varchar("service_type"),
  
  // Shipping details
  originPort: varchar("origin_port").notNull(),
  destinationPort: varchar("destination_port").notNull(),
  finalDestination: varchar("final_destination").notNull(),
  containerType: varchar("container_type").notNull(),
  
  // Customer information
  shipperName: varchar("shipper_name").notNull(),
  shipperEmail: varchar("shipper_email").notNull(),
  shipperPhone: varchar("shipper_phone"),
  shipperAddress: text("shipper_address"),
  
  consigneeName: varchar("consignee_name").notNull(),
  consigneeEmail: varchar("consignee_email"),
  consigneePhone: varchar("consignee_phone"),
  consigneeAddress: text("consignee_address").notNull(),
  
  // Cargo details
  cargoDescription: text("cargo_description").notNull(),
  cargoWeight: real("cargo_weight").notNull(),
  cargoValue: real("cargo_value").notNull(),
  
  // Booking status and tracking
  status: varchar("status").notNull().default("pending"), // pending, confirmed, in_transit, delivered, cancelled
  trackingNumber: varchar("tracking_number"),
  estimatedDeparture: timestamp("estimated_departure"),
  estimatedArrival: timestamp("estimated_arrival"),
  actualDeparture: timestamp("actual_departure"),
  actualArrival: timestamp("actual_arrival"),
  
  // Costs
  quotedAmount: real("quoted_amount").notNull(),
  finalAmount: real("final_amount"),
  
  // Special instructions
  specialInstructions: text("special_instructions"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipment tracking events and milestones
export const trackingEvents = pgTable("tracking_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  eventType: varchar("event_type").notNull(), // booked, departed, in_transit, arrived, customs, delivered
  location: varchar("location"),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  isEstimated: boolean("is_estimated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document attachments for bookings
export const bookingDocuments = pgTable("booking_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  documentType: varchar("document_type").notNull(), // commercial_invoice, bill_of_lading, packing_list, etc.
  documentName: varchar("document_name").notNull(),
  fileUrl: varchar("file_url"),
  fileSize: integer("file_size"),
  uploadedBy: varchar("uploaded_by"),
  isRequired: boolean("is_required").default(false),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User notifications and alerts
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // booking_confirmation, status_update, payment_due, etc.
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  relatedBookingId: varchar("related_booking_id"),
  isRead: boolean("is_read").default(false),
  isSent: boolean("is_sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customs and compliance guides
export const customsGuides = pgTable("customs_guides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  country: varchar("country").notNull(),
  category: varchar("category").notNull(), // documentation, procedures, restrictions
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  difficulty: varchar("difficulty").default("beginner"), // beginner, intermediate, advanced
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// FAQ and knowledge base
export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category").notNull(), // shipping, incoterms, customs, pricing
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  tags: text("tags").array(),
  popularity: integer("popularity").default(0),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas for new tables
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertShipmentBookingSchema = createInsertSchema(shipmentBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrackingEventSchema = createInsertSchema(trackingEvents).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Export types for new tables
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ShipmentBooking = typeof shipmentBookings.$inferSelect;
export type InsertShipmentBooking = z.infer<typeof insertShipmentBookingSchema>;

export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;

export type BookingDocument = typeof bookingDocuments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type CustomsGuide = typeof customsGuides.$inferSelect;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;

// Enhanced booking request schema
export const bookingRequestSchema = z.object({
  quoteId: z.string().min(1, "Quote ID is required"),
  carrierCode: z.string().min(1, "Carrier selection is required"),
  
  // Shipper information
  shipperName: z.string().min(1, "Shipper name is required"),
  shipperEmail: z.string().email("Valid email is required"),
  shipperPhone: z.string().optional(),
  shipperAddress: z.string().optional(),
  
  // Consignee information
  consigneeName: z.string().min(1, "Consignee name is required"),
  consigneeEmail: z.string().email().optional(),
  consigneePhone: z.string().optional(),
  consigneeAddress: z.string().min(1, "Delivery address is required"),
  
  // Cargo details
  cargoDescription: z.string().min(1, "Cargo description is required"),
  
  // Special requirements
  specialInstructions: z.string().optional(),
  preferredDeparture: z.string().optional(),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
