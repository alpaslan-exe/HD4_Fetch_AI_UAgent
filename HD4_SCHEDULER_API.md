# HD4 Scheduler API Documentation

This document describes the HD4 Scheduler API endpoints that have been integrated into the AI Agent Backend.

## Authentication Endpoints

### POST `/api/auth/login`
Authenticate user and return access and refresh tokens.

**Request:**
```json
{
  "email": "student@example.edu",
  "password": "supplied-password"
}
```

**Response (200):**
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "student@example.edu",
    "displayName": "Student User",
    "role": "student"
  }
}
```

### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response (200):**
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "student@example.edu",
    "displayName": "Student User",
    "role": "student"
  }
}
```

### POST `/api/auth/logout`
Logout user and revoke refresh token.

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response (200):**
```json
{
  "success": true
}
```

### POST `/api/auth/forgot-password`
Initiate password reset process.

**Request:**
```json
{
  "email": "student@example.edu"
}
```

**Response (200):**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### POST `/api/auth/reset-password`
Reset user password using token.

**Request:**
```json
{
  "token": "reset-token",
  "new_password": "new-password"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

## User Profile Endpoints

### GET `/api/users/me`
Get current user's profile information.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "student@example.edu",
  "displayName": "Student User",
  "createdAt": "2025-01-20T15:00:00.000Z",
  "updatedAt": "2025-01-28T21:45:12.000Z"
}
```

### PATCH `/api/users/me`
Update user profile information.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "displayName": "New Display Name",
  "password": {
    "current": "current-pass",
    "next": "new-pass"
  }
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "student@example.edu",
  "displayName": "New Display Name",
  "createdAt": "2025-01-20T15:00:00.000Z",
  "updatedAt": "2025-01-28T21:45:12.000Z"
}
```

## Semesters & Planning Endpoints

### GET `/api/semesters`
Get all semesters for the current user.

**Query Parameters:**
- `?year=2025`
- `?includeClasses=true`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "semesters": [
    {
      "id": "2025-fall",
      "name": "Fall",
      "year": 2025,
      "position": 1,
      "classes": [
        {
          "id": "uuid",
          "name": "CS 320 - Algorithms",
          "credits": 3,
          "professor": "Dr. Patel",
          "rateMyProfessorUrl": "https://www.ratemyprofessors.com/...",
          "notes": "Meets T/Th 10am"
        }
      ]
    }
  ]
}
```

### POST `/api/semesters`
Create a new semester.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "name": "Spring",
  "year": 2026,
  "position": 2
}
```

**Response (201):**
```json
{
  "id": "2026-spring",
  "name": "Spring",
  "year": 2026,
  "position": 2,
  "classes": []
}
```

### PATCH `/api/semesters/:semesterId`
Update a semester.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "name": "Spring",
  "year": 2026,
  "position": 2
}
```

**Response (200):**
```json
{
  "id": "2026-spring",
  "name": "Spring",
  "year": 2026,
  "position": 2,
  "classes": []
}
```

### DELETE `/api/semesters/:semesterId`
Delete a semester.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true
}
```

## Classes within Semesters Endpoints

### POST `/api/semesters/:semesterId/classes`
Create a new class within a semester.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "name": "CS 320 - Algorithms",
  "credits": 3,
  "professor": "Dr. Patel",
  "rateMyProfessorUrl": "https://www.ratemyprofessors.com/...",
  "notes": "Meets T/Th 10am"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "CS 320 - Algorithms",
  "credits": 3,
  "professor": "Dr. Patel",
  "rateMyProfessorUrl": "https://www.ratemyprofessors.com/...",
  "notes": "Meets T/Th 10am"
}
```

### PATCH `/api/semesters/:semesterId/classes/:classId`
Update a class within a semester.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "name": "CS 320 - Algorithms",
  "credits": 3,
  "professor": "Dr. Patel",
  "rateMyProfessorUrl": "https://www.ratemyprofessors.com/...",
  "notes": "Meets T/Th 10am"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "CS 320 - Algorithms",
  "credits": 3,
  "professor": "Dr. Patel",
  "rateMyProfessorUrl": "https://www.ratemyprofessors.com/...",
  "notes": "Meets T/Th 10am"
}
```

### DELETE `/api/semesters/:semesterId/classes/:classId`
Delete a class from a semester.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true
}
```

