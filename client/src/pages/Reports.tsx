import { RefundChart } from "@/components/RefundChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function Reports() {
  const refundData = [
    { month: "Jan", refunds: 45 },
    { month: "Feb", refunds: 52 },
    { month: "Mar", refunds: 68 },
    { month: "Apr", refunds: 89 },
    { month: "May", refunds: 75 },
    { month: "Jun", refunds: 92 },
  ];

  const staffData = [
    { name: "Sarah Johnson", completed: 45 },
    { name: "Michael Chen", completed: 38 },
    { name: "Lisa Anderson", completed: 42 },
    { name: "John Smith", completed: 35 },
  ];

  const sourceData = [
    { name: "Referral", value: 35 },
    { name: "Web", value: 28 },
    { name: "Ad", value: 22 },
    { name: "Walk-in", value: 15 },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Analyze performance metrics and export data.</p>
        </div>
        <Button data-testid="button-export-report">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RefundChart data={refundData} />

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Staff Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={staffData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar 
                  dataKey="completed" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Client Source Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-md bg-muted">
                <span className="text-sm font-medium">Average Processing Time</span>
                <span className="text-2xl font-bold">12 days</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-md bg-muted">
                <span className="text-sm font-medium">Client Satisfaction Rate</span>
                <span className="text-2xl font-bold">94%</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-md bg-muted">
                <span className="text-sm font-medium">Documents Pending Review</span>
                <span className="text-2xl font-bold">23</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-md bg-muted">
                <span className="text-sm font-medium">Active Staff Members</span>
                <span className="text-2xl font-bold">12</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
