# Leapback E-Quotation Portal

## Overview

This project helps businesses manage their entire sales quotation and invoicing process from start to finish. It lets you create and track quotes, automatically convert approved quotes into invoices, deduct inventory, and even send professional PDFs directly to clients, all while keeping your client and product data organized.

## Features

- **Secure Authentication**: Staff can securely log in and manage accounts, ensuring data integrity and access control.
- **Client Relationship Management**: Easily add, view, update, and manage your client details, along with their historical quotes and invoices.
- **Comprehensive Inventory Control**: Maintain a detailed catalog of products and services, including stock levels, unit prices, and low stock alerts. Products are automatically deducted from inventory upon invoice generation.
- **Streamlined Quote Workflow**: Create new quotes with items from your inventory or through manual entry, save them as drafts, submit them for client review, and manage approval, rejection, or cancellation statuses.
- **Automated Invoice Generation**: Seamlessly convert approved quotes into professional invoices, complete with unique numbering, VAT calculations, and custom notes.
- **Professional PDF Generation & Emailing**: Automatically generates branded PDF documents for both quotes and invoices, and emails them directly to clients for a smooth communication process.
- **Invoice Tracking**: Mark invoices as paid or cancelled, track due dates, and resend invoices as needed, maintaining a clear financial record.
- **Dashboard Overview**: Get a quick glance at key business metrics, including total sales, current quote statuses, and critical low stock alerts, helping you stay on top of your operations.
- **Robust Security**: Implemented with measures like rate limiting, CORS protection, and HTTP header security to keep your data safe and endpoints protected.

## Getting Started

Follow these steps to get the Leapback E-Quotation Portal up and running on your local machine.

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/VishTech-Integrated-Innovation-LTD/leapback-project.git
    cd leapback-project
    ```

2.  **Install Client Dependencies**:
    Navigate into the `client` directory and install the required npm packages.
    ```bash
    cd client
    npm install
    cd ..
    ```

3.  **Install Server Dependencies**:
    Navigate into the `server` directory and install its npm packages.
    ```bash
    cd server
    npm install
    cd ..
    ```

### Environment Variables

You'll need to set up environment variables for both the server and the client. Create `.env` files in the respective directories.

1.  **Server Environment Variables** (`leapback-project/server/.env`):
    Create a `.env` file in the `server` directory and populate it with the following:
    ```env
    PORT=5000
    NODE_ENV=development

    # PostgreSQL Database Configuration
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=leapback_db

    # JSON Web Token Secret (make this a very strong, random string!)
    JWT_SECRET_KEY=your_super_strong_and_secret_jwt_key

    # Frontend URL for CORS configuration
    VITE_FRONTEND_URL=http://localhost:5173

    # Email Service Configuration (e.g., Gmail, Brevo, SendGrid)
    # For Gmail, you'll need an App Password (search "Gmail App Passwords")
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587 # Use 465 for SSL, 587 for STARTTLS
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_email_app_password
    EMAIL_FROM="Leapback Sales <noreply@leapback.ng>" # Sender displayed in emails

    # Company Details (for PDF generation and email templates)
    COMPANY_NAME="Leapback"
    COMPANY_ADDRESS="123 Innovation Drive, Abuja, Nigeria"
    COMPANY_EMAIL="info@leapback.ng"
    COMPANY_PHONE="+234-813-000-2778"
    COMPANY_BANK="GTBank"
    COMPANY_ACCOUNT="0123456789"
    INVOICE_FOOTER="Thank you for your business."
    ```

2.  **Client Environment Variables** (`leapback-project/client/.env`):
    Create a `.env` file in the `client` directory and add the backend API URL:
    ```env
    VITE_API_BASE_URL=http://localhost:5000 # Matches your server's PORT
    ```
    *Note: The client uses `axios` for API calls. If you encounter issues, ensure `client/src/lib/axios.ts` is correctly configured to use `VITE_API_BASE_URL` from `import.meta.env` for its `baseURL` and includes interceptors for JWT token attachment and 401 error handling.*

### Database Setup

Ensure you have a PostgreSQL database server running. Then, from the `server` directory, run the database migrations:

```bash
cd server
npx sequelize-cli db:migrate
cd ..
```

### Usage

1.  **Start the Backend Server**:
    From the `server` directory:
    ```bash
    cd server
    npm run server # For development with hot-reloading (uses nodemon)
    # Or for a production-like environment:
    # npm start
    ```
    You should see console messages indicating the API is running on port 5000.

2.  **Start the Frontend Client**:
    From the `client` directory:
    ```bash
    cd client
    npm run dev
    ```
    Vite will start the development server, usually on `http://localhost:5173`.

