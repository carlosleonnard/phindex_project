import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { WorldMapGame } from "@/components/WorldMapGame";

const GuessTheOrigin = () => {
  return (
    <div className="min-h-screen bg-slate-100 overflow-x-hidden">
      <Header />

      <div className="container px-4 max-w-none">
        <div className="lg:ml-80 pt-20">
          <AppSidebar />

          <div className="max-w-4xl mx-auto py-8">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Guess the Origin</h1>
              <p className="text-muted-foreground">Test your knowledge of phenotypes and their geographic origins</p>
            </div>

            <WorldMapGame />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GuessTheOrigin;
