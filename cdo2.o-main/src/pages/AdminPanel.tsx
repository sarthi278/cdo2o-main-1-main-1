import { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Search, Settings, Trash, User as UserIcon, Users, Package, IndianRupee, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductManagement from "@/components/admin/ProductManagement";
import AddUserForm from "@/components/admin/AddUserForm";
import { userService } from "@/services/user";
import { invoiceService } from "@/services/invoice";
import type { User } from "@/services/user";
import type { Invoice } from "@/services/invoice";
import { format } from "date-fns";
import InvoiceDetails from "@/components/InvoiceDetails";

interface SystemSetting {
  id: string;
  name: string;
  value: boolean;
  category: 'Notifications' | 'Security' | 'Billing' | 'Appearance' | 'System' | 'Reporting';
}

// Mock system settings with proper typing
const mockSettings: SystemSetting[] = [
  { id: "1", name: "Enable Email Notifications", value: true, category: "Notifications" },
  { id: "2", name: "Two-Factor Authentication", value: false, category: "Security" },
  { id: "3", name: "Auto-generate Invoices", value: true, category: "Billing" },
  { id: "4", name: "Dark Mode Default", value: false, category: "Appearance" },
  { id: "5", name: "Data Backup", value: true, category: "System" },
  { id: "6", name: "User Activity Logging", value: true, category: "Security" },
  { id: "7", name: "Email Reports", value: false, category: "Reporting" },
];

interface ExportableInvoice {
  invoiceNumber: string;
  customer?: {
    name: string;
  };
  date: string;
  amount: number;
  status: string;
}

const exportToCSV = (data: ExportableInvoice[], filename: string) => {
  // Convert data to CSV format
  const headers = ['Invoice Number', 'Customer Name', 'Date', 'Time', 'Amount', 'Status'];
  const csvContent = [
    headers.join(','),
    ...data.map(invoice => [
      invoice.invoiceNumber,
      `"${invoice.customer?.name || 'N/A'}"`,
      format(new Date(invoice.date), 'dd/MM/yyyy'),
      new Date(invoice.date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }),
      invoice.amount.toFixed(2),
      invoice.status.toUpperCase()
    ].join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up the URL object
};

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSetting[]>(mockSettings);
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const data = await invoiceService.getAllInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchInvoices();
    }
  }, [isAdmin]);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
        duration: 5000,
      });
      navigate("/dashboard");
    }
  }, [isAdmin, navigate, toast]);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSettingChange = (id: string, newValue: boolean) => {
    const updatedSettings = settings.map(setting => 
      setting.id === id ? { ...setting, value: newValue } : setting
    );
    setSettings(updatedSettings);
    
    const settingName = settings.find(s => s.id === id)?.name;
    
    toast({
      title: `Setting updated`,
      description: `${settingName} has been ${newValue ? 'enabled' : 'disabled'}.`,
      duration: 3000,
    });
  };

  const deleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      await fetchUsers(); // Refresh the user list
      setUserToDelete(null);
      
      toast({
        title: "Success",
        description: "User deleted successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      await invoiceService.deleteInvoice(invoice._id);
      await fetchInvoices(); // Refresh the invoices list
      setInvoiceToDelete(null);
      
      toast({
        title: "Success",
        description: `Invoice #${invoice.invoiceNumber} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, products, invoices, and system settings.
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card className="neo">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search users..."
                      className="w-[250px] pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <AddUserForm onSuccess={fetchUsers} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Loading users...
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <TableRow key={user._id}>
                            <TableCell>
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <UserIcon className="h-4 w-4" />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === "admin" ? "default" : "outline"}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.status === "active" ? "default" : "secondary"}>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog open={userToDelete === user._id} onOpenChange={(open) => !open && setUserToDelete(null)}>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => setUserToDelete(user._id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {user.name}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() => deleteUser(user._id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No users found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                <div className="space-x-2">
                  <Button variant="outline">Export Users</Button>
                  <Button>Batch Actions</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>
          
          <TabsContent value="invoices">
            <Card className="neo">
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
                <CardDescription>View and manage all invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoicesLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Loading invoices...
                          </TableCell>
                        </TableRow>
                      ) : invoices.length > 0 ? (
                        invoices.map((invoice) => (
                          <TableRow key={invoice._id}>
                            <TableCell>{invoice.invoiceNumber}</TableCell>
                            <TableCell>{invoice.customer?.name || 'N/A'}</TableCell>
                            <TableCell>
                              {format(new Date(invoice.date), 'dd/MM/yyyy')}
                              <br />
                              <span className="text-sm text-muted-foreground">
                                {new Date(invoice.date).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                  timeZone: 'Asia/Kolkata'
                                })}
                              </span>
                            </TableCell>
                            <TableCell className="flex items-center">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              {invoice.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  invoice.status === 'pending' ? 'secondary' :
                                  invoice.status === 'paid' ? 'default' :
                                  'destructive'
                                }
                              >
                                {invoice.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedInvoice(invoice)}
                                >
                                  View Details
                                </Button>
                                <AlertDialog open={invoiceToDelete?._id === invoice._id} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => setInvoiceToDelete(invoice)}
                                    >
                                      <Trash className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete Invoice #{invoice.invoiceNumber}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() => handleDeleteInvoice(invoice)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No invoices found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {invoices.length} invoices
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                      exportToCSV(invoices.map(invoice => ({
                        invoiceNumber: invoice.invoiceNumber,
                        customer: { name: invoice.customer?.name || 'N/A' },
                        date: invoice.date,
                        amount: invoice.amount,
                        status: invoice.status
                      })), `invoices_${timestamp}.csv`);
                    }}
                  >
                    Export Invoices
                  </Button>
                  {/* <Button>Generate Report</Button> */}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="neo">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure global system settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {["Security", "Billing", "Notifications", "Appearance", "System", "Reporting"].map(category => {
                    const categorySettings = settings.filter(s => s.category === category);
                    if (categorySettings.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h3 className="text-lg font-medium mb-4">{category}</h3>
                        <div className="space-y-4">
                          {categorySettings.map(setting => (
                            <div key={setting.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                              <div>
                                <Label htmlFor={`setting-${setting.id}`} className="text-base">
                                  {setting.name}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  {setting.value ? "Enabled" : "Disabled"}
                                </p>
                              </div>
                              <Switch
                                id={`setting-${setting.id}`}
                                checked={setting.value}
                                onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                <Button>Save All Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedInvoice && (
          <AlertDialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
            <AlertDialogContent className="max-w-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Invoice Details</AlertDialogTitle>
                <AlertDialogDescription>
                  Invoice #{selectedInvoice.invoiceNumber}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <InvoiceDetails 
                  invoice={selectedInvoice} 
                  onClose={() => setSelectedInvoice(null)}
                  onStatusUpdate={async (newStatus: 'pending' | 'paid' | 'cancelled') => {
                    try {
                      await invoiceService.updateInvoiceStatus(selectedInvoice._id, newStatus);
                      await fetchInvoices();
                      toast({
                        title: "Success",
                        description: "Invoice status updated successfully",
                      });
                    } catch (error) {
                      console.error('Error updating invoice status:', error);
                      toast({
                        title: "Error",
                        description: "Failed to update invoice status",
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    // Handle print or download
                  }}
                >
                  Print/Download
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </MainLayout>
  );
}
