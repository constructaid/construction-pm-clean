/**
 * Material Delivery Coordination Form
 * Schedule and track material deliveries
 */
import { createSignal, Show } from 'solid-js';

interface MaterialDeliveryFormProps {
  projectId: number;
  deliveryNumber?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MaterialDeliveryForm(props: MaterialDeliveryFormProps) {
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  // Material details
  const [materialDescription, setMaterialDescription] = createSignal('');
  const [quantity, setQuantity] = createSignal('');
  const [unit, setUnit] = createSignal('');
  const [purchaseOrder, setPurchaseOrder] = createSignal('');

  // Supplier
  const [supplier, setSupplier] = createSignal('');
  const [supplierContact, setSupplierContact] = createSignal('');
  const [supplierPhone, setSupplierPhone] = createSignal('');

  // Schedule
  const [scheduledDate, setScheduledDate] = createSignal('');
  const [scheduledTime, setScheduledTime] = createSignal('');
  const [actualDeliveryDate, setActualDeliveryDate] = createSignal('');
  const [actualDeliveryTime, setActualDeliveryTime] = createSignal('');

  // Location
  const [deliveryLocation, setDeliveryLocation] = createSignal('');
  const [storageLocation, setStorageLocation] = createSignal('');

  // Status
  const [status, setStatus] = createSignal('scheduled');

  // Receiving
  const [receivedBy, setReceivedBy] = createSignal('');
  const [receivedDate, setReceivedDate] = createSignal('');
  const [quantityReceived, setQuantityReceived] = createSignal('');
  const [qualityInspection, setQualityInspection] = createSignal(false);
  const [inspectionNotes, setInspectionNotes] = createSignal('');
  const [damageReported, setDamageReported] = createSignal(false);
  const [damageDescription, setDamageDescription] = createSignal('');

  // Coordination
  const [specialInstructions, setSpecialInstructions] = createSignal('');
  const [notes, setNotes] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!materialDescription()) {
      setError('Material description is required');
      return;
    }

    if (!quantity()) {
      setError('Quantity is required');
      return;
    }

    if (!supplier()) {
      setError('Supplier is required');
      return;
    }

    if (!scheduledDate()) {
      setError('Scheduled date is required');
      return;
    }

    if (!deliveryLocation()) {
      setError('Delivery location is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const deliveryData = {
        projectId: props.projectId,
        deliveryNumber: props.deliveryNumber || `MD-${Date.now()}`,
        purchaseOrder: purchaseOrder(),

        // Material
        materialDescription: materialDescription(),
        quantity: quantity(),
        unit: unit(),

        // Supplier
        supplier: supplier(),
        supplierContact: supplierContact(),
        supplierPhone: supplierPhone(),

        // Schedule
        scheduledDate: new Date(scheduledDate()).toISOString(),
        scheduledTime: scheduledTime(),
        actualDeliveryDate: actualDeliveryDate() ? new Date(actualDeliveryDate()).toISOString() : null,
        actualDeliveryTime: actualDeliveryTime(),

        // Location
        deliveryLocation: deliveryLocation(),
        storageLocation: storageLocation(),

        // Status
        status: status(),

        // Receiving
        receivedBy: receivedBy(),
        receivedDate: receivedDate() ? new Date(receivedDate()).toISOString() : null,
        quantityReceived: quantityReceived(),

        // Quality
        qualityInspection: qualityInspection(),
        inspectionNotes: inspectionNotes(),
        damageReported: damageReported(),
        damageDescription: damageDescription(),

        // Notes
        specialInstructions: specialInstructions(),
        notes: notes(),
      };

      const response = await fetch('/api/field/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save delivery');
      }

