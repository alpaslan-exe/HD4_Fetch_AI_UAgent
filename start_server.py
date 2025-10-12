#!/usr/bin/env python3
"""
Start the AI Agent Backend server
"""
import os
import sys
from contextlib import contextmanager
import psycopg2
from backend import setup_database
from config import config

def check_db_connection():
    """Check if we can connect to the database"""
    try:
        conn = psycopg2.connect(
            dbname='postgres',  # Connect to default postgres database first
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            host=config.DB_HOST,
            port=config.DB_PORT
        )
        conn.close()
        return True
    except psycopg2.OperationalError:
        return False

def main():
    print("Starting AI Agent Backend server...")
    
    # Check if database is available
    if not check_db_connection():
        print("❌ Cannot connect to PostgreSQL database.")
        print(f"Make sure PostgreSQL is running on {config.DB_HOST}:{config.DB_PORT}")
        print("You can start PostgreSQL with: sudo systemctl start postgresql")
        print("Or if using Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres")
        print("⚠️  Starting server without database access - some features will be unavailable")
    else:
        print("✅ Database connection successful")
        
        # Setup database tables
        print("Setting up database tables...")
        from backend import setup_database
        setup_database()
        print("✅ Database tables created successfully")
    
    # Start the FastAPI server
    import uvicorn
    print("🚀 Starting FastAPI server on http://0.0.0.0:8000")
    print("Press Ctrl+C to stop the server")
    
    uvicorn.run(
        "backend:app", 
        host="0.0.0.0", 
        port=8000,
        reload=True if config.DEBUG else False
    )

if __name__ == "__main__":
    main()