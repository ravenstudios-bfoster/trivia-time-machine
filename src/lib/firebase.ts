import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment,
  arrayUnion,
  DocumentReference,
  CollectionReference,
  type DocumentData,
  type Query,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import {
  Game,
  Question,
  GameQuestion,
  Participant,
  ParticipantAnswer,
  GameStatus,
  ParticipantStatus,
  GameFilter,
  QuestionFilter,
  ParticipantFilter,
  AdminUser,
  UserRole,
  GameAnalytics,
  QuestionStat,
  AccessCode,
  Costume,
  Vote,
  Prop,
  CostumeCategory,
  VotingWindow,
  Level,
  Answer,
  CostumeInstructions,
} from "@/types";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Set persistence to LOCAL (persists across tabs and browser restarts)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

// Export Firestore functions with proper types
export {
  getDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  type DocumentData,
  type Query,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";

// Helper functions for Timestamp conversion
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Collection references
export const gamesCollection = collection(db, "games");
export const questionsCollection = collection(db, "questions");
export const adminUsersCollection = collection(db, "adminUsers");
export const accessCodesCollection = collection(db, "accessCodes");
export const costumesCollection = collection(db, "costumes");
export const votesCollection = collection(db, "votes");
export const usersCollection = collection(db, "users");
export const videoGuestbookCollection = collection(db, "video-guestbook");
export const propsCollection = collection(db, "props") as CollectionReference<Omit<Prop, "id">>;
export const configCollection = collection(db, "config");

// Authentication functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    // Clear local storage on logout
    localStorage.removeItem("gameState");
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Game functions
export const createGame = async (gameData: Omit<Game, "id" | "createdAt" | "participantCount">): Promise<string> => {
  try {
    const adminId = auth.currentUser?.uid;
    if (!adminId) throw new Error("User not authenticated");

    // Generate a new document ID
    const gameId = doc(collection(db, "games")).id;

    const newGame = {
      ...gameData,
      id: gameId,
      adminId,
      participantCount: 0,
      createdAt: Timestamp.now(),
    };

    // Use setDoc with the generated ID
    await setDoc(doc(db, "games", gameId), newGame);
    return gameId;
  } catch (error) {
    console.error("Error creating game:", error);
    throw new Error("Failed to create game");
  }
};

export const getGames = async (): Promise<Game[]> => {
  const gamesRef = collection(db, "games");
  const snapshot = await getDocs(gamesRef);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    } as Game;
  });
};

export const getGameById = async (gameId: string): Promise<Game | null> => {
  try {
    const gameRef = doc(db, "games", gameId);
    const gameDoc = await getDoc(gameRef);
    return gameDoc.exists() ? ({ id: gameDoc.id, ...gameDoc.data() } as Game) : null;
  } catch (error) {
    console.error("Error getting game:", error);
    return null;
  }
};

export const updateGame = async (gameId: string, updates: Partial<Game>): Promise<void> => {
  try {
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, updates);
  } catch (error) {
    console.error("Error updating game:", error);
    throw new Error("Failed to update game");
  }
};

export const deleteGame = async (gameId: string): Promise<void> => {
  const batch = writeBatch(db);

  // Delete the game document
  const gameRef = doc(db, "games", gameId);
  batch.delete(gameRef);

  // Delete game questions
  const gameQuestionsRef = collection(db, "games", gameId, "gameQuestions");
  const gameQuestionsSnapshot = await getDocs(gameQuestionsRef);
  gameQuestionsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete participants
  const participantsRef = collection(db, "games", gameId, "participants");
  const participantsSnapshot = await getDocs(participantsRef);
  participantsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Commit the batch
  return await batch.commit();
};

export const startGame = async (gameId: string): Promise<void> => {
  const gameRef = doc(db, "games", gameId);
  const gameDoc = await getDoc(gameRef);
  const game = gameDoc.data() as Game;

  // Cannot start a scheduled game before its start time
  if (game.scheduledStartTime) {
    const startTime = game.scheduledStartTime.toDate();
    const now = new Date();
    if (startTime > now) {
      throw new Error("Cannot start a scheduled game before its start time");
    }
  }

  return await updateDoc(gameRef, {
    status: "active",
    startedAt: serverTimestamp(),
    currentQuestionIndex: 0,
    lastStatusUpdate: serverTimestamp(),
  });
};

