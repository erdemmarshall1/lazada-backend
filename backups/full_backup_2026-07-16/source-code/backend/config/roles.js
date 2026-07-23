const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

const ROLE_HIERARCHY = {
  buyer: 0,
  seller: 1,
  staff: 2,
  manager: 3,
  admin: 4,
  super_admin: 5,
};

const PERMISSIONS = {
  // Products
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_EDIT: 'product:edit',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_APPROVE: 'product:approve',
  // Orders
  ORDER_VIEW: 'order:view',
  ORDER_EDIT: 'order:edit',
  ORDER_REFUND: 'order:refund',
  ORDER_CANCEL: 'order:cancel',
  // Users
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_BAN: 'user:ban',
  // Shops
  SHOP_VIEW: 'shop:view',
  SHOP_APPROVE: 'shop:approve',
  SHOP_EDIT: 'shop:edit',
  SHOP_DELETE: 'shop:delete',
  // Finance
  FINANCE_VIEW: 'finance:view',
  FINANCE_TRANSFER: 'finance:transfer',
  FINANCE_REFUND: 'finance:refund',
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  // CMS
  CMS_VIEW: 'cms:view',
  CMS_CREATE: 'cms:create',
  CMS_EDIT: 'cms:edit',
  CMS_DELETE: 'cms:delete',
  // Admin
  ADMIN_PANEL: 'admin:panel',
  ROLE_MANAGE: 'role:manage',
  PERMISSION_MANAGE: 'permission:manage',
  AUDIT_VIEW: 'audit:view',
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
};

const ROLE_PERMISSIONS = {
  buyer: [],
  seller: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_EDIT,
    PERMISSIONS.SHOP_VIEW,
    PERMISSIONS.SHOP_EDIT,
    PERMISSIONS.FINANCE_VIEW,
  ],
  staff: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_EDIT,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.SHOP_VIEW,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.CMS_VIEW,
    PERMISSIONS.ADMIN_PANEL,
    PERMISSIONS.REPORTS_VIEW,
  ],
  manager: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_APPROVE,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_EDIT,
    PERMISSIONS.ORDER_REFUND,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.SHOP_VIEW,
    PERMISSIONS.SHOP_APPROVE,
    PERMISSIONS.SHOP_EDIT,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_TRANSFER,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.CMS_VIEW,
    PERMISSIONS.CMS_CREATE,
    PERMISSIONS.CMS_EDIT,
    PERMISSIONS.ADMIN_PANEL,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  admin: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_APPROVE,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_EDIT,
    PERMISSIONS.ORDER_REFUND,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_BAN,
    PERMISSIONS.SHOP_VIEW,
    PERMISSIONS.SHOP_APPROVE,
    PERMISSIONS.SHOP_EDIT,
    PERMISSIONS.SHOP_DELETE,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_TRANSFER,
    PERMISSIONS.FINANCE_REFUND,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.CMS_VIEW,
    PERMISSIONS.CMS_CREATE,
    PERMISSIONS.CMS_EDIT,
    PERMISSIONS.CMS_DELETE,
    PERMISSIONS.ADMIN_PANEL,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  super_admin: Object.values(PERMISSIONS),
};

const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  const perms = user.permissions && user.permissions.length > 0
    ? user.permissions
    : ROLE_PERMISSIONS[user.role] || [];
  return perms.includes(permission);
};

const hasRole = (user, minimumRole) => {
  if (!user || !minimumRole) return false;
  return (ROLE_HIERARCHY[user.role] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
};

module.exports = { ROLES, PERMISSIONS, ROLE_PERMISSIONS, ROLE_HIERARCHY, hasPermission, hasRole };