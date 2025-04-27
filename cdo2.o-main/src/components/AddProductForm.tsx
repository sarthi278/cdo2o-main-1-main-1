import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Scan } from 'lucide-react';
import { productService } from '@/services/product';

interface AddProductFormProps {
  onProductAdded: () => void;
}

export default function AddProductForm({ onProductAdded }: AddProductFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();
  const productIdInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    price: '',
    stock: '',
    category: '',
  });

  useEffect(() => {
    if (open) {
      productIdInputRef.current?.focus();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate numeric fields
      const price = parseFloat(formData.price);
      const stock = parseInt(formData.stock);

      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      if (isNaN(stock) || stock < 0) {
        throw new Error('Please enter a valid stock quantity');
      }

      await productService.createProduct({
        productId: formData.productId.trim(),
        name: formData.name.trim(),
        price,
        stock,
        category: formData.category.trim(),
      });

      toast({
        title: 'Success',
        description: 'Product added successfully',
      });

      setFormData({
        productId: '',
        name: '',
        price: '',
        stock: '',
        category: '',
      });
      setOpen(false);
      onProductAdded();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScan = () => {
    setScanning(true);
    // Simulate scanner input (in a real app, this would connect to actual scanner hardware)
    setTimeout(() => {
      const scannedValue = prompt('Enter scanned product ID:');
      if (scannedValue) {
        setFormData(prev => ({ ...prev, productId: scannedValue.trim() }));
      }
      setScanning(false);
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new product to your inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Product ID</Label>
            <div className="flex gap-2">
              <Input
                ref={productIdInputRef}
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
                placeholder="Enter or scan product ID"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleScan}
                disabled={scanning}
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter product name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              placeholder="Enter price"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
              placeholder="Enter stock quantity"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              placeholder="Enter category"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Product'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 