export const endGame = async (gameId: string): Promise<void> => {
  const gameRef = doc(db, "games", gameId);
  return await updateDoc(gameRef, {
    status: "ended",
    endedAt: serverTimestamp(),
    lastStatusUpdate: serverTimestamp(),
  });
};

// Question functions
export const createQuestion = async (questionData: Omit<Question, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const adminId = auth.currentUser?.uid;
  if (!adminId) throw new Error("User not authenticated");

  const questionRef = await addDoc(questionsCollection, {
    ...questionData,
    createdBy: adminId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return questionRef.id;
};

export const getQuestions = async (level?: Level): Promise<Question[]> => {
  try {
    const questionsRef = collection(db, "questions");
    let q = questionsRef;

    if (level !== undefined) {
      q = query(questionsRef, where("level", "==", level));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Question));
  } catch (error) {
    console.error("Error getting questions:", error);
    return [];
  }
};

export const getQuestionById = async (questionId: string): Promise<Question | null> => {
  try {
    const questionRef = doc(db, "questions", questionId);
    const questionDoc = await getDoc(questionRef);
    return questionDoc.exists() ? ({ id: questionDoc.id, ...questionDoc.data() } as Question) : null;
  } catch (error) {
    console.error("Error getting question:", error);
    return null;
  }
};

export const updateQuestion = async (questionId: string, questionData: Partial<Question>): Promise<void> => {
  const questionRef = doc(db, "questions", questionId);
  return await updateDoc(questionRef, {
    ...questionData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  const questionRef = doc(db, "questions", questionId);
  return await deleteDoc(questionRef);
};

// Game Questions functions
export const addQuestionsToGame = async (gameId: string, questionIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  const gameQuestionsRef = collection(db, "games", gameId, "gameQuestions");

  // 1. Get all existing gameQuestions docs and delete them
  const currentQuestionsSnapshot = await getDocs(gameQuestionsRef);
  currentQuestionsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // 2. Add each new question as a new doc with correct order
  questionIds.forEach((questionId, index) => {
    const newQuestionRef = doc(gameQuestionsRef);
    batch.set(newQuestionRef, {
      questionId,
      gameId,
      order: index,
    });
  });

  // 3. Update the game's questionIds array
  const gameRef = doc(db, "games", gameId);
  batch.update(gameRef, {
    questionIds: questionIds,
  });

  // 4. Commit the batch
  return await batch.commit();
};

export const getGameQuestions = async (gameId: string): Promise<Question[]> => {
  // Get the game question references
  const gameQuestionsRef = collection(db, "games", gameId, "gameQuestions");
  const gameQuestionsQuery = query(gameQuestionsRef, orderBy("order", "asc"));
  const gameQuestionsSnapshot = await getDocs(gameQuestionsQuery);

  // Get the actual questions
  const questionPromises = gameQuestionsSnapshot.docs.map(async (docSnapshot) => {
    const { questionId } = docSnapshot.data();
    const questionDoc = await getDoc(doc(db, "questions", questionId));

    if (questionDoc.exists()) {
      return {
        id: questionDoc.id,
        ...(questionDoc.data() as Record<string, unknown>),
      } as Question;
    }

    return null;
  });

  const questions = await Promise.all(questionPromises);
  return questions.filter((q) => q !== null) as Question[];
};

export const removeQuestionFromGame = async (gameId: string, questionId: string): Promise<void> => {
  // Find the game question document
  const gameQuestionsRef = collection(db, "games", gameId, "gameQuestions");
  const q = query(gameQuestionsRef, where("questionId", "==", questionId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  // Delete the game question document
  const gameQuestionDoc = snapshot.docs[0];
  await deleteDoc(gameQuestionDoc.ref);

  // Update the game's questionIds array
  const gameRef = doc(db, "games", gameId);
  const gameDoc = await getDoc(gameRef);

  if (gameDoc.exists()) {
    const game = gameDoc.data() as Game;
    const questionIds = game.questionIds || [];
    const updatedQuestionIds = questionIds.filter((id: string) => id !== questionId);

    await updateDoc(gameRef, {
      questionIds: updatedQuestionIds,
    });
  }
};

// Participant functions
export const addParticipant = async (gameId: string, participantData: Omit<Participant, "id" | "gameId" | "joinedAt" | "score" | "correctAnswers" | "answers">): Promise<string> => {
  const participantsRef = collection(db, "games", gameId, "participants");

  // Create the participant
  const participantRef = await addDoc(participantsRef, {
    ...participantData,
    gameId,
    score: 0,
    correctAnswers: 0,
    joinedAt: serverTimestamp(),
    answers: [],
  });

  // Update participant count in the game
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    participantCount: increment(1),
  });

  return participantRef.id;
};

export const getParticipants = async (gameId: string, filter?: ParticipantFilter): Promise<Participant[]> => {
  const participantsRef = collection(db, "games", gameId, "participants");
  let participantsQuery = query(participantsRef, orderBy("score", "desc"));

  if (filter?.status) {
    participantsQuery = query(participantsQuery, where("status", "==", filter.status));
  }

  const snapshot = await getDocs(participantsQuery);
  const participants = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Record<string, unknown>),
  })) as Participant[];

  // Apply additional filters client-side
  return participants.filter((participant) => {
    if (filter?.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      if (!participant.name.toLowerCase().includes(term)) return false;
    }

    if (filter?.minScore !== undefined && participant.score < filter.minScore) return false;
    if (filter?.maxScore !== undefined && participant.score > filter.maxScore) return false;

    return true;
  });
};

