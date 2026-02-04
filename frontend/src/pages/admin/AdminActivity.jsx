import { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingCart, Package, Tag, Settings, Activity, Filter, X } from "lucide-react";
import { useAuth, API } from "../../App";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";

const AdminActivity = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [filterType, setFilterType] = useState("all");
    const [filterAction, setFilterAction] = useState("all");

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const response = await axios.get(`${API}/admin/activity-log`, { withCredentials: true });
            setActivities(response.data.activities || []);
        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'order': return <ShoppingCart className="h-4 w-4" />;
            case 'product': return <Package className="h-4 w-4" />;
            case 'coupon': return <Tag className="h-4 w-4" />;
            case 'settings': return <Settings className="h-4 w-4" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    const getActivityColor = (action) => {
        switch (action) {
            case 'create': return 'bg-green-100 text-green-700 border-green-200';
            case 'update': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'delete': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredActivities = activities.filter(activity => {
        if (filterType !== "all" && activity.type !== filterType) return false;
        if (filterAction !== "all" && activity.action !== filterAction) return false;
        return true;
    });

    const clearFilters = () => {
        setFilterType("all");
        setFilterAction("all");
    };

    return (
        <div className="max-w-4xl mx-auto" data-testid="admin-activity">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Activity Log</h1>
                    <p className="text-gray-500">Track all admin actions and changes</p>
                </div>
                <div className="flex gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Filter Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="order">Orders</SelectItem>
                            <SelectItem value="product">Products</SelectItem>
                            <SelectItem value="coupon">Coupons</SelectItem>
                            <SelectItem value="settings">Settings</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Filter Action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="create">Created</SelectItem>
                            <SelectItem value="update">Updated</SelectItem>
                            <SelectItem value="delete">Deleted</SelectItem>
                        </SelectContent>
                    </Select>
                    {(filterType !== "all" || filterAction !== "all") && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Activity</CardTitle>
                    <Badge variant="outline" className="font-normal">
                        {filteredActivities.length} records
                    </Badge>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />)}
                        </div>
                    ) : filteredActivities.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No activity found matching filters</p>
                            <Button variant="link" onClick={clearFilters}>Clear filters</Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredActivities.map((activity, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 bg-white border rounded-lg hover:shadow-sm transition-all duration-200">
                                    <div className={`p-2 rounded-lg border ${getActivityColor(activity.action)} bg-opacity-20`}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium text-gray-900 truncate pr-2">{activity.description}</p>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(activity.timestamp).toLocaleString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {activity.user_name || "Admin"}
                                            </Badge>
                                            <span className={`px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${getActivityColor(activity.action)}`}>
                                                {activity.action}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminActivity;
