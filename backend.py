from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import hashlib
import jwt
import os
from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
import psycopg2
from psycopg2.extras import RealDictCursor
import re
from config import config

# Initialize FastAPI app
app = FastAPI(title="AI Agent Backend", description="Backend service for AI agents with user management", version="1.0.0")

# Security scheme for authentication
security = HTTPBearer()

# Pydantic models for request/response
class UserSignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

# Database connection
class Database:
    def __init__(self):
        self.connection_params = {
            "dbname": config.DB_NAME,
            "user": config.DB_USER,
            "password": config.DB_PASSWORD,
            "host": config.DB_HOST,
            "port": config.DB_PORT,
        }
    
    def get_connection(self):
        return psycopg2.connect(**self.connection_params)

# Initialize database
db = Database()

# Helper functions
def hash_password(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict) -> str:
    """Create a JWT access token"""
    SECRET_KEY = config.JWT_SECRET_KEY
    ALGORITHM = config.JWT_ALGORITHM
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify and decode a JWT token"""
    SECRET_KEY = config.JWT_SECRET_KEY
    ALGORITHM = config.JWT_ALGORITHM
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to get current user from token"""
    token = credentials.credentials
    user_data = verify_token(token)
    return user_data

# Database setup - Create tables if they don't exist
def setup_database():
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(256) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create agents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agents (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                user_id INTEGER REFERENCES users(id),
                config JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create agent logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_logs (
                id SERIAL PRIMARY KEY,
                agent_id INTEGER REFERENCES agents(id),
                log_level VARCHAR(20),
                message TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except psycopg2.OperationalError as e:
        print(f"Database setup failed: {e}")
        print("Make sure PostgreSQL is running and the database exists.")
        print("You can create the database using: python init_db.py")
        return False

# Initialize database tables (only if DB is available)
db_setup_success = setup_database()
if not db_setup_success:
    print("⚠️  Database not available. Some features may not work until database is set up and running.")

# User signup endpoint
@app.post("/signup", response_model=UserResponse, status_code=201)
async def signup(user_data: UserSignupRequest):
    """Create a new user account"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", 
                   (user_data.username, user_data.email))
    existing_user = cursor.fetchone()
    
    if existing_user:
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already registered"
        )
    
    # Hash the password
    password_hash = hash_password(user_data.password)
    
    # Insert the new user
    cursor.execute("""
        INSERT INTO users (username, email, password_hash)
        VALUES (%s, %s, %s)
        RETURNING id, username, email, created_at
    """, (user_data.username, user_data.email, password_hash))
    
    new_user = cursor.fetchone()
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return new_user

# User login endpoint
@app.post("/login", response_model=TokenResponse)
async def login(user_data: UserLoginRequest):
    """Authenticate user and return access token"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Find user by username
    cursor.execute("SELECT id, username, email, password_hash FROM users WHERE username = %s", 
                   (user_data.username,))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"user_id": user['id'], "username": user['username']})
    
    return {"access_token": access_token, "token_type": "bearer"}

# Get current user info
@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user's information"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT id, username, email, created_at FROM users WHERE id = %s", 
                   (current_user['user_id'],))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# UAgent example
# Create an example agent that can be managed by users
agent = Agent(
    name="backend_agent",
    port=8001,
    seed=config.BACKEND_AGENT_SEED,
    endpoint=["http://127.0.0.1:8001/submit"],
)

fund_agent_if_low(agent.wallet.address())

class AgentMessage(Model):
    content: str
    user_id: int

@agent.on_message(model=AgentMessage)
async def handle_agent_message(ctx: Context, sender: str, msg: AgentMessage):
    """Handle messages sent to the agent"""
    ctx.logger.info(f"Received message from {sender}: {msg.content}")
    
    # You can add custom logic here to process the message
    # For example, store it in the database or trigger other actions
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Log the agent interaction
    cursor.execute("""
        INSERT INTO agent_logs (agent_id, log_level, message)
        VALUES (%s, %s, %s)
    """, (1, 'INFO', f"Message from user {msg.user_id}: {msg.content}"))
    
    conn.commit()
    cursor.close()
    conn.close()

@app.get("/agents/{agent_id}/logs")
async def get_agent_logs(agent_id: int, current_user: dict = Depends(get_current_user)):
    """Get logs for a specific agent"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Verify that the agent belongs to the current user
    cursor.execute("SELECT id FROM agents WHERE id = %s AND user_id = %s", 
                   (agent_id, current_user['user_id']))
    agent = cursor.fetchone()
    
    if not agent:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Agent not found or access denied")
    
    # Get logs for the agent
    cursor.execute("""
        SELECT id, log_level, message, timestamp 
        FROM agent_logs 
        WHERE agent_id = %s 
        ORDER BY timestamp DESC
    """, (agent_id,))
    
    logs = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return logs

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)