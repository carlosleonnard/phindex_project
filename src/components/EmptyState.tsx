import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  secondaryAction 
}: EmptyStateProps) => {
  return (
    <Card className="p-12 text-center bg-card/50 border-dashed border-2 border-border">
      <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
        <div className="rounded-full bg-primary/10 p-6">
          <Icon className="h-12 w-12 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>

        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {action && (
              <Button 
                onClick={action.onClick}
                className="bg-primary hover:bg-primary/90"
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button 
                onClick={secondaryAction.onClick}
                variant="outline"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
