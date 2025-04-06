import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { createCostume, uploadFile } from "@/lib/firebase";
import { toast } from "sonner";

const StaffUploadForm = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    characterName: "",
    submittedBy: "",
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
    if (!currentUser || !fileInputRef.current?.files?.[0]) return;

    setIsLoading(true);
    try {
      // Upload image to Firebase Storage
      const file = fileInputRef.current.files[0];
      const storagePath = `costumes/${Date.now()}-${file.name}`;
      const photoUrl = await uploadFile(file, storagePath);

      // Create costume record
      await createCostume({
        photoUrl,
        characterName: formData.characterName,
        submittedBy: formData.submittedBy || "Anonymous",
      });

      // Reset form
      setFormData({ characterName: "", submittedBy: "" });
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Costume submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit costume");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser?.isAdmin) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Submit New Costume</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo">Costume Photo</Label>
            <Input id="photo" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} required />
            {previewUrl && (
              <div className="mt-2">
                <img src={previewUrl} alt="Preview" className="max-h-48 w-auto rounded-md" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="characterName">Character Name</Label>
            <Input id="characterName" value={formData.characterName} onChange={(e) => setFormData({ ...formData, characterName: e.target.value })} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submittedBy">Submitted By (Optional)</Label>
            <Input id="submittedBy" value={formData.submittedBy} onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })} placeholder="Anonymous" />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Costume"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StaffUploadForm;
