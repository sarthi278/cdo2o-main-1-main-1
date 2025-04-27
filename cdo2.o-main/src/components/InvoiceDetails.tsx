import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { IndianRupee, Printer, X, CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { invoiceService } from '@/services/invoice';
import type { Invoice } from '@/services/invoice';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InvoiceDetailsProps {
  invoice: Invoice;
  onClose: () => void;
  onStatusUpdate?: (invoice: Invoice) => void;
}

export default function InvoiceDetails({ invoice, onClose, onStatusUpdate }: InvoiceDetailsProps) {
  const { toast } = useToast();
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  const handleStatusUpdate = async (newStatus: Invoice['status']) => {
    try {
      const updatedInvoice = await invoiceService.updateInvoiceStatus(invoice._id, newStatus);
      toast({
        title: "Success",
        description: `Invoice status updated to ${newStatus.toUpperCase()}`,
      });
      if (onStatusUpdate) {
        onStatusUpdate(updatedInvoice);
      }
    } catch (error: unknown) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update invoice status",
        variant: "destructive",
      });
    }
  };

  const printInvoice = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice._id}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              .invoice-container {
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                padding: 10px;
                border: 1px solid #ddd;
                text-align: left;
              }
              th {
                background-color: #f5f5f5;
              }
              .total-section {
                margin-top: 20px;
                text-align: right;
              }
              .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
              }
              .status-pending {
                background-color: #fef3c7;
                color: #92400e;
              }
              .status-paid {
                background-color: #dcfce7;
                color: #166534;
              }
              .status-cancelled {
                background-color: #fee2e2;
                color: #991b1b;
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <h1>INVOICE</h1>
                <div>
                  <p>Invoice ID: ${invoice._id}</p>
                  <p>Date: ${format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
                  <p>Time: ${invoice.time}</p>
                </div>
              </div>
              <div>
                <p><strong>Created By:</strong> ${invoice.createdBy?.name || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map(item => `
                    <tr>
                      <td>${item.productId.name}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.price.toFixed(2)}</td>
                      <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="total-section">
                <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
                <p>Tax (10%): ₹${tax.toFixed(2)}</p>
                <p><strong>Total: ₹${total.toFixed(2)}</strong></p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (error: unknown) {
      console.error('Error printing invoice:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to print invoice",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Invoice Details</CardTitle>
        <div className="flex space-x-2">
          {invoice.status === 'pending' && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => handleStatusUpdate('paid')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={printInvoice}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Invoice Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Invoice ID:</span> {invoice._id}</p>
              <p>
                <span className="font-medium">Date:</span>{' '}
                {format(new Date(invoice.date), 'dd/MM/yyyy')}
              </p>
              <p>
                <span className="font-medium">Time:</span>{' '}
                <span className="text-muted-foreground">
                  {invoice.time}
                </span>
              </p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium
                  ${invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">User Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Created By:</span> {invoice.createdBy?.name || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.productId._id}>
                  <TableCell>{item.productId.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₹{item.price.toFixed(2)}</TableCell>
                  <TableCell>₹{(item.quantity * item.price).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Subtotal</p>
            <p className="text-lg font-semibold">₹{subtotal.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tax (10%)</p>
            <p className="text-lg font-semibold">₹{tax.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">₹{total.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 