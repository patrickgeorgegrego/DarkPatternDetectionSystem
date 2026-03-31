import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, RefreshCw } from 'lucide-react';
import { api } from './lib/api';

import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Progress } from "./components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./components/ui/accordion";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";

export default function App() {
  const [isLive, setIsLive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const [patterns, setPatterns] = useState<string[]>([]);
  const [riskLevel, setRiskLevel] = useState<"Low" | "Medium" | "High" | "None">("None");
  const [summary, setSummary] = useState<string>("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [typedSummary, setTypedSummary] = useState("");

  useEffect(() => {
    api.health().then(() => setIsLive(true)).catch(() => setIsLive(false));
    api.history().then(res => setHistory(res)).catch(() => console.error("History fetch failed"));
  }, []);

  useEffect(() => {
    if (!summary) return;
    let i = 0;
    setTypedSummary("");
    const interval = setInterval(() => {
      setTypedSummary((prev) => prev + summary.charAt(i));
      i++;
      if (i > summary.length - 1) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [summary]);

  const handleScanAndSummarize = async () => {
    setIsScanning(true);
    setErrorMsg("");
    setPatterns([]);
    setSummary("");
    setTypedSummary("");
    setCompanies([]);
    setRiskLevel("None");

    try {
      let domData = { text: "We use cookies to track and sell to third-party. Fake countdown starts now! Pre-checked terms.", detected_elements: ["urgency timer", "button: no thanks"] };
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const res = await chrome.tabs.sendMessage(tab.id, { action: "getDomData" });
          if (res) domData = res;
        }
      } catch (e) {
        console.warn("Chrome Extension context missing. Using fallback DOM sample data.");
      }

      const [scanRes, sumRes] = await Promise.all([
        api.scan({ detected_elements: domData.detected_elements }),
        api.summarize({ text: domData.text })
      ]);

      setPatterns(scanRes.patterns || []);
      
      const sumText = Array.isArray(sumRes.summary) ? sumRes.summary.join(' ') : sumRes.summary;
      setSummary(sumText);
      
      const combinedRisk = scanRes.risk_level === "High" || sumRes.risk_level === "High" ? "High" : 
                           scanRes.risk_level === "Medium" || sumRes.risk_level === "Medium" ? "Medium" : "Low";
      setRiskLevel(combinedRisk);

      if (sumRes.companies_found) setCompanies(sumRes.companies_found);

    } catch (e: any) {
      setErrorMsg("Backend Offline: Please ensure the Python server is running on port 3000.");
    } finally {
      setIsScanning(false);
    }
  };

  const riskColorMap = {
    Low: "bg-green-500",
    Medium: "bg-yellow-500",
    High: "bg-red-500",
    None: "bg-slate-200"
  };

  const riskScoreTextMap = {
    High: 100,
    Medium: 50,
    Low: 10,
    None: 0
  };

  return (
    <div className="w-[400px] bg-slate-50 min-h-[500px] flex flex-col relative text-slate-800 font-sans shadow-xl">
      
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-blue-500/10 flex items-center justify-center backdrop-blur-[1px]"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-16 h-16 rounded-full bg-blue-500/50 flex items-center justify-center shadow-lg"
            >
              <RefreshCw className="animate-spin text-blue-900" size={32} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 p-4 shrink-0 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="text-slate-800" size={20} />
          <h1 className="font-semibold text-md tracking-tight">DarkPattern Scanner</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium tracking-wider">LIVE</span>
          <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`}></div>
        </div>
      </header>

      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        
        {errorMsg && (
          <Alert variant="destructive">
            <Activity className="h-4 w-4" />
            <AlertTitle>Network Error</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleScanAndSummarize} disabled={isScanning} className="w-full h-12 text-md shadow-sm font-semibold tracking-wide bg-slate-900 hover:bg-slate-800 text-white rounded-lg">
          {isScanning ? 'Auditing Page Context...' : 'Scan Now'}
        </Button>

        {riskLevel !== "None" && !isScanning && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4">
            
            <div className="flex flex-col items-center justify-center gap-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Threat Level</span>
              <span className={`text-3xl tracking-tighter font-black ${riskLevel === 'High' ? 'text-red-500' : riskLevel === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                {riskLevel}
              </span>
              <Progress value={riskScoreTextMap[riskLevel]} className={`h-2.5 mt-2 w-full [&>div]:${riskColorMap[riskLevel]}`} />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <h3 className="text-xs font-bold mb-3 uppercase tracking-wider text-slate-400">NLP Privacy Summary</h3>
               <p className="text-sm text-slate-700 leading-relaxed min-h-[40px] font-medium">
                 {typedSummary}
                 {typedSummary !== summary && <span className="animate-pulse opacity-50 block inline ml-1 inline-block w-2 bg-slate-400 h-4 translate-y-1"></span>}
               </p>
            </div>

            {patterns.length > 0 && (
              <Accordion className="w-full bg-white rounded-xl border border-slate-200 shadow-sm px-4">
                <AccordionItem value="patterns" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">Deceptive Elements</span>
                      <Badge variant="destructive" className="ml-1 bg-red-100 text-red-700 hover:bg-red-200 cursor-default border-none shadow-none">{patterns.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600 pb-2">
                      {patterns.map((p, i) => <li key={i} className="font-medium capitalize">{p}</li>)}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {companies && companies.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">Data Handlers Found</span>
                <div className="flex flex-wrap gap-2">
                  {companies.map((c, i) => (
                    <Badge key={i} className="whitespace-nowrap bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none border-none border text-xs cursor-default px-2.5 py-1">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

      </div>

      <footer className="mt-auto bg-slate-100 border-t border-slate-200 p-4 shrink-0 transition-all">
        <h4 className="text-[10px] font-black text-slate-400 mb-2.5 tracking-widest">RECENT ACTIVITY</h4>
        <div className="flex flex-col gap-2">
          {history.length > 0 ? history.slice(0, 3).map((h, i) => (
             <div key={i} className="flex justify-between items-center bg-white border border-slate-200 rounded-md py-1.5 px-2.5 shadow-sm">
               <span className="truncate text-xs font-medium text-slate-600 max-w-[200px]" title={h.url || 'Unknown'}>{h.url || 'Unknown Endpoint'}</span>
               <Badge className={`text-[9px] uppercase px-1.5 shadow-none border-none py-0 pb-0.5 ${h.risk_level === 'High' ? 'bg-red-100 text-red-700' : h.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{h.risk_level || 'N/A'}</Badge>
             </div>
          )) : (
            <span className="text-xs text-slate-400 italic">No history logged yet.</span>
          )}
        </div>
      </footer>

    </div>
  );
}
