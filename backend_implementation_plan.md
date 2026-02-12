# Backend Implementation Plan
## Digital Warranty Vault & Product Authenticity Verification System

---

## 1. Overview

This document provides a comprehensive backend implementation strategy using **Node.js/Express** with a **polyglot persistence architecture** combining **MongoDB** (document-centric data) and **Neo4j** (relationship-centric data). The backend will provide secure APIs for warranty management, product authentication, and ownership tracking.

---

## 2. Database Architecture Decision

### 2.1 Why Polyglot Persistence?

The Digital Warranty Vault system has both **document-centric** and **relationship-centric** data requirements:

| Data Type | Characteristics | Best Database |
|-----------|-----------------|---------------|
| Vendors, Products, Warranties | Structured documents, flexible metadata, independent entities | **MongoDB** |
| Owners with JSON contacts | Semi-structured, varies per owner | **MongoDB** |
| Product Serials | Document with hash lookup | **MongoDB** |
| Ownership History | Complex relationships, temporal chains | **Neo4j** |
| Authenticity Checks | Relationship-based audit trail | **Neo4j** |
| Product-Vendor-Owner Graph | Multi-hop traversals, recommendations | **Neo4j** |

### 2.2 Data Distribution Strategy

```mermaid
flowchart TB
    subgraph MongoDB["MongoDB (Document Store)"]
        V[Vendors Collection]
        P[Products Collection]
        PS[Product_Serials Collection]
        W[Warranties Collection]
        O[Owners Collection]
        U[Users Collection]
    end
    
    subgraph Neo4j["Neo4j (Graph Database)"]
        VN[(:Vendor) Nodes]
        PN[(:Product) Nodes]
        PSN[(:Serial) Nodes]
        ON[(:Owner) Nodes]
        
        VN -->|MANUFACTURES| PN
        PN -->|HAS_SERIAL| PSN
        PSN -->|OWNED_BY| ON
        ON -->|TRANSFERRED_TO| ON
        PSN -->|VERIFIED_AT| AC[(:AuthCheck) Nodes]
    end
    
    MongoDB -.->|Sync on Create/Update| Neo4j
```

---

## 3. MongoDB Schema Design

### 3.1 Vendors Collection

```javascript
// MongoDB Schema: vendors
{
  _id: ObjectId,
  vendor_id: Number,           // Custom sequential ID
  name: String,                // Required, indexed
  contact_email: String,       // Required, unique
  public_key: String,          // RSA/ECDSA public key for signature verification
  description: String,
  logo_url: String,
  status: String,              // 'active', 'inactive', 'suspended'
  created_at: Date,
  updated_at: Date,
  
  // Embedded metadata
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postal_code: String
  },
  
  // Indexes
  // { name: 1 }
  // { contact_email: 1 } unique
  // { vendor_id: 1 } unique
}
```

### 3.2 Products Collection

```javascript
// MongoDB Schema: products
{
  _id: ObjectId,
  product_id: Number,          // Custom sequential ID
  vendor_id: Number,           // Reference to vendor
  model_code: String,          // Unique model identifier
  name: String,                // Required, indexed
  description: String,
  category: String,            // e.g., 'electronics', 'appliances'
  
  // Flexible specifications (JSON)
  specifications: {
    weight: String,
    dimensions: String,
    color: String,
    // ... any product-specific fields
  },
  
  warranty_policy: {
    default_duration_months: Number,
    warranty_types: [String],  // ['standard', 'extended', 'premium']
  },
  
  images: [String],            // Array of image URLs
  status: String,              // 'active', 'discontinued'
  created_at: Date,
  updated_at: Date,
  
  // Indexes
  // { product_id: 1 } unique
  // { vendor_id: 1 }
  // { model_code: 1 } unique
  // { name: 'text', description: 'text' } for full-text search
}
```

### 3.3 Product_Serials Collection

```javascript
// MongoDB Schema: product_serials
{
  _id: ObjectId,
  serial_id: Number,           // Custom sequential ID
  product_id: Number,          // Reference to product
  serial_hash: String,         // SHA-256 hash of actual serial, indexed
  manufacture_date: Date,
  batch_number: String,
  
  // Original serial stored encrypted
  encrypted_serial: String,
  
  // QR code data
  qr_code_data: String,        // Encoded string for QR generation
  
  // Status tracking
  status: String,              // 'manufactured', 'registered', 'sold', 'returned'
  registration_date: Date,
  
  // Digital signature from vendor
  vendor_signature: String,    // Signed hash for authenticity
  
  created_at: Date,
  updated_at: Date,
  
  // Indexes
  // { serial_id: 1 } unique
  // { serial_hash: 1 } unique
  // { product_id: 1 }
}
```

