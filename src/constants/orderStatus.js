
const  OrderStatus = Object.freeze ({
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
});

const StatusValues = Object.values(OrderStatus);

module.exports = {  OrderStatus, StatusValues };