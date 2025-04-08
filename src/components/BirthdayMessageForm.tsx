import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { submitBirthdayMessage } from "@/functions/birthdayMessages";

const BirthdayMessageForm = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit
        toast({
          title: "File too large",
          description: "Please upload a video under 100MB",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a video file",
          variant: "destructive",
        });
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !videoFile) {
      toast({
        title: "Missing required fields",
        description: "Please provide your name and a video message",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitBirthdayMessage(name, message, videoFile);

      toast({
        title: "Success!",
        description: "Your birthday message has been submitted for review",
      });

      // Reset form
      setName("");
      setMessage("");
      setVideoFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Your Name *
        </label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter your name" />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          Message (optional)
        </label>
        <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a message to go with your video" />
      </div>

      <div>
        <label htmlFor="video" className="block text-sm font-medium mb-1">
          Video Message *
        </label>
        <Input id="video" type="file" accept="video/*" onChange={handleFileChange} required />
        <p className="text-sm text-muted-foreground mt-1">Maximum file size: 100MB</p>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Message"}
      </Button>
    </form>
  );
};

export default BirthdayMessageForm;
