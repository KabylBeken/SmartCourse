"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PromptFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  category: string
  onCategoryChange: (category: string) => void
  visibility: "all" | "mine" | "public" | "favorites" | "templates"
  onVisibilityChange: (visibility: "all" | "mine" | "public" | "favorites" | "templates") => void
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "essay", label: "Essay" },
  { value: "quiz", label: "Quiz" },
  { value: "project", label: "Project" },
  { value: "discussion", label: "Discussion" },
  { value: "coding", label: "Coding" },
  { value: "research", label: "Research" },
]

export function PromptFilters({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  visibility,
  onVisibilityChange,
}: PromptFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-3">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={visibility} onValueChange={(v) => onVisibilityChange(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mine">My Prompts</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
