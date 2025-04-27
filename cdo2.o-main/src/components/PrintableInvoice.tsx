import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Printer, X } from "lucide-react";

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceType = {
  id: string;
  customer: string;
  customerEmail?: string;
  customerAddress?: string;
  date: string;
  time: string;
  dueDate?: string;
  items: InvoiceItem[];
  status: string;
  notes?: string;
};

interface PrintableInvoiceProps {
  invoice: InvoiceType;
  onClose: () => void;
}

// Add a second interface for the BarcodeScanner usage
export interface BarcodeScannerInvoiceProps {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceTime: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  onClose: () => void;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps | BarcodeScannerInvoiceProps> = (props) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Type guard to determine which props interface we're using
  const isInvoiceTypeProps = (p: any): p is PrintableInvoiceProps => {
    return p.invoice !== undefined;
  };

  const isBarcodeScannerProps = (p: any): p is BarcodeScannerInvoiceProps => {
    return p.invoiceNumber !== undefined;
  };

  let invoice: InvoiceType;
  
  if (isInvoiceTypeProps(props)) {
    invoice = props.invoice;
  } else if (isBarcodeScannerProps(props)) {
    // Convert BarcodeScannerInvoiceProps to InvoiceType format
    invoice = {
      id: props.invoiceNumber,
      customer: "Customer",
      date: props.invoiceDate,
      time: props.invoiceTime,
      items: props.items.map(item => ({
        id: item.barcode || item.id,
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.price
      })),
      status: "Paid"
    };
  } else {
    // Fallback for TypeScript
    invoice = {
      id: "",
      customer: "",
      date: "",
      time: "",
      items: [],
      status: ""
    };
  }

  const calculateSubtotal = () => {
    return invoice.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // Assuming 10% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handlePrint = () => {
    const content = printRef.current;
    const printWindow = window.open('', '_blank');
    
    if (printWindow && content) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.id}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #333;
                padding: 20px;
              }
              .invoice-container {
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                display: flex;
                justify-content: space-between;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
                margin-bottom: 20px;
              }
              .company-info {
                margin-bottom: 40px;
              }
              .invoice-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
              }
              .invoice-details-column {
                width: 48%;
              }
              .customer-info {
                margin-bottom: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                margin-bottom: 20px;
              }
              th, td {
                padding: 12px 8px;
                text-align: left;
                border-bottom: 1px solid #eee;
              }
              th {
                background-color: #f9f9f9;
              }
              .amount-table {
                width: 50%;
                margin-left: auto;
              }
              .amount-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
              }
              .total-row {
                font-weight: bold;
                border-top: 1px solid #eee;
                padding-top: 12px;
                margin-top: 4px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #777;
              }
              @media print {
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              ${content.innerHTML}
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Add a slight delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
        // Some browsers will close the window after printing, some won't
        // Uncomment the line below if you want to force close after printing
        // printWindow.close();
      }, 500);
    }
  };

  // Determine the onClose function based on props
  const onClose = isInvoiceTypeProps(props) ? props.onClose : 
    isBarcodeScannerProps(props) && 'onClose' in props ? (props as any).onClose : () => {};

  // Always use rupee symbol, ignore currency prop from barcode scanner
  const currencySymbol = "₹";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl h-[90vh] overflow-auto bg-white">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
          <CardTitle>Invoice #{isInvoiceTypeProps(props) ? props.invoice.id : props.invoiceNumber}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="print" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
            <Button size="sm" variant="destructive" onClick={onClose} className="hover:bg-red-100">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent ref={printRef} className="p-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-gray-500 text-sm mt-1">#{invoice.id}</p>
            </div>
            <div className="text-right">
              <div className="font-semibold">Ayodhya Sakhi</div>
              <div className="text-sm text-gray-500">
                Maharishi Valmiki Airport<br />
                Ayodhya , Uttar Pradesh<br />
                ayodhyasakhi@gmail.com<br />
                +91 9876543210
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2 text-gray-700">Bill To:</h3>
              <div className="text-sm">
                <div className="font-medium">{invoice.customer}</div>
                {invoice.customerEmail && <div>{invoice.customerEmail}</div>}
                {invoice.customerAddress && (
                  <div className="mt-1 text-gray-600">
                    {invoice.customerAddress}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Invoice Date:</span>
                <span>{new Date(invoice.date).toLocaleDateString()}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Due Date:</span>
                  <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Status:</span>
                <span className={
                  invoice.status === "Paid" ? "text-green-600 font-medium" : 
                  invoice.status === "Pending" ? "text-yellow-600 font-medium" : 
                  "text-red-600 font-medium"
                }>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
          
          <table className="w-full mb-8">
            <thead>
              <tr className="text-left">
                <th className="pb-3">Item</th>
                <th className="pb-3">Quantity</th>
                <th className="pb-3">Unit Price</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 border-t border-gray-100">
                    <div className="font-medium">{item.description}</div>
                  </td>
                  <td className="py-3 border-t border-gray-100">{item.quantity}</td>
                  <td className="py-3 border-t border-gray-100">{currencySymbol}{item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 border-t border-gray-100 text-right">
                    {currencySymbol}{(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="flex justify-end">
            <div className="w-72">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal:</span>
                <span>{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Tax (10%):</span>
                <span>{currencySymbol}{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 font-bold border-t border-gray-200 mt-2">
                <span>Total:</span>
                <span>{currencySymbol}{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {invoice.notes && (
            <div className="mt-8 pt-4 border-t border-gray-100">
              <h3 className="font-semibold mb-2 text-gray-700">Notes:</h3>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
          
          <div className="mt-12 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrintableInvoice;