### 3.4 Warranties Collection

```javascript
// MongoDB Schema: warranties
{
  _id: ObjectId,
  warranty_id: Number,         // Custom sequential ID
  serial_id: Number,           // Reference to product serial
  warranty_start: Date,
  warranty_end: Date,
  warranty_type: String,       // 'standard', 'extended', 'premium'
  
  // Extended warranty details
  coverage_details: {
    parts: Boolean,
    labor: Boolean,
    accidental_damage: Boolean,
    specific_exclusions: [String]
  },
  
  // Claim history (embedded for quick access)
  claims: [{
    claim_id: ObjectId,
    claim_date: Date,
    issue_description: String,
    resolution: String,
    status: String,            // 'pending', 'approved', 'rejected', 'closed'
    resolved_date: Date
  }],
  
  // Status
  status: String,              // 'active', 'expired', 'claimed'
  
  // Notifications
  notification_sent: {
    expiry_30_days: Boolean,
    expiry_7_days: Boolean,
    expired: Boolean
  },
  
  created_at: Date,
  updated_at: Date,
  
  // Indexes
  // { warranty_id: 1 } unique
  // { serial_id: 1 }
  // { warranty_end: 1 }
  // { status: 1 }
}
```

### 3.5 Owners Collection

```javascript
// MongoDB Schema: owners
{
  _id: ObjectId,
  owner_id: Number,            // Custom sequential ID
  name: String,                // Required
  
  // Flexible contact details (JSON as specified)
  contact: {
    email: String,
    phone: String,
    alternate_phone: String,
    preferred_contact: String,  // 'email', 'phone', 'sms'
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postal_code: String
  },
  
  // Identity verification (optional)
  identity_verified: Boolean,
  identity_documents: [{
    type: String,              // 'government_id', 'passport', 'drivers_license'
    document_hash: String,     // Hash of document for verification
    verified_at: Date
  }],
  
  status: String,              // 'active', 'inactive'
  created_at: Date,
  updated_at: Date,
  
  // Indexes
  // { owner_id: 1 } unique
  // { 'contact.email': 1 }
  // { name: 'text' }
}
```

### 3.6 Users Collection (Authentication)

```javascript
// MongoDB Schema: users
{
  _id: ObjectId,
  email: String,               // Required, unique
  password_hash: String,       // bcrypt hashed
  role: String,                // 'admin', 'vendor', 'owner', 'viewer'
  
  // Profile linking
  linked_vendor_id: Number,    // If role is 'vendor'
  linked_owner_id: Number,     // If role is 'owner'
  
  // Account status
  status: String,              // 'active', 'inactive', 'suspended'
  email_verified: Boolean,
  last_login: Date,
  
  // Security
  refresh_tokens: [String],
  password_reset_token: String,
  password_reset_expires: Date,
  
  created_at: Date,
  updated_at: Date,
  
  // Indexes
  // { email: 1 } unique
}
```

---

## 4. Neo4j Graph Model

### 4.1 Node Types

```cypher
// Vendor Node
(:Vendor {
  vendor_id: Integer,
  name: String,
  mongo_id: String  // Reference to MongoDB document
})

// Product Node
(:Product {
  product_id: Integer,
  name: String,
  model_code: String,
  mongo_id: String
})

// Serial Node (Product Instance)
(:Serial {
  serial_id: Integer,
  serial_hash: String,
  status: String,
  mongo_id: String
})

// Owner Node
(:Owner {
  owner_id: Integer,
  name: String,
  mongo_id: String
})

// AuthenticityCheck Node
(:AuthCheck {
  check_id: String,
  checked_at: DateTime,
  verification_result: Boolean,
  verification_details: String,
  signature: String
})
```

### 4.2 Relationship Types

```cypher
// Vendor manufactures Product
(:Vendor)-[:MANUFACTURES {since: Date}]->(:Product)

// Product has Serial instances
(:Product)-[:HAS_SERIAL {manufactured_at: Date}]->(:Serial)

// Serial is owned by Owner (with temporal data)
(:Serial)-[:OWNED_BY {
  acquired_at: DateTime,
  relinquished_at: DateTime,  // null if current owner
  proof_document: String      // Hash of proof of purchase
}]->(:Owner)

// Ownership transfers (for history)
(:Owner)-[:TRANSFERRED_TO {
  date: DateTime,
  serial_id: Integer,
  transfer_type: String  // 'sale', 'gift', 'warranty_claim'
}]->(:Owner)

// Authenticity verification
(:Serial)-[:VERIFIED {
  checked_at: DateTime,
  result: Boolean
}]->(:AuthCheck)
```

