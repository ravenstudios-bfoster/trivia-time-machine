import { Layout } from "@/components/ui/Layout";
import { Link } from "react-router-dom";
import { props } from "@/data/props";

const PropsAndMemorabilia = () => {
  return (
    <Layout className="min-h-screen bg-background bttf-grid">
      <div className="container mx-auto px-4 py-8">
        <h1 className="bttf-heading text-4xl mb-6">Props and Memorabilia</h1>
        <p className="text-muted-foreground mb-8 text-lg">Explore the iconic props from the Back to the Future trilogy. Scan the QR codes at the party to learn more about each item!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {props.map((prop) => (
            <Link key={prop.id} to={`/props/${prop.id}`} className="group">
              <div className="bttf-card p-6 h-full transition-transform duration-300 group-hover:scale-105">
                <div className="aspect-w-16 aspect-h-9 mb-4 overflow-hidden rounded-lg">
                  <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                </div>
                <h2 className="text-xl font-bold text-primary mb-2">{prop.title}</h2>
                <p className="text-muted-foreground mb-2">
                  {prop.movie} ({prop.year})
                </p>
                <p className="text-foreground line-clamp-2">{prop.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PropsAndMemorabilia;