Once both the client and server are running, open your browser and navigate to `http://localhost:5173`. You'll be greeted by the login page.

**To get started:**
-   You can register a new admin user by hitting the `/auth/register` endpoint directly with a tool like Postman or Insomnia, providing a `name`, `email`, and `password`.
-   Once logged in, you can explore the dashboard, manage clients, add inventory items, create quotes, and generate invoices through the intuitive user interface.

## API Documentation

The backend API provides a robust set of endpoints to manage all aspects of the e-quotation portal.

### Base URL
`http://localhost:5000` (or your configured `PORT`)

### Endpoints

#### POST /auth/register
Registers a new staff member (admin user) with the system.

**Request**:
```json
{
  "name": "New Staff Member",
  "email": "staff@example.com",
  "password": "securepassword123"
}
```

**Response**:
```json
{
  "message": "Staff member created successfully",
  "user": {
    "id": "uuid-of-new-user",
    "name": "New Staff Member",
    "email": "staff@example.com",
    "userType": "admin",
    "isActive": true
  }
}
```

**Errors**:
-   400: Name, email, and password are required; password must be at least 8 characters.
-   409: A staff member with that email already exists.
-   500: Internal Server Error.

#### POST /auth/login
Authenticates a staff member and returns a JWT token for subsequent protected requests.

**Request**:
```json
{
  "email": "admin@leapback.ng",
  "password": "strongpassword"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-of-user",
    "name": "Admin User",
    "email": "admin@leapback.ng",
    "userType": "admin"
  }
}
```

**Errors**:
-   400: Email and password are required.
-   401: Invalid credentials.
-   403: Your account is inactive.
-   429: Too many login attempts (rate limit).
-   500: Internal Server Error.

---

#### GET /users
(Protected) Retrieves a list of all staff members (users) in the system.

**Request**:
`GET /users` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Users retrieved successfully",
  "count": 2,
  "users": [
    {
      "id": "uuid-1",
      "name": "Admin User",
      "email": "admin@leapback.ng",
      "userType": "admin",
      "isActive": true,
      "lastLoginAt": "2024-07-20T10:00:00.000Z",
      "createdAt": "2024-07-10T08:00:00.000Z",
      "updatedAt": "2024-07-20T10:00:00.000Z"
    }
  ]
}
```

**Errors**:
-   401: Invalid or expired token.
-   500: Internal Server Error.

#### GET /users/:id
(Protected) Retrieves details for a specific staff member by their ID.

**Request**:
`GET /users/uuid-of-user` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "User retrieved successfully",
  "user": {
    "id": "uuid-of-user",
    "name": "Admin User",
    "email": "admin@leapback.ng",
    "userType": "admin",
    "isActive": true,
    "lastLoginAt": "2024-07-20T10:00:00.000Z",
    "createdAt": "2024-07-10T08:00:00.000Z",
    "updatedAt": "2024-07-20T10:00:00.000Z"
  }
}
```

**Errors**:
-   400: Invalid or missing user ID.
-   401: Invalid or expired token.
-   404: User not found.
-   500: Internal Server Error.

#### PUT /users/:id
(Protected) Updates the details of a specific staff member.

**Request**:
```json
{
  "name": "Updated Staff Name",
  "email": "updated@example.com",
  "password": "newstrongpassword",
  "isActive": false
}
```

**Response**:
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid-of-user",
    "name": "Updated Staff Name",
    "email": "updated@example.com",
    "userType": "admin",
    "isActive": false
  }
}
```

**Errors**:
-   400: Invalid or missing user ID; password must be at least 8 characters.
-   401: Invalid or expired token.
-   404: User not found.
-   409: A staff member with that email already exists.
-   500: Internal Server Error.

#### DELETE /users/:id
(Protected) Permanently removes a staff member from the database.

**Request**:
`DELETE /users/uuid-of-user` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Staff member 'Admin User' deleted successfully"
}
```

**Errors**:
-   400: Invalid or missing user ID.
-   401: Invalid or expired token.
-   404: User not found.
-   500: Internal Server Error (e.g., if user has associated records that prevent deletion).

---

#### GET /clients
(Protected) Retrieves a list of all clients, with optional search functionality.

