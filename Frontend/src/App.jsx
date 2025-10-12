import { useMemo, useState } from 'react'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import theme from './theme.js'
import './App.css'

const App = () => {
  const [user, setUser] = useState(null)

  const memoizedTheme = useMemo(() => theme, [])

  const handleAuthenticate = ({ email }) => {
    setUser({ email })
  }

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <ThemeProvider theme={memoizedTheme}>
      <CssBaseline />
      {user ? (
        <HomePage onLogout={handleLogout} userEmail={user.email} />
      ) : (
        <LoginPage onAuthenticate={handleAuthenticate} />
      )}
    </ThemeProvider>
  )
}

export default App
