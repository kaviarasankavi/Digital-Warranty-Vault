import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WarrantyStatus = 'active' | 'expiring' | 'expired' | 'claimed';
export type WarrantyType = 'standard' | 'extended' | 'premium';
export type OwnerStatus = 'verified' | 'pending' | 'suspended';
export type ProductCategory = 'electronics' | 'appliances' | 'automotive' | 'jewelry' | 'photography' | 'other';

export interface Vendor {
    id: string;
    name: string;
    country: string;
    contactEmail: string;
    productsCount: number;
    activeWarranties: number;
    status: 'active' | 'inactive';
    joinedDate: string;
}

export interface Product {
    id: string;
    name: string;
    vendorId: string;
    vendorName: string;
    category: ProductCategory;
    serialNumber: string;
    purchaseDate: string;
    price: number;
    imageUrl?: string;
    description: string;
    warrantyId?: string;
}

export interface Warranty {
    id: string;
    productId: string;
    productName: string;
    vendorName: string;
    serialId: string;
    type: WarrantyType;
    startDate: string;
    endDate: string;
    status: WarrantyStatus;
    daysLeft?: number;
    coverageDetails: string;
    ownerId?: string;
    ownerName?: string;
}

export interface Owner {
    id: string;
    name: string;
    description: string;
    email: string;
    assetsCount: number;
    status: OwnerStatus;
    lastActivity: string;
    initials: string;
    colorClass: string;
    phone?: string;
    address?: string;
}

export interface VerificationCheck {
    id: string;
    serialHash: string;
    productName: string;
    vendor: string;
    result: boolean;
    checkedAt: string;
    ownerName: string;
    ipAddress: string;
}

