const PERMISSIONS = {
    DASHBOARD: 'dashboard',
    CATEGORIES: 'categories',
    PRODUCTS: 'products',
    BRANDS: 'brands',
    ORDERS: 'orders',
    FEEDBACKS: 'feedbacks',
    CLIENTS: 'clients',
    ADMINS: 'admins'
};

const PERMISSION_LIST = Object.values(PERMISSIONS);

module.exports = {
    PERMISSIONS,
    PERMISSION_LIST
};
