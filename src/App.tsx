import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import Auth from "./pages/Auth";
import LevelSelect from "@/pages/LevelSelect";
import Game from "@/pages/Game";
import Results from "@/pages/Results";
import NotFound from "./pages/NotFound";
import { GameProvider } from "@/context/GameContext";
import { AuthProvider } from "./context/AuthContext";
import Home from "@/pages/Home";
import Enter from "@/pages/Enter";
import Admin from "./pages/Admin";
import CostumeGallery from "@/pages/CostumeGallery";
import PropsAndMemorabilia from "@/pages/PropsAndMemorabilia";
import PropDetail from "./pages/PropDetail";
import BirthdayMessages from "./pages/BirthdayMessages";

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useGame();
  const location = useLocation();

  if (!state.player?.id) {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === "/game" && !state.currentSession) {
    return <Navigate to="/levels" replace />;
  }

  if (location.pathname === "/results" && !state.currentSession) {
    return <Navigate to="/levels" replace />;
  }

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
const SeedDatabase = lazy(() => import("./pages/admin/SeedDatabase"));
const GameForm = lazy(() => import("./pages/admin/GameForm"));
const QuestionForm = lazy(() => import("./pages/admin/QuestionForm"));
const AdminBirthdayMessages = lazy(() => import("./pages/admin/BirthdayMessages"));

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
                <Route path="/enter" element={<Enter />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/levels"
                  element={
                    <ProtectedRoute>
                      <LevelSelect />
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
                <Route path="/admin/seed" element={<SeedDatabase />} />
                <Route path="/admin/birthday-messages" element={<AdminBirthdayMessages />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="/costume-voting" element={<CostumeGallery />} />
                <Route path="/props-and-memorabilia" element={<PropsAndMemorabilia />} />
                <Route path="/props/:id" element={<PropDetail />} />
                <Route path="/birthday-messages" element={<BirthdayMessages />} />
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
