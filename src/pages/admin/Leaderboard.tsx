import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getCostumes, getCostumeCategories } from "@/lib/firebase";
import { Costume, CostumeCategory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CategoryLeader {
  costume: Costume;
  voteCount: number;
}

interface CategoryResults {
  [key: string]: CategoryLeader[];
}

export default function AdminLeaderboard() {
  const [categories, setCategories] = useState<CostumeCategory[]>([]);
  const [categoryResults, setCategoryResults] = useState<CategoryResults>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [costumes, categories] = await Promise.all([getCostumes(), getCostumeCategories()]);

        // Initialize results object
        const results: CategoryResults = {};

        // Process each category
        categories.forEach((category) => {
          // Count votes for each costume in this category
          const categoryVotes = costumes.map((costume) => {
            // Count votes for this category from the votes object
            const voteCount = Object.entries(costume.votes || {}).filter(([key]) => key.startsWith(category.tag)).length;

            return {
              costume,
              voteCount,
            };
          });

          // Sort by vote count and get top 3
          results[category.tag] = categoryVotes.sort((a, b) => b.voteCount - a.voteCount).slice(0, 3);
        });

        setCategories(categories);
        setCategoryResults(results);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTrophyColor = (position: number): string => {
    switch (position) {
      case 0:
        return "text-yellow-400";
      case 1:
        return "text-gray-400";
      case 2:
        return "text-amber-600";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Contest Results">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Contest Results">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Costume Contest Results</h1>
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link to="/admin/costumes">Manage Costumes</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/costume-categories">Manage Categories</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="bg-secondary/10">
                <CardTitle className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">{categoryResults[category.tag]?.reduce((sum, result) => sum + result.voteCount, 0)} total votes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {categoryResults[category.tag]?.length > 0 ? (
                  <div className="space-y-4">
                    {categoryResults[category.tag].map((result, index) => (
                      <div key={result.costume.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/5">
                        <Trophy className={`h-6 w-6 ${getTrophyColor(index)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{result.costume.characterName}</p>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{result.voteCount} votes</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">by {result.costume.submitterName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No votes yet</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
