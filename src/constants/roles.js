




const Roles = Object.freeze({
    CUSTOMER: 'customer',
    MANAGER: 'manager',
    ADMIN: 'admin'
});

// To get the array for Mongoose 'enum' validation:
const RoleValues = Object.values(Roles);

module.exports = { Roles, RoleValues };