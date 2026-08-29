import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_OPTIONS, SUBCATEGORIES } from "@/constants/categories";

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSubcategory?: string;
  onSubcategoryChange?: (subcategory: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isAnonymous?: boolean;
  showSubcategory?: boolean;
}

export const CategorySelector = ({
  selectedCategory,
  onCategoryChange,
  selectedSubcategory = "",
  onSubcategoryChange,
  placeholder = "Search and select category",
  required = false,
  disabled = false,
  isAnonymous = false,
  showSubcategory = false,
}: CategorySelectorProps) => {
  const availableOptions = isAnonymous ? ["User Profiles"] : CATEGORY_OPTIONS;
  const subcategoryOptions = selectedCategory ? (SUBCATEGORIES[selectedCategory] || []) : [];

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category);
    // Reset subcategory when category changes
    if (onSubcategoryChange) {
      onSubcategoryChange("");
    }
  };

  const handleClearSelection = () => {
    onCategoryChange("");
    if (onSubcategoryChange) {
      onSubcategoryChange("");
    }
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

      {/* Subcategory selector - only shown when showSubcategory is true and category is selected */}
      {showSubcategory && selectedCategory && subcategoryOptions.length > 0 && (
        <div className="mt-3">
          <select
            value={selectedSubcategory}
            onChange={(e) => onSubcategoryChange?.(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select subcategory (optional)</option>
            {subcategoryOptions.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
          {selectedSubcategory && (
            <div className="mt-2">
              <Badge variant="outline" className="flex items-center gap-1 w-fit text-xs">
                {selectedSubcategory}
                <button
                  type="button"
                  onClick={() => onSubcategoryChange?.("")}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
