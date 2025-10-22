/**
 * G703 - Continuation Sheet (Schedule of Values Line Items)
 * AIA Document G703-1992
 */
import { createSignal, Show, For } from 'solid-js';

interface LineItem {
  id?: number;
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

interface PaymentApplicationG703Props {
  lineItems?: LineItem[];
  paymentApplicationId?: number;
  projectId: number;
  onUpdate?: (lineItems: LineItem[]) => void;
  readOnly?: boolean;
}

export default function PaymentApplicationG703(props: PaymentApplicationG703Props) {
  const [lineItems, setLineItems] = createSignal<LineItem[]>(props.lineItems || []);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [editingItem, setEditingItem] = createSignal<LineItem | null>(null);
  const [showSuccess, setShowSuccess] = createSignal(false);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const calculateTotals = () => {
    const items = lineItems();
    return {
      scheduledValue: items.reduce((sum, item) => sum + item.scheduledValue, 0),
      workCompletedPrevious: items.reduce((sum, item) => sum + item.workCompletedPrevious, 0),
      workCompletedThisPeriod: items.reduce((sum, item) => sum + item.workCompletedThisPeriod, 0),
      materialsStored: items.reduce((sum, item) => sum + item.materialsStored, 0),
      totalCompletedAndStored: items.reduce((sum, item) => sum + item.totalCompletedAndStored, 0),
      balanceToFinish: items.reduce((sum, item) => sum + item.balanceToFinish, 0),
    };
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const items = [...lineItems()];
    items[index] = { ...items[index], [field]: value };

    // Recalculate dependent fields
    const item = items[index];
    item.totalCompletedAndStored =
      (item.workCompletedPrevious || 0) +
      (item.workCompletedThisPeriod || 0) +
      (item.materialsStored || 0);

    item.percentComplete = item.scheduledValue > 0
      ? (item.totalCompletedAndStored / item.scheduledValue) * 100
      : 0;

    item.balanceToFinish = (item.scheduledValue || 0) - item.totalCompletedAndStored;

    setLineItems(items);
    props.onUpdate?.(items);
  };

  const addLineItem = (newItem: LineItem) => {
    const items = [...lineItems(), newItem];
    setLineItems(items);
    props.onUpdate?.(items);
    setShowAddModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const deleteLineItem = (index: number) => {
    const items = lineItems().filter((_, i) => i !== index);
    setLineItems(items);
    props.onUpdate?.(items);
  };

  const groupByDivision = () => {
    const items = lineItems();
    const grouped = new Map<string, LineItem[]>();

    items.forEach(item => {
      const division = item.csiDivision || 'Other';
      if (!grouped.has(division)) {
        grouped.set(division, []);
      }
      grouped.get(division)!.push(item);
    });

    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  return (
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div class="mb-6 border-b border-gray-300 pb-4">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          AIA Document G703™ – 1992
        </h1>
        <p class="text-sm text-gray-600">CONTINUATION SHEET</p>
      </div>

      {/* Success Message */}
      <Show when={showSuccess()}>
        <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-green-800 text-sm font-medium">
            Line items updated successfully!
          </p>
        </div>
      </Show>

      {/* Add Line Item Button */}
      <Show when={!props.readOnly}>
        <div class="mb-4">
          <button
            onClick={() => setShowAddModal(true)}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            + Add Line Item
          </button>
        </div>
      </Show>

      {/* G703 Table - Scrollable */}
      <div class="overflow-x-auto mb-6">
        <table class="min-w-full divide-y divide-gray-300 border border-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-2 py-3 text-left text-xs font-semibold text-gray-900 border-r border-gray-300">
                A<br/>ITEM NO.
              </th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-gray-900 border-r border-gray-300 min-w-[200px]">
                B<br/>DESCRIPTION OF WORK
              </th>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">
                C<br/>SCHEDULED VALUE
              </th>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">
                D<br/>WORK COMPLETED<br/>FROM PREVIOUS
              </th>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">
                E<br/>WORK COMPLETED<br/>THIS PERIOD
              </th>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">
                F<br/>MATERIALS<br/>STORED
              </th>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">
                G<br/>TOTAL<br/>COMPLETED
              </th>
              <th class="px-2 py-3 text-right text-xs font-semibold text-gray-900 border-r border-gray-300 min-w-[80px]">
                H<br/>%
              </th>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">
                I<br/>BALANCE TO<br/>FINISH
              </th>
              <Show when={!props.readOnly}>
                <th class="px-2 py-3 text-center text-xs font-semibold text-gray-900 min-w-[80px]">
                  ACTIONS
                </th>
              </Show>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <For each={groupByDivision()}>
              {([division, divisionItems]) => (
                <>
                  {/* Division Header */}
                  <tr class="bg-blue-50 font-semibold">
                    <td class="px-2 py-2 text-sm border-r border-gray-300" colspan="10">
                      CSI Division {division} - {divisionItems[0]?.csiDivisionName || 'Other'}
                    </td>
                  </tr>

                  {/* Division Line Items */}
                  <For each={divisionItems}>
                    {(item, index) => {
                      const globalIndex = lineItems().indexOf(item);
                      return (
                        <tr class="hover:bg-gray-50">
                          <td class="px-2 py-2 text-sm border-r border-gray-300 whitespace-nowrap">
                            {item.itemNumber}
                          </td>
                          <td class="px-3 py-2 text-sm border-r border-gray-300">
                            {item.description}
                          </td>
                          <td class="px-3 py-2 text-sm text-right border-r border-gray-300 whitespace-nowrap">
                            {formatCurrency(item.scheduledValue)}
                          </td>
                          <td class="px-3 py-2 text-sm text-right border-r border-gray-300 whitespace-nowrap">
                            {formatCurrency(item.workCompletedPrevious)}
                          </td>
                          <td class="px-3 py-2 text-sm border-r border-gray-300">
                            <Show
                              when={!props.readOnly}
                              fallback={<div class="text-right">{formatCurrency(item.workCompletedThisPeriod)}</div>}
                            >
                              <input
                                type="number"
                                value={item.workCompletedThisPeriod / 100}
                                onInput={(e) => updateLineItem(globalIndex, 'workCompletedThisPeriod', Math.round(parseFloat(e.currentTarget.value) * 100))}
                                class="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                step="0.01"
                              />
                            </Show>
                          </td>
                          <td class="px-3 py-2 text-sm border-r border-gray-300">
                            <Show
                              when={!props.readOnly}
                              fallback={<div class="text-right">{formatCurrency(item.materialsStored)}</div>}
                            >
                              <input
                                type="number"
                                value={item.materialsStored / 100}
                                onInput={(e) => updateLineItem(globalIndex, 'materialsStored', Math.round(parseFloat(e.currentTarget.value) * 100))}
                                class="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                step="0.01"
                              />
                            </Show>
                          </td>
                          <td class="px-3 py-2 text-sm text-right border-r border-gray-300 font-semibold bg-blue-50 whitespace-nowrap">
                            {formatCurrency(item.totalCompletedAndStored)}
                          </td>
                          <td class="px-2 py-2 text-sm text-right border-r border-gray-300 whitespace-nowrap">
                            {formatPercent(item.percentComplete)}
                          </td>
                          <td class="px-3 py-2 text-sm text-right border-r border-gray-300 whitespace-nowrap">
                            {formatCurrency(item.balanceToFinish)}
                          </td>
                          <Show when={!props.readOnly}>
                            <td class="px-2 py-2 text-center border-gray-300">
                              <button
                                onClick={() => deleteLineItem(globalIndex)}
                                class="text-red-600 hover:text-red-800 text-sm"
                                title="Delete"
                              >
                                ✕
                              </button>
                            </td>
                          </Show>
                        </tr>
                      );
                    }}
                  </For>
                </>
              )}
            </For>

            {/* Totals Row */}
            <tr class="bg-gray-900 text-white font-bold">
              <td class="px-2 py-3 text-sm border-r border-gray-600" colspan="2">
                TOTAL
              </td>
              <td class="px-3 py-3 text-sm text-right border-r border-gray-600 whitespace-nowrap">
                {formatCurrency(calculateTotals().scheduledValue)}
              </td>
              <td class="px-3 py-3 text-sm text-right border-r border-gray-600 whitespace-nowrap">
                {formatCurrency(calculateTotals().workCompletedPrevious)}
              </td>
              <td class="px-3 py-3 text-sm text-right border-r border-gray-600 whitespace-nowrap">
                {formatCurrency(calculateTotals().workCompletedThisPeriod)}
              </td>
              <td class="px-3 py-3 text-sm text-right border-r border-gray-600 whitespace-nowrap">
                {formatCurrency(calculateTotals().materialsStored)}
              </td>
              <td class="px-3 py-3 text-sm text-right border-r border-gray-600 whitespace-nowrap">
                {formatCurrency(calculateTotals().totalCompletedAndStored)}
              </td>
              <td class="px-2 py-3 text-sm text-right border-r border-gray-600">
                —
              </td>
              <td class="px-3 py-3 text-sm text-right border-r border-gray-600 whitespace-nowrap">
                {formatCurrency(calculateTotals().balanceToFinish)}
              </td>
              <Show when={!props.readOnly}>
                <td></td>
              </Show>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Note */}
      <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm text-gray-700">
          <strong>Note:</strong> The total from Column G must match Line 4 on the G702 form
          (Total Completed & Stored to Date).
        </p>
        <p class="text-sm text-gray-700 mt-2">
          <strong>Current G703 Total:</strong> <span class="font-semibold text-blue-700">
            {formatCurrency(calculateTotals().totalCompletedAndStored)}
          </span>
        </p>
      </div>

      {/* Add/Edit Modal */}
      <Show when={showAddModal()}>
        <AddLineItemModal
          onAdd={addLineItem}
          onCancel={() => setShowAddModal(false)}
        />
      </Show>
    </div>
  );
}

// Add Line Item Modal Component
function AddLineItemModal(props: { onAdd: (item: LineItem) => void; onCancel: () => void }) {
  const [formData, setFormData] = createSignal<Partial<LineItem>>({
    itemNumber: '',
    description: '',
    csiDivision: '01',
    csiDivisionName: 'General Requirements',
    scheduledValue: 0,
    workCompletedPrevious: 0,
    workCompletedThisPeriod: 0,
    materialsStored: 0,
    totalCompletedAndStored: 0,
    percentComplete: 0,
    balanceToFinish: 0,
  });

  const csiDivisions = [
    { code: '01', name: 'General Requirements' },
    { code: '02', name: 'Existing Conditions' },
    { code: '03', name: 'Concrete' },
    { code: '04', name: 'Masonry' },
    { code: '05', name: 'Metals' },
    { code: '06', name: 'Wood, Plastics, and Composites' },
    { code: '07', name: 'Thermal and Moisture Protection' },
    { code: '08', name: 'Openings' },
    { code: '09', name: 'Finishes' },
    { code: '10', name: 'Specialties' },
    { code: '11', name: 'Equipment' },
    { code: '12', name: 'Furnishings' },
    { code: '21', name: 'Fire Suppression' },
    { code: '22', name: 'Plumbing' },
    { code: '23', name: 'HVAC' },
    { code: '26', name: 'Electrical' },
    { code: '27', name: 'Communications' },
    { code: '28', name: 'Electronic Safety and Security' },
    { code: '31', name: 'Earthwork' },
    { code: '32', name: 'Exterior Improvements' },
  ];

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData(), [field]: value });
  };

  const handleSubmit = () => {
    const data = formData();
    const newItem: LineItem = {
      itemNumber: data.itemNumber || '',
      description: data.description || '',
      csiDivision: data.csiDivision || '01',
      csiDivisionName: data.csiDivisionName || '',
      scheduledValue: data.scheduledValue || 0,
      workCompletedPrevious: data.workCompletedPrevious || 0,
      workCompletedThisPeriod: data.workCompletedThisPeriod || 0,
      materialsStored: data.materialsStored || 0,
      totalCompletedAndStored:
        (data.workCompletedPrevious || 0) +
        (data.workCompletedThisPeriod || 0) +
        (data.materialsStored || 0),
      percentComplete: data.scheduledValue
        ? ((data.workCompletedPrevious || 0) + (data.workCompletedThisPeriod || 0) + (data.materialsStored || 0)) / data.scheduledValue * 100
        : 0,
      balanceToFinish: (data.scheduledValue || 0) -
        ((data.workCompletedPrevious || 0) + (data.workCompletedThisPeriod || 0) + (data.materialsStored || 0)),
    };

    props.onAdd(newItem);
  };

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Add Line Item</h2>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Item Number
              </label>
              <input
                type="text"
                value={formData().itemNumber}
                onInput={(e) => updateField('itemNumber', e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 01.01"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                CSI Division
              </label>
              <select
                value={formData().csiDivision}
                onChange={(e) => {
                  const division = csiDivisions.find(d => d.code === e.currentTarget.value);
                  updateField('csiDivision', e.currentTarget.value);
                  updateField('csiDivisionName', division?.name || '');
                }}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <For each={csiDivisions}>
                  {(division) => (
                    <option value={division.code}>
                      {division.code} - {division.name}
                    </option>
                  )}
                </For>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData().description}
              onInput={(e) => updateField('description', e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Description of work"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Value
            </label>
            <input
              type="number"
              value={formData().scheduledValue ? formData().scheduledValue! / 100 : 0}
              onInput={(e) => updateField('scheduledValue', Math.round(parseFloat(e.currentTarget.value) * 100))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
            />
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Work Completed Previous
              </label>
              <input
                type="number"
                value={formData().workCompletedPrevious ? formData().workCompletedPrevious! / 100 : 0}
                onInput={(e) => updateField('workCompletedPrevious', Math.round(parseFloat(e.currentTarget.value) * 100))}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Work Completed This Period
              </label>
              <input
                type="number"
                value={formData().workCompletedThisPeriod ? formData().workCompletedThisPeriod! / 100 : 0}
                onInput={(e) => updateField('workCompletedThisPeriod', Math.round(parseFloat(e.currentTarget.value) * 100))}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Materials Stored
              </label>
              <input
                type="number"
                value={formData().materialsStored ? formData().materialsStored! / 100 : 0}
                onInput={(e) => updateField('materialsStored', Math.round(parseFloat(e.currentTarget.value) * 100))}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div class="mt-6 flex gap-3 justify-end">
          <button
            onClick={props.onCancel}
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Add Line Item
          </button>
        </div>
      </div>
    </div>
  );
}
