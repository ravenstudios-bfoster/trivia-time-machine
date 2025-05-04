const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.deleteUser = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight (OPTIONS) request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Allow only POST requests
  if (req.method !== "POST") {
    res.status(405).send({ error: "Method not allowed" });
    return;
  }

  // Get UID from request body
  const { uid } = req.body;
  if (!uid) {
    res.status(400).send({ error: "Missing user UID" });
    return;
  }

  try {
    await admin.auth().deleteUser(uid);
    res.status(200).send({ success: true, message: `User ${uid} deleted from Auth.` });
  } catch (error) {
    console.error("Error deleting user from Auth:", error);
    res.status(500).send({ error: "Failed to delete user from Auth", details: error });
  }
});

exports.resetUserPassword = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight (OPTIONS) request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Allow only POST requests
  if (req.method !== "POST") {
    res.status(405).send({ error: "Method not allowed" });
    return;
  }

  const { uid, newPassword } = req.body;
  if (!uid || !newPassword) {
    res.status(400).send({ error: "Missing user UID or new password" });
    return;
  }

  try {
    await admin.auth().updateUser(uid, { password: newPassword });
    res.status(200).send({ success: true, message: `Password reset for user ${uid}.` });
  } catch (error) {
    console.error("Error resetting user password:", error);
    res.status(500).send({ error: "Failed to reset user password", details: error });
  }
});

exports.createUser = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight (OPTIONS) request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Allow only POST requests
  if (req.method !== "POST") {
    res.status(405).send({ error: "Method not allowed" });
    return;
  }

  const { email, password, firstName, lastName, role } = req.body;
  if (!email || !password || !firstName || !lastName || !role) {
    res.status(400).send({ error: "Missing required fields" });
    return;
  }

  try {
    // 1. Create user in Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // 2. Create user document in Firestore
    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set({
        id: userRecord.uid,
        email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        role,
        createdAt: new Date(),
      });

    res.status(200).send({ success: true, uid: userRecord.uid });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send({ error: "Failed to create user", details: error.message });
  }
});
