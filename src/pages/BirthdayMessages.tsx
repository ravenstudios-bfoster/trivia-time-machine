import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import BirthdayMessageForm from "@/components/BirthdayMessageForm";
import BirthdayMessageGallery from "@/components/BirthdayMessageGallery";
import { getBirthdayMessages } from "@/functions/birthdayMessages";
import { toast } from "sonner";

const BirthdayMessages = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const data = await getBirthdayMessages();
      setMessages(data.filter((message) => message.isApproved));
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
    toast.success("Message submitted successfully!");
    setIsFormOpen(false);
    fetchMessages();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Birthday Messages</h1>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>Submit Your Message</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogTitle>Submit Your Message</DialogTitle>
              <BirthdayMessageForm onSuccess={handleSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : messages.length > 0 ? (
          <BirthdayMessageGallery messages={messages} />
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No birthday messages found</h3>
            <p className="text-muted-foreground">Be the first to submit a message!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BirthdayMessages;