export const getParticipantById = async (gameId: string, participantId: string): Promise<Participant | null> => {
  const docRef = doc(db, "games", gameId, "participants", participantId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...(docSnap.data() as Record<string, unknown>),
    } as Participant;
  } else {
    return null;
  }
};

export const updateParticipant = async (gameId: string, participantId: string, participantData: Partial<Participant>): Promise<void> => {
  const participantRef = doc(db, "games", gameId, "participants", participantId);
  return await updateDoc(participantRef, {
    ...participantData,
    lastActiveAt: serverTimestamp(),
  });
};

export const submitAnswer = async (gameId: string, answer: Omit<Answer, "id" | "submittedAt">): Promise<string> => {
  try {
    const answersRef = collection(db, "games", gameId, "answers");
    const newAnswer = {
      ...answer,
      submittedAt: Timestamp.now(),
    };
    const docRef = await addDoc(answersRef, newAnswer);
    return docRef.id;
  } catch (error) {
    console.error("Error submitting answer:", error);
    throw new Error("Failed to submit answer");
  }
};

export const kickParticipant = async (gameId: string, participantId: string): Promise<void> => {
  const participantRef = doc(db, "games", gameId, "participants", participantId);
  return await updateDoc(participantRef, {
    status: "kicked" as ParticipantStatus,
    isOnline: false,
  });
};

// Admin User functions
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const snapshot = await getDocs(adminUsersCollection);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Record<string, unknown>),
  })) as AdminUser[];
};

export const updateAdminUser = async (userId: string, userData: Partial<AdminUser>): Promise<void> => {
  const userRef = doc(db, "adminUsers", userId);
  return await updateDoc(userRef, userData);
};

export const deleteAdminUser = async (userId: string): Promise<void> => {
  const userRef = doc(db, "adminUsers", userId);
  return await deleteDoc(userRef);
};

// Access Code Functions
export const createAccessCode = async (data: Omit<AccessCode, "id" | "createdAt">): Promise<AccessCode> => {
  const accessCodesRef = collection(db, "accessCodes");
  const newCodeRef = doc(accessCodesRef);

  const accessCode: AccessCode = {
    ...data,
    id: newCodeRef.id,
    createdAt: new Date(),
    startDate: new Date(data.startDate),
    expirationDate: new Date(data.expirationDate),
  };

  await setDoc(newCodeRef, {
    ...accessCode,
    createdAt: Timestamp.fromDate(accessCode.createdAt),
    startDate: Timestamp.fromDate(accessCode.startDate),
    expirationDate: Timestamp.fromDate(accessCode.expirationDate),
  });

  return accessCode;
};

