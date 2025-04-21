import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createCostume, uploadFile } from "@/lib/firebase";
import { CostumeCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UserCostumeSubmissionProps {
  categories: CostumeCategory[];
  onSuccess?: () => void;
}

export default function UserCostumeSubmission({ categories, onSuccess }: UserCostumeSubmissionProps) {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [characterName, setCharacterName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please sign in to submit a costume");
      return;
    }

    if (!file || !characterName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      const path = `costumes/${currentUser.uid}/${Date.now()}-${file.name}`;
      const photoUrl = await uploadFile(file, path);

      // Get all category tags
      const allCategoryTags = categories.map((category) => category.tag);

      await createCostume({
        characterName: characterName.trim(),
        photoUrl,
        submittedBy: currentUser.uid,
        submitterName: currentUser.email || "Anonymous",
        categories: allCategoryTags, // Include all categories
      });

      toast.success("Costume submitted successfully!");
      setFile(null);
      setCharacterName("");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting costume:", error);
      toast.error("Failed to submit costume");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="costumePhoto">Costume Photo</Label>
        <Input id="costumePhoto" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="characterName">Character Name</Label>
        <Input id="characterName" value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="Enter character name" disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <Label>Categories</Label>
        <p className="text-sm text-muted-foreground">Your costume will be entered in all categories:</p>
        <div className="grid gap-2">
          {categories.map((category) => (
            <div key={category.id} className="text-sm">
              <span className="font-medium">{category.name}</span>
              <p className="text-xs text-muted-foreground">{category.description}</p>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Submitting..." : "Submit Costume"}
      </Button>
    </form>
  );
}