export interface SystemConfig {
    biometricAuth: boolean;
    autoArchive: boolean;
    watermarking: boolean;
    emailAlerts: boolean;
    twoFactor: boolean;
    auditLogging: boolean;
    maintenanceMode: boolean;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const seedVendors: Vendor[] = [
    { id: 'VND-001', name: 'Sony Electronics', country: 'Japan', contactEmail: 'enterprise@sony.com', productsCount: 142, activeWarranties: 98, status: 'active', joinedDate: '12 JAN 2022' },
    { id: 'VND-002', name: 'Apple Inc.', country: 'USA', contactEmail: 'b2b@apple.com', productsCount: 87, activeWarranties: 63, status: 'active', joinedDate: '01 MAR 2021' },
    { id: 'VND-003', name: 'Leica Camera AG', country: 'Germany', contactEmail: 'warranty@leica.de', productsCount: 34, activeWarranties: 21, status: 'active', joinedDate: '08 JUN 2023' },
    { id: 'VND-004', name: 'Bose Corporation', country: 'USA', contactEmail: 'support@bose.com', productsCount: 56, activeWarranties: 41, status: 'active', joinedDate: '15 APR 2022' },
    { id: 'VND-005', name: 'DJI Technology', country: 'China', contactEmail: 'enterprise@dji.com', productsCount: 29, activeWarranties: 18, status: 'inactive', joinedDate: '22 SEP 2022' },
    { id: 'VND-006', name: 'Samsung Electronics', country: 'South Korea', contactEmail: 'b2b@samsung.com', productsCount: 201, activeWarranties: 158, status: 'active', joinedDate: '03 FEB 2021' },
];

const seedProducts: Product[] = [
    { id: 'PRD-001', name: 'Sony Bravia XR A95L 65"', vendorId: 'VND-001', vendorName: 'Sony Electronics', category: 'electronics', serialNumber: 'SN-XR-9921A', purchaseDate: '12 JAN 2024', price: 2799, description: 'QD-OLED 4K HDR Smart TV with cognitive processor XR', warrantyId: 'WRT-0001' },
    { id: 'PRD-002', name: 'MacBook Pro M3 Max', vendorId: 'VND-002', vendorName: 'Apple Inc.', category: 'electronics', serialNumber: 'SN-MBP-0482C', purchaseDate: '05 MAR 2023', price: 3999, description: '16-inch MacBook Pro with M3 Max chip, 48GB RAM', warrantyId: 'WRT-0002' },
    { id: 'PRD-003', name: 'Leica Q3 Camera', vendorId: 'VND-003', vendorName: 'Leica Camera AG', category: 'photography', serialNumber: 'SN-Q3-1105T', purchaseDate: '18 AUG 2022', price: 5995, description: 'Full-frame compact camera with 60MP sensor and 28mm Summilux lens', warrantyId: 'WRT-0003' },
    { id: 'PRD-004', name: 'Bose Noise Cancelling 700', vendorId: 'VND-004', vendorName: 'Bose Corporation', category: 'electronics', serialNumber: 'SN-NCH-7743B', purchaseDate: '01 JUN 2023', price: 379, description: 'Wireless over-ear headphones with 11 levels of noise cancellation', warrantyId: 'WRT-0004' },
    { id: 'PRD-005', name: 'DJI Inspire 3', vendorId: 'VND-005', vendorName: 'DJI Technology', category: 'electronics', serialNumber: 'SN-INS-3391K', purchaseDate: '20 OCT 2023', price: 16000, description: 'Professional cinema drone with full-frame sensor and O3 Pro transmission', warrantyId: 'WRT-0005' },
    { id: 'PRD-006', name: 'Samsung Galaxy S24 Ultra', vendorId: 'VND-006', vendorName: 'Samsung Electronics', category: 'electronics', serialNumber: 'SN-S24-8814V', purchaseDate: '28 JAN 2024', price: 1299, description: '6.8-inch Dynamic AMOLED with titanium frame and S Pen included' },
];

const seedWarranties: Warranty[] = [
    { id: 'WRT-0001', productId: 'PRD-001', productName: 'Sony Bravia XR A95L', vendorName: 'Sony Electronics', serialId: 'SN-XR-9921A', type: 'premium', startDate: '12 JAN 2024', endDate: '12 JAN 2027', status: 'active', daysLeft: 1026, coverageDetails: 'Parts, Labor & Accidental Damage', ownerId: 'OWN-001', ownerName: 'Julian S. Arclight' },
    { id: 'WRT-0002', productId: 'PRD-002', productName: 'MacBook Pro M3 Max', vendorName: 'Apple Inc.', serialId: 'SN-MBP-0482C', type: 'extended', startDate: '05 MAR 2023', endDate: '05 MAR 2024', status: 'expiring', daysLeft: 28, coverageDetails: 'Parts & Labor (AppleCare+)', ownerId: 'OWN-002', ownerName: 'Elena Vance-Sterling' },
    { id: 'WRT-0003', productId: 'PRD-003', productName: 'Leica Q3 Camera', vendorName: 'Leica Camera AG', serialId: 'SN-Q3-1105T', type: 'standard', startDate: '18 AUG 2022', endDate: '18 AUG 2023', status: 'expired', coverageDetails: 'Parts Only', ownerId: 'OWN-004', ownerName: 'Reina Kasashi' },
    { id: 'WRT-0004', productId: 'PRD-004', productName: 'Bose Noise Cancelling 700', vendorName: 'Bose Corporation', serialId: 'SN-NCH-7743B', type: 'standard', startDate: '01 JUN 2023', endDate: '01 JUN 2024', status: 'claimed', coverageDetails: 'Parts & Labor', ownerId: 'OWN-005', ownerName: 'William Brandt' },
    { id: 'WRT-0005', productId: 'PRD-005', productName: 'DJI Inspire 3', vendorName: 'DJI Technology', serialId: 'SN-INS-3391K', type: 'premium', startDate: '20 OCT 2023', endDate: '20 OCT 2026', status: 'active', daysLeft: 940, coverageDetails: 'Parts, Labor & Fly-Away Protection', ownerId: 'OWN-004', ownerName: 'Reina Kasashi' },
];

const seedOwners: Owner[] = [
    { id: 'OWN-001', name: 'Julian S. Arclight', description: 'Head of Acquisitions at The Marble Collective. Holding 14 vaulted assets with prime security clearance.', email: 'julian@marble-collective.io', assetsCount: 14, status: 'verified', lastActivity: '12 OCT 2023', initials: 'JA', colorClass: 'owner-color-indigo', phone: '+1 (415) 882-0044', address: 'San Francisco, CA, USA' },
    { id: 'OWN-002', name: 'Elena Vance-Sterling', description: 'Private curator focusing on mid-century cryptographic artifacts. Current holder of the "Genesis Key".', email: 'elena@sterling-archive.co', assetsCount: 8, status: 'verified', lastActivity: '28 SEP 2023', initials: 'EV', colorClass: 'owner-color-coral', phone: '+44 7700 900123', address: 'London, UK' },
    { id: 'OWN-003', name: 'Marcus Thorne', description: 'Application submitted for Heritage Grade security clearance. Identity verification in progress.', email: 'mthorne@prospective.net', assetsCount: 0, status: 'pending', lastActivity: '04 NOV 2023', initials: 'MT', colorClass: 'owner-color-slate' },
    { id: 'OWN-004', name: 'Reina Kasashi', description: 'Senior registrar for the East Asian Antiquities Board. Managing digital provenance for 22 heritage items.', email: 'reina.k@eaab.gov', assetsCount: 22, status: 'verified', lastActivity: '01 NOV 2023', initials: 'RK', colorClass: 'owner-color-sage', phone: '+81 3-1234-5678', address: 'Tokyo, Japan' },
    { id: 'OWN-005', name: 'William Brandt', description: 'Account suspended pending review of transfer dispute for lot #VAULT-0078.', email: 'w.brandt@private.org', assetsCount: 5, status: 'suspended', lastActivity: '09 OCT 2023', initials: 'WB', colorClass: 'owner-color-red' },
];

const seedChecks: VerificationCheck[] = [];

const defaultSystemConfig: SystemConfig = {
    biometricAuth: true,
    autoArchive: false,
    watermarking: true,
    emailAlerts: true,
    twoFactor: false,
    auditLogging: true,
    maintenanceMode: false,
};

// ─── Store Definition ─────────────────────────────────────────────────────────

interface DataState {
    vendors: Vendor[];
    products: Product[];
    warranties: Warranty[];
    owners: Owner[];
    verificationChecks: VerificationCheck[];
    systemConfig: SystemConfig;

