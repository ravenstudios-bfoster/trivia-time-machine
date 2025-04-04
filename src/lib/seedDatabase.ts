import { generateQuestions, generateGames, generateAdminUsers } from "./seedData";
import { createQuestion, createGame, updateAdminUser, getQuestions, getGames, getAdminUsers } from "./firebase";
import { toast } from "sonner";

export const seedDatabase = async () => {
  try {
    // Check if we already have data
    const [existingQuestions, existingGames, existingAdmins] = await Promise.all([getQuestions(), getGames(), getAdminUsers()]);

    if (existingQuestions.length > 0 || existingGames.length > 0 || existingAdmins.length > 0) {
      toast.error("Database already contains data. Please clear existing data first.");
      return;
    }

    // Generate and create questions
    const questions = generateQuestions(20);
    const questionPromises = questions.map((question) => createQuestion(question));
    await Promise.all(questionPromises);
    toast.success("Created 20 sample questions");

    // Generate and create games
    const games = generateGames(5);
    const gamePromises = games.map((game) => createGame(game));
    await Promise.all(gamePromises);
    toast.success("Created 5 sample games");

    // Generate and update admin users
    const adminUsers = generateAdminUsers();
    const adminPromises = adminUsers.map((user) => updateAdminUser("admin1", user));
    await Promise.all(adminPromises);
    toast.success("Created sample admin users");

    toast.success("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    toast.error("Failed to seed database. Please check the console for details.");
  }
};

export const clearDatabase = async () => {
  try {
    // Note: In a real application, you would want to implement proper deletion
    // of all documents in each collection. This is just a placeholder.
    toast.warning("Database clearing not implemented yet. Please clear data manually in Firebase Console.");
  } catch (error) {
    console.error("Error clearing database:", error);
    toast.error("Failed to clear database. Please check the console for details.");
  }
};
