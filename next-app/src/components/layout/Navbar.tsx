import { Button } from "@/components/ui/button"
import { LucideCommand } from "lucide-react"

export function Navbar() {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b px-6">
      <div className="flex items-center gap-2">
        <LucideCommand className="h-6 w-6" />
        <span className="text-xl font-bold">ModernApp</span>
      </div>
      <nav className="flex items-center gap-6">
        <a href="#" className="text-sm font-medium hover:underline underlines-offset-4">Home</a>
        <a href="#" className="text-sm font-medium hover:underline underlines-offset-4">Features</a>
        <a href="#" className="text-sm font-medium hover:underline underlines-offset-4">Docs</a>
        <Button variant="outline" size="sm">Get Started</Button>
      </nav>
    </header>
  )
}
