from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from PyPDF2 import PdfReader
from io import BytesIO
from typing import Optional, List
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

# PDF bite-file to text converter
def convertBiteFileToText(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    return text

# Course code extractor
def extractCourseCodesFromPDF(text: str) -> List[str]:
    text = re.sub(r"([A-Z]{2,6})\s?(\d{3,4}[A-Z]?)\s*/\s*([A-Z]{2,6})\s?(\d{3,4}[A-Z]?)",
                  r"\1 \2, \3 \4", text)
    text = re.sub(r"([A-Z]{2,6})\s+(\d{3,4}[A-Z]?)\s*&\s*(\d{3,4}[A-Z]?)",
                  r"\1 \2, \1 \3", text)
    text = re.sub(r"\s+", " ", text)

    pattern = re.compile(r"\b([A-Z]{2,6})\s?(\d{3,4}[A-Z]?)\b")
    courses = {f"{d} {n}" for d, n in pattern.findall(text)}

    def sort_key(code):
        dept, num = code.split()
        m = re.match(r"(\d+)", num)
        return (dept, int(m.group(1)) if m else 0, num)

    return sorted(courses, key=sort_key)

# Department mapping
def mapCourseDepartment(courseCodesList: List[str]) -> tuple:

    departments = ['Computer Science', 'Engineering', 'Mathematics',
                   'English', 'Economics', 'Statistics', 'Chemistry',
                   'Biology', 'Science', 'Physics', 'Geology',
                   'Health & Human Services']

    courses = courseCodesList['courses']

    fullDepartmentNames = []
    courseAcronyms = []
    courseNumbers = []

    for course in courses:
        courseSplit = course.split(' ')

        acronym = courseSplit[0]

        match acronym:
            case 'CIS' | 'CCM':
                fullName = departments[0] + ' department'
            case 'ECE' | 'ENGR':
                fullName = departments[1] + ' department'
            case 'MATH':
                fullName = departments[2] + ' department'
            case 'COMP':
                fullName = departments[3] + ' department'
            case 'ECON':
                fullName = departments[4] + ' department'
            case 'STAT':
                fullName = departments[5] + ' department'
            case 'CHEM':
                fullName = departments[6] + ' department'
            case 'BIOL':
                fullName = departments[7] + ' department'
            case 'ASTR':
                fullName = departments[8] + ' department'
            case 'PHYS':
                fullName = departments[9] + ' department'
            case 'GEOL':
                fullName = departments[10] + ' department'
            case 'HHS':
                fullName = departments[11] + ' department'
            case _:
                fullName = 'Unknown department'

        fullDepartmentNames.append(fullName)
        courseAcronyms.append(acronym)
        courseNumbers.append(courseSplit[1])

    return fullDepartmentNames, courseAcronyms, courseNumbers

# Initialize FastAPI app
app = FastAPI(title="AI Agent Backend", description="Backend service for AI agents with user management",
              version="1.0.0")

# Security scheme for authentication
security = HTTPBearer()


# Pydantic models for request/response

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserLoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    user: dict

class TokenRefreshRequest(BaseModel):
    refreshToken: str

class UserLogoutRequest(BaseModel):
    refreshToken: str

class UserUpdateRequest(BaseModel):
    displayName: Optional[str] = None
    password: Optional[dict] = None  # { "current": "current-pass", "next": "new-pass" }

class UserProfileResponse(BaseModel):
    id: str
    email: str
    displayName: str
    createdAt: datetime
    updatedAt: datetime

# Semester models
class SemesterRequest(BaseModel):
    name: str
    year: int
    position: int

class ClassRequest(BaseModel):
    name: str
    credits: int
    professor: Optional[str] = None
    rateMyProfessorUrl: Optional[str] = None
    notes: Optional[str] = None

class SemesterClassResponse(BaseModel):
    id: str
    name: str
    credits: int
    professor: Optional[str] = None
    rateMyProfessorUrl: Optional[str] = None
    notes: Optional[str] = None

class SemesterResponse(BaseModel):
    id: str
    name: str
    year: int
    position: int
    classes: Optional[list[SemesterClassResponse]] = None

class SemestersResponse(BaseModel):
    semesters: list[SemesterResponse]

# Professor models
class ProfessorCourseResponse(BaseModel):
    classId: str
    semesterId: str
    name: str
    year: int
    term: str

class ProfessorResponse(BaseModel):
    id: str
    name: str
    rateMyProfessorUrl: Optional[str] = None
    courses: list[ProfessorCourseResponse]

class ProfessorsResponse(BaseModel):
    professors: list[ProfessorResponse]

# Previous classes models
class PreviousClassRequest(BaseModel):
    name: str
    semester: str
    grade: str
    professor: str

class PreviousClassResponse(BaseModel):
    id: str
    name: str
    semester: str
    grade: str
    professor: str

class PreviousClassesResponse(BaseModel):
    courses: list[PreviousClassResponse]

# Upload models
class UploadRequest(BaseModel):
    type: str
    notes: Optional[str] = None

class UploadResponse(BaseModel):
    id: str
    type: str
    originalName: str
    contentType: str
    size: int
    uploadedAt: datetime
    url: str

class UploadsResponse(BaseModel):
    uploads: list[UploadResponse]

# Friend system models
class FriendRequestRequest(BaseModel):
    friendId: str
    message: Optional[str] = None

class FriendRequestResponse(BaseModel):
    id: str
    senderId: str
    receiverId: str
    senderDisplayName: str
    receiverDisplayName: str
    message: Optional[str] = None
    status: str
    createdAt: datetime
    updatedAt: datetime

class FriendRequestsResponse(BaseModel):
    requests: list[FriendRequestResponse]

class FriendResponse(BaseModel):
    id: str
    userId: str
    friendId: str
    displayName: str
    email: str
    status: str
    createdAt: datetime
    updatedAt: datetime

class FriendsResponse(BaseModel):
    friends: list[FriendResponse]

class ScheduleShareRequest(BaseModel):
    friendId: str
    canView: bool = True
    canEdit: bool = False
    expiresInDays: Optional[int] = None

class ScheduleShareResponse(BaseModel):
    id: str
    ownerId: str
    sharedWithId: str
    ownerDisplayName: str
    sharedWithDisplayName: str
    canView: bool
    canEdit: bool
    expiresAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

class ScheduleSharesResponse(BaseModel):
    shares: list[ScheduleShareResponse]

# Metadata models
class SemesterSequenceResponse(BaseModel):
    availableTerms: list[str]
    defaultStartYear: int

class GradeScaleResponse(BaseModel):
    grades: list[str]

# Error model
class ErrorResponse(BaseModel):
    error: dict


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

import uuid
from datetime import timedelta

def create_access_token(data: dict) -> str:
    """Create a JWT access token"""
    SECRET_KEY = config.JWT_SECRET_KEY
    ALGORITHM = config.JWT_ALGORITHM
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    SECRET_KEY = config.JWT_SECRET_KEY + "_refresh"  # Different secret for refresh tokens
    ALGORITHM = config.JWT_ALGORITHM
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)  # Refresh tokens expire in 30 days
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


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

