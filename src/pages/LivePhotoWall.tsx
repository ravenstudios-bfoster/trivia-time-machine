import { Layout } from "@/components/ui/Layout";

const LivePhotoWall = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-center">Live Photo Wall</h1>
        <div className="w-full" style={{ height: "70vh", maxWidth: 1200 }}>
          <iframe src="https://app.kululu.com/s/1kvsyd" title="Live Photo Wall" width="100%" height="100%" style={{ border: 0, minHeight: 500, width: "100%", height: "100%" }} allowFullScreen />
        </div>
      </div>
    </Layout>
  );
};

export default LivePhotoWall;
