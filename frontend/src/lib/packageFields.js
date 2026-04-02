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

export function createPackageForm(overrides = {}) {
  return {
    packageId: '',
    description: '',
    amount: '',
    weight: '',
    deliveryType: 'store',
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
    weight: pkg.weight ?? '',
    deliveryType: pkg.deliveryType ?? 'store',
    truckId: pkg.truckId ?? '',
    pickupLocation: pkg.pickupLocation ?? '',
    dropoffLocation: pkg.dropoffLocation ?? '',
    status: pkg.status ?? 'in_transit',
    ownerUsername: pkg.ownerUsername ?? '',
  });
}
