# Digital Warranty Vault & Product Authenticity Verification System
## Presentation Content

---

## SLIDE 1: Requirement Analysis & Details of MongoDB, Neo4j

### Project Overview
**Digital Warranty Vault & Product Authenticity Verification System**

A comprehensive solution for managing product warranties, verifying product authenticity, and tracking ownership history using a polyglot persistence architecture.

### Core Requirements

#### Functional Requirements
1. **Vendor Management**
   - Register vendors with digital signature capabilities
   - Store vendor public keys for authenticity verification
   - Manage vendor profiles and product portfolios

2. **Product & Serial Management**
   - Register product models with detailed specifications
   - Generate unique serial numbers with cryptographic hashing
   - Create QR codes for quick product verification
   - Support digital signatures from vendors

3. **Warranty Management**
   - Create and track warranty periods (standard, extended, premium)
   - Monitor warranty expiration with automated notifications
   - Handle warranty claims and service history
   - Support multiple coverage types

4. **Authenticity Verification**
   - Public-facing verification portal
   - QR code scanning capability
   - Digital signature verification using RSA/ECDSA
   - Fraud detection and alert system

5. **Ownership Tracking**
   - Track complete ownership history
   - Support ownership transfers with proof documentation
   - Visualize ownership timeline and chains

#### Non-Functional Requirements
- **Security**: Cryptographic hashing, digital signatures, encrypted storage
- **Scalability**: Polyglot persistence for optimized data access patterns
- **Performance**: Fast lookups for serial verification, efficient graph traversals
- **Reliability**: Data consistency across MongoDB and Neo4j

---

### Why MongoDB? (Document-Centric Data)

#### Strengths
- **Flexible Schema**: Perfect for products with varying specifications
- **JSON-like Documents**: Natural fit for owner contact details (JSON field)
- **Fast Lookups**: Efficient indexed queries for serial hash verification
- **Rich Queries**: Complex filters for warranties, products, vendors
- **Embedded Data**: Quick access to warranty claims, specifications

#### Use Cases in Our System
1. **Vendors Collection**
   - Vendor profiles with flexible metadata
   - Address information as embedded documents
   - Public key storage for verification

2. **Products Collection**
   - Product details with varying specifications (JSON)
   - Warranty policies embedded
   - Full-text search on name and description

3. **Product Serials Collection**
   - Serial hash for quick lookup (indexed)
   - Encrypted original serial storage
   - QR code data and digital signatures

4. **Warranties Collection**
   - Warranty periods and coverage details
   - Embedded claims history for quick access
   - Status tracking with expiry notifications

5. **Owners Collection**
   - Owner profiles with flexible contact JSON
   - Address information
   - Identity verification documents

6. **Users Collection**
   - Authentication and authorization
   - Role-based access control (admin, vendor, user)
   - JWT token management

---

### Why Neo4j? (Relationship-Centric Data)

#### Strengths
- **Graph Model**: Natural representation of product-owner-vendor relationships
- **Traversal Performance**: Fast multi-hop queries for ownership chains
- **Temporal Relationships**: Track ownership over time  
- **Pattern Matching**: Detect fraud patterns and suspicious activity
- **Visual Analytics**: Graph visualization for ownership history

#### Use Cases in Our System
1. **Ownership History**
   - Chain of ownership with temporal data
   - `(:Serial)-[:OWNED_BY {acquired_at, relinquished_at}]->(:Owner)`
   - Efficient queries: "Who owned this product in 2023?"

2. **Ownership Transfers**
   - Transfer relationships between owners
   - `(:Owner)-[:TRANSFERRED_TO {date, serial_id}]->(:Owner)`
   - Track transfer reasons (sale, gift, warranty claim)

3. **Product Lineage**
   - Vendor-Product-Serial relationships
   - `(:Vendor)-[:MANUFACTURES]->(:Product)-[:HAS_SERIAL]->(:Serial)`

4. **Authenticity Checks**
   - Verification audit trail
   - `(:Serial)-[:VERIFIED {checked_at, result}]->(:AuthCheck)`
   - Fraud detection: Multiple verifications from different locations

5. **Graph Analytics**
   - Identify popular products
   - Track vendor performance
   - Detect fraudulent patterns

---

### Polyglot Persistence Strategy

#### Data Distribution

| Data Type | Database | Reason |
|-----------|----------|--------|
| Vendor profiles, product details | MongoDB | Complex documents with flexible fields |
| Owner contact info (JSON) | MongoDB | Semi-structured, varies per owner |
| Serial numbers & hashes | MongoDB | Fast indexed lookups |
| Warranties & claims | MongoDB | Embedded documents for quick access |
| Ownership history & transfers | Neo4j | Temporal relationships, chain traversals |
| Authenticity verification logs | Neo4j | Relationship-based audit trail |
| Product-vendor-owner graph | Neo4j | Multi-hop traversals, recommendations |

#### Synchronization Strategy
- **Write to MongoDB first** (source of truth for entities)
- **Sync to Neo4j** (for relationship tracking)
- **Background job** periodically validates consistency
- Each entity stores `mongo_id` reference in Neo4j nodes

---

## SLIDE 2: ER Diagram

### Entity-Relationship Model

