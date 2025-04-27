import React, { createContext, useContext, useState, useEffect } from 'react';
import { productService, Product, CreateProductData, UpdateProductData } from '@/services/product';
import { useAuth } from './AuthContext';

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  getAllProducts: () => Promise<void>;
  createProduct: (data: CreateProductData) => Promise<void>;
  updateProduct: (id: string, data: UpdateProductData) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllProducts = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createProduct = async (data: CreateProductData) => {
    try {
      setIsLoading(true);
      setError(null);
      const newProduct = await productService.createProduct(data);
      setProducts(prev => [...prev, newProduct]);
    } catch (err) {
      setError('Failed to create product');
      console.error('Error creating product:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (id: string, data: UpdateProductData) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedProduct = await productService.updateProduct(id, data);
      setProducts(prev => prev.map(p => p._id === id ? updatedProduct : p));
    } catch (err) {
      setError('Failed to update product');
      console.error('Error updating product:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      setError('Failed to delete product');
      console.error('Error deleting product:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await productService.searchProducts(query);
      setProducts(results);
    } catch (err) {
      setError('Failed to search products');
      console.error('Error searching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      getAllProducts();
    }
  }, [isAuthenticated, authLoading]);

  const value = {
    products,
    isLoading,
    error,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
} 