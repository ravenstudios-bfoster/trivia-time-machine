import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import LevelSelect from "@/pages/LevelSelect";
import Game from "@/pages/Game";
import GamePlay from "@/pages/GamePlay";
import Results from "@/pages/Results";
import NotFound from "./pages/NotFound";
import { GameProvider } from "@/context/GameContext";
import { AuthProvider } from "./context/AuthContext";
import Home from "@/pages/Home";
import Admin from "./pages/Admin";
import CostumeVoting from "@/pages/CostumeVoting";
import PropsAndMemorabilia from "@/pages/PropsAndMemorabilia";
import PropDetail from "./pages/PropDetail";

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useGame();
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute Debug:", {
    path: location.pathname,
    currentUser: currentUser
      ? {
          id: currentUser.id,
          displayName: currentUser.displayName,
          role: currentUser.role,
        }
      : null,
    isLoading,
    gameState: state
      ? {
          hasCurrentSession: !!state.currentSession,
          player: state.player
            ? {
                id: state.player.id,
                name: state.player.name,
              }
            : null,
        }
      : null,
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Only redirect if we're not loading and there's no user
  if (!isLoading && !currentUser) {
    console.log("No current user, redirecting to home");
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Only check game session state for game and results pages
  if (location.pathname === "/game" && !state.currentSession) {
    console.log("No current session for game page, redirecting to levels");
    return <Navigate to="/levels" replace />;
  }

  if (location.pathname === "/results" && !state.currentSession) {
    console.log("No current session for results page, redirecting to levels");
    return <Navigate to="/levels" replace />;
  }

  console.log("Access granted to:", location.pathname);
  return <>{children}</>;
};

// Lazy load admin routes
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminGames = lazy(() => import("./pages/admin/Games"));
const AdminGame = lazy(() => import("./pages/admin/Game"));
const AdminQuestions = lazy(() => import("./pages/admin/Questions"));
const AdminQuestion = lazy(() => import("./pages/admin/Question"));
const AdminPlayers = lazy(() => import("./pages/admin/Players"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const GameForm = lazy(() => import("./pages/admin/GameForm"));
const QuestionForm = lazy(() => import("./pages/admin/QuestionForm"));
const AdminProps = lazy(() => import("@/pages/admin/Props"));
const PropForm = lazy(() => import("@/pages/admin/PropForm"));
const AdminCostumes = lazy(() => import("./pages/admin/Costumes"));
const AdminCostumeCategories = lazy(() => import("./pages/admin/CostumeCategories"));
const AdminLeaderboard = lazy(() => import("./pages/admin/Leaderboard"));
const AdminVideoGuestbook = lazy(() => import("./pages/admin/VideoGuestbook"));

// Lazy load feature routes
const VideoGuestbook = lazy(() => import("./pages/VideoGuestbook"));

const queryClient = new QueryClient();

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GameProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/levels"
                  element={
                    <ProtectedRoute>
                      <LevelSelect />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/game/:gameId"
                  element={
                    <ProtectedRoute>
                      <GamePlay />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/game"
                  element={
                    <ProtectedRoute>
                      <Game />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/results"
                  element={
                    <ProtectedRoute>
                      <Results />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/games" element={<AdminGames />} />
                <Route path="/admin/games/:gameId" element={<AdminGame />} />
                <Route path="/admin/games/new" element={<GameForm />} />
                <Route path="/admin/games/:gameId/edit" element={<GameForm />} />
                <Route path="/admin/questions" element={<AdminQuestions />} />
                <Route path="/admin/questions/new" element={<QuestionForm />} />
                <Route path="/admin/questions/:questionId" element={<AdminQuestion />} />
                <Route path="/admin/questions/:questionId/edit" element={<QuestionForm />} />
                <Route path="/admin/games/:gameId/players" element={<AdminPlayers />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/video-guestbook" element={<AdminVideoGuestbook />} />
                <Route path="/admin/props" element={<AdminProps />} />
                <Route path="/admin/props/new" element={<PropForm />} />
                <Route path="/admin/props/:propId/edit" element={<PropForm />} />
                <Route path="/admin/costumes" element={<AdminCostumes />} />
                <Route path="/admin/costume-categories" element={<AdminCostumeCategories />} />
                <Route path="/admin/leaderboard" element={<AdminLeaderboard />} />

                {/* Protected Feature Routes */}
                <Route
                  path="/costume-voting"
                  element={
                    <ProtectedRoute>
                      <CostumeVoting />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/props-and-memorabilia"
                  element={
                    <ProtectedRoute>
                      <PropsAndMemorabilia />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/props/:id"
                  element={
                    <ProtectedRoute>
                      <PropDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/video-guestbook"
                  element={
                    <ProtectedRoute>
                      <VideoGuestbook />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </TooltipProvider>
      </GameProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
