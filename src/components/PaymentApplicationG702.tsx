/**
 * G702 - Application and Certificate for Payment
 * AIA Document G702-1992
 */
import { createSignal, Show, For } from 'solid-js';

interface PaymentApplicationG702Props {
  paymentApplication?: any;
  projectId: number;
  onSave?: (data: any) => void;
  onSubmit?: (data: any) => void;
  readOnly?: boolean;
}

export default function PaymentApplicationG702(props: PaymentApplicationG702Props) {
  const [formData, setFormData] = createSignal(props.paymentApplication || {
    projectId: props.projectId,
    applicationNumber: 1,
    periodTo: new Date().toISOString().split('T')[0],
    status: 'draft',
    originalContractSum: 0,
    netChangeByChangeOrders: 0,
    totalCompletedAndStored: 0,
    retainagePercentage: 10.00,
    lessPreviousCertificates: 0,
    contractorCertified: false,
    architectCertified: false,
  });

  const [isSaving, setIsSaving] = createSignal(false);
  const [showSuccess, setShowSuccess] = createSignal(false);

  // Calculated fields
  const contractSumToDate = () => {
    const data = formData();
    return (data.originalContractSum || 0) + (data.netChangeByChangeOrders || 0);
  };

  const totalRetainage = () => {
    const data = formData();
    return Math.round((data.totalCompletedAndStored || 0) * ((data.retainagePercentage || 0) / 100));
  };

  const totalEarnedLessRetainage = () => {
    const data = formData();
    return (data.totalCompletedAndStored || 0) - totalRetainage();
  };

  const currentPaymentDue = () => {
    return totalEarnedLessRetainage() - (formData().lessPreviousCertificates || 0);
  };

  const balanceToFinish = () => {
    return contractSumToDate() - totalEarnedLessRetainage();
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const parseCurrency = (value: string): number => {
    return Math.round(parseFloat(value.replace(/[^0-9.-]/g, '')) * 100);
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData(), [field]: value });
  };

  const handleSave = async () => {
    if (props.readOnly) return;

    setIsSaving(true);
    try {
      const data = {
        ...formData(),
        contractSumToDate: contractSumToDate(),
        totalRetainage: totalRetainage(),
        totalEarnedLessRetainage: totalEarnedLessRetainage(),
        currentPaymentDue: currentPaymentDue(),
        balanceToFinish: balanceToFinish(),
      };

      props.onSave?.(data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (props.readOnly) return;

    setIsSaving(true);
    try {
      const data = {
        ...formData(),
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        contractSumToDate: contractSumToDate(),
        totalRetainage: totalRetainage(),
        totalEarnedLessRetainage: totalEarnedLessRetainage(),
        currentPaymentDue: currentPaymentDue(),
        balanceToFinish: balanceToFinish(),
      };

      props.onSubmit?.(data);
      setFormData({ ...formData(), status: 'submitted' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div class="mb-6 border-b border-gray-300 pb-4">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          AIA Document G702™ – 1992
        </h1>
        <p class="text-sm text-gray-600">APPLICATION AND CERTIFICATE FOR PAYMENT</p>
      </div>

      {/* Success Message */}
      <Show when={showSuccess()}>
        <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-green-800 text-sm font-medium">
            Payment application saved successfully!
          </p>
        </div>
      </Show>

      {/* Application Header Info */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Application No.
          </label>
          <input
            type="number"
            value={formData().applicationNumber}
            onInput={(e) => updateField('applicationNumber', parseInt(e.currentTarget.value))}
            disabled={props.readOnly}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Period To
          </label>
          <input
            type="date"
            value={formData().periodTo}
            onInput={(e) => updateField('periodTo', e.currentTarget.value)}
            disabled={props.readOnly}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <div class="px-3 py-2 bg-gray-50 rounded-md">
            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              formData().status === 'approved' ? 'bg-green-100 text-green-800' :
              formData().status === 'submitted' ? 'bg-blue-100 text-blue-800' :
              formData().status === 'draft' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {formData().status}
            </span>
          </div>
        </div>
      </div>

      {/* G702 Financial Summary */}
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Contractor's Application for Payment
        </h2>

        <div class="space-y-3">
          {/* Line 1 */}
          <div class="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-200">
            <div class="col-span-1 text-sm font-medium text-gray-700">1.</div>
            <div class="col-span-7 text-sm text-gray-700">
              ORIGINAL CONTRACT SUM
            </div>
            <div class="col-span-4">
              <input
                type="text"
                value={formatCurrency(formData().originalContractSum || 0)}
                onInput={(e) => updateField('originalContractSum', parseCurrency(e.currentTarget.value))}
                disabled={props.readOnly}
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Line 2 */}
          <div class="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-200">
            <div class="col-span-1 text-sm font-medium text-gray-700">2.</div>
            <div class="col-span-7 text-sm text-gray-700">
              Net change by Change Orders
            </div>
            <div class="col-span-4">
              <input
                type="text"
                value={formatCurrency(formData().netChangeByChangeOrders || 0)}
                onInput={(e) => updateField('netChangeByChangeOrders', parseCurrency(e.currentTarget.value))}
                disabled={props.readOnly}
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Line 3 */}
          <div class="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-200 bg-blue-50">
            <div class="col-span-1 text-sm font-medium text-gray-700">3.</div>
            <div class="col-span-7 text-sm font-semibold text-gray-900">
              CONTRACT SUM TO DATE (Line 1 ± 2)
            </div>
            <div class="col-span-4">
              <div class="px-3 py-2 bg-white border border-gray-300 rounded-md text-right font-semibold">
                {formatCurrency(contractSumToDate())}
              </div>
            </div>
          </div>

          {/* Line 4 */}
          <div class="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-200">
            <div class="col-span-1 text-sm font-medium text-gray-700">4.</div>
            <div class="col-span-7 text-sm text-gray-700">
              TOTAL COMPLETED & STORED TO DATE (Column G on G703)
            </div>
            <div class="col-span-4">
              <input
                type="text"
                value={formatCurrency(formData().totalCompletedAndStored || 0)}
                onInput={(e) => updateField('totalCompletedAndStored', parseCurrency(e.currentTarget.value))}
                disabled={props.readOnly}
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Line 5 - Retainage */}
          <div class="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-200">
            <div class="col-span-1 text-sm font-medium text-gray-700">5.</div>
            <div class="col-span-7">
              <div class="text-sm text-gray-700 mb-2">RETAINAGE:</div>
              <div class="ml-4 space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">a. Percentage:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData().retainagePercentage || 10}
                    onInput={(e) => updateField('retainagePercentage', parseFloat(e.currentTarget.value))}
                    disabled={props.readOnly}
                    class="w-20 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span class="text-sm text-gray-600">%</span>
                </div>
              </div>
            </div>
            <div class="col-span-4">
              <div class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-right">
                {formatCurrency(totalRetainage())}
              </div>
            </div>
          </div>

          {/* Line 6 */}
          <div class="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-200 bg-blue-50">
            <div class="col-span-1 text-sm font-medium text-gray-700">6.</div>
            <div class="col-span-7 text-sm font-semibold text-gray-900">
              TOTAL EARNED LESS RETAINAGE (Line 4 less Line 5 Total)
            </div>
            <div class="col-span-4">
              <div class="px-3 py-2 bg-white border border-gray-300 rounded-md text-right font-semibold">
                {formatCurrency(totalEarnedLessRetainage())}
              </div>
            </div>
          </div>

          {/* Line 7 */}
          <div class="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-200">
            <div class="col-span-1 text-sm font-medium text-gray-700">7.</div>
            <div class="col-span-7 text-sm text-gray-700">
              LESS PREVIOUS CERTIFICATES FOR PAYMENT (Line 6 from prior Certificate)
            </div>
            <div class="col-span-4">
              <input
                type="text"
                value={formatCurrency(formData().lessPreviousCertificates || 0)}
                onInput={(e) => updateField('lessPreviousCertificates', parseCurrency(e.currentTarget.value))}
                disabled={props.readOnly}
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Line 8 - Current Payment Due */}
          <div class="grid grid-cols-12 gap-4 items-center py-3 border-b-2 border-gray-900 bg-green-50">
            <div class="col-span-1 text-sm font-bold text-gray-900">8.</div>
            <div class="col-span-7 text-sm font-bold text-gray-900">
              CURRENT PAYMENT DUE (Line 6 less Line 7)
            </div>
            <div class="col-span-4">
              <div class="px-3 py-3 bg-white border-2 border-green-600 rounded-md text-right font-bold text-lg text-green-700">
                {formatCurrency(currentPaymentDue())}
              </div>
            </div>
          </div>

          {/* Line 9 */}
          <div class="grid grid-cols-12 gap-4 items-center py-2 bg-gray-50">
            <div class="col-span-1 text-sm font-medium text-gray-700">9.</div>
            <div class="col-span-7 text-sm font-medium text-gray-700">
              BALANCE TO FINISH, INCLUDING RETAINAGE (Line 3 less Line 6)
            </div>
            <div class="col-span-4">
              <div class="px-3 py-2 bg-white border border-gray-300 rounded-md text-right font-medium">
                {formatCurrency(balanceToFinish())}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contractor Certification */}
      <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 class="text-md font-semibold text-gray-900 mb-3">
          Contractor's Certification
        </h3>
        <div class="flex items-start gap-3">
          <input
            type="checkbox"
            id="contractor-cert"
            checked={formData().contractorCertified}
            onChange={(e) => updateField('contractorCertified', e.currentTarget.checked)}
            disabled={props.readOnly}
            class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="contractor-cert" class="text-sm text-gray-700">
            The undersigned Contractor certifies that work has been completed in accordance with the Contract Documents,
            that all amounts have been paid by the Contractor for Work for which previous Certificates for Payment were
            issued and payments received from the Owner, and that current payment shown herein is now due.
          </label>
        </div>

        <div class="mt-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={formData().contractorDate || ''}
            onInput={(e) => updateField('contractorDate', e.currentTarget.value)}
            disabled={props.readOnly}
            class="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <Show when={!props.readOnly}>
        <div class="flex gap-3 justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving()}
            class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving() ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving() || !formData().contractorCertified}
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving() ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </Show>
    </div>
  );
}