export const getAccessCodes = async (): Promise<AccessCode[]> => {
  const accessCodesRef = collection(db, "accessCodes");
  const snapshot = await getDocs(accessCodesRef);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      usedAt: data.usedAt instanceof Timestamp ? data.usedAt.toDate() : null,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(),
      expirationDate: data.expirationDate instanceof Timestamp ? data.expirationDate.toDate() : new Date(),
    } as AccessCode;
  });
};

export const updateAccessCode = async (id: string, data: Partial<AccessCode>): Promise<void> => {
  const accessCodeRef = doc(db, "accessCodes", id);
  const updateData = { ...data };

  if (data.startDate) {
    updateData.startDate = Timestamp.fromDate(new Date(data.startDate));
  }
  if (data.expirationDate) {
    updateData.expirationDate = Timestamp.fromDate(new Date(data.expirationDate));
  }

  await updateDoc(accessCodeRef, updateData);
};

export const validateAccessCode = async (code: string): Promise<boolean> => {
  const accessCodesRef = collection(db, "accessCodes");
  const now = new Date();
  const q = query(accessCodesRef, where("code", "==", code), where("isActive", "==", true), where("startDate", "<=", Timestamp.fromDate(now)), where("expirationDate", ">=", Timestamp.fromDate(now)));

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Storage functions
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const metadata = {
      contentType: file.type,
    };
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
};

// Function to delete a file from Firebase Storage, handling potential errors
export const deleteFileFromStorage = async (filePathOrUrl: string): Promise<void> => {
  if (!filePathOrUrl) return; // Nothing to delete

  try {
    // Check if it's a URL or a path
    let fileRef;
    if (filePathOrUrl.startsWith("http")) {
      fileRef = ref(storage, filePathOrUrl); // Get ref from URL
    } else {
      fileRef = ref(storage, filePathOrUrl); // Assume it's a path
    }
    await deleteObject(fileRef);
    console.log("Successfully deleted file from Storage:", filePathOrUrl);
  } catch (error: any) {
    if (error.code === "storage/object-not-found") {
      console.warn("File not found in Storage, skipping deletion:", filePathOrUrl);
    } else {
      console.error("Error deleting file from Storage:", filePathOrUrl, error);
      // Decide if you want to re-throw or just log the error
      // throw new Error("Failed to delete file from Storage");
    }
  }
};

// Analytics functions
export const getGameAnalytics = async (gameId: string): Promise<GameAnalytics | null> => {
  try {
    const game = await getGameById(gameId);
    if (!game) return null;

    const answersRef = collection(db, "games", gameId, "answers");
    const snapshot = await getDocs(answersRef);
    const answers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Answer));

    // Calculate analytics
    const totalAnswers = answers.length;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const completionRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    // Group answers by question
    const questionStats = answers.reduce((stats, answer) => {
      if (!stats[answer.questionId]) {
        stats[answer.questionId] = { total: 0, correct: 0 };
      }
      stats[answer.questionId].total++;
      if (answer.isCorrect) stats[answer.questionId].correct++;
      return stats;
    }, {} as Record<string, { total: number; correct: number }>);

    // Calculate average correct rate per question
    const questionCorrectRates = Object.values(questionStats).map((stat) => (stat.correct / stat.total) * 100);
    const averageCorrectRate = questionCorrectRates.reduce((sum, rate) => sum + rate, 0) / questionCorrectRates.length;

    return {
      gameId,
      totalAnswers,
      correctAnswers,
      completionRate,
      averageScore: (correctAnswers / totalAnswers) * 100,
      questionStats: Object.entries(questionStats).map(([questionId, stat]) => ({
        questionId,
        totalAttempts: stat.total,
        correctAttempts: stat.correct,
        correctRate: (stat.correct / stat.total) * 100,
      })),
    };
  } catch (error) {
    console.error("Error getting game analytics:", error);
    return null;
  }
};

export interface AppUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
  gamesParticipated: number;
}

