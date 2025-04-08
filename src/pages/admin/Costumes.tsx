import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getCostumes, getCostumeCategories, deleteCostume, updateCostume, type Costume, type CostumeCategory } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { format, isValid } from "date-fns";

const AdminCostumes = () => {
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [categories, setCategories] = useState<CostumeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Track processing state for delete/reset
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [costumeToDelete, setCostumeToDelete] = useState<Costume | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [costumesData, categoriesData] = await Promise.all([getCostumes(), getCostumeCategories()]);
      setCostumes(costumesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching costumes:", err);
      setError("Failed to load costumes. Please try again.");
      toast.error("Failed to load costumes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!costumeToDelete) return;
    setIsProcessing(costumeToDelete.id); // Set processing state
    try {
      await deleteCostume(costumeToDelete.id);
      toast.success(`Costume "${costumeToDelete.characterName}" deleted successfully.`);
      setCostumeToDelete(null);
      setDialogOpen(false);
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error deleting costume:", err);
      toast.error("Failed to delete costume.");
    } finally {
      setIsProcessing(null); // Clear processing state
    }
  };

  const handleResetVotes = async (costume: Costume) => {
    setIsProcessing(costume.id); // Set processing state
    try {
      const resetVotes: { [key: string]: number } = {};
      categories.forEach((cat) => {
        resetVotes[cat.tag] = 0;
      });
      await updateCostume(costume.id, { votes: resetVotes });
      toast.success(`Votes reset for "${costume.characterName}".`);
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error resetting votes:", err);
      toast.error("Failed to reset votes.");
    } finally {
      setIsProcessing(null); // Clear processing state
    }
  };

  const openDeleteDialog = (costume: Costume) => {
    setCostumeToDelete(costume);
    setDialogOpen(true);
  };

  const getCategoryName = (tag: string) => {
    return categories.find((cat) => cat.tag === tag)?.name || tag;
  };

  return (
    <AdminLayout title="Manage Costumes" subtitle="View, edit, delete costumes, and manage votes." breadcrumbs={[{ label: "Costumes", href: "/admin/costumes" }]}>
      <div className="rounded-md border border-[#333] bg-[#111]">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[#333]">
              <TableHead className="w-[100px] text-white">Image</TableHead>
              <TableHead className="text-white">Character Name</TableHead>
              <TableHead className="text-white">Category</TableHead>
              <TableHead className="text-white">Submitter</TableHead>
              <TableHead className="text-white">Created</TableHead>
              <TableHead className="text-white">Votes</TableHead>
              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-[#666]">
                  <Loader2 className="h-6 w-6 animate-spin inline-block" /> Loading costumes...
                </TableCell>
              </TableRow>
            ) : costumes.length > 0 ? (
              costumes.map((costume) => {
                const formattedDate = costume.createdAt && isValid(costume.createdAt) ? format(costume.createdAt, "PPpp") : "N/A";

                return (
                  <TableRow key={costume.id} className="border-b-[#333]">
                    <TableCell>
                      {costume.photoUrl ? (
                        <img src={costume.photoUrl} alt={costume.characterName} className="h-10 w-10 object-cover rounded-sm" />
                      ) : (
                        <div className="h-10 w-10 bg-[#222] rounded-sm flex items-center justify-center text-[#666] text-xs">No Img</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-[#ccc]">{costume.characterName}</TableCell>
                    <TableCell className="text-[#ccc]">{getCategoryName(costume.category)}</TableCell>
                    <TableCell className="text-[#ccc]">{costume.submitterName}</TableCell>
                    <TableCell className="text-[#ccc]">{formattedDate}</TableCell>
                    <TableCell className="text-[#ccc]">
                      {Object.entries(costume.votes || {}).map(([tag, count]) => (
                        <div key={tag} className="text-xs">
                          {getCategoryName(tag)}: {count}
                        </div>
                      ))}
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => handleResetVotes(costume)} disabled={isProcessing === costume.id}>
                            {isProcessing === costume.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />} Reset Votes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteDialog(costume)} disabled={isProcessing === costume.id} className="text-red-600">
                            {isProcessing === costume.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete Costume
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-[#666]">
                  No costumes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the costume "{costumeToDelete?.characterName}" ({getCategoryName(costumeToDelete?.category || "")}) and all associated votes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isProcessing === costumeToDelete?.id}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing === costumeToDelete?.id}>
              {isProcessing === costumeToDelete?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCostumes;