### 4.3 Sample Cypher Queries

```cypher
// Get complete ownership history for a serial
MATCH path = (s:Serial {serial_hash: $hash})-[:OWNED_BY*]->(o:Owner)
RETURN path
ORDER BY relationships(path)[0].acquired_at

// Get current owner of a product
MATCH (s:Serial {serial_hash: $hash})-[r:OWNED_BY]->(o:Owner)
WHERE r.relinquished_at IS NULL
RETURN o

// Get all products a vendor manufactures with their serial counts
MATCH (v:Vendor)-[:MANUFACTURES]->(p:Product)
OPTIONAL MATCH (p)-[:HAS_SERIAL]->(s:Serial)
RETURN v.name, p.name, count(s) as serial_count

// Get authenticity check history
MATCH (s:Serial {serial_hash: $hash})-[v:VERIFIED]->(ac:AuthCheck)
RETURN ac
ORDER BY ac.checked_at DESC
LIMIT 10

// Find potential fraud patterns (same serial verified from different locations)
MATCH (s:Serial)-[:VERIFIED]->(ac1:AuthCheck),
      (s)-[:VERIFIED]->(ac2:AuthCheck)
WHERE ac1.check_id <> ac2.check_id
  AND duration.between(ac1.checked_at, ac2.checked_at).hours < 24
RETURN s, ac1, ac2
```

---

## 5. Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | 20.x LTS | JavaScript runtime |
| **Framework** | Express.js | 4.x | Web framework |
| **Language** | TypeScript | 5.x | Type safety |
| **MongoDB ODM** | Mongoose | 8.x | MongoDB object modeling |
| **Neo4j Driver** | neo4j-driver | 5.x | Neo4j connectivity |
| **Authentication** | jsonwebtoken | 9.x | JWT tokens |
| **Password Hashing** | bcryptjs | 2.x | Secure password hashing |
| **Validation** | Zod | 3.x | Schema validation |
| **Crypto** | Node crypto + node-forge | Built-in | Digital signatures |
| **API Docs** | Swagger/OpenAPI | 3.x | API documentation |
| **Logging** | Winston | 3.x | Structured logging |
| **Testing** | Jest | 29.x | Unit/Integration testing |
| **Process Manager** | PM2 | 5.x | Production process management |

---

## 6. Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts           # MongoDB & Neo4j connection
│   │   ├── env.ts                # Environment variables
│   │   └── constants.ts          # App constants
│   │
│   ├── models/                   # MongoDB Mongoose models
│   │   ├── Vendor.model.ts
│   │   ├── Product.model.ts
│   │   ├── ProductSerial.model.ts
│   │   ├── Warranty.model.ts
│   │   ├── Owner.model.ts
│   │   └── User.model.ts
│   │
│   ├── graph/                    # Neo4j graph operations
│   │   ├── neo4j.client.ts       # Neo4j driver setup
│   │   ├── vendor.graph.ts
│   │   ├── product.graph.ts
│   │   ├── ownership.graph.ts
│   │   └── authenticity.graph.ts
│   │
│   ├── services/                 # Business logic layer
│   │   ├── vendor.service.ts
│   │   ├── product.service.ts
│   │   ├── warranty.service.ts
│   │   ├── owner.service.ts
│   │   ├── ownership.service.ts
│   │   ├── authenticity.service.ts
│   │   ├── auth.service.ts
│   │   └── crypto.service.ts     # Signature generation/verification
│   │
│   ├── controllers/              # Request handlers
│   │   ├── vendor.controller.ts
│   │   ├── product.controller.ts
│   │   ├── warranty.controller.ts
│   │   ├── owner.controller.ts
│   │   ├── ownership.controller.ts
│   │   ├── authenticity.controller.ts
│   │   └── auth.controller.ts
│   │
│   ├── routes/                   # API route definitions
│   │   ├── index.ts
│   │   ├── vendor.routes.ts
│   │   ├── product.routes.ts
│   │   ├── warranty.routes.ts
│   │   ├── owner.routes.ts
│   │   ├── ownership.routes.ts
│   │   ├── authenticity.routes.ts
│   │   └── auth.routes.ts
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.middleware.ts    # JWT verification
│   │   ├── rbac.middleware.ts    # Role-based access control
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logging.middleware.ts
│   │
│   ├── validators/               # Zod validation schemas
│   │   ├── vendor.validator.ts
│   │   ├── product.validator.ts
│   │   ├── warranty.validator.ts
│   │   ├── owner.validator.ts
│   │   └── auth.validator.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── vendor.types.ts
│   │   ├── product.types.ts
│   │   ├── warranty.types.ts
│   │   ├── owner.types.ts
│   │   ├── auth.types.ts
│   │   └── common.types.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── hash.utils.ts
│   │   ├── date.utils.ts
│   │   ├── response.utils.ts
│   │   ├── id-generator.utils.ts
│   │   └── qr.utils.ts
│   │
│   ├── jobs/                     # Background jobs
│   │   ├── warranty-expiry.job.ts
│   │   └── sync.job.ts           # MongoDB-Neo4j sync
│   │
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── scripts/
│   ├── seed.ts                   # Database seeding
│   └── migrate.ts                # Migrations
│
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## 7. API Endpoints Design

