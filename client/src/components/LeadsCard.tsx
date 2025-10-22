import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: "New" | "Contacted" | "Qualified" | "Converted" | "Lost";
  source: string;
  created: string;
}

const stageColors = {
  New: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Contacted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Qualified: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Converted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Lost: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

interface LeadsCardProps {
  leads: Lead[];
  onConvertLead?: (id: string) => void;
}

export function LeadsCard({ leads, onConvertLead }: LeadsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Recent Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card key={lead.id} className="hover-elevate" data-testid={`lead-${lead.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1">{lead.name}</h4>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>{lead.email}</div>
                        <div>{lead.phone}</div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className={stageColors[lead.stage]}>
                          {lead.stage}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {lead.source}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {lead.stage === "Qualified" && (
                    <Button
                      size="sm"
                      onClick={() => onConvertLead?.(lead.id)}
                      data-testid={`button-convert-${lead.id}`}
                    >
                      Convert
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
