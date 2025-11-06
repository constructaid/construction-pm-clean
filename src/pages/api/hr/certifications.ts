/**
 * HR Certifications API Endpoint
 * GET /api/hr/certifications - Fetch employee certifications
 * POST /api/hr/certifications - Add new certification
 */
import type { APIRoute } from 'astro';

export const prerender = false;

// Mock certifications data
const mockCertifications = [
  {
    id: 1,
    employeeId: 1,
    employeeName: 'John Doe',
    certificationName: 'Project Management Professional (PMP)',
    certificationNumber: 'PMP-2020-12345',
    issuingOrganization: 'PMI',
    category: 'Management',
    issueDate: '2020-06-15',
    expirationDate: '2026-06-15',
    status: 'active',
    isRequired: true,
    daysUntilExpiration: 1890,
  },
  {
    id: 2,
    employeeId: 2,
    employeeName: 'Sarah Johnson',
    certificationName: 'OSHA 30-Hour Construction',
    certificationNumber: 'OSHA-30-2023-98765',
    issuingOrganization: 'OSHA',
    category: 'Safety',
    issueDate: '2023-03-10',
    expirationDate: '2028-03-10',
    status: 'active',
    isRequired: true,
    daysUntilExpiration: 1220,
  },
  {
    id: 3,
    employeeId: 2,
    employeeName: 'Sarah Johnson',
    certificationName: 'First Aid/CPR',
    certificationNumber: 'CPR-2024-56789',
    issuingOrganization: 'American Red Cross',
    category: 'Safety',
    issueDate: '2024-01-15',
    expirationDate: '2026-01-15',
    status: 'active',
    isRequired: true,
    daysUntilExpiration: 430,
  },
  {
    id: 4,
    employeeId: 2,
    employeeName: 'Sarah Johnson',
    certificationName: 'Concrete Field Testing Technician',
    certificationNumber: 'ACI-2022-11223',
    issuingOrganization: 'ACI',
    category: 'Technical',
    issueDate: '2022-09-20',
    expirationDate: '2025-09-20',
    status: 'active',
    isRequired: false,
    daysUntilExpiration: 320,
  },
  {
    id: 5,
    employeeId: 3,
    employeeName: 'Michael Chen',
    certificationName: 'Certified Professional Estimator (CPE)',
    certificationNumber: 'CPE-2021-44556',
    issuingOrganization: 'ASPE',
    category: 'Professional',
    issueDate: '2021-05-10',
    expirationDate: '2027-05-10',
    status: 'active',
    isRequired: false,
    daysUntilExpiration: 1680,
  },
  {
    id: 6,
    employeeId: 4,
    employeeName: 'Emily Rodriguez',
    certificationName: 'OSHA 500 Trainer',
    certificationNumber: 'OSHA-500-2021-77889',
    issuingOrganization: 'OSHA',
    category: 'Safety',
    issueDate: '2021-08-01',
    expirationDate: '2025-08-01',
    status: 'expiring_soon',
    isRequired: true,
    daysUntilExpiration: 45,
  },
  {
    id: 7,
    employeeId: 4,
    employeeName: 'Emily Rodriguez',
    certificationName: 'Certified Safety Professional (CSP)',
    certificationNumber: 'CSP-2019-33221',
    issuingOrganization: 'BCSP',
    category: 'Professional',
    issueDate: '2019-12-01',
    expirationDate: '2024-12-01',
    status: 'expiring_soon',
    isRequired: true,
    daysUntilExpiration: 25,
  },
  {
    id: 8,
    employeeId: 5,
    employeeName: 'David Williams',
    certificationName: 'Journeyman Carpenter',
    certificationNumber: 'UBC-2015-99887',
    issuingOrganization: 'United Brotherhood of Carpenters',
    category: 'Trade License',
    issueDate: '2015-06-15',
    expirationDate: null,
    status: 'active',
    isRequired: true,
    daysUntilExpiration: null,
  },
];

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const expiringSoon = url.searchParams.get('expiringSoon'); // days threshold

    let filtered = [...mockCertifications];

    // Filter by employee
    if (employeeId) {
      filtered = filtered.filter(cert => cert.employeeId === parseInt(employeeId));
    }

    // Filter by status
    if (status && status !== 'all') {
      filtered = filtered.filter(cert => cert.status === status);
    }

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(cert => cert.category === category);
    }

    // Filter by expiring soon
    if (expiringSoon) {
      const threshold = parseInt(expiringSoon);
      filtered = filtered.filter(cert =>
        cert.daysUntilExpiration !== null && cert.daysUntilExpiration <= threshold
      );
    }

    // Calculate statistics
    const stats = {
      totalCertifications: mockCertifications.length,
      active: mockCertifications.filter(c => c.status === 'active').length,
      expiringSoon: mockCertifications.filter(c => c.status === 'expiring_soon').length,
      expired: mockCertifications.filter(c => c.status === 'expired').length,
      expiringIn30Days: mockCertifications.filter(c =>
        c.daysUntilExpiration !== null && c.daysUntilExpiration <= 30
      ).length,
      expiringIn90Days: mockCertifications.filter(c =>
        c.daysUntilExpiration !== null && c.daysUntilExpiration <= 90
      ).length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          certifications: filtered,
          stats,
        },
        count: filtered.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch certifications',
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

    // Validate required fields
    if (!body.employeeId || !body.certificationName || !body.issuingOrganization) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate days until expiration
    let daysUntilExpiration = null;
    if (body.expirationDate) {
      const expDate = new Date(body.expirationDate);
      const now = new Date();
      const diffTime = expDate.getTime() - now.getTime();
      daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Determine status
    let status = 'active';
    if (daysUntilExpiration !== null) {
      if (daysUntilExpiration < 0) {
        status = 'expired';
      } else if (daysUntilExpiration <= 90) {
        status = 'expiring_soon';
      }
    }

    // Create new certification
    const newCertification = {
      id: mockCertifications.length + 1,
      employeeId: body.employeeId,
      employeeName: body.employeeName || 'Unknown Employee',
      certificationName: body.certificationName,
      certificationNumber: body.certificationNumber || '',
      issuingOrganization: body.issuingOrganization,
      category: body.category || 'Professional',
      issueDate: body.issueDate || new Date().toISOString().split('T')[0],
      expirationDate: body.expirationDate || null,
      status,
      isRequired: body.isRequired || false,
      daysUntilExpiration,
    };

    mockCertifications.push(newCertification);

    return new Response(
      JSON.stringify({
        success: true,
        data: { certification: newCertification },
        message: 'Certification added successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating certification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create certification',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
