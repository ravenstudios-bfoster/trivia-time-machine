import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Link } from "react-router-dom";
import { Prop } from "@/types";
import { getProps } from "@/lib/firebase";
import { generatePropQRCode } from "@/lib/qr";
import { toast } from "sonner";
import { Loader2, QrCode } from "lucide-react";

const PropsAndMemorabilia = () => {
  const [props, setProps] = useState<Prop[]>([]);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQRs, setIsGeneratingQRs] = useState(false);

  useEffect(() => {
    const fetchAndGenerate = async () => {
      setIsLoading(true);
      setIsGeneratingQRs(true);
      try {
        const fetchedProps = await getProps();
        setProps(fetchedProps);

        const generatedQrCodes: { [key: string]: string } = {};
        for (const prop of fetchedProps) {
          try {
            const qrCodeDataUrl = await generatePropQRCode(prop.id);
            generatedQrCodes[prop.id] = qrCodeDataUrl;
          } catch (qrError) {
            console.error(`Failed to generate QR code for prop ${prop.id}:`, qrError);
          }
        }
        setQrCodes(generatedQrCodes);
        setIsGeneratingQRs(false);
      } catch (error) {
        console.error("Failed to fetch props:", error);
        toast.error("Failed to load props. Please try again later.");
        setIsGeneratingQRs(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndGenerate();
  }, []);

  return (
    <Layout className="min-h-screen bg-background bttf-grid">
      <div className="container mx-auto px-4 py-8">
        <h1 className="bttf-heading text-4xl mb-6">Props and Memorabilia</h1>
        <p className="text-muted-foreground mb-8 text-lg">Explore the iconic props from the Back to the Future trilogy. Scan the QR codes at the party to learn more about each item!</p>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-4 text-muted-foreground">Loading props...</span>
          </div>
        ) : props.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <p>No props found in this timeline... yet!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {props.map((prop) => (
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
                  <p className="text-foreground text-sm line-clamp-3 flex-grow mb-4">{prop.description}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-primary/10 flex items-center justify-center">
                  {isGeneratingQRs ? (
                    <div className="flex flex-col items-center text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mb-1" />
                      <span>Generating QR...</span>
                    </div>
                  ) : qrCodes[prop.id] ? (
                    <div className="text-center">
                      <img src={qrCodes[prop.id]} alt={`${prop.title} QR Code`} className="w-20 h-20 mx-auto mb-1 p-1 bg-white rounded-sm" />
                      <span className="text-xs text-muted-foreground">Scan for Details</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-xs text-destructive">
                      <QrCode className="h-5 w-5 mb-1" />
                      <span>QR Error</span>
                    </div>
                  )}
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
