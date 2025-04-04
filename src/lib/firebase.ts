import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
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

// Collection references
export const gamesCollection = collection(db, "games");
export const questionsCollection = collection(db, "questions");
export const adminUsersCollection = collection(db, "adminUsers");

// Authentication functions
export const loginWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
  return signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Game functions
export const createGame = async (gameData: Omit<Game, "id" | "createdAt" | "participantCount">): Promise<string> => {
  const adminId = auth.currentUser?.uid;
  if (!adminId) throw new Error("User not authenticated");

  const gameRef = await addDoc(gamesCollection, {
    ...gameData,
    adminId,
    participantCount: 0,
    createdAt: serverTimestamp(),
    status: gameData.scheduledStartTime ? "scheduled" : "draft",
    scheduledStartTime: gameData.scheduledStartTime || null,
    expirationTime: gameData.expirationTime || null,
  });

  return gameRef.id;
};

export const getGames = async (filter?: GameFilter): Promise<Game[]> => {
  let gamesQuery = query(gamesCollection, orderBy("createdAt", "desc"));

  if (filter) {
    if (filter.adminId) {
      gamesQuery = query(gamesQuery, where("adminId", "==", filter.adminId));
    }

    if (filter.status) {
      gamesQuery = query(gamesQuery, where("status", "==", filter.status));
    }

    if (filter.isPublic !== undefined) {
      gamesQuery = query(gamesQuery, where("isPublic", "==", filter.isPublic));
    }
  }

  const snapshot = await getDocs(gamesQuery);
  const games = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Record<string, unknown>),
  })) as Game[];

  // Apply text search filter if provided (client-side filtering)
  if (filter?.searchTerm) {
    const term = filter.searchTerm.toLowerCase();
    return games.filter((game) => game.title.toLowerCase().includes(term) || (game.description && game.description.toLowerCase().includes(term)));
  }

  // Filter games based on scheduled times
  const now = new Date();
  return games.filter((game) => {
    // If game is already active or completed, include it
    if (game.status === "active" || game.status === "completed") return true;

    // If game is scheduled, check if it should be active
    if (game.status === "scheduled" && game.scheduledStartTime) {
      const startTime = game.scheduledStartTime.toDate();
      const expirationTime = game.expirationTime?.toDate();

      // If game should have started and hasn't expired, automatically start it
      if (startTime <= now && (!expirationTime || expirationTime > now)) {
        updateGame(game.id, {
          status: "active",
          startedAt: Timestamp.fromDate(now),
        });
        return true;
      }

      // If game has expired, mark it as completed
      if (expirationTime && expirationTime <= now) {
        updateGame(game.id, {
          status: "completed",
          endedAt: Timestamp.fromDate(now),
        });
        return false;
      }
    }

    return true;
  });
};

export const getGameById = async (gameId: string): Promise<Game | null> => {
  const docRef = doc(db, "games", gameId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...(docSnap.data() as Record<string, unknown>),
    } as Game;
  } else {
    return null;
  }
};

export const updateGame = async (gameId: string, gameData: Partial<Game>): Promise<void> => {
  const gameRef = doc(db, "games", gameId);

  // If updating schedule times, update status accordingly
  if (gameData.scheduledStartTime !== undefined) {
    gameData.status = gameData.scheduledStartTime ? "scheduled" : "draft";
  }

  return await updateDoc(gameRef, {
    ...gameData,
    lastStatusUpdate: serverTimestamp(),
  });
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

export const getQuestions = async (filter?: QuestionFilter): Promise<Question[]> => {
  let questionsQuery = query(questionsCollection, orderBy("createdAt", "desc"));

  if (filter) {
    if (filter.level) {
      questionsQuery = query(questionsQuery, where("level", "==", filter.level));
    }

    if (filter.difficulty) {
      questionsQuery = query(questionsQuery, where("difficulty", "==", filter.difficulty));
    }

    if (filter.type) {
      questionsQuery = query(questionsQuery, where("type", "==", filter.type));
    }

    if (filter.topic) {
      questionsQuery = query(questionsQuery, where("topic", "==", filter.topic));
    }
  }

  const snapshot = await getDocs(questionsQuery);
  const questions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Record<string, unknown>),
  })) as Question[];

  // Apply media and text search filters (client-side filtering)
  return questions.filter((question) => {
    if (filter?.hasMedia !== undefined) {
      const hasMedia = !!(question.imageUrl || question.videoUrl);
      if (filter.hasMedia !== hasMedia) return false;
    }

    if (filter?.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      return question.text.toLowerCase().includes(term) || question.topic.toLowerCase().includes(term);
    }

    return true;
  });
};

