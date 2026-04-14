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
import { Editor } from "@/components/ui/editor"
import { Download } from "lucide-react"

import { TagInput } from "@/components/tag-input"

interface IdeaCardProps {
  idea: Idea
  viewMode?: 'card' | 'list'
  onDelete: (id: string) => void
  onUpdate: (idea: Idea) => void
}

export function IdeaCard({ idea, viewMode = 'card', onDelete, onUpdate }: IdeaCardProps) {
  const [isExpanding, setIsExpanding] = React.useState(false)
  
  // What are we viewing in the card body?
  const [viewing, setViewing] = React.useState<'original' | 'ai'>('original')
  
  // Card Edit State
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState(idea.title)
  const [editContent, setEditContent] = React.useState("")
  const [editTags, setEditTags] = React.useState<string[]>(idea.tags || [])
  
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
    setEditTags(idea.tags || [])
  }, [idea.title, idea.tags])

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorMsg(`Failed to expand: ${errorMessage}`)
    } finally {
      setIsExpanding(false)
    }
  }

  const handleSaveCardEdit = () => {
    if (viewing === 'original') {
      onUpdate({ ...idea, title: editTitle, description: editContent, tags: editTags })
    } else {
      onUpdate({ ...idea, title: editTitle, expandedContent: editContent, tags: editTags })
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

  const handleExportPDF = async () => {
    try {
      // Dynamically import to keep bundle small
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      // Add a slight delay to ensure fonts/icons are loaded
      const element = document.getElementById(`idea-card-${idea.id}`);
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2] 
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${idea.title ? idea.title.replace(/\s+/g, '_') : 'ThinkBoard_Idea'}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    }
  }

  // Determine what text to show in the card
  const activeContent = viewing === 'original' ? idea.description : idea.expandedContent

  return (
    <>
      {viewMode === 'list' && !isEditing ? (
        <Card 
          id={`idea-card-${idea.id}`} 
          className="idea-card-hover group flex flex-row items-center h-[72px] overflow-hidden border-border/50 bg-card cursor-pointer hover:border-primary/50 transition-colors shrink-0" 
          onClick={openModal}
        >
          <div className="flex items-center space-x-4 pl-6 pr-4 w-full">
             <div className="flex-1 w-full flex flex-col gap-0.5 max-w-[60%]">
               <CardTitle className="text-base font-headline text-primary line-clamp-1 truncate">
                 {idea.title} 
                 {idea.expandedContent && viewing === 'ai' && <span className="text-[10px] ml-2 bg-primary/20 text-primary px-1.5 py-0.5 rounded-full align-middle whitespace-nowrap hidden sm:inline">✨ AI View</span>}
               </CardTitle>
               <CardDescription className="text-xs truncate max-w-full hidden md:block">
                 {activeContent?.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
               </CardDescription>
             </div>
             
             <div className="flex items-center gap-x-4 text-xs text-muted-foreground ml-auto shrink-0 pr-2">
                {idea.tags && idea.tags.length > 0 && (
                  <div className="hidden lg:flex items-center gap-1">
                    {idea.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="font-medium bg-muted/50 px-2 py-0.5 rounded-sm truncate max-w-[100px]">
                        #{tag}
                      </span>
                    ))}
                    {idea.tags.length > 2 && <span className="opacity-50">+{idea.tags.length - 2}</span>}
                  </div>
                )}
                <span className="flex items-center gap-1 shrink-0">
                  <Calendar className="h-3 w-3" />
                  {format(idea.createdAt, "MMM d")}
                </span>
             </div>
             
             <div className="flex items-center gap-x-1 shrink-0 z-10 relative bg-background/50 md:bg-transparent rounded-md p-1 md:p-0 backdrop-blur-md md:backdrop-blur-none transition-all">
               {idea.expandedContent && (
                 <Button 
                   title={viewing === 'ai' ? 'Switch to Original' : 'Switch to AI'}
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 flex text-muted-foreground hover:text-primary transition-colors" 
                   onClick={(e) => { 
                     e.stopPropagation(); 
                     setViewing(viewing === 'ai' ? 'original' : 'ai') 
                   }}
                 >
                   <ArrowLeftRight className="h-4 w-4" />
                 </Button>
               )}
               <Button 
                 title="Edit Tags & Content" 
                 variant="ghost" 
                 size="icon" 
                 className="h-8 w-8 flex text-muted-foreground hover:text-primary transition-colors" 
                 onClick={(e) => { 
                   e.stopPropagation(); 
                   setIsEditing(true); 
                 }}
               >
                 <Edit2 className="h-4 w-4" />
               </Button>
               <Button 
                 title="Expand Details" 
                 variant="ghost" 
                 size="icon" 
                 className="h-8 w-8 text-primary opacity-50 group-hover:opacity-100 transition-opacity" 
                 onClick={(e) => { 
                   e.stopPropagation(); 
                   openModal(); 
                 }}
               >
                 <Maximize2 className="h-4 w-4" />
               </Button>
             </div>
          </div>
        </Card>
      ) : (
        <Card id={`idea-card-${idea.id}`} className="idea-card-hover group flex flex-col h-[360px] overflow-hidden border-border/50 relative bg-card">
          <CardHeader className="pb-3 shrink-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 w-full">
                 {isEditing ? (
                   <div className="flex flex-col gap-2 w-full pr-2">
                     <Input 
                       value={editTitle} 
                       onChange={(e) => setEditTitle(e.target.value)} 
                       className="font-headline text-lg w-full"
                       placeholder="Idea title"
                     />
                     <TagInput 
                       tags={editTags} 
                       onChange={setEditTags} 
                       placeholder="Edit tags..." 
                     />
                   </div>
                 ) : (
                   <CardTitle className="text-xl font-headline text-primary line-clamp-2">
                     {idea.title} 
                     {idea.expandedContent && viewing === 'ai' && <span className="text-xs ml-2 bg-primary/20 text-primary px-2 py-1 rounded-full align-middle whitespace-nowrap">✨ AI View</span>}
                   </CardTitle>
                 )}
              </div>
            </div>
          {!isEditing && (
            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1">
              {idea.tags && idea.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 font-medium bg-muted/30 px-1.5 py-0.5 rounded-sm">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(idea.createdAt, "MMM d, yyyy")}
              </span>
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto px-6 py-0 custom-scrollbar mb-2 relative">
          {isEditing ? (
            <div className="flex flex-col gap-2 h-full pb-2">
              <Editor 
                value={editContent} 
                onChange={setEditContent} 
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
            <div 
              className="text-[15px] text-foreground/90 leading-relaxed pb-2 prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: activeContent || "" }}
            />
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
                <Button title="Export to PDF" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500 transition-colors" onClick={handleExportPDF}>
                  <Download className="h-4 w-4" />
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
      )}

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
                <Editor 
                  value={editExpanded} 
                  onChange={setEditExpanded} 
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
              <div 
                className="text-base text-foreground/90 leading-loose pb-8 prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: editExpanded }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
