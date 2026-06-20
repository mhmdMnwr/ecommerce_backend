const Notification = require('../models/notification.model');

/**
 * Creates a notification for a user.
 * @param {string} userId - The user's ObjectId
 * @param {object} params - { title, message, type, orderId }
 */
const createNotification = async (userId, { title, message, type = 'general', orderId = null }) => {
    try {
        const notification = new Notification({
            userId,
            orderId,
            title,
            message,
            type
        });
        await notification.save();
        return notification;
    } catch (err) {
        // Notification creation should never block the main flow
        console.error('Failed to create notification:', err.message);
        return null;
    }
};

module.exports = { createNotification };
