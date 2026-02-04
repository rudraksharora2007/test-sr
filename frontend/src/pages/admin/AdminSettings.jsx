import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth, API } from "../../App";
import LuxurySuccessToast from "../../components/LuxurySuccessToast";
import LuxuryErrorToast from "../../components/LuxuryErrorToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const AdminSettings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        store_phone: "",
        whatsapp_number: "",
        low_stock_threshold: 5,
        store_email: "",
        free_shipping_threshold: 999,
        cod_enabled: true
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(`${API}/admin/settings`, { withCredentials: true });
            if (response.data) setSettings(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`${API}/admin/settings`, settings, { withCredentials: true });
            toast.custom((t) => (
                <LuxurySuccessToast t={t} title="Saved" message="Settings updated successfully." />
            ), { duration: 3000, unstyled: true });
        } catch (error) {
            toast.custom((t) => (
                <LuxuryErrorToast t={t} title="Error" message="Failed to save settings." />
            ), { duration: 4000, unstyled: true });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-500 mb-8">Configure your store preferences</p>

            <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle>Store Settings</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label>Store Phone Number</Label>
                            <Input value={settings.store_phone} onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })} placeholder="+971 XX XXX XXXX" />
                        </div>
                        <div>
                            <Label>WhatsApp Number</Label>
                            <Input value={settings.whatsapp_number} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} placeholder="+971 XX XXX XXXX" />
                        </div>
                        <div>
                            <Label>Store Email</Label>
                            <Input type="email" value={settings.store_email} onChange={(e) => setSettings({ ...settings, store_email: e.target.value })} placeholder="srdubaifashion@gmail.com" />
                        </div>
                        <div>
                            <Label>Low Stock Threshold</Label>
                            <Input type="number" value={settings.low_stock_threshold} onChange={(e) => setSettings({ ...settings, low_stock_threshold: parseInt(e.target.value) || 5 })} />
                            <p className="text-xs text-gray-500 mt-1">Products below this stock will show as "Low Stock"</p>
                        </div>
                        <div>
                            <Label>Free Shipping Threshold (₹)</Label>
                            <Input type="number" value={settings.free_shipping_threshold} onChange={(e) => setSettings({ ...settings, free_shipping_threshold: parseInt(e.target.value) || 999 })} />
                            <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <Button onClick={handleSave} disabled={saving} className="btn-primary">
                            <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSettings;
