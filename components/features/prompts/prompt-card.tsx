"use client"

import { Brain, Edit2, Trash2, Copy, Globe, Lock, Star, PlusCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Prompt } from "@/lib/types"

interface PromptCardProps {
  prompt: Prompt
  onEdit: (prompt: Prompt) => void
  onDelete: (prompt: Prompt) => void
  onUse: (prompt: Prompt) => void
  onClone?: (prompt: Prompt) => void
  onToggleFavorite?: (prompt: Prompt) => void
}

export function PromptCard({ prompt, onEdit, onDelete, onUse, onClone, onToggleFavorite }: PromptCardProps) {
  const categoryColors: Record<string, string> = {
    essay: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    quiz: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    project: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    discussion: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    default: "bg-muted text-muted-foreground",
  }

  return (
    <Card className="group relative overflow-hidden border-2 p-5 transition-all hover:border-primary/50 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ai-accent)]/10">
          <Brain className="h-5 w-5 text-[var(--ai-accent)]" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <span className="sr-only">Actions</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onClone && (
              <DropdownMenuItem onClick={() => onClone(prompt)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Clone
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onUse(prompt)}>
              <Copy className="mr-2 h-4 w-4" />
              Use Prompt
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(prompt)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(prompt)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-lg font-semibold leading-tight">{prompt.title}</h3>
          {prompt.is_public ? (
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${prompt.is_favorite ? "text-yellow-500" : "text-muted-foreground"}`}
              onClick={() => onToggleFavorite(prompt)}
            >
              <Star className="h-4 w-4" fill={prompt.is_favorite ? "currentColor" : "none"} />
            </Button>
          )}
        </div>

        <Badge className={categoryColors[prompt.category] || categoryColors.default} variant="secondary">
          {prompt.category}
        </Badge>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {prompt.description || prompt.prompt_text.substring(0, 100)}
        </p>

        {prompt.variables && prompt.variables.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {prompt.variables.slice(0, 3).map((variable) => (
              <Badge key={variable} variant="outline" className="text-xs font-mono">
                {`{{${variable}}}`}
              </Badge>
            ))}
            {prompt.variables.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{prompt.variables.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {prompt.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
            ))}
            {prompt.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs">+{prompt.tags.length - 4}</Badge>
            )}
          </div>
        )}

        <div className="mt-2 text-xs text-muted-foreground">
          Used {prompt.use_count || 0} times
        </div>
      </div>

      <Button
        variant="ghost"
        className="mt-4 w-full justify-center text-primary hover:text-primary"
        onClick={() => onUse(prompt)}
      >
        Use this prompt
      </Button>
    </Card>
  )
}