## Professor Directory Endpoints

### GET `/api/professors`
Get all professors and their associated courses.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "professors": [
    {
      "id": "uuid",
      "name": "Dr. Patel",
      "rateMyProfessorUrl": "https://www.ratemyprofessors.com/...",
      "courses": [
        {
          "classId": "uuid",
          "semesterId": "2025-fall",
          "name": "CS 320 - Algorithms",
          "year": 2025,
          "term": "Fall"
        }
      ]
    }
  ]
}
```

## Historical Coursework Endpoints

### GET `/api/previous-classes`
Get all previous classes for the current user.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "courses": [
    {
      "id": "uuid",
      "name": "ENG 210 - Technical Writing",
      "semester": "Spring 2024",
      "grade": "A-",
      "professor": "Dr. Castillo"
    }
  ]
}
```

### POST `/api/previous-classes`
Create a new previous class record.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "name": "ENG 210 - Technical Writing",
  "semester": "Spring 2024",
  "grade": "A-",
  "professor": "Dr. Castillo"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "ENG 210 - Technical Writing",
  "semester": "Spring 2024",
  "grade": "A-",
  "professor": "Dr. Castillo"
}
```

### PATCH `/api/previous-classes/:courseId`
Update a previous class record.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "name": "ENG 210 - Technical Writing",
  "semester": "Spring 2024",
  "grade": "A-",
  "professor": "Dr. Castillo"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "ENG 210 - Technical Writing",
  "semester": "Spring 2024",
  "grade": "A-",
  "professor": "Dr. Castillo"
}
```

### DELETE `/api/previous-classes/:courseId`
Delete a previous class record.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true
}
```

## File Upload Endpoints

### POST `/api/uploads/pathway-plan`
Upload a pathway plan document.

**Headers:** `Authorization: Bearer <accessToken>`

**Form Data:**
- `file`: multipart file
- `notes`: optional string

**Response (201):**
```json
{
  "id": "uuid",
  "type": "pathway-plan",
  "originalName": "pathway_plan.pdf",
  "contentType": "application/pdf",
  "size": 128000,
  "uploadedAt": "2025-01-29T13:00:00.000Z",
  "url": "http://localhost:8000/uploads/uuid"
}
```

### POST `/api/uploads/previous-classes`
Upload a previous classes document.

### POST `/api/uploads/current-semester`
Upload a current semester document.

### GET `/api/uploads`
Get all uploads for the current user.

**Query Parameters:**
- `?type=pathway-plan`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "uploads": [
    {
      "id": "uuid",
      "type": "pathway-plan",
      "originalName": "pathway_plan.pdf",
      "contentType": "application/pdf",
      "size": 128000,
      "uploadedAt": "2025-01-29T13:00:00.000Z",
      "url": "http://localhost:8000/uploads/uuid"
    }
  ]
}
```

### DELETE `/api/uploads/:uploadId`
Delete an upload.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true
}
```

## Metadata Endpoints

### GET `/api/meta/semester-sequence`
Get available terms and default start year.

**Response (200):**
```json
{
  "availableTerms": ["Spring", "Summer", "Fall", "Winter"],
  "defaultStartYear": 2025
}
```

### GET `/api/meta/grade-scale`
Get available grades.

**Response (200):**
```json
{
  "grades": ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F", "Pass", "Fail"]
}
```

## Error Format

Errors return JSON:

```json
{
  "error": {
    "code": "SEMESTER_NOT_FOUND",
    "message": "Semester 2025-fall was not found.",
    "details": {
      "semesterId": "2025-fall"
    }
  }
}
```

Authentication errors use HTTP 401/403, validation errors 422, not found 404, and server issues 500.