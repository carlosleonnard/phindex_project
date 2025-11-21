import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfileCardSkeleton = () => {
  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <div className="relative">
        <Skeleton className="w-full h-48" />
      </div>

      <div className="p-3 space-y-3">
        {/* Nome e informações básicas */}
        <div className="text-center space-y-2">
          <Skeleton className="h-4 w-24 mx-auto" />
          <Skeleton className="h-3 w-32 mx-auto" />
          <Skeleton className="h-5 w-20 mx-auto rounded-full" />
        </div>

        {/* Ações */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t">
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-7 w-12" />
        </div>
      </div>
    </Card>
  );
};

export const ProfileCircleSkeleton = () => {
  return (
    <div className="flex flex-col items-center p-1">
      <div className="relative mb-1">
        <Skeleton className="w-36 h-36 rounded-full" />
      </div>
      <Skeleton className="h-3 w-20 mb-1" />
      <Skeleton className="h-2 w-16" />
    </div>
  );
};
