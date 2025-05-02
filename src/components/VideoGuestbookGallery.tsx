import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VideoGuestbookMessage } from "@/functions/videoGuestbookMessages";
import { MessageSquare, Video, Edit, Trash2 } from "lucide-react";

interface VideoGuestbookGalleryProps {
  messages: VideoGuestbookMessage[];
  onEdit: (message: VideoGuestbookMessage) => void;
  onDelete: (message: VideoGuestbookMessage) => void;
}

const VideoGuestbookGallery = ({ messages, onEdit, onDelete }: VideoGuestbookGalleryProps) => {
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You haven't created any messages yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {messages.map((message) => (
          <Card key={message.id} className="overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{message.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {message.type === "video" ? <Video className="h-5 w-5 text-muted-foreground" /> : <MessageSquare className="h-5 w-5 text-muted-foreground" />}
                  <Button variant="ghost" size="icon" onClick={() => onEdit(message)} title="Edit message">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(message)} title="Delete message">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <p className="text-muted-foreground mb-4 flex-shrink-0">{message.message}</p>

              {message.type === "video" && message.videoUrl && (
                <div className="relative w-full aspect-video cursor-pointer mt-auto flex-shrink-0" onClick={() => setSelectedVideoUrl(message.videoUrl)}>
                  <video src={message.videoUrl} className="absolute inset-0 w-full h-full object-contain rounded-lg bg-black" preload="metadata" />
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-2 flex-shrink-0">{new Date(message.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Modal */}
      <Dialog open={!!selectedVideoUrl} onOpenChange={(isOpen) => !isOpen && setSelectedVideoUrl(null)}>
        <DialogContent className="max-w-3xl p-0">
          <DialogTitle className="sr-only">Video Message</DialogTitle>
          {selectedVideoUrl && <video src={selectedVideoUrl} controls autoPlay className="w-full h-auto rounded-lg" onEnded={() => setSelectedVideoUrl(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoGuestbookGallery;
