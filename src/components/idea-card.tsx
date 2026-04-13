"use client"

import * as React from "react"
import { Sparkles, Trash2, Edit2, Copy, Calendar, Tag, Loader2, Check, X, Maximize2, ArrowLeftRight } from "lucide-react"
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
  
  // What are we viewing in the card body?
  const [viewing, setViewing] = React.useState<'original' | 'ai'>('original')
  
  // Card Edit State
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState(idea.title)
  // We need to edit the currently viewed content
  const [editContent, setEditContent] = React.useState("")
  
  // Modal State
  const [showModal, setShowModal] = React.useState(false)
  const [isEditingModal, setIsEditingModal] = React.useState(false)
  const [editExpanded, setEditExpanded] = React.useState("")
  
  const [errorMsg, setErrorMsg] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const [copiedModal, setCopiedModal] = React.useState(false)

  // Sync state if idea changes
  React.useEffect(() => {
    setEditTitle(idea.title)
  }, [idea.title])

  React.useEffect(() => {
    if (viewing === 'ai' && idea.expandedContent) {
       setEditContent(idea.expandedContent)
    } else {
       setEditContent(idea.description)
    }
  }, [viewing, idea])

  const handleExpand = async () => {
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
      setViewing('ai')
    } catch (error) {
      console.error("AI expansion failed", error)
      setErrorMsg("Failed to expand! Check if GEMINI_API_KEY is correctly added to .env")
    } finally {
      setIsExpanding(false)
    }
  }

  const handleSaveCardEdit = () => {
    if (viewing === 'original') {
      onUpdate({ ...idea, title: editTitle, description: editContent })
    } else {
      onUpdate({ ...idea, title: editTitle, expandedContent: editContent })
    }
    setIsEditing(false)
  }

  const handleSaveModalEdit = () => {
    if (viewing === 'original') {
      onUpdate({ ...idea, description: editExpanded })
    } else {
      onUpdate({ ...idea, expandedContent: editExpanded })
    }
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

  const openModal = () => {
    setEditExpanded(viewing === 'original' ? idea.description : (idea.expandedContent || ""))
    setIsEditingModal(false)
    setShowModal(true)
  }

  // Determine what text to show in the card
  const activeContent = viewing === 'original' ? idea.description : idea.expandedContent

  return (
    <>
      <Card className="idea-card-hover group flex flex-col h-[360px] overflow-hidden border-border/50 relative bg-card">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 w-full">
               {isEditing ? (
                 <Input 
                   value={editTitle} 
                   onChange={(e) => setEditTitle(e.target.value)} 
                   className="mb-2 font-headline text-lg w-full"
                   placeholder="Idea title"
                 />
               ) : (
                 <CardTitle className="text-xl font-headline text-primary line-clamp-2">
                   {idea.title} 
                   {idea.expandedContent && viewing === 'ai' && <span className="text-xs ml-2 bg-primary/20 text-primary px-2 py-1 rounded-full align-middle whitespace-nowrap">✨ AI View</span>}
                 </CardTitle>
               )}
            </div>
          </div>
          {!isEditing && (
            <CardDescription className="flex items-center gap-2 text-xs mt-1">
              <Calendar className="h-3 w-3" />
              {format(idea.createdAt, "MMM d, yyyy")}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto px-6 py-0 custom-scrollbar mb-2 relative">
          {isEditing ? (
            <div className="flex flex-col gap-2 h-full pb-2">
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit content..."
                className="flex-1 w-full p-3 text-sm rounded-md border border-input bg-background shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none min-h-[140px]"
              />
              <div className="flex gap-2 justify-end mt-1">
                 <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                   <X className="h-4 w-4 mr-1"/> Cancel
                 </Button>
                 <Button size="sm" onClick={handleSaveCardEdit}>
                   <Check className="h-4 w-4 mr-1"/> Save
                 </Button>
              </div>
            </div>
          ) : (
            <p className="text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap pb-2">
              {activeContent}
            </p>
          )}

          {errorMsg && (
            <div className="text-xs text-destructive font-medium bg-destructive/10 p-2 mt-2 rounded-md border border-destructive/20 flex items-center gap-2">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}
        </CardContent>

        {!isEditing && (
          <div className="shrink-0 px-6 pb-2 pt-1 flex items-center justify-between border-t border-border/20 bg-muted/20 gap-2">
             <div className="flex items-center space-x-1 -ml-2">
                <Button title="Copy Text" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={() => handleCopy(activeContent || "")}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button title="Edit Content" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button title="Delete Idea" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={() => onDelete(idea.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
             </div>
             
             {idea.expandedContent && (
               <Button 
                 title="Toggle Format" 
                 variant="ghost" 
                 size="sm" 
                 className="text-xs gap-1.5 h-8 font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0" 
                 onClick={() => setViewing(viewing === 'ai' ? 'original' : 'ai')}
               >
                 <ArrowLeftRight className="h-3 w-3" />
                 {viewing === 'ai' ? 'Switch to Original' : 'Switch to AI'}
               </Button>
             )}
          </div>
        )}
        
        {!isEditing && (
          <CardFooter className="pt-0 pb-4 mt-2 shrink-0 px-6">
            <Button
              variant="default"
              size="sm"
              className={cn(
                 "w-full gap-2 font-medium transition-all",
                 idea.expandedContent ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={idea.expandedContent ? openModal : handleExpand}
              disabled={isExpanding}
            >
              {isExpanding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : idea.expandedContent ? (
                viewing === 'ai' ? (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    Maximize Expanded AI Idea
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    Maximize Original Idea
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

      <Dialog open={showModal} onOpenChange={(val) => {
        if (!val) setIsEditingModal(false); // Reset edit state if modal is closed
        setShowModal(val);
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col items-start translate-y-[-50%] p-6">
          <DialogHeader className="w-full relative shrink-0 border-b border-border/50 pb-4">
            <DialogTitle className="text-2xl font-headline text-primary flex items-start gap-2 pr-28">
               {viewing === 'ai' ? <Sparkles className="h-6 w-6 shrink-0 mt-0.5 text-primary" /> : <Tag className="h-6 w-6 shrink-0 mt-0.5" />}
              <span>{idea.title} <span className="font-light text-muted-foreground ml-1">| {viewing === 'ai' ? 'AI Insights' : 'Original'}</span></span>
            </DialogTitle>
            
            <div className="absolute right-6 top-0 flex items-center gap-1">
              {!isEditingModal && (
                <>
                  <Button title="Copy Content" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={() => handleCopy(editExpanded, true)}>
                    {copiedModal ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button title="Edit Content" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsEditingModal(true)}>
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
                  placeholder="Edit content..."
                  className="flex-1 w-full p-4 text-base leading-relaxed rounded-md border border-input bg-background/50 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none min-h-[400px]"
                />
                <div className="flex gap-2 justify-end mt-2">
                   <Button size="sm" variant="outline" onClick={() => setIsEditingModal(false)}>
                     <X className="h-4 w-4 mr-1"/> Cancel
                   </Button>
                   <Button size="sm" onClick={handleSaveModalEdit}>
                     <Check className="h-4 w-4 mr-1"/> Save Changes
                   </Button>
                </div>
              </div>
            ) : (
              <div className="text-base text-foreground/90 leading-loose whitespace-pre-wrap pb-8">
                {editExpanded}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
