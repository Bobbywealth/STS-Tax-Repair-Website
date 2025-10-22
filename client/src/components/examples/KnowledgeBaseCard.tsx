import { KnowledgeBaseCard } from '../KnowledgeBaseCard';

export default function KnowledgeBaseCardExample() {
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
  ];

  return (
    <div className="p-4 max-w-2xl">
      <KnowledgeBaseCard 
        articles={mockArticles}
        onSelectArticle={(id) => console.log('Selected article:', id)}
      />
    </div>
  );
}
