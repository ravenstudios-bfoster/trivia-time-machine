import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Plus, MoreHorizontal, Edit, Trash2, Key, Upload } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { UserRole } from "@/types";
import AdminLayout from "@/components/AdminLayout";
import { resetUserPassword } from "@/api/users";
import ImportUsersDialog from "@/components/ImportUsersDialog";

interface User {
  id: string; // This will be the Firebase Auth UID
  email: string;
  role: UserRole;
  displayName: string;
  firstName: string;
  lastName: string;
}

interface UserFormData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const DELETE_USER_FUNCTION_URL = "https://us-central1-trivia-6b7e8.cloudfunctions.net/deleteUser"; // TODO: Replace with your actual function URL
const RESET_PASSWORD_FUNCTION_URL = "https://us-central1-trivia-6b7e8.cloudfunctions.net/resetUserPassword"; // TODO: Replace with your actual function URL
const CREATE_USER_FUNCTION_URL = "https://us-central1-trivia-6b7e8.cloudfunctions.net/createUser"; // TODO: Replace with your actual function URL

const Users = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user" as UserRole,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Add state for reset password
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Add state for bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkResetDialog, setShowBulkResetDialog] = useState(false);
  const [bulkResetPasswordValue, setBulkResetPasswordValue] = useState("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    } catch (err) {
      setError("Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing("create");
    try {
      const response = await fetch(CREATE_USER_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData?.error || "Failed to create user");
        return;
      }

      toast.success("User created successfully");
      setShowCreateDialog(false);
      fetchUsers();

      // Reset form
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "user" as UserRole,
      });
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error("Failed to create user");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing("edit");
    try {
      // Update Firestore document using the user's id (which is their auth UID)
      await updateDoc(doc(db, "users", selectedUser.id), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        role: formData.role,
      });

      toast.success("User updated successfully");
      setShowEditDialog(false);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("Failed to update user");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsProcessing("delete");
    try {
      // 1. Delete from Firebase Auth via Cloud Function
      const authResponse = await fetch(DELETE_USER_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: selectedUser.id }),
      });
      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}));
        const errorMsg = errorData?.error || "Failed to delete user from Auth.";
        toast.error(errorMsg);
        setIsProcessing(null);
        setSelectedUser(null);
        return;
      }

      // 2. Delete from Firestore using the user's id (which is their auth UID)
      await deleteDoc(doc(db, "users", selectedUser.id));

      toast.success("User deleted successfully");
      setShowDeleteDialog(false);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Failed to delete user");
    } finally {
      setIsProcessing(null);
      setSelectedUser(null);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const openCreateDialog = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "user" as UserRole,
    });
    setShowCreateDialog(true);
  };

  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setResetPasswordValue("");
    setShowResetPasswordDialog(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !resetPasswordValue) {
      toast.error("Please enter a new password.");
      return;
    }
    setResetPasswordLoading(true);
    try {
      const response = await fetch(RESET_PASSWORD_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: selectedUser.id, newPassword: resetPasswordValue }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Reset password error:", errorData);
        if (errorData?.error?.includes("user record corresponding to the provided identifier") || errorData?.code === "auth/user-not-found") {
          toast.error("User does not exist in Firebase Auth. Please remove this user from the database or re-create them in Auth.");
        } else {
          toast.error(errorData?.error || "Failed to reset password.");
        }
      } else {
        toast.success("Password reset successfully.");
        setShowResetPasswordDialog(false);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      toast.error("Failed to reset password");
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Helper: get user objects for selected IDs on current page
  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
  const allCurrentPageSelected = users.length > 0 && users.every((u) => selectedUserIds.includes(u.id));
  const someCurrentPageSelected = users.some((u) => selectedUserIds.includes(u.id));

  const handleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedUserIds(selectedUserIds.filter((id) => !users.some((u) => u.id === id)));
    } else {
      setSelectedUserIds([...selectedUserIds, ...users.filter((u) => !selectedUserIds.includes(u.id)).map((u) => u.id)]);
    }
  };

  const handleSelectUser = (id: string) => {
    setSelectedUserIds(selectedUserIds.includes(id) ? selectedUserIds.filter((uid) => uid !== id) : [...selectedUserIds, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This cannot be undone.`)) return;
    setBulkActionLoading(true);
    for (const user of selectedUsers) {
      try {
        // Delete from Auth first
        const authResponse = await fetch(DELETE_USER_FUNCTION_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.id }),
        });
        if (!authResponse.ok) {
          const errorData = await authResponse.json().catch(() => ({}));
          toast.error(`Failed to delete ${user.email} from Auth: ${errorData?.error || "Unknown error"}`);
          continue;
        }
        // Delete from Firestore
        await deleteDoc(doc(db, "users", user.id));
        toast.success(`Deleted ${user.email}`);
      } catch (err) {
        toast.error(`Failed to delete ${user.email}`);
      }
    }
    setBulkActionLoading(false);
    setSelectedUserIds([]);
    fetchUsers();
  };

  const handleBulkResetPassword = async () => {
    if (selectedUsers.length === 0 || !bulkResetPasswordValue) return;
    setBulkActionLoading(true);
    for (const user of selectedUsers) {
      try {
        const response = await fetch(RESET_PASSWORD_FUNCTION_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.id, newPassword: bulkResetPasswordValue }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Bulk reset password error for ${user.email}:`, errorData);
          if (errorData?.error?.includes("user record corresponding to the provided identifier") || errorData?.code === "auth/user-not-found") {
            toast.error(`User ${user.email} does not exist in Firebase Auth. Please remove this user from the database or re-create them in Auth.`);
          } else {
            toast.error(`Failed to reset password for ${user.email}: ${errorData?.error || "Unknown error"}`);
          }
          continue;
        }
        toast.success(`Password reset for ${user.email}`);
      } catch (err) {
        console.error(`Error resetting password for ${user.email}:`, err);
        toast.error(`Failed to reset password for ${user.email}`);
      }
    }
    setBulkActionLoading(false);
    setShowBulkResetDialog(false);
    setBulkResetPasswordValue("");
    setSelectedUserIds([]);
  };

  const content = () => {
    if (!isSuperAdmin) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>Only super admins can access this page.</AlertDescription>
        </Alert>
      );
    }

    const filteredUsers = users.filter((user) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = user.displayName.toLowerCase().includes(term) || user.email.toLowerCase().includes(term) || user.role.toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
      <>
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
          <div className="flex-1">
            <Label htmlFor="user-search">Search</Label>
            <Input id="user-search" type="text" placeholder="Search by name, email, or role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full" />
          </div>
          <div className="w-48">
            <Label htmlFor="role-filter">Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger id="role-filter" className="w-full">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mb-4">
          <Button onClick={() => setShowImportDialog(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Users
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>

        {selectedUserIds.length > 0 && (
          <div className="flex gap-2 mb-2">
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkActionLoading}>
              {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Selected
            </Button>
            <Button variant="outline" onClick={() => setShowBulkResetDialog(true)} disabled={bulkActionLoading}>
              {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset Passwords
            </Button>
            <Button variant="ghost" onClick={() => setSelectedUserIds([])} disabled={bulkActionLoading}>
              Deselect All
            </Button>
          </div>
        )}

        <div className="rounded-md border border-[#333] bg-[#111]">
          <Table>
            <TableHeader>
              <TableRow className="border-b-[#333]">
                <TableHead>
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allCurrentPageSelected && someCurrentPageSelected;
                    }}
                    onChange={handleSelectAll}
                    aria-label="Select all users on page"
                  />
                </TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">First Name</TableHead>
                <TableHead className="text-white">Last Name</TableHead>
                <TableHead className="text-white">Display Name</TableHead>
                <TableHead className="text-white">Role</TableHead>
                <TableHead className="text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-[#666]">
                    <Loader2 className="h-6 w-6 animate-spin inline-block" /> Loading users...
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="border-b-[#333]">
                    <TableCell>
                      <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => handleSelectUser(user.id)} aria-label={`Select user ${user.email}`} />
                    </TableCell>
                    <TableCell className="font-medium text-[#ccc]">{user.email}</TableCell>
                    <TableCell className="text-[#ccc]">{user.firstName || "-"}</TableCell>
                    <TableCell className="text-[#ccc]">{user.lastName || "-"}</TableCell>
                    <TableCell className="text-[#ccc]">{user.displayName || "-"}</TableCell>
                    <TableCell className="text-[#ccc]">{user.role}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                            <Key className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-[#666]">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        </div>

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  First Name
                </Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  Last Name
                </Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={isProcessing === "create"}>
                {isProcessing === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" value={formData.email} disabled className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  First Name
                </Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  Last Name
                </Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser} disabled={isProcessing === "edit"}>
                {isProcessing === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>Are you sure you want to delete {selectedUser?.displayName}? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={isProcessing === "delete"}>
                {isProcessing === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>Enter a new password for {selectedUser?.displayName || selectedUser?.email}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reset-password" className="text-right">
                  New Password
                </Label>
                <Input id="reset-password" type="password" value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={resetPasswordLoading}>
                {resetPasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Reset Password Dialog */}
        <Dialog open={showBulkResetDialog} onOpenChange={setShowBulkResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Passwords</DialogTitle>
              <DialogDescription>Enter a new password for {selectedUsers.length} selected users.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bulk-reset-password" className="text-right">
                  New Password
                </Label>
                <Input id="bulk-reset-password" type="password" value={bulkResetPasswordValue} onChange={(e) => setBulkResetPasswordValue(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkResetDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkResetPassword} disabled={bulkActionLoading || !bulkResetPasswordValue}>
                {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reset Passwords
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  return (
    <AdminLayout title="User Management" subtitle="Manage user roles and permissions" breadcrumbs={[{ label: "Users", href: "/admin/users" }]}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {content()}

      <ImportUsersDialog open={showImportDialog} onOpenChange={setShowImportDialog} onSuccess={fetchUsers} />
    </AdminLayout>
  );
};

export default Users;
