import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import VideoGuestbookForm from "@/components/VideoGuestbookForm";
import VideoGuestbookGallery from "@/components/VideoGuestbookGallery";
import { getVideoGuestbookMessages, deleteVideoGuestbookMessage } from "@/functions/videoGuestbookMessages";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Video } from "lucide-react";

const VideoGuestbook = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [entryType, setEntryType] = useState<"written" | "video" | null>(null);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const data = await getVideoGuestbookMessages();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSuccess = () => {
    toast.success(messageToEdit ? "Message updated successfully!" : "Message submitted successfully!");
    setIsFormOpen(false);
    setEntryType(null);
    setMessageToEdit(null);
    fetchMessages();
  };

  const handleEdit = (message) => {
    setMessageToEdit(message);
    setEntryType(message.type);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!messageToDelete) return;

    try {
      await deleteVideoGuestbookMessage(messageToDelete.id, messageToDelete.videoUrl);
      toast.success("Message deleted successfully");
      setMessageToDelete(null);
      fetchMessages();
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
  };

  const videoCount = messages.filter((msg) => msg.type === "video").length;
  const canAddVideo = videoCount < 2;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to the Video Guestbook!</h1>
          <p className="text-xl text-muted-foreground mb-8">Share your birthday wishes and memories in this special collection of messages.</p>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <MessageSquare className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Written Messages</h3>
                <p className="text-muted-foreground">Write a heartfelt message to share your thoughts and wishes. No limit on written messages!</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <Video className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Video Messages</h3>
                <p className="text-muted-foreground">
                  Record a short 60-90 second video message to make it extra special.
                  {canAddVideo ? `You can add ${2 - videoCount} more video${2 - videoCount === 1 ? "" : "s"}.` : "You've reached the limit of 2 videos."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Message Management Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Your Messages</h2>
            <p className="text-muted-foreground mt-2">Only you can see your own entries</p>
          </div>
          <Dialog
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) {
                setEntryType(null);
                setMessageToEdit(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>Leave a Message</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              {!entryType ? (
                <div className="space-y-4">
                  <DialogTitle>Choose Entry Type</DialogTitle>
                  <div className="grid grid-cols-1 gap-4">
                    <Button onClick={() => setEntryType("written")} className="h-24 text-lg">
                      Write a Guestbook Entry
                    </Button>
                    <Button onClick={() => setEntryType("video")} className="h-24 text-lg" disabled={!canAddVideo} title={!canAddVideo ? "You've reached the limit of 2 videos" : undefined}>
                      Record a Video Message
                      {!canAddVideo && " (Limit Reached)"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <DialogTitle>{messageToEdit ? "Edit Message" : entryType === "written" ? "Write Guestbook Entry" : "Record Video Message"}</DialogTitle>
                  <div className="py-4">
                    <VideoGuestbookForm onSuccess={handleSuccess} type={entryType} onBack={() => setEntryType(null)} initialMessage={messageToEdit} />
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : messages.length > 0 ? (
          <VideoGuestbookGallery messages={messages} onEdit={handleEdit} onDelete={setMessageToDelete} />
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground">Be the first to leave a message!</p>
          </div>
        )}

        <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete your message. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default VideoGuestbook;
