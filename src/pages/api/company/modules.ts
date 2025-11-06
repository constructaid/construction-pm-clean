/**
 * Company Modules API
 * Manage add-on module subscriptions
 * GET /api/company/modules - Get available and enabled modules
 * POST /api/company/modules/enable - Enable a module
 * POST /api/company/modules/disable - Disable a module
 */
import type { APIRoute } from 'astro';

export const prerender = false;

// Mock available modules catalog
const availableModules = [
  {
    id: 1,
    moduleName: 'hr',
    displayName: 'Human Resources',
    description: 'Complete HR management with employee directory, PTO tracking, certifications, performance reviews, and compliance monitoring.',
    category: 'add_on',
    monthlyPrice: 49.00,
    annualPrice: 470.00, // ~20% discount
    trialDays: 14,
    features: [
      'Employee directory & profiles',
      'PTO tracking & approvals',
      'Certification management',
      'Performance reviews',
      'Training records',
      'Compliance tracking',
      'Time & attendance',
    ],
    requiredTier: 'basic',
    isActive: true,
    isBeta: false,
    icon: '👥',
    color: '#9333EA',
  },
  {
    id: 2,
    moduleName: 'ai_assistant',
    displayName: 'AI Assistant',
    description: 'Intelligent AI-powered assistant for document analysis, RFI generation, submittal review, and natural language project queries.',
    category: 'premium',
    monthlyPrice: 99.00,
    annualPrice: 950.00,
    trialDays: 7,
    features: [
      'Document analysis & parsing',
      'AI-powered RFI generation',
      'Submittal review assistance',
      'Natural language queries',
      'Smart recommendations',
      'Automated data extraction',
      'Knowledge base search',
    ],
    requiredTier: 'professional',
    isActive: true,
    isBeta: true,
    icon: '🤖',
    color: '#06B6D4',
  },
  {
    id: 3,
    moduleName: 'advanced_reporting',
    displayName: 'Advanced Reporting',
    description: 'Custom reports, data exports, and business intelligence dashboards with real-time analytics.',
    category: 'add_on',
    monthlyPrice: 29.00,
    annualPrice: 280.00,
    trialDays: 14,
    features: [
      'Custom report builder',
      'Excel/PDF exports',
      'Scheduled reports',
      'Executive dashboards',
      'Trend analysis',
      'Cost tracking',
      'Labor analytics',
    ],
    requiredTier: 'basic',
    isActive: true,
    isBeta: false,
    icon: '📊',
    color: '#10B981',
  },
  {
    id: 4,
    moduleName: 'equipment_management',
    displayName: 'Equipment Management',
    description: 'Track company equipment, maintenance schedules, rental coordination, and utilization rates.',
    category: 'add_on',
    monthlyPrice: 39.00,
    annualPrice: 375.00,
    trialDays: 14,
    features: [
      'Equipment inventory',
      'Maintenance scheduling',
      'Rental tracking',
      'Utilization reports',
      'Service history',
      'Cost per project',
      'GPS tracking ready',
    ],
    requiredTier: 'basic',
    isActive: true,
    isBeta: false,
    icon: '🚜',
    color: '#F59E0B',
  },
  {
    id: 5,
    moduleName: 'document_management',
    displayName: 'Document Management Pro',
    description: 'Enterprise document management with version control, OCR, advanced search, and unlimited storage.',
    category: 'premium',
    monthlyPrice: 59.00,
    annualPrice: 570.00,
    trialDays: 14,
    features: [
      'Unlimited storage',
      'OCR & text extraction',
      'Version control',
      'Advanced search',
      'Automated organization',
      'Custom metadata',
      'Audit trails',
    ],
    requiredTier: 'professional',
    isActive: true,
    isBeta: false,
    icon: '📁',
    color: '#8B5CF6',
  },
];

// Mock company's enabled modules (for demo)
let enabledModules = [
  {
    id: 1,
    companyId: 1,
    moduleName: 'hr',
    moduleDisplayName: 'Human Resources',
    isEnabled: true,
    isTrialing: true,
    monthlyPrice: 49.00,
    enabledAt: '2025-11-01T00:00:00Z',
    trialEndDate: '2025-11-15T23:59:59Z',
  },
];

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId') || '1'; // Default to company 1 for demo

    // Get enabled modules for company
    const companyModules = enabledModules.filter(m => m.companyId === parseInt(companyId));

    // Map available modules with enabled status
    const modulesWithStatus = availableModules.map(module => {
      const enabled = companyModules.find(em => em.moduleName === module.moduleName);

      return {
        ...module,
        isEnabled: !!enabled,
        isTrialing: enabled?.isTrialing || false,
        enabledAt: enabled?.enabledAt || null,
        trialEndDate: enabled?.trialEndDate || null,
        daysRemainingInTrial: enabled?.trialEndDate
          ? Math.ceil((new Date(enabled.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    });

    // Calculate totals
    const enabledCount = companyModules.filter(m => m.isEnabled).length;
    const monthlyTotal = companyModules
      .filter(m => m.isEnabled && !m.isTrialing)
      .reduce((sum, m) => sum + parseFloat(m.monthlyPrice.toString()), 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          modules: modulesWithStatus,
          enabled: companyModules,
          stats: {
            enabledCount,
            trialingCount: companyModules.filter(m => m.isTrialing).length,
            monthlyTotal,
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching modules:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch modules',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, moduleName, companyId = 1 } = body;

    if (action === 'enable') {
      // Check if module exists in catalog
      const module = availableModules.find(m => m.moduleName === moduleName);
      if (!module) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Module not found',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if already enabled
      const existing = enabledModules.find(
        em => em.companyId === companyId && em.moduleName === moduleName
      );

      if (existing) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Module already enabled',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Enable module with trial
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + module.trialDays);

      const newModule = {
        id: enabledModules.length + 1,
        companyId,
        moduleName: module.moduleName,
        moduleDisplayName: module.displayName,
        isEnabled: true,
        isTrialing: true,
        monthlyPrice: module.monthlyPrice,
        enabledAt: new Date().toISOString(),
        trialEndDate: trialEndDate.toISOString(),
      };

      enabledModules.push(newModule);

      return new Response(
        JSON.stringify({
          success: true,
          data: { module: newModule },
          message: `${module.displayName} enabled with ${module.trialDays}-day trial`,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else if (action === 'disable') {
      // Find and disable module
      const moduleIndex = enabledModules.findIndex(
        em => em.companyId === companyId && em.moduleName === moduleName
      );

      if (moduleIndex === -1) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Module not enabled',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Remove module
      enabledModules.splice(moduleIndex, 1);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Module disabled successfully',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else if (action === 'subscribe') {
      // Convert trial to paid subscription
      const module = enabledModules.find(
        em => em.companyId === companyId && em.moduleName === moduleName
      );

      if (!module) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Module not found',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      module.isTrialing = false;
      module.trialEndDate = null;

      return new Response(
        JSON.stringify({
          success: true,
          data: { module },
          message: 'Subscribed to module successfully',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid action',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error managing module:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to manage module',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
