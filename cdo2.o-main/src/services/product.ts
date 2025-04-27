import api from './api';

export interface Product {
  _id: string;
  productId: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface CreateProductData {
  productId: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface UpdateProductData {
  productId?: string;
  name?: string;
  price?: number;
  stock?: number;
  category?: string;
}

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await api.get<Product[]>('/products');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('No token, authorization denied');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch products');
    }
  },

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await api.get<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search products');
    }
  },

  async createProduct(data: CreateProductData): Promise<Product> {
    try {
      const response = await api.post<Product>('/products', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create product');
    }
  },

  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    try {
      const response = await api.put<Product>(`/products/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update product');
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await api.delete(`/products/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete product');
    }
  }
}; 