import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Link } from "wouter";
import { Plus, ExternalLink, RefreshCw, Trash2 } from "lucide-react";

export default function Dashboard() {
  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery();
  const deployMutation = trpc.clients.deploy.useMutation();
  const deleteMutation = trpc.clients.delete.useMutation();

  const handleDeploy = async (clientId: string) => {
    if (confirm("Deploy this client to Railway?")) {
      try {
        await deployMutation.mutateAsync({ clientId });
        alert("Deployment started successfully!");
        refetch();
      } catch (error) {
        alert(`Deployment failed: ${error}`);
      }
    }
  };

  const handleDelete = async (clientId: string) => {
    if (confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      try {
        await deleteMutation.mutateAsync({ clientId });
        alert("Client deleted successfully!");
        refetch();
      } catch (error) {
        alert(`Failed to delete client: ${error}`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "deploying":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  const activeClients = clients?.filter((c) => c.status === "active").length || 0;
  const inactiveClients = clients?.filter((c) => c.status === "inactive").length || 0;
  const failedClients = clients?.filter((c) => c.status === "failed").length || 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground">Manage LendPro client deployments</p>
        </div>
        <Link href="/clients/create">
          <Button>
            <Plus className="w-4 h-4" />
            New Client
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Clients</CardDescription>
            <CardTitle className="text-3xl">{clients?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Deployments</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Failed / Inactive</CardDescription>
            <CardTitle className="text-3xl text-red-600">{failedClients + inactiveClients}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Clients Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Clients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients?.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{client.name}</CardTitle>
                    <CardDescription>{client.domain}</CardDescription>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(client.status)}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Status:</span>{" "}
                    <span className="capitalize">{client.status}</span>
                  </div>
                  {client.serviceUrl && (
                    <div className="text-sm">
                      <a
                        href={`https://${client.serviceUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Visit Site <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {client.lastDeployedAt && (
                    <div className="text-sm text-muted-foreground">
                      Last deployed: {formatDate(client.lastDeployedAt)}
                    </div>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="outline" size="sm" className="flex-1">
                        Details
                      </Button>
                    </Link>
                    {client.status === "inactive" && (
                      <Button
                        size="sm"
                        onClick={() => handleDeploy(client.id)}
                        disabled={deployMutation.isLoading}
                      >
                        <RefreshCw className="w-3 h-3" />
                        Deploy
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                      disabled={deleteMutation.isLoading}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {(!clients || clients.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No clients yet</p>
              <Link href="/clients/create">
                <Button>
                  <Plus className="w-4 h-4" />
                  Create Your First Client
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