```mermaid
erDiagram
    VENDOR ||--o{ PRODUCT : manufactures
    PRODUCT ||--o{ PRODUCT_SERIAL : "has instances"
    PRODUCT_SERIAL ||--o| WARRANTY : "covered by"
    PRODUCT_SERIAL }o--|| OWNER : "currently owned by"
    OWNER ||--o{ OWNERSHIP_HISTORY : "has history"
    PRODUCT_SERIAL ||--o{ OWNERSHIP_HISTORY : "tracked in"
    PRODUCT_SERIAL ||--o{ AUTHENTICITY_CHECK : "verified through"
    USER }o--o| VENDOR : "may be linked to"
    USER }o--o| OWNER : "may be linked to"
    
    VENDOR {
        int vendor_id PK
        string name
        string contact_email UK
        string public_key
        string description
        json address
        string status
        datetime created_at
        datetime updated_at
    }
    
    PRODUCT {
        int product_id PK
        int vendor_id FK
        string model_code UK
        string name
        string description
        string category
        json specifications
        json warranty_policy
        array images
        string status
        datetime created_at
        datetime updated_at
    }
    
    PRODUCT_SERIAL {
        int serial_id PK
        int product_id FK
        string serial_hash UK
        string encrypted_serial
        date manufacture_date
        string batch_number
        string qr_code_data
        string vendor_signature
        string status
        date registration_date
        datetime created_at
        datetime updated_at
    }
    
    WARRANTY {
        int warranty_id PK
        int serial_id FK
        date warranty_start
        date warranty_end
        string warranty_type
        json coverage_details
        array claims
        string status
        json notification_sent
        datetime created_at
        datetime updated_at
    }
    
    OWNER {
        int owner_id PK
        string name
        json contact
        json address
        boolean identity_verified
        array identity_documents
        string status
        datetime created_at
        datetime updated_at
    }
    
    OWNERSHIP_HISTORY {
        string relationship_id PK
        int serial_id FK
        int owner_id FK
        datetime acquired_at
        datetime relinquished_at
        string proof_document
        string transfer_type
    }
    
    AUTHENTICITY_CHECK {
        string check_id PK
        string serial_hash
        datetime checked_at
        boolean verification_result
        string verification_details
        string signature
        json location_data
    }
    
    USER {
        objectid _id PK
        string email UK
        string password_hash
        string role
        int linked_vendor_id FK
        int linked_owner_id FK
        string status
        boolean email_verified
        datetime last_login
        datetime created_at
        datetime updated_at
    }
```

### Key Relationships

1. **Vendor ➜ Product** (1:N)
   - Each vendor manufactures multiple products
   - Products belong to one vendor

2. **Product ➜ Product Serial** (1:N)
   - Each product model has multiple serial instances
   - Each serial belongs to one product model

3. **Product Serial ➜ Warranty** (1:1)
   - Each serial has one warranty
   - Warranty covers one specific serial

4. **Product Serial ➜ Owner** (N:1 current, N:N historical via Neo4j)
   - Each serial currently owned by one owner (in MongoDB)
   - Full ownership chain tracked in Neo4j graph

5. **Product Serial ➜ Authenticity Check** (1:N)
   - Each serial can be verified multiple times
   - Checks logged for audit trail

---

## SLIDE 3: Schema Design

### MongoDB Collections

#### 1. Vendors Collection
```javascript
{
  _id: ObjectId,
  vendor_id: Number,              // Sequential ID
  name: String,                   // Required, indexed
  contact_email: String,          // Unique
  public_key: String,             // RSA public key
  description: String,
  logo_url: String,
  status: String,                 // 'active', 'inactive', 'suspended'
  
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postal_code: String
  },
  
  created_at: Date,
  updated_at: Date
}

// Indexes
// { name: 1 }
// { contact_email: 1 } unique
// { vendor_id: 1 } unique
```

#### 2. Products Collection
```javascript
{
  _id: ObjectId,
  product_id: Number,
  vendor_id: Number,              // FK to Vendor
  model_code: String,             // Unique
  name: String,
  description: String,
  category: String,
  
  specifications: {               // Flexible JSON
    weight: String,
    dimensions: String,
    color: String,
    // ... product-specific fields
  },
  
  warranty_policy: {
    default_duration_months: Number,
    warranty_types: [String]      // ['standard', 'extended', 'premium']
  },
  
  images: [String],
  status: String,
  created_at: Date,
  updated_at: Date
}

// Indexes
// { product_id: 1 } unique
// { vendor_id: 1 }
// { model_code: 1 } unique
// { name: 'text', description: 'text' }
```

#### 3. Product_Serials Collection
```javascript
{
  _id: ObjectId,
  serial_id: Number,
  product_id: Number,             // FK to Product
  serial_hash: String,            // SHA-256, indexed, unique
  encrypted_serial: String,       // AES-256-GCM encrypted
  manufacture_date: Date,
  batch_number: String,
  qr_code_data: String,
  vendor_signature: String,       // RSA signature
  status: String,                 // 'manufactured', 'registered', 'sold'
  registration_date: Date,
  created_at: Date,
  updated_at: Date
}

// Indexes
// { serial_id: 1 } unique
// { serial_hash: 1 } unique  ← Critical for fast lookups
// { product_id: 1 }
```

