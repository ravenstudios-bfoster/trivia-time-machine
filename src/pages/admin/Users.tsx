import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { Plus, Trash2, UserCog, Shield, ShieldAlert, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Define user types
type UserRole = "admin" | "super_admin";

interface AdminUserData {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  lastLogin?: Date;
  createdAt: Date;
}

const AdminUsers = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("admin");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Redirect if not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/admin/dashboard");
    }
  }, [isSuperAdmin, navigate]);

  // Fetch admin users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isSuperAdmin) return;

      try {
        setIsLoading(true);
        const usersSnapshot = await getDocs(collection(db, "adminUsers"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastLogin: doc.data().lastLogin?.toDate() || null,
        })) as AdminUserData[];

        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching admin users:", error);
        toast.error("Failed to load admin users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isSuperAdmin]);

  // Filter users based on search term
  const filteredUsers = users.filter((user) => user.email.toLowerCase().includes(searchTerm.toLowerCase()) || (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())));

  // Create a new admin user
  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      setIsCreatingUser(true);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword);

      // Add user to adminUsers collection
      await setDoc(doc(db, "adminUsers", userCredential.user.uid), {
        email: newUserEmail,
        displayName: newUserDisplayName || null,
        role: newUserRole,
        createdAt: new Date(),
        createdBy: currentUser?.uid,
      });

      // Update local state
      setUsers([
        ...users,
        {
          id: userCredential.user.uid,
          email: newUserEmail,
          displayName: newUserDisplayName,
          role: newUserRole,
          createdAt: new Date(),
        },
      ]);

      // Reset form
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserDisplayName("");
      setNewUserRole("admin");
      setShowCreateDialog(false);

      toast.success("Admin user created successfully");
    } catch (error) {
      console.error("Error creating admin user:", error);
      toast.error("Failed to create admin user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Delete an admin user
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      // Delete user from adminUsers collection
      await deleteDoc(doc(db, "adminUsers", deleteUserId));

      // Update local state
      setUsers(users.filter((user) => user.id !== deleteUserId));

      toast.success("Admin user deleted successfully");
    } catch (error) {
      console.error("Error deleting admin user:", error);
      toast.error("Failed to delete admin user");
    } finally {
      setDeleteUserId(null);
    }
  };

  // Change user role
  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      // Update user role in Firestore
      await updateDoc(doc(db, "adminUsers", userId), {
        role: newRole,
      });

      // Update local state
      setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));

      toast.success("User role updated successfully");
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  if (!isSuperAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <AdminLayout title="Admin Users Management" subtitle="Create and manage admin users" breadcrumbs={[{ label: "Admin Users", href: "/admin/users" }]}>
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Admin User
        </Button>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{user.displayName || "No display name"}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "super_admin" ? "destructive" : "default"} className="flex items-center gap-1 w-fit">
                      {user.role === "super_admin" ? (
                        <>
                          <ShieldAlert className="h-3 w-3" />
                          Super Admin
                        </>
                      ) : (
                        <>
                          <Shield className="h-3 w-3" />
                          Admin
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.createdAt ? format(user.createdAt, "MMM d, yyyy") : "N/A"}</TableCell>
                  <TableCell>{user.lastLogin ? format(user.lastLogin, "MMM d, yyyy h:mm a") : "Never"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Role toggle button - only for non-current users */}
                      {user.id !== currentUser?.uid && (
                        <Button variant="outline" size="sm" onClick={() => handleChangeRole(user.id, user.role === "admin" ? "super_admin" : "admin")}>
                          <UserCog className="h-4 w-4 mr-2" />
                          {user.role === "admin" ? "Make Super Admin" : "Make Admin"}
                        </Button>
                      )}

                      {/* Delete button - only for non-current users */}
                      {user.id !== currentUser?.uid && (
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteUserId(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-12 border rounded-md">
          <h3 className="text-lg font-medium mb-2">No admin users found</h3>
          <p className="text-muted-foreground mb-6">{searchTerm ? "Try adjusting your search" : "Create your first admin user to get started"}</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Admin User
          </Button>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
            <DialogDescription>Add a new administrator to the system</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="admin@example.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input type="password" placeholder="••••••••" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name (Optional)</label>
              <Input placeholder="John Doe" value={newUserDisplayName} onChange={(e) => setNewUserDisplayName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Super admins can manage other admin users</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreatingUser || !newUserEmail || !newUserPassword}>
              {isCreatingUser ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the admin user from the system. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteUser}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
