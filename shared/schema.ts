import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ports = pgTable("ports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  country: text("country").notNull(),
  type: text("type").notNull(), // 'origin' or 'destination'
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
});

export const cargoTypes = pgTable("cargo_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  dutyRate: real("duty_rate").notNull(), // percentage
  additionalFees: real("additional_fees").notNull(),
});

export const shippingQuotes = pgTable("shipping_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originPort: text("origin_port").notNull(),
  destinationPort: text("destination_port").notNull(),
  finalDestination: text("final_destination").notNull(),
  containerType: text("container_type").notNull(),
  cargoType: text("cargo_type").notNull(),
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

export const quoteRequestSchema = z.object({
  originPort: z.string().min(1, "Origin port is required"),
  destinationPort: z.string().min(1, "Destination port is required"),
  finalDestination: z.string().min(1, "Final destination is required"),
  containerType: z.enum(["20ft", "40ft", "40ft-hc"], {
    required_error: "Container type is required",
  }),
  cargoType: z.string().min(1, "Cargo type is required"),
  weight: z.number().min(1, "Weight must be greater than 0"),
  value: z.number().min(1, "Cargo value must be greater than 0"),
});

export type InsertShippingQuote = z.infer<typeof insertShippingQuoteSchema>;
export type ShippingQuote = typeof shippingQuotes.$inferSelect;
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type Port = typeof ports.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type Destination = typeof destinations.$inferSelect;
export type CargoType = typeof cargoTypes.$inferSelect;
