import React, { useState, useRef, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Barcode, Camera, CameraOff, Check, IndianRupee, Printer, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import PrintableInvoice from "@/components/PrintableInvoice";
import { productService } from "@/services/product";
import { invoiceService } from "@/services/invoice";
import { useAuth } from "@/contexts/AuthContext";

interface ScannedProduct {
  _id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface InvoiceData {
  id: string;
  number: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}

interface InvoiceItem {
  name: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
}

export default function BarcodeScanner() {
  const { user, isAuthenticated } = useAuth();
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printableInvoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the scanner.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate, toast]);

  useEffect(() => {
    const newTotal = scannedProducts.reduce((sum, product) => {
      return sum + (product.price * product.quantity);
    }, 0);
    setTotalAmount(newTotal);
  }, [scannedProducts]);

  const startScanning = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraAvailable(false);
      toast({
        title: "Camera access unavailable",
        description: "Your device doesn't support camera access or permission was denied.",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        
        setTimeout(() => {
          handleProductScanned("PROD001");
          stopScanning();
        }, 2000);
      }
    } catch (error) {
      setIsCameraAvailable(false);
      toast({
        title: "Camera access denied",
        description: "Please grant camera permission to scan barcodes.",
        variant: "destructive",
      });
      console.error("Error accessing camera:", error);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleProductScanned = async (productId: string) => {
    try {
      const products = await productService.searchProducts(productId);
      
      if (products.length > 0) {
        const foundProduct = products[0];
        const existingProductIndex = scannedProducts.findIndex(p => p.productId === foundProduct.productId);
        
        if (existingProductIndex >= 0) {
          const updatedProducts = [...scannedProducts];
          updatedProducts[existingProductIndex].quantity += 1;
          setScannedProducts(updatedProducts);
        } else {
          setScannedProducts([
            ...scannedProducts,
            { ...foundProduct, quantity: 1 }
          ]);
        }
        
        toast({
          title: "Product scanned",
          description: `${foundProduct.name} has been added to the list.`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Product not found",
          description: `No product found with ID ${productId}.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for product.",
        variant: "destructive",
      });
    }
    
    setManualBarcode("");
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode) {
      handleProductScanned(manualBarcode);
    }
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity > 0) {
      const updatedProducts = [...scannedProducts];
      updatedProducts[index].quantity = newQuantity;
      setScannedProducts(updatedProducts);
    }
  };

  const removeProduct = (index: number) => {
    const updatedProducts = [...scannedProducts];
    updatedProducts.splice(index, 1);
    setScannedProducts(updatedProducts);
  };

  const clearAll = () => {
    setScannedProducts([]);
    toast({
      title: "List cleared",
      description: "All scanned products have been removed.",
    });
  };

  const processPayment = async () => {
    if (scannedProducts.length === 0) {
      toast({
        title: "No products",
        description: "Please scan at least one product to proceed with payment.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to generate invoices.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Calculate total amount
      const total = scannedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);

      // Create invoice data
      const createInvoiceData = {
        amount: total,
        items: scannedProducts.map(product => ({
          productId: product._id,
          quantity: product.quantity,
          price: product.price,
          total: product.quantity * product.price
        })),
        status: 'pending',
        date: new Date().toISOString(),
        invoiceNumber: `INV-${Date.now()}`,
        subtotal: total,
        tax: total * 0.1,
        total: total + (total * 0.1)
      };

      // Save invoice to database
      const savedInvoice = await invoiceService.createInvoice(createInvoiceData);

      // Update UI with generated invoice
      setInvoiceData({
        id: savedInvoice._id,
        number: savedInvoice.invoiceNumber,
        date: savedInvoice.date,
        items: scannedProducts.map(product => ({
          name: product.name,
          productId: product.productId,
          quantity: product.quantity,
          price: product.price,
          total: product.quantity * product.price
        })),
        subtotal: total,
        tax: total * 0.1,
        total: total + (total * 0.1)
      });

      setShowInvoice(true);
      toast({
        title: "Success",
        description: "Invoice generated successfully!",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error generating invoice:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to generate invoice",
          variant: "destructive",
        });
      } else {
        console.error('Unknown error:', error);
        toast({
          title: "Error",
          description: "An unknown error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const printInvoice = () => {
    if (invoiceData) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoiceData.number}</title>
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
                  border-bottom: 2px solid #eee;
                  padding-bottom: 20px;
                }
                .company-info {
                  margin-bottom: 20px;
                }
                .company-info h2 {
                  margin: 0;
                  color: #333;
                }
                .invoice-details {
                  text-align: right;
                }
                .invoice-details p {
                  margin: 5px 0;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                }
                th, td {
                  padding: 12px;
                  border: 1px solid #ddd;
                  text-align: left;
                }
                th {
                  background-color: #f5f5f5;
                  font-weight: bold;
                }
                .total-section {
                  margin-top: 20px;
                  text-align: right;
                  border-top: 2px solid #eee;
                  padding-top: 20px;
                }
                .total-section p {
                  margin: 5px 0;
                }
                .total-section strong {
                  font-size: 1.2em;
                }
                .footer {
                  margin-top: 40px;
                  text-align: center;
                  font-size: 0.9em;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="invoice-container">
                <div class="header">
                  <div class="company-info">
                    <h2>Ayodhya SHG Management</h2>
                    <p>123 Business Street<br>Ayodhya, UP 224001</p>
                  </div>
                  <div class="invoice-details">
                    <h2>INVOICE</h2>
                    <p><strong>Invoice #:</strong> ${invoiceData.number}</p>
                    <p><strong>Date:</strong> ${new Date(invoiceData.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoiceData.items.map((item: InvoiceItem) => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.productId}</td>
                        <td>${item.quantity}</td>
                        <td>₹${item.price.toFixed(2)}</td>
                        <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="total-section">
                  <p><strong>Subtotal:</strong> ₹${invoiceData.subtotal.toFixed(2)}</p>
                  <p><strong>Tax (10%):</strong> ₹${invoiceData.tax.toFixed(2)}</p>
                  <p><strong>Total Amount:</strong> ₹${invoiceData.total.toFixed(2)}</p>
                </div>

                <div class="footer">
                  <p>Thank you for your business!</p>
                  <p>This is a computer-generated invoice. No signature is required.</p>
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
      }
    }
  };

  const closeInvoice = () => {
    setShowInvoice(false);
    setInvoiceData(null);
    setScannedProducts([]);
  };

  const goToBilling = () => {
    navigate('/billing');
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Barcode Scanner</h1>
          <p className="text-muted-foreground">
            Scan product barcode to add them to your invoice.
          </p>
        </div>

        {showInvoice && invoiceData && (
          <PrintableInvoice
            invoiceNumber={invoiceData.number}
            invoiceDate={invoiceData.date}
            invoiceTime={new Date(invoiceData.date).toLocaleTimeString()}
            items={invoiceData.items}
            subtotal={invoiceData.subtotal}
            tax={invoiceData.tax}
            total={invoiceData.total}
            currency="₹"
            onClose={closeInvoice}
          />
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="neo overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Barcode className="mr-2 h-5 w-5" />
                  Scanner
                </CardTitle>
                <CardDescription>
                  Use your camera to scan barcode or enter them manually
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {isScanning ? (
                  <div className="relative w-full h-64 bg-black rounded-md overflow-hidden animate-fade-in">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-2 bg-primary/50 animate-pulse"></div>
                    </div>
                    <div className="absolute inset-0 border-2 border-primary/50 rounded-md"></div>
                    <div className="absolute top-2 right-2">
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={stopScanning}
                      >
                        <CameraOff className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                      Scanning for barcode...
                    </div>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                  </div>
                ) : (
                  <div className="w-full h-64 rounded-md border-2 border-dashed flex items-center justify-center bg-muted/30">
                    {isCameraAvailable ? (
                      <div className="text-center p-6">
                        <Camera className="h-10 w-10 mb-4 mx-auto text-muted-foreground" />
                        <h3 className="font-medium mb-2">Camera Scanner</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Point your camera at a barcode to scan it automatically
                        </p>
                        <Button onClick={startScanning}>
                          <Camera className="mr-2 h-4 w-4" />
                          Start Camera
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center p-6">
                        <CameraOff className="h-10 w-10 mb-4 mx-auto text-muted-foreground" />
                        <h3 className="font-medium mb-2">Camera Unavailable</h3>
                        <p className="text-sm text-muted-foreground">
                          Camera access is unavailable. Please use manual entry.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-2">
                  <h3 className="text-sm font-medium mb-2">Manual Entry</h3>
                  <form onSubmit={handleManualScan} className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Enter product ID (e.g., PROD001)"
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value)}
                      />
                    </div>
                    <Button type="submit" variant="secondary">
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-2">
                    For demo purposes, try these product IDs: PROD001, PROD002, PROD003
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="bg-muted/30 border-t px-6 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-4 w-4 mr-1 text-green-600" />
                  Ready to scan
                </div>
              </CardFooter>
            </Card>

            <Card className="neo">
              <CardHeader>
                <CardTitle>Scanned Products</CardTitle>
                <CardDescription>
                  Products that have been scanned or manually entered
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scannedProducts.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scannedProducts.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.productId}</TableCell>
                            <TableCell>₹{product.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(index, product.quantity - 1)}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={product.quantity}
                                  onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                                  className="w-16 h-8 text-center"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(index, product.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>₹{(product.price * product.quantity).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => removeProduct(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Barcode className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No products scanned yet</p>
                    <p className="text-sm mt-1">Scan a barcode or enter a code manually to add products</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={clearAll} disabled={scannedProducts.length === 0}>
                  Clear All
                </Button>
                <Button onClick={processPayment} disabled={scannedProducts.length === 0}>
                  Generate Invoice
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card className={cn(
              "neo sticky top-6 transition-all duration-300",
              scannedProducts.length > 0 ? "opacity-100" : "opacity-70"
            )}>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
                <CardDescription>
                  Summary of all scanned products
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Items:</span>
                    <span>{scannedProducts.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Quantity:</span>
                    <span>{scannedProducts.reduce((sum, p) => sum + p.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3 w-3 mr-1" />
                      {totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (10%):</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3 w-3 mr-1" />
                      {(totalAmount * 0.1).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t my-4"></div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {(totalAmount + totalAmount * 0.1).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="pt-6">
                  <Button className="w-full" disabled={scannedProducts.length === 0} onClick={processPayment}>
                    Process Payment
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground border-t pt-4">
                Invoice will be automatically saved to your account
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
