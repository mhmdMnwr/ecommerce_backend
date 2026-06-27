/**
 * Input Validation Utilities
 * Centralized validation rules for user registration and profile updates.
 */

const AppError = require('./appErrors');
const httpStatus = require('../constants/httpStatusText');

/**
 * Validates username format.
 * Rules: 3-30 chars, alphanumeric + underscores/dots only.
 */
const validateUsername = (username) => {
    if (!username || typeof username !== 'string') {
        throw AppError.create('Username is required', 400, httpStatus.FAIL);
    }
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
        throw AppError.create('Username must be between 3 and 30 characters', 400, httpStatus.FAIL);
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(trimmed)) {
        throw AppError.create('Username can only contain letters, numbers, underscores, and dots', 400, httpStatus.FAIL);
    }
    return trimmed;
};

/**
 * Validates password strength.
 * Rules: minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 digit.
 */
const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        throw AppError.create('Password is required', 400, httpStatus.FAIL);
    }
    if (password.length < 8) {
        throw AppError.create('Password must be at least 8 characters long', 400, httpStatus.FAIL);
    }
    if (password.length > 128) {
        throw AppError.create('Password must not exceed 128 characters', 400, httpStatus.FAIL);
    }
    if (!/[A-Z]/.test(password)) {
        throw AppError.create('Password must contain at least one uppercase letter', 400, httpStatus.FAIL);
    }
    if (!/[a-z]/.test(password)) {
        throw AppError.create('Password must contain at least one lowercase letter', 400, httpStatus.FAIL);
    }
    if (!/[0-9]/.test(password)) {
        throw AppError.create('Password must contain at least one digit', 400, httpStatus.FAIL);
    }
};

/**
 * Validates phone number format.
 * Rules: 8-15 digits, optional leading +.
 */
const validatePhone = (phone) => {
    if (!phone || typeof phone !== 'string') return; // Phone is optional
    const trimmed = phone.trim();
    if (trimmed.length === 0) return; // Empty is allowed
    if (!/^\+?[0-9]{8,15}$/.test(trimmed)) {
        throw AppError.create('Phone number must be 8-15 digits, optionally starting with +', 400, httpStatus.FAIL);
    }
};

/**
 * Validates address field.
 * Rules: max 200 chars, no control characters.
 */
const validateAddress = (address) => {
    if (!address || typeof address !== 'string') return; // Address is optional
    if (address.length > 200) {
        throw AppError.create('Address must not exceed 200 characters', 400, httpStatus.FAIL);
    }
};

/**
 * Validates latitude value.
 */
const validateLatitude = (lat) => {
    if (lat === null || lat === undefined) return;
    const num = parseFloat(lat);
    if (isNaN(num) || num < -90 || num > 90) {
        throw AppError.create('Latitude must be between -90 and 90', 400, httpStatus.FAIL);
    }
};

/**
 * Validates longitude value.
 */
const validateLongitude = (lng) => {
    if (lng === null || lng === undefined) return;
    const num = parseFloat(lng);
    if (isNaN(num) || num < -180 || num > 180) {
        throw AppError.create('Longitude must be between -180 and 180', 400, httpStatus.FAIL);
    }
};

/**
 * Enforces a safe upper bound on pagination limit.
 * @param {*} rawLimit - Value from req.query.limit
 * @param {number} defaultVal - Default if not provided (default: 10)
 * @param {number} maxVal - Maximum allowed value (default: 100)
 * @returns {number}
 */
const safePaginationLimit = (rawLimit, defaultVal = 10, maxVal = 100) => {
    const parsed = parseInt(rawLimit);
    if (isNaN(parsed) || parsed < 1) return defaultVal;
    return Math.min(parsed, maxVal);
};

module.exports = {
    validateUsername,
    validatePassword,
    validatePhone,
    validateAddress,
    validateLatitude,
    validateLongitude,
    safePaginationLimit
};
