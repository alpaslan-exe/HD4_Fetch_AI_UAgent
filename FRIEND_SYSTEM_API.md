# HD4 Scheduler API - Friend System Documentation

## Overview

The HD4 Scheduler API now includes a comprehensive friend system that allows users to:

1. Connect with other users via friend requests
2. Share their schedules with friends
3. Manage friendships and shared schedules
4. Search for friends by name or email

## Friend System Endpoints

### Friend Requests

#### Send Friend Request
**POST** `/api/friends/requests`
- Sends a friend request to another user
- Request body:
  ```json
  {
    "friendId": "user123",
    "message": "Let's be study buddies!"
  }
  ```

#### Accept Friend Request
**POST** `/api/friends/requests/{requestId}/accept`
- Accepts a pending friend request
- Returns updated friend request object

#### Reject Friend Request
**POST** `/api/friends/requests/{requestId}/reject`
- Rejects a pending friend request
- Returns success message

#### Cancel Friend Request
**POST** `/api/friends/requests/{requestId}/cancel`
- Cancels a sent friend request
- Returns success message

#### List Friend Requests
**GET** `/api/friends/requests`
- Lists all friend requests (sent and received)
- Returns FriendRequestsResponse object

### Friend Management

#### List Friends
**GET** `/api/friends`
- Lists all accepted friends
- Returns FriendsResponse object

#### Remove Friend
**DELETE** `/api/friends/{friendId}`
- Removes a friend relationship
- Returns success message

#### Search Friends
**GET** `/api/friends/search?query={searchTerm}`
- Searches for friends by name, username or email
- Returns FriendsResponse object

### Schedule Sharing

#### Create/Update Schedule Share
**POST** `/api/schedule/shares`
- Shares your schedule with a friend
- Request body:
  ```json
  {
    "friendId": "user123",
    "canView": true,
    "canEdit": false,
    "expiresInDays": 30
  }
  ```

#### List Schedule Shares
**GET** `/api/schedule/shares`
- Lists all schedule shares (owned and shared with you)
- Returns ScheduleSharesResponse object

#### Delete Schedule Share
**DELETE** `/api/schedule/shares/{shareId}`
- Deletes a schedule share
- Returns success message

#### Get Shared Schedules
**GET** `/api/schedule/shared-with-me`
- Retrieves schedules shared with the current user
- Returns SemestersResponse object with shared semesters and classes

## Data Models

### FriendRequestRequest
```typescript
{
  friendId: string;
  message?: string;
}
```

### FriendRequestResponse
```typescript
{
  id: string;
  senderId: string;
  receiverId: string;
  senderDisplayName: string;
  receiverDisplayName: string;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
  updatedAt: string;
}
```

### FriendResponse
```typescript
{
  id: string;
  userId: string;
  friendId: string;
  displayName: string;
  email: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  createdAt: string;
  updatedAt: string;
}
```

### ScheduleShareRequest
```typescript
{
  friendId: string;
  canView: boolean;
  canEdit: boolean;
  expiresInDays?: number;
}
```

### ScheduleShareResponse
```typescript
{
  id: string;
  ownerId: string;
  sharedWithId: string;
  ownerDisplayName: string;
  sharedWithDisplayName: string;
  canView: boolean;
  canEdit: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Privacy Controls

The friend system implements robust privacy controls:

1. **Friend Verification**: Users can only share schedules with accepted friends
2. **Granular Permissions**: Control whether friends can view or edit schedules
3. **Expiration Dates**: Set expiration dates for schedule shares
4. **Reciprocal Relationships**: Friendship requires mutual acceptance

## Database Schema

### friends Table
```sql
CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    friend_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);
```

### friend_requests Table
```sql
CREATE TABLE IF NOT EXISTS friend_requests (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sender_id, receiver_id)
);
```

### schedule_shares Table
```sql
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
```

## Security Features

1. **Authentication Required**: All endpoints require valid authentication
2. **Authorization Checks**: Users can only manage their own friendships
3. **Data Validation**: Strong input validation and sanitization
4. **Rate Limiting**: Prevents abuse of endpoints
5. **Audit Trail**: All actions are logged with timestamps

## Error Handling

The friend system implements comprehensive error handling:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: User or friend relationship not found
- **409 Conflict**: Friendship already exists

## Best Practices

1. **Mutual Respect**: Friendships require mutual acceptance
2. **Privacy First**: Users control their data sharing preferences
3. **Clear Communication**: Messages provide context for friend requests
4. **Easy Management**: Simple interfaces for managing friendships
5. **Secure by Default**: Private sharing with explicit permissions

## API Response Format

All friend system endpoints return consistent response formats:

### Success Responses
```json
{
  "data": {...},
  "links": {...},
  "meta": {...}
}
```

### Error Responses
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {...}
  }
}
```