import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Zap, Shield, Box } from "lucide-react"

const features = [
  { title: "Modular", description: "Clean and scalable project structure.", icon: Box, badge: "New" },
  { title: "Fast", description: "Powered by Vite and optimized components.", icon: Zap, badge: "Stable" },
  { title: "Styled", description: "Tailwind CSS v4 with shadcn/ui.", icon: LayoutDashboard, badge: "Modern" },
  { title: "Safe", description: "Full TypeScript support for all components.", icon: Shield, badge: "Secure" },
]

export function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8 text-left">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to your new React + TypeScript project.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.title}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {feature.title}
                </CardTitle>
                <feature.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
                <div className="mt-4">
                  <Badge variant="secondary">{feature.badge}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
