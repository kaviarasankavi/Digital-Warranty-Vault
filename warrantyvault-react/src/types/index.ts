// User types
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'vendor' | 'user';
    avatar?: string;
    createdAt: string;
}

// Vendor types
export interface Vendor {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    publicKey: string;
    logo?: string;
    productsCount: number;
    createdAt: string;
    updatedAt: string;
}

// Product types
export interface Product {
    id: string;
    name: string;
    description?: string;
    category: string;
    vendorId: string;
    vendor?: Vendor;
    baseModel: string;
    imageUrl?: string;
    serialCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProductSerial {
    id: string;
    productId: string;
    serialNumber: string;
    serialHash: string;
    product?: Product;
    warranty?: Warranty;
    currentOwner?: Owner;
    isAuthentic: boolean;
    createdAt: string;
}

// Warranty types
export type WarrantyStatus = 'active' | 'expired' | 'expiring_soon' | 'claimed';
export type WarrantyType = 'standard' | 'extended' | 'premium' | 'lifetime';

export interface Warranty {
    id: string;
    serialId: string;
    serial?: ProductSerial;
    type: WarrantyType;
    status: WarrantyStatus;
    startDate: string;
    endDate: string;
    terms?: string;
    claimCount: number;
    createdAt: string;
    updatedAt: string;
}

// Owner types
export interface Owner {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    productsOwned: number;
    createdAt: string;
}

export interface OwnershipTransfer {
    id: string;
    serialId: string;
    fromOwnerId: string;
    toOwnerId: string;
    fromOwner?: Owner;
    toOwner?: Owner;
    transferDate: string;
    proofDocument?: string;
    notes?: string;
}

// Authenticity types
export interface AuthenticityCheck {
    id: string;
    serialHash: string;
    serialId?: string;
    serial?: ProductSerial;
    isAuthentic: boolean;
    checkDate: string;
    ipAddress?: string;
    location?: string;
}

// Dashboard types
export interface DashboardStats {
    totalProducts: number;
    activeWarranties: number;
    expiringSoon: number;
    authenticityChecks: number;
    totalVendors: number;
    totalOwners: number;
}

export interface WarrantyBreakdown {
    active: number;
    expired: number;
    expiringSoon: number;
    claimed: number;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, string>;
}
