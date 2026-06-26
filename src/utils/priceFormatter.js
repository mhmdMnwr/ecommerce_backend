/**
 * Price Formatter Middleware
 * Ensures all monetary fields in JSON responses are formatted with exactly 2 decimal places.
 * 
 * Since JSON numbers don't preserve trailing zeros (80.00 becomes 80),
 * this middleware overrides res.json to post-process the serialized JSON string,
 * ensuring price fields always appear as n.XX format.
 */

// Fields that should always have 2 decimal places regardless of context
const PRICE_FIELDS = new Set([
    'price', 
    'totalAmount', 
    'totalRevenue', 
    'totalSpent', 
    'minOrderAmount',
    'revenue',     // revenue report aggregation field
]);

/**
 * Recursively formats all price fields in a plain object to have 2 decimal places.
 * Uses marker strings that get replaced in the final JSON output.
 * IMPORTANT: This must only be called on plain JS objects (not Mongoose documents).
 */
function formatPriceFields(obj) {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map((item) => formatPriceFields(item));
    }

    if (typeof obj === 'object') {
        const formatted = {};
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            const isPrice = PRICE_FIELDS.has(key) && typeof value === 'number';
            
            if (isPrice) {
                // Use a special marker string that we'll convert back
                formatted[key] = `__PRICE__${value.toFixed(2)}__PRICE__`;
            } else if (typeof value === 'object' && value !== null) {
                formatted[key] = formatPriceFields(value);
            } else {
                formatted[key] = value;
            }
        }
        return formatted;
    }

    return obj;
}

/**
 * Express middleware that overrides res.json to ensure all price fields
 * are serialized with exactly 2 decimal places (n.XX format).
 */
function priceFormatterMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
        if (body && typeof body === 'object') {
            // First, convert to plain JS objects so Mongoose toJSON() transforms run.
            // This ensures _id, virtuals, and all fields are properly serialized.
            const plain = JSON.parse(JSON.stringify(body));
            const formatted = formatPriceFields(plain);
            let jsonString = JSON.stringify(formatted);
            // Replace marker strings with raw numbers that have 2 decimal places
            jsonString = jsonString.replace(/"__PRICE__([\d.-]+)__PRICE__"/g, '$1');
            res.set('Content-Type', 'application/json');
            return res.send(jsonString);
        }
        return originalJson(body);
    };

    next();
}

module.exports = priceFormatterMiddleware;