export const createOrUpdateUser = async (userData: AppUser): Promise<void> => {
  try {
    const userRef = doc(usersCollection, userData.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user
      await setDoc(userRef, {
        ...userData,
        createdAt: Timestamp.now(),
      });
    } else {
      // Update existing user
      await updateDoc(userRef, {
        displayName: userData.displayName,
        email: userData.email,
      });
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
};

// Costume functions
export const createCostume = async (costumeData: Omit<Costume, "id" | "createdAt" | "votes" | "sequenceNumber">): Promise<string> => {
  try {
    // Get all costumes to determine the next sequence number
    const snapshot = await getDocs(query(costumesCollection, orderBy("sequenceNumber", "desc"), limit(1)));
    let nextSequenceNumber = "001";

    if (!snapshot.empty) {
      const lastCostume = snapshot.docs[0].data();
      const lastNumber = parseInt(lastCostume.sequenceNumber || "0", 10);
      nextSequenceNumber = (lastNumber + 1).toString().padStart(3, "0");
    }

    // Initialize votes object based on the costume's categories
    const initialVotes: { [key: string]: number } = {};
    if (costumeData.categories && Array.isArray(costumeData.categories)) {
      costumeData.categories.forEach((catTag) => {
        initialVotes[catTag] = 0;
      });
    }

    const newCostume = {
      ...costumeData,
      votes: initialVotes,
      createdAt: Timestamp.now(),
      sequenceNumber: nextSequenceNumber,
    };

    const docRef = await addDoc(costumesCollection, newCostume);
    return docRef.id;
  } catch (error) {
    console.error("Error creating costume:", error);
    throw new Error("Failed to create costume");
  }
};

export const getCostumes = async (): Promise<Costume[]> => {
  const snapshot = await getDocs(query(costumesCollection, orderBy("sequenceNumber", "asc")));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Costume[];
};

export const updateCostume = async (costumeId: string, updates: Partial<Costume>): Promise<void> => {
  try {
    const costumeRef = doc(db, "costumes", costumeId);
    await updateDoc(costumeRef, updates);
  } catch (error) {
    console.error("Error updating costume:", error);
    throw new Error("Failed to update costume");
  }
};

export const deleteCostume = async (costumeId: string): Promise<void> => {
  try {
    const costumeRef = doc(db, "costumes", costumeId);
    await deleteDoc(costumeRef);
  } catch (error) {
    console.error("Error deleting costume:", error);
    throw new Error("Failed to delete costume");
  }
};

export const castVote = async (userId: string, costumeId: string, category: string): Promise<void> => {
  try {
    const voteRef = doc(collection(db, "votes"));
    const costumeRef = doc(collection(db, "costumes"), costumeId);
    const existingVotes = await getDocs(query(collection(db, "votes"), where("userId", "==", userId), where("category", "==", category)));

    if (!existingVotes.empty) {
      throw new Error("You have already voted in this category");
    }

    const batch = writeBatch(db);

    // Create vote document
    batch.set(voteRef, {
      userId,
      costumeId,
      category,
      timestamp: serverTimestamp(),
    });

    // Increment vote count for the category
    batch.update(costumeRef, {
      [`votes.${category}`]: increment(1),
    });

    await batch.commit();
  } catch (error) {
    console.error("Error casting vote:", error);
    throw error;
  }
};

export const getUserVotes = async (userId: string | undefined | null): Promise<Vote[]> => {
  if (!userId) return [];

  const voteQuery = query(votesCollection, where("userId", "==", userId));
  const snapshot = await getDocs(voteQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  })) as Vote[];
};

// Costume Category functions
export const getCostumeCategories = async (): Promise<CostumeCategory[]> => {
  try {
    const snapshot = await getDocs(query(collection(db, "costumeCategory"), orderBy("sortOrder", "asc")));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(), // Ensure createdAt is a Date
    })) as CostumeCategory[];
  } catch (error) {
    console.error("Error fetching costume categories:", error);
    return [];
  }
};