#### 4. Warranties Collection
```javascript
{
  _id: ObjectId,
  warranty_id: Number,
  serial_id: Number,              // FK to Product Serial
  warranty_start: Date,
  warranty_end: Date,
  warranty_type: String,
  
  coverage_details: {
    parts: Boolean,
    labor: Boolean,
    accidental_damage: Boolean,
    specific_exclusions: [String]
  },
  
  claims: [{                      // Embedded for quick access
    claim_id: ObjectId,
    claim_date: Date,
    issue_description: String,
    resolution: String,
    status: String,
    resolved_date: Date
  }],
  
  status: String,                 // 'active', 'expired', 'claimed'
  
  notification_sent: {
    expiry_30_days: Boolean,
    expiry_7_days: Boolean,
    expired: Boolean
  },
  
  created_at: Date,
  updated_at: Date
}

// Indexes
// { warranty_id: 1 } unique
// { serial_id: 1 }
// { warranty_end: 1 }  ← For expiry queries
// { status: 1 }
```

#### 5. Owners Collection
```javascript
{
  _id: ObjectId,
  owner_id: Number,
  name: String,
  
  contact: {                      // Flexible JSON as required
    email: String,
    phone: String,
    alternate_phone: String,
    preferred_contact: String
  },
  
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postal_code: String
  },
  
  identity_verified: Boolean,
  identity_documents: [{
    type: String,
    document_hash: String,
    verified_at: Date
  }],
  
  status: String,
  created_at: Date,
  updated_at: Date
}

// Indexes
// { owner_id: 1 } unique
// { 'contact.email': 1 }
// { name: 'text' }
```

#### 6. Users Collection
```javascript
{
  _id: ObjectId,
  email: String,                  // Unique
  password_hash: String,          // bcrypt hashed
  role: String,                   // 'admin', 'vendor', 'user'
  
  linked_vendor_id: Number,       // If role is 'vendor'
  linked_owner_id: Number,        // If role is 'user'
  
  status: String,
  email_verified: Boolean,
  last_login: Date,
  
  // Security
  refresh_tokens: [String],
  password_reset_token: String,
  password_reset_expires: Date,
  
  created_at: Date,
  updated_at: Date
}

// Indexes
// { email: 1 } unique
```

---

### Neo4j Graph Schema

#### Node Types

```cypher
// Vendor Node
(:Vendor {
  vendor_id: Integer,
  name: String,
  mongo_id: String              // Reference to MongoDB _id
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

// Authenticity Check Node
(:AuthCheck {
  check_id: String,
  checked_at: DateTime,
  verification_result: Boolean,
  verification_details: String,
  signature: String
})
```

#### Relationship Types

```cypher
// Vendor manufactures Product
(:Vendor)-[:MANUFACTURES {
  since: Date
}]->(:Product)

// Product has Serial instances
(:Product)-[:HAS_SERIAL {
  manufactured_at: Date
}]->(:Serial)

// Serial is owned by Owner (temporal)
(:Serial)-[:OWNED_BY {
  acquired_at: DateTime,
  relinquished_at: DateTime,    // null if current owner
  proof_document: String        // Hash of proof of purchase
}]->(:Owner)

// Ownership transfers
(:Owner)-[:TRANSFERRED_TO {
  date: DateTime,
  serial_id: Integer,
  transfer_type: String         // 'sale', 'gift', 'warranty_claim'
}]->(:Owner)

// Authenticity verification
(:Serial)-[:VERIFIED {
  checked_at: DateTime,
  result: Boolean
}]->(:AuthCheck)
```

---

## SLIDE 4: Implementation & Queries

### Technology Stack

#### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.x LTS |
| Framework | Express.js | 4.x |
| Language | TypeScript | 5.x |
| MongoDB ODM | Mongoose | 8.x |
| Neo4j Driver | neo4j-driver | 5.x |
| Authentication | jsonwebtoken | 9.x |
| Password Hashing | bcryptjs | 2.x |
| Validation | Zod | 3.x |
| Crypto | Node crypto + node-forge | Built-in |

#### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18+ |
| Build Tool | Vite | Latest |
| Language | TypeScript | 5.x |
| Routing | React Router | v6 |
| State Management | Zustand + React Query | Latest |
| HTTP Client | Axios | Latest |
| Forms | React Hook Form + Zod | Latest |
| Charts | Recharts | Latest |
| Icons | Lucide React | Latest |

---

### Backend API Endpoints

