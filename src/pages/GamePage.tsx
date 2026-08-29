import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { WorldMapGame } from "@/components/WorldMapGame";

const GamePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Guess the Phenotype - Phindex | Test Your Eye for Human Variation</title>
        <meta
          name="description"
          content="Play Guess the Phenotype on Phindex. Place faces by region or name their exact classification across three difficulty levels."
        />
        <link rel="canonical" href="https://www.phenotypeindex.com/game" />
      </Helmet>

      <Header />
      <AppSidebar />

      <main className="px-4 pb-24 pt-20 lg:pl-[21rem] lg:pr-6 lg:pb-12">
        <div className="mx-auto max-w-4xl">
          <div className="py-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Guess the phenotype
            </h1>
            <p className="mt-1 text-muted-foreground">
              Place a face by region, or name its exact classification. Your accuracy is
              tracked across games.
            </p>
          </div>

          <WorldMapGame />
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default GamePage;
