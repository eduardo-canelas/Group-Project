export const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'lost', label: 'Lost' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const deliveryTypeOptions = [
  { value: 'store', label: 'Store' },
  { value: 'residential', label: 'Residential' },
  { value: 'return', label: 'Return' },
  { value: 'transfer', label: 'Transfer' },
];

export const priorityOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'rush', label: 'Rush' },
  { value: 'fragile', label: 'Fragile' },
  { value: 'cold_chain', label: 'Cold Chain' },
];

export function createPackageForm(overrides = {}) {
  return {
    packageId: '',
    description: '',
    amount: '',
    deliveryType: 'store',
    priority: 'standard',
    scanCode: '',
    customerName: '',
    customerPhone: '',
    deliveryWindow: '',
    deliveryInstructions: '',
    truckId: '',
    pickupLocation: '',
    dropoffLocation: '',
    status: 'in_transit',
    ownerUsername: '',
    ...overrides,
  };
}

export function mapPackageToForm(pkg) {
  return createPackageForm({
    packageId: pkg.packageId ?? '',
    description: pkg.description ?? '',
    amount: pkg.amount ?? pkg.weight ?? '',
    deliveryType: pkg.deliveryType ?? 'store',
    priority: pkg.priority ?? 'standard',
    scanCode: pkg.scanCode ?? '',
    customerName: pkg.customerName ?? '',
    customerPhone: pkg.customerPhone ?? '',
    deliveryWindow: pkg.deliveryWindow ?? '',
    deliveryInstructions: pkg.deliveryInstructions ?? '',
    truckId: pkg.truckId ?? '',
    pickupLocation: pkg.pickupLocation ?? '',
    dropoffLocation: pkg.dropoffLocation ?? '',
    status: pkg.status ?? 'in_transit',
    ownerUsername: pkg.ownerUsername ?? '',
  });
}
