"use client"

import * as React from "react"
import { Sparkles, Trash2, Edit2, Copy, Calendar, Tag, Loader2, Check, X, Maximize2 } from "lucide-react"
import { format } from "date-fns"
import { Idea } from "@/lib/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { expandIdeaWithAI } from "@/ai/flows/expand-idea-with-ai"
import { cn } from "@/lib/utils"

interface IdeaCardProps {
  idea: Idea
  onDelete: (id: string) => void
  onUpdate: (idea: Idea) => void
}

export function IdeaCard({ idea, onDelete, onUpdate }: IdeaCardProps) {
  const [isExpanding, setIsExpanding] = React.useState(false)
  
  // Card Edit State
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState(idea.title)
  const [editDescription, setEditDescription] = React.useState(idea.description)
  
  // Modal State
  const [showModal, setShowModal] = React.useState(false)
  const [isEditingModal, setIsEditingModal] = React.useState(false)
  const [editExpanded, setEditExpanded] = React.useState(idea.expandedContent || "")
  
  const [errorMsg, setErrorMsg] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const [copiedModal, setCopiedModal] = React.useState(false)

  // Sync state if idea changes via other components
  React.useEffect(() => {
    setEditTitle(idea.title)
    setEditDescription(idea.description)
    if (idea.expandedContent) setEditExpanded(idea.expandedContent)
  }, [idea])

  const handleExpand = async () => {
    if (idea.expandedContent) {
      setShowModal(true)
      return
    }

    setIsExpanding(true)
    setErrorMsg("")
    try {
      const result = await expandIdeaWithAI({
        title: idea.title,
        description: idea.description,
      })
      if (!result || !result.expandedIdea) {
         throw new Error("No response from AI")
      }
      onUpdate({ ...idea, expandedContent: result.expandedIdea })
      setShowModal(true)
    } catch (error) {
      console.error("AI expansion failed", error)
      setErrorMsg("Failed to expand! Check if GEMINI_API_KEY is correctly added to .env")
    } finally {
      setIsExpanding(false)
    }
  }

  const handleSaveCardEdit = () => {
    onUpdate({ ...idea, title: editTitle, description: editDescription })
    setIsEditing(false)
  }

  const handleSaveModalEdit = () => {
    onUpdate({ ...idea, expandedContent: editExpanded })
    setIsEditingModal(false)
  }
  
  const handleCopy = (text: string, isModal = false) => {
    navigator.clipboard.writeText(text)
    if (isModal) {
      setCopiedModal(true)
      setTimeout(() => setCopiedModal(false), 2000)
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
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
                 <CardTitle className="text-xl font-headline text-primary line-clamp-2 pr-[70px]">
                   {idea.title} 
                 </CardTitle>
               )}
            </div>
            
            {!isEditing && (
              <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm">
                <Button title="Copy Idea" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleCopy(idea.description)}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button title="Edit Idea" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button title="Delete Idea" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(idea.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {!isEditing && (
            <CardDescription className="flex items-center gap-2 text-xs mt-1">
              <Calendar className="h-3 w-3" />
              {format(idea.createdAt, "MMM d, yyyy")}
              {idea.expandedContent && <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">✨ Expanded</span>}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 space-y-4">
          {isEditing ? (
            <div className="flex flex-col gap-2 h-full">
              <textarea 
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Edit the original description..."
                className="flex-1 w-full min-h-[150px] p-3 text-sm rounded-md border border-input bg-background/50 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              <div className="flex gap-2 justify-end mt-2">
                 <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                   <X className="h-4 w-4 mr-1"/> Cancel
                 </Button>
                 <Button size="sm" onClick={handleSaveCardEdit}>
                   <Check className="h-4 w-4 mr-1"/> Save
                 </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-[8]">
                {idea.description}
              </p>
              
              {idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 mt-auto">
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
                 "w-full gap-2 text-primary font-medium transition-colors hover:text-primary hover:bg-primary/5",
                 idea.expandedContent ? "bg-primary/5 hover:bg-primary/10" : ""
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
                <>
                  <Maximize2 className="h-4 w-4" />
                  View Expanded AI Idea
                </>
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

      <Dialog open={showModal} onOpenChange={(val) => {
        if (!val) setIsEditingModal(false); // Reset edit state if modal is closed
        setShowModal(val);
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col items-start translate-y-[-50%] p-6">
          <DialogHeader className="w-full relative shrink-0 border-b border-border/50 pb-4">
            <DialogTitle className="text-2xl font-headline text-primary flex items-start gap-2 pr-28">
              <Sparkles className="h-6 w-6 shrink-0 mt-0.5" />
              <span>{idea.title} <span className="font-light text-muted-foreground ml-1">| AI Insights</span></span>
            </DialogTitle>
            
            <div className="absolute right-6 top-0 flex items-center gap-1">
              {!isEditingModal && (
                <>
                  <Button title="Copy Insights" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleCopy(idea.expandedContent || "", true)}>
                    {copiedModal ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button title="Edit Insights" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setIsEditingModal(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 w-full overflow-y-auto py-2 pr-2 mt-4 custom-scrollbar">
            {isEditingModal ? (
              <div className="flex flex-col gap-3 h-full min-h-[400px]">
                <textarea 
                  value={editExpanded}
                  onChange={(e) => setEditExpanded(e.target.value)}
                  placeholder="Edit the AI Insights..."
                  className="flex-1 w-full p-4 text-base leading-relaxed rounded-md border border-input bg-background/50 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none min-h-[400px]"
                />
                <div className="flex gap-2 justify-end mt-2">
                   <Button size="sm" variant="outline" onClick={() => setIsEditingModal(false)}>
                     <X className="h-4 w-4 mr-1"/> Cancel
                   </Button>
                   <Button size="sm" onClick={handleSaveModalEdit}>
                     <Check className="h-4 w-4 mr-1"/> Save Insights
                   </Button>
                </div>
              </div>
            ) : (
              <div className="text-base text-foreground/90 leading-loose whitespace-pre-wrap">
                {idea.expandedContent}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
