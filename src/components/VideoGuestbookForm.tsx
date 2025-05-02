import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { submitVideoGuestbookMessage, VideoGuestbookMessage } from "@/functions/videoGuestbookMessages";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft } from "lucide-react";

interface VideoGuestbookFormProps {
  onSuccess: () => void;
  type: "written" | "video";
  onBack: () => void;
  initialMessage?: VideoGuestbookMessage;
}

const VideoGuestbookForm = ({ onSuccess, type, onBack, initialMessage }: VideoGuestbookFormProps) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState(initialMessage?.message || "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(initialMessage?.videoUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Cleanup the object URL when component unmounts or when a new file is selected
    return () => {
      if (videoPreviewUrl && !initialMessage?.videoUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl, initialMessage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File selection triggered");
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      });

      if (file.size > 100 * 1024 * 1024) {
        console.log("File too large");
        toast({
          title: "File too large",
          description: "Please upload a video under 100MB",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith("video/")) {
        console.log("Invalid file type:", file.type);
        toast({
          title: "Invalid file type",
          description: "Please upload a video file",
          variant: "destructive",
        });
        return;
      }
      setVideoFile(file);

      // Create a preview URL for the video
      if (videoPreviewUrl && !initialMessage?.videoUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(previewUrl);
      console.log("Video preview URL created");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submission started", {
      type,
      hasMessage: !!message.trim(),
      hasVideo: !!videoFile,
      currentUser: currentUser?.email,
      isEdit: !!initialMessage,
    });

    if (!currentUser) {
      console.log("No current user");
      toast({
        title: "Please sign in",
        description: "You must be signed in to leave a message",
        variant: "destructive",
      });
      return;
    }

    if (type === "video" && !videoFile && !initialMessage?.videoUrl) {
      console.log("Video required but not provided");
      toast({
        title: "Missing video",
        description: "Please provide a video message",
        variant: "destructive",
      });
      return;
    }

    if (type === "written" && !message.trim()) {
      console.log("Written message required but not provided");
      toast({
        title: "Missing message",
        description: "Please write your message",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVideoGuestbookMessage(currentUser.displayName, message, type === "video" ? videoFile : null, initialMessage?.id);
      console.log("Message submitted successfully");

      toast({
        title: "Success!",
        description: initialMessage ? "Your message has been updated" : "Your message has been submitted",
      });

      // Reset form
      setMessage("");
      setVideoFile(null);
      if (videoPreviewUrl && !initialMessage?.videoUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
        setVideoPreviewUrl(null);
      }

      // Call onSuccess callback
      onSuccess();
    } catch (error) {
      console.error("Error submitting message:", error);
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
      <Button type="button" variant="ghost" className="mb-4" onClick={onBack}>
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {type === "written" ? (
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Your Message *
          </label>
          <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your guestbook message here..." required className="min-h-[150px]" />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="video" className="block text-sm font-medium mb-1">
              Video Message {!initialMessage && "*"}
            </label>
            <Input id="video" type="file" accept="video/*" onChange={handleFileChange} required={!initialMessage} />
            <p className="text-sm text-muted-foreground mt-1">Please keep your video message to 60-90 seconds. Maximum file size: 100MB</p>
            <p className="text-sm text-muted-foreground">Tip: A 60-second video is typically around 6MB when recorded on a modern phone</p>
          </div>

          {videoPreviewUrl && (
            <div className="relative aspect-video w-full mt-4 bg-black/20 rounded-lg overflow-hidden">
              <video ref={videoRef} src={videoPreviewUrl} className="w-full h-full object-contain" controls preload="metadata" />
            </div>
          )}

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Additional Message (optional)
            </label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a message to go with your video..." className="min-h-[100px]" />
          </div>
        </>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : initialMessage ? "Update Message" : `Submit ${type === "written" ? "Guestbook Entry" : "Video Message"}`}
      </Button>
    </form>
  );
};

export default VideoGuestbookForm;
