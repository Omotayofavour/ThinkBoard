"use client"

import * as React from "react"
import { Sparkles, Trash2, Calendar, Tag, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Idea } from "@/lib/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { expandIdeaWithAI } from "@/ai/flows/expand-idea-with-ai"
import { cn } from "@/lib/utils"

interface IdeaCardProps {
  idea: Idea
  onDelete: (id: string) => void
  onUpdate: (idea: Idea) => void
}

export function IdeaCard({ idea, onDelete, onUpdate }: IdeaCardProps) {
  const [isExpanding, setIsExpanding] = React.useState(false)
  const [showFullExpanded, setShowFullExpanded] = React.useState(false)

  const handleExpand = async () => {
    if (idea.expandedContent) {
      setShowFullExpanded(!showFullExpanded)
      return
    }

    setIsExpanding(true)
    try {
      const result = await expandIdeaWithAI({
        title: idea.title,
        description: idea.description,
      })
      onUpdate({ ...idea, expandedContent: result.expandedIdea })
      setShowFullExpanded(true)
    } catch (error) {
      console.error("AI expansion failed", error)
    } finally {
      setIsExpanding(false)
    }
  }

  return (
    <Card className="idea-card-hover group flex flex-col h-full overflow-hidden border-border/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-xl font-headline text-primary line-clamp-2">
            {idea.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(idea.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3" />
          {format(idea.createdAt, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {idea.description}
        </p>

        {idea.expandedContent && (
          <div className={cn(
            "rounded-md bg-muted/30 p-4 border border-dashed border-primary/20 relative overflow-hidden transition-all duration-300",
            showFullExpanded ? "max-h-full" : "max-h-24"
          )}>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              AI Insights
            </div>
            <p className="text-xs text-muted-foreground italic leading-loose">
              {idea.expandedContent}
            </p>
            {!showFullExpanded && <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-background/50 to-transparent" />}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 pt-2">
          {idea.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-2 font-normal">
              <Tag className="h-2.5 w-2.5 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t border-border/20 bg-muted/5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/5 font-medium"
          onClick={handleExpand}
          disabled={isExpanding}
        >
          {isExpanding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </>
          ) : idea.expandedContent ? (
            showFullExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Insights
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show Insights
              </>
            )
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Expand Idea
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
