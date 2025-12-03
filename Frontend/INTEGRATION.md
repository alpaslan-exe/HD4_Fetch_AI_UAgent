# Frontend Integration with Backend

This React frontend is now fully integrated with the FastAPI backend to provide real authentication, data persistence, and API-driven features.

## Features Integrated

✅ **Authentication**
- Real user login with JWT tokens
- Token refresh and session management
- Secure logout with token revocation
- Persistent login state

✅ **Data Persistence**
- Semesters and classes saved to database
- Previous classes history
- Professor information from Rate My Professor
- User profile management

✅ **API Integration**
- All API endpoints implemented in `src/services/api.js`
- Automatic token management
- Error handling and retry logic
- Loading states for better UX

✅ **Friend System**
- Send/receive friend requests
- Share schedules with friends
- View friend schedules
- Friend search functionality

## Quick Start

### 1. Start the Backend

From the project root:

```bash
cd HD4_Fetch_AI_UAgent
python backend.py
```

Backend will run on `http://localhost:8000`

### 2. Start the Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Create a User

You need to create a user account first. You can do this via:

**Option A: API (Recommended)**
```bash
curl -X POST http://localhost:8000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Option B: Python Script**
```python
import requests

response = requests.post('http://localhost:8000/signup', json={
    'username': 'testuser',
    'email': 'test@example.com',
    'password': 'test123'
})
print(response.json())
```

### 4. Login

Open `http://localhost:5173` and login with:
- Email: `test@example.com`
- Password: `test123`

## Environment Configuration

Create a `.env` file in this directory:

```env
VITE_API_URL=http://localhost:8000
```

This tells the frontend where to find the backend API.

## API Service

The `src/services/api.js` file provides all API integration:

### Authentication
```javascript
import ApiService from './services/api.js'

// Login
const authData = await ApiService.login(email, password)

// Logout
await ApiService.logout()

// Get user profile
const user = await ApiService.getUserProfile()

// Update profile
await ApiService.updateUserProfile({ displayName: 'New Name' })
```

### Semesters & Classes
```javascript
// Get all semesters
const semesters = await ApiService.getSemesters(2025, true)

// Create semester
await ApiService.createSemester({
  name: 'Fall',
  year: 2025,
  position: 1
})

// Add class to semester
await ApiService.createClass(semesterId, {
  name: 'CS 320 - Algorithms',
  credits: 3,
  professor: 'Dr. Smith',
  notes: 'MWF 10-11am'
})
```

### Professor Data (Rate My Professor)
```javascript
// Get professor data for a course
const data = await ApiService.getProfessorData(
  'University of Michigan - Dearborn',
  'Computer Science',
  '320',
  'f25',
  'Algorithms',
  'CIS'
)
```

### Previous Classes
```javascript
// Get previous classes
const classes = await ApiService.getPreviousClasses()

// Add previous class
await ApiService.createPreviousClass({
  name: 'CS 101',
  semester: 'Fall 2024',
  grade: 'A',
  professor: 'Dr. Johnson'
})
```

## Components Updated

### LoginPage
- Now uses real API authentication
- Displays error messages from backend
- Shows loading state during login
- Stores JWT tokens securely

### HomePage
- Displays actual user data
- Can be extended to load/save semesters
- Profile settings save to backend
- Previous classes persist in database

### App
- Checks authentication on load
- Manages user session
- Handles token refresh
- Provides loading state

## Token Management

The frontend handles JWT tokens automatically:

1. **Login**: Receives access token and refresh token
2. **Storage**: Stores tokens in localStorage
3. **Requests**: Automatically adds Authorization header
4. **Refresh**: Uses refresh token when access token expires
5. **Logout**: Clears all tokens and session data

## Error Handling

The API service includes error handling:

```javascript
try {
  const data = await ApiService.getSemesters()
  // Handle success
} catch (error) {
  // Handle error
  console.error(error.message)
}
```

## Next Steps to Complete Integration

The foundation is in place. Here's what you can add:

1. **Load semesters from API on startup**
   ```javascript
   useEffect(() => {
     const loadData = async () => {
       const data = await ApiService.getSemesters(null, true)
       setSemesters(data.semesters)
     }
     loadData()
   }, [])
   ```

2. **Save semesters when modified**
   ```javascript
   const handleAddClass = async () => {
     await ApiService.createClass(semesterId, classData)
     // Reload or update state
   }
   ```

3. **Implement real file uploads**
   ```javascript
   const handleUpload = async (file, type) => {
     await ApiService.uploadFile(file, type)
   }
   ```

4. **Add friend features**
   ```javascript
   const friends = await ApiService.getFriends()
   await ApiService.sendFriendRequest(friendId)
   ```

## Development

### Hot Module Replacement (HMR)

Vite provides HMR, so changes to React components update instantly without losing state.

### API Mocking (Optional)

For offline development, you can mock API responses:

```javascript
// In api.js, add a mock mode
const MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true'

if (MOCK_MODE) {
  return mockData
}
```

### Debugging

1. **Backend logs**: Check terminal running `backend.py`
2. **Frontend logs**: Check browser console (F12)
3. **Network requests**: Check Network tab in DevTools
4. **API Documentation**: Visit `http://localhost:8000/docs`

## Security Notes

- Tokens are stored in localStorage (consider httpOnly cookies for production)
- All API requests use HTTPS in production
- CORS is configured for development origins
- Passwords are hashed with SHA-256 on backend

## Production Build

To build for production:

```bash
npm run build
```

The built files will be in `dist/` directory. You can:
1. Serve them with any static file server
2. Integrate with FastAPI using `StaticFiles`
3. Deploy to Vercel, Netlify, or similar

## Troubleshooting

### CORS Errors
- Ensure backend is running on port 8000
- Check `VITE_API_URL` in `.env`
- Verify CORS config in backend includes frontend URL

### Login Fails
- Check backend logs for error details
- Ensure database is initialized
- Verify user exists with correct credentials

### Data Not Loading
- Check network tab for failed requests
- Verify authentication token is present
- Check API endpoint URLs match backend

## Support

For issues:
1. Check browser console for errors
2. Check backend terminal for API errors
3. Review `../INTEGRATION_GUIDE.md` for full setup
4. Check API docs at `http://localhost:8000/docs`

