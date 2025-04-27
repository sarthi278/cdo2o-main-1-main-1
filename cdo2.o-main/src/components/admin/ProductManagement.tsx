import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger, 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Edit, Plus, Search, Trash, Download, Printer } from "lucide-react";
import { productService } from "@/services/product";
import type { Product, CreateProductData, UpdateProductData } from "@/services/product";

interface ProductFormData {
  productId: string;
  name: string;
  price: string;
  stock: string;
  category: string;
}

const initialFormData: ProductFormData = {
  productId: "",
  name: "",
  price: "",
  stock: "",
  category: "",
};

const ProductManagement: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [loading, setLoading] = useState(true);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    product.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle add product
  const handleAddProduct = async () => {
    // Validate form
    if (!formData.name.trim() || !formData.productId.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name and ID are required",
        variant: "destructive",
      });
      return;
    }

    // Validate price
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    // Validate stock
    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid stock quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      const newProduct: CreateProductData = {
        productId: formData.productId.trim(),
        name: formData.name.trim(),
        price: price,
        stock: stock,
        category: formData.category.trim(),
      };

      const createdProduct = await productService.createProduct(newProduct);
      setProducts([...products, createdProduct]);
      
      // Reset form and close dialog
      setFormData(initialFormData);
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: `${newProduct.name} has been added successfully.`,
      });
    } catch (error: unknown) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
        variant: "destructive",
      });
    }
  };

  // Handle edit product
  const handleEditProduct = async () => {
    if (!selectedProduct) return;
    
    // Validate form
    if (!formData.name.trim() || !formData.productId.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name and ID are required",
        variant: "destructive",
      });
      return;
    }

    // Validate price
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    // Validate stock
    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid stock quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: UpdateProductData = {
        productId: formData.productId.trim(),
        name: formData.name.trim(),
        price: price,
        stock: stock,
        category: formData.category.trim(),
      };

      const updatedProduct = await productService.updateProduct(selectedProduct._id, updateData);
      setProducts(products.map(product => 
        product._id === selectedProduct._id ? updatedProduct : product
      ));
      
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      setFormData(initialFormData);
      
      toast({
        title: "Success",
        description: `${formData.name} has been updated successfully.`,
      });
    } catch (error: unknown) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      });
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setProducts(products.filter(product => product._id !== id));
      
      toast({
        title: "Success",
        description: "Product has been deleted successfully.",
      });
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog and populate form
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      productId: product.productId,
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
    });
    setIsEditDialogOpen(true);
  };

  // Export products to CSV
  const exportToCSV = () => {
    const headers = ['Product ID', 'Name', 'Category', 'Price', 'Stock'];
    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        product.productId,
        `"${product.name}"`,
        `"${product.category}"`,
        product.price.toFixed(2),
        product.stock
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print catalog
  const printCatalog = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Product Catalog</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .header { text-align: center; margin-bottom: 20px; }
              .timestamp { text-align: right; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Product Catalog</h1>
            </div>
            <div class="timestamp">
              Generated on: ${new Date().toLocaleString()}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(product => `
                  <tr>
                    <td>${product.productId}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>₹${product.price.toFixed(2)}</td>
                    <td>${product.stock}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <Card className="neo">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>Manage your products inventory</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-[250px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Fill out the form below to add a new product to inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productId">Product ID *</Label>
                    <Input 
                      id="productId" 
                      name="productId" 
                      value={formData.productId} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={formData.price} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input 
                      id="category" 
                      name="category" 
                      value={formData.category} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input 
                      id="stock" 
                      name="stock" 
                      type="number" 
                      min="0" 
                      value={formData.stock} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddProduct}>Save Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <TableRow key={product._id}>
                    <TableCell className="font-medium">{product.productId}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>₹{product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 10 ? "default" : (product.stock > 0 ? "secondary" : "destructive")}>
                        {product.stock} {product.stock === 1 ? 'item' : 'items'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteProduct(product._id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Products
          </Button>
          <Button 
            variant="print"
            onClick={printCatalog}
            className="flex items-center"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Catalog
          </Button>
        </div>
      </CardFooter>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-productId">Product ID *</Label>
                <Input 
                  id="edit-productId" 
                  name="productId" 
                  value={formData.productId} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (₹) *</Label>
                <Input 
                  id="edit-price" 
                  name="price" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={formData.price} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input 
                  id="edit-category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stock">Stock</Label>
                <Input 
                  id="edit-stock" 
                  name="stock" 
                  type="number" 
                  min="0" 
                  value={formData.stock} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditProduct}>Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProductManagement;
