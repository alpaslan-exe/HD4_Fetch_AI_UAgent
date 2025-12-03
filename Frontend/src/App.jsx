import { useMemo, useState, useEffect } from 'react'
import { CssBaseline, CircularProgress, Box } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import theme from './theme.js'
import ApiService from './services/api.js'
import './App.css'

const App = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const memoizedTheme = useMemo(() => theme, [])

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = ApiService.getToken()
      const storedUser = localStorage.getItem('user')
      
      if (token && storedUser) {
        try {
          // Verify token is still valid by fetching user profile
          const userData = await ApiService.getUserProfile()
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        } catch (error) {
          // Token invalid, clear storage
          ApiService.setToken(null)
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleAuthenticate = async (authData) => {
    setUser(authData.user)
    localStorage.setItem('user', JSON.stringify(authData.user))
  }

  const handleLogout = async () => {
    await ApiService.logout()
    setUser(null)
  }

  if (loading) {
    return (
      <ThemeProvider theme={memoizedTheme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #020617 100%)',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={memoizedTheme}>
      <CssBaseline />
      {user ? (
        <HomePage onLogout={handleLogout} user={user} />
      ) : (
        <LoginPage onAuthenticate={handleAuthenticate} />
      )}
    </ThemeProvider>
  )
}

export default App
