from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
from datetime import datetime

class Report(Base):
    __tablename__ = 'reports'

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(255), default="Unknown Endpoint")
    risk_level = Column(String(50))
    summary = Column(Text)
    companies_found = Column(String(500))  # Stored as a comma-separated string
    dark_patterns_found = Column(String(500)) # Stores extracted sneaky elements/patterns
    timestamp = Column(DateTime, default=datetime.utcnow)