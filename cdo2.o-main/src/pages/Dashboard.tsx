import React, { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ProductList from "@/components/ProductList";
import { invoiceService, Invoice } from "@/services/invoice";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { IndianRupee } from "lucide-react";
import InvoiceDetails from "@/components/InvoiceDetails";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent invoices
        const recent = await invoiceService.getRecentInvoices(5);
        setRecentInvoices(recent);

        // Fetch all invoices for total count
        const allInvoices = await invoiceService.getAllInvoices();
        setTotalInvoices(allInvoices.length);
      } catch (error) {
        console.error('Error fetching invoice data:', error);
        toast({
          title: "Error",
          description: "Failed to load invoice data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'User'}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card> */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalInvoices}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>
                  Your latest generated invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : recentInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {recentInvoices.map((invoice) => (
                      <div
                        key={invoice._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium">Invoice #{invoice._id.slice(-6)}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(invoice.date), 'dd/MM/yyyy')}{' '}
                            {new Date(invoice.date).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'Asia/Kolkata'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium flex items-center">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            {invoice.amount.toFixed(2)}
                          </div>
                          <div className={`text-sm ${
                            invoice.status === 'paid' ? 'text-green-600' :
                            invoice.status === 'pending' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent invoices found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <ProductList />
          </TabsContent>
        </Tabs>

        {/* Recent Invoices */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Recent Invoices</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentInvoices.map((invoice) => (
              <Card key={invoice._id} className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedInvoice(invoice)}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Invoice #{invoice._id.slice(-6)}</span>
                    {/* <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}>
                      {invoice.status.toUpperCase()}
                    </span> */}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Customer: {invoice.customer}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Date: {format(new Date(invoice.date), 'dd/MM/yyyy')}{' '}
                      {new Date(invoice.date).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Kolkata'
                      })}
                    </p>
                    <p className="font-semibold flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {invoice.amount.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
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
      </div>
    </MainLayout>
  );
}
