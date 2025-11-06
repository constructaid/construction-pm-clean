/**
 * Application Branding Configuration
 * Centralized configuration for app name, tagline, and default branding
 * Can be overridden per entity for multi-tenant deployments
 */

export const APP_CONFIG = {
  // Application Identity
  name: 'ConstructHub',
  tagline: 'Construction Project Management Platform',
  description: 'Modern construction project management for general contractors, owners, architects, and subcontractors',

  // URLs & Contact
  website: 'https://constructhub.app',
  supportEmail: 'support@constructhub.app',

  // Default Branding
  logo: {
    main: '/constructhub-logo.png',
    light: '/constructhub-logo-light.png', // For dark backgrounds
    dark: '/constructhub-logo-dark.png', // For light backgrounds
    favicon: '/favicon.ico',
  },

  // Default Colors (Orange theme - customizable per entity)
  colors: {
    primary: '#FF6600',     // ca-orange
    primaryDark: '#E55A00', // ca-orange-dark
    secondary: '#1E40AF',   // Blue
    accent: '#10B981',      // Green
    danger: '#EF4444',      // Red
    warning: '#F59E0B',     // Amber
    success: '#10B981',     // Green
  },

  // Features (can be enabled/disabled per entity)
  features: {
    aiWorkspace: true,
    xrpPayments: true,
    bidding: true,
    estimating: true,
    safety: true,
    field: true,
    closeout: true,
    emailIntegration: true,
    documentParsing: true,
  },

  // Social Media (app-level)
  social: {
    twitter: 'https://twitter.com/constructhub',
    linkedin: 'https://linkedin.com/company/constructhub',
    github: 'https://github.com/constructhub',
  },
};

/**
 * Get branding for a specific entity
 * Falls back to app defaults if entity branding not available
 */
export function getEntityBranding(entityId?: number) {
  // TODO: Fetch from database when entityId is provided
  // For now, return app defaults
  return {
    name: APP_CONFIG.name,
    tagline: APP_CONFIG.tagline,
    logo: APP_CONFIG.logo.main,
    logoLight: APP_CONFIG.logo.light,
    logoDark: APP_CONFIG.logo.dark,
    primaryColor: APP_CONFIG.colors.primary,
    secondaryColor: APP_CONFIG.colors.secondary,
  };
}

/**
 * Get page title with app branding
 */
export function getPageTitle(pageTitle?: string): string {
  if (pageTitle) {
    return `${pageTitle} - ${APP_CONFIG.name}`;
  }
  return `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`;
}

/**
 * Get meta description
 */
export function getMetaDescription(customDescription?: string): string {
  return customDescription || APP_CONFIG.description;
}
