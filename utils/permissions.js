const permissionsMap = require('../config/permissionsMap');

const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === 'super admin') return 'Super Admin';
  if (normalized === 'manager') return 'Manager';
  if (normalized === 'staff') return 'Staff';
  return null;
};

exports.getDisplayPermissions = (role) => {
  const normalized = normalizeRole(role);
  if (!normalized) return permissionsMap.Staff;
  return permissionsMap[normalized];
};

exports.hasPermission = (role, permission) => {
  const perms = exports.getDisplayPermissions(role);
  return perms[permission] || false;
};

exports.canAccessRoute = (role, route) => {
  const routePermissions = {
    '/admin/dashboard': 'View Bookings',
    '/admin/bookings': 'View Bookings',
    '/admin/services': 'Manage Services',
    '/admin/customers': 'Manage Customers',
    '/admin/contacts': 'Manage Customers',
    '/admin/gallery': 'Manage Gallery',
    '/admin/reviews': 'Manage Reviews',
    '/admin/team': 'Manage Team',
    '/admin/promotion-bookings': 'Manage Promotion Bookings',
    '/admin/promo-codes': 'Manage Promotion Bookings',
    '/admin/reports': 'View Reports',
    '/admin/admin-users': 'Manage Admins',
    '/admin/settings': 'Manage Settings',
    '/admin/legal': 'Manage Settings',  
  };
  const permission = routePermissions[route];
  if (!permission) return true;  
  return exports.hasPermission(role, permission);
};