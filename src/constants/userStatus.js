const UserStatus = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive'
});
const StatusValues = Object.values(UserStatus);

module.exports = { UserStatus, StatusValues };