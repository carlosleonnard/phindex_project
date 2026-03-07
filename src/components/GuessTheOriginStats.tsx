import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Globe } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RegionVote {
  region: string;
  count: number;
  percentage: number;
}

interface GuessTheOriginStatsProps {
  profileId: string;
}

const REGION_COLORS: Record<string, string> = {
  "Europe": "bg-blue-500",
  "Africa": "bg-amber-500",
  "Middle East": "bg-orange-500",
  "Asia": "bg-red-500",
  "Americas": "bg-green-500",
  "Oceania": "bg-purple-500",
};

const REGION_FLAGS: Record<string, string> = {
  "Europe": "🌍",
  "Africa": "🌍",
  "Middle East": "🌏",
  "Asia": "🌏",
  "Americas": "🌎",
  "Oceania": "🌏",
};

export function GuessTheOriginStats({ profileId }: GuessTheOriginStatsProps) {
  const { data: regionVotes = [], isLoading } = useQuery({
    queryKey: ["guess-origin-stats", profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from("votes")
        .select("classification")
        .eq("profile_id", profileId)
        .eq("characteristic_type", "Primary Geographic");

      if (error || !data) return [];

      // Map classifications to broad regions
      const regionMap: Record<string, number> = {};

      data.forEach(({ classification }) => {
        const region = mapToRegion(classification);
        if (region) {
          regionMap[region] = (regionMap[region] || 0) + 1;
        }
      });

      const total = Object.values(regionMap).reduce((a, b) => a + b, 0);
      if (total === 0) return [];

      return Object.entries(regionMap)
        .map(([region, count]) => ({
          region,
          count,
          percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!profileId,
  });

  if (isLoading || regionVotes.length === 0) return null;

  const topRegion = regionVotes[0];

  return (
    <div className="mb-6 rounded-xl border border-phindex-teal/20 bg-gradient-to-br from-phindex-teal/5 to-phindex-dark/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-phindex-teal" />
        <h3 className="text-sm font-semibold text-phindex-teal">Guess the Origin</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {regionVotes.reduce((s, r) => s + r.count, 0)} guesses
        </span>
      </div>

      {/* Top region highlight */}
      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-phindex-teal/10 border border-phindex-teal/20">
        <span className="text-lg">{REGION_FLAGS[topRegion.region] ?? "🌐"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{topRegion.region}</p>
          <p className="text-xs text-muted-foreground">Most voted origin</p>
        </div>
        <span className="text-lg font-bold text-phindex-teal">{topRegion.percentage}%</span>
      </div>

      {/* All regions breakdown */}
      <div className="space-y-2">
        {regionVotes.map((r) => (
          <div key={r.region} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <span>{REGION_FLAGS[r.region] ?? "🌐"}</span>
                {r.region}
              </span>
              <span className="text-foreground font-medium">{r.percentage}%</span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${REGION_COLORS[r.region] ?? "bg-phindex-teal"}`}
                style={{ width: `${r.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Maps Primary Geographic classification text to a broad region
function mapToRegion(classification: string): string | null {
  const c = classification.toLowerCase();

  if (
    c.includes("europe") ||
    c.includes("nordic") ||
    c.includes("slavic") ||
    c.includes("mediterranean") ||
    c.includes("atlantid") ||
    c.includes("alpinid") ||
    c.includes("dinarid") ||
    c.includes("faelid") ||
    c.includes("nordid") ||
    c.includes("borreby") ||
    c.includes("trønder") ||
    c.includes("hallstatt") ||
    c.includes("litorid") ||
    c.includes("danubian") ||
    c.includes("pontid") ||
    c.includes("east europid") ||
    c.includes("pre slavic") ||
    c.includes("paleo sardinian") ||
    c.includes("neo danubian") ||
    c.includes("dalofaelid") ||
    c.includes("paleo atlantid") ||
    c.includes("anglo") ||
    c.includes("eurafricanid")
  ) {
    return "Europe";
  }

  if (
    c.includes("africa") ||
    c.includes("bantuid") ||
    c.includes("ethiopid") ||
    c.includes("nilotid") ||
    c.includes("sudanid") ||
    c.includes("congoid") ||
    c.includes("khoisan") ||
    c.includes("berberid") ||
    c.includes("maghrebi")
  ) {
    return "Africa";
  }

  if (
    c.includes("middle east") ||
    c.includes("anatolid") ||
    c.includes("assyroid") ||
    c.includes("armenid") ||
    c.includes("arabid") ||
    c.includes("irano") ||
    c.includes("levantine") ||
    c.includes("trans mediterranid")
  ) {
    return "Middle East";
  }

  if (
    c.includes("asia") ||
    c.includes("huanghoid") ||
    c.includes("mongolid") ||
    c.includes("tungid") ||
    c.includes("indid") ||
    c.includes("keralid") ||
    c.includes("dravidid") ||
    c.includes("samoyedic") ||
    c.includes("nesiotid") ||
    c.includes("gracile indid")
  ) {
    return "Asia";
  }

  if (
    c.includes("americas") ||
    c.includes("amerindid") ||
    c.includes("andid") ||
    c.includes("paleo americanid")
  ) {
    return "Americas";
  }

  if (
    c.includes("oceania") ||
    c.includes("australid") ||
    c.includes("melanesid") ||
    c.includes("polynesian")
  ) {
    return "Oceania";
  }

  return null;
}
