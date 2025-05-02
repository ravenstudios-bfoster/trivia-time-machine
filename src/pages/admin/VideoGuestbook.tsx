import { useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import VideoGuestbookGallery from "@/components/VideoGuestbookGallery";
import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { VideoGuestbookMessage, deleteVideoGuestbookMessage } from "@/functions/videoGuestbookMessages";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Download, Eye, List, Grid } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const AdminVideoGuestbook = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list"); // Default to list view
  const [messageToDelete, setMessageToDelete] = useState<VideoGuestbookMessage | null>(null);

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["admin-video-guestbook"],
    queryFn: async () => {
      const q = query(collection(db, "video-guestbook"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as VideoGuestbookMessage[];
    },
  });

  const handleDelete = async () => {
    if (!messageToDelete) return;
    try {
      await deleteVideoGuestbookMessage(messageToDelete.id!, messageToDelete.videoUrl);
      toast({
        title: "Message deleted",
        description: "The message has been successfully deleted.",
      });
      setMessageToDelete(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete the message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout title="Video Guestbook">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Video Guestbook Management</h1>
          <div className="flex gap-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")} size="icon" title="Grid View">
              <Grid className="h-5 w-5" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")} size="icon" title="List View">
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : viewMode === "grid" ? (
          <VideoGuestbookGallery messages={messages} onEdit={() => {}} onDelete={(msg) => setMessageToDelete(msg)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 border-b text-left">Video</th>
                  <th className="p-2 border-b text-left">Message</th>
                  <th className="p-2 border-b text-left">Date</th>
                  <th className="p-2 border-b text-left">From</th>
                  <th className="p-2 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 align-middle">
                      {msg.type === "video" && msg.videoUrl ? (
                        <div className="flex items-center gap-2">
                          <a href={msg.videoUrl} target="_blank" rel="noopener noreferrer" title="View Video">
                            <Eye className="h-5 w-5 text-primary hover:text-primary/80" />
                          </a>
                          <a href={msg.videoUrl} download title="Download Video">
                            <Download className="h-5 w-5 text-primary hover:text-primary/80" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-2 align-middle max-w-xs break-words">{msg.message}</td>
                    <td className="p-2 align-middle">{new Date(msg.createdAt).toLocaleDateString()}</td>
                    <td className="p-2 align-middle">{msg.name}</td>
                    <td className="p-2 align-middle">
                      <Button size="sm" variant="destructive" onClick={() => setMessageToDelete(msg)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Confirmation Dialog for Delete */}
        <AlertDialog
          open={!!messageToDelete}
          onOpenChange={(open) => {
            if (!open) setMessageToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete this message. This action cannot be undone.</AlertDialogDescription>
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
    </AdminLayout>
  );
};

export default AdminVideoGuestbook;