#### Authentication
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - User login
POST   /api/auth/logout         - User logout
POST   /api/auth/refresh        - Refresh access token
```

#### Vendors
```
GET    /api/vendors             - List all vendors
GET    /api/vendors/:id         - Get vendor details
POST   /api/vendors             - Create vendor (Admin)
PUT    /api/vendors/:id         - Update vendor (Admin/Vendor)
DELETE /api/vendors/:id         - Delete vendor (Admin)
GET    /api/vendors/:id/products - Get vendor's products
POST   /api/vendors/:id/public-key - Update public key
```

#### Products
```
GET    /api/products            - List products
GET    /api/products/:id        - Get product details
POST   /api/products            - Create product (Admin/Vendor)
PUT    /api/products/:id        - Update product (Admin/Vendor)
DELETE /api/products/:id        - Delete product (Admin)
GET    /api/products/:id/serials - Get product serials
POST   /api/products/:id/serials - Register serial (Admin/Vendor)
```

#### Warranties
```
GET    /api/warranties          - List warranties
GET    /api/warranties/:id      - Get warranty details
POST   /api/warranties          - Create warranty (Admin/Vendor)
PUT    /api/warranties/:id      - Update warranty
GET    /api/warranties/expiring - Get expiring warranties
POST   /api/warranties/:id/claims - Submit warranty claim
```

#### Ownership (Neo4j-powered)
```
GET    /api/ownership/:serialId/history  - Get ownership history
GET    /api/ownership/:serialId/current  - Get current owner
POST   /api/ownership/transfer           - Transfer ownership
GET    /api/ownership/graph/:serialId    - Get ownership graph
```

#### Authenticity
```
POST   /api/authenticity/verify           - Verify product (Public)
GET    /api/authenticity/checks/:serialId - Get verification history
POST   /api/authenticity/sign             - Generate signature (Vendor)
GET    /api/authenticity/certificate/:id  - Get certificate (Public)
```

---

### Key Implementation: Database Connectivity

#### MongoDB Connection (Node.js/TypeScript)
```typescript
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectMongoDB = async (): Promise<void> => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};
```

#### Neo4j Connection (Node.js/TypeScript)
```typescript
import neo4j, { Driver, Session } from 'neo4j-driver';
import { env } from './env';
import { logger } from '../utils/logger';

let neo4jDriver: Driver | null = null;

export const connectNeo4j = async (): Promise<Driver> => {
    try {
        neo4jDriver = neo4j.driver(
            env.NEO4J_URI,
            neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD)
        );
        
        await neo4jDriver.verifyConnectivity();
        logger.info('Neo4j connected successfully');
        
        return neo4jDriver;
    } catch (error) {
        logger.error('Neo4j connection failed:', error);
        logger.warn('Running without Neo4j - graph features disabled');
        return null as any;
    }
};

export const getNeo4jSession = (): Session | null => {
    if (!neo4jDriver) {
        logger.warn('Neo4j driver not initialized');
        return null;
    }
    return neo4jDriver.session();
};
```

---

### Sample Queries

#### MongoDB Queries (using Mongoose)

**1. Find product by serial hash**
```typescript
const serial = await ProductSerial.findOne({ serial_hash: serialHash })
    .populate('product_id')
    .lean();
```

**2. Get expiring warranties**
```typescript
const expiringWarranties = await Warranty.find({
    warranty_end: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    status: 'active'
}).populate('serial_id');
```

**3. Get vendor's products**
```typescript
const products = await Product.find({ vendor_id: vendorId })
    .sort({ created_at: -1 });
```

**4. Get owner's products via serials**
```typescript
const ownedProducts = await ProductSerial.find({ owner_id: ownerId })
    .populate('product_id')
    .populate('warranty_id');
```

---

#### Neo4j Queries (using Cypher)

**1. Get complete ownership history for a serial**
```cypher
MATCH path = (s:Serial {serial_hash: $hash})-[:OWNED_BY*]->(o:Owner)
RETURN path
ORDER BY relationships(path)[0].acquired_at
```

**2. Get current owner of a product**
```cypher
MATCH (s:Serial {serial_hash: $hash})-[r:OWNED_BY]->(o:Owner)
WHERE r.relinquished_at IS NULL
RETURN o
```

**3. Get all products a vendor manufactures with serial counts**
```cypher
MATCH (v:Vendor)-[:MANUFACTURES]->(p:Product)
OPTIONAL MATCH (p)-[:HAS_SERIAL]->(s:Serial)
RETURN v.name, p.name, count(s) as serial_count
```

**4. Get authenticity check history**
```cypher
MATCH (s:Serial {serial_hash: $hash})-[v:VERIFIED]->(ac:AuthCheck)
RETURN ac
ORDER BY ac.checked_at DESC
LIMIT 10
```

**5. Detect potential fraud (same serial verified from different locations in 24hrs)**
```cypher
MATCH (s:Serial)-[:VERIFIED]->(ac1:AuthCheck),
      (s)-[:VERIFIED]->(ac2:AuthCheck)
WHERE ac1.check_id <> ac2.check_id
  AND duration.between(ac1.checked_at, ac2.checked_at).hours < 24
RETURN s, ac1, ac2
```

**6. Track ownership transfer chain**
```cypher
MATCH (o1:Owner)-[t:TRANSFERRED_TO*]->(o2:Owner)
WHERE $serial_id IN [rel in t | rel.serial_id]
RETURN o1, t, o2
ORDER BY t[0].date
```

---

### Cryptographic Implementation

#### Serial Hashing (SHA-256)
```typescript
import crypto from 'crypto';