**Request**:
`GET /clients?search=nexus` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Clients retrieved successfully",
  "count": 1,
  "clients": [
    {
      "id": "uuid-of-client",
      "clientName": "Nexus Energy Ltd",
      "contactPerson": "John Doe",
      "email": "john@nexus.com",
      "phone": "+2348012345678",
      "address": "123 Main St, Abuja",
      "createdAt": "2024-07-15T09:00:00.000Z",
      "updatedAt": "2024-07-15T09:00:00.000Z"
    }
  ]
}
```

**Errors**:
-   401: Invalid or expired token.
-   500: Internal Server Error.

#### POST /clients
(Protected) Creates a new client record.

**Request**:
```json
{
  "clientName": "New Client Corp",
  "email": "new.client@corp.com",
  "contactPerson": "Jane Smith",
  "phone": "+2349012345678",
  "address": "456 Market St, Lagos"
}
```

**Response**:
```json
{
  "message": "Client created successfully",
  "client": {
    "id": "uuid-of-new-client",
    "clientName": "New Client Corp",
    "email": "new.client@corp.com",
    "contactPerson": "Jane Smith",
    "phone": "+2349012345678",
    "address": "456 Market St, Lagos",
    "createdAt": "2024-07-21T11:30:00.000Z",
    "updatedAt": "2024-07-21T11:30:00.000Z"
  }
}
```

**Errors**:
-   400: Client name and email are required.
-   401: Invalid or expired token.
-   409: A client with that email already exists.
-   500: Internal Server Error.

#### GET /clients/:id
(Protected) Retrieves details for a specific client, including their associated quotes and invoices, and total spend.

**Request**:
`GET /clients/uuid-of-client` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Client retrieved successfully",
  "client": {
    "id": "uuid-of-client",
    "clientName": "Nexus Energy Ltd",
    "contactPerson": "John Doe",
    "email": "john@nexus.com",
    "phone": "+2348012345678",
    "address": "123 Main St, Abuja",
    "createdAt": "2024-07-15T09:00:00.000Z",
    "updatedAt": "2024-07-15T09:00:00.000Z"
  },
  "stats": {
    "totalQuotes": 3,
    "totalInvoices": 2,
    "totalSpend": 1500000.00
  },
  "quotes": [
    {
      "id": "uuid-of-quote-1",
      "quoteNumber": "QT-001",
      "status": "approved",
      "grandTotal": 750000.00,
      "createdAt": "2024-07-16T10:00:00.000Z"
    }
  ],
  "invoices": [
    {
      "id": "uuid-of-invoice-1",
      "invoiceNumber": "INV-001",
      "status": "paid",
      "grandTotal": 750000.00,
      "createdAt": "2024-07-17T11:00:00.000Z"
    }
  ]
}
```

**Errors**:
-   400: Invalid or missing ID.
-   401: Invalid or expired token.
-   404: Client not found.
-   500: Internal Server Error.

#### PUT /clients/:id
(Protected) Updates details for a specific client.

**Request**:
```json
{
  "contactPerson": "Jane Doe",
  "phone": "+2348123456789"
}
```

**Response**:
```json
{
  "message": "Client details updated successfully",
  "client": {
    "id": "uuid-of-client",
    "clientName": "Nexus Energy Ltd",
    "contactPerson": "Jane Doe",
    "email": "john@nexus.com",
    "phone": "+2348123456789",
    "address": "123 Main St, Abuja",
    "createdAt": "2024-07-15T09:00:00.000Z",
    "updatedAt": "2024-07-21T11:45:00.000Z"
  }
}
```

**Errors**:
-   400: Invalid or missing ID.
-   401: Invalid or expired token.
-   404: Client not found.
-   409: A client with that email already exists.
-   500: Internal Server Error.

#### DELETE /clients/:id
(Protected) Permanently removes a client. This will fail if the client has existing quotes or invoices.

**Request**:
`DELETE /clients/uuid-of-client` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Client \"Nexus Energy Ltd\" deleted successfully"
}
```

**Errors**:
-   400: Invalid or missing ID; Cannot delete client - they have N quote(s) on record.
-   401: Invalid or expired token.
-   404: Client not found.
-   500: Internal Server Error.

---

#### GET /inventory
(Protected) Retrieves a list of all active inventory items, with optional search and filters.

**Request**:
`GET /inventory?search=solar&category=Solar&type=product` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Inventory retrieved successfully",
  "count": 1,
  "items": [
    {
      "id": "uuid-of-item",
      "name": "Solar Panel 400W",
      "itemCode": "SP-400W",
      "type": "product",
      "category": "Solar",
      "unitPrice": 85000.00,
      "stockQty": 10,
      "lowStockThreshold": 5,
      "availabilityStatus": null,
      "isActive": true,
      "createdAt": "2024-07-10T10:00:00.000Z",
      "updatedAt": "2024-07-10T10:00:00.000Z"
    }
  ]
}
```

