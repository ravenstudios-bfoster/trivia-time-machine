import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { updateCostume, uploadFile } from "@/lib/firebase";
import { Costume } from "@/types";
import { toast } from "sonner";

interface CostumeEditFormProps {
  costume: Costume;
  onClose: () => void;
  onUpdate: () => void;
}

const CostumeEditForm = ({ costume, onClose, onUpdate }: CostumeEditFormProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    characterName: costume.characterName,
    category: costume.category,
  });

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
        characterName: formData.characterName,
        category: formData.category,
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
            <Input id="characterName" value={formData.characterName} onChange={(e) => setFormData({ ...formData, characterName: e.target.value })} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as "bestOverall" | "mostCreative" })}
              className="w-full p-2 border rounded-md"
              required
              aria-label="Select costume category"
            >
              <option value="bestOverall">Best Overall</option>
              <option value="mostCreative">Most Creative</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Costume"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CostumeEditForm;
