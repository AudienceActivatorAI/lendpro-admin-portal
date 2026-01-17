import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function CreateClient() {
  const [, setLocation] = useLocation();
  const createMutation = trpc.clients.create.useMutation();
  const deployMutation = trpc.clients.deploy.useMutation();

  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    lendpro: {
      username: "",
      password: "",
      storeId: "",
      salesId: "",
      salesName: "",
      apiUrl: "https://apisg.mylendpro.com",
    },
    branding: {
      primaryColor: "#2563eb",
      companyName: "",
    },
    visualizer: {
      enabled: true,
      embedCode: "",
      autoSyncApiKey: "",
    },
    features: {
      cartOnly: false,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createMutation.mutateAsync(formData);
      
      if (confirm("Client created! Deploy now?")) {
        await deployMutation.mutateAsync({ clientId: result.clientId });
        alert("Deployment started!");
      }
      
      setLocation("/");
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const updateField = (path: string, value: any) => {
    setFormData((prev) => {
      const keys = path.split(".");
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation("/")} size="icon">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Client</h1>
          <p className="text-muted-foreground">Set up a new LendPro instance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Client name and domain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client Name *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Domain *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.domain}
                onChange={(e) => updateField("domain", e.target.value)}
                placeholder="acme.tredfi.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* LendPro Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>LendPro Credentials</CardTitle>
            <CardDescription>API credentials for LendPro integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">API URL</label>
              <input
                type="url"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.lendpro.apiUrl}
                onChange={(e) => updateField("lendpro.apiUrl", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.lendpro.username}
                  onChange={(e) => updateField("lendpro.username", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.lendpro.password}
                  onChange={(e) => updateField("lendpro.password", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Store ID *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.lendpro.storeId}
                  onChange={(e) => updateField("lendpro.storeId", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sales ID *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.lendpro.salesId}
                  onChange={(e) => updateField("lendpro.salesId", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sales Name *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.lendpro.salesName}
                onChange={(e) => updateField("lendpro.salesName", e.target.value)}
                placeholder="John Doe"
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Branding (Optional)</CardTitle>
            <CardDescription>Customize the appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.branding.companyName}
                onChange={(e) => updateField("branding.companyName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Primary Color</label>
              <input
                type="color"
                className="w-full h-10 px-1 py-1 border rounded-md"
                value={formData.branding.primaryColor}
                onChange={(e) => updateField("branding.primaryColor", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Visualizer Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Visualizer Configuration</CardTitle>
            <CardDescription>3D visualizer and AutoSync integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="visualizerEnabled"
                checked={formData.visualizer.enabled}
                onChange={(e) => updateField("visualizer.enabled", e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="visualizerEnabled" className="text-sm font-medium">
                Enable 3D Visualizer
              </label>
            </div>
            
            {formData.visualizer.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Visualizer Embed Code
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                    value={formData.visualizer.embedCode}
                    onChange={(e) => updateField("visualizer.embedCode", e.target.value)}
                    placeholder="<script src='https://...'></script>"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste the embed code provided by the visualizer platform
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    AutoSync API Key
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.visualizer.autoSyncApiKey}
                    onChange={(e) => updateField("visualizer.autoSyncApiKey", e.target.value)}
                    placeholder="your-autosync-api-key"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    API key for syncing product data with the visualizer
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Configure enabled features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="cartOnly"
                checked={formData.features.cartOnly}
                onChange={(e) => updateField("features.cartOnly", e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="cartOnly" className="text-sm font-medium">
                Cart Only Mode (No visualizer, cart and checkout only)
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Enable this for clients who only need the shopping cart and LendPro integration without the visualizer
            </p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isLoading || deployMutation.isLoading}
          >
            {createMutation.isLoading || deployMutation.isLoading
              ? "Creating..."
              : "Create Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