**Errors**:
-   401: Invalid or expired token.
-   500: Internal Server Error.

#### POST /inventory
(Protected) Creates a new inventory item (product or service).

**Request**:
```json
{
  "name": "New Service Offering",
  "type": "service",
  "unitPrice": 17500.00,
  "category": "IT",
  "availabilityStatus": "available"
}
```

**Response**:
```json
{
  "message": "Inventory item created successfully",
  "item": {
    "id": "uuid-of-new-item",
    "name": "New Service Offering",
    "itemCode": null,
    "type": "service",
    "category": "IT",
    "unitPrice": 17500.00,
    "stockQty": null,
    "lowStockThreshold": 5,
    "availabilityStatus": "available",
    "isActive": true,
    "createdAt": "2024-07-21T12:00:00.000Z",
    "updatedAt": "2024-07-21T12:00:00.000Z"
  }
}
```

**Errors**:
-   400: Name, type, and unit price are required; type must be "product" or "service"; stock quantity is required for products.
-   401: Invalid or expired token.
-   409: Item code is already in use.
-   500: Internal Server Error.

#### GET /inventory/:id
(Protected) Retrieves details for a specific inventory item.

**Request**:
`GET /inventory/uuid-of-item` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Inventory item retrieved successfully",
  "item": {
    "id": "uuid-of-item",
    "name": "Solar Panel 400W",
    "itemCode": "SP-400W",
    "type": "product",
    "category": "Solar",
    "unitPrice": 85000.00,
    "stockQty": 10,
    "lowStockThreshold": 5,
    "availabilityStatus": null,
    "isActive": true,
    "createdAt": "2024-07-10T10:00:00.000Z",
    "updatedAt": "2024-07-10T10:00:00.000Z"
  }
}
```

**Errors**:
-   400: Invalid or missing ID.
-   401: Invalid or expired token.
-   404: Inventory item not found.
-   500: Internal Server Error.

#### PUT /inventory/:id
(Protected) Updates details for a specific inventory item.

**Request**:
```json
{
  "unitPrice": 90000.00,
  "lowStockThreshold": 3
}
```

**Response**:
```json
{
  "message": "Inventory item updated successfully",
  "item": {
    "id": "uuid-of-item",
    "name": "Solar Panel 400W",
    "itemCode": "SP-400W",
    "type": "product",
    "category": "Solar",
    "unitPrice": 90000.00,
    "stockQty": 10,
    "lowStockThreshold": 3,
    "availabilityStatus": null,
    "isActive": true,
    "createdAt": "2024-07-10T10:00:00.000Z",
    "updatedAt": "2024-07-21T12:15:00.000Z"
  }
}
```

**Errors**:
-   400: Invalid or missing ID.
-   401: Invalid or expired token.
-   404: Inventory item not found.
-   409: Item code is already in use.
-   500: Internal Server Error.

#### DELETE /inventory/:id
(Protected) Soft deletes an inventory item by setting `isActive` to `false`. Items are not permanently removed.

**Request**:
`DELETE /inventory/uuid-of-item` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "\"Solar Panel 400W\" has been deactivated from the inventory catalogue"
}
```

**Errors**:
-   400: Invalid or missing ID.
-   401: Invalid or expired token.
-   404: Inventory item not found.
-   500: Internal Server Error.

#### PATCH /inventory/:id/restock
(Protected) Adds stock to a product item. Only applicable to products.

**Request**:
```json
{
  "quantity": 20
}
```

**Response**:
```json
{
  "message": "Restocked successfully - new stock: 30 units",
  "item": {
    "id": "uuid-of-item",
    "name": "Solar Panel 400W",
    "itemCode": "SP-400W",
    "type": "product",
    "category": "Solar",
    "unitPrice": 90000.00,
    "stockQty": 30,
    "lowStockThreshold": 3,
    "availabilityStatus": null,
    "isActive": true,
    "createdAt": "2024-07-10T10:00:00.000Z",
    "updatedAt": "2024-07-21T12:30:00.000Z"
  }
}
```

**Errors**:
-   400: Invalid or missing ID; a valid quantity greater than 0 is required; only products can be restocked.
-   401: Invalid or expired token.
-   404: Inventory item not found.
-   500: Internal Server Error.

