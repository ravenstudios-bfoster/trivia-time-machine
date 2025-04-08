import { Layout } from "@/components/ui/Layout";
import BirthdayMessageForm from "@/components/BirthdayMessageForm";
import BirthdayMessageGallery from "@/components/BirthdayMessageGallery";

const BirthdayMessages = () => {
  return (
    <Layout className="min-h-screen bg-background bttf-grid">
      <div className="container mx-auto px-4 py-8">
        <h1 className="bttf-heading text-4xl mb-6">Birthday Messages</h1>

        <div className="bttf-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Submit Your Message</h2>
          <BirthdayMessageForm />
        </div>

        <div className="bttf-card p-6">
          <h2 className="text-2xl font-bold mb-4">Message Gallery</h2>
          <BirthdayMessageGallery />
        </div>
      </div>
    </Layout>
  );
};

export default BirthdayMessages;