export function hashSerial(serial: string): string {
    return crypto.createHash('sha256')
        .update(serial)
        .digest('hex');
}
```

#### Digital Signature Generation (RSA)
```typescript
export function signData(data: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'base64');
}
```

#### Signature Verification
```typescript
export function verifySignature(
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
```

#### Serial Encryption (AES-256-GCM)
```typescript
export function encryptSerial(serial: string, key: string): string {
    const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        Buffer.from(key, 'hex'),
        crypto.randomBytes(16)
    );
    let encrypted = cipher.update(serial, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
```

---

## SLIDE 5: UI Design

### Design System

#### Color Palette
```css
/* Primary - Deep Indigo */
--primary-500: #6366f1;
--primary-600: #4f46e5;
--primary-700: #4338ca;

/* Success - Emerald */
--success-500: #10b981;
--success-600: #059669;

/* Warning - Amber */
--warning-500: #f59e0b;
--warning-600: #d97706;

/* Error - Rose */
--error-500: #f43f5e;
--error-600: #e11d48;

/* Neutral - Slate */
--neutral-100: #f1f5f9;
--neutral-700: #334155;
--neutral-800: #1e293b;
--neutral-900: #0f172a;

/* Gradients */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-success: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
```

#### Typography
```css
--font-family-sans: 'Inter', -apple-system, sans-serif;
--font-size-xs: 0.75rem;     /* 12px */
--font-size-base: 1rem;      /* 16px */
--font-size-2xl: 1.5rem;     /* 24px */
--font-size-4xl: 2.25rem;    /* 36px */
```

#### Spacing & Borders
```css
--spacing-4: 1rem;           /* 16px */
--spacing-8: 2rem;           /* 32px */
--border-radius-lg: 0.75rem;
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

---

### Frontend Architecture

#### Project Structure
```
warrantyvault-react/
├── src/
│   ├── api/                  # API service layer
│   │   ├── axios.ts          # Axios configuration
│   │   ├── products.api.ts
│   │   ├── warranties.api.ts
│   │   └── auth.api.ts
│   │
│   ├── components/
│   │   ├── common/           # Reusable components
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   └── Input/
│   │   ├── layout/           # Layout components
│   │   │   ├── Sidebar/
│   │   │   └── Header/
│   │   └── domain/           # Business components
│   │       ├── ProductCard/
│   │       ├── WarrantyCard/
│   │       └── QRScanner/
│   │
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── Products/
│   │   ├── Warranties/
│   │   ├── Auth/
│   │   └── Landing/
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   └── useWarranties.ts
│   │
│   ├── store/                # State management
│   │   └── authStore.ts      # Zustand store
│   │
│   └── styles/               # Global styles
│       ├── globals.css
│       └── variables.css
```

---

### Key UI Components

#### 1. Landing Page
**Features:**
- Hero section with gradient background
- Feature highlights
- Call-to-action buttons
- Responsive navigation
- Premium glassmorphic design

**Key Sections:**
- Product authenticity verification portal
- Warranty management overview
- Benefits showcase
- CTA to register/login

---

#### 2. Dashboard
**Features:**
- Active warranties count with animated counter
- Coverage timeline chart (bar chart)
- Expiring warranties alert card
- Recent activity feed
- Total value protected display
- Quick action buttons (Add Product, File Claim, Export PDF, Support)

**Visual Elements:**
- Stat cards with trend indicators
- Interactive bar charts with tooltips
- Status badges (Active, Expired, Expiring)
- Product emoji/icons for visual appeal
- Glassmorphic cards with subtle shadows

---

#### 3. Products Page
**Features:**
- Product grid/list view toggle
- Search and filter functionality
- Product cards with images
- Add new product modal
- Product details view

**Product Card Components:**
- Product image/icon
- Product name and model
- Vendor information
- Warranty status badge
- Action buttons (View, Edit, Delete)

---

#### 4. Warranties Dashboard
**Features:**
- Warranty list with status filters
- Countdown timers for active warranties
- Warranty type badges (Standard, Extended, Premium)
- Claims history
- Expiry notifications

**Visual Elements:**
- Progress bars showing warranty duration
- Color-coded status indicators
- Timeline visualizations
- Document attachments

---

#### 5. Authenticity Verification Portal
**Features:**
- QR code scanner (camera access)
- Manual serial number entry
- Real-time verification animation
- Verification result display
- Certificate generation
- Fraud alert notifications

**Verification Flow:**
1. Scan QR code or enter serial
2. Loading animation during verification
3. Display result (Authentic ✓ or Counterfeit ✗)
4. Show product details if authentic
5. Display warranty status
6. Show current owner information
7. Generate verification certificate

---

#### 6. Ownership Timeline
**Features:**
- Visual timeline of ownership history
- Owner cards with transfer dates
- Proof of purchase links
- Transfer type indicators
- Interactive graph visualization

**Timeline Elements:**
- Vertical timeline with connecting lines
- Owner nodes with avatars/icons
- Date stamps for each transfer
- Transfer type badges (Sale, Gift, Warranty Claim)
- Document verification status

---

### Design Highlights

#### Modern UI/UX Features
1. **Glassmorphism**
   - Frosted glass effect on cards
   - Backdrop blur with semi-transparent backgrounds
   - Subtle border highlights

2. **Micro-animations**
   - Hover effects on buttons and cards
   - Slide-in animations for content
   - Number counting animations
   - Loading skeletons

3. **Responsive Design**
   - Mobile-first approach
   - Breakpoints: mobile (< 576px), tablet (768px), desktop (1200px)
   - Adaptive grid layouts
   - Touch-friendly interactions

4. **Dark Mode Support**
   - Dark theme for reduced eye strain
   - Proper contrast ratios for accessibility
   - Theme toggle in settings

5. **Interactive Elements**
   - Tooltips on hover
   - Dropdown menus with smooth transitions
   - Modal dialogs for forms
   - Toast notifications for feedback

---

## SLIDE 6: Connectivity

### System Architecture Overview

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser["Web Browser"]
        Mobile["Mobile App"]
    end
    
    subgraph Frontend["Frontend (React + Vite)"]
        UI["UI Components"]
        Router["React Router"]
        State["State Management<br/>(Zustand + React Query)"]
        API_Client["Axios HTTP Client"]
    end
    
    subgraph Backend["Backend (Node.js + Express)"]
        Routes["API Routes"]
        Controllers["Controllers"]
        Middleware["Middleware<br/>(Auth, RBAC, Validation)"]
        Services["Business Logic Services"]
    end
    
    subgraph Databases["Database Layer"]
        MongoDB["MongoDB<br/>(Document Store)"]
        Neo4j["Neo4j<br/>(Graph Database)"]
    end
    
    subgraph External["External Services"]
        Email["Email Service"]
        Storage["File Storage"]
    end
    
    Browser --> UI
    Mobile --> UI
    UI --> Router
    Router --> State
    State --> API_Client
    API_Client -->|HTTP/REST API| Routes
    Routes --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services --> MongoDB
    Services --> Neo4j
    Services --> Email
    Services --> Storage
```

---

### Frontend-Backend Connectivity

#### 1. Axios Configuration
```typescript
// src/api/axios.ts
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,  // http://localhost:5000/api
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

---

#### 2. API Service Layer
```typescript
// src/api/products.api.ts
import api from './axios';
import { Product, CreateProductDTO } from '../types/product.types';

export const productsApi = {
    getAll: (params?: { vendorId?: string; search?: string }) =>
        api.get<Product[]>('/products', { params }),
    
    getById: (id: string) =>
        api.get<Product>(`/products/${id}`),
    
    create: (data: CreateProductDTO) =>
        api.post<Product>('/products', data),
    
    update: (id: string, data: Partial<Product>) =>
        api.put<Product>(`/products/${id}`, data),
    
    delete: (id: string) =>
        api.delete(`/products/${id}`),
    
    verifyAuthenticity: (serialHash: string) =>
        api.post('/authenticity/verify', { serialHash }),
};
```

---

#### 3. React Query for Server State
```typescript
// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';

export const useProducts = (params?: ProductQueryParams) => {
    return useQuery({
        queryKey: ['products', params],
        queryFn: () => productsApi.getAll(params),
        staleTime: 5 * 60 * 1000,  // 5 minutes
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: productsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};
```

---

### Backend Database Connectivity

#### MongoDB Connection Flow
1. **Application Startup**
   - Initialize Mongoose connection
   - Configure connection pool (max 10 connections)
   - Set up event handlers (error, disconnected)

2. **Request Processing**
   - Mongoose uses connection pool
   - No need to manually open/close connections
   - Automatic connection management

3. **Model Operations**
   ```typescript
   // Models automatically use the connection
   const product = await Product.findById(id);
   const vendor = await Vendor.create(vendorData);
   ```

---

#### Neo4j Connection Flow
1. **Application Startup**
   - Initialize Neo4j driver with credentials
   - Verify connectivity
   - Store driver instance

2. **Request Processing**
   - Create session for each query
   - Execute Cypher queries
   - Close session after use

3. **Session Management**
   ```typescript
   const session = getNeo4jSession();
   try {
       const result = await session.run(cypherQuery, params);
       return result.records;
   } finally {
       await session.close();
   }
   ```

---

### Request-Response Flow

#### Example: Product Verification Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant MongoDB
    participant Neo4j
    
    User->>Frontend: Scan QR Code / Enter Serial
    Frontend->>Frontend: Hash Serial Number (SHA-256)
    Frontend->>Backend: POST /api/authenticity/verify<br/>{serialHash}
    
    Backend->>MongoDB: Find Serial by Hash
    MongoDB-->>Backend: Serial + Product + Vendor
    
    alt Serial Not Found
        Backend-->>Frontend: 404 Not Found
        Frontend-->>User: "Product Not Found - Counterfeit?"
    else Serial Found
        Backend->>Backend: Verify Signature with Vendor Public Key
        Backend->>MongoDB: Get Warranty Info
        MongoDB-->>Backend: Warranty Details
        
        Backend->>Neo4j: Get Current Owner
        Neo4j-->>Backend: Owner Info
        
        Backend->>Neo4j: Log Verification Check
        Neo4j-->>Backend: Check Logged
        
        Backend-->>Frontend: 200 OK + Verification Result
        Frontend-->>User: Display Product Details,<br/>Warranty Status, Owner Info
    end
```

---

#### Example: Ownership Transfer Flow

```mermaid
sequenceDiagram
    participant Owner1 as Current Owner
    participant Frontend
    participant Backend
    participant MongoDB
    participant Neo4j
    participant Owner2 as New Owner
    
    Owner1->>Frontend: Initiate Transfer
    Frontend->>Backend: POST /api/ownership/transfer<br/>{serialId, newOwnerEmail, proof}
    
    Backend->>MongoDB: Find Serial
    MongoDB-->>Backend: Serial Details
    
    Backend->>MongoDB: Find/Create New Owner
    MongoDB-->>Backend: New Owner Details
    
    Backend->>Neo4j: Update OWNED_BY relationship<br/>(set relinquished_at)
    Neo4j-->>Backend: Updated
    
    Backend->>Neo4j: Create new OWNED_BY relationship<br/>(to new owner)
    Neo4j-->>Backend: Created
    
    Backend->>Neo4j: Create TRANSFERRED_TO relationship<br/>(owner1 -> owner2)
    Neo4j-->>Backend: Created
    
    Backend->>MongoDB: Update Serial owner_id
    MongoDB-->>Backend: Updated
    
    Backend-->>Frontend: 200 OK + Transfer Details
    Frontend-->>Owner1: "Transfer Successful"
    Frontend->>Owner2: Email Notification
```

---

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant MongoDB
    
    User->>Frontend: Enter Email & Password
    Frontend->>Backend: POST /api/auth/login
    
    Backend->>MongoDB: Find User by Email
    MongoDB-->>Backend: User (with password hash)
    
    Backend->>Backend: Compare Password (bcrypt)
    
    alt Invalid Credentials
        Backend-->>Frontend: 401 Unauthorized
        Frontend-->>User: "Invalid Credentials"
    else Valid Credentials
        Backend->>Backend: Generate JWT Access Token<br/>Generate Refresh Token
        Backend->>MongoDB: Save Refresh Token
        MongoDB-->>Backend: Saved
        
        Backend-->>Frontend: 200 OK + Tokens + User Info
        Frontend->>Frontend: Store Token in LocalStorage
        Frontend->>Frontend: Update Auth State (Zustand)
        Frontend-->>User: Redirect to Dashboard
    end
```

---

### Environment Variables

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Digital Warranty Vault
```

#### Backend (.env)
```bash
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/warranty_vault
# OR for cloud:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/warranty_vault

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Encryption
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

### Network Architecture

#### Development Environment
```
┌─────────────────────────────────────────┐
│  Frontend (Vite Dev Server)            │
│  Port: 5173                             │
│  URL: http://localhost:5173             │
└───────────────┬─────────────────────────┘
                │
                │ HTTP Requests
                │ (CORS enabled)
                ▼
┌─────────────────────────────────────────┐
│  Backend (Express Server)               │
│  Port: 5000                             │
│  URL: http://localhost:5000             │
└───────┬───────────────────┬─────────────┘
        │                   │
        │                   │
        ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│   MongoDB        │  │   Neo4j          │
│   Port: 27017    │  │   Port: 7687     │
└──────────────────┘  └──────────────────┘
```

#### Production Environment
```
┌─────────────────────────────────────────┐
│  Users                                  │
└───────────────┬─────────────────────────┘
                │ HTTPS
                ▼
┌─────────────────────────────────────────┐
│  CDN / Nginx (Static Frontend)         │
│  Port: 443                              │
└───────────────┬─────────────────────────┘
                │ Reverse Proxy
                ▼
┌─────────────────────────────────────────┐
│  Backend API (PM2 + Node.js)           │
│  Port: 5000 (internal)                  │
└───────┬───────────────────┬─────────────┘
        │                   │
        ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│   MongoDB Atlas  │  │   Neo4j AuraDB   │
│   (Cloud)        │  │   (Cloud)        │
└──────────────────┘  └──────────────────┘
```

---

### CORS Configuration
```typescript
// backend/src/app.ts
import cors from 'cors';

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

### WebSocket Support (Future Enhancement)
For real-time features like:
- Live warranty expiry notifications
- Real-time ownership transfer updates
- Fraud alert broadcasts

```typescript
// Socket.IO implementation
import { Server } from 'socket.io';

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('subscribe-warranty', (warrantyId) => {
        socket.join(`warranty-${warrantyId}`);
    });
});

