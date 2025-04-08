import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getCostumeCategories, createCostumeCategory, updateCostumeCategory, deleteCostumeCategory, getCostumes } from "@/lib/firebase";
import { CostumeCategory } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, Edit, PlusCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

const AdminCostumeCategories = () => {
  const [categories, setCategories] = useState<CostumeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for Add/Edit Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<CostumeCategory> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // State for Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CostumeCategory | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const categoriesData = await getCostumeCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories. Please try again.");
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (category: Partial<CostumeCategory> | null = null) => {
    if (category) {
      setCurrentCategory(category);
      setIsEditing(true);
    } else {
      setCurrentCategory({ name: "", tag: "", description: "" });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!currentCategory || !currentCategory.name) {
      toast.error("Name is required.");
      return;
    }

    const generatedTag = currentCategory.name.trim().toLowerCase().replace(/\s+/g, "");
    if (!generatedTag) {
      toast.error("Cannot generate a valid tag from the provided name.");
      return;
    }

    const categoryData = {
      ...currentCategory,
      tag: generatedTag,
    };

    setIsProcessing(categoryData.id || "new");
    try {
      if (isEditing && categoryData.id) {
        await updateCostumeCategory(categoryData.id, categoryData as CostumeCategory);
        toast.success(`Category "${categoryData.name}" updated successfully.`);
      } else {
        const existingCategories = await getCostumeCategories();
        if (existingCategories.some((cat) => cat.tag === generatedTag)) {
          toast.error(`A category with the tag "${generatedTag}" already exists. Please choose a different name.`);
          setIsProcessing(null);
          return;
        }
        await createCostumeCategory(categoryData as Omit<CostumeCategory, "id" | "createdAt">);
        toast.success(`Category "${categoryData.name}" created successfully.`);
      }
      setDialogOpen(false);
      setCurrentCategory(null);
      fetchData();
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error("Failed to save category.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleOpenDeleteDialog = (category: CostumeCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsProcessing(categoryToDelete.id);
    try {
      const costumes = await getCostumes();
      const isCategoryInUse = costumes.some((costume) => costume.category === categoryToDelete.tag);

      if (isCategoryInUse) {
        toast.error(`Cannot delete category "${categoryToDelete.name}" because it is currently assigned to one or more costumes.`);
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
        return;
      }

      await deleteCostumeCategory(categoryToDelete.id);
      toast.success(`Category "${categoryToDelete.name}" deleted successfully.`);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error("Failed to delete category.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <AdminLayout title="Manage Costume Categories" subtitle="Add, edit, or remove categories for costume voting." breadcrumbs={[{ label: "Costume Categories", href: "/admin/costume-categories" }]}>
      <div className="flex justify-end mb-4">
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Category
        </Button>
      </div>

      <div className="rounded-md border border-[#333] bg-[#111]">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[#333]">
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Tag</TableHead>
              <TableHead className="text-white">Description</TableHead>
              <TableHead className="text-white">Created</TableHead>
              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-[#666]">
                  <Loader2 className="h-6 w-6 animate-spin inline-block" /> Loading categories...
                </TableCell>
              </TableRow>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <TableRow key={category.id} className="border-b-[#333]">
                  <TableCell className="font-medium text-[#ccc]">{category.name}</TableCell>
                  <TableCell className="text-[#ccc]">{category.tag}</TableCell>
                  <TableCell className="text-[#ccc]">{category.description}</TableCell>
                  <TableCell className="text-[#ccc]">{category.createdAt ? format(category.createdAt, "PPpp") : "N/A"}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(category)} disabled={isProcessing === category.id} className="text-red-600">
                          {isProcessing === category.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-[#666]">
                  No categories found. Click "Add New Category" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>{isEditing ? "Update the details for this category." : "Create a new category for costume voting."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={currentCategory?.name || ""}
                onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                className="col-span-3"
                disabled={isProcessing === (currentCategory?.id || "new")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={currentCategory?.description || ""}
                onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                className="col-span-3"
                disabled={isProcessing === (currentCategory?.id || "new")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isProcessing === (currentCategory?.id || "new")}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={isProcessing === (currentCategory?.id || "new")}>
              {isProcessing === (currentCategory?.id || "new") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the category '{categoryToDelete?.name}'. Make sure no costumes are currently assigned to this category.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isProcessing === categoryToDelete?.id}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={isProcessing === categoryToDelete?.id}>
              {isProcessing === categoryToDelete?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCostumeCategories;
