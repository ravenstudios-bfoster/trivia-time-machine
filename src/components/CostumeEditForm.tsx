import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { updateCostume, uploadFile, deleteCostume } from "@/lib/firebase";
import { Costume } from "@/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface CostumeEditFormProps {
  costume: Costume;
  onClose: () => void;
  onUpdate: () => void;
}

const CostumeEditForm = ({ costume, onClose, onUpdate }: CostumeEditFormProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [characterName, setCharacterName] = useState(costume.characterName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.uid !== costume.submittedBy) return;

    setIsLoading(true);
    try {
      const updates: Partial<Costume> = {
        characterName: characterName.trim(),
      };

      // If a new photo was uploaded, handle that first
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const storagePath = `costumes/${currentUser.uid}/${Date.now()}-${file.name}`;
        const photoUrl = await uploadFile(file, storagePath);
        updates.photoUrl = photoUrl;
      }

      await updateCostume(costume.id, updates);
      onUpdate();
      onClose();
      toast.success("Costume updated successfully!");
    } catch (error) {
      toast.error("Failed to update costume");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || currentUser.uid !== costume.submittedBy) return;

    setIsDeleting(true);
    try {
      await deleteCostume(costume.id);
      onUpdate();
      onClose();
      toast.success("Costume deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete costume");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentUser || currentUser.uid !== costume.submittedBy) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Edit Costume</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo">Update Photo (Optional)</Label>
            <Input id="photo" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
            {previewUrl && (
              <div className="mt-2">
                <img src={previewUrl} alt="Preview" className="max-h-48 w-auto rounded-md" />
              </div>
            )}
            {!previewUrl && (
              <div className="mt-2">
                <img src={costume.photoUrl} alt="Current" className="max-h-48 w-auto rounded-md" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="characterName">Character Name</Label>
            <Input id="characterName" value={characterName} onChange={(e) => setCharacterName(e.target.value)} required />
          </div>

          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || isDeleting}>
                {isLoading ? "Updating..." : "Update Costume"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isDeleting}>
                Cancel
              </Button>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={isLoading || isDeleting}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete your costume entry. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CostumeEditForm;
