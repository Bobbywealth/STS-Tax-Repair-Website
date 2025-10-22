import { KnowledgeBaseCard } from "@/components/KnowledgeBaseCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Knowledge() {
  const mockArticles = [
    {
      id: "1",
      title: "How to Upload Your W-2",
      category: "Documents",
      excerpt: "Step-by-step guide for uploading your W-2 forms securely to your client portal.",
      lastUpdated: "Oct 15, 2024",
    },
    {
      id: "2",
      title: "Understanding Refund Status",
      category: "Process",
      excerpt: "Learn what each refund status means and what to expect at each stage.",
      lastUpdated: "Oct 10, 2024",
    },
    {
      id: "3",
      title: "Updating Account Information",
      category: "Account",
      excerpt: "Instructions for updating your contact information and preferences.",
      lastUpdated: "Oct 5, 2024",
    },
    {
      id: "4",
      title: "Required Tax Documents Checklist",
      category: "Documents",
      excerpt: "Complete list of documents needed for your tax refund process.",
      lastUpdated: "Oct 1, 2024",
    },
    {
      id: "5",
      title: "Common Tax Filing Questions",
      category: "FAQ",
      excerpt: "Answers to frequently asked questions about tax filing and refunds.",
      lastUpdated: "Sep 28, 2024",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">Browse help articles and tutorials for clients and staff.</p>
        </div>
        <Button data-testid="button-add-article">
          <Plus className="h-4 w-4 mr-2" />
          Add Article
        </Button>
      </div>

      <div className="max-w-4xl">
        <KnowledgeBaseCard
          articles={mockArticles}
          onSelectArticle={(id) => console.log('Selected article:', id)}
        />
      </div>
    </div>
  );
}
