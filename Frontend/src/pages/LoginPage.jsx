import { useState } from 'react'
import { Box, Button, Fade, Stack, TextField, Typography, Alert, CircularProgress } from '@mui/material'
import InteractivePanel from '../components/InteractivePanel.jsx'
import ApiService from '../services/api.js'

const LoginPage = ({ onAuthenticate }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password')
      return
    }

    setError('')
    setLoading(true)

    try {
      const authData = await ApiService.login(email, password)
      onAuthenticate(authData)
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background:
          'radial-gradient(circle at 20% 20%, rgba(25,118,210,0.35), transparent 55%), radial-gradient(circle at 80% 10%, rgba(123,31,162,0.35), transparent 55%), linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #020617 100%)',
      }}
    >
      <Fade in timeout={800}>
        <InteractivePanel
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 4, sm: 5 },
            backdropFilter: 'blur(18px)',
            background: 'rgba(15, 23, 42, 0.8)',
            borderRadius: 3,
            border: '1px solid rgba(148, 163, 184, 0.24)',
            boxShadow: '0 24px 48px rgba(15,23,42,0.45)',
          }}
          hoverSx={{
            boxShadow: '0 32px 64px rgba(59,130,246,0.45)',
            borderColor: 'rgba(59,130,246,0.4)',
          }}
          lift={10}
        >
          <Stack spacing={4}>
            <Stack spacing={1.5}>
              <Typography
                variant="overline"
                sx={{ letterSpacing: 4, color: 'primary.light' }}
              >
                HD4 Scheduler
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#f8fafc' }}>
                Welcome back
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.75)' }}>
                Sign in with any email and password to explore the dashboard.
              </Typography>
            </Stack>

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
              <TextField
                label="Email address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                fullWidth
                required
                InputLabelProps={{ sx: { color: 'rgba(226,232,240,0.85)' } }}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                fullWidth
                required
                InputLabelProps={{ sx: { color: 'rgba(226,232,240,0.85)' } }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 16px 40px rgba(59,130,246,0.35)',
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Enter Dashboard'}
              </Button>
            </Box>

            {error && (
              <Fade in>
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              </Fade>
            )}

            <Typography
              variant="caption"
              sx={{ color: 'rgba(226,232,240,0.45)', textAlign: 'center' }}
            >
              Enter your credentials to access the HD4 Scheduler dashboard.
            </Typography>
          </Stack>
        </InteractivePanel>
      </Fade>
    </Box>
  )
}

export default LoginPage
