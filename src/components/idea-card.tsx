"use client"

import * as React from "react"
import { Sparkles, Trash2, Edit2, Calendar, Tag, Loader2, ArrowLeftRight, Check, X } from "lucide-react"
import { format } from "date-fns"
import { Idea } from "@/lib/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { expandIdeaWithAI } from "@/ai/flows/expand-idea-with-ai"
import { cn } from "@/lib/utils"

interface IdeaCardProps {
  idea: Idea
  onDelete: (id: string) => void
  onUpdate: (idea: Idea) => void
}

export function IdeaCard({ idea, onDelete, onUpdate }: IdeaCardProps) {
  const [isExpanding, setIsExpanding] = React.useState(false)
  
  // Toggling between original and expanded
  const [isViewingExpanded, setIsViewingExpanded] = React.useState(!!idea.expandedContent)
  
  // Editing state
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState(idea.title)
  const [editContent, setEditContent] = React.useState("")
  
  // Error state
  const [errorMsg, setErrorMsg] = React.useState("")

  React.useEffect(() => {
    setEditTitle(idea.title)
    if (isViewingExpanded && idea.expandedContent) {
      setEditContent(idea.expandedContent)
    } else {
      setEditContent(idea.description)
    }
  }, [isEditing, isViewingExpanded, idea])

  const handleExpand = async () => {
    if (idea.expandedContent) {
      setIsViewingExpanded(!isViewingExpanded)
      return
    }

    setIsExpanding(true)
    setErrorMsg("") // clear previous errors
    
    try {
      const result = await expandIdeaWithAI({
        title: idea.title,
        description: idea.description,
      })
      if (!result || !result.expandedIdea) {
         throw new Error("No response from AI")
      }
      onUpdate({ ...idea, expandedContent: result.expandedIdea })
      setIsViewingExpanded(true)
    } catch (error) {
      console.error("AI expansion failed", error)
      setErrorMsg("Failed to expand! Check if GEMINI_API_KEY is correctly added to .env")
    } finally {
      setIsExpanding(false)
    }
  }

  const handleSaveEdit = () => {
    if (isViewingExpanded && idea.expandedContent) {
       onUpdate({ ...idea, title: editTitle, expandedContent: editContent })
    } else {
       onUpdate({ ...idea, title: editTitle, description: editContent })
    }
    setIsEditing(false)
  }

  return (
    <Card className="idea-card-hover group flex flex-col h-full overflow-hidden border-border/50 relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
             {isEditing ? (
               <Input 
                 value={editTitle} 
                 onChange={(e) => setEditTitle(e.target.value)} 
                 className="mb-2 font-headline text-lg"
                 placeholder="Idea title"
               />
             ) : (
               <CardTitle className="text-xl font-headline text-primary line-clamp-2 pr-12">
                 {idea.title} {isViewingExpanded && idea.expandedContent && <span className="text-xs ml-2 bg-primary/10 text-primary px-2 py-1 rounded-full align-middle whitespace-nowrap">✨ AI Expanded</span>}
               </CardTitle>
             )}
          </div>
          
          {!isEditing && (
            <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm">
              <Button
                title="Edit Idea"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                title="Delete Idea"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(idea.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {!isEditing && (
          <CardDescription className="flex items-center gap-2 text-xs mt-1">
            <Calendar className="h-3 w-3" />
            {format(idea.createdAt, "MMM d, yyyy")}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {isEditing ? (
          <div className="flex flex-col gap-2 h-full">
            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit the description or expanded content..."
              className="flex-1 w-full min-h-[150px] p-3 text-sm rounded-md border border-input bg-background/50 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
            <div className="flex gap-2 justify-end mt-2">
               <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                 <X className="h-4 w-4 mr-1"/> Cancel
               </Button>
               <Button size="sm" onClick={handleSaveEdit}>
                 <Check className="h-4 w-4 mr-1"/> Save
               </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {isViewingExpanded && idea.expandedContent 
                ? idea.expandedContent 
                : idea.description}
            </p>
            
            {!isViewingExpanded && idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {idea.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                    <Tag className="h-2.5 w-2.5 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}

        {errorMsg && (
          <div className="text-xs text-destructive font-medium bg-destructive/10 p-3 rounded-md border border-destructive/20 flex items-center gap-2">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}
      </CardContent>
      
      {!isEditing && (
        <CardFooter className="pt-2 border-t border-border/20 bg-muted/5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
               "w-full gap-2 text-primary font-medium transition-colors",
               isViewingExpanded ? "bg-primary/5 hover:bg-primary/10" : "hover:text-primary hover:bg-primary/5"
            )}
            onClick={handleExpand}
            disabled={isExpanding}
          >
            {isExpanding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : idea.expandedContent ? (
              isViewingExpanded ? (
                <>
                  <ArrowLeftRight className="h-4 w-4" />
                  View Original Idea
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  View Expanded AI Idea
                </>
              )
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Expand Idea with AI
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
