"use client"

import * as React from "react"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ tags, onChange, placeholder = "Add a tag..." }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")

  const handleAddTag = () => {
    const trimmed = inputValue.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
      setInputValue("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-destructive transition-colors"
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" size="icon" variant="outline" onClick={handleAddTag}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