---

#### GET /invoices
(Protected) Retrieves a list of all invoices, with optional status filter and client search.

**Request**:
`GET /invoices?status=paid&search=nexus` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Invoices retrieved successfully",
  "count": 1,
  "invoices": [
    {
      "id": "uuid-of-invoice",
      "invoiceNumber": "INV-001",
      "quoteId": "uuid-of-quote",
      "clientId": "uuid-of-client",
      "createdBy": "uuid-of-user",
      "status": "paid",
      "vatRate": 7.50,
      "subtotal": 700000.00,
      "vatAmount": 52500.00,
      "grandTotal": 752500.00,
      "pdfPath": "/path/to/invoice-INV-001.pdf",
      "dueDate": "2024-07-31",
      "paidAt": "2024-07-25T14:00:00.000Z",
      "sentAt": "2024-07-21T13:00:00.000Z",
      "createdAt": "2024-07-21T13:00:00.000Z",
      "updatedAt": "2024-07-25T14:00:00.000Z",
      "client": {
        "id": "uuid-of-client",
        "clientName": "Nexus Energy Ltd",
        "email": "john@nexus.com"
      },
      "quote": {
        "id": "uuid-of-quote",
        "quoteNumber": "QT-001"
      },
      "creator": {
        "id": "uuid-of-user",
        "name": "Admin User"
      }
    }
  ]
}
```

**Errors**:
-   401: Invalid or expired token.
-   500: Internal Server Error.

#### GET /invoices/:id
(Protected) Retrieves full details for a specific invoice, including line items and client information.

**Request**:
`GET /invoices/uuid-of-invoice` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Invoice retrieved successfully",
  "invoice": {
    "id": "uuid-of-invoice",
    "invoiceNumber": "INV-001",
    "quoteId": "uuid-of-quote",
    "clientId": "uuid-of-client",
    "createdBy": "uuid-of-user",
    "status": "paid",
    "vatRate": 7.50,
    "subtotal": 700000.00,
    "vatAmount": 52500.00,
    "grandTotal": 752500.00,
    "pdfPath": "/path/to/invoice-INV-001.pdf",
    "dueDate": "2024-07-31",
    "paidAt": "2024-07-25T14:00:00.000Z",
    "sentAt": "2024-07-21T13:00:00.000Z",
    "createdAt": "2024-07-21T13:00:00.000Z",
    "updatedAt": "2024-07-25T14:00:00.000Z",
    "client": {
      "id": "uuid-of-client",
      "clientName": "Nexus Energy Ltd",
      "contactPerson": "John Doe",
      "email": "john@nexus.com",
      "phone": "+2348012345678",
      "address": "123 Main St, Abuja"
    },
    "items": [
      {
        "id": "uuid-of-invoice-item-1",
        "itemName": "Solar Panel 400W",
        "itemType": "product",
        "quantity": 5,
        "unitPrice": 85000.00,
        "lineTotal": 425000.00
      }
    ],
    "quote": {
      "id": "uuid-of-quote",
      "quoteNumber": "QT-001"
    },
    "creator": {
      "id": "uuid-of-user",
      "name": "Admin User"
    }
  }
}
```

**Errors**:
-   400: Invalid or missing ID.
-   401: Invalid or expired token.
-   404: Invoice not found.
-   500: Internal Server Error.

#### POST /invoices/generate/:quoteId
(Protected) Generates a new invoice from an approved quote. This process includes inventory deduction, PDF generation, and emailing the client, all within a database transaction.

