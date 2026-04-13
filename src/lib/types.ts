export interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: number;
  expandedContent?: string;
}

export type IdeaFilter = {
  search: string;
  tags: string[];
};
