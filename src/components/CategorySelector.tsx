import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORY_OPTIONS = [
  "Pop Culture",
  "Music and Entertainment", 
  "Arts",
  "Philosophy",
  "Sciences",
  "Sports",
  "Business",
  "Politics",
  "Criminals",
  "Religion",
  "Military"
];

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isAnonymous?: boolean;
}

export const CategorySelector = ({ 
  selectedCategory, 
  onCategoryChange, 
  placeholder = "Search and select category",
  required = false,
  disabled = false,
  isAnonymous = false
}: CategorySelectorProps) => {
  const availableOptions = isAnonymous ? ["User Profiles"] : CATEGORY_OPTIONS;

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category);
  };

  const handleClearSelection = () => {
    onCategoryChange("");
  };

  return (
    <div className="relative">
      <div className="relative">
        <select
          value={selectedCategory}
          onChange={(e) => handleCategorySelect(e.target.value)}
          required={required}
          disabled={disabled}
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {availableOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {selectedCategory && !disabled && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {selectedCategory && (
        <div className="mt-2">
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            {selectedCategory}
            {!disabled && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        </div>
      )}
    </div>
  );
};