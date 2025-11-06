/**
 * HR Employees API Endpoint
 * GET /api/hr/employees - Fetch all employees with filtering
 * POST /api/hr/employees - Create new employee
 */
import type { APIRoute } from 'astro';

export const prerender = false;

// Mock employee data for Phase 1
const mockEmployees = [
  {
    id: 1,
    employeeNumber: 'EMP-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@constructhub.com',
    phone: '555-0101',
    department: 'project_management',
    jobTitle: 'Senior Project Manager',
    employmentType: 'full_time',
    employmentStatus: 'active',
    hireDate: '2020-03-15',
    managerId: null,
    photoUrl: null,
    hourlyRate: null,
    salary: 95000,
    unionMember: false,
    certifications: 3,
    activeCertifications: 3,
    expiringCertifications: 0,
    skills: ['Project Management', 'Scheduling', 'Budgeting', 'AutoCAD'],
    ptoBalance: {
      vacation: 12.5,
      sick: 8.0,
      personal: 3.0,
    },
  },
  {
    id: 2,
    employeeNumber: 'EMP-002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@constructhub.com',
    phone: '555-0102',
    department: 'field_operations',
    jobTitle: 'Field Superintendent',
    employmentType: 'full_time',
    employmentStatus: 'active',
    hireDate: '2019-06-01',
    managerId: 1,
    photoUrl: null,
    hourlyRate: 45.00,
    salary: null,
    unionMember: true,
    unionName: 'International Union of Operating Engineers',
    unionLocalNumber: 'Local 150',
    certifications: 5,
    activeCertifications: 4,
    expiringCertifications: 1,
    skills: ['OSHA 30', 'First Aid', 'Concrete', 'Site Management'],
    ptoBalance: {
      vacation: 15.0,
      sick: 6.5,
      personal: 2.0,
    },
  },
  {
    id: 3,
    employeeNumber: 'EMP-003',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@constructhub.com',
    phone: '555-0103',
    department: 'estimating',
    jobTitle: 'Lead Estimator',
    employmentType: 'full_time',
    employmentStatus: 'active',
    hireDate: '2021-01-10',
    managerId: 1,
    photoUrl: null,
    hourlyRate: null,
    salary: 85000,
    unionMember: false,
    certifications: 2,
    activeCertifications: 2,
    expiringCertifications: 0,
    skills: ['Cost Estimation', 'Bluebeam', 'Excel', 'Takeoff'],
    ptoBalance: {
      vacation: 10.0,
      sick: 7.0,
      personal: 3.0,
    },
  },
  {
    id: 4,
    employeeNumber: 'EMP-004',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@constructhub.com',
    phone: '555-0104',
    department: 'safety',
    jobTitle: 'Safety Manager',
    employmentType: 'full_time',
    employmentStatus: 'active',
    hireDate: '2018-09-01',
    managerId: null,
    photoUrl: null,
    hourlyRate: null,
    salary: 78000,
    unionMember: false,
    certifications: 7,
    activeCertifications: 6,
    expiringCertifications: 1,
    skills: ['OSHA 500', 'Safety Management', 'Incident Investigation', 'Training'],
    ptoBalance: {
      vacation: 18.0,
      sick: 5.0,
      personal: 1.0,
    },
  },
  {
    id: 5,
    employeeNumber: 'EMP-005',
    firstName: 'David',
    lastName: 'Williams',
    email: 'david.williams@constructhub.com',
    phone: '555-0105',
    department: 'field_operations',
    jobTitle: 'Carpenter Foreman',
    employmentType: 'full_time',
    employmentStatus: 'active',
    hireDate: '2017-04-15',
    managerId: 2,
    photoUrl: null,
    hourlyRate: 38.50,
    salary: null,
    unionMember: true,
    unionName: 'United Brotherhood of Carpenters',
    unionLocalNumber: 'Local 13',
    certifications: 4,
    activeCertifications: 4,
    expiringCertifications: 0,
    skills: ['Carpentry', 'Framing', 'Blueprint Reading', 'OSHA 10'],
    ptoBalance: {
      vacation: 20.0,
      sick: 4.0,
      personal: 2.5,
    },
  },
];

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const department = url.searchParams.get('department');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let filtered = [...mockEmployees];

    // Filter by department
    if (department && department !== 'all') {
      filtered = filtered.filter(emp => emp.department === department);
    }

    // Filter by status
    if (status && status !== 'all') {
      filtered = filtered.filter(emp => emp.employmentStatus === status);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.employeeNumber.toLowerCase().includes(searchLower) ||
        emp.jobTitle.toLowerCase().includes(searchLower)
      );
    }

    // Calculate statistics
    const stats = {
      totalEmployees: mockEmployees.length,
      activeEmployees: mockEmployees.filter(e => e.employmentStatus === 'active').length,
      unionMembers: mockEmployees.filter(e => e.unionMember).length,
      expiringCertifications: mockEmployees.reduce((sum, e) => sum + e.expiringCertifications, 0),
      averageTenure: calculateAverageTenure(mockEmployees),
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          employees: filtered,
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
    console.error('Error fetching employees:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch employees',
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
    if (!body.firstName || !body.lastName || !body.email || !body.department || !body.jobTitle) {
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

    // Create new employee
    const newEmployee = {
      id: mockEmployees.length + 1,
      employeeNumber: `EMP-${String(mockEmployees.length + 1).padStart(3, '0')}`,
      ...body,
      employmentStatus: body.employmentStatus || 'active',
      employmentType: body.employmentType || 'full_time',
      hireDate: body.hireDate || new Date().toISOString().split('T')[0],
      certifications: 0,
      activeCertifications: 0,
      expiringCertifications: 0,
      skills: body.skills || [],
      ptoBalance: {
        vacation: 0,
        sick: 0,
        personal: 0,
      },
    };

    mockEmployees.push(newEmployee);

    return new Response(
      JSON.stringify({
        success: true,
        data: { employee: newEmployee },
        message: 'Employee created successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating employee:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create employee',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

function calculateAverageTenure(employees: any[]): string {
  const totalMonths = employees.reduce((sum, emp) => {
    const hireDate = new Date(emp.hireDate);
    const now = new Date();
    const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
    return sum + months;
  }, 0);

  const avgMonths = totalMonths / employees.length;
  const years = Math.floor(avgMonths / 12);
  const months = Math.floor(avgMonths % 12);

  return `${years}y ${months}m`;
}
