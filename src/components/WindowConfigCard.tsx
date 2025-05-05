import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Clock } from "lucide-react";

function splitDateTime(date: Date) {
  return {
    date: format(date, "yyyy-MM-dd"),
    time: format(date, "HH:mm"),
  };
}

function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

interface WindowConfigCardProps {
  type: "trivia" | "props";
  title: string;
  defaultMessage: string;
}

export const WindowConfigCard = ({ type, title, defaultMessage }: WindowConfigCardProps) => {
  const [windowConfig, setWindowConfig] = useState<{
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    message: string;
  }>({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    message: defaultMessage,
  });
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editState, setEditState] = useState<typeof windowConfig>(windowConfig);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const docRef = doc(db, "config", type === "trivia" ? "triviaWindow" : "propsWindow");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const start = data.startDateTime?.toDate ? data.startDateTime.toDate() : null;
        const end = data.endDateTime?.toDate ? data.endDateTime.toDate() : null;
        setWindowConfig({
          startDate: start ? splitDateTime(start).date : "",
          startTime: start ? splitDateTime(start).time : "",
          endDate: end ? splitDateTime(end).date : "",
          endTime: end ? splitDateTime(end).time : "",
          message: data.message || defaultMessage,
        });
      } else {
        setWindowConfig({ startDate: "", startTime: "", endDate: "", endTime: "", message: defaultMessage });
      }
      setLoading(false);
    };
    fetchConfig();
  }, [type, defaultMessage]);

  const handleEdit = () => {
    setEditState(windowConfig);
    setEditOpen(true);
  };

  const handleSave = async () => {
    const start = combineDateAndTime(editState.startDate, editState.startTime);
    const end = combineDateAndTime(editState.endDate, editState.endTime);
    const docRef = doc(db, "config", type === "trivia" ? "triviaWindow" : "propsWindow");
    await setDoc(
      docRef,
      {
        startDateTime: Timestamp.fromDate(start),
        endDateTime: Timestamp.fromDate(end),
        message: editState.message,
      },
      { merge: true }
    );
    setWindowConfig(editState);
    setEditOpen(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center gap-2">
        <Clock className="h-5 w-5 text-gray-400 mr-2" />
        <CardTitle>{title}</CardTitle>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleEdit}>
          Edit Window
        </Button>
      </CardHeader>
      <CardContent className="flex flex-row items-center gap-8">
        <div>
          <div className="text-xs text-gray-400">Start</div>
          <div className="text-white font-medium">{windowConfig.startDate && windowConfig.startTime ? format(combineDateAndTime(windowConfig.startDate, windowConfig.startTime), "PPPp") : "-"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">End</div>
          <div className="text-white font-medium">{windowConfig.endDate && windowConfig.endTime ? format(combineDateAndTime(windowConfig.endDate, windowConfig.endTime), "PPPp") : "-"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Message</div>
          <div className="text-gray-400">{windowConfig.message}</div>
        </div>
      </CardContent>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div className="font-semibold text-lg">Edit {title}</div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400">Start Date and Time</label>
              <div className="flex gap-2">
                <Input type="date" value={editState.startDate} onChange={(e) => setEditState((s) => ({ ...s, startDate: e.target.value }))} />
                <Input type="time" value={editState.startTime} onChange={(e) => setEditState((s) => ({ ...s, startTime: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400">End Date and Time</label>
              <div className="flex gap-2">
                <Input type="date" value={editState.endDate} onChange={(e) => setEditState((s) => ({ ...s, endDate: e.target.value }))} />
                <Input type="time" value={editState.endTime} onChange={(e) => setEditState((s) => ({ ...s, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400">Message</label>
              <Input value={editState.message} onChange={(e) => setEditState((s) => ({ ...s, message: e.target.value }))} />
            </div>
            {/* Summary Section */}
            <div className="bg-gray-800 text-gray-100 rounded p-3 mt-4">
              <div className="font-semibold mb-1">Summary</div>
              <div className="text-sm">
                {editState.startDate && editState.startTime && editState.endDate && editState.endTime
                  ? `Voting will be open from ${format(combineDateAndTime(editState.startDate, editState.startTime), "PPPp")} until ${format(
                      combineDateAndTime(editState.endDate, editState.endTime),
                      "PPPp"
                    )}`
                  : "Set a start and end date/time to see the summary."}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