export const createCostumeCategory = async (categoryData: Omit<CostumeCategory, "id" | "createdAt">): Promise<string> => {
  try {
    const categoriesRef = collection(db, "costumeCategory");

    // Get the highest existing sortOrder
    const snapshot = await getDocs(query(categoriesRef, orderBy("sortOrder", "desc"), limit(1)));
    let nextSortOrder = 1;

    if (!snapshot.empty) {
      const lastCategory = snapshot.docs[0].data();
      nextSortOrder = (lastCategory.sortOrder || 0) + 1;
    }

    const newCategory = {
      ...categoryData,
      tag: categoryData.tag.toLowerCase().replace(/\s+/g, ""), // Ensure tag is lowercase and no spaces
      createdAt: serverTimestamp(),
      sortOrder: nextSortOrder,
    };
    const docRef = await addDoc(categoriesRef, newCategory);
    return docRef.id;
  } catch (error) {
    console.error("Error creating costume category:", error);
    throw new Error("Failed to create costume category");
  }
};

export const updateCostumeCategory = async (categoryId: string, updates: Partial<CostumeCategory>): Promise<void> => {
  try {
    const categoryRef = doc(db, "costumeCategory", categoryId);
    // Prevent tag from being updated
    const { tag, ...validUpdates } = updates;
    if (tag) {
      console.warn("Attempted to update the 'tag' field of a category, which is not allowed.");
    }
    await updateDoc(categoryRef, validUpdates);
  } catch (error) {
    console.error("Error updating costume category:", error);
    throw new Error("Failed to update costume category");
  }
};

export const deleteCostumeCategory = async (categoryId: string): Promise<void> => {
  try {
    const categoryRef = doc(db, "costumeCategory", categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error("Error deleting costume category:", error);
    throw new Error("Failed to delete costume category");
  }
};

export const updateCostumeCategoryOrder = async (categoryId: string, newSortOrder: number): Promise<void> => {
  try {
    const categoryRef = doc(db, "costumeCategory", categoryId);
    await updateDoc(categoryRef, { sortOrder: newSortOrder });
  } catch (error) {
    console.error("Error updating costume category order:", error);
    throw new Error("Failed to update costume category order");
  }
};

// Prop functions
export const getProps = async (): Promise<Prop[]> => {
  try {
    const propsQuery = query(propsCollection, orderBy("title"));
    const snapshot = await getDocs(propsQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Prop));
  } catch (error) {
    console.error("Error fetching props:", error);
    throw new Error("Failed to fetch props");
  }
};

export const getProp = async (propId: string): Promise<Prop | null> => {
  try {
    const docRef = doc(propsCollection, propId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Prop;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching prop:", error);
    throw new Error("Failed to fetch prop");
  }
};

// Use setDoc with propId as the document ID for better control
export const createProp = async (propData: Prop): Promise<void> => {
  try {
    const propRef = doc(propsCollection, propData.id);
    // Ensure we don't try to write the id field itself into the document data
    const { id, ...dataToSave } = propData;
    await setDoc(propRef, dataToSave);
  } catch (error) {
    console.error("Error creating prop:", error);
    throw new Error("Failed to create prop");
  }
};

export const updateProp = async (propId: string, propData: Partial<Omit<Prop, "id">>): Promise<void> => {
  try {
    const propRef = doc(propsCollection, propId);
    await updateDoc(propRef, propData);
  } catch (error) {
    console.error("Error updating prop:", error);
    throw new Error("Failed to update prop");
  }
};

export const deleteProp = async (propId: string): Promise<void> => {
  try {
    const propRef = doc(propsCollection, propId);
    // Get the prop data first to find the image URL for deletion
    const propDoc = await getDoc(propRef);
    if (propDoc.exists()) {
      const propData = { id: propDoc.id, ...propDoc.data() } as Prop; // Construct full Prop object
      // Delete the Firestore document
      await deleteDoc(propRef);
      // If an image URL exists, attempt to delete the image from Storage
      // Ensure we're using a valid URL or path
      if (propData.imageUrl && typeof propData.imageUrl === "string") {
        await deleteFileFromStorage(propData.imageUrl);
      }
    } else {
      console.warn(`Prop with ID ${propId} not found for deletion.`);
    }
  } catch (error) {
    console.error("Error deleting prop:", error);
    throw new Error("Failed to delete prop");
  }
};

// Costume Instructions functions
export const getCostumeInstructions = async (): Promise<CostumeInstructions | null> => {
  try {
    console.log("Getting costume instructions from Firebase...");
    const docRef = doc(db, "config", "costumeInstructions");
    const docSnap = await getDoc(docRef);
    console.log("Raw costume instructions data:", docSnap.data());

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        instructions: data.instructions,
        createdAt: data.createdAt,
        modifiedAt: data.modifiedAt,
      };
    }
    console.log("No costume instructions found");
    return null;
  } catch (error) {
    console.error("Error fetching costume instructions:", error);
    return null;
  }
};

