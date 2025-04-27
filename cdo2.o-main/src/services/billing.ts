import api from './api';

export interface BillingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Billing {
  _id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  items: BillingItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'check' | 'cash';
  paymentDate?: string;
}

export interface CreateBillingData {
  items: Omit<BillingItem, 'amount'>[];
  dueDate: string;
  tax: number;
  notes?: string;
}

export interface UpdateBillingData {
  items?: Omit<BillingItem, 'amount'>[];
  dueDate?: string;
  tax?: number;
  notes?: string;
  status?: Billing['status'];
  paymentMethod?: Billing['paymentMethod'];
  paymentDate?: string;
}

export const billingService = {
  async getAllBills(): Promise<Billing[]> {
    const response = await api.get<Billing[]>('/billing');
    return response.data;
  },

  async getBill(id: string): Promise<Billing> {
    const response = await api.get<Billing>(`/billing/${id}`);
    return response.data;
  },

  async createBill(data: CreateBillingData): Promise<Billing> {
    const response = await api.post<Billing>('/billing', data);
    return response.data;
  },

  async updateBill(id: string, data: UpdateBillingData): Promise<Billing> {
    const response = await api.put<Billing>(`/billing/${id}`, data);
    return response.data;
  },

  async deleteBill(id: string): Promise<void> {
    await api.delete(`/billing/${id}`);
  }
}; 