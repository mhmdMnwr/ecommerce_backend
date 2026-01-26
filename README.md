# Ecommerce Backend

This is the backend API for an e-commerce application, built with Node.js, Express, and MongoDB.

## Table of Contents

- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)

## Technologies Used

- **Node.js**: JavaScript runtime environment.
- **Express**: Web framework for Node.js.
- **MongoDB**: NoSQL database used for data storage.
- **Mongoose**: ODM library for MongoDB and Node.js.
- **JWT (JSON Web Tokens)**: Used for secure authentication.
- **Bcryptjs**: Library for hashing passwords.
- **Dotenv**: Module for loading environment variables.

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- [MongoDB](https://www.mongodb.com/) installed and running locally or a cloud database URI.

### Installation

1. Clone the repository (if applicable) or navigate to the project folder.
2. Install the dependencies:

   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the root directory of the project and add the following variables:

```env
PORT=4000
MONGO_URL=mongodb://localhost:27017/your_database_name
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_token_secret_key
```

### Running the Application

To start the server in development mode (using Nodemon):

```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 4000).

## Project Structure

```
ecommerce_backend/
├── src/
│   ├── config/          # Configuration files (e.g., permissions)
│   ├── controllers/     # Route controllers (logic)
│   ├── db/              # Database connection logic
│   ├── middleware/      # Custom middleware (auth, async wrapper)
│   ├── models/          # Mongoose models (schemas)
│   ├── routes/          # API route definitions
│   ├── utils/           # Utility functions (errors, status text, JWT)
│   ├── app.js           # Main application entry point
└── package.json         # Project dependencies and scripts
```

## API Endpoints

### Users

Base URL: `/users`

| Method | Endpoint         | Description                         | Auth Header |
| :----- | :--------------- | :---------------------------------- | :--------- |
| `GET`  | `/`              | Get all users                       | Optional*  |
| `GET`  | `/me`            | Get current logged-in user          | Yes        |
| `POST` | `/register`      | Register a new user                 | No         |
| `POST` | `/login`         | User login                          | No         |
| `POST` | `/refresh-token` | Refresh access token                | No         |

### Products

Base URL: `/products`

| Method | Endpoint         | Description                                      | Auth Header |
| :----- | :--------------- | :----------------------------------------------- | :---------- |
| `GET`  | `/`              | Get all products (supports query: `name`)        | No          |
| `GET`  | `/:id`           | Get a single product                             | No          |
| `POST` | `/`              | Create a new product                             | No*         |
| `PATCH`| `/:id`           | Update a product                                 | No*         |
| `DELETE`| `/:id`          | Delete a product                                 | No*         |

\* *Note: Auth requirements for products depend on your implementation (currently open based on code).*

**Product Schema:**
```json
{
  "name": "String",
  "price": "Number",
  "image": "String (URL)",
  "state": "String ('available' | 'not available')"
}
```

**Note:** Check specific route implementation for required fields in the request body (e.g., `email`, `password`, `updated` fields for registration).

## Error Handling

The application uses a global error handler middleware. API responses for errors typically follow this structure:

```json
{
  "status": "error" | "fail",
  "message": "Error description",
  "code": 500,
  "data": null
}
```

- **FAIL**: Operational errors (e.g., validation failed).
- **ERROR**: Internal server errors.




changes in the front 
the username password insted of email password 

consider the permissions feature i added 

remember to handle the logic of creation 
because anyone can create any user role 