export const getQuestionById = async (questionId: string): Promise<Question | null> => {
  const docRef = doc(db, "questions", questionId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...(docSnap.data() as Record<string, unknown>),
    } as Question;
  } else {
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

export const submitAnswer = async (gameId: string, participantId: string, answer: Omit<ParticipantAnswer, "isCorrect" | "pointsEarned">): Promise<void> => {
  // Get the question to check if the answer is correct
  const questionDoc = await getDoc(doc(db, "questions", answer.questionId));

  if (!questionDoc.exists()) {
    throw new Error("Question not found");
  }

  const question = questionDoc.data() as Question;
  const isCorrect = question.correctAnswer === answer.selectedAnswer;

  // Calculate points
  let pointsEarned = 0;
  if (isCorrect) {
    // Base points
    pointsEarned = question.pointValue;

    // Time bonus (up to 50% extra for finishing quickly)
    const timeRatio = answer.timeRemaining / question.timeLimit;
    const timeBonus = Math.floor(pointsEarned * 0.5 * timeRatio);
    pointsEarned += timeBonus;

    // Hint penalty
    if (answer.usedHint) {
      pointsEarned = Math.max(0, pointsEarned - question.hintPenalty);
    }
  }

  const batch = writeBatch(db);
  const participantRef = doc(db, "games", gameId, "participants", participantId);

  // Get current participant data
  const participantDoc = await getDoc(participantRef);
  if (!participantDoc.exists()) {
    throw new Error("Participant not found");
  }

  const participant = participantDoc.data() as Participant;

  // Create the complete answer
  const completeAnswer: ParticipantAnswer = {
    ...answer,
    isCorrect,
    pointsEarned,
  };

  // Update participant with new answer
  const updatedAnswers = [...(participant.answers || []), completeAnswer];
  const newCorrectAnswers = participant.correctAnswers + (isCorrect ? 1 : 0);
  const newScore = participant.score + pointsEarned;

  batch.update(participantRef, {
    answers: updatedAnswers,
    correctAnswers: newCorrectAnswers,
    score: newScore,
    lastAnswerAt: serverTimestamp(),
    status: "thinking" as ParticipantStatus,
  });

  // Update game's current question if this is the last participant
  const gameRef = doc(db, "games", gameId);
  const gameDoc = await getDoc(gameRef);

  if (gameDoc.exists()) {
    const game = gameDoc.data() as Game;

    // If this is the last question, mark the game as completed
    if (answer.questionIndex === game.questionIds?.length - 1) {
      batch.update(gameRef, {
        lastQuestionEndedAt: serverTimestamp(),
        status: "completed" as GameStatus,
      });
    }
  }

  return await batch.commit();
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

// Storage functions
export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

// Analytics functions
export const generateGameAnalytics = async (gameId: string): Promise<GameAnalytics> => {
  // Get all participants
  const participantsRef = collection(db, "games", gameId, "participants");
  const participantsSnapshot = await getDocs(participantsRef);
  const participants = participantsSnapshot.docs.map((doc) => doc.data() as Participant);

  // Get all questions for this game
  const gameQuestions = await getGameQuestions(gameId);

  // Calculate analytics
  const totalParticipants = participants.length;
  const completedParticipants = participants.filter((p) => p.status === "completed").length;
  const completionRate = totalParticipants > 0 ? (completedParticipants / totalParticipants) * 100 : 0;

  // Calculate average score
  const totalScore = participants.reduce((sum, p) => sum + p.score, 0);
  const averageScore = totalParticipants > 0 ? totalScore / totalParticipants : 0;

  // Calculate question stats
  const questionStats: QuestionStat[] = gameQuestions.map((question) => {
    // Get all answers for this question
    const answers = participants.flatMap((p) => p.answers.filter((a) => a.questionId === question.id));

    const totalAnswers = answers.length;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const correctRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    const totalTime = answers.reduce((sum, a) => sum + (question.timeLimit - a.timeRemaining), 0);
    const averageTime = totalAnswers > 0 ? totalTime / totalAnswers : 0;

    const hintsUsed = answers.filter((a) => a.usedHint).length;
    const hintUsageRate = totalAnswers > 0 ? (hintsUsed / totalAnswers) * 100 : 0;

    return {
      questionId: question.id,
      correctRate,
      averageTime,
      hintUsageRate,
    };
  });

  const analytics: GameAnalytics = {
    gameId,
    totalParticipants,
    averageScore,
    completionRate,
    questionStats,
  };

  // Store analytics in Firestore
  await setDoc(doc(db, "gameAnalytics", gameId), analytics);

  return analytics;
};

export { auth, db, storage };
