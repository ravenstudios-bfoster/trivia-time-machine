import { Layout } from "@/components/ui/Layout";
import TimeCircuitDisplay from "@/components/TimeCircuitDisplay";

const Home = () => {
  return (
    <Layout className="min-h-screen bg-background bttf-grid">
      <div className="container mx-auto px-4 py-8 text-center flex flex-col justify-center min-h-screen">
        <h1 className="text-4xl font-bold text-primary mb-4">Tom's 50th: The Birthday Paradox</h1>
        <div className="mt-20">
          <TimeCircuitDisplay />
        </div>
        <p className="mt-8 text-lg text-muted-foreground italic">"If you're gonna build a time machine into a car, why not do it with some style?"</p>
      </div>
    </Layout>
  );
};

export default Home;