def verify_refresh_token(token: str) -> dict:
    """Verify and decode a JWT refresh token"""
    SECRET_KEY = config.JWT_SECRET_KEY + "_refresh"
    ALGORITHM = config.JWT_ALGORITHM
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token",
        )

def store_refresh_token(user_id: int, token: str, expires_at: datetime):
    """Store refresh token in database"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES (%s, %s, %s)
    """, (user_id, token, expires_at))
    conn.commit()
    cursor.close()
    conn.close()

def revoke_refresh_token(token: str):
    """Revoke a refresh token"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE refresh_tokens SET revoked = TRUE WHERE token = %s
    """, (token,))
    conn.commit()
    cursor.close()
    conn.close()

def is_refresh_token_valid(token: str) -> bool:
    """Check if refresh token is valid and not revoked"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT revoked, expires_at FROM refresh_tokens 
        WHERE token = %s
    """, (token,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not result:
        return False
    
    revoked, expires_at = result
    if revoked or datetime.utcnow() > expires_at:
        return False
    
    return True

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
                display_name VARCHAR(100),
                role VARCHAR(20) DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create refresh tokens table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id SERIAL PRIMARY KEY,
                token VARCHAR(512) NOT NULL,
                user_id INTEGER REFERENCES users(id),
                expires_at TIMESTAMP NOT NULL,
                revoked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create semesters table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS semesters (
                id SERIAL PRIMARY KEY,
                semester_id VARCHAR(20) UNIQUE NOT NULL,  -- e.g. '2025-fall'
                name VARCHAR(50) NOT NULL,
                year INTEGER NOT NULL,
                position INTEGER,
                user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create classes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS classes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                credits INTEGER DEFAULT 0,
                professor VARCHAR(100),
                rate_my_professor_url VARCHAR(500),
                notes TEXT,
                semester_id INTEGER REFERENCES semesters(id),
                user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create previous classes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS previous_classes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                semester VARCHAR(100),
                grade VARCHAR(10),
                professor VARCHAR(100),
                user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create uploads table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS uploads (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                original_name VARCHAR(256) NOT NULL,
                content_type VARCHAR(100),
                size BIGINT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                url VARCHAR(512),
                user_id INTEGER REFERENCES users(id)
            );
        """)
        
        # Create friends table for friend relationships
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS friends (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                friend_id INTEGER REFERENCES users(id),
                status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected, blocked
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, friend_id)
            );
        """)
        
        # Create friend requests table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS friend_requests (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER REFERENCES users(id),
                receiver_id INTEGER REFERENCES users(id),
                message TEXT,
                status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected, cancelled
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(sender_id, receiver_id)
            );
        """)
        
        # Create schedule_shares table for schedule sharing permissions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schedule_shares (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER REFERENCES users(id),
                shared_with_id INTEGER REFERENCES users(id),
                can_view BOOLEAN DEFAULT TRUE,
                can_edit BOOLEAN DEFAULT FALSE,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(owner_id, shared_with_id)
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





@app.get("/api/friends", response_model=FriendsResponse)
async def list_friends(
    current_user: dict = Depends(get_current_user)
):
    """List all friends"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("""
            SELECT f.*, u.display_name, u.email
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = %s AND f.status = 'accepted'
            ORDER BY u.display_name
        """, (current_user['user_id'],))
        
        friends = cursor.fetchall()
        
        friend_list = []
        for friend in friends:
            friend_list.append(FriendResponse(
                id=str(friend['id']),
                userId=str(friend['user_id']),
                friendId=str(friend['friend_id']),
                displayName=friend['display_name'],
                email=friend['email'],
                status=friend['status'],
                createdAt=friend['created_at'],
                updatedAt=friend['updated_at']
            ))
        
        return FriendsResponse(friends=friend_list)
        
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/friends/{friendId}", response_model=dict)
async def remove_friend(
    friendId: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a friend"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if friendship exists
        cursor.execute("""
            SELECT id FROM friends 
            WHERE (user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s)
        """, (current_user['user_id'], int(friendId), int(friendId), current_user['user_id']))
        friendship = cursor.fetchone()
        
        if not friendship:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friendship not found"
            )
        
        # Remove friendship from both sides
        cursor.execute("""
            DELETE FROM friends 
            WHERE (user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s)
        """, (current_user['user_id'], int(friendId), int(friendId), current_user['user_id']))
        
        # Also remove any friend requests between these users
        cursor.execute("""
            DELETE FROM friend_requests 
            WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)
        """, (current_user['user_id'], int(friendId), int(friendId), current_user['user_id']))
        
        conn.commit()
        
        return {"message": "Friend removed successfully"}
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid friend ID"
        )
    finally:
        cursor.close()
        conn.close()

@app.get("/api/friends/requests", response_model=FriendRequestsResponse)
async def list_friend_requests(
    current_user: dict = Depends(get_current_user)
):
    """List all friend requests (sent and received)"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("""
            SELECT fr.*, 
                   u1.display_name as sender_display_name,
                   u2.display_name as receiver_display_name
            FROM friend_requests fr
            JOIN users u1 ON fr.sender_id = u1.id
            JOIN users u2 ON fr.receiver_id = u2.id
            WHERE fr.sender_id = %s OR fr.receiver_id = %s
            ORDER BY fr.created_at DESC
        """, (current_user['user_id'], current_user['user_id']))
        
        requests = cursor.fetchall()
        
        request_list = []
        for request in requests:
            request_list.append(FriendRequestResponse(
                id=str(request['id']),
                senderId=str(request['sender_id']),
                receiverId=str(request['receiver_id']),
                senderDisplayName=request['sender_display_name'],
                receiverDisplayName=request['receiver_display_name'],
                message=request['message'],
                status=request['status'],
                createdAt=request['created_at'],
                updatedAt=request['updated_at']
            ))
        
        return FriendRequestsResponse(requests=request_list)
        
    finally:
        cursor.close()
        conn.close()

# Friend system endpoints
@app.post("/api/friends/requests", response_model=FriendRequestResponse)
async def send_friend_request(
    request_data: FriendRequestRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a friend request to another user"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if trying to add yourself
        if str(current_user['user_id']) == request_data.friendId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send friend request to yourself"
            )
        
        # Check if user exists
        cursor.execute("SELECT id, display_name, email FROM users WHERE id = %s", 
                      (int(request_data.friendId),))
        friend = cursor.fetchone()
        
        if not friend:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if friend request already exists
        cursor.execute("""
            SELECT id, status FROM friend_requests 
            WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)
        """, (current_user['user_id'], int(request_data.friendId), 
              int(request_data.friendId), current_user['user_id']))
        existing_request = cursor.fetchone()
        
        if existing_request:
            if existing_request['status'] == 'accepted':
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Users are already friends"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Friend request already exists with status: {existing_request['status']}"
                )
        
        # Create friend request
        cursor.execute("""
            INSERT INTO friend_requests (sender_id, receiver_id, message, status)
            VALUES (%s, %s, %s, 'pending')
            RETURNING id, sender_id, receiver_id, message, status, created_at, updated_at
        """, (current_user['user_id'], int(request_data.friendId), 
              request_data.message, 'pending'))
        
        new_request = cursor.fetchone()
        conn.commit()
        
        # Get sender and receiver display names
        cursor.execute("SELECT display_name FROM users WHERE id = %s", (current_user['user_id'],))
        sender = cursor.fetchone()
        cursor.execute("SELECT display_name FROM users WHERE id = %s", (int(request_data.friendId),))
        receiver = cursor.fetchone()
        
        return FriendRequestResponse(
            id=str(new_request['id']),
            senderId=str(new_request['sender_id']),
            receiverId=str(new_request['receiver_id']),
            senderDisplayName=sender['display_name'] if sender else "Unknown",
            receiverDisplayName=receiver['display_name'] if receiver else "Unknown",
            message=new_request['message'],
            status=new_request['status'],
            createdAt=new_request['created_at'],
            updatedAt=new_request['updated_at']
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid friend ID"
        )
    finally:
        cursor.close()
        conn.close()

@app.post("/api/friends/requests/{requestId}/accept", response_model=FriendRequestResponse)
async def accept_friend_request(
    requestId: str,
    current_user: dict = Depends(get_current_user)
):
    """Accept a friend request"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if request exists and user is the receiver
        cursor.execute("""
            SELECT fr.*, u1.display_name as sender_name, u2.display_name as receiver_name
            FROM friend_requests fr
            JOIN users u1 ON fr.sender_id = u1.id
            JOIN users u2 ON fr.receiver_id = u2.id
            WHERE fr.id = %s AND fr.receiver_id = %s
        """, (int(requestId), current_user['user_id']))
        request = cursor.fetchone()
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend request not found or not authorized"
            )
        
        if request['status'] != 'pending':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Friend request is already {request['status']}"
            )
        
        # Update request status to accepted
        cursor.execute("""
            UPDATE friend_requests 
            SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, sender_id, receiver_id, message, status, created_at, updated_at
        """, (int(requestId),))
        
        updated_request = cursor.fetchone()
        
        # Create mutual friendship records
        cursor.execute("""
            INSERT INTO friends (user_id, friend_id, status)
            VALUES (%s, %s, 'accepted'), (%s, %s, 'accepted')
        """, (request['sender_id'], request['receiver_id'], 
              request['receiver_id'], request['sender_id']))
        
        conn.commit()
        
        return FriendRequestResponse(
            id=str(updated_request['id']),
            senderId=str(updated_request['sender_id']),
            receiverId=str(updated_request['receiver_id']),
            senderDisplayName=request['sender_name'],
            receiverDisplayName=request['receiver_name'],
            message=updated_request['message'],
            status=updated_request['status'],
            createdAt=updated_request['created_at'],
            updatedAt=updated_request['updated_at']
        )
        
    finally:
        cursor.close()
        conn.close()

