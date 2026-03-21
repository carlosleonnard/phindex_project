import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { WorldMapGame } from "@/components/WorldMapGame";

const GamePage = () => {
  return (
    <div className="min-h-screen bg-slate-100 overflow-x-hidden">
      <Helmet>
        <title>Origin Game - Phindex | Guess the Phenotype Origin</title>
        <meta name="description" content="Play the Origin Game on Phindex. Guess the geographic origin of phenotypes and test your knowledge of human physical traits." />
        <link rel="canonical" href="https://www.phenotypeindex.com/game" />
      </Helmet>
      <Header />
      <div className="container px-4 max-w-none">
        <div className="lg:ml-80 pt-20">
          <AppSidebar />
          <div className="mb-8">
            <WorldMapGame />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GamePage;
