import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getCostumes, getCostumeCategories, deleteCostume, updateCostume, type Costume, getVotingWindow } from "@/lib/firebase";
import { CostumeCategory, VotingWindow } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, RotateCcw, Edit, Loader2, Clock } from "lucide-react";
import { format, isValid, parse, parseISO } from "date-fns";
import { doc, updateDoc, serverTimestamp, Timestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => format(new Date(), "yyyy-MM-dd");

// Helper function to format date and time for display
const formatDateTime = (date: Date): string => {
  return format(date, "MMMM d, yyyy 'at' h:mm a");
};

// Helper function to combine date and time strings into a Date object
const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
  // Parse the date string to ensure consistent handling
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Create a new date with the exact components to avoid timezone issues
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return date;
};

// Helper function to format date for input control
const formatDateForInput = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

// Helper function to format time for input control
const formatTimeForInput = (date: Date): string => {
  return format(date, "HH:mm");
};

const AdminCostumes = () => {
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [categories, setCategories] = useState<CostumeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costumeToDelete, setCostumeToDelete] = useState<Costume | null>(null);

  const [editCategoriesDialogOpen, setEditCategoriesDialogOpen] = useState(false);
  const [costumeToEditCategories, setCostumeToEditCategories] = useState<Costume | null>(null);
  const [editedCategories, setEditedCategories] = useState<string[]>([]);

  // Voting window state with separate date and time
  const [votingWindow, setVotingWindow] = useState<VotingWindow>({
    startDate: getTodayDate(),
    startTime: "19:00",
    endDate: getTodayDate(),
    endTime: "19:45",
    message: "Voting will open at {time}",
  });
  const [isEditingVotingWindow, setIsEditingVotingWindow] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [costumesData, categoriesData, votingWindowData] = await Promise.all([getCostumes(), getCostumeCategories(), getVotingWindow()]);
      setCostumes(costumesData);
      setCategories(categoriesData);

      if (votingWindowData) {
        if (votingWindowData.startDateTime && votingWindowData.endDateTime) {
          // Convert Firebase Timestamp to local Date
          const startDateTime = votingWindowData.startDateTime.toDate();
          const endDateTime = votingWindowData.endDateTime.toDate();

          setVotingWindow({
            startDate: format(startDateTime, "yyyy-MM-dd"),
            startTime: format(startDateTime, "HH:mm"),
            endDate: format(endDateTime, "yyyy-MM-dd"),
            endTime: format(endDateTime, "HH:mm"),
            message: votingWindowData.message,
          });
        } else if (votingWindowData.startTime && votingWindowData.endTime) {
          // Old format with just times
          const today = getTodayDate();
          setVotingWindow({
            startDate: today,
            startTime: votingWindowData.startTime,
            endDate: today,
            endTime: votingWindowData.endTime,
            message: votingWindowData.message,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add an effect to ensure consistent date/time display
  useEffect(() => {
    if (votingWindow.startDate && votingWindow.startTime) {
      const startDateTime = combineDateAndTime(votingWindow.startDate, votingWindow.startTime);
      const endDateTime = combineDateAndTime(votingWindow.endDate, votingWindow.endTime);

      setVotingWindow((prev) => ({
        ...prev,
        startDate: formatDateForInput(startDateTime),
        startTime: formatTimeForInput(startDateTime),
        endDate: formatDateForInput(endDateTime),
        endTime: formatTimeForInput(endDateTime),
      }));
    }
  }, []);

  const handleDelete = async () => {
    if (!costumeToDelete) return;
    setIsProcessing(`delete_${costumeToDelete.id}`);
    try {
      await deleteCostume(costumeToDelete.id);
      toast.success(`Costume "${costumeToDelete.characterName}" deleted successfully.`);
      setCostumeToDelete(null);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error("Error deleting costume:", err);
      toast.error("Failed to delete costume.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleResetVotes = async (costume: Costume) => {
    setIsProcessing(`reset_${costume.id}`);
    try {
      const resetVotes: { [key: string]: number } = {};
      categories.forEach((cat) => {
        resetVotes[cat.tag] = 0;
      });
      await updateCostume(costume.id, { votes: resetVotes });
      toast.success(`Votes reset for "${costume.characterName}".`);
      fetchData();
    } catch (err) {
      console.error("Error resetting votes:", err);
      toast.error("Failed to reset votes.");
    } finally {
      setIsProcessing(null);
    }
  };

  const openDeleteDialog = (costume: Costume) => {
    setCostumeToDelete(costume);
    setDeleteDialogOpen(true);
  };

  const handleOpenEditCategoriesDialog = (costume: Costume) => {
    setCostumeToEditCategories(costume);
    setEditedCategories(costume.categories || []);
    setEditCategoriesDialogOpen(true);
  };

  const handleCategoryToggle = (categoryTag: string) => {
    setEditedCategories((prev) => {
      if (prev.includes(categoryTag)) {
        return prev.filter((tag) => tag !== categoryTag);
      }
      return [...prev, categoryTag];
    });
  };

  const handleSaveEditedCategories = async () => {
    if (!costumeToEditCategories) return;
    if (editedCategories.length === 0) {
      toast.error("Costume must belong to at least one category.");
      return;
    }

    setIsProcessing(`edit_cat_${costumeToEditCategories.id}`);
    try {
      const newVotes: { [key: string]: number } = {};
      editedCategories.forEach((catTag) => {
        newVotes[catTag] = costumeToEditCategories.votes?.[catTag] || 0;
      });

      await updateCostume(costumeToEditCategories.id, {
        categories: editedCategories,
        votes: newVotes,
      });
      toast.success(`Categories updated for "${costumeToEditCategories.characterName}".`);
      setEditCategoriesDialogOpen(false);
      setCostumeToEditCategories(null);
      fetchData();
    } catch (err) {
      console.error("Error updating categories:", err);
      toast.error("Failed to update categories.");
    } finally {
      setIsProcessing(null);
    }
  };

  const getCategoryName = (tag: string) => {
    return categories.find((cat) => cat.tag === tag)?.name || tag;
  };

  const handleSaveVotingWindow = async () => {
    try {
      const startDateTime = combineDateAndTime(votingWindow.startDate, votingWindow.startTime);
      const endDateTime = combineDateAndTime(votingWindow.endDate, votingWindow.endTime);

      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        toast.error("End time must be after start time");
        return;
      }

      // Create Firebase Timestamps from the dates
      const startTimestamp = Timestamp.fromDate(startDateTime);
      const endTimestamp = Timestamp.fromDate(endDateTime);

      const votingWindowRef = doc(db, "config", "votingWindow");
      await setDoc(votingWindowRef, {
        startDateTime: startTimestamp,
        endDateTime: endTimestamp,
        message: votingWindow.message,
        updatedAt: serverTimestamp(),
      });

      // Update the local state with the exact same dates we're saving
      setVotingWindow((prev) => ({
        ...prev,
        startDate: formatDateForInput(startDateTime),
        startTime: formatTimeForInput(startDateTime),
        endDate: formatDateForInput(endDateTime),
        endTime: formatTimeForInput(endDateTime),
      }));

      toast.success("Voting window updated successfully");
      setIsEditingVotingWindow(false);
    } catch (err) {
      console.error("Error updating voting window:", err);
      toast.error("Failed to update voting window");
    }
  };

  return (
    <AdminLayout title="Manage Costumes" subtitle="View, delete costumes, and manage votes." breadcrumbs={[{ label: "Costumes", href: "/admin/costumes" }]}>
      <div className="mb-6 p-4 bg-[#222] rounded-md border border-[#333]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#ccc]" />
            <h3 className="text-lg font-semibold text-[#ccc]">Voting Window</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditingVotingWindow(true)}>
            Edit Window
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[#666]">Start</p>
            <p className="text-[#ccc]">{formatDateTime(combineDateAndTime(votingWindow.startDate, votingWindow.startTime))}</p>
          </div>
          <div>
            <p className="text-[#666]">End</p>
            <p className="text-[#ccc]">{formatDateTime(combineDateAndTime(votingWindow.endDate, votingWindow.endTime))}</p>
          </div>
          <div>
            <p className="text-[#666]">Message</p>
            <p className="text-[#ccc]">{votingWindow.message}</p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-[#333] bg-[#111]">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[#333]">
              <TableHead className="w-[100px] text-white">Image</TableHead>
              <TableHead className="text-white">Character Name</TableHead>
              <TableHead className="text-white">Categories</TableHead>
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
                const createdAtDate = costume.createdAt;
                const formattedDate = createdAtDate && isValid(createdAtDate) ? format(createdAtDate, "PPpp") : "N/A";
                const isResetting = isProcessing === `reset_${costume.id}`;
                const isDeleting = isProcessing === `delete_${costume.id}`;
                const isEditingCat = isProcessing === `edit_cat_${costume.id}`;
                const currentProcessing = isResetting || isDeleting || isEditingCat;

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
                    <TableCell className="text-[#ccc]">{(costume.categories || []).map((tag) => getCategoryName(tag)).join(", ") || <span className="text-xs text-[#666]">None</span>}</TableCell>
                    <TableCell className="text-[#ccc]">{costume.submitterName}</TableCell>
                    <TableCell className="text-[#ccc]">{formattedDate}</TableCell>
                    <TableCell className="text-[#ccc]">
                      {costume.categories && costume.categories.length > 0 ? (
                        Object.entries(costume.votes || {})
                          .filter(([tag]) => costume.categories!.includes(tag))
                          .map(([tag, count]) => (
                            <div key={tag} className="text-xs">
                              {getCategoryName(tag)}: {count}
                            </div>
                          ))
                      ) : (
                        <span className="text-xs text-[#666]">N/A</span>
                      )}
                      {costume.categories && costume.categories.length > 0 && Object.keys(costume.votes || {}).length === 0 && <span className="text-xs text-[#666]">No votes yet</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={currentProcessing}>
                            {currentProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenEditCategoriesDialog(costume)} disabled={isEditingCat}>
                            {isEditingCat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />} Edit Categories
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetVotes(costume)} disabled={isResetting}>
                            {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />} Reset Votes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteDialog(costume)} disabled={isDeleting} className="text-red-600">
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete Costume
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the costume "{costumeToDelete?.characterName}" and all associated votes.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isProcessing === `delete_${costumeToDelete?.id}`}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing === `delete_${costumeToDelete?.id}`}>
              {isProcessing === `delete_${costumeToDelete?.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editCategoriesDialogOpen} onOpenChange={setEditCategoriesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Categories for "{costumeToEditCategories?.characterName}"</DialogTitle>
            <DialogDescription>Select the categories this costume should belong to.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label>Available Categories</Label>
            <div className="grid gap-2 max-h-60 overflow-y-auto pr-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`edit-cat-${category.id}`}
                    checked={editedCategories.includes(category.tag)}
                    onCheckedChange={() => handleCategoryToggle(category.tag)}
                    disabled={isProcessing === `edit_cat_${costumeToEditCategories?.id}`}
                  />
                  <Label htmlFor={`edit-cat-${category.id}`} className="font-normal flex flex-col">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">({category.tag})</span>
                  </Label>
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-muted-foreground text-center">No categories defined yet.</p>}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Selected: {editedCategories.length}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategoriesDialogOpen(false)} disabled={isProcessing === `edit_cat_${costumeToEditCategories?.id}`}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedCategories} disabled={isProcessing === `edit_cat_${costumeToEditCategories?.id}` || editedCategories.length === 0}>
              {isProcessing === `edit_cat_${costumeToEditCategories?.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Categories
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingVotingWindow} onOpenChange={setIsEditingVotingWindow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Voting Window</DialogTitle>
            <DialogDescription>Configure when voting is allowed and the message shown when voting is closed.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Start Date and Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="date"
                    value={votingWindow.startDate}
                    onChange={(e) => {
                      setVotingWindow((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }));
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    value={votingWindow.startTime}
                    onChange={(e) => {
                      setVotingWindow((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }));
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>End Date and Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="date"
                    value={votingWindow.endDate}
                    onChange={(e) => {
                      setVotingWindow((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }));
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    value={votingWindow.endTime}
                    onChange={(e) => {
                      setVotingWindow((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }));
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message (use {"{time}"} for the start time)</Label>
              <Input id="message" value={votingWindow.message} onChange={(e) => setVotingWindow((prev) => ({ ...prev, message: e.target.value }))} placeholder="Voting will open at {time}" />
            </div>
            <div className="rounded-md bg-secondary p-4">
              <p className="text-sm font-medium mb-2">Summary</p>
              <p className="text-sm text-muted-foreground">
                Voting will be open from {format(combineDateAndTime(votingWindow.startDate, votingWindow.startTime), "MMMM d, yyyy 'at' h:mm a")} until{" "}
                {format(combineDateAndTime(votingWindow.endDate, votingWindow.endTime), "h:mm a")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingVotingWindow(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVotingWindow}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCostumes;