### 7.1 Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Required |
| POST | `/api/auth/refresh` | Refresh access token | Required |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password` | Reset password | Public |

### 7.2 Vendor Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/vendors` | List all vendors | Required |
| GET | `/api/vendors/:id` | Get vendor details | Required |
| POST | `/api/vendors` | Create vendor | Admin |
| PUT | `/api/vendors/:id` | Update vendor | Admin/Vendor |
| DELETE | `/api/vendors/:id` | Delete vendor | Admin |
| GET | `/api/vendors/:id/products` | Get vendor's products | Required |
| POST | `/api/vendors/:id/public-key` | Update public key | Admin/Vendor |

### 7.3 Product Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List products | Required |
| GET | `/api/products/:id` | Get product details | Required |
| POST | `/api/products` | Create product | Admin/Vendor |
| PUT | `/api/products/:id` | Update product | Admin/Vendor |
| DELETE | `/api/products/:id` | Delete product | Admin |
| GET | `/api/products/:id/serials` | Get product serials | Required |
| POST | `/api/products/:id/serials` | Register serial | Admin/Vendor |

### 7.4 Warranty Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/warranties` | List warranties | Required |
| GET | `/api/warranties/:id` | Get warranty details | Required |
| POST | `/api/warranties` | Create warranty | Admin/Vendor |
| PUT | `/api/warranties/:id` | Update warranty | Admin/Vendor |
| GET | `/api/warranties/expiring` | Get expiring warranties | Required |
| POST | `/api/warranties/:id/claims` | Submit warranty claim | Owner |

### 7.5 Owner Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/owners` | List owners | Admin |
| GET | `/api/owners/:id` | Get owner details | Required |
| POST | `/api/owners` | Create owner | Required |
| PUT | `/api/owners/:id` | Update owner | Owner/Admin |
| GET | `/api/owners/:id/products` | Get owned products | Required |

### 7.6 Ownership Endpoints (Neo4j-powered)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ownership/:serialId/history` | Get ownership history | Required |
| GET | `/api/ownership/:serialId/current` | Get current owner | Required |
| POST | `/api/ownership/transfer` | Transfer ownership | Owner |
| GET | `/api/ownership/graph/:serialId` | Get ownership graph | Required |

### 7.7 Authenticity Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/authenticity/verify` | Verify product authenticity | Public |
| GET | `/api/authenticity/checks/:serialId` | Get verification history | Required |
| POST | `/api/authenticity/sign` | Generate vendor signature | Vendor |
| GET | `/api/authenticity/certificate/:checkId` | Get verification certificate | Public |

---

## 8. Core Service Implementations

### 8.1 Database Connection Setup

```typescript
// src/config/database.ts
import mongoose from 'mongoose';
import neo4j, { Driver } from 'neo4j-driver';
import { env } from './env';
import { logger } from '../utils/logger';

// MongoDB Connection
export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Neo4j Connection
let neo4jDriver: Driver;

export const connectNeo4j = async (): Promise<Driver> => {
  try {
    neo4jDriver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD)
    );
    
    // Verify connectivity
    await neo4jDriver.verifyConnectivity();
    logger.info('Neo4j connected successfully');
    
    return neo4jDriver;
  } catch (error) {
    logger.error('Neo4j connection failed:', error);
    process.exit(1);
  }
};

export const getNeo4jSession = () => {
  if (!neo4jDriver) {
    throw new Error('Neo4j driver not initialized');
  }
  return neo4jDriver.session();
};

export const closeConnections = async (): Promise<void> => {
  await mongoose.disconnect();
  await neo4jDriver?.close();
};
```

