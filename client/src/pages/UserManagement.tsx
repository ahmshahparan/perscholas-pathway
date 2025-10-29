import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Edit } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function UserManagement() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Create user form
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "global_admin",
  });
  
  // Edit user form
  const [editForm, setEditForm] = useState({
    email: "",
    role: "admin" as "admin" | "global_admin",
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      setLocation("/admin");
      return;
    }
    setToken(adminToken);
  }, [setLocation]);

  const { data: users, refetch } = trpc.adminUsers.list.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const createUserMutation = trpc.adminUsers.create.useMutation({
    onSuccess: () => {
      setSuccess("User created successfully!");
      setError("");
      setIsCreateDialogOpen(false);
      setCreateForm({ username: "", email: "", password: "", role: "admin" });
      refetch();
    },
    onError: (err) => {
      setError(err.message);
      setSuccess("");
    },
  });

  const updateUserMutation = trpc.adminUsers.update.useMutation({
    onSuccess: () => {
      setSuccess("User updated successfully!");
      setError("");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (err) => {
      setError(err.message);
      setSuccess("");
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setError("");
    setSuccess("");
    
    createUserMutation.mutate({
      token,
      ...createForm,
    });
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUser) return;
    
    setError("");
    setSuccess("");
    
    updateUserMutation.mutate({
      token,
      id: selectedUser.id,
      ...editForm,
    });
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Per Scholas Branded Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container py-4 flex items-center gap-4">
          <img 
            src="/images/perscholas-logo.png" 
            alt="Per Scholas" 
            className="h-10"
          />
          <div className="border-l pl-4">
            <h1 className="text-2xl font-bold text-primary">User Management</h1>
            <p className="text-sm text-muted-foreground">Manage admin users and permissions</p>
          </div>
        </div>
      </div>
      
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => setLocation("/admin/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Admin User</DialogTitle>
                <DialogDescription>
                  Add a new admin user to the system. They will be required to change their password on first login.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <p className="text-sm text-gray-500">Minimum 8 characters. User will change on first login.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={createForm.role} onValueChange={(value: "admin" | "global_admin") => setCreateForm({ ...createForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="global_admin">Global Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>Manage admin users and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "global_admin" ? "default" : "secondary"}>
                        {user.role === "global_admin" ? "Global Admin" : "Admin"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isFirstLogin === 1 ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pending Password Change
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.createdBy || "-"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Admin User</DialogTitle>
              <DialogDescription>
                Update user information. Username cannot be changed.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={selectedUser?.username || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={(value: "admin" | "global_admin") => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="global_admin">Global Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Updating..." : "Update User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

