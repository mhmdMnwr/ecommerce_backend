


// config/roles.js

const ROLES = Object.freeze({
    CUSTOMER: 'customer',
    MANAGER: 'manager',
    ADMIN: 'admin'
});

// To get the array for Mongoose 'enum' validation:
const ROLE_VALUES = Object.values(ROLES);

module.exports = { ROLES, ROLE_VALUES };