// Emit events
io.to(`warranty-${warrantyId}`).emit('warranty-expiring', data);
```

---

### Error Handling & Logging

#### Backend Error Middleware
```typescript
app.use((err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
    });
});
```

#### Frontend Error Handling
```typescript
// Axios interceptor already handles 401
// Additional error handling in React Query
onError: (error) => {
    toast.error(error.message || 'Something went wrong');
}
```

---

### Performance Optimizations

1. **Frontend**
   - Code splitting with lazy loading
   - Image optimization (WebP format)
   - React.memo for expensive components
   - Debouncing for search inputs
   - Virtual scrolling for large lists

2. **Backend**
   - Database indexing on frequently queried fields
   - Query result caching (Redis - future)
   - Connection pooling for databases
   - Compression middleware (gzip)
   - Rate limiting to prevent abuse

3. **Database**
   - MongoDB: Compound indexes, lean queries
   - Neo4j: Parameterized queries, proper indexing
   - Database query profiling and optimization

---

## Summary

### Project Highlights

✅ **Polyglot Persistence Architecture**
- MongoDB for documents (vendors, products, warranties, owners)
- Neo4j for relationships (ownership history, transfers, authenticity checks)

✅ **Robust Security**
- SHA-256 hashing for serial numbers
- RSA digital signatures for authenticity
- AES-256-GCM encryption for sensitive data
- JWT-based authentication
- bcrypt password hashing

✅ **Modern Tech Stack**
- Backend: Node.js, Express, TypeScript, Mongoose, Neo4j driver
- Frontend: React 18, Vite, TypeScript, Zustand, React Query
- Clean architecture with separation of concerns

✅ **Rich Features**
- Product authenticity verification
- Warranty management with expiry tracking
- Complete ownership history visualization
- QR code scanning
- Real-time notifications
- Beautiful, responsive UI with glassmorphism

✅ **Scalable Design**
- RESTful API architecture
- Database optimization with proper indexing
- Connection pooling
- Code splitting and lazy loading
- Production-ready deployment strategy

---

**This system provides a comprehensive solution for managing digital warranties and ensuring product authenticity using modern web technologies and a sophisticated dual-database architecture.**

---

## SLIDE 7: CONCLUSION

### Project Achievements

🎯 **Successfully Implemented a Polyglot Persistence System**
- Leveraged the strengths of both MongoDB and Neo4j
- Optimized data storage based on access patterns
- Achieved seamless synchronization between databases

🔒 **Enterprise-Grade Security**
- Implemented cryptographic hashing (SHA-256) for serial numbers
- Digital signature verification using RSA
- End-to-end encryption for sensitive data
- Secure authentication with JWT and bcrypt

💡 **Innovative Features**
- QR code-based product verification
- Real-time warranty tracking with expiration alerts
- Complete ownership history visualization using graph traversals
- Fraud detection through authenticity check patterns

🎨 **Modern User Experience**
- Responsive, mobile-first design
- Premium glassmorphic UI with micro-animations
- Intuitive navigation and user workflows
- Accessible and user-friendly interfaces

---

### Technical Highlights

#### Architecture Excellence
- **Backend**: Robust Node.js/Express/TypeScript API
- **Frontend**: Modern React 18 with Vite and TypeScript
- **Databases**: MongoDB for documents + Neo4j for relationships
- **Security**: Multi-layered security with encryption and signatures

#### Code Quality
- Type-safe implementation with TypeScript
- Clean architecture with separation of concerns
- Comprehensive API with RESTful endpoints
- Efficient query optimization and indexing

#### Scalability & Performance
- Connection pooling for database efficiency
- Indexed queries for fast lookups
- Code splitting and lazy loading
- Production-ready deployment architecture

---

### Business Value

#### For Vendors
✓ Protect brand reputation with authenticity verification  
✓ Reduce counterfeit products in the market  
✓ Track product distribution and ownership chains  
✓ Streamline warranty management processes

#### For Customers
✓ Verify product authenticity before purchase  
✓ Manage all warranties in one digital vault  
✓ Receive timely warranty expiration notifications  
✓ Transfer ownership with complete history tracking

#### For the Industry
✓ Set new standards for product authentication  
✓ Demonstrate effective use of polyglot persistence  
✓ Provide a blueprint for warranty management systems  
✓ Combat fraud with cryptographic verification

---

### Challenges Overcome

1. **Database Synchronization**
   - Challenge: Maintaining consistency across MongoDB and Neo4j
   - Solution: Write-first to MongoDB, background sync to Neo4j

2. **Complex Relationship Queries**
   - Challenge: Tracking multi-hop ownership transfers
   - Solution: Leveraged Neo4j's graph traversal capabilities

3. **Security Implementation**
   - Challenge: Ensuring tamper-proof serial verification
   - Solution: Cryptographic hashing + digital signatures

4. **Performance Optimization**
   - Challenge: Fast serial lookup from millions of records
   - Solution: Unique indexed hashing with O(1) lookup

---

### Future Enhancements

#### Short-term (Next 3-6 months)
📱 **Mobile Applications**
- Native iOS and Android apps
- Enhanced QR scanning with camera integration
- Push notifications for warranty alerts

🔔 **Real-time Features**
- WebSocket integration for live updates
- Real-time ownership transfer notifications
- Live warranty expiration countdowns

#### Long-term (6-12 months)
🤖 **AI/ML Integration**
- Fraud pattern detection using machine learning
- Predictive analytics for warranty claims
- Automated warranty claim processing

🌐 **Blockchain Integration**
- Immutable ownership records on blockchain
- Smart contracts for automatic warranty transfers
- Decentralized verification system

📊 **Advanced Analytics**
- Vendor performance dashboards
- Product lifecycle insights
- Market trend analysis

🔗 **Third-party Integrations**
- Integration with e-commerce platforms
- Payment gateway for premium warranties
- Insurance provider partnerships

---

### Key Takeaways

1. **Polyglot Persistence Works**  
   Using the right database for the right data type significantly improves performance and scalability.

2. **Security is Paramount**  
   Multi-layered security with cryptography ensures trust in the authentication system.

3. **User Experience Matters**  
   A beautiful, intuitive interface encourages adoption and engagement.

4. **Scalability by Design**  
   Proper architecture from day one enables future growth and feature additions.

5. **Technology Choices Count**  
   Modern stack (React, Node.js, TypeScript) provides developer productivity and maintainability.

---

### Thank You! 🙏

**Digital Warranty Vault & Product Authenticity Verification System**

A complete solution combining cutting-edge technology, robust security, and exceptional user experience to revolutionize warranty management and combat counterfeit products.

---

#### Contact & Resources
- 📧 Email: [Your Contact Email]
- 🌐 GitHub: [Repository Link]
- 📱 Live Demo: [Demo URL]
- 📄 Documentation: [Docs URL]

---

**Questions & Discussion**

*Feel free to ask any questions about the architecture, implementation, or features!*
