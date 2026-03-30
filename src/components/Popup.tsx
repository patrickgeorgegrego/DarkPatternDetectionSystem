import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { LucideSearch, LucideShieldCheck, LucideShieldAlert, LucideInfo, LucideSparkles, LucideTriangleAlert } from "lucide-react"

type RiskLevel = "None" | "Low" | "Medium" | "High"

export function Popup() {
  const [loading, setLoading] = useState(false)
  const [patterns, setPatterns] = useState<string[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("None")

  const sendMessageToActiveTab = (action: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (typeof chrome === "undefined" || !chrome.tabs) {
        // Fallback for development outside of extension
        setTimeout(() => {
          if (action === "scan") resolve({ patterns: ["Fake urgency", "Hidden fees"] })
          else resolve({ summary: "Mock privacy summary for development.", risk_level: "Medium" })
        }, 1000)
        return
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError.message)
            } else {
              resolve(response)
            }
          })
        } else {
          reject("No active tab found")
        }
      })
    })
  }

  const handleScan = async () => {
    setLoading(true)
    setPatterns([])
    setRiskLevel("None")
    
    try {
      const response = await sendMessageToActiveTab("scan")
      if (response && response.patterns) {
        setPatterns(response.patterns)
        const count = response.patterns.filter((p: string) => !p.includes("No obvious")).length
        if (count >= 3) setRiskLevel("High")
        else if (count >= 1) setRiskLevel("Medium")
        else setRiskLevel("Low")
      }
    } catch (error) {
      console.error("Scan error:", error)
      setPatterns(["Error: Could not connect to the page."])
    } finally {
      setLoading(false)
    }
  }

  const handleSummarize = async () => {
    setLoading(true)
    setSummary(null)
    
    try {
      const response = await sendMessageToActiveTab("summarize")
      if (response && response.summary) {
        setSummary(response.summary)
        if (response.risk_level) setRiskLevel(response.risk_level as RiskLevel)
      }
    } catch (error) {
      console.error("Summarize error:", error)
      setSummary("Error: Could not retrieve policy summary.")
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case "High": return "bg-red-500/10 text-red-500 border-red-500/20"
      case "Medium": return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "Low": return "bg-green-500/10 text-green-500 border-green-500/20"
      default: return "bg-muted text-muted-foreground border-transparent"
    }
  }

  const getBadgeVariant = (pattern: string) => {
    if (pattern.includes("Error")) return "destructive"
    if (pattern.includes("No obvious")) return "outline"
    return "secondary"
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-[380px] p-2 bg-background font-sans"
    >
      <Card className="border-none shadow-xl overflow-hidden ring-1 ring-border/50">
        <CardHeader className="space-y-1 pb-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <LucideShieldAlert className="h-5 w-5" />
              </div>
              Dark Pattern Detector
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">PRO</Badge>
          </div>
          <CardDescription className="text-xs font-medium text-muted-foreground/70">
            Advanced real-time digital protection system.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="grid gap-5 pt-5">
          <div className="grid grid-cols-2 gap-3">
            <Button 
                variant={loading ? "secondary" : "default"}
                size="sm" 
                className="w-full gap-2 font-semibold shadow-sm" 
                onClick={handleScan}
                disabled={loading}
            >
              <LucideSearch className={`h-4 w-4 ${loading ? 'animate-bounce' : ''}`} />
              {loading ? "Scanning..." : "Scan Page"}
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2 border-primary/20 hover:bg-primary/5 font-semibold"
                onClick={handleSummarize}
                disabled={loading}
            >
              <LucideSparkles className="h-4 w-4 text-primary" />
              Summarize
            </Button>
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                <LucideInfo className="h-4 w-4" />
                Findings
              </div>
              <AnimatePresence>
                {riskLevel !== "None" && !loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm ${getRiskColor(riskLevel)}`}
                  >
                    <LucideTriangleAlert className="h-3 w-3" />
                    Risk: {riskLevel}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <ScrollArea className="h-[140px] w-full rounded-xl border bg-muted/10 p-3 shadow-inner">
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  <div className="w-full space-y-2">
                    <Skeleton className="h-6 w-3/4 rounded-full" />
                    <Skeleton className="h-6 w-full rounded-full" />
                    <Skeleton className="h-6 w-1/2 rounded-full" />
                  </div>
                ) : patterns.length > 0 ? (
                  patterns.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Badge 
                        variant={getBadgeVariant(p)}
                        className="px-2 py-1 text-[11px] font-medium leading-none tracking-tight shadow-sm"
                      >
                        {p}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex h-[110px] w-full items-center justify-center text-xs text-muted-foreground/50 font-medium italic">
                    Ready to scan for patterns...
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <AnimatePresence>
            {summary && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`space-y-2 rounded-xl border p-4 shadow-sm ${getRiskColor(riskLevel)}`}
              >
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-tight">
                  <LucideShieldCheck className="h-4 w-4" />
                  Security Insight
                </div>
                <p className="text-xs leading-relaxed font-medium opacity-90">
                  {summary}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="pt-2 pb-4 bg-muted/10">
          <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] text-center w-full">
            Dark Pattern Detector Engine v4.0
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
