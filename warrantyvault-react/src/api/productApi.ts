import api from './axios';

export interface Product {
    id: number;
    userId: string;
    name: string;
    brand: string;
    model: string;
    serialNumber: string;
    category: string;
    purchaseDate: string;
    purchasePrice: number;
    warrantyExpiry: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProductFormData {
    name: string;
    brand: string;
    model: string;
    serialNumber: string;
    category: string;
    purchaseDate: string;
    purchasePrice: number;
    warrantyExpiry: string;
    notes: string;
}

export interface ProductQueryParams {
    search?: string;
    category?: string;
    warrantyStatus?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface Pagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

interface ProductListResponse {
    success: boolean;
    data: Product[];
    pagination: Pagination;
}

interface ProductResponse {
    success: boolean;
    message?: string;
    data: Product;
}

interface DeleteResponse {
    success: boolean;
    message: string;
}

interface CategoriesResponse {
    success: boolean;
    data: string[];
}

export const productApi = {
    getAll: async (params?: ProductQueryParams): Promise<ProductListResponse> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    queryParams.set(key, String(value));
                }
            });
        }
        const queryString = queryParams.toString();
        const url = queryString ? `/products?${queryString}` : '/products';
        const res = await api.get<ProductListResponse>(url);
        return res.data;
    },

    getCategories: async (): Promise<CategoriesResponse> => {
        const res = await api.get<CategoriesResponse>('/products/categories');
        return res.data;
    },

    getOne: async (id: number): Promise<ProductResponse> => {
        const res = await api.get<ProductResponse>(`/products/${id}`);
        return res.data;
    },

    create: async (data: ProductFormData): Promise<ProductResponse> => {
        const res = await api.post<ProductResponse>('/products', data);
        return res.data;
    },

    update: async (id: number, data: ProductFormData): Promise<ProductResponse> => {
        const res = await api.put<ProductResponse>(`/products/${id}`, data);
        return res.data;
    },

    delete: async (id: number): Promise<DeleteResponse> => {
        const res = await api.delete<DeleteResponse>(`/products/${id}`);
        return res.data;
    },
};
