import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getBirthdayMessages, BirthdayMessage } from "@/functions/birthdayMessages";

const BirthdayMessageGallery = () => {
  const [messages, setMessages] = useState<BirthdayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getBirthdayMessages();
        // Only show approved messages
        setMessages(data.filter((message) => message.isApproved));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load birthday messages",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No birthday messages yet.</p>
        <Button variant="link" onClick={() => document.getElementById("submit-form")?.scrollIntoView()} className="mt-4">
          Be the first to submit a message!
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {messages.map((message) => (
        <Card key={message.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">{message.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {message.message && <p className="text-muted-foreground mb-4">{message.message}</p>}
            <div className="aspect-video w-full">
              <video src={message.videoUrl} controls className="w-full h-full object-cover rounded-lg" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{new Date(message.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BirthdayMessageGallery;
