import { useProfileStats } from "@/hooks/use-profile-stats";
import { useNavigate } from "react-router-dom";
import { Users, Star, Globe, Gamepad2, Dna } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddProfileModal } from "@/components/AddProfileModal";
import { useEffect, useState } from "react";

const AnimatedCounter = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
};

export const StatsBanner = () => {
  const { data: stats, isLoading } = useProfileStats();
  const navigate = useNavigate();
  const [showClassifyModal, setShowClassifyModal] = useState(false);

  const statItems = [
    { label: "Celebrities", value: stats?.celebrities || 0, icon: Star },
    { label: "Community", value: stats?.communityProfiles || 0, icon: Users },
    { label: "Total Profiles", value: stats?.totalProfiles || 0, icon: Globe },
  ];

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl mb-8" style={{ minHeight: 340 }}>
        {/* Background image with subtle zoom animation */}
        <div className="absolute inset-0">
          <img
            src="/banner-dna.jpg"
            alt=""
            className="w-full h-full object-cover animate-[bannerZoom_25s_ease-in-out_infinite_alternate]"
          />
        </div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(190,20%,92%)]/95 via-[hsl(190,15%,93%)]/75 to-transparent" />

        {/* Animated floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-primary/20 animate-[floatUp_6s_ease-in-out_infinite]" />
          <div className="absolute top-[40%] left-[25%] w-1.5 h-1.5 rounded-full bg-teal-400/15 animate-[floatUp_8s_ease-in-out_infinite_1s]" />
          <div className="absolute top-[60%] left-[15%] w-1 h-1 rounded-full bg-primary/25 animate-[floatUp_7s_ease-in-out_infinite_2s]" />
          <div className="absolute top-[30%] left-[35%] w-2.5 h-2.5 rounded-full bg-teal-500/10 animate-[floatUp_9s_ease-in-out_infinite_0.5s]" />
          <div className="absolute top-[70%] left-[5%] w-1.5 h-1.5 rounded-full bg-primary/15 animate-[floatUp_6.5s_ease-in-out_infinite_3s]" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 md:p-10 flex flex-col justify-center" style={{ minHeight: 340, fontFamily: "'Vollkorn', serif" }}>
          {/* Title with fade-in */}
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight tracking-tight mb-1 animate-[fadeSlideIn_0.8s_ease-out]">
            DISCOVER
            <br />
            YOUR PHENOTYPE.
          </h1>
          <h2 className="text-3xl md:text-4xl font-black text-primary leading-tight tracking-tight mb-5 animate-[fadeSlideIn_0.8s_ease-out_0.15s_both]">
            CLASSIFY
            <br />
            YOUR WORLD.
          </h2>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 mb-6 animate-[fadeSlideIn_0.8s_ease-out_0.3s_both]">
            <Button
              onClick={() => setShowClassifyModal(true)}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full px-8 font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Dna className="h-4 w-4" />
              Classify Now!
            </Button>
            <Button
              onClick={() => navigate("/game")}
              variant="outline"
              size="lg"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary gap-2 rounded-full px-8 font-bold text-sm uppercase tracking-wider transition-all hover:scale-105"
            >
              <Gamepad2 className="h-4 w-4 text-primary" />
              Play Our Game Now!
            </Button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 animate-[fadeSlideIn_0.8s_ease-out_0.45s_both]">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl px-5 py-3 flex items-center gap-3 hover:bg-white/80 transition-all hover:scale-105 cursor-default"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xl font-bold text-slate-800 leading-none" style={{ fontFamily: "system-ui, sans-serif" }}>
                    {isLoading ? (
                      <span className="inline-block w-10 h-5 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      <AnimatedCounter value={item.value} />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider" style={{ fontFamily: "system-ui, sans-serif" }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Classify Now Modal */}
      <AddProfileModal
        triggerExternal={showClassifyModal}
        onTriggerExternalChange={setShowClassifyModal}
      />
    </>
  );
};
