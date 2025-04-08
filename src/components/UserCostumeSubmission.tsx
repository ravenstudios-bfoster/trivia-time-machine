import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createCostume, uploadFile } from "@/lib/firebase";
import { CostumeCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleCategoryToggle = (categoryTag: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryTag)) {
        return prev.filter((tag) => tag !== categoryTag);
      }
      if (prev.length >= 3) {
        toast.error("You can only select up to 3 categories");
        return prev;
      }
      return [...prev, categoryTag];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please sign in to submit a costume");
      return;
    }

    if (!file || !characterName.trim() || selectedCategories.length === 0) {
      toast.error("Please fill in all fields and select at least one category");
      return;
    }

    try {
      setIsLoading(true);

      const path = `costumes/${currentUser.uid}/${Date.now()}-${file.name}`;
      const photoUrl = await uploadFile(file, path);

      await createCostume({
        characterName: characterName.trim(),
        photoUrl,
        submittedBy: currentUser.uid,
        submitterName: currentUser.email || "Anonymous",
        categories: selectedCategories,
      });

      toast.success("Costume submitted successfully!");
      setFile(null);
      setCharacterName("");
      setSelectedCategories([]);
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
        <Label>Categories (Select 1-3)</Label>
        <div className="grid gap-4 pt-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-3">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.tag)}
                onCheckedChange={() => handleCategoryToggle(category.tag)}
                disabled={isLoading || (!selectedCategories.includes(category.tag) && selectedCategories.length >= 3)}
              />
              <Label htmlFor={category.id} className="font-normal">
                <span className="font-medium">{category.name}</span>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </Label>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">Selected categories: {selectedCategories.length}/3</p>
      </div>

      <Button type="submit" disabled={isLoading || selectedCategories.length === 0} className="w-full">
        {isLoading ? "Submitting..." : "Submit Costume"}
      </Button>
    </form>
  );
}
