import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Link } from "react-router-dom";
import { Prop } from "@/types";
import { getProps } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { db } from "@/lib/firebase";

const PropsAndMemorabilia = () => {
  const [props, setProps] = useState<Prop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [windowLoading, setWindowLoading] = useState(true);
  const [windowMessage, setWindowMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch props play window config
    const fetchWindow = async () => {
      setWindowLoading(true);
      const docRef = doc(db, "config", "propsWindow");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const now = new Date();
        const start = data.startDateTime?.toDate();
        const end = data.endDateTime?.toDate();
        let msg = data.message || "Props will open at {time}";
        if (start && msg.includes("{time}")) {
          msg = msg.replace("{time}", format(start, "PPPp"));
        }
        if (!start || !end || now < start || now > end) {
          setWindowMessage(msg);
        } else {
          setWindowMessage(null);
        }
      } else {
        setWindowMessage(null);
      }
      setWindowLoading(false);
    };
    fetchWindow();
  }, []);

  useEffect(() => {
    const fetchProps = async () => {
      setIsLoading(true);
      try {
        const fetchedProps = await getProps();
        setProps(fetchedProps);
      } catch (error) {
        console.error("Failed to fetch props:", error);
        toast.error("Failed to load props. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProps();
  }, []);

  if (windowLoading) {
    return (
      <Layout className="min-h-screen bg-background bttf-grid">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-[#FF3D00] border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (windowMessage) {
    return (
      <Layout className="min-h-screen bg-background bttf-grid">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-xl text-gray-200 font-semibold">{windowMessage}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen bg-background bttf-grid">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="bttf-heading text-4xl">Props and Memorabilia</h1>
          <div className="flex gap-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")} className="border-[#333] text-[#666] hover:text-white hover:border-white">
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")} className="border-[#333] text-[#666] hover:text-white hover:border-white">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-8 text-lg">Explore the iconic props from the Back to the Future trilogy. Click on any prop to learn more about its role in the movies!</p>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-4 text-muted-foreground">Loading props...</span>
          </div>
        ) : props.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <p>No props found in this timeline... yet!</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {props
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((prop) => (
                <div key={prop.id} className="bttf-card p-4 flex flex-col">
                  <Link to={`/props/${prop.id}`} className="group block mb-4">
                    <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg bg-black/50 group-hover:opacity-80 transition-opacity">
                      {prop.imageUrl ? (
                        <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-grow flex flex-col">
                    <Link to={`/props/${prop.id}`} className="group">
                      <h2 className="text-xl font-bold text-primary mb-1 group-hover:underline">{prop.title}</h2>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-3">
                      {prop.movie} ({prop.year})
                    </p>
                    <p className="text-foreground text-sm line-clamp-3">{prop.description}</p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-4">
            {props
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((prop) => (
                <div key={prop.id} className="bttf-card p-4 flex items-center gap-6">
                  <Link to={`/props/${prop.id}`} className="group flex-shrink-0">
                    <div className="w-24 h-24 overflow-hidden rounded-lg bg-black/50 group-hover:opacity-80 transition-opacity">
                      {prop.imageUrl ? (
                        <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-grow">
                    <Link to={`/props/${prop.id}`} className="group">
                      <h2 className="text-xl font-bold text-primary mb-1 group-hover:underline">{prop.title}</h2>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-2">
                      {prop.movie} ({prop.year})
                    </p>
                    <p className="text-foreground text-sm line-clamp-2">{prop.description}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PropsAndMemorabilia;