### 8.2 Crypto Service for Digital Signatures

```typescript
// src/services/crypto.service.ts
import crypto from 'crypto';
import forge from 'node-forge';

export class CryptoService {
  /**
   * Generate SHA-256 hash of serial number
   */
  static hashSerial(serial: string): string {
    return crypto.createHash('sha256').update(serial).digest('hex');
  }

  /**
   * Generate RSA key pair for vendor
   */
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKey, privateKey };
  }

  /**
   * Sign data with vendor's private key
   */
  static signData(data: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'base64');
  }

  /**
   * Verify signature with vendor's public key
   */
  static verifySignature(
    data: string,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      return verify.verify(publicKey, signature, 'base64');
    } catch {
      return false;
    }
  }

  /**
   * Encrypt serial number for storage
   */
  static encryptSerial(serial: string, key: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      crypto.randomBytes(16)
    );
    let encrypted = cipher.update(serial, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
}
```

### 8.3 Authenticity Service

```typescript
// src/services/authenticity.service.ts
import { ProductSerial } from '../models/ProductSerial.model';
import { Vendor } from '../models/Vendor.model';
import { authenticityGraph } from '../graph/authenticity.graph';
import { CryptoService } from './crypto.service';
import { v4 as uuidv4 } from 'uuid';

interface VerificationResult {
  isAuthentic: boolean;
  productInfo?: {
    name: string;
    vendor: string;
    manufactureDate: Date;
  };
  warrantyInfo?: {
    status: string;
    expiryDate: Date;
  };
  ownerInfo?: {
    name: string;
    since: Date;
  };
  checkId: string;
  verificationDetails: string;
}

export class AuthenticityService {
  /**
   * Verify product authenticity by serial hash
   */
  async verifyProduct(serialHash: string): Promise<VerificationResult> {
    const checkId = uuidv4();
    
    // Find serial in MongoDB
    const serial = await ProductSerial.findOne({ serial_hash: serialHash })
      .populate('product_id')
      .lean();

    if (!serial) {
      // Log failed verification attempt
      await authenticityGraph.logVerification({
        checkId,
        serialHash,
        result: false,
        details: 'Serial not found in database',
      });

      return {
        isAuthentic: false,
        checkId,
        verificationDetails: 'Product not found. This may be a counterfeit.',
      };
    }

    // Get vendor for signature verification
    const vendor = await Vendor.findOne({ vendor_id: serial.product_id.vendor_id });

    if (!vendor) {
      return {
        isAuthentic: false,
        checkId,
        verificationDetails: 'Vendor not found. Authenticity cannot be verified.',
      };
    }

    // Verify digital signature
    const isSignatureValid = CryptoService.verifySignature(
      serialHash,
      serial.vendor_signature,
      vendor.public_key
    );

    if (!isSignatureValid) {
      await authenticityGraph.logVerification({
        checkId,
        serialHash,
        serialId: serial.serial_id,
        result: false,
        details: 'Digital signature verification failed',
      });

      return {
        isAuthentic: false,
        checkId,
        verificationDetails: 'Signature verification failed. Possible tampering detected.',
      };
    }

    // Get current owner from Neo4j
    const currentOwner = await authenticityGraph.getCurrentOwner(serial.serial_id);

    // Get warranty status
    const warrantyInfo = await this.getWarrantyStatus(serial.serial_id);

    // Log successful verification
    await authenticityGraph.logVerification({
      checkId,
      serialHash,
      serialId: serial.serial_id,
      result: true,
      details: 'Product verified successfully',
      signature: serial.vendor_signature,
    });

    return {
      isAuthentic: true,
      productInfo: {
        name: serial.product_id.name,
        vendor: vendor.name,
        manufactureDate: serial.manufacture_date,
      },
      warrantyInfo,
      ownerInfo: currentOwner,
      checkId,
      verificationDetails: 'Product is authentic and verified.',
    };
  }

  /**
   * Get verification history for a serial
   */
  async getVerificationHistory(serialId: number): Promise<any[]> {
    return authenticityGraph.getVerificationHistory(serialId);
  }

  /**
   * Generate verification certificate
   */
  async generateCertificate(checkId: string): Promise<string> {
    const check = await authenticityGraph.getCheckById(checkId);
    // Generate PDF certificate or JSON response
    return JSON.stringify({
      certificate_id: checkId,
      verified_at: check.checked_at,
      result: check.verification_result,
      product_details: check.product_info,
    });
  }
}
```

### 8.4 Ownership Service (Neo4j Integration)