      if (props.onSuccess) {
        props.onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {/* Header */}
      <div class="bg-orange-50 border-l-4 border-orange-600 p-4 rounded-lg">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-orange-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-semibold text-orange-900">Material Delivery Coordination</h3>
            <p class="text-sm text-orange-800 mt-1">
              Schedule and track material deliveries and quality inspections
            </p>
          </div>
        </div>
      </div>

      <Show when={error()}>
        <div class="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
          <p class="text-sm text-red-800">{error()}</p>
        </div>
      </Show>

      {/* Material Information */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Material Details</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-300 mb-1">Material Description *</label>
            <textarea
              value={materialDescription()}
              onInput={(e) => setMaterialDescription(e.currentTarget.value)}
              rows={2}
              placeholder="Detailed description of material..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Quantity *</label>
            <input
              type="text"
              value={quantity()}
              onInput={(e) => setQuantity(e.currentTarget.value)}
              placeholder="e.g., 100"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Unit</label>
            <input
              type="text"
              value={unit()}
              onInput={(e) => setUnit(e.currentTarget.value)}
              placeholder="e.g., cubic yards, tons, each"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-300 mb-1">Purchase Order Number</label>
            <input
              type="text"
              value={purchaseOrder()}
              onInput={(e) => setPurchaseOrder(e.currentTarget.value)}
              placeholder="PO number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Supplier Information */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Supplier Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Supplier Name *</label>
            <input
              type="text"
              value={supplier()}
              onInput={(e) => setSupplier(e.currentTarget.value)}
              placeholder="Supplier company name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Contact Person</label>
            <input
              type="text"
              value={supplierContact()}
              onInput={(e) => setSupplierContact(e.currentTarget.value)}
              placeholder="Contact name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={supplierPhone()}
              onInput={(e) => setSupplierPhone(e.currentTarget.value)}
              placeholder="(555) 123-4567"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Delivery Schedule */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Delivery Schedule</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Scheduled Date *</label>
            <input
              type="date"
              value={scheduledDate()}
              onInput={(e) => setScheduledDate(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Scheduled Time</label>
            <input
              type="time"
              value={scheduledTime()}
              onInput={(e) => setScheduledTime(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Actual Delivery Date</label>
            <input
              type="date"
              value={actualDeliveryDate()}
              onInput={(e) => setActualDeliveryDate(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Actual Time</label>
            <input
              type="time"
              value={actualDeliveryTime()}
              onInput={(e) => setActualDeliveryTime(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Delivery Status</label>
          <select
            value={status()}
            onInput={(e) => setStatus(e.currentTarget.value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="scheduled">Scheduled</option>
            <option value="delivered">Delivered</option>
            <option value="partial">Partial Delivery</option>
            <option value="delayed">Delayed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Location */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Delivery Location</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-300 mb-1">Delivery Location *</label>
            <textarea
              value={deliveryLocation()}
              onInput={(e) => setDeliveryLocation(e.currentTarget.value)}
              rows={2}
              placeholder="Where should material be delivered on site..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-300 mb-1">Storage Location</label>
            <input
              type="text"
              value={storageLocation()}
              onInput={(e) => setStorageLocation(e.currentTarget.value)}
              placeholder="Final storage location"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Receiving Information */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Receiving & Quality Control</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Received By</label>
            <input
              type="text"
              value={receivedBy()}
              onInput={(e) => setReceivedBy(e.currentTarget.value)}
              placeholder="Name of person receiving"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Received Date</label>
            <input
              type="date"
              value={receivedDate()}
              onInput={(e) => setReceivedDate(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-300 mb-1">Quantity Received</label>
            <input
              type="text"
              value={quantityReceived()}
              onInput={(e) => setQuantityReceived(e.currentTarget.value)}
              placeholder="Actual quantity received"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div class="space-y-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={qualityInspection()}
              onChange={(e) => setQualityInspection(e.currentTarget.checked)}
              class="w-4 h-4 text-orange-600 rounded"
            />
            <span class="text-sm font-medium text-gray-300">Quality Inspection Performed</span>
          </label>

          <Show when={qualityInspection()}>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Inspection Notes</label>
              <textarea
                value={inspectionNotes()}
                onInput={(e) => setInspectionNotes(e.currentTarget.value)}
                rows={3}
                placeholder="Quality inspection findings..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </Show>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={damageReported()}
              onChange={(e) => setDamageReported(e.currentTarget.checked)}
              class="w-4 h-4 text-red-600 rounded"
            />
            <span class="text-sm font-medium text-gray-300">Damage Reported</span>
          </label>

          <Show when={damageReported()}>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Damage Description</label>
              <textarea
                value={damageDescription()}
                onInput={(e) => setDamageDescription(e.currentTarget.value)}
                rows={3}
                placeholder="Description of damage..."
                class="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </Show>
        </div>
      </div>

      {/* Additional Information */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Additional Information</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Special Instructions</label>
            <textarea
              value={specialInstructions()}
              onInput={(e) => setSpecialInstructions(e.currentTarget.value)}
              rows={3}
              placeholder="Special delivery instructions, access requirements, equipment needed, etc..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <textarea
              value={notes()}
              onInput={(e) => setNotes(e.currentTarget.value)}
              rows={3}
              placeholder="Additional notes..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div class="flex justify-end gap-3 pt-6 border-t border-gray-700">
        <Show when={props.onCancel}>
          <button
            type="button"
            onClick={props.onCancel}
            class="px-6 py-2.5 border border-gray-300 text-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            disabled={isSubmitting()}
          >
            Cancel
          </button>
        </Show>
        <button
          type="submit"
          class="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50"
          disabled={isSubmitting()}
        >
          {isSubmitting() ? 'Saving...' : 'Save Delivery'}
        </button>
      </div>
    </form>
  );
}
