import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getBirthdayMessages, updateBirthdayMessage, deleteBirthdayMessage } from "@/functions/birthdayMessages";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminBirthdayMessages = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const data = await getBirthdayMessages();
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSelectMessage = (id) => {
    console.log("Selecting message with id:", id);
    setSelectedMessages((prev) => (prev.includes(id) ? prev.filter((msgId) => msgId !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    console.log("Toggling select all");
    if (selectedMessages.length === messages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map((msg) => msg.id));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedMessages.length === 0) return;
    try {
      await Promise.all(selectedMessages.map((id) => updateBirthdayMessage(id, { isApproved: true })));
      toast.success("Messages approved");
      setSelectedMessages([]);
      await loadMessages();
    } catch (error) {
      console.error("Failed to approve messages:", error);
      toast.error("Failed to approve messages");
    }
  };

  const handleBatchReject = async () => {
    if (selectedMessages.length === 0) return;
    try {
      await Promise.all(selectedMessages.map((id) => updateBirthdayMessage(id, { isApproved: false })));
      toast.success("Messages rejected");
      setSelectedMessages([]);
      await loadMessages();
    } catch (error) {
      console.error("Failed to reject messages:", error);
      toast.error("Failed to reject messages");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedMessages.length === 0) return;

    setIsLoading(true);
    try {
      const messagesToDelete = messages.filter((msg) => selectedMessages.includes(msg.id));

      await Promise.all(messagesToDelete.map((msg) => deleteBirthdayMessage(msg.id, msg.videoUrl)));

      toast.success("Messages deleted successfully");
      setSelectedMessages([]);
      setIsDeleteDialogOpen(false);
      await loadMessages();
    } catch (error) {
      console.error("Failed to delete messages:", error);
      toast.error("Failed to delete messages");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMessages = messages.filter((msg) => msg.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const paginatedMessages = filteredMessages.slice((currentPage - 1) * messagesPerPage, currentPage * messagesPerPage);

  const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePictureInPicture = async (videoElement) => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (videoElement.requestPictureInPicture) {
      try {
        await videoElement.requestPictureInPicture();
      } catch (error) {
        console.error("Failed to enter Picture-in-Picture mode", error);
      }
    }
  };

  return (
    <AdminLayout title="Birthday Messages" subtitle="Manage and approve birthday messages">
      <div className="flex justify-between mb-4">
        <Input placeholder="Search by name" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className="flex gap-2">
          <Button onClick={handleBatchApprove} disabled={!selectedMessages.length || isLoading}>
            {isLoading ? "Processing..." : "Approve Selected"}
          </Button>
          <Button onClick={handleBatchReject} disabled={!selectedMessages.length || isLoading} variant="secondary">
            {isLoading ? "Processing..." : "Reject Selected"}
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!selectedMessages.length || isLoading}>
                {isLoading ? "Processing..." : "Delete Selected"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the selected
                  {selectedMessages.length === 1 ? " message" : " messages"} and associated video file(s).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBatchDelete} disabled={isLoading}>
                  {isLoading ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={selectedMessages.length > 0 && selectedMessages.length === paginatedMessages.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedMessages(paginatedMessages.map((msg) => msg.id));
                  } else {
                    setSelectedMessages([]);
                  }
                }}
                aria-label="Select all messages on current page"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Media</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Loading messages...
              </TableCell>
            </TableRow>
          ) : (
            paginatedMessages.map((msg) => (
              <TableRow key={msg.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedMessages.includes(msg.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMessages((prev) => [...prev, msg.id]);
                      } else {
                        setSelectedMessages((prev) => prev.filter((id) => id !== msg.id));
                      }
                    }}
                    aria-label={`Select message from ${msg.name}`}
                  />
                </TableCell>
                <TableCell>{msg.name}</TableCell>
                <TableCell>{msg.message}</TableCell>
                <TableCell>{new Date(msg.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{msg.isApproved ? "Approved" : "Pending"}</TableCell>
                <TableCell>
                  {msg.videoUrl ? (
                    <div className="relative w-16 h-16 cursor-pointer">
                      <video src={msg.videoUrl} className="absolute inset-0 w-full h-full object-cover" onClick={(e) => handlePictureInPicture(e.target)} />
                    </div>
                  ) : (
                    "Text"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex justify-center mt-4">
        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </Button>
        <span className="mx-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminBirthdayMessages;