```typescript
// src/services/ownership.service.ts
import { getNeo4jSession } from '../config/database';
import { Owner } from '../models/Owner.model';
import { ProductSerial } from '../models/ProductSerial.model';

interface OwnershipRecord {
  ownerId: number;
  ownerName: string;
  acquiredAt: Date;
  relinquishedAt?: Date;
  transferType?: string;
}

export class OwnershipService {
  /**
   * Get complete ownership history for a serial
   */
  async getOwnershipHistory(serialId: number): Promise<OwnershipRecord[]> {
    const session = getNeo4jSession();
    
    try {
      const result = await session.run(
        `
        MATCH (s:Serial {serial_id: $serialId})-[r:OWNED_BY]->(o:Owner)
        RETURN o.owner_id as ownerId, 
               o.name as ownerName,
               r.acquired_at as acquiredAt,
               r.relinquished_at as relinquishedAt
        ORDER BY r.acquired_at ASC
        `,
        { serialId }
      );

      return result.records.map(record => ({
        ownerId: record.get('ownerId').toNumber(),
        ownerName: record.get('ownerName'),
        acquiredAt: new Date(record.get('acquiredAt')),
        relinquishedAt: record.get('relinquishedAt') 
          ? new Date(record.get('relinquishedAt')) 
          : undefined,
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Get current owner of a serial
   */
  async getCurrentOwner(serialId: number): Promise<OwnershipRecord | null> {
    const session = getNeo4jSession();
    
    try {
      const result = await session.run(
        `
        MATCH (s:Serial {serial_id: $serialId})-[r:OWNED_BY]->(o:Owner)
        WHERE r.relinquished_at IS NULL
        RETURN o.owner_id as ownerId,
               o.name as ownerName,
               r.acquired_at as acquiredAt
        `,
        { serialId }
      );

      if (result.records.length === 0) return null;

      const record = result.records[0];
      return {
        ownerId: record.get('ownerId').toNumber(),
        ownerName: record.get('ownerName'),
        acquiredAt: new Date(record.get('acquiredAt')),
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Transfer ownership of a product
   */
  async transferOwnership(
    serialId: number,
    fromOwnerId: number,
    toOwnerId: number,
    proofDocument?: string
  ): Promise<void> {
    const session = getNeo4jSession();
    const tx = session.beginTransaction();

    try {
      // Verify current owner
      const currentOwner = await this.getCurrentOwner(serialId);
      if (!currentOwner || currentOwner.ownerId !== fromOwnerId) {
        throw new Error('Invalid current owner');
      }

      // Update previous ownership relationship
      await tx.run(
        `
        MATCH (s:Serial {serial_id: $serialId})-[r:OWNED_BY]->(o:Owner {owner_id: $fromOwnerId})
        WHERE r.relinquished_at IS NULL
        SET r.relinquished_at = datetime()
        `,
        { serialId, fromOwnerId }
      );

      // Create new ownership relationship
      await tx.run(
        `
        MATCH (s:Serial {serial_id: $serialId})
        MATCH (o:Owner {owner_id: $toOwnerId})
        CREATE (s)-[:OWNED_BY {
          acquired_at: datetime(),
          proof_document: $proofDocument
        }]->(o)
        `,
        { serialId, toOwnerId, proofDocument }
      );

      // Create transfer relationship between owners
      await tx.run(
        `
        MATCH (from:Owner {owner_id: $fromOwnerId})
        MATCH (to:Owner {owner_id: $toOwnerId})
        CREATE (from)-[:TRANSFERRED_TO {
          date: datetime(),
          serial_id: $serialId,
          transfer_type: 'sale'
        }]->(to)
        `,
        { fromOwnerId, toOwnerId, serialId }
      );

      await tx.commit();

      // Update MongoDB status
      await ProductSerial.updateOne(
        { serial_id: serialId },
        { status: 'sold', updated_at: new Date() }
      );
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Register initial ownership (at purchase)
   */
  async registerOwnership(
    serialId: number,
    ownerId: number,
    proofDocument?: string
  ): Promise<void> {
    const session = getNeo4jSession();

    try {
      // Check if serial already has owner
      const existing = await this.getCurrentOwner(serialId);
      if (existing) {
        throw new Error('Product already has an owner');
      }

      // Ensure serial node exists
      await session.run(
        `
        MERGE (s:Serial {serial_id: $serialId})
        `,
        { serialId }
      );

      // Ensure owner node exists
      const owner = await Owner.findOne({ owner_id: ownerId });
      await session.run(
        `
        MERGE (o:Owner {owner_id: $ownerId})
        ON CREATE SET o.name = $name, o.mongo_id = $mongoId
        `,
        { ownerId, name: owner?.name, mongoId: owner?._id.toString() }
      );

      // Create ownership relationship
      await session.run(
        `
        MATCH (s:Serial {serial_id: $serialId})
        MATCH (o:Owner {owner_id: $ownerId})
        CREATE (s)-[:OWNED_BY {
          acquired_at: datetime(),
          proof_document: $proofDocument
        }]->(o)
        `,
        { serialId, ownerId, proofDocument }
      );
    } finally {
      await session.close();
    }
  }
}
```