export const updateCostumeInstructions = async (instructions: string): Promise<void> => {
  try {
    const docRef = doc(configCollection, "costumeInstructions");
    await setDoc(
      docRef,
      {
        instructions,
        modifiedAt: serverTimestamp(),
        createdAt: serverTimestamp(), // This will only be set on first creation
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating costume instructions:", error);
    throw new Error("Failed to update costume instructions");
  }
};

// Export Firebase instances and auth functions
export { auth, db, storage, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged, setPersistence, browserLocalPersistence };

// Export Costume type AGAIN - Ensure this line is present
export type { Costume };

export const getVotingWindow = async (): Promise<VotingWindow | null> => {
  const votingWindowRef = doc(db, "config", "votingWindow");
  const docSnap = await getDoc(votingWindowRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    ...data,
    startDateTime: data.startDateTime instanceof Timestamp ? data.startDateTime.toDate() : data.startDateTime,
    endDateTime: data.endDateTime instanceof Timestamp ? data.endDateTime.toDate() : data.endDateTime,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  } as VotingWindow;
};

export const joinGame = async (gameId: string, userId: string) => {
  const gameRef = doc(db, "games", gameId);
  const userRef = doc(db, "users", userId);

  // Add user to game's participants array
  await updateDoc(gameRef, {
    participants: arrayUnion(userId),
    participantCount: increment(1),
  });

  // Create user's game history entry
  const userGameRef = doc(collection(userRef, "games"), gameId);
  await setDoc(userGameRef, {
    gameId,
    startTime: serverTimestamp(),
    answers: [],
    score: 0,
  });
};

export const submitGameAnswer = async (
  gameId: string,
  userId: string,
  answer: {
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    timeRemaining: number;
  }
) => {
  const userRef = doc(db, "users", userId);
  const userGameRef = doc(collection(userRef, "games"), gameId);

  await updateDoc(userGameRef, {
    answers: arrayUnion(answer),
    score: increment(answer.isCorrect ? 1 : 0),
  });
};

export const hasUserPlayedGame = async (gameId: string, userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userGameRef = doc(collection(userRef, "games"), gameId);
    const gameDoc = await getDoc(userGameRef);
    return gameDoc.exists();
  } catch (error) {
    console.error("Error checking if user played game:", error);
    return false;
  }
};

export const removeVote = async (userId: string, costumeId: string, category: string): Promise<void> => {
  try {
    const votesRef = collection(db, "votes");
    const voteQuery = query(votesRef, where("userId", "==", userId), where("costumeId", "==", costumeId), where("category", "==", category));
    const voteSnapshot = await getDocs(voteQuery);

    if (voteSnapshot.empty) {
      throw new Error("Vote not found");
    }

    const batch = writeBatch(db);
    const voteDoc = voteSnapshot.docs[0];
    const costumeRef = doc(db, "costumes", costumeId);

    // Delete the vote document
    batch.delete(doc(db, "votes", voteDoc.id));

    // Decrement vote count for the category
    batch.update(costumeRef, {
      [`votes.${category}`]: increment(-1),
    });

    await batch.commit();
  } catch (error) {
    console.error("Error removing vote:", error);
    throw error;
  }
};

export const getGamesForLevel = async (level: string): Promise<Game[]> => {
  const gamesRef = collection(db, "games");
  const q = query(gamesRef, where("allowedLevels", "array-contains", level), where("status", "==", "active"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Game));
};
