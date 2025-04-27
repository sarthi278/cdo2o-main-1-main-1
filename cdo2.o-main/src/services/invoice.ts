import api from './api';
import { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export interface Invoice {
  [x: string]: any;
  _id: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  time: string;
  dueDate?: string;
  items: Array<{
    productId: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
  status: 'pending' | 'paid' | 'cancelled';
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  paymentDate?: string;
  paymentTime?: string;
}

export interface CreateInvoiceData {
  amount: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  status?: 'pending' | 'paid' | 'cancelled';
  dueDate?: string;
  time?: string;
}

class InvoiceService {
  async getAllInvoices(): Promise<Invoice[]> {
    try {
      const response = await api.get<Invoice[]>('/billing/invoices');
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      console.error('Error fetching invoices:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch invoices');
    }
  }

  async getRecentInvoices(limit: number = 5): Promise<Invoice[]> {
    try {
      const response = await api.get<Invoice[]>(`/billing/invoices/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      console.error('Error fetching recent invoices:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch recent invoices');
    }
  }

  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    try {
      // Validate required fields
      if (!data.amount || !data.items || data.items.length === 0) {
        throw new Error('Missing required fields: amount and items are required');
      }

      // Validate items
      data.items.forEach(item => {
        if (!item.productId || !item.quantity || !item.price) {
          throw new Error('Each item must have productId, quantity, and price');
        }
      });

      const response = await api.post<Invoice>('/billing/invoices', {
        ...data,
        status: data.status || 'pending',
        time: data.time || new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        })
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      console.error('Error creating invoice:', err);
      throw new Error(err.response?.data?.message || 'Failed to create invoice');
    }
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const response = await api.get<Invoice>(`/billing/invoices/${id}`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      console.error('Error fetching invoice:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch invoice');
    }
  }

  async updateInvoiceStatus(id: string, status: 'pending' | 'paid' | 'cancelled'): Promise<Invoice> {
    try {
      const response = await api.patch<Invoice>(`/billing/invoices/${id}/status`, { status });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      console.error('Error updating invoice status:', err);
      throw new Error(err.response?.data?.message || 'Failed to update invoice status');
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await api.delete(`/billing/invoices/${id}`);
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      console.error('Error deleting invoice:', err);
      throw new Error(err.response?.data?.message || 'Failed to delete invoice');
    }
  }
}

export const invoiceService = new InvoiceService(); 