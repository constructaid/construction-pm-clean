/**
 * API endpoint for Payment Applications (G702/G703)
 */
import type { APIRoute } from 'astro';

// Mock data structure for payment applications
interface PaymentApplication {
  id: number;
  projectId: number;
  applicationNumber: number;
  periodTo: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';

  // G702 Financial Summary
  originalContractSum: number;
  netChangeByChangeOrders: number;
  contractSumToDate: number;
  totalCompletedAndStored: number;
  retainagePercentage: number;
  totalRetainage: number;
  totalEarnedLessRetainage: number;
  lessPreviousCertificates: number;
  currentPaymentDue: number;
  balanceToFinish: number;

  // Workflow
  contractorCertified: boolean;
  architectCertified: boolean;
  amountCertified: number;

  // Dates
  contractorDate?: string;
  submittedAt?: string;
  approvedAt?: string;
  paidDate?: string;

  createdAt: string;
  updatedAt: string;
}

interface PaymentApplicationLineItem {
  id: number;
  paymentApplicationId: number;
  itemNumber: string;
  description: string;
  csiDivision: string;
  csiDivisionName: string;
  scheduledValue: number;
  workCompletedPrevious: number;
  workCompletedThisPeriod: number;
  materialsStored: number;
  totalCompletedAndStored: number;
  percentComplete: number;
  balanceToFinish: number;
}

// In-memory storage (replace with actual database)
const paymentApplicationsStore: Map<number, PaymentApplication> = new Map();
const lineItemsStore: Map<number, PaymentApplicationLineItem[]> = new Map();

// Initialize with sample data
const samplePaymentApp: PaymentApplication = {
  id: 1,
  projectId: 1,
  applicationNumber: 2,
  periodTo: '2025-06-30',
  status: 'approved',
  originalContractSum: 261156000, // $2,611,560.00 in cents
  netChangeByChangeOrders: 0,
  contractSumToDate: 261156000,
  totalCompletedAndStored: 29423650, // $294,236.50
  retainagePercentage: 10.00,
  totalRetainage: 2942365, // 10% of completed work
  totalEarnedLessRetainage: 26481285,
  lessPreviousCertificates: 4228618, // Previous payment
  currentPaymentDue: 22252667, // $222,526.67
  balanceToFinish: 234674715,
  contractorCertified: true,
  architectCertified: true,
  amountCertified: 22252667,
  contractorDate: '2025-06-30',
  submittedAt: '2025-07-01',
  approvedAt: '2025-07-05',
  createdAt: '2025-06-30T10:00:00Z',
  updatedAt: '2025-07-05T14:30:00Z',
};

const sampleLineItems: PaymentApplicationLineItem[] = [
  {
    id: 1,
    paymentApplicationId: 1,
    itemNumber: '01.01',
    description: 'General Conditions - Mobilization',
    csiDivision: '01',
    csiDivisionName: 'General Requirements',
    scheduledValue: 15000000, // $150,000
    workCompletedPrevious: 7500000,
    workCompletedThisPeriod: 7500000,
    materialsStored: 0,
    totalCompletedAndStored: 15000000,
    percentComplete: 100.00,
    balanceToFinish: 0,
  },
  {
    id: 2,
    paymentApplicationId: 1,
    itemNumber: '03.01',
    description: 'Concrete - Foundations',
    csiDivision: '03',
    csiDivisionName: 'Concrete',
    scheduledValue: 45000000, // $450,000
    workCompletedPrevious: 0,
    workCompletedThisPeriod: 11250000, // 25%
    materialsStored: 2250000,
    totalCompletedAndStored: 13500000,
    percentComplete: 30.00,
    balanceToFinish: 31500000,
  },
  {
    id: 3,
    paymentApplicationId: 1,
    itemNumber: '26.01',
    description: 'Electrical - Rough-In',
    csiDivision: '26',
    csiDivisionName: 'Electrical',
    scheduledValue: 35000000, // $350,000
    workCompletedPrevious: 0,
    workCompletedThisPeriod: 3500000, // 10%
    materialsStored: 0,
    totalCompletedAndStored: 3500000,
    percentComplete: 10.00,
    balanceToFinish: 31500000,
  },
];

paymentApplicationsStore.set(1, samplePaymentApp);
lineItemsStore.set(1, sampleLineItems);

export const GET: APIRoute = async ({ request, url }) => {
  const projectId = url.searchParams.get('projectId');
  const id = url.searchParams.get('id');

  try {
    // Get single payment application with line items
    if (id) {
      const payApp = paymentApplicationsStore.get(parseInt(id));
      if (!payApp) {
        return new Response(JSON.stringify({ error: 'Payment application not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const lineItems = lineItemsStore.get(parseInt(id)) || [];

      return new Response(JSON.stringify({
        paymentApplication: payApp,
        lineItems
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all payment applications for a project
    if (projectId) {
      const projectPayApps = Array.from(paymentApplicationsStore.values())
        .filter(pa => pa.projectId === parseInt(projectId))
        .sort((a, b) => b.applicationNumber - a.applicationNumber);

      return new Response(JSON.stringify({ paymentApplications: projectPayApps }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all payment applications
    const allPayApps = Array.from(paymentApplicationsStore.values());
    return new Response(JSON.stringify({ paymentApplications: allPayApps }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching payment applications:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch payment applications' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const newId = paymentApplicationsStore.size + 1;
    const now = new Date().toISOString();

    // Calculate values
    const contractSumToDate = body.originalContractSum + (body.netChangeByChangeOrders || 0);
    const totalRetainage = Math.round(body.totalCompletedAndStored * (body.retainagePercentage / 100));
    const totalEarnedLessRetainage = body.totalCompletedAndStored - totalRetainage;
    const currentPaymentDue = totalEarnedLessRetainage - (body.lessPreviousCertificates || 0);
    const balanceToFinish = contractSumToDate - totalEarnedLessRetainage;

    const newPaymentApp: PaymentApplication = {
      id: newId,
      projectId: body.projectId,
      applicationNumber: body.applicationNumber,
      periodTo: body.periodTo,
      status: body.status || 'draft',
      originalContractSum: body.originalContractSum,
      netChangeByChangeOrders: body.netChangeByChangeOrders || 0,
      contractSumToDate,
      totalCompletedAndStored: body.totalCompletedAndStored,
      retainagePercentage: body.retainagePercentage || 10.00,
      totalRetainage,
      totalEarnedLessRetainage,
      lessPreviousCertificates: body.lessPreviousCertificates || 0,
      currentPaymentDue,
      balanceToFinish,
      contractorCertified: body.contractorCertified || false,
      architectCertified: body.architectCertified || false,
      amountCertified: body.amountCertified || currentPaymentDue,
      contractorDate: body.contractorDate,
      submittedAt: body.submittedAt,
      approvedAt: body.approvedAt,
      paidDate: body.paidDate,
      createdAt: now,
      updatedAt: now,
    };

    paymentApplicationsStore.set(newId, newPaymentApp);

    // Create line items if provided
    if (body.lineItems && Array.isArray(body.lineItems)) {
      const newLineItems = body.lineItems.map((item: any, index: number) => ({
        id: index + 1,
        paymentApplicationId: newId,
        ...item,
      }));
      lineItemsStore.set(newId, newLineItems);
    }

    return new Response(JSON.stringify({
      paymentApplication: newPaymentApp,
      message: 'Payment application created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating payment application:', error);
    return new Response(JSON.stringify({ error: 'Failed to create payment application' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Payment application ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const existing = paymentApplicationsStore.get(parseInt(id));

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Payment application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Recalculate financial values
    const contractSumToDate = body.originalContractSum + (body.netChangeByChangeOrders || 0);
    const totalRetainage = Math.round(body.totalCompletedAndStored * (body.retainagePercentage / 100));
    const totalEarnedLessRetainage = body.totalCompletedAndStored - totalRetainage;
    const currentPaymentDue = totalEarnedLessRetainage - (body.lessPreviousCertificates || 0);
    const balanceToFinish = contractSumToDate - totalEarnedLessRetainage;

    const updatedPaymentApp: PaymentApplication = {
      ...existing,
      ...body,
      contractSumToDate,
      totalRetainage,
      totalEarnedLessRetainage,
      currentPaymentDue,
      balanceToFinish,
      updatedAt: new Date().toISOString(),
    };

    paymentApplicationsStore.set(parseInt(id), updatedPaymentApp);

    // Update line items if provided
    if (body.lineItems && Array.isArray(body.lineItems)) {
      lineItemsStore.set(parseInt(id), body.lineItems);
    }

    return new Response(JSON.stringify({
      paymentApplication: updatedPaymentApp,
      message: 'Payment application updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating payment application:', error);
    return new Response(JSON.stringify({ error: 'Failed to update payment application' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Payment application ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const deleted = paymentApplicationsStore.delete(parseInt(id));
    lineItemsStore.delete(parseInt(id));

    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Payment application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Payment application deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error deleting payment application:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete payment application' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