@app.post("/api/friends/requests/{requestId}/reject", response_model=dict)
async def reject_friend_request(
    requestId: str,
    current_user: dict = Depends(get_current_user)
):
    """Reject a friend request"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if request exists and user is the receiver
        cursor.execute("""
            SELECT id FROM friend_requests 
            WHERE id = %s AND receiver_id = %s
        """, (int(requestId), current_user['user_id']))
        request = cursor.fetchone()
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend request not found or not authorized"
            )
        
        # Update request status to rejected
        cursor.execute("""
            UPDATE friend_requests 
            SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (int(requestId),))
        
        conn.commit()
        
        return {"message": "Friend request rejected successfully"}
        
    finally:
        cursor.close()
        conn.close()

@app.post("/api/friends/requests/{requestId}/cancel", response_model=dict)
async def cancel_friend_request(
    requestId: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a sent friend request"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if request exists and user is the sender
        cursor.execute("""
            SELECT id FROM friend_requests 
            WHERE id = %s AND sender_id = %s
        """, (int(requestId), current_user['user_id']))
        request = cursor.fetchone()
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend request not found or not authorized"
            )
        
        # Update request status to cancelled
        cursor.execute("""
            UPDATE friend_requests 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (int(requestId),))
        
        conn.commit()
        
        return {"message": "Friend request cancelled successfully"}
        
    finally:
        cursor.close()
        conn.close()


# User login endpoint
# Authentication endpoints for HD4 Scheduler
@app.post("/api/auth/login", response_model=UserLoginResponse)
async def login(user_data: UserLoginRequest):
    """Authenticate user and return access and refresh tokens"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Find user by email
    cursor.execute("SELECT id, username, email, password_hash, display_name, role FROM users WHERE email = %s", 
                   (user_data.email,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Create access and refresh tokens
    access_token_data = {"user_id": user['id'], "email": user['email']}
    refresh_token_data = {"user_id": user['id'], "email": user['email']}
    
    access_token = create_access_token(access_token_data)
    refresh_token = create_refresh_token(refresh_token_data)
    
    # Store refresh token in database
    expires_at = datetime.utcnow() + timedelta(days=30)
    store_refresh_token(user['id'], refresh_token, expires_at)
    
    user_response = {
        "id": str(user['id']),
        "email": user['email'],
        "displayName": user['display_name'] or user['username'],
        "role": user['role']
    }
    
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": user_response
    }



# HD4 Scheduler user endpoints
@app.get("/api/users/me", response_model=UserProfileResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile information"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT id, email, COALESCE(display_name, username) as display_name, 
               created_at, updated_at 
        FROM users WHERE id = %s
    """, (current_user['user_id'],))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserProfileResponse(
        id=str(user['id']),
        email=user['email'],
        displayName=user['display_name'],
        createdAt=user['created_at'],
        updatedAt=user['updated_at']
    )

@app.patch("/api/users/me", response_model=UserProfileResponse)
async def update_user_profile(
    update_data: UserUpdateRequest, 
    current_user: dict = Depends(get_current_user)
):
    """Update user profile information"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check if user exists
    cursor.execute("SELECT id, email, password_hash, username FROM users WHERE id = %s", 
                   (current_user['user_id'],))
    user = cursor.fetchone()
    
    if not user:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    updates = []
    params = []
    
    # Handle display name update
    if update_data.displayName is not None:
        updates.append("display_name = %s")
        params.append(update_data.displayName)
    
    # Handle password update
    if update_data.password is not None:
        current_password = update_data.password.get("current")
        new_password = update_data.password.get("next")
        
        if not current_password or not new_password:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=422, detail="Current and new password are required")
        
        # Verify current password
        if not verify_password(current_password, user['password_hash']):
            cursor.close()
            conn.close()
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Update password
        new_password_hash = hash_password(new_password)
        updates.append("password_hash = %s")
        params.append(new_password_hash)
    
    if not updates:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=422, detail="No updates provided")
    
    # Add updated_at timestamp
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(current_user['user_id'])  # For WHERE clause
    
    query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, email, COALESCE(display_name, username) as display_name, created_at, updated_at"
    cursor.execute(query, params)
    updated_user = cursor.fetchone()
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return UserProfileResponse(
        id=str(updated_user['id']),
        email=updated_user['email'],
        displayName=updated_user['display_name'],
        createdAt=updated_user['created_at'],
        updatedAt=updated_user['updated_at']
    )

@app.post("/api/auth/refresh", response_model=UserLoginResponse)
async def refresh_token(refresh_data: TokenRefreshRequest):
    """Refresh access token using refresh token"""
    refresh_token_str = refresh_data.refreshToken
    
    # Verify the refresh token
    if not is_refresh_token_valid(refresh_token_str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Get user info from refresh token
    token_data = verify_refresh_token(refresh_token_str)
    user_id = token_data.get("user_id")
    
    # Get user details from database
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT id, email, COALESCE(display_name, username) as display_name, role 
        FROM users WHERE id = %s
    """, (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Create new access token
    access_token_data = {"user_id": user['id'], "email": user['email']}
    access_token = create_access_token(access_token_data)
    
    # Generate new refresh token and revoke old one
    new_refresh_token = create_refresh_token({"user_id": user['id'], "email": user['email']})
    expires_at = datetime.utcnow() + timedelta(days=30)
    
    # Revoke old token and store new one
    revoke_refresh_token(refresh_token_str)
    store_refresh_token(user['id'], new_refresh_token, expires_at)
    
    user_response = {
        "id": str(user['id']),
        "email": user['email'],
        "displayName": user['display_name'],
        "role": user['role']
    }
    
    return {
        "accessToken": access_token,
        "refreshToken": new_refresh_token,
        "user": user_response
    }

@app.post("/api/auth/logout")
async def logout(logout_data: UserLogoutRequest):
    """Logout user and revoke refresh token"""
    refresh_token_str = logout_data.refreshToken
    revoke_refresh_token(refresh_token_str)
    return {"success": True}

# Friend system error handlers
@app.exception_handler(HTTPException)
async def friend_system_error_handler(request: Request, exc: HTTPException):
    """Global error handler for friend system"""
    # Handle friend system specific errors
    if request.url.path.startswith("/api/friends"):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"message": exc.detail}}
        )
    elif request.url.path.startswith("/api/schedule"):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"message": exc.detail}}
        )
    # Let the main error handler deal with other exceptions
    raise exc

# Friend search endpoint
@app.get("/api/friends/search", response_model=FriendsResponse)
async def search_friends(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """Search for friends by name or email"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Search for users that match the query and are friends
        cursor.execute("""
            SELECT u.id, u.display_name, u.email, f.status, f.created_at, f.updated_at
            FROM users u
            JOIN friends f ON (u.id = f.friend_id AND f.user_id = %s) 
                          OR (u.id = f.user_id AND f.friend_id = %s)
            WHERE (LOWER(u.display_name) LIKE LOWER(%s) 
                   OR LOWER(u.email) LIKE LOWER(%s)
                   OR LOWER(u.username) LIKE LOWER(%s))
            AND f.status = 'accepted'
            ORDER BY u.display_name
            LIMIT 20
        """, (current_user['user_id'], current_user['user_id'], 
              f"%{query}%", f"%{query}%", f"%{query}%"))
        
        results = cursor.fetchall()
        
        friend_list = []
        for result in results:
            friend_list.append(FriendResponse(
                id=str(result['id']),
                userId=str(result['id']),
                friendId=str(result['id']),
                displayName=result['display_name'],
                email=result['email'],
                status=result['status'],
                createdAt=result['created_at'],
                updatedAt=result['updated_at']
            ))
        
        return FriendsResponse(friends=friend_list)
        
    finally:
        cursor.close()
        conn.close()

# Schedule sharing endpoints
@app.post("/api/schedule/shares", response_model=ScheduleShareResponse)
async def create_schedule_share(
    share_data: ScheduleShareRequest,
    current_user: dict = Depends(get_current_user)
):
    """Share your schedule with a friend"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if trying to share with yourself
        if str(current_user['user_id']) == share_data.friendId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot share schedule with yourself"
            )
        
        # Check if friend exists and is actually a friend
        cursor.execute("""
            SELECT id, display_name FROM users 
            WHERE id = %s AND id IN (
                SELECT friend_id FROM friends 
                WHERE user_id = %s AND status = 'accepted'
                UNION
                SELECT user_id FROM friends 
                WHERE friend_id = %s AND status = 'accepted'
            )
        """, (int(share_data.friendId), current_user['user_id'], current_user['user_id']))
        
        friend = cursor.fetchone()
        
        if not friend:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend not found"
            )
        
        # Check if schedule share already exists
        cursor.execute("""
            SELECT id FROM schedule_shares 
            WHERE owner_id = %s AND shared_with_id = %s
        """, (current_user['user_id'], int(share_data.friendId)))
        
        existing_share = cursor.fetchone()
        
        if existing_share:
            # Update existing share
            expires_at = None
            if share_data.expiresInDays:
                expires_at = datetime.utcnow() + timedelta(days=share_data.expiresInDays)
            
            cursor.execute("""
                UPDATE schedule_shares 
                SET can_view = %s, can_edit = %s, expires_at = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, owner_id, shared_with_id, can_view, can_edit, expires_at, created_at, updated_at
            """, (share_data.canView, share_data.canEdit, expires_at, existing_share['id']))
        else:
            # Create new share
            expires_at = None
            if share_data.expiresInDays:
                expires_at = datetime.utcnow() + timedelta(days=share_data.expiresInDays)
            
            cursor.execute("""
                INSERT INTO schedule_shares (owner_id, shared_with_id, can_view, can_edit, expires_at)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, owner_id, shared_with_id, can_view, can_edit, expires_at, created_at, updated_at
            """, (current_user['user_id'], int(share_data.friendId), 
                  share_data.canView, share_data.canEdit, expires_at))
        
        share = cursor.fetchone()
        conn.commit()
        
        # Get owner and shared with display names
        cursor.execute("SELECT display_name FROM users WHERE id = %s", (current_user['user_id'],))
        owner = cursor.fetchone()
        cursor.execute("SELECT display_name FROM users WHERE id = %s", (int(share_data.friendId),))
        shared_with = cursor.fetchone()
        
        return ScheduleShareResponse(
            id=str(share['id']),
            ownerId=str(share['owner_id']),
            sharedWithId=str(share['shared_with_id']),
            ownerDisplayName=owner['display_name'] if owner else "Unknown",
            sharedWithDisplayName=shared_with['display_name'] if shared_with else "Unknown",
            canView=share['can_view'],
            canEdit=share['can_edit'],
            expiresAt=share['expires_at'],
            createdAt=share['created_at'],
            updatedAt=share['updated_at']
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid friend ID"
        )
    finally:
        cursor.close()
        conn.close()

@app.get("/api/schedule/shares", response_model=ScheduleSharesResponse)
async def list_schedule_shares(
    current_user: dict = Depends(get_current_user)
):
    """List all schedule shares (both owned and shared with you)"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("""
            SELECT ss.*, 
                   u1.display_name as owner_display_name,
                   u2.display_name as shared_with_display_name
            FROM schedule_shares ss
            JOIN users u1 ON ss.owner_id = u1.id
            JOIN users u2 ON ss.shared_with_id = u2.id
            WHERE ss.owner_id = %s OR ss.shared_with_id = %s
            ORDER BY ss.created_at DESC
        """, (current_user['user_id'], current_user['user_id']))
        
        shares = cursor.fetchall()
        
        share_list = []
        for share in shares:
            share_list.append(ScheduleShareResponse(
                id=str(share['id']),
                ownerId=str(share['owner_id']),
                sharedWithId=str(share['shared_with_id']),
                ownerDisplayName=share['owner_display_name'],
                sharedWithDisplayName=share['shared_with_display_name'],
                canView=share['can_view'],
                canEdit=share['can_edit'],
                expiresAt=share['expires_at'],
                createdAt=share['created_at'],
                updatedAt=share['updated_at']
            ))
        
        return ScheduleSharesResponse(shares=share_list)
        
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/schedule/shares/{shareId}", response_model=dict)
async def delete_schedule_share(
    shareId: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a schedule share"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if share exists and user owns it or it's shared with them
        cursor.execute("""
            SELECT id FROM schedule_shares 
            WHERE id = %s AND (owner_id = %s OR shared_with_id = %s)
        """, (int(shareId), current_user['user_id'], current_user['user_id']))
        
        share = cursor.fetchone()
        
        if not share:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Schedule share not found or not authorized"
            )
        
        # Delete the share
        cursor.execute("""
            DELETE FROM schedule_shares WHERE id = %s
        """, (int(shareId),))
        
        conn.commit()
        
        return {"message": "Schedule share deleted successfully"}
        
    finally:
        cursor.close()
        conn.close()

@app.get("/api/schedule/shared-with-me", response_model=SemestersResponse)
async def get_shared_schedules(
    current_user: dict = Depends(get_current_user)
):
    """Get schedules shared with the current user"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get semesters that are shared with the current user
        cursor.execute("""
            SELECT s.*, u.display_name as owner_name
            FROM semesters s
            JOIN schedule_shares ss ON s.user_id = ss.owner_id
            JOIN users u ON s.user_id = u.id
            WHERE ss.shared_with_id = %s 
            AND ss.can_view = TRUE
            AND (ss.expires_at IS NULL OR ss.expires_at > CURRENT_TIMESTAMP)
            ORDER BY s.year DESC, s.position
        """, (current_user['user_id'],))
        
        semesters = cursor.fetchall()
        
        semester_list = []
        for semester in semesters:
            # Get classes for each semester
            cursor.execute("""
                SELECT id, name, credits, professor, rate_my_professor_url, notes
                FROM classes
                WHERE semester_id = %s
                ORDER BY name
            """, (semester['id'],))
            
            classes = cursor.fetchall()
            
            class_list = []
            for cls in classes:
                class_list.append(SemesterClassResponse(
                    id=str(cls['id']),
                    name=cls['name'],
                    credits=cls['credits'],
                    professor=cls['professor'],
                    rateMyProfessorUrl=cls['rate_my_professor_url'],
                    notes=cls['notes']
                ))
            
            semester_list.append(SemesterResponse(
                id=str(semester['semester_id']),
                name=semester['name'],
                year=semester['year'],
                position=semester['position'],
                classes=class_list
            ))
        
        return SemestersResponse(semesters=semester_list)
        
    finally:
        cursor.close()
        conn.close()

# Semesters endpoints
@app.get("/api/semesters", response_model=SemestersResponse)
async def get_semesters(
    year: Optional[int] = None, 
    includeClasses: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get all semesters for the current user"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    if year:
        cursor.execute("""
            SELECT id, semester_id, name, year, position 
            FROM semesters 
            WHERE user_id = %s AND year = %s
            ORDER BY position
        """, (current_user['user_id'], year))
    else:
        cursor.execute("""
            SELECT id, semester_id, name, year, position 
            FROM semesters 
            WHERE user_id = %s
            ORDER BY year DESC, position
        """, (current_user['user_id'],))
    
    semesters = cursor.fetchall()
    
    result = []
    for semester in semesters:
        semester_obj = SemesterResponse(
            id=semester['semester_id'],
            name=semester['name'],
            year=semester['year'],
            position=semester['position'],
            classes=[]
        )
        
        if includeClasses:
            # Get classes for this semester
            cursor.execute("""
                SELECT id, name, credits, professor, rate_my_professor_url, notes
                FROM classes
                WHERE semester_id = %s
            """, (semester['id'],))
            classes = cursor.fetchall()
            
            for cls in classes:
                semester_obj.classes.append(SemesterClassResponse(
                    id=str(cls['id']),
                    name=cls['name'],
                    credits=cls['credits'],
                    professor=cls['professor'],
                    rateMyProfessorUrl=cls['rate_my_professor_url'],
                    notes=cls['notes']
                ))
        
        result.append(semester_obj)
    
    cursor.close()
    conn.close()
    
    return SemestersResponse(semesters=result)

@app.post("/api/semesters", response_model=SemesterResponse)
async def create_semester(
    semester_data: SemesterRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new semester"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    semester_id = f"{semester_data.year}-{semester_data.name.lower()}"
    
    cursor.execute("""
        INSERT INTO semesters (semester_id, name, year, position, user_id)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, semester_id, name, year, position
    """, (semester_id, semester_data.name, semester_data.year, semester_data.position, current_user['user_id']))
    
    new_semester = cursor.fetchone()
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return SemesterResponse(
        id=new_semester['semester_id'],
        name=new_semester['name'],
        year=new_semester['year'],
        position=new_semester['position'],
        classes=[]
    )

@app.patch("/api/semesters/{semesterId}", response_model=SemesterResponse)
async def update_semester(
    semesterId: str,
    semester_data: SemesterRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update a semester"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        UPDATE semesters 
        SET name = %s, year = %s, position = %s, updated_at = CURRENT_TIMESTAMP
        WHERE semester_id = %s AND user_id = %s
        RETURNING id, semester_id, name, year, position
    """, (semester_data.name, semester_data.year, semester_data.position, semesterId, current_user['user_id']))
    
    updated_semester = cursor.fetchone()
    
    if not updated_semester:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Semester not found")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return SemesterResponse(
        id=updated_semester['semester_id'],
        name=updated_semester['name'],
        year=updated_semester['year'],
        position=updated_semester['position'],
        classes=[]
    )

@app.delete("/api/semesters/{semesterId}")
async def delete_semester(semesterId: str, current_user: dict = Depends(get_current_user)):
    """Delete a semester"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # First delete associated classes
    cursor.execute("DELETE FROM classes WHERE semester_id = (SELECT id FROM semesters WHERE semester_id = %s AND user_id = %s)", (semesterId, current_user['user_id']))
    
    # Then delete the semester
    cursor.execute("DELETE FROM semesters WHERE semester_id = %s AND user_id = %s", (semesterId, current_user['user_id']))
    
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Semester not found")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"success": True}

# Classes within semesters endpoints
@app.post("/api/semesters/{semesterId}/classes", response_model=SemesterClassResponse)
async def create_class(
    semesterId: str,
    class_data: ClassRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new class within a semester"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get semester ID
    cursor.execute("SELECT id FROM semesters WHERE semester_id = %s AND user_id = %s", (semesterId, current_user['user_id']))
    semester = cursor.fetchone()
    
    if not semester:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Semester not found")
    
    cursor.execute("""
        INSERT INTO classes (name, credits, professor, rate_my_professor_url, notes, semester_id, user_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, name, credits, professor, rate_my_professor_url, notes, created_at
    """, (class_data.name, class_data.credits, class_data.professor, 
          class_data.rateMyProfessorUrl, class_data.notes, semester['id'], current_user['user_id']))
    
    new_class = cursor.fetchone()
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return SemesterClassResponse(
        id=str(new_class['id']),
        name=new_class['name'],
        credits=new_class['credits'],
        professor=new_class['professor'],
        rateMyProfessorUrl=new_class['rate_my_professor_url'],
        notes=new_class['notes']
    )

@app.patch("/api/semesters/{semesterId}/classes/{classId}", response_model=SemesterClassResponse)
async def update_class(
    semesterId: str,
    classId: str,
    class_data: ClassRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update a class within a semester"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        UPDATE classes 
        SET name = %s, credits = %s, professor = %s, rate_my_professor_url = %s, notes = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s AND semester_id = (SELECT id FROM semesters WHERE semester_id = %s AND user_id = %s)
        RETURNING id, name, credits, professor, rate_my_professor_url, notes
    """, (class_data.name, class_data.credits, class_data.professor, 
          class_data.rateMyProfessorUrl, class_data.notes, int(classId), semesterId, current_user['user_id']))
    
    updated_class = cursor.fetchone()
    
    if not updated_class:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Class not found")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return SemesterClassResponse(
        id=str(updated_class['id']),
        name=updated_class['name'],
        credits=updated_class['credits'],
        professor=updated_class['professor'],
        rateMyProfessorUrl=updated_class['rate_my_professor_url'],
        notes=updated_class['notes']
    )

@app.delete("/api/semesters/{semesterId}/classes/{classId}")
async def delete_class(semesterId: str, classId: str, current_user: dict = Depends(get_current_user)):
    """Delete a class from a semester"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        DELETE FROM classes 
        WHERE id = %s AND semester_id = (SELECT id FROM semesters WHERE semester_id = %s AND user_id = %s)
    """, (int(classId), semesterId, current_user['user_id']))
    
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Class not found")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"success": True}

# Professor directory endpoint
@app.get("/api/professors", response_model=ProfessorsResponse)
async def get_professors(current_user: dict = Depends(get_current_user)):
    """Get all professors and their associated courses"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get all classes with professors for current user
    cursor.execute("""
        SELECT c.id as class_id, c.name as class_name, c.professor, s.semester_id, s.name as semester_name, s.year
        FROM classes c
        JOIN semesters s ON c.semester_id = s.id
        WHERE c.professor IS NOT NULL AND s.user_id = %s
        ORDER BY c.professor, s.year, s.position
    """, (current_user['user_id'],))
    
    classes = cursor.fetchall()
    
    professors = {}
    for cls in classes:
        prof_name = cls['professor']
        if prof_name not in professors:
            professors[prof_name] = {
                "id": str(uuid.uuid4()),
                "name": prof_name,
                "rateMyProfessorUrl": None,  # Could be added later based on data
                "courses": []
            }
        
        professors[prof_name]["courses"].append(ProfessorCourseResponse(
            classId=str(cls['class_id']),
            semesterId=cls['semester_id'],
            name=cls['class_name'],
            year=cls['year'],
            term=cls['semester_name']
        ))
    
    cursor.close()
    conn.close()
    
    return ProfessorsResponse(professors=list(professors.values()))

# Historical coursework endpoints
@app.get("/api/previous-classes", response_model=PreviousClassesResponse)
async def get_previous_classes(current_user: dict = Depends(get_current_user)):
    """Get all previous classes for the current user"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT id, name, semester, grade, professor, created_at
        FROM previous_classes
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (current_user['user_id'],))
    
    classes = cursor.fetchall()
    
    result = []
    for cls in classes:
        result.append(PreviousClassResponse(
            id=str(cls['id']),
            name=cls['name'],
            semester=cls['semester'],
            grade=cls['grade'],
            professor=cls['professor']
        ))
    
    cursor.close()
    conn.close()
    
    return PreviousClassesResponse(courses=result)

@app.post("/api/previous-classes", response_model=PreviousClassResponse)
async def create_previous_class(
    class_data: PreviousClassRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new previous class record"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        INSERT INTO previous_classes (name, semester, grade, professor, user_id)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, name, semester, grade, professor
    """, (class_data.name, class_data.semester, class_data.grade, 
          class_data.professor, current_user['user_id']))
    
    new_class = cursor.fetchone()
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return PreviousClassResponse(
        id=str(new_class['id']),
        name=new_class['name'],
        semester=new_class['semester'],
        grade=new_class['grade'],
        professor=new_class['professor']
    )

@app.patch("/api/previous-classes/{courseId}", response_model=PreviousClassResponse)
async def update_previous_class(
    courseId: str,
    class_data: PreviousClassRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update a previous class record"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        UPDATE previous_classes
        SET name = %s, semester = %s, grade = %s, professor = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s AND user_id = %s
        RETURNING id, name, semester, grade, professor
    """, (class_data.name, class_data.semester, class_data.grade, 
          class_data.professor, int(courseId), current_user['user_id']))
    
    updated_class = cursor.fetchone()
    
    if not updated_class:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Previous class not found")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return PreviousClassResponse(
        id=str(updated_class['id']),
        name=updated_class['name'],
        semester=updated_class['semester'],
        grade=updated_class['grade'],
        professor=updated_class['professor']
    )

@app.delete("/api/previous-classes/{courseId}")
async def delete_previous_class(courseId: str, current_user: dict = Depends(get_current_user)):
    """Delete a previous class record"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        DELETE FROM previous_classes
        WHERE id = %s AND user_id = %s
    """, (int(courseId), current_user['user_id']))
    
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Previous class not found")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"success": True}

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

@app.post("/api/uploads/pathway-plan", response_model=UploadResponse)
async def upload_pathway_plan(
    file: UploadFile = File(...),
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Upload a pathway plan document"""
    return await handle_file_upload(file, "pathway-plan", current_user, notes)

@app.post("/api/uploads/previous-classes", response_model=UploadResponse)
async def upload_previous_classes(
    file: UploadFile = File(...),
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Upload a previous classes document"""
    return await handle_file_upload(file, "previous-classes", current_user, notes)

@app.post("/api/uploads/current-semester", response_model=UploadResponse)
async def upload_current_semester(
    file: UploadFile = File(...),
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Upload a current semester document"""
    return await handle_file_upload(file, "current-semester", current_user, notes)

async def handle_file_upload(
    file: UploadFile,
    upload_type: str,
    current_user: dict,
    notes: Optional[str] = None
):
    """Handle file upload logic"""
    import uuid
    from datetime import timezone
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    safe_filename = f"{file_id}{file_extension}"
    
    # Save file to uploads directory
    file_path = UPLOADS_DIR / safe_filename
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    # Get file size
    size = file_path.stat().st_size
    
    # Save to database
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        INSERT INTO uploads (type, original_name, content_type, size, url, user_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, type, original_name, content_type, size, uploaded_at
    """, (upload_type, file.filename, file.content_type, size, f"/uploads/{safe_filename}", current_user['user_id']))
    
    upload_record = cursor.fetchone()
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return UploadResponse(
        id=str(upload_record['id']),
        type=upload_record['type'],
        originalName=upload_record['original_name'],
        contentType=upload_record['content_type'],
        size=upload_record['size'],
        uploadedAt=upload_record['uploaded_at'],
        url=f"http://localhost:8000/uploads/{safe_filename}"  # This should be updated to actual CDN URL in production
    )

@app.get("/api/uploads", response_model=UploadsResponse)
async def get_uploads(
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all uploads for the current user"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    if type:
        cursor.execute("""
            SELECT id, type, original_name, content_type, size, uploaded_at, url
            FROM uploads
            WHERE user_id = %s AND type = %s
            ORDER BY uploaded_at DESC
        """, (current_user['user_id'], type))
    else:
        cursor.execute("""
            SELECT id, type, original_name, content_type, size, uploaded_at, url
            FROM uploads
            WHERE user_id = %s
            ORDER BY uploaded_at DESC
        """, (current_user['user_id'],))
    
    uploads = cursor.fetchall()
    
    result = []
    for upload in uploads:
        result.append(UploadResponse(
            id=str(upload['id']),
            type=upload['type'],
            originalName=upload['original_name'],
            contentType=upload['content_type'],
            size=upload['size'],
            uploadedAt=upload['uploaded_at'],
            url=upload['url']
        ))
    
    cursor.close()
    conn.close()
    
    return UploadsResponse(uploads=result)

@app.delete("/api/uploads/{uploadId}")
async def delete_upload(uploadId: str, current_user: dict = Depends(get_current_user)):
    """Delete an upload"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get upload file path to delete the actual file
    cursor.execute("""
        SELECT url
        FROM uploads
        WHERE id = %s AND user_id = %s
    """, (int(uploadId), current_user['user_id']))
    
    upload = cursor.fetchone()
    
    if not upload:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Upload not found")
    
    # Delete the actual file if it exists
    if upload['url']:
        file_path = Path("uploads") / Path(upload['url']).name
        if file_path.exists():
            file_path.unlink()
    
    # Delete from database
    cursor.execute("""
        DELETE FROM uploads
        WHERE id = %s AND user_id = %s
    """, (int(uploadId), current_user['user_id']))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"success": True}

# Metadata endpoints
@app.get("/api/meta/semester-sequence", response_model=SemesterSequenceResponse)
async def get_semester_sequence():
    """Get available terms and default start year"""
    return SemesterSequenceResponse(
        availableTerms=["Spring", "Summer", "Fall", "Winter"],
        defaultStartYear=datetime.now().year
    )

@app.get("/api/meta/grade-scale", response_model=GradeScaleResponse)
async def get_grade_scale():
    """Get available grades"""
    return GradeScaleResponse(
        grades=["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F", "Pass", "Fail"]
    )


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

# Password reset endpoints
import secrets

# Add password reset token table
def add_password_reset_tokens_table():
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Create password reset tokens table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                token VARCHAR(256) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error creating password reset tokens table: {e}")
        return False

# Initialize the password reset table
add_password_reset_tokens_table()

@app.post("/api/auth/forgot-password")
async def forgot_password(email: EmailStr):
    """Initiate password reset process"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Find user by email
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    if not user:
        # Return success even if user doesn't exist to prevent email enumeration
        cursor.close()
        conn.close()
        return {"message": "If an account with that email exists, a password reset link has been sent."}
    
    # Generate password reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    
    # Store token in database
    cursor.execute("""
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (%s, %s, %s)
    """, (user['id'], reset_token, expires_at))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    # In a real application, send email with reset link
    # For this implementation, we'll just return the token
    # (in production, never return the token directly to the frontend)
    print(f"Password reset token: {reset_token}")  # For development only
    
    return {"message": "If an account with that email exists, a password reset link has been sent."}

@app.post("/api/auth/reset-password")
async def reset_password(token: str, new_password: str):
    """Reset user password using token"""
    conn = db.get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check if token is valid and not expired
    cursor.execute("""
        SELECT user_id FROM password_reset_tokens 
        WHERE token = %s AND expires_at > %s AND created_at > (NOW() - INTERVAL '1 hour')
    """, (token, datetime.utcnow()))
    token_record = cursor.fetchone()
    
    if not token_record:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Hash the new password
    password_hash = hash_password(new_password)
    
    # Update user's password
    cursor.execute("""
        UPDATE users SET password_hash = %s WHERE id = %s
    """, (password_hash, token_record['user_id']))
    
    # Invalidate the reset token
    cursor.execute("DELETE FROM password_reset_tokens WHERE token = %s", (token,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"message": "Password reset successful"}

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

# Global exception handler for consistent error format
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": {
                "code": "NOT_FOUND",
                "message": "The requested resource was not found"
            }
        }
    )

@app.exception_handler(422)
async def validation_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation failed",
                "details": str(exc)
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal server error occurred"
            }
        }
    )


@app.post("/extract-courses")
async def extractCourses(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    contents = await file.read()
    try:
        text = convertBiteFileToText(file_bytes=contents)
        extractedCourseCodes = extractCourseCodesFromPDF(text=text)
        fullDepartmentNames, departmentAcronyms, courseNumbers = mapCourseDepartment(courseCodesList=extractedCourseCodes)
        return fullDepartmentNames, departmentAcronyms, courseNumbers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
