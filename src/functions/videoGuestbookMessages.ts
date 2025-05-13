import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export interface VideoGuestbookMessage {
  id?: string;
  name: string;
  message: string;
  videoUrl?: string;
  type: "written" | "video";
  createdAt: Date;
  userId: string;
}

export const submitVideoGuestbookMessage = async (name: string, message: string, videoFile: File | null, messageId?: string): Promise<string> => {
  try {
    console.log("Starting message submission", {
      name,
      messageLength: message.length,
      hasVideo: !!videoFile,
      videoFileName: videoFile?.name,
      isUpdate: !!messageId,
    });

    let videoUrl = "";
    const type = videoFile ? "video" : "written";
    console.log("Message type determined:", type);

    // Upload video to Firebase Storage if provided
    if (videoFile && type === "video") {
      console.log("Starting video upload");
      const storageRef = ref(storage, `video-guestbook/${Date.now()}-${videoFile.name}`);
      console.log("Storage reference created:", storageRef.fullPath);

      try {
        const snapshot = await uploadBytes(storageRef, videoFile);
        console.log("Video uploaded successfully", {
          path: snapshot.ref.fullPath,
        });

        videoUrl = await getDownloadURL(snapshot.ref);
        console.log("Video URL obtained:", videoUrl);
      } catch (uploadError) {
        console.error("Error during video upload:", uploadError);
        throw uploadError;
      }
    }

    // Prepare document data
    const docData = {
      name,
      message,
      type,
      ...(messageId ? {} : { createdAt: new Date() }),
      ...(type === "video" && videoUrl ? { videoUrl } : {}),
    };
    console.log("Preparing Firestore document:", docData);

    // Save or update message in Firestore
    if (messageId) {
      const messageRef = doc(db, "video-guestbook", messageId);
      await updateDoc(messageRef, docData);
      console.log("Message updated in Firestore with ID:", messageId);
      return messageId;
    } else {
      const docRef = await addDoc(collection(db, "video-guestbook"), {
        ...docData,
        createdAt: new Date(),
        userId: auth.currentUser?.uid,
      });
      console.log("Message saved to Firestore with ID:", docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error in submitVideoGuestbookMessage:", error);
    throw error;
  }
};

export const getVideoGuestbookMessages = async (): Promise<VideoGuestbookMessage[]> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log("No user logged in");
      return [];
    }

    const q = query(collection(db, "video-guestbook"), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as VideoGuestbookMessage[];

    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const updateVideoGuestbookMessage = async (messageId: string, updates: Partial<VideoGuestbookMessage>): Promise<void> => {
  try {
    const messageRef = doc(db, "video-guestbook", messageId);
    await updateDoc(messageRef, updates);
  } catch (error) {
    console.error("Error updating message:", error);
    throw error;
  }
};

export const deleteVideoGuestbookMessage = async (messageId: string, videoUrl?: string): Promise<void> => {
  try {
    // 1. Delete Firestore document
    const messageRef = doc(db, "video-guestbook", messageId);
    await deleteDoc(messageRef);

    // 2. Delete video file from Storage if it exists
    if (videoUrl) {
      try {
        // Extract the path from the Firebase Storage URL
        const decodedUrl = decodeURIComponent(videoUrl);
        const pathMatch = decodedUrl.match(/video-guestbook%2F.+?(?=\?)/);
        if (pathMatch) {
          const storagePath = pathMatch[0].replace(/%2F/g, "/");
          const videoRef = ref(storage, storagePath);
          await deleteObject(videoRef);
          console.log("Video file deleted successfully");
        } else {
          console.warn("Could not extract storage path from URL:", videoUrl);
        }
      } catch (storageError) {
        console.warn("Failed to delete video file:", {
          messageId,
          videoUrl,
          error: storageError,
        });
      }
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};
