# Insurance Brokerage System - Backend API Documentation

This document provides comprehensive guidance for building the Spring Boot backend to work with this React frontend.

## Table of Contents
1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [Authentication & Authorization](#authentication--authorization)
4. [Request/Response Formats](#requestresponse-formats)
5. [Role-Based Access Control](#role-based-access-control)
6. [Error Handling](#error-handling)
7. [Spring Boot Implementation Guide](#spring-boot-implementation-guide)

---

## Database Schema

### MySQL Tables

```sql
-- Users table for authentication
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_users_email (email)
);

-- User roles table (separate for security)
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    role ENUM('ADMINISTRATOR', 'BROKER_MANAGER', 'BROKER') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role)
);

-- Clients (with CNP - Romanian Personal Numeric Code)
CREATE TABLE clients (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    broker_id BIGINT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    cnp CHAR(13) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    total_policies INT DEFAULT 0,
    active_policies INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES brokers(id),
    INDEX idx_clients_email (email),
    INDEX idx_clients_cnp (cnp),
    INDEX idx_clients_broker (broker_id),
    INDEX idx_clients_name (last_name, first_name)
);

-- Insurers
CREATE TABLE insurers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_insurers_code (code)
);

-- Insurance Products
CREATE TABLE insurance_products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    category ENUM('LIFE', 'HEALTH', 'AUTO', 'HOME', 'TRAVEL', 'BUSINESS') NOT NULL,
    insurer_id BIGINT NOT NULL,
    base_rate DECIMAL(8, 6) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (insurer_id) REFERENCES insurers(id),
    INDEX idx_products_category (category),
    INDEX idx_products_insurer (insurer_id)
);

-- Product Custom Fields (for dynamic premium calculation)
CREATE TABLE product_custom_fields (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    type ENUM('text', 'number', 'select', 'date', 'checkbox') NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    options JSON NULL, -- For select type: ["Option1", "Option2"]
    placeholder VARCHAR(255) NULL,
    factor_multiplier DECIMAL(5, 2) NULL, -- Premium factor multiplier
    factor_condition JSON NULL, -- Condition for applying factor: {"operator": "eq", "value": "wood"}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES insurance_products(id) ON DELETE CASCADE,
    INDEX idx_custom_fields_product (product_id)
);

-- Brokers (includes Administrators as brokers with elevated privileges)
CREATE TABLE brokers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE, -- Links to users table for authentication
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    commission_rate DECIMAL(5, 4) NOT NULL, -- e.g., 0.0500 for 5%
    hire_date DATE NOT NULL,
    role ENUM('BROKER', 'BROKER_MANAGER', 'ADMINISTRATOR') NOT NULL DEFAULT 'BROKER',
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_brokers_license (license_number),
    INDEX idx_brokers_role (role)
);

-- Offers (pre-policy stage)
CREATE TABLE offers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    offer_number VARCHAR(50) UNIQUE NOT NULL,
    client_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    broker_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    premium DECIMAL(10, 2) NOT NULL,
    sum_insured DECIMAL(15, 2) NOT NULL,
    status ENUM('DRAFT', 'PENDING', 'ACCEPTED', 'EXPIRED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    expires_at DATE NOT NULL,
    gdpr_consent BOOLEAN DEFAULT FALSE,
    gdpr_consent_date DATE NULL,
    custom_field_values JSON NULL, -- Stores custom field responses
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (product_id) REFERENCES insurance_products(id),
    FOREIGN KEY (broker_id) REFERENCES brokers(id),
    INDEX idx_offers_number (offer_number),
    INDEX idx_offers_status (status),
    INDEX idx_offers_broker (broker_id),
    INDEX idx_offers_expires (expires_at)
);

-- Insurance Policies (created from offers after checkout)
CREATE TABLE insurance_policies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    offer_id BIGINT NULL, -- Link to original offer
    client_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    broker_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    premium DECIMAL(10, 2) NOT NULL,
    sum_insured DECIMAL(15, 2) NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', 'SUSPENDED', 'AWAITING_PAYMENT') NOT NULL DEFAULT 'PENDING',
    gdpr_consent BOOLEAN DEFAULT FALSE,
    gdpr_consent_date DATE NULL,
    payment_method ENUM('CASH', 'POS', 'CARD_ONLINE', 'BANK_TRANSFER', 'BROKER_PAYMENT') NULL,
    payment_status ENUM('PENDING', 'VALIDATED', 'REJECTED') DEFAULT 'PENDING',
    proof_of_payment VARCHAR(255) NULL, -- File path to uploaded document
    custom_field_values JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (offer_id) REFERENCES offers(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (product_id) REFERENCES insurance_products(id),
    FOREIGN KEY (broker_id) REFERENCES brokers(id),
    INDEX idx_policies_number (policy_number),
    INDEX idx_policies_status (status),
    INDEX idx_policies_broker (broker_id),
    INDEX idx_policies_dates (start_date, end_date)
);

-- Commissions
CREATE TABLE commissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    policy_id BIGINT NOT NULL,
    broker_id BIGINT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    rate DECIMAL(5, 4) NOT NULL,
    status ENUM('PENDING', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    payment_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (policy_id) REFERENCES insurance_policies(id),
    FOREIGN KEY (broker_id) REFERENCES brokers(id),
    INDEX idx_commissions_broker (broker_id),
    INDEX idx_commissions_status (status)
);

-- Policy Renewals
CREATE TABLE renewals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    original_policy_id BIGINT NOT NULL,
    new_policy_id BIGINT NULL, -- NULL until renewal is completed
    broker_id BIGINT NOT NULL,
    renewal_date DATE NOT NULL,
    previous_premium DECIMAL(10, 2) NOT NULL,
    new_premium DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'COMPLETED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_policy_id) REFERENCES insurance_policies(id),
    FOREIGN KEY (new_policy_id) REFERENCES insurance_policies(id),
    FOREIGN KEY (broker_id) REFERENCES brokers(id),
    INDEX idx_renewals_status (status),
    INDEX idx_renewals_date (renewal_date)
);

-- Activity Logs (audit trail)
CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity_type ENUM('CLIENT', 'POLICY', 'OFFER', 'COMMISSION', 'RENEWAL') NOT NULL,
    entity_id BIGINT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    performed_by BIGINT NOT NULL,
    performed_by_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by) REFERENCES users(id),
    INDEX idx_activity_entity (entity_type, entity_id),
    INDEX idx_activity_user (performed_by),
    INDEX idx_activity_date (created_at)
);

-- Default admin user (password: admin123 - hash with BCrypt)
INSERT INTO users (email, password_hash, first_name, last_name, active)
VALUES ('admin@insurebroker.com', '$2a$10$YourBCryptHashHere', 'Admin', 'User', TRUE);

INSERT INTO user_roles (user_id, role)
VALUES (1, 'ADMINISTRATOR');

-- Create corresponding broker entry for admin
INSERT INTO brokers (user_id, first_name, last_name, email, license_number, commission_rate, hire_date, role, active)
VALUES (1, 'Admin', 'User', 'admin@insurebroker.com', 'LIC-ADMIN-001', 0.0500, CURDATE(), 'ADMINISTRATOR', TRUE);
```

---

## API Endpoints

### Base URL
```
http://localhost:8080/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/login` | Login and get JWT token | Public |
| POST | `/auth/logout` | Invalidate token | Authenticated |
| GET | `/auth/me` | Get current user info | Authenticated |
| POST | `/auth/refresh` | Refresh JWT token | Authenticated |

### Client Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/clients` | List all clients | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| GET | `/clients/{id}` | Get client by ID | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| POST | `/clients` | Create new client | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| PUT | `/clients/{id}` | Update client | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| DELETE | `/clients/{id}` | Delete client | **BROKER_MANAGER, ADMINISTRATOR only** |

### Policy Endpoints

**IMPORTANT: Policies cannot be deleted. Use status change to CANCELLED instead (soft delete).**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/policies` | List policies | ALL (filtered by broker for BROKER role) |
| GET | `/policies/{id}` | Get policy by ID | ALL (must be own policy for BROKER) |
| POST | `/policies` | Create new policy from offer | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| PUT | `/policies/{id}` | Update policy | BROKER_MANAGER, ADMINISTRATOR |
| PATCH | `/policies/{id}/cancel` | Cancel policy (soft delete) | **BROKER_MANAGER, ADMINISTRATOR only** |
| PATCH | `/policies/{id}/suspend` | Suspend policy | **BROKER_MANAGER, ADMINISTRATOR only** |
| PATCH | `/policies/{id}/validate-payment` | Validate payment | BROKER_MANAGER, ADMINISTRATOR |

### Offer Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/offers` | List offers | ALL (filtered by broker for BROKER role) |
| GET | `/offers/{id}` | Get offer by ID | ALL |
| POST | `/offers` | Create new offer | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| PUT | `/offers/{id}` | Update offer | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| DELETE | `/offers/{id}` | Delete offer | **BROKER_MANAGER, ADMINISTRATOR only** |
| POST | `/offers/{id}/checkout` | Convert offer to policy | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| PATCH | `/offers/{id}/reject` | Reject offer | BROKER_MANAGER, ADMINISTRATOR |
|--------|----------|-------------|--------|
| GET | `/offers` | List offers | ALL (filtered by broker for BROKER role) |
| GET | `/offers/{id}` | Get offer by ID | ALL |
| POST | `/offers` | Create new offer | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| PUT | `/offers/{id}` | Update offer | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| POST | `/offers/{id}/checkout` | Convert offer to policy | BROKER, BROKER_MANAGER, ADMINISTRATOR |

### Product Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/products` | List all products | ALL |
| GET | `/products/{id}` | Get product by ID | ALL |
| POST | `/products` | Create new product | ADMINISTRATOR |
| PUT | `/products/{id}` | Update product | ADMINISTRATOR |
| DELETE | `/products/{id}` | Delete product | ADMINISTRATOR |
| GET | `/products/{id}/custom-fields` | Get product custom fields | ALL |
| POST | `/products/{id}/custom-fields` | Add custom field | ADMINISTRATOR |
| PUT | `/products/{id}/custom-fields/{fieldId}` | Update custom field | ADMINISTRATOR |
| DELETE | `/products/{id}/custom-fields/{fieldId}` | Delete custom field | ADMINISTRATOR |

### Premium Calculation Endpoint

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/premium/calculate` | Calculate premium for a product | BROKER, BROKER_MANAGER, ADMINISTRATOR |

### Insurer Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/insurers` | List all insurers | ALL |
| GET | `/insurers/{id}` | Get insurer by ID | ALL |
| POST | `/insurers` | Create new insurer | ADMINISTRATOR |
| PUT | `/insurers/{id}` | Update insurer | ADMINISTRATOR |
| DELETE | `/insurers/{id}` | Delete insurer | ADMINISTRATOR |

### Broker Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/brokers` | List all brokers | BROKER_MANAGER, ADMINISTRATOR |
| GET | `/brokers/{id}` | Get broker by ID | BROKER_MANAGER, ADMINISTRATOR |
| POST | `/brokers` | Create new broker | ADMINISTRATOR |
| PUT | `/brokers/{id}` | Update broker | BROKER_MANAGER, ADMINISTRATOR |
| DELETE | `/brokers/{id}` | Delete broker | ADMINISTRATOR |

### Commission Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/commissions` | List commissions | ALL (filtered by broker for BROKER role) |
| GET | `/commissions/{id}` | Get commission by ID | ALL (must be own for BROKER) |
| PATCH | `/commissions/{id}/pay` | Mark as paid | BROKER_MANAGER, ADMINISTRATOR |

### Renewal Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/renewals` | List renewals | ALL (filtered by broker for BROKER role) |
| GET | `/renewals/{id}` | Get renewal by ID | ALL |
| POST | `/renewals` | Create renewal | BROKER, BROKER_MANAGER, ADMINISTRATOR |
| PATCH | `/renewals/{id}/complete` | Complete renewal | BROKER_MANAGER, ADMINISTRATOR |
| PATCH | `/renewals/{id}/decline` | Decline renewal | BROKER_MANAGER, ADMINISTRATOR |

### Dashboard Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/dashboard/stats` | Get dashboard statistics | ALL (filtered by broker for BROKER role) |

---

## Authentication & Authorization

### JWT Token Structure

```json
{
  "sub": "1",                           // User ID
  "email": "admin@insurebroker.com",
  "role": "ADMINISTRATOR",
  "brokerId": 1,                        // Broker ID (all users including admins have this)
  "iat": 1704067200,
  "exp": 1704153600
}
```

### Login Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@insurebroker.com",
  "password": "admin123"
}
```

### Login Response

```json
{
  "user": {
    "id": 1,
    "email": "admin@insurebroker.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMINISTRATOR",
    "brokerId": 1,
    "active": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### Using the Token

All authenticated requests must include the token in the Authorization header:

```http
GET /api/clients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Request/Response Formats

### Client

**Request (Create/Update):**
```json
{
  "firstName": "Ion",
  "lastName": "Popescu",
  "cnp": "1850315123456",
  "email": "ion.popescu@example.com",
  "phone": "+40722123456",
  "address": "Str. Victoriei 123, București",
  "dateOfBirth": "1985-03-15"
}
```

**Response:**
```json
{
  "id": 1,
  "brokerId": 1,
  "brokerName": "Admin User",
  "firstName": "Ion",
  "lastName": "Popescu",
  "cnp": "1850315123456",
  "email": "ion.popescu@example.com",
  "phone": "+40722123456",
  "address": "Str. Victoriei 123, București",
  "dateOfBirth": "1985-03-15",
  "totalPolicies": 2,
  "activePolicies": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Premium Calculation

**Request:**
```json
{
  "productId": 1,
  "sumInsured": 100000,
  "customFieldValues": {
    "building_year": "1990",
    "construction_material": "Brick",
    "has_alarm_system": true
  },
  "clientData": {
    "cnp": "1850315123456",
    "dateOfBirth": "1985-03-15",
    "address": "București"
  }
}
```

**Response:**
```json
{
  "premium": 2450.00,
  "breakdown": {
    "basePremium": 2000.00,
    "factors": [
      {
        "name": "Building Age",
        "multiplier": 1.15,
        "reason": "Building older than 30 years"
      },
      {
        "name": "Security System",
        "multiplier": 0.90,
        "reason": "Has alarm system"
      }
    ]
  }
}
```

### Offer

**Request (Create):**
```json
{
  "clientId": 1,
  "productId": 1,
  "brokerId": 1,
  "startDate": "2024-02-01",
  "endDate": "2025-02-01",
  "premium": 2450.00,
  "sumInsured": 100000.00,
  "gdprConsent": true,
  "customFieldValues": {
    "building_year": "1990",
    "construction_material": "Brick"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "offerNumber": "OFR-2024-00001",
  "clientId": 1,
  "clientName": "Ion Popescu",
  "productId": 1,
  "productName": "Home Secure Basic",
  "insurerName": "ABC Insurance",
  "brokerId": 1,
  "brokerName": "Admin User",
  "startDate": "2024-02-01",
  "endDate": "2025-02-01",
  "premium": 2450.00,
  "sumInsured": 100000.00,
  "status": "PENDING",
  "expiresAt": "2024-03-01",
  "gdprConsent": true,
  "gdprConsentDate": "2024-01-15",
  "customFieldValues": {...},
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Offer Checkout

**Request:**
```json
{
  "paymentMethod": "CARD_ONLINE",
  "proofOfPayment": null
}
```

**Response:**
```json
{
  "policy": {
    "id": 1,
    "policyNumber": "POL-2024-00001",
    "offerId": 1,
    "clientId": 1,
    "clientName": "Ion Popescu",
    "productId": 1,
    "productName": "Home Secure Basic",
    "insurerName": "ABC Insurance",
    "brokerId": 1,
    "brokerName": "Admin User",
    "startDate": "2024-02-01",
    "endDate": "2025-02-01",
    "premium": 2450.00,
    "sumInsured": 100000.00,
    "status": "ACTIVE",
    "paymentMethod": "CARD_ONLINE",
    "paymentStatus": "VALIDATED",
    "gdprConsent": true,
    "gdprConsentDate": "2024-01-15",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Policy created successfully"
}
```

### Product with Custom Fields

**Response:**
```json
{
  "id": 1,
  "name": "Home Secure Basic",
  "code": "HOME-BASIC",
  "description": "Basic home insurance coverage",
  "category": "HOME",
  "insurerId": 1,
  "insurerName": "ABC Insurance",
  "baseRate": 0.02,
  "active": true,
  "customFields": [
    {
      "id": 1,
      "name": "building_year",
      "label": "Year of Construction",
      "type": "number",
      "required": true,
      "placeholder": "e.g., 1990",
      "factorMultiplier": 1.15,
      "factorCondition": {"operator": "lt", "value": 1990}
    },
    {
      "id": 2,
      "name": "construction_material",
      "label": "Construction Material",
      "type": "select",
      "required": true,
      "options": ["Brick", "Concrete", "Wood", "Steel"],
      "factorMultiplier": 1.20,
      "factorCondition": {"operator": "eq", "value": "Wood"}
    }
  ]
}
```

### Commission

**Response:**
```json
{
  "id": 1,
  "policyId": 1,
  "policyNumber": "POL-2024-0001",
  "brokerId": 1,
  "brokerName": "Admin User",
  "amount": 122.50,
  "rate": 0.05,
  "status": "PENDING",
  "paymentDate": null,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Dashboard Stats

**Response:**
```json
{
  "totalClients": 150,
  "activePolicies": 89,
  "totalPremium": 125000.00,
  "pendingRenewals": 12,
  "monthlyCommissions": 8500.00,
  "expiringThisMonth": 8,
  "pendingOffers": 5,
  "draftOffers": 3
}
```

### List Response (Paginated)

```json
{
  "content": [...],
  "page": 0,
  "size": 10,
  "totalElements": 150,
  "totalPages": 15,
  "last": false
}
```

---

## Role-Based Access Control

### Role Hierarchy

```
ADMINISTRATOR (Full Access - Treated as Broker with Admin Privileges)
    ├── Has own broker profile with individual book of business
    ├── Can manage all entities
    ├── Can manage users and roles
    ├── Can view all data across all brokers
    ├── Can manage products and insurers
    └── Can delete any record

BROKER_MANAGER (Limited Admin)
    ├── Has own broker profile with individual book of business
    ├── Can toggle to view all data ("Show All" toggle)
    ├── Can manage brokers
    ├── Can view all commissions (with toggle)
    ├── Can manage policies (all)
    ├── Can validate payments
    ├── Cannot manage products/insurers
    └── Cannot delete brokers

BROKER (Basic Access)
    ├── Has own broker profile with individual book of business
    ├── Can manage own clients only
    ├── Can create offers/policies (assigned to self)
    ├── Can view own commissions only
    ├── Can view own policies only
    └── Cannot access brokers page
```

### Backend Filtering Logic

For BROKER role, apply filters automatically:

```java
// In PolicyService
public List<Policy> getPolicies(User currentUser) {
    if (currentUser.getRole() == Role.BROKER) {
        return policyRepository.findByBrokerId(currentUser.getBrokerId());
    }
    return policyRepository.findAll();
}

// For BROKER_MANAGER with showAll toggle
public List<Policy> getPolicies(User currentUser, boolean showAll) {
    if (currentUser.getRole() == Role.ADMINISTRATOR) {
        return policyRepository.findAll();
    }
    if (currentUser.getRole() == Role.BROKER_MANAGER && showAll) {
        return policyRepository.findAll();
    }
    return policyRepository.findByBrokerId(currentUser.getBrokerId());
}

// In CommissionService
public List<Commission> getCommissions(User currentUser, boolean showAll) {
    if (currentUser.getRole() == Role.ADMINISTRATOR) {
        return commissionRepository.findAll();
    }
    if (currentUser.getRole() == Role.BROKER_MANAGER && showAll) {
        return commissionRepository.findAll();
    }
    return commissionRepository.findByBrokerId(currentUser.getBrokerId());
}
```

---

## Error Handling

### Error Response Format

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/clients",
  "details": {
    "cnp": "Invalid CNP format. Must be 13 digits.",
    "email": "Invalid email format",
    "firstName": "First name is required"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate CNP, email, etc.) |
| 500 | Internal Server Error |

---

## Premium Calculation Logic

The backend must implement premium calculation with the following logic:

```java
@Service
public class PremiumCalculationService {
    
    public PremiumCalculationResponse calculatePremium(PremiumCalculationRequest request) {
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new NotFoundException("Product not found"));
        
        // Base premium calculation
        BigDecimal basePremium = request.getSumInsured()
            .multiply(product.getBaseRate());
        
        List<PremiumFactor> factors = new ArrayList<>();
        BigDecimal totalMultiplier = BigDecimal.ONE;
        
        // Apply custom field factors
        for (ProductCustomField field : product.getCustomFields()) {
            if (field.getFactorMultiplier() != null && field.getFactorCondition() != null) {
                Object fieldValue = request.getCustomFieldValues().get(field.getName());
                
                if (evaluateCondition(field.getFactorCondition(), fieldValue)) {
                    factors.add(new PremiumFactor(
                        field.getLabel(),
                        field.getFactorMultiplier(),
                        getFactorReason(field, fieldValue)
                    ));
                    totalMultiplier = totalMultiplier.multiply(field.getFactorMultiplier());
                }
            }
        }
        
        // Apply client-based factors (age, location, etc.)
        // ... additional factor logic based on clientData
        
        BigDecimal finalPremium = basePremium.multiply(totalMultiplier)
            .setScale(2, RoundingMode.HALF_UP);
        
        return new PremiumCalculationResponse(
            finalPremium,
            new PremiumBreakdown(basePremium, factors)
        );
    }
    
    private boolean evaluateCondition(FactorCondition condition, Object value) {
        switch (condition.getOperator()) {
            case "eq": return value.equals(condition.getValue());
            case "lt": return compareNumeric(value, condition.getValue()) < 0;
            case "gt": return compareNumeric(value, condition.getValue()) > 0;
            case "lte": return compareNumeric(value, condition.getValue()) <= 0;
            case "gte": return compareNumeric(value, condition.getValue()) >= 0;
            default: return false;
        }
    }
}
```

---

## CNP Validation

Romanian CNP (Cod Numeric Personal) validation:

```java
public class CNPValidator {
    private static final int[] CONTROL_KEY = {2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9};
    
    public static boolean isValid(String cnp) {
        if (cnp == null || cnp.length() != 13) {
            return false;
        }
        
        if (!cnp.matches("\\d{13}")) {
            return false;
        }
        
        // Calculate control digit
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            sum += Character.getNumericValue(cnp.charAt(i)) * CONTROL_KEY[i];
        }
        
        int controlDigit = sum % 11;
        if (controlDigit == 10) {
            controlDigit = 1;
        }
        
        return controlDigit == Character.getNumericValue(cnp.charAt(12));
    }
    
    // Extract date of birth from CNP
    public static LocalDate extractDateOfBirth(String cnp) {
        int sexDigit = Character.getNumericValue(cnp.charAt(0));
        int year = Integer.parseInt(cnp.substring(1, 3));
        int month = Integer.parseInt(cnp.substring(3, 5));
        int day = Integer.parseInt(cnp.substring(5, 7));
        
        // Determine century based on sex digit
        int century;
        switch (sexDigit) {
            case 1: case 2: century = 1900; break;
            case 3: case 4: century = 1800; break;
            case 5: case 6: century = 2000; break;
            default: century = 1900;
        }
        
        return LocalDate.of(century + year, month, day);
    }
}
```

---

## Spring Boot Implementation Guide

### Project Structure

```
src/main/java/com/insurebroker/
├── InsureBrokerApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   └── CorsConfig.java
├── controller/
│   ├── AuthController.java
│   ├── ClientController.java
│   ├── PolicyController.java
│   ├── OfferController.java
│   ├── ProductController.java
│   ├── PremiumController.java
│   ├── InsurerController.java
│   ├── BrokerController.java
│   ├── CommissionController.java
│   ├── RenewalController.java
│   └── DashboardController.java
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── ClientRequest.java
│   │   ├── OfferRequest.java
│   │   ├── CheckoutRequest.java
│   │   └── PremiumCalculationRequest.java
│   └── response/
│       ├── AuthResponse.java
│       ├── ClientResponse.java
│       ├── OfferResponse.java
│       ├── PolicyResponse.java
│       └── PremiumCalculationResponse.java
├── entity/
│   ├── User.java
│   ├── Client.java
│   ├── Broker.java
│   ├── Offer.java
│   ├── Policy.java
│   ├── Product.java
│   ├── ProductCustomField.java
│   ├── Insurer.java
│   ├── Commission.java
│   ├── Renewal.java
│   └── ActivityLog.java
├── repository/
│   └── (JPA repositories)
├── service/
│   ├── AuthService.java
│   ├── ClientService.java
│   ├── OfferService.java
│   ├── PolicyService.java
│   ├── PremiumCalculationService.java
│   └── (other services)
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtAuthenticationFilter.java
│   └── UserPrincipal.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   └── ValidationException.java
└── util/
    └── CNPValidator.java
```

### Key Dependencies (pom.xml)

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

### application.properties

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/insurebroker
spring.datasource.username=root
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# JWT
jwt.secret=your-256-bit-secret-key-here
jwt.expiration=86400000

# File upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
file.upload-dir=./uploads

# Server
server.port=8080
```

---

## Frontend Integration Notes

### API Service Example

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const premiumService = {
  calculate: (request: PremiumCalculationRequest) =>
    api.post<PremiumCalculationResponse>('/premium/calculate', request),
};

export const offerService = {
  create: (offer: OfferRequest) => api.post<OfferResponse>('/offers', offer),
  checkout: (offerId: number, payment: CheckoutRequest) =>
    api.post<PolicyResponse>(`/offers/${offerId}/checkout`, payment),
};

export default api;
```

### Replace Mock Data with API Calls

When connecting to the real backend:

1. Replace `mockProducts` with API call to `/products`
2. Replace `mockClients` with API call to `/clients`
3. Replace `calculatePremium` mock with API call to `/premium/calculate`
4. Replace `addOffer` with API call to `POST /offers`
5. Replace `convertOfferToPolicy` with API call to `POST /offers/{id}/checkout`

---

## Security & Permission Summary

### Action Permissions Matrix

| Action | BROKER | BROKER_MANAGER | ADMINISTRATOR |
|--------|--------|----------------|---------------|
| View own data | ✅ | ✅ | ✅ |
| View all data | ❌ | ✅ (with toggle) | ✅ |
| Create clients | ✅ | ✅ | ✅ |
| Delete clients | ❌ | ✅ | ✅ |
| Create offers | ✅ | ✅ | ✅ |
| Delete offers | ❌ | ✅ | ✅ |
| Create policies | ✅ | ✅ | ✅ |
| Cancel policies | ❌ | ✅ | ✅ |
| Delete policies | ❌ | ❌ | ❌ (never allowed) |
| Delete renewals | ❌ | ✅ | ✅ |
| Mark commission paid | ❌ | ✅ | ✅ |
| Manage brokers | ❌ | ✅ | ✅ |
| Manage products | ❌ | ❌ | ✅ |
| Manage insurers | ❌ | ❌ | ✅ |

### Frontend Service Layer

The frontend implements a service layer (`src/services/index.ts`) that:

1. **Simulates backend filtering** - Data is filtered based on user role before display
2. **Provides permission checks** - `PermissionService` validates actions before allowing them
3. **Handles soft deletes** - Policies use status change instead of deletion

The `usePermissions` hook (`src/hooks/usePermissions.ts`) provides easy access to permission checks in components.

### Key Security Implementation Notes

1. **Never delete policies** - Always use status change to CANCELLED
2. **Activity logging required** - All status changes must be logged
3. **BROKER isolation** - BROKER role must only see their own data
4. **Toggle for managers** - BROKER_MANAGER can toggle to view all data
5. **Admin as broker** - ADMINISTRATOR is treated as a broker with admin privileges
