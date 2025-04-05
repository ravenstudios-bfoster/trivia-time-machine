import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
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
  DocumentReference,
  CollectionReference,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  Answer,
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

// Collection references
export const gamesCollection = collection(db, "games");
export const questionsCollection = collection(db, "questions");
export const adminUsersCollection = collection(db, "adminUsers");
export const accessCodesCollection = collection(db, "accessCodes");

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

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Game functions
export const createGame = async (gameData: Omit<Game, "id" | "createdAt" | "participantCount">): Promise<string> => {
  try {
    const gamesRef = collection(db, "games");
    const newGame = {
      ...gameData,
      participantCount: 0,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(gamesRef, newGame);
    return docRef.id;
  } catch (error) {
    console.error("Error creating game:", error);
    throw new Error("Failed to create game");
  }
};

export const getGames = async (filters: { status?: string; isPublic?: boolean } = {}): Promise<Game[]> => {
  try {
    const gamesRef = collection(db, "games");
    let q = gamesRef;

    if (filters.status) {
      q = query(gamesRef, where("status", "==", filters.status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Game));
  } catch (error) {
    console.error("Error getting games:", error);
    return [];
  }
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

  // Get current questions to determine next order
  const currentQuestionsSnapshot = await getDocs(gameQuestionsRef);
  const nextOrder = currentQuestionsSnapshot.size;

  // Add each question
  questionIds.forEach((questionId, index) => {
    const newQuestionRef = doc(gameQuestionsRef);
    batch.set(newQuestionRef, {
      questionId,
      gameId,
      order: nextOrder + index,
    });
  });

  // Update the game's questionIds array
  const gameRef = doc(db, "games", gameId);
  batch.update(gameRef, {
    questionIds: questionIds,
  });

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
  const q = query(accessCodesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      startDate: data.startDate.toDate(),
      expirationDate: data.expirationDate.toDate(),
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
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
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

export interface User {
  id: string;
  displayName: string;
  email: string;
  role: "participant";
  createdAt: Date;
  lastLogin: Date;
  gamesParticipated: number;
}

export const createOrUpdateUser = async (userData: { displayName: string; email: string }): Promise<User> => {
  const usersRef = collection(db, "users");
  // Use the email as the document ID
  const userId = userData.email;
  const userDocRef = doc(usersRef, userId);

  try {
    const userDoc = await getDoc(userDocRef);
    const now = Timestamp.now();

    if (!userDoc.exists()) {
      // Create new user
      const newUser: User = {
        id: userId,
        displayName: userData.displayName,
        email: userData.email,
        role: "participant",
        createdAt: now.toDate(),
        lastLogin: now.toDate(),
        gamesParticipated: 0,
      };

      await setDoc(userDocRef, newUser);
      return newUser;
    } else {
      // Update existing user's last login
      await updateDoc(userDocRef, {
        lastLogin: now,
        displayName: userData.displayName, // Update display name in case it changed
      });

      return {
        ...(userDoc.data() as User),
        lastLogin: now.toDate(),
      };
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
};

export { auth, db, storage };
