import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { createCostume, uploadFile, getDoc, doc, db } from "@/lib/firebase";
import { CostumeCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { serverTimestamp, setDoc } from "firebase/firestore";

interface UserCostumeSubmissionProps {
  categories: CostumeCategory[];
  onSuccess?: () => void;
}

export default function UserCostumeSubmission({ categories, onSuccess }: UserCostumeSubmissionProps) {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrCreateUserProfile = async () => {
      if (!currentUser?.id) return;

      try {
        const userRef = doc(db, "users", currentUser.id);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // Create user document if it doesn't exist
          await setDoc(userRef, {
            displayName: currentUser.displayName || "",
            email: currentUser.email,
            role: "participant",
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            gamesParticipated: 0,
          });
          setUserDisplayName(currentUser.displayName || null);
        } else {
          const userData = userDoc.data();
          setUserDisplayName(userData.displayName || null);
        }
      } catch (error) {
        console.error("Error with user profile:", error);
        toast.error("Error loading user profile");
      }
    };

    fetchOrCreateUserProfile();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      toast.error("Please sign in to submit a costume");
      return;
    }

    if (!file || !characterName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      // Sanitize file name to prevent path traversal and invalid characters
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `costumes/${currentUser.id}/${Date.now()}-${safeFileName}`;
      const photoUrl = await uploadFile(file, path);

      // Get all category tags
      const allCategoryTags = categories.map((category) => category.tag);

      // Get or create user document
      const userRef = doc(db, "users", currentUser.id);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          displayName: currentUser.displayName || "",
          email: currentUser.email,
          role: "participant",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          gamesParticipated: 0,
        });
      }

      await createCostume({
        characterName: characterName.trim(),
        photoUrl,
        submittedBy: currentUser.id,
        submitterName: currentUser.displayName || currentUser.email || "Anonymous",
        categories: allCategoryTags,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (e.g., 5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="costumePhoto">Costume Photo</Label>
        <Input id="costumePhoto" type="file" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
        <p className="text-xs text-muted-foreground">Maximum file size: 5MB. Supported formats: JPG, PNG, GIF</p>
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
