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

interface ProductListResponse {
    success: boolean;
    data: Product[];
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

export const productApi = {
    getAll: async (): Promise<ProductListResponse> => {
        const res = await api.get<ProductListResponse>('/products');
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
