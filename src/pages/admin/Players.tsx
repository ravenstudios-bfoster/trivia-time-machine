import React from "react";
import { useParams } from "react-router-dom";

const AdminPlayers = () => {
  const { gameId } = useParams<{ gameId: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Players Management</h1>
      <p>Game ID: {gameId}</p>
    </div>
  );
};

export default AdminPlayers;