**Request**:
`POST /invoices/generate/uuid-of-approved-quote` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Invoice generated, PDF created, and email sent to client",
  "invoice": {
    "id": "uuid-of-new-invoice",
    "invoiceNumber": "INV-002",
    "quoteNumber": "QT-002",
    "status": "sent",
    "grandTotal": 950000.00,
    "dueDate": "2024-08-04",
    "pdfPath": "/path/to/invoice-INV-002.pdf",
    "sentAt": "2024-07-21T13:45:00.000Z"
  }
}
```

**Errors**:
-   400: Invalid or missing quote ID; invoice can only be generated for approved quotes; insufficient stock.
-   401: Invalid or expired token.
-   404: Quote not found.
-   409: An invoice already exists for this quote.
-   500: Internal Server Error (or if PDF/email generation fails after successful invoice creation, an error property will be present in the JSON).

#### PATCH /invoices/:id/status
(Protected) Updates the status of an invoice to `paid` or `cancelled`.

**Request**:
```json
{
  "status": "paid"
}
```

**Response**:
```json
{
  "message": "Invoice marked as paid",
  "invoice": {
    "id": "uuid-of-invoice",
    "invoiceNumber": "INV-001",
    "status": "paid",
    "paidAt": "2024-07-25T14:00:00.000Z"
  }
}
```

**Errors**:
-   400: Invalid or missing ID; status must be "paid" or "cancelled"; cannot update a cancelled/paid invoice.
-   401: Invalid or expired token.
-   404: Invoice not found.
-   500: Internal Server Error.

#### GET /invoices/:id/download
(Protected) Downloads the generated PDF file for a specific invoice.

**Request**:
`GET /invoices/uuid-of-invoice/download` (Requires `Authorization: Bearer <token>`)

**Response**:
(File download of `INV-XXX.pdf`)

**Errors**:
-   400: Invalid or missing ID.
-   401: Invalid or expired token.
-   404: Invoice not found; PDF not yet generated; PDF file not found on server.
-   429: Too many download requests (rate limit).
-   500: Internal Server Error.

#### POST /invoices/:id/resend
(Protected) Resends the invoice PDF via email to the client.

**Request**:
`POST /invoices/uuid-of-invoice/resend` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Invoice INV-001 resent to john@nexus.com"
}
```

**Errors**:
-   400: Invalid or missing ID; no PDF available to send.
-   401: Invalid or expired token.
-   404: Invoice not found.
-   500: Internal Server Error.

---

#### GET /quotes
(Protected) Retrieves a list of all quotes, with optional status filter and client search.

**Request**:
`GET /quotes?status=pending&search=nexus` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Quotes retrieved successfully",
  "count": 1,
  "quotes": [
    {
      "id": "uuid-of-quote",
      "quoteNumber": "QT-001",
      "clientId": "uuid-of-client",
      "createdBy": "uuid-of-user",
      "status": "pending",
      "vatRate": 7.50,
      "subtotal": 700000.00,
      "vatAmount": 52500.00,
      "grandTotal": 752500.00,
      "notes": "Project phase 1",
      "pdfPath": "/path/to/quote-QT-001.pdf",
      "sentAt": "2024-07-20T10:00:00.000Z",
      "approvedAt": null,
      "createdAt": "2024-07-20T09:00:00.000Z",
      "updatedAt": "2024-07-20T10:00:00.000Z",
      "client": {
        "id": "uuid-of-client",
        "clientName": "Nexus Energy Ltd",
        "email": "john@nexus.com"
      },
      "items": [
        { "id": "uuid-of-item-1" },
        { "id": "uuid-of-item-2" }
      ],
      "creator": {
        "id": "uuid-of-user",
        "name": "Admin User"
      }
    }
  ]
}
```

**Errors**:
-   401: Invalid or expired token.
-   500: Internal Server Error.

#### GET /quotes/:id
(Protected) Retrieves full details for a specific quote, including line items and client information.

**Request**:
`GET /quotes/uuid-of-quote` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Quote retrieved successfully",
  "quote": {
    "id": "uuid-of-quote",
    "quoteNumber": "QT-001",
    "clientId": "uuid-of-client",
    "createdBy": "uuid-of-user",
    "status": "pending",
    "vatRate": 7.50,
    "subtotal": 700000.00,
    "vatAmount": 52500.00,
    "grandTotal": 752500.00,
    "notes": "Project phase 1",
    "pdfPath": "/path/to/quote-QT-001.pdf",
    "sentAt": "2024-07-20T10:00:00.000Z",
    "approvedAt": null,
    "createdAt": "2024-07-20T09:00:00.000Z",
    "updatedAt": "2024-07-20T10:00:00.000Z",
    "client": {
      "id": "uuid-of-client",
      "clientName": "Nexus Energy Ltd",
      "contactPerson": "John Doe",
      "email": "john@nexus.com",
      "phone": "+2348012345678",
      "address": "123 Main St, Abuja"
    },
    "items": [
      {
        "id": "uuid-of-quote-item-1",
        "inventoryId": "uuid-of-inventory-item",
        "itemName": "Solar Panel 400W",
        "itemType": "product",
        "quantity": 5,
        "unitPrice": 85000.00,
        "lineTotal": 425000.00
      }
    ],
    "creator": {
      "id": "uuid-of-user",
      "name": "Admin User"
    }
  }
}
```

