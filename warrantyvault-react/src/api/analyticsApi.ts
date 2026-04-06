import api from './axios';

// ── Response types ──────────────────────────────────────────────────────────────

export interface CategorySummaryItem {
    category: string;
    productCount: number;
    totalSpend: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    formattedTotal: string;
    percentage: number;
}

export interface WarrantyStatusItem {
    status: string;
    count: number;
    totalClaims: number;
    label: string;
    color: string;
    warrantyCount: number;
    percentage: number;
}

export interface MonthlySpendingItem {
    year: number;
    month: number;
    label: string;
    totalSpend: number;
    productCount: number;
    avgPrice: number;
    categoryCount: number;
}

export interface BrandAnalyticsItem {
    brand: string;
    productCount: number;
    totalValue: number;
    avgPrice: number;
    categoryCount: number;
    categories: string[];
    latestPurchase: string;
    formattedValue: string;
    rank: number;
    percentage: number;
}

export interface PriceDistributionItem {
    range: string;
    count: number;
    totalValue: number;
    avgPrice: number;
    label: string;
    sortOrder: number;
    sampleProducts: string[];
    percentage: number;
}

interface AnalyticsResponse<T> {
    success: boolean;
    pipeline: string;
    data: T[];
    summary: Record<string, number>;
}

// ── API methods ─────────────────────────────────────────────────────────────────

export const analyticsApi = {
    getCategorySummary: async (): Promise<AnalyticsResponse<CategorySummaryItem>> => {
        const res = await api.get<AnalyticsResponse<CategorySummaryItem>>('/analytics/category-summary');
        return res.data;
    },

    getWarrantyStatus: async (warrantyType?: string): Promise<AnalyticsResponse<WarrantyStatusItem>> => {
        const params = warrantyType ? { warrantyType } : {};
        const res = await api.get<AnalyticsResponse<WarrantyStatusItem>>('/analytics/warranty-status', { params });
        return res.data;
    },

    getMonthlySpending: async (months?: number): Promise<AnalyticsResponse<MonthlySpendingItem>> => {
        const params = months ? { months } : {};
        const res = await api.get<AnalyticsResponse<MonthlySpendingItem>>('/analytics/monthly-spending', { params });
        return res.data;
    },

    getBrandAnalytics: async (): Promise<AnalyticsResponse<BrandAnalyticsItem>> => {
        const res = await api.get<AnalyticsResponse<BrandAnalyticsItem>>('/analytics/brand-analytics');
        return res.data;
    },

    getPriceDistribution: async (): Promise<AnalyticsResponse<PriceDistributionItem>> => {
        const res = await api.get<AnalyticsResponse<PriceDistributionItem>>('/analytics/price-distribution');
        return res.data;
    },
};
