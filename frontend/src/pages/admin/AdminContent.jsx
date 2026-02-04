import { useState, useEffect } from "react";
import axios from "axios";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth, API } from "../../App";
import LuxurySuccessToast from "../../components/LuxurySuccessToast";
import LuxuryErrorToast from "../../components/LuxuryErrorToast";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const AdminContent = () => {
    const { user } = useAuth();
    const [activePage, setActivePage] = useState("shipping");
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState({
        shipping: "",
        returns: "",
        privacy: "",
        terms: "",
        contact: ""
    });

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await axios.get(`${API}/admin/content`, { withCredentials: true });
            if (response.data) setContent(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error("Error fetching content:", error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`${API}/admin/content/${activePage}`, { content: content[activePage] }, { withCredentials: true });
            toast.custom((t) => (
                <LuxurySuccessToast t={t} title="Saved" message="Content updated successfully." />
            ), { duration: 3000, unstyled: true });
        } catch (error) {
            toast.custom((t) => (
                <LuxuryErrorToast t={t} title="Error" message="Failed to save content." />
            ), { duration: 4000, unstyled: true });
        } finally {
            setSaving(false);
        }
    };

    const pages = [
        { id: "shipping", name: "Shipping Policy" },
        { id: "returns", name: "Returns & Refunds" },
        { id: "privacy", name: "Privacy Policy" },
        { id: "terms", name: "Terms & Conditions" },
        { id: "contact", name: "Contact Information" }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Content Pages</h1>
            <p className="text-gray-500 mb-8">Edit your store's static pages</p>

            <div className="flex flex-wrap gap-2 mb-6">
                {pages.map(page => (
                    <Button key={page.id} variant={activePage === page.id ? "default" : "outline"} onClick={() => setActivePage(page.id)}>
                        {page.name}
                    </Button>
                ))}
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle>{pages.find(p => p.id === activePage)?.name}</CardTitle></CardHeader>
                <CardContent>
                    <Textarea
                        value={content[activePage]}
                        onChange={(e) => setContent({ ...content, [activePage]: e.target.value })}
                        rows={15}
                        placeholder={`Enter ${pages.find(p => p.id === activePage)?.name} content here...`}
                        className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">You can use basic HTML formatting</p>
                    <div className="mt-4">
                        <Button onClick={handleSave} disabled={saving} className="btn-primary">
                            <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save Content"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminContent;