**Errors**:
-   400: Invalid or missing ID.
-   401: Invalid or expired token.
-   404: Quote not found.
-   500: Internal Server Error.

#### POST /quotes
(Protected) Creates a new quote with line items. Can be saved as a `draft` or `submit`ted immediately (which sends it to `pending` status, generates PDF, and emails client).

**Request**:
```json
{
  "clientId": "uuid-of-client",
  "items": [
    {
      "inventoryId": "uuid-of-inventory-item",
      "quantity": 5
    },
    {
      "itemName": "Custom Consulting",
      "itemType": "service",
      "unitPrice": 50000,
      "quantity": 2
    }
  ],
  "notes": "Urgent project.",
  "vatRate": 7.5,
  "submit": true
}
```

**Response**:
```json
{
  "message": "Quote submitted, PDF generated, and email queued successfully",
  "quote": {
    "id": "uuid-of-new-quote",
    "quoteNumber": "QT-002",
    "clientId": "uuid-of-client",
    "createdBy": "uuid-of-user",
    "status": "pending",
    "subtotal": 525000.00,
    "vatRate": 7.50,
    "vatAmount": 39375.00,
    "grandTotal": 564375.00,
    "notes": "Urgent project.",
    "pdfPath": "/path/to/quote-QT-002.pdf",
    "sentAt": "2024-07-21T15:00:00.000Z",
    "approvedAt": null,
    "createdAt": "2024-07-21T15:00:00.000Z",
    "updatedAt": "2024-07-21T15:00:00.000Z"
  }
}
```

**Errors**:
-   400: Client and at least one line item are required; invalid quantity/unit price; inventory item no longer active; manual items must provide name, type, and unit price.
-   401: Invalid or expired token.
-   404: Client not found; inventory item not found.
-   500: Internal Server Error (or if PDF/email generation fails, an error property will be present in the JSON).

#### PUT /quotes/:id
(Protected) Updates an existing quote. Only quotes in `draft` status can be edited.

**Request**:
```json
{
  "items": [
    {
      "inventoryId": "uuid-of-inventory-item",
      "quantity": 6
    }
  ],
  "notes": "Updated notes for the draft.",
  "vatRate": 5.0
}
```

**Response**:
```json
{
  "message": "Quote updated successfully",
  "quote": {
    "id": "uuid-of-draft-quote",
    "quoteNumber": "QT-003",
    "clientId": "uuid-of-client",
    "createdBy": "uuid-of-user",
    "status": "draft",
    "subtotal": 510000.00,
    "vatRate": 5.00,
    "vatAmount": 25500.00,
    "grandTotal": 535500.00,
    "notes": "Updated notes for the draft.",
    "pdfPath": null,
    "sentAt": null,
    "approvedAt": null,
    "createdAt": "2024-07-21T16:00:00.000Z",
    "updatedAt": "2024-07-21T16:15:00.000Z"
  }
}
```

**Errors**:
-   400: Invalid or missing ID; quote cannot be edited because it is already `pending`, `approved`, etc.; invalid item data.
-   401: Invalid or expired token.
-   404: Quote not found; inventory item not found.
-   500: Internal Server Error.

#### PATCH /quotes/:id/submit
(Protected) Transitions a `draft` quote to `pending` status, generates its PDF, and emails it to the client.

**Request**:
`PATCH /quotes/uuid-of-draft-quote/submit` (Requires `Authorization: Bearer <token>`)

**Response**:
```json
{
  "message": "Quote submitted and emailed to client successfully",
  "quote": {
    "id": "uuid-of-draft-quote",
    "quoteNumber": "QT-003",
    "status": "pending",
    "grandTotal": 535500.00,
    "sentAt": "2024-07-21T16:30:00.000Z",
    "pdfPath": "/path/to/quote-QT-003.pdf"
  }
}
```

**Errors**:
-   400: Invalid or missing ID; quote is already `pending` and cannot be submitted again.
-   401: Invalid or expired token.
-   404: Quote not found.
-   500: Internal Server Error.

#### PATCH /quotes/:id/status
(Protected) Updates the status of a `pending` quote to `approved`, `rejected`, or `cancelled`.

**Request**:
```json
{
  "status": "approved"
}
```

**Response**:
```json
{
  "message": "Quote approved successfully",
  "quote": {
    "id": "uuid-of-pending-quote",
    "quoteNumber": "QT-003",
    "status": "approved",
    "approvedAt": "2024-07-21T16:45:00.000Z"
  }
}
```

