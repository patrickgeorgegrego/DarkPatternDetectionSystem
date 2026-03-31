from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Union, Dict, Any, Optional
import json

import models
from database import engine, get_db
from nlp_engine import PrivacyAnalyzer

app = FastAPI(title="Dark Pattern Detection API")

# Intelligently creates the MySQL Tables if they don't natively exist yet
models.Base.metadata.create_all(bind=engine)

# Setup CORS to allow chrome extension origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_message():
    print("\n============================================================")
    print("Backend running on http://localhost:8000. Member 1: Please point api.ts to this URL.")
    print("============================================================\n")

# Request Payloads
class AnalysisRequest(BaseModel):
    url: Optional[str] = "Unknown URL"
    text: str

class DetectRequest(BaseModel):
    url: Optional[str] = "Unknown URL"
    detected_elements: List[Union[str, Dict[str, Any]]]

@app.post("/summarize")
def summarize_text(request: AnalysisRequest, db: Session = Depends(get_db)):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    # Analyze text
    analyzer = PrivacyAnalyzer()
    results = analyzer.analyze(request.text)
    
    # Push into MySQL database
    db_report = models.Report(
        url=request.url,
        risk_level=results["risk_level"],
        summary=json.dumps(results["summary"]),
        companies_found=",".join(results.get("companies_found", [])),
        dark_patterns_found=""
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return {
        "summary": results["summary"],
        "risk_level": results["risk_level"]
    }

@app.post("/scan")
def scan_elements(request: DetectRequest, db: Session = Depends(get_db)):
    # Spin up the AI component to parse UI features
    analyzer = PrivacyAnalyzer()
    unique_patterns = analyzer.analyze_ui_elements(request.detected_elements)
    
    risk_level = "High" if unique_patterns else "Low"
    
    # Store into DB correctly mapped to new columns
    db_report = models.Report(
        url=request.url,
        risk_level=risk_level,
        summary="UI Scan Only",
        companies_found="",
        dark_patterns_found=json.dumps(unique_patterns)
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return {
        "patterns": unique_patterns,
        "risk_level": risk_level
    }

@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    # Grab the 5 most recent records and return
    reports = db.query(models.Report).order_by(models.Report.timestamp.desc()).limit(5).all()
    return reports

@app.get("/health")
def health_check():
    return {"status": "online"}

# Launch command representation:
# uvicorn main:app --reload --port 3000
