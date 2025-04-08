import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getBirthdayMessages, updateBirthdayMessage } from "@/functions/birthdayMessages";
import { toast } from "sonner";

const AdminBirthdayMessages = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage] = useState(10);

  useEffect(() => {
    const loadMessages = async () => {
      const data = await getBirthdayMessages();
      setMessages(data);
    };
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
    try {
      await Promise.all(selectedMessages.map((id) => updateBirthdayMessage(id, { isApproved: true })));
      toast.success("Messages approved");
      setSelectedMessages([]);
    } catch (error) {
      toast.error("Failed to approve messages");
    }
  };

  const handleBatchReject = async () => {
    try {
      await Promise.all(selectedMessages.map((id) => updateBirthdayMessage(id, { isApproved: false })));
      toast.success("Messages rejected");
      setSelectedMessages([]);
    } catch (error) {
      toast.error("Failed to reject messages");
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
          <Button onClick={handleBatchApprove} disabled={!selectedMessages.length}>
            Approve Selected
          </Button>
          <Button onClick={handleBatchReject} disabled={!selectedMessages.length}>
            Reject Selected
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox checked={selectedMessages.length === messages.length} onChange={handleSelectAll} />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Media</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedMessages.map((msg) => (
            <TableRow key={msg.id}>
              <TableCell>
                <Checkbox checked={selectedMessages.includes(msg.id)} onChange={() => handleSelectMessage(msg.id)} />
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
          ))}
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