**Errors**:
-   400: Invalid or missing ID; status must be one of `approved`, `rejected`, `cancelled`; only `pending` quotes can have their status changed.
-   401: Invalid or expired token.
-   404: Quote not found.
-   500: Internal Server Error.

## Technologies Used

| Category     | Technology          | Link                                      |
| :----------- | :------------------ | :---------------------------------------- |
| **Frontend** | React               | [https://react.dev/](https://react.dev/) |
|              | TypeScript          | [https://www.typescriptlang.org/](https://www.typescriptlang.org/) |
|              | Vite                | [https://vitejs.dev/](https://vitejs.dev/) |
|              | Tailwind CSS        | [https://tailwindcss.com/](https://tailwindcss.com/) |
|              | Zustand             | [https://zustand-bear.github.io/](https://zustand-bear.github.io/) |
|              | React Query         | [https://tanstack.com/query/latest](https://tanstack.com/query/latest) |
|              | Zod                 | [https://zod.dev/](https://zod.dev/) |
|              | React Hook Form     | [https://react-hook-form.com/](https://react-hook-form.com/) |
|              | Axios               | [https://axios-http.com/](https://axios-http.com/) |
|              | JWT-Decode          | [https://www.npmjs.com/package/jwt-decode](https://www.npmjs.com/package/jwt-decode) |
| **Backend**  | Node.js             | [https://nodejs.org/](https://nodejs.org/) |
|              | Express.js          | [https://expressjs.com/](https://expressjs.com/) |
|              | TypeScript          | [https://www.typescriptlang.org/](https://www.typescriptlang.org/) |
|              | PostgreSQL          | [https://www.postgresql.org/](https://www.postgresql.org/) |
|              | Sequelize           | [https://sequelize.org/](https://sequelize.org/) |
|              | bcrypt              | [https://www.npmjs.com/package/bcrypt](https://www.npmjs.com/package/bcrypt) |
|              | jsonwebtoken        | [https://www.npmjs.com/package/jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) |
|              | dotenv              | [https://www.npmjs.com/package/dotenv](https://www.npmjs.com/package/dotenv) |
|              | cors                | [https://www.npmjs.com/package/cors](https://www.npmjs.com/package/cors) |
|              | helmet              | [https://www.npmjs.com/package/helmet](https://www.npmjs.com/package/helmet) |
|              | hpp                 | [https://www.npmjs.com/package/hpp](https://www.npmjs.com/package/hpp) |
|              | morgan              | [https://www.npmjs.com/package/morgan](https://www.npmjs.com/package/morgan) |
|              | express-rate-limit  | [https://www.npmjs.com/package/express-rate-limit](https://www.npmjs.com/package/express-rate-limit) |
|              | Nodemailer          | [https://nodemailer.com/](https://nodemailer.com/) |
|              | PDF-Lib             | [https://pdf-lib.js.org/](https://pdf-lib.js.org/) |
|              | UUID                | [https://www.npmjs.com/package/uuid](https://www.npmjs.com/package/uuid) |
| **Tools**    | Nodemon             | [https://nodemon.io/](https://nodemon.io/) |
|              | Eslint              | [https://eslint.org/](https://eslint.org/) |

## Contributing

We'd love for you to contribute to the Leapback E-Quotation Portal! Here's how you can help:

1.  **Fork the repository**: Start by forking the project to your own GitHub account.
2.  **Create a new branch**: Give your branch a descriptive name (e.g., `feature/add-client-dashboard`, `fix/login-bug`).
3.  **Make your changes**: Implement your feature or bug fix. Please follow the existing code style and conventions.
4.  **Write clear commit messages**: Describe your changes concisely and effectively.
5.  **Test your changes**: Ensure your modifications don't introduce new bugs and that existing functionalities still work as expected.
6.  **Submit a Pull Request**: Once your changes are ready, open a pull request against the `main` branch of this repository. Provide a clear description of your changes and why they're beneficial.

## License

This project is licensed under the ISC License.

## Author Info

Temitope Alawode

*   **LinkedIn**: [linkedin.com/in/temitopealawode](https://www.linkedin.com/in/temitope-alawode/)
*   **X (formerly Twitter)**: [@_temitope6](https://x.com/_temitope6)

---

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-222222?style=for-the-badge&logo=zustand&logoColor=white)](https://zustand-bear.github.io/)
[![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/query/latest)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-40B79E?style=for-the-badge&logo=nodemailer&logoColor=white)](https://nodemailer.com/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)