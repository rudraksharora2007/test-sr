import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, Eye, Mail } from "lucide-react";
import { useAuth, API } from "../../App";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const AdminCustomers = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API}/admin/customers`, { withCredentials: true });
            setCustomers(response.data.customers || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const viewCustomerDetails = async (customer) => {
        setSelectedCustomer(customer);
        setIsDetailDialogOpen(true);
        try {
            const response = await axios.get(`${API}/admin/customers/${customer.user_id}`, { withCredentials: true });
            setCustomerOrders(response.data.orders || []);
        } catch (error) {
            console.error("Error fetching customer orders:", error);
            setCustomerOrders([]);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Customers</h1>
            <p className="text-gray-500 mb-8">View and manage your customer base</p>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">{customers.length}</p>
                        <p className="text-sm text-gray-500">Total Customers</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Customers Table */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center">Loading...</div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No customers found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-gray-600">Customer</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Email</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Phone</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Joined</th>
                                        <th className="text-center p-4 font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredCustomers.map((customer) => (
                                        <tr key={customer.user_id} className="hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-semibold">
                                                        {customer.name?.charAt(0)?.toUpperCase() || "?"}
                                                    </div>
                                                    <p className="font-medium">{customer.name || "Guest"}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">{customer.email}</td>
                                            <td className="p-4 text-sm text-gray-600">{customer.phone || "-"}</td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "-"}
                                            </td>
                                            <td className="p-4 text-center">
                                                <Button variant="ghost" size="sm" onClick={() => viewCustomerDetails(customer)}>
                                                    <Eye className="h-4 w-4 mr-1" /> View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Customer Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Customer Details</DialogTitle>
                    </DialogHeader>
                    {selectedCustomer && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-2xl font-bold">
                                    {selectedCustomer.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <div>
                                    <p className="text-xl font-semibold">{selectedCustomer.name || "Guest"}</p>
                                    <p className="text-gray-500 flex items-center gap-2"><Mail className="h-4 w-4" /> {selectedCustomer.email}</p>
                                    {selectedCustomer.phone && <p className="text-gray-500">{selectedCustomer.phone}</p>}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3">Order History ({customerOrders.length} orders)</h4>
                                {customerOrders.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No orders yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {customerOrders.map((order) => (
                                            <div key={order.order_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-sm">{order.order_id}</p>
                                                    <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">₹{order.total?.toLocaleString()}</p>
                                                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                        order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                            order.order_status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {order.order_status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminCustomers;
