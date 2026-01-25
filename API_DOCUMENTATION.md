# Grocery E-Commerce API Documentation

**Base URL:** `http://localhost:{PORT}`

---

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Response Format

All responses follow this structure:
```json
{
  "status": "success" | "fail" | "error",
  "data": { ... } | null,
  "message": "Error message (only on errors)",
  "code": 400 (only on errors)
}
```

---

## Users Endpoints

### 1. Register User
**POST** `/users/register`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Unique username |
| email | string | Yes | Unique email address |
| password | string | Yes | User password |
| role | string | No | `admin`, `customer`, or `sup_admin` (default: `customer`) |

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 2. Login
**POST** `/users/login`

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 3. Refresh Token
**POST** `/users/refresh-token`

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| token | string | Yes | The refresh token |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 4. Get Current User 🔒
**GET** `/users/me`

> Requires Authentication

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "customer",
    "permissions": [],
    "createdAt": "2026-01-25T..."
  }
}
```

---

### 5. Verify Permission 🔒
**POST** `/users/verify-permission`

> Requires Authentication

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| page | string | Yes | The page/permission name to check |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "hasPermission": true
  }
}
```

---

### 6. Get All Users
**GET** `/users`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 10 | Number of users per page |
| page | number | 1 | Page number |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "users": [...]
  }
}
```

---

## Products Endpoints

### 1. Get All Products
**GET** `/products`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 10 | Number of products per page |
| page | number | 1 | Page number |
| name | string | - | Search by product name (case-insensitive) |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "_id": "...",
        "name": "Fresh Apples",
        "price": 3.99,
        "image": "https://...",
        "brand": "Farm Fresh",
        "category": "Fruits",
        "units_num": 100,
        "state": "available"
      }
    ]
  }
}
```

---

### 2. Get Single Product
**GET** `/products/:id`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "product": {
      "_id": "...",
      "name": "Fresh Apples",
      "price": 3.99,
      "image": "https://...",
      "brand": "Farm Fresh",
      "category": "Fruits",
      "units_num": 100,
      "state": "available"
    }
  }
}
```

---

### 3. Create Product
**POST** `/products`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | **Yes** | Product name |
| price | number | **Yes** | Product price |
| units_num | number | **Yes** | Available stock |
| image | string | No | Image URL |
| brand | string | No | Brand name |
| category | string | No | Product category |
| state | string | No | `available` or `not available` (default: `available`) |

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "product": {
      "_id": "...",
      "name": "Organic Milk",
      "price": 4.99,
      "units_num": 50,
      "state": "available"
    }
  }
}
```

---

### 4. Update Product
**PATCH** `/products/:id`

**Request Body:** Any product field you want to update

**Example:**
```json
{
  "price": 5.99,
  "units_num": 75
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "product": { ... }
  }
}
```

---

### 5. Delete Product
**DELETE** `/products/:id`

**Response (200):**
```json
{
  "status": "success",
  "data": null
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 400 | FAIL | Bad request / Validation error |
| 401 | FAIL | Unauthorized / Invalid token |
| 404 | FAIL | Resource not found |
| 500 | ERROR | Internal server error |

---

## Product Categories

- Fruits
- Vegetables
- Dairy
- Meat
- Seafood
- Bakery
- Beverages
- Pantry
- Frozen
- Snacks
- Condiments

---

## User Roles

| Role | Description |
|------|-------------|
| `customer` | Regular user (default) |
| `admin` | Administrator with specific permissions |
| `sup_admin` | Super admin with all permissions |
