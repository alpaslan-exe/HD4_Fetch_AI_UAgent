#!/usr/bin/env python3
"""
Database initialization script
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from config import config

def init_db():
    """Initialize the database and create tables"""
    print("Connecting to PostgreSQL database...")
    
    # Connect to PostgreSQL server
    conn = psycopg2.connect(
        dbname='postgres',  # Connect to default postgres database first
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        host=config.DB_HOST,
        port=config.DB_PORT
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Create database if it doesn't exist
    cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{config.DB_NAME}';")
    exists = cursor.fetchone()
    if not exists:
        cursor.execute(f"CREATE DATABASE {config.DB_NAME};")
        print(f"Database {config.DB_NAME} created successfully.")
    else:
        print(f"Database {config.DB_NAME} already exists.")
    
    cursor.close()
    conn.close()
    
    # Connect to the specific database
    conn = psycopg2.connect(
        dbname=config.DB_NAME,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        host=config.DB_HOST,
        port=config.DB_PORT
    )
    cursor = conn.cursor()
    
    # Read schema from schema.sql file
    with open('schema.sql', 'r') as schema_file:
        schema_sql = schema_file.read()
    
    # Execute schema
    cursor.execute(schema_sql)
    conn.commit()
    
    print("Database tables created successfully.")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    init_db()