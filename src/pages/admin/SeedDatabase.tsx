import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { seedDatabase, seedQuestions, seedGames } from "@/utils/seedData";
import { getCurrentUser } from "@/lib/firebase";
import { AlertCircle, Database, Check, Loader2 } from "lucide-react";

const SeedDatabase = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Check if user is authenticated
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return (
      <AdminLayout title="Seed Database" subtitle="Add sample data to the database">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>You must be logged in as an admin to use this feature.</AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const handleSeedAll = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      await seedDatabase();
      setResult({
        success: true,
        message: "Successfully seeded the database with questions and games!",
      });
    } catch (error) {
      console.error("Error seeding database:", error);
      setResult({
        success: false,
        message: `Error seeding database: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedQuestions = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const questionIds = await seedQuestions();
      setResult({
        success: true,
        message: `Successfully created ${questionIds.length} questions!`,
      });
    } catch (error) {
      console.error("Error seeding questions:", error);
      setResult({
        success: false,
        message: `Error seeding questions: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedGames = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const gameIds = await seedGames();
      setResult({
        success: true,
        message: `Successfully created ${gameIds.length} games!`,
      });
    } catch (error) {
      console.error("Error seeding games:", error);
      setResult({
        success: false,
        message: `Error seeding games: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Seed Database"
      subtitle="Add sample data to the database"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Seed Database", href: "/admin/seed" },
      ]}
    >
      <div className="space-y-6">
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Seed Database</CardTitle>
            <CardDescription>Add sample Back to the Future trivia questions and games to your database.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This utility will create sample questions and games in your Firebase database. Use this to quickly populate your database for testing or demonstration purposes.
            </p>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Seed Everything</h3>
                  <p className="text-sm text-muted-foreground">Create both questions and games</p>
                </div>
                <Button onClick={handleSeedAll} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
                  Seed All
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Seed Questions Only</h3>
                  <p className="text-sm text-muted-foreground">Create only the sample questions</p>
                </div>
                <Button variant="outline" onClick={handleSeedQuestions} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
                  Seed Questions
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Seed Games Only</h3>
                  <p className="text-sm text-muted-foreground">Create only the sample games (without questions)</p>
                </div>
                <Button variant="outline" onClick={handleSeedGames} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
                  Seed Games
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => navigate("/admin")} disabled={isLoading}>
              Back to Admin
            </Button>
            <Button onClick={() => navigate("/admin/games")} disabled={isLoading}>
              Go to Games
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SeedDatabase;
