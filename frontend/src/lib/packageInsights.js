const statusOrder = ['pending', 'picked_up', 'in_transit', 'delivered', 'returned', 'lost', 'cancelled'];
const activeStatuses = new Set(['pending', 'picked_up', 'in_transit']);
const exceptionStatuses = new Set(['pending', 'returned', 'lost', 'cancelled']);

export function formatStatusLabel(status) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getStatusCounts(packages) {
  return statusOrder.map((status) => ({
    status,
    label: formatStatusLabel(status),
    count: packages.filter((pkg) => pkg.status === status).length,
  }));
}

export function getDeliveryMix(packages) {
  const totals = packages.reduce((accumulator, pkg) => {
    const key = pkg.deliveryType || 'store';
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(totals)
    .map(([type, count]) => ({
      type,
      count,
    }))
    .sort((left, right) => right.count - left.count);
}

export function getPriorityPackages(packages) {
  return packages
    .filter((pkg) => ['pending', 'lost', 'cancelled', 'returned'].includes(pkg.status))
    .slice(0, 4);
}

export function getDriverLeaderboard(packages) {
  const byDriver = new Map();

  packages.forEach((pkg) => {
    const key = pkg.ownerUsername || 'Unassigned';
    const current = byDriver.get(key) || {
      driver: key,
      packages: 0,
      delivered: 0,
      active: 0,
    };

    current.packages += 1;
    current.delivered += pkg.status === 'delivered' ? 1 : 0;
    current.active += ['pending', 'picked_up', 'in_transit'].includes(pkg.status) ? 1 : 0;

    byDriver.set(key, current);
  });

  return Array.from(byDriver.values()).sort((left, right) => right.packages - left.packages);
}

export function formatRelativeTime(timestamp) {
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) {
    return 'Unknown';
  }

  const diffMs = Date.now() - value;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    return `${Math.max(1, Math.round(diffMs / minute))} min ago`;
  }

  if (diffMs < day) {
    return `${Math.max(1, Math.round(diffMs / hour))} hr ago`;
  }

  const days = Math.max(1, Math.round(diffMs / day));
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function getDriverActionQueue(packages) {
  return packages
    .map((pkg) => {
      const ageHours = Math.max(0, (Date.now() - new Date(pkg.updatedAt || pkg.createdAt || Date.now()).getTime()) / (1000 * 60 * 60));
      const priority =
        pkg.status === 'lost'
          ? 'critical'
          : pkg.status === 'returned' || pkg.status === 'cancelled'
            ? 'high'
            : pkg.status === 'pending'
              ? 'medium'
              : ageHours >= 12
                ? 'medium'
                : 'low';

      let title = 'Keep shipment moving';
      let detail = 'This shipment is active and should get its next scan on time.';

      if (pkg.status === 'pending') {
        title = 'Confirm pickup handoff';
        detail = 'This load is still pending. A fast pickup scan prevents it from looking lost to dispatch.';
      } else if (pkg.status === 'lost') {
        title = 'Recover lost shipment';
        detail = 'Verify the last known truck or stop and update dispatch immediately.';
      } else if (pkg.status === 'returned') {
        title = 'Resolve returned load';
        detail = 'Dispatch needs a reroute or closure decision for this shipment.';
      } else if (pkg.status === 'cancelled') {
        title = 'Close cancelled shipment';
        detail = 'Update the record so inventory and dispatch stay aligned.';
      } else if (ageHours >= 12 && activeStatuses.has(pkg.status)) {
        title = 'Refresh shipment status';
        detail = 'This active load has not been updated recently and may trigger customer questions.';
      }

      return {
        id: pkg._id,
        packageId: pkg.packageId || 'Legacy record',
        title,
        detail,
        priority,
        route: `${pkg.pickupLocation || 'Origin'} -> ${pkg.dropoffLocation || 'Destination'}`,
        updatedAtLabel: formatRelativeTime(pkg.updatedAt || pkg.createdAt),
      };
    })
    .filter((item) => item.priority !== 'low')
    .sort((left, right) => {
      const priorityRank = { critical: 3, high: 2, medium: 1, low: 0 };
      return priorityRank[right.priority] - priorityRank[left.priority];
    })
    .slice(0, 4);
}

export function getDriverMomentum(packages) {
  const activeCount = packages.filter((pkg) => activeStatuses.has(pkg.status)).length;
  const deliveredCount = packages.filter((pkg) => pkg.status === 'delivered').length;
  const exceptionCount = packages.filter((pkg) => exceptionStatuses.has(pkg.status)).length;
  const staleCount = packages.filter((pkg) => {
    const value = new Date(pkg.updatedAt || pkg.createdAt || Date.now()).getTime();
    return activeStatuses.has(pkg.status) && Date.now() - value > 12 * 60 * 60 * 1000;
  }).length;

  return [
    { label: 'Active loads', value: activeCount, tone: 'accent' },
    { label: 'Delivered', value: deliveredCount, tone: 'success' },
    { label: 'Needs attention', value: exceptionCount, tone: exceptionCount > 0 ? 'danger' : 'accent' },
    { label: 'Stale updates', value: staleCount, tone: staleCount > 0 ? 'danger' : 'neutral' },
  ];
}

export function getSuggestedStatuses(status) {
  const nextSteps = {
    pending: ['picked_up', 'in_transit'],
    picked_up: ['in_transit', 'delivered'],
    in_transit: ['delivered', 'returned'],
    returned: ['in_transit', 'cancelled'],
    lost: ['in_transit', 'cancelled'],
    cancelled: ['pending'],
    delivered: [],
  };

  return nextSteps[status] || [];
}
