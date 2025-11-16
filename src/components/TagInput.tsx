import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  predefinedTags?: string[];
}

export const TagInput = ({ tags, onChange, predefinedTags = ['6', 'FAST', 'BF', 'BuskOut'] }: TagInputProps) => {
  const [newTag, setNewTag] = useState("");

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag);
      setNewTag("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="px-2 py-1">
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {predefinedTags.map(tag => (
          !tags.includes(tag) && (
            <Button
              key={tag}
              variant="outline"
              size="sm"
              onClick={() => addTag(tag)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              {tag}
            </Button>
          )
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add custom tag..."
          className="h-8 text-sm"
        />
        <Button
          onClick={() => {
            addTag(newTag);
            setNewTag("");
          }}
          size="sm"
          className="h-8"
        >
          Add
        </Button>
      </div>
    </div>
  );
};