    // Vendor actions
    addVendor: (v: Vendor) => void;
    updateVendor: (id: string, updates: Partial<Vendor>) => void;
    deleteVendor: (id: string) => void;

    // Product actions
    addProduct: (p: Product) => void;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    deleteProduct: (id: string) => void;

    // Warranty actions
    addWarranty: (w: Warranty) => void;
    updateWarranty: (id: string, updates: Partial<Warranty>) => void;
    deleteWarranty: (id: string) => void;

    // Owner actions
    addOwner: (o: Owner) => void;
    updateOwner: (id: string, updates: Partial<Owner>) => void;
    deleteOwner: (id: string) => void;
    setOwnerStatus: (id: string, status: OwnerStatus) => void;

    // Verification actions
    addVerificationCheck: (check: VerificationCheck) => void;

    // System config
    updateSystemConfig: (updates: Partial<SystemConfig>) => void;
}

export const useDataStore = create<DataState>()(
    persist(
        (set) => ({
            vendors: seedVendors,
            products: seedProducts,
            warranties: seedWarranties,
            owners: seedOwners,
            verificationChecks: seedChecks,
            systemConfig: defaultSystemConfig,

            addVendor: (v) => set((s) => ({ vendors: [...s.vendors, v] })),
            updateVendor: (id, updates) => set((s) => ({ vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...updates } : v)) })),
            deleteVendor: (id) => set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) })),

            addProduct: (p) => set((s) => ({ products: [...s.products, p] })),
            updateProduct: (id, updates) => set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
            deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

            addWarranty: (w) => set((s) => ({ warranties: [...s.warranties, w] })),
            updateWarranty: (id, updates) => set((s) => ({ warranties: s.warranties.map((w) => (w.id === id ? { ...w, ...updates } : w)) })),
            deleteWarranty: (id) => set((s) => ({ warranties: s.warranties.filter((w) => w.id !== id) })),

            addOwner: (o) => set((s) => ({ owners: [...s.owners, o] })),
            updateOwner: (id, updates) => set((s) => ({ owners: s.owners.map((o) => (o.id === id ? { ...o, ...updates } : o)) })),
            deleteOwner: (id) => set((s) => ({ owners: s.owners.filter((o) => o.id !== id) })),
            setOwnerStatus: (id, status) => set((s) => ({ owners: s.owners.map((o) => (o.id === id ? { ...o, status } : o)) })),

            addVerificationCheck: (check) => set((s) => ({ verificationChecks: [check, ...s.verificationChecks] })),

            updateSystemConfig: (updates) => set((s) => ({ systemConfig: { ...s.systemConfig, ...updates } })),
        }),
        { name: 'warrantyvault-data' }
    )
);
