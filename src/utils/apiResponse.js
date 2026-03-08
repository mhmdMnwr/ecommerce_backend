// src/utils/ApiResponse.js

class ApiResponse {
    /**
     * @param {number} statusCode - HTTP Status Code (e.g., 200, 201)
     * @param {object} data - The actual payload (e.g., user object, list of orders)
     * @param {string} message - Optional success message
     * @param {object} meta - Optional pagination metadata
     */
    constructor(statusCode,message = "Success", data,  meta = null) {
        this.statusCode = statusCode;
        this.status = statusCode < 400 ? "success" : "fail";
        this.message = message;
        this.data = data;
        if (meta) {
            this.meta = meta; // Pagination info goes here
        }
    }
}

module.exports = ApiResponse;