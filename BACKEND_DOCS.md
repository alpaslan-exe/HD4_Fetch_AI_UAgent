# AI Agent Backend Documentation

## Overview
This backend service provides a foundation for managing AI agents with user authentication, PostgreSQL persistence, and FastAPI web framework. It integrates with uagents to enable communication with AI agents.

## Components

### 1. FastAPI Application
- Provides REST API endpoints for user management and agent operations
- Implements JWT-based authentication
- Includes health check endpoints

### 2. Database Schema
The PostgreSQL database includes the following tables:

#### users table
- id: SERIAL PRIMARY KEY
- username: VARCHAR(50) UNIQUE NOT NULL
- email: VARCHAR(100) UNIQUE NOT NULL
- password_hash: VARCHAR(256) NOT NULL
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### agents table
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL
- user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
- config: JSONB
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### agent_logs table
- id: SERIAL PRIMARY KEY
- agent_id: INTEGER REFERENCES agents(id) ON DELETE CASCADE
- log_level: VARCHAR(20)
- message: TEXT
- timestamp: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 3. Authentication System
- User registration with username, email and password
- Secure password hashing using SHA-256
- JWT token-based authentication
- Protected API endpoints

### 4. UAgent Integration
- Example agent implementation that can receive messages
- Agent-to-agent communication capabilities
- Message logging system

## API Endpoints

### Authentication
- `POST /signup` - Create a new user account
- `POST /login` - Authenticate user and return JWT token

### User Management
- `GET /users/me` - Get current user's information (requires authentication)

### Agent Management
- `GET /agents/{agent_id}/logs` - Get logs for a specific agent (requires authentication)

### Health Check
- `GET /health` - Check if the service is running

## Configuration
The application uses environment variables or a config file for configuration:

- `DB_NAME`: PostgreSQL database name (default: ai_agents_db)
- `DB_USER`: PostgreSQL username (default: postgres)
- `DB_PASSWORD`: PostgreSQL password (default: password)
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `JWT_SECRET_KEY`: Secret key for JWT tokens (default: your-secret-key-change-this)
- `BACKEND_AGENT_SEED`: Seed for the backend uagent

## Running the Application

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up the database:
   ```bash
   python init_db.py
   ```

3. Start the server:
   ```bash
   python start_server.py
   ```

## Environment Variables
Create a `.env` file in the root directory with the following variables:
```
DB_NAME=ai_agents_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this
BACKEND_AGENT_SEED=your-backend-agent-secret-phrase
DEBUG=True
```