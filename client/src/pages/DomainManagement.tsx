import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function DomainManagement() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, token, username } = useAdminAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: domains, isLoading } = trpc.domains.list.useQuery();

  const createDomainMutation = trpc.adminDomains.create.useMutation({
    onSuccess: () => {
      toast.success("Domain created successfully!");
      utils.domains.list.invalidate();
      setCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create domain");
    },
  });

  const updateDomainMutation = trpc.adminDomains.update.useMutation({
    onSuccess: () => {
      toast.success("Domain updated successfully!");
      utils.domains.list.invalidate();
      setEditDialogOpen(false);
      setSelectedDomain(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update domain");
    },
  });

  const deleteDomainMutation = trpc.adminDomains.delete.useMutation({
    onSuccess: () => {
      toast.success("Domain deleted successfully!");
      utils.domains.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete domain");
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/admin");
    }
  }, [isAuthenticated, setLocation]);

  const handleCreateDomain = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createDomainMutation.mutate({
      token: token!,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    });
  };

  const handleUpdateDomain = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateDomainMutation.mutate({
      token: token!,
      id: selectedDomain.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    });
  };

  const handleDeleteDomain = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the domain "${name}"? This action cannot be undone if no courses are using it.`)) {
      deleteDomainMutation.mutate({
        token: token!,
        id,
      });
    }
  };

  const handleEditClick = (domain: any) => {
    setSelectedDomain(domain);
    setEditDialogOpen(true);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container py-4">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold">Domain Management</h1>
          <p className="text-sm text-muted-foreground">Manage course domains and categories</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            {domains?.length || 0} domain{domains?.length !== 1 ? "s" : ""} available
          </p>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Domain</DialogTitle>
                <DialogDescription>Add a new course domain to categorize courses</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDomain} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Domain Name</Label>
                  <Input id="name" name="name" placeholder="Software Engineering" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe this domain..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createDomainMutation.isPending}>
                    {createDomainMutation.isPending ? "Creating..." : "Create Domain"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading domains...</p>
          </div>
        ) : domains && domains.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {domains.map((domain) => (
              <Card key={domain.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{domain.name}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(domain)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain.id, domain.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                  {domain.description && (
                    <CardDescription>{domain.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No domains found. Create your first domain to get started.</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Domain</DialogTitle>
              <DialogDescription>Update domain information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateDomain} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Domain Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedDomain?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={selectedDomain?.description || ""}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateDomainMutation.isPending}>
                  {updateDomainMutation.isPending ? "Updating..." : "Update Domain"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

