/**
 * Company Branding Service
 * Handles logo upload, color extraction, and branding management
 */

export interface BrandingData {
  logoUrl: string;
  logoDarkUrl?: string;
  logoLightUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

/**
 * Get company branding settings
 */
export async function getCompanyBranding(companyId: number): Promise<BrandingData | null> {
  try {
    const response = await fetch(`/api/branding/${companyId}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching branding:', error);
    return null;
  }
}

/**
 * Extract dominant colors from an image URL
 * This is a placeholder - in production, use a library like 'extract-colors' or 'colorthief'
 */
export async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  // TODO: Implement actual color extraction
  // For now, return default colors
  //
  // In production, use:
  // import { extractColors } from 'extract-colors';
  // const colors = await extractColors(imageUrl);
  // return colors.map(c => c.hex);

  return ['#FF6600', '#3D9991', '#4BAAD8'];
}

/**
 * Adjust color brightness
 * Useful for generating hover states and variations
 */
export function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  const adjust = (value: number) => {
    const adjusted = value + (value * percent / 100);
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Generate complementary color
 */
export function getComplementaryColor(hex: string): string {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Simple complementary (opposite on color wheel)
  const newR = 255 - r;
  const newG = 255 - g;
  const newB = 255 - b;

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Check if a color is light or dark (for text contrast)
 */
export function isLightColor(hex: string): boolean {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5;
}

/**
 * Get text color (black or white) based on background
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
}

/**
 * Validate hex color format
 */
export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

/**
 * Generate CSS variables from branding data
 */
export function generateBrandingCSS(branding: BrandingData): string {
  const primaryHover = adjustColorBrightness(branding.primaryColor, -10);
  const primaryLight = adjustColorBrightness(branding.primaryColor, 20);

  return `
    :root {
      /* Brand colors */
      --color-primary: ${branding.primaryColor};
      --color-primary-hover: ${primaryHover};
      --color-primary-light: ${primaryLight};
      --color-secondary: ${branding.secondaryColor};
      --color-accent: ${branding.accentColor};
    }
  `;
}
