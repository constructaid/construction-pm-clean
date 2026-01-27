/**
 * Company Branding Schema
 * Stores custom branding settings for each company
 */
import { pgTable, serial, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { companies } from './schema';

export const companyBranding = pgTable('company_branding', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id).notNull(),

  // Logo URLs
  logoUrl: varchar('logo_url', { length: 500 }),
  logoLightUrl: varchar('logo_light_url', { length: 500 }),  // Optional light theme variant
  logoDarkUrl: varchar('logo_dark_url', { length: 500 }),    // Optional dark theme variant
  faviconUrl: varchar('favicon_url', { length: 500 }),

  // Primary brand colors (hex format: #RRGGBB)
  primaryColor: varchar('primary_color', { length: 7 }).default('#FF6600'),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#3D9991'),
  accentColor: varchar('accent_color', { length: 7 }).default('#4BAAD8'),

  // Custom theme overrides (optional - advanced users)
  backgroundLight: varchar('background_light', { length: 7 }),
  backgroundDark: varchar('background_dark', { length: 7 }),
  textPrimaryLight: varchar('text_primary_light', { length: 7 }),
  textPrimaryDark: varchar('text_primary_dark', { length: 7 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type CompanyBranding = typeof companyBranding.$inferSelect;
export type NewCompanyBranding = typeof companyBranding.$inferInsert;
