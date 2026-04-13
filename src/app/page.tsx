"use client"

import * as React from "react"
import { Search, BrainCircuit, Filter, X } from "lucide-react"
import { Idea, IdeaFilter } from "@/lib/types"
import { IdeaCard } from "@/components/idea-card"
import { IdeaForm } from "@/components/idea-form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function ThinkBoardPage() {
  const [ideas, setIdeas] = React.useState<Idea[]>([])
  const [filter, setFilter] = React.useState<IdeaFilter>({ search: "", tags: [] })
  const [mounted, setMounted] = React.useState(false)

  // Hydration and Persistence
  React.useEffect(() => {
    const saved = localStorage.getItem("thinkboard-ideas")
    if (saved) {
      try {
        setIdeas(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load ideas", e)
      }
    }
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (mounted) {
      localStorage.setItem("thinkboard-ideas", JSON.stringify(ideas))
    }
  }, [ideas, mounted])

  const handleCreateIdea = (data: Omit<Idea, "id" | "createdAt">) => {
    const newIdea: Idea = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    setIdeas([newIdea, ...ideas])
  }

  const handleDeleteIdea = (id: string) => {
    setIdeas(ideas.filter((i) => i.id !== id))
  }

  const handleUpdateIdea = (updated: Idea) => {
    setIdeas(ideas.map((i) => (i.id === updated.id ? updated : i)))
  }

  const allTags = Array.from(new Set(ideas.flatMap((i) => i.tags))).sort()

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      idea.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      idea.description.toLowerCase().includes(filter.search.toLowerCase())
    const matchesTags =
      filter.tags.length === 0 || filter.tags.every((tag) => idea.tags.includes(tag))
    return matchesSearch && matchesTags
  })

  const toggleTagFilter = (tag: string) => {
    setFilter((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl shadow-md">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold font-headline hidden sm:block tracking-tight text-primary">
              ThinkBoard
            </h1>
          </div>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search thoughts..."
              className="pl-10 bg-muted/50 border-none h-10 ring-offset-background focus-visible:ring-1 focus-visible:ring-primary"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>

          <IdeaForm onSubmit={handleCreateIdea} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Filters */}
          <aside className="lg:w-64 flex-shrink-0 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                  <Filter className="h-3.5 w-3.5" />
                  Filter by Tags
                </h3>
                {filter.tags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter({ ...filter, tags: [] })}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.length > 0 ? (
                  allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filter.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:border-primary px-3 py-1"
                      onClick={() => toggleTagFilter(tag)}
                    >
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No tags yet.</p>
                )}
              </div>
            </div>

            <Separator className="bg-border/40" />

            <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
              <h4 className="text-sm font-semibold text-primary mb-2">Pro Tip</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use the AI Idea Expander to turn a simple spark into a full-fledged concept. Just click "Expand Idea" on any card!
              </p>
            </div>
          </aside>

          {/* Content */}
          <section className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-headline">
                {filter.search || filter.tags.length > 0 ? "Results" : "My Thoughts"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredIdeas.length})
                </span>
              </h2>
            </div>

            {filteredIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onDelete={handleDeleteIdea}
                    onUpdate={handleUpdateIdea}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/50 rounded-2xl border border-dashed border-border/50">
                <div className="bg-muted p-4 rounded-full">
                  <BrainCircuit className="h-10 w-10 text-muted-foreground opacity-20" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">No ideas found</h3>
                  <p className="text-muted-foreground max-w-sm">
                    {ideas.length === 0
                      ? "Your board is empty. Start by capturing your first brilliant thought!"
                      : "Try adjusting your search or filters to find what you're looking for."}
                  </p>
                </div>
                {ideas.length > 0 && (
                  <Button variant="outline" onClick={() => setFilter({ search: "", tags: [] })}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
