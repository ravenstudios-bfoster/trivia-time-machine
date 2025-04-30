import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection } from "firebase/firestore";

interface ImportUser {
  firstName: string;
  lastName: string;
  email: string;
}

interface ImportResult {
  user: ImportUser;
  status: "success" | "error";
  message?: string;
}

interface ImportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ImportUsersDialog = ({ open, onOpenChange, onSuccess }: ImportUsersDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const validateUser = (user: ImportUser): string | null => {
    if (!user.firstName?.trim()) return "First name is required";
    if (!user.lastName?.trim()) return "Last name is required";
    if (!user.email?.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return "Invalid email format";
    return null;
  };

  const parseCSV = (text: string): ImportUser[] => {
    const lines = text.split("\n");
    const users: ImportUser[] = [];

    // Skip header row and process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const [firstName, lastName, email] = line.split(",").map((field) => field.trim());
      users.push({ firstName, lastName, email });
    }

    return users;
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setResults([]);
    const results: ImportResult[] = [];

    try {
      const text = await file.text();
      const users = parseCSV(text);

      for (const user of users) {
        try {
          // Validate user data
          const validationError = validateUser(user);
          if (validationError) {
            results.push({
              user,
              status: "error",
              message: validationError,
            });
            continue;
          }

          // Check if user already exists
          const userDoc = await getDoc(doc(db, "users", user.email));
          if (userDoc.exists()) {
            results.push({
              user,
              status: "error",
              message: "User already exists",
            });
            continue;
          }

          // Generate a unique ID for the new user
          const userDocRef = doc(collection(db, "users"));
          const uid = userDocRef.id;

          // Create Firebase Auth user
          const userCredential = await createUserWithEmailAndPassword(auth, user.email, "Bttf2025!");

          // Create Firestore document
          await setDoc(userDocRef, {
            id: uid,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: `${user.firstName} ${user.lastName}`,
            role: "user",
            createdAt: new Date(),
          });

          results.push({
            user,
            status: "success",
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to create user";
          results.push({
            user,
            status: "error",
            message: errorMessage,
          });
        }
      }

      setResults(results);
      if (results.some((r) => r.status === "success")) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Users</DialogTitle>
          <DialogDescription>
            Upload a CSV file with the following columns: First Name, Last Name, Email.
            <br />
            The file should include a header row and use comma as the delimiter.
            <br />
            Example: <code>First Name,Last Name,Email</code>
          </DialogDescription>
        </DialogHeader>

        {!isProcessing && results.length === 0 && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">
                CSV File
              </Label>
              <Input id="file" type="file" accept=".csv" onChange={handleFileChange} className="col-span-3" />
            </div>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="flex gap-4 mb-4">
              <Alert variant={successCount > 0 ? "default" : "destructive"}>
                <AlertTitle>Import Results</AlertTitle>
                <AlertDescription>
                  Successfully imported {successCount} users
                  {errorCount > 0 && `, Failed to import ${errorCount} users`}
                </AlertDescription>
              </Alert>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.status === "success" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}</TableCell>
                      <TableCell>{result.user.email}</TableCell>
                      <TableCell>{result.user.firstName}</TableCell>
                      <TableCell>{result.user.lastName}</TableCell>
                      <TableCell>{result.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <DialogFooter>
          {!isProcessing && results.length === 0 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => file && processFile(file)} disabled={!file || isProcessing}>
                Import Users
              </Button>
            </>
          )}
          {(isProcessing || results.length > 0) && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Close"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportUsersDialog;
