/**
 * Escapes special regex characters in a string so it can be safely
 * used inside a MongoDB $regex query without ReDoS or injection risk.
 *
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for $regex
 */
const escapeRegex = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };
