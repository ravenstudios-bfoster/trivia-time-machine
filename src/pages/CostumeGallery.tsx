import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCostumes, getUserVotes, getCostumeCategories } from "@/lib/firebase";
import { Costume, Vote, CostumeCategory } from "@/types";
import CostumeCard from "@/components/CostumeCard";
import UserCostumeSubmission from "@/components/UserCostumeSubmission";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Layout } from "@/components/ui/Layout";
import { toast } from "sonner";

export default function CostumeGallery() {
  const { currentUser } = useAuth();
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [categories, setCategories] = useState<CostumeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(["all"]));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [fetchedCostumes, fetchedVotes, fetchedCategories] = await Promise.all([getCostumes(), currentUser ? getUserVotes(currentUser.uid) : Promise.resolve([]), getCostumeCategories()]);
        setCostumes(fetchedCostumes);
        setUserVotes(fetchedVotes);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load costumes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleVote = async () => {
    if (currentUser) {
      const updatedVotes = await getUserVotes(currentUser.uid);
      setUserVotes(updatedVotes);
    }
  };

  const toggleCategory = (categoryTag: string) => {
    setSelectedCategories((prev) => {
      const newCategories = new Set(prev);
      if (categoryTag === "all") {
        return new Set(["all"]);
      }
      newCategories.delete("all");
      if (newCategories.has(categoryTag)) {
        newCategories.delete(categoryTag);
        if (newCategories.size === 0) {
          return new Set(["all"]);
        }
      } else {
        newCategories.add(categoryTag);
      }
      return newCategories;
    });
  };

  const filteredCostumes = costumes.filter((costume) => {
    if (selectedCategories.has("all")) return true;
    return Array.from(selectedCategories).some((selectedCat) => costume.categories?.includes(selectedCat));
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Costume Gallery</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Submit Your Costume</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogTitle>Submit Your Costume</DialogTitle>
                <UserCostumeSubmission categories={categories} onSuccess={() => toast.success("Costume submitted successfully!")} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant={selectedCategories.has("all") ? "default" : "outline"} onClick={() => toggleCategory("all")} className="text-sm">
              All Costumes
            </Button>
            {categories.map((category) => (
              <Button key={category.id} variant={selectedCategories.has(category.tag) ? "default" : "outline"} onClick={() => toggleCategory(category.tag)} className="text-sm">
                {category.name}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredCostumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCostumes.map((costume) => (
                <CostumeCard key={costume.id} costume={costume} userVotes={userVotes} onVote={handleVote} categories={categories} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No costumes found</h3>
              <p className="text-muted-foreground">{selectedCategories.has("all") ? "Be the first to submit a costume!" : "No costumes found in the selected categories."}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
