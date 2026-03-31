from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# MySQL Connection String Setup
# ⚠️ Make sure to replace 'PASSWORD' below with your actual root password!
URL_DATABASE = "mysql+pymysql://root:6+ characters@localhost/dark_pattern_db"

# Create the SQLAlchemy engine
engine = create_engine(URL_DATABASE)

# Define the DB Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for object relational mapping mapping 
Base = declarative_base()

# Database Dependency Injection yield
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()