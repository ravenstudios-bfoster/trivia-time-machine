import { db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export interface BirthdayMessage {
  id?: string;
  name: string;
  message?: string;
  videoUrl: string;
  createdAt: Date;
  isApproved: boolean;
}

export const submitBirthdayMessage = async (name: string, message: string | undefined, videoFile: File): Promise<string> => {
  try {
    // Upload video to Firebase Storage
    const storageRef = ref(storage, `birthday-messages/${Date.now()}-${videoFile.name}`);
    const snapshot = await uploadBytes(storageRef, videoFile);
    const videoUrl = await getDownloadURL(snapshot.ref);

    // Save message to Firestore
    const docRef = await addDoc(collection(db, "birthday-messages"), {
      name,
      message,
      videoUrl,
      createdAt: new Date(),
      isApproved: false, // Default to false for moderation
    });

    return docRef.id;
  } catch (error) {
    console.error("Error submitting birthday message:", error);
    throw error;
  }
};

export const getBirthdayMessages = async (): Promise<BirthdayMessage[]> => {
  try {
    const q = query(collection(db, "birthday-messages"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as BirthdayMessage[];
  } catch (error) {
    console.error("Error fetching birthday messages:", error);
    throw error;
  }
};

export const updateBirthdayMessage = async (messageId: string, updates: Partial<BirthdayMessage>): Promise<void> => {
  try {
    const messageRef = doc(db, "birthday-messages", messageId);
    await updateDoc(messageRef, updates);
  } catch (error) {
    console.error("Error updating birthday message:", error);
    throw error;
  }
};

export const deleteBirthdayMessage = async (messageId: string, videoUrl: string): Promise<void> => {
  try {
    // 1. Delete Firestore document
    const messageRef = doc(db, "birthday-messages", messageId);
    await deleteDoc(messageRef);

    // 2. Delete video file from Storage
    if (videoUrl) {
      try {
        const videoRef = ref(storage, videoUrl); // Get ref from URL
        await deleteObject(videoRef);
      } catch (storageError) {
        // Log storage deletion error but don't block overall success
        console.warn(`Failed to delete video file ${videoUrl} for message ${messageId}:`, storageError);
        // You might want more robust error handling/reporting here
      }
    }
  } catch (error) {
    console.error(`Error deleting birthday message ${messageId}:`, error);
    throw error;
  }
};
