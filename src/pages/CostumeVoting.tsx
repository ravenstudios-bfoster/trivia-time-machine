import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { getCostumeInstructions } from "@/lib/firebase";
import { CostumeInstructions } from "@/types";
import { Loader2 } from "lucide-react";

const CostumeVoting = () => {
  const [instructions, setInstructions] = useState<CostumeInstructions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const fetchedInstructions = await getCostumeInstructions();
        setInstructions(fetchedInstructions);
      } catch (error) {
        console.error("Error fetching costume instructions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructions();
  }, []);

  return (
    <Layout className="min-h-screen bg-background bttf-grid">
      <div className="container mx-auto px-4 py-8">
        <h1 className="bttf-heading text-4xl mb-6">Costume Gallery</h1>

        {/* Instructions Section */}
        {isLoading ? (
          <div className="flex justify-center items-center h-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : instructions ? (
          <div className="mb-8 text-foreground text-lg">
            <p>{instructions.instructions}</p>
          </div>
        ) : null}

        {/* Category Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bttf-card p-6">
            <h2 className="text-xl font-bold text-primary mb-3">Most Fun</h2>
            <p className="text-foreground">
              The costume that makes you laugh, smile, or just plain happy to see. This costume may or may not be a real character or thing from the movie, but it's somehow related. A definite effort was
              made and it's creative and fun!
            </p>
          </div>

          <div className="bttf-card p-6">
            <h2 className="text-xl font-bold text-primary mb-3">Most Screen Accurate</h2>
            <p className="text-foreground">
              The costume with the best detail and accuracy compared to the actual. This may or may not overlap with "Best Overall Costume" depending on what you value in a costume.
            </p>
          </div>

          <div className="bttf-card p-6">
            <h2 className="text-xl font-bold text-primary mb-3">Most Obscure - WITHOUT explanation</h2>
            <p className="text-foreground">
              The most obscure character (think lesser known or background), but done so well that it requires no explanation. This will be an actual character or property associated with the franchise
              that can be referenced in pictures.
            </p>
          </div>

          <div className="bttf-card p-6">
            <h2 className="text-xl font-bold text-primary mb-3">Best Costume Overall</h2>
            <p className="text-foreground">
              A great costume, instantly recognizable, and done with great detail and high degree of accuracy. Even hair, makeup, etc. is awesome! It's clear they spend a lot of time/effort on their look!
              This may or may not overlap with "Most Screen Accurate," depending on what you value in a costume.
            </p>
          </div>
        </div>

        {/* Costume Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bttf-card p-4">
            <img src="/images/costumes/1955-housewife.jpg" alt="1955 Housewife" className="w-full h-auto rounded-lg mb-2" />
            <h3 className="text-lg font-semibold text-primary">1955 Housewife</h3>
          </div>

          <div className="bttf-card p-4">
            <img src="/images/costumes/1985-doc-brown.jpg" alt="1985 Doc Brown" className="w-full h-auto rounded-lg mb-2" />
            <h3 className="text-lg font-semibold text-primary">1985 Doc Brown</h3>
          </div>

          <div className="bttf-card p-4">
            <img src="/images/costumes/1885-gunfight-marty.jpg" alt="1885 Gunfight Marty" className="w-full h-auto rounded-lg mb-2" />
            <h3 className="text-lg font-semibold text-primary">1885 Gunfight Marty</h3>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CostumeVoting;
