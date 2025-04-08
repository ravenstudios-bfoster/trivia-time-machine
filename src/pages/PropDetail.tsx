import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Prop } from "@/types";
import { getProp } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PropDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prop, setProp] = useState<Prop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      toast.error("Prop ID is missing.");
      navigate("/props-and-memorabilia");
      return;
    }

    const fetchProp = async () => {
      setIsLoading(true);
      try {
        const fetchedProp = await getProp(id);
        if (fetchedProp) {
          setProp(fetchedProp);
        } else {
          toast.error("Prop not found in this timeline.");
          navigate("/props-and-memorabilia");
        }
      } catch (error) {
        console.error("Failed to fetch prop:", error);
        toast.error("Failed to load prop details.");
        navigate("/props-and-memorabilia");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProp();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <Layout className="min-h-screen bg-background bttf-grid">
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[calc(100vh-100px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!prop) {
    return null;
  }

  return (
    <Layout className="min-h-screen bg-background bttf-grid">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/props-and-memorabilia" className="inline-block mb-6">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Props
            </Button>
          </Link>

          <div className="bttf-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="aspect-w-16 aspect-h-9 mb-4 overflow-hidden rounded-lg bg-black/50">
                  {prop.imageUrl ? (
                    <img
                      src={prop.imageUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const parent = e.currentTarget.parentNode as HTMLElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Image unavailable</div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image Provided</div>
                  )}
                </div>
                {prop.videoUrl && (
                  <div className="mt-4">
                    {prop.videoUrl.includes("youtube.com/watch?v=") || prop.videoUrl.includes("youtu.be/") ? (
                      <iframe
                        src={prop.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                        className="w-full aspect-video rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${prop.title} Video`}
                      />
                    ) : (
                      <a href={prop.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View Video Link
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">{prop.title}</h1>
                <p className="text-muted-foreground mb-4">
                  {prop.movie} ({prop.year})
                </p>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Description</h2>
                    <p className="text-foreground whitespace-pre-wrap">{prop.description}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-2">Backstory</h2>
                    <p className="text-foreground whitespace-pre-wrap">{prop.backstory}</p>
                  </div>

                  {prop.funFact && (
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <h2 className="text-xl font-semibold mb-2 text-primary">Fun Fact</h2>
                      <p className="text-foreground whitespace-pre-wrap">{prop.funFact}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PropDetail;