---

## 9. Data Synchronization Strategy

### 9.1 MongoDB to Neo4j Sync

When data is created/updated in MongoDB, we need to sync reference nodes to Neo4j:

```typescript
// src/jobs/sync.job.ts
import { getNeo4jSession } from '../config/database';
import { Vendor } from '../models/Vendor.model';
import { Product } from '../models/Product.model';
import { ProductSerial } from '../models/ProductSerial.model';
import { Owner } from '../models/Owner.model';

export class SyncJob {
  /**
   * Sync vendor to Neo4j (called after MongoDB save)
   */
  static async syncVendor(vendorId: number): Promise<void> {
    const session = getNeo4jSession();
    const vendor = await Vendor.findOne({ vendor_id: vendorId });

    try {
      await session.run(
        `
        MERGE (v:Vendor {vendor_id: $vendorId})
        SET v.name = $name, v.mongo_id = $mongoId, v.updated_at = datetime()
        `,
        {
          vendorId,
          name: vendor?.name,
          mongoId: vendor?._id.toString(),
        }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Sync product to Neo4j with vendor relationship
   */
  static async syncProduct(productId: number): Promise<void> {
    const session = getNeo4jSession();
    const product = await Product.findOne({ product_id: productId });

    try {
      await session.run(
        `
        MERGE (p:Product {product_id: $productId})
        SET p.name = $name, 
            p.model_code = $modelCode,
            p.mongo_id = $mongoId,
            p.updated_at = datetime()
        WITH p
        MATCH (v:Vendor {vendor_id: $vendorId})
        MERGE (v)-[:MANUFACTURES]->(p)
        `,
        {
          productId,
          name: product?.name,
          modelCode: product?.model_code,
          mongoId: product?._id.toString(),
          vendorId: product?.vendor_id,
        }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Sync serial to Neo4j with product relationship
   */
  static async syncSerial(serialId: number): Promise<void> {
    const session = getNeo4jSession();
    const serial = await ProductSerial.findOne({ serial_id: serialId });

    try {
      await session.run(
        `
        MERGE (s:Serial {serial_id: $serialId})
        SET s.serial_hash = $serialHash,
            s.status = $status,
            s.mongo_id = $mongoId,
            s.updated_at = datetime()
        WITH s
        MATCH (p:Product {product_id: $productId})
        MERGE (p)-[:HAS_SERIAL {manufactured_at: datetime($manufactureDate)}]->(s)
        `,
        {
          serialId,
          serialHash: serial?.serial_hash,
          status: serial?.status,
          mongoId: serial?._id.toString(),
          productId: serial?.product_id,
          manufactureDate: serial?.manufacture_date.toISOString(),
        }
      );
    } finally {
      await session.close();
    }
  }
}
```

### 9.2 Mongoose Middleware for Auto-Sync

```typescript
// src/models/Vendor.model.ts
import { Schema, model, Document } from 'mongoose';
import { SyncJob } from '../jobs/sync.job';

const VendorSchema = new Schema({
  // ... schema definition
});

// Post-save hook for Neo4j sync
VendorSchema.post('save', async function(doc) {
  await SyncJob.syncVendor(doc.vendor_id);
});

VendorSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) await SyncJob.syncVendor(doc.vendor_id);
});

export const Vendor = model<IVendor>('Vendor', VendorSchema);
```

---

## 10. Authentication & Authorization

### 10.1 JWT Authentication

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 10.2 Role-Based Access Control

```typescript
// src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';

type Role = 'admin' | 'vendor' | 'owner' | 'viewer';

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Usage in routes
// router.post('/vendors', authenticate, authorize('admin'), createVendor);
```

---

## 11. Background Jobs

### 11.1 Warranty Expiry Notifications

