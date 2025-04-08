import { Layout } from "@/components/ui/Layout";
import { Link, useParams } from "react-router-dom";
import { props } from "@/data/props";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PropDetail = () => {
  const { id } = useParams();
  const prop = props.find((p) => p.id === id);

  if (!prop) {
    return (
      <Layout className="min-h-screen bg-background bttf-grid">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="bttf-heading text-4xl mb-6">Prop Not Found</h1>
          <p className="text-muted-foreground mb-8">The prop you're looking for doesn't exist in this timeline.</p>
          <Link to="/props-and-memorabilia">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Props
            </Button>
          </Link>
        </div>
      </Layout>
    );
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
                <div className="aspect-w-16 aspect-h-9 mb-4 overflow-hidden rounded-lg">
                  <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                </div>
                {prop.videoUrl && (
                  <div className="mt-4">
                    <iframe
                      src={prop.videoUrl}
                      className="w-full aspect-video rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
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
                    <p className="text-foreground">{prop.description}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-2">Backstory</h2>
                    <p className="text-foreground">{prop.backstory}</p>
                  </div>

                  {prop.funFact && (
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <h2 className="text-xl font-semibold mb-2 text-primary">Fun Fact</h2>
                      <p className="text-foreground">{prop.funFact}</p>
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
