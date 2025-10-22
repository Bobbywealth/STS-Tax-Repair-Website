import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Clock } from "lucide-react";
import { useState } from "react";

interface Article {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  lastUpdated: string;
}

interface KnowledgeBaseCardProps {
  articles: Article[];
  onSelectArticle?: (id: string) => void;
}

export function KnowledgeBaseCard({ articles, onSelectArticle }: KnowledgeBaseCardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Knowledge Base</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-articles"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="hover-elevate cursor-pointer"
              onClick={() => onSelectArticle?.(article.id)}
              data-testid={`article-${article.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{article.title}</h4>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {article.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{article.excerpt}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Updated {article.lastUpdated}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
