export const resetUserPassword = async (uid: string, newPassword: string) => {
  try {
    const response = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid, newPassword }),
    });

    if (!response.ok) {
      throw new Error("Failed to reset password");
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};