```typescript
// src/jobs/warranty-expiry.job.ts
import cron from 'node-cron';
import { Warranty } from '../models/Warranty.model';
import { sendEmail } from '../utils/email.utils';

export const startWarrantyExpiryJob = () => {
  // Run daily at 8 AM
  cron.schedule('0 8 * * *', async () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Find warranties expiring in 30 days that haven't been notified
    const expiringWarranties = await Warranty.find({
      warranty_end: { $lte: thirtyDaysFromNow, $gte: new Date() },
      'notification_sent.expiry_30_days': false,
      status: 'active',
    }).populate('serial_id');

    for (const warranty of expiringWarranties) {
      // Get owner email through Neo4j
      const owner = await getOwnerForSerial(warranty.serial_id);
      
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: 'Warranty Expiring Soon',
          template: 'warranty-expiry',
          data: {
            productName: warranty.serial_id.product_id.name,
            expiryDate: warranty.warranty_end,
          },
        });

        // Mark as notified
        await Warranty.updateOne(
          { _id: warranty._id },
          { 'notification_sent.expiry_30_days': true }
        );
      }
    }
  });
};
```

---

## 12. Error Handling

```typescript
// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error:', err);

  // Don't expose internal errors
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
```

---

## 13. Testing Strategy

### 13.1 Unit Tests

```typescript
// tests/unit/services/crypto.service.test.ts
import { CryptoService } from '../../../src/services/crypto.service';

describe('CryptoService', () => {
  describe('hashSerial', () => {
    it('should generate consistent SHA-256 hash', () => {
      const serial = 'ABC123';
      const hash1 = CryptoService.hashSerial(serial);
      const hash2 = CryptoService.hashSerial(serial);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });
  });

  describe('signature verification', () => {
    it('should verify valid signature', () => {
      const { publicKey, privateKey } = CryptoService.generateKeyPair();
      const data = 'test-data';
      const signature = CryptoService.signData(data, privateKey);
      
      expect(CryptoService.verifySignature(data, signature, publicKey)).toBe(true);
    });

    it('should reject tampered data', () => {
      const { publicKey, privateKey } = CryptoService.generateKeyPair();
      const data = 'test-data';
      const signature = CryptoService.signData(data, privateKey);
      
      expect(CryptoService.verifySignature('tampered', signature, publicKey)).toBe(false);
    });
  });
});
```

### 13.2 Integration Tests

```typescript
// tests/integration/authenticity.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDB, teardownTestDB } from '../fixtures/db';

describe('Authenticity API', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/authenticity/verify', () => {
    it('should verify authentic product', async () => {
      const response = await request(app)
        .post('/api/authenticity/verify')
        .send({ serialHash: 'valid-hash-from-fixture' });

      expect(response.status).toBe(200);
      expect(response.body.isAuthentic).toBe(true);
    });

    it('should reject unknown serial', async () => {
      const response = await request(app)
        .post('/api/authenticity/verify')
        .send({ serialHash: 'unknown-hash' });

      expect(response.status).toBe(200);
      expect(response.body.isAuthentic).toBe(false);
    });
  });
});
```

---

## 14. Deployment Configuration

### 14.1 Environment Variables

```bash
# .env.example

# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/warranty_vault

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
```

### 14.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/warranty_vault
      - NEO4J_URI=bolt://neo4j:7687
    depends_on:
      - mongo
      - neo4j
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  neo4j:
    image: neo4j:5
    environment:
      - NEO4J_AUTH=neo4j/password
    volumes:
      - neo4j_data:/data
    ports:
      - "7474:7474"
      - "7687:7687"

volumes:
  mongo_data:
  neo4j_data:
```

---

## 15. Implementation Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1** | Week 1 | Project setup, database connections, models |
| **Phase 2** | Week 2 | Core CRUD services and routes |
| **Phase 3** | Week 3 | Authentication, authorization, middleware |
| **Phase 4** | Week 4 | Crypto service, authenticity verification |
| **Phase 5** | Week 5 | Neo4j ownership tracking, graph queries |
| **Phase 6** | Week 6 | Background jobs, testing, deployment |

---

## 16. API Documentation

The API will be documented using OpenAPI 3.0 specification with Swagger UI available at `/api/docs`.

```typescript
// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Digital Warranty Vault API',
      version: '1.0.0',
      description: 'API for warranty management and product authentication',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

---

## 17. Success Criteria

- [ ] All API endpoints respond under 200ms
- [ ] MongoDB queries optimized with proper indexing
- [ ] Neo4j traversals complete in under 100ms
- [ ] JWT token refresh mechanism working
- [ ] Digital signature verification 100% accurate
- [ ] Background jobs running reliably
- [ ] 90%+ test coverage
- [ ] API documentation complete
- [ ] Docker deployment working
