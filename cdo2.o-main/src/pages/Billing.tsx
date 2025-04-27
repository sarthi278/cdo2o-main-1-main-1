import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Search, Settings, Trash, User as UserIcon, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InvoiceDetails from "@/components/InvoiceDetails";
import { format } from "date-fns";
import { IndianRupee } from "lucide-react";
import { invoiceService, Invoice } from "@/services/invoice";
import { userService, User, CreateUserData } from "@/services/user";

interface UserFormData extends Omit<CreateUserData, 'password'> {
  id?: string;
}

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState([]); // We'll implement settings later
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: "",
    email: "",
    role: "user",
    status: "active"
  });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await invoiceService.getAllInvoices();
        setInvoices(data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: "Error",
          description: "Failed to load invoices",
          variant: "destructive",
        });
      }
    };

    fetchInvoices();
  }, [toast]);

  // Redirect non-admin users
  React.useEffect(() => {
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
    
    // Find the setting name for the toast
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
      setUsers(users.filter(user => user._id !== userId));
      setUserToDelete(null);
      
      toast({
        title: "User deleted",
        description: "The user has been removed from the system.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      company: user.company,
      phone: user.phone,
      address: user.address
    });
    setShowUserDialog(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: "",
      email: "",
      role: "user",
      status: "active"
    });
    setShowUserDialog(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        const { id, ...updateData } = userFormData;
        const updatedUser = await userService.updateUser(editingUser._id, updateData);
        setUsers(users.map(user => user._id === editingUser._id ? updatedUser : user));
        toast({
          title: "User updated",
          description: `${userFormData.name}'s information has been updated.`,
          duration: 3000,
        });
      } else {
        // Add new user
        const newUser = await userService.createUser({
          ...userFormData,
          password: 'tempPassword123' // You might want to generate this or ask for it in the form
        });
        setUsers([...users, newUser]);
        toast({
          title: "User added",
          description: `${userFormData.name} has been added to the system.`,
          duration: 3000,
        });
      }
      
      setShowUserDialog(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: "Failed to save user",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return null; // Prevent rendering if not admin
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, system settings, and administrative functions.
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
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
                  <Button onClick={handleAddUser}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
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
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
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
                            <TableCell>{user.lastLogin || 'Never'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUser(user)}>
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
                          <TableCell colSpan={7} className="h-24 text-center">
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
      </div>

      {/* User Add/Edit Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser 
                ? "Update user information and permissions." 
                : "Fill in the details to create a new user account."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={userFormData.name} 
                  onChange={handleInputChange} 
                  placeholder="Enter full name" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={userFormData.email} 
                  onChange={handleInputChange} 
                  placeholder="Enter email address" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={userFormData.role} 
                  onValueChange={(value) => handleSelectChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={userFormData.status} 
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingUser ? "Update User" : "Add User"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoices Table */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">All Invoices</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell>#{invoice._id.slice(-6)}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {invoice.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <InvoiceDetails
              invoice={selectedInvoice}
              onClose={() => setSelectedInvoice(null)}
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
}
