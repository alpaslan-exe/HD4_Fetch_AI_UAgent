import { useEffect, useMemo, useState } from 'react'
import Grid from '@mui/material/Grid'
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Fade,
  Fab,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slide,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded'
import MarkEmailUnreadRoundedIcon from '@mui/icons-material/MarkEmailUnreadRounded'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import InteractivePanel from '../components/InteractivePanel.jsx'

const drawerWidth = 272
const semesterSequence = ['Spring', 'Summer', 'Fall', 'Winter']

const navigationItems = [
  { label: 'Overview', icon: <DashboardRoundedIcon />, value: 'overview' },
  { label: 'Schedule', icon: <CalendarMonthRoundedIcon />, value: 'schedule' },
  {
    label: 'Previous Classes',
    icon: <HistoryEduRoundedIcon />,
    value: 'previousClasses',
  },
  {
    label: 'Friends',
    icon: <PeopleAltRoundedIcon />,
    value: 'friends',
  },
]

const scheduleUploads = [
  {
    key: 'pathway',
    title: 'Pathway plan',
    helper: 'Upload your long-term plan with future requirements.',
  },
  {
    key: 'previous',
    title: 'Previous classes upload',
    helper: 'Attach transcripts or records of completed coursework.',
  },
  {
    key: 'current',
    title: 'Current semester upload',
    helper: 'Share your in-progress schedule for quick reference.',
  },
]

const generateSemesters = (startYear, firstSemester, count) => {
  const normalizedFirst = semesterSequence.includes(firstSemester)
    ? firstSemester
    : semesterSequence[0]
  const startIndex = semesterSequence.indexOf(normalizedFirst)
  const semesters = []

  for (let i = 0; i < count; i += 1) {
    const sequenceIndex = (startIndex + i) % semesterSequence.length
    const cycle = Math.floor((startIndex + i) / semesterSequence.length)
    const year = Number(startYear) + cycle
    const name = semesterSequence[sequenceIndex]
    const id = `${year}-${name}`

    semesters.push({ id, name, year })
  }

  return semesters
}

const HomePage = ({ onLogout, userEmail }) => {
  const [activeSection, setActiveSection] = useState('overview')
  const [startYear, setStartYear] = useState(new Date().getFullYear())
  const [firstSemester, setFirstSemester] = useState('Fall')
  const [semesterCount, setSemesterCount] = useState(4)
  const [semesters, setSemesters] = useState(() =>
    generateSemesters(new Date().getFullYear(), 'Fall', 4).map((semester) => ({
      ...semester,
      classes: [],
    })),
  )
  const [showSignOut, setShowSignOut] = useState(false)
  const defaultName = useMemo(
    () => (userEmail ? userEmail.split('@')[0] : 'Student User'),
    [userEmail],
  )
  const [profileName, setProfileName] = useState(defaultName)
  const [profilePassword, setProfilePassword] = useState('demo-pass')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState({
    pathway: null,
    previous: null,
    current: null,
  })
  const [previousClasses, setPreviousClasses] = useState([
    {
      course: 'CS 101 - Intro to Programming',
      semester: 'Fall 2023',
      grade: 'A',
      professor: 'Dr. Patel',
    },
    {
      course: 'MATH 221 - Calculus II',
      semester: 'Spring 2024',
      grade: 'B+',
      professor: 'Prof. Nguyen',
    },
    {
      course: 'ENG 210 - Technical Writing',
      semester: 'Spring 2024',
      grade: 'A-',
      professor: 'Dr. Castillo',
    },
  ])
  const [friends, setFriends] = useState([
    {
      id: 'friend-1',
      name: 'Jordan Lee',
      email: 'jordan.lee@campus.edu',
      schedule: [
        { day: 'Monday', course: 'CS 445 - Machine Learning', time: '09:30 AM' },
        { day: 'Wednesday', course: 'STAT 400 - Probability', time: '11:00 AM' },
        { day: 'Friday', course: 'HIST 210 - World History', time: '02:15 PM' },
      ],
    },
    {
      id: 'friend-2',
      name: 'Priya Desai',
      email: 'priya.desai@campus.edu',
      schedule: [
        { day: 'Tuesday', course: 'BIO 321 - Genetics', time: '10:00 AM' },
        { day: 'Thursday', course: 'CHEM 210 - Organic Chemistry', time: '01:30 PM' },
      ],
    },
  ])
  const [friendRequests, setFriendRequests] = useState([
    {
      id: 'request-1',
      name: 'Miguel Alvarez',
      email: 'malvarez@campus.edu',
      mutualCourses: ['CS 320 - Algorithms'],
    },
  ])
  const [friendEmailInput, setFriendEmailInput] = useState('')
  const [selectedFriendId, setSelectedFriendId] = useState('friend-1')

  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false)
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false)
  const [newClassForm, setNewClassForm] = useState({
    semesterId: '',
    name: '',
    credits: '',
    professor: '',
    rmp: '',
  })
  const [isAddPreviousClassOpen, setIsAddPreviousClassOpen] = useState(false)
  const [previousClassForm, setPreviousClassForm] = useState({
    course: '',
    semester: '',
    grade: '',
    professor: '',
  })
  const gpaScale = useMemo(
    () => ({
      A: 4.0,
      'A-': 3.7,
      'B+': 3.3,
      B: 3.0,
      'B-': 2.7,
      'C+': 2.3,
      C: 2.0,
      'C-': 1.7,
      'D+': 1.3,
      D: 1.0,
      'D-': 0.7,
      F: 0,
      Pass: null,
      Fail: 0,
    }),
    [],
  )

  useEffect(() => {
    setSemesters((prev) => {
      const next = generateSemesters(startYear, firstSemester, semesterCount)
      return next.map((semester) => {
        const existing = prev.find((item) => item.id === semester.id)
        return existing
          ? existing
          : { ...semester, classes: [] }
      })
    })
  }, [startYear, firstSemester, semesterCount])

  useEffect(() => {
    setProfileName(defaultName)
  }, [defaultName])

  useEffect(() => {
    if (!settingsSaved) return
    const timeout = window.setTimeout(() => setSettingsSaved(false), 2400)
    return () => window.clearTimeout(timeout)
  }, [settingsSaved])

  useEffect(() => {
    setNewClassForm((prev) => {
      if (semesters.length === 0) {
        return { semesterId: '', name: '', credits: '', professor: '', rmp: '' }
      }

      const isValid = semesters.some((semester) => semester.id === prev.semesterId)
      return {
        ...prev,
        semesterId: isValid ? prev.semesterId : semesters[0].id,
      }
    })
  }, [semesters])
  useEffect(() => {
    if (friends.length === 0) {
      setSelectedFriendId(null)
      return
    }
    const exists = friends.some((friend) => friend.id === selectedFriendId)
    if (!exists) {
      setSelectedFriendId(friends[0].id)
    }
  }, [friends, selectedFriendId])

  const handleRemoveClass = (semesterId, index) => {
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              classes: semester.classes.filter((_, classIndex) => classIndex !== index),
            }
          : semester,
      ),
    )
  }

  const handleOpenAddClassDialog = () => {
    if (semesters.length === 0) return
    setNewClassForm({
      semesterId: semesters[0].id,
      name: '',
      credits: '',
      professor: '',
      rmp: '',
    })
    setIsAddClassDialogOpen(true)
  }

  const handleAddClass = () => {
    if (!newClassForm.name.trim() || !newClassForm.semesterId) return

    const creditsValue = newClassForm.credits ? Number(newClassForm.credits) : null
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === newClassForm.semesterId
          ? {
              ...semester,
              classes: [
                ...semester.classes,
                {
                  name: newClassForm.name.trim(),
                  credits: Number.isNaN(creditsValue) ? null : creditsValue,
                  professor: newClassForm.professor.trim(),
                  rmp: newClassForm.rmp.trim(),
                },
              ],
            }
          : semester,
      ),
    )
    setIsAddClassDialogOpen(false)
  }

  const handleScheduleUpload = (key, file) => {
    if (!file) return
    setUploadedFiles((prev) => ({
      ...prev,
      [key]: file,
    }))
  }

  const handleSettingsSubmit = (event) => {
    event.preventDefault()
    setSettingsSaved(true)
  }

  const handleAddPreviousClass = () => {
    if (!previousClassForm.course.trim() || !previousClassForm.semester.trim()) return

    setPreviousClasses((prev) => [
      {
        course: previousClassForm.course.trim(),
        semester: previousClassForm.semester.trim(),
        grade: previousClassForm.grade.trim(),
        professor: previousClassForm.professor.trim(),
      },
      ...prev,
    ])
    setIsAddPreviousClassOpen(false)
    setPreviousClassForm({ course: '', semester: '', grade: '', professor: '' })
  }
  const handleSendFriendInvite = (event) => {
    event.preventDefault()
    if (!friendEmailInput.trim()) return
    const newRequest = {
      id: `request-${Date.now()}`,
      name:
        friendEmailInput
          .split('@')[0]
          .replace(/[^a-zA-Z]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\b\w/g, (char) => char.toUpperCase()) || 'New Friend',
      email: friendEmailInput.trim(),
      mutualCourses: [],
      outgoing: true,
    }
    setFriendRequests((prev) => [newRequest, ...prev])
    setFriendEmailInput('')
  }

  const handleRespondFriendRequest = (requestId, accepted) => {
    setFriendRequests((prev) => prev.filter((request) => request.id !== requestId))
    if (!accepted) return

    const acceptedRequest = friendRequests.find((request) => request.id === requestId)
    if (!acceptedRequest) return

    const newFriendId = `friend-${Date.now()}`
    const newFriend = {
      id: newFriendId,
      name: acceptedRequest.name,
      email: acceptedRequest.email,
      schedule: [
        {
          day: 'Monday',
          course: 'Elective TBD',
          time: '12:00 PM',
        },
      ],
    }

    setFriends((prev) => [newFriend, ...prev])
    setSelectedFriendId(newFriendId)
  }

  const professorDirectory = useMemo(() => {
    const directory = new Map()
    semesters.forEach((semester) => {
      semester.classes.forEach((course) => {
        if (!course.professor) return
        if (!directory.has(course.professor)) {
          directory.set(course.professor, {
            professor: course.professor,
            rmp: course.rmp,
            courses: [],
          })
        }
        directory.get(course.professor).courses.push({
          name: course.name,
          semester: `${semester.name} ${semester.year}`,
          rmp: course.rmp,
          credits: course.credits,
        })
      })
    })
    return Array.from(directory.values())
  }, [semesters])

  const averageGpa = useMemo(() => {
    const grades = previousClasses
      .map((course) => gpaScale[course.grade?.trim() ?? ''] ?? null)
      .filter((value) => value !== null && value !== undefined)

    if (grades.length === 0) return null

    const total = grades.reduce((sum, value) => sum + value, 0)
    return (total / grades.length).toFixed(2)
  }, [previousClasses, gpaScale])
  const gradedCoursesCount = useMemo(
    () =>
      previousClasses.filter(
        (item) =>
          gpaScale[item.grade?.trim() ?? ''] !== null &&
          gpaScale[item.grade?.trim() ?? ''] !== undefined,
      ).length,
    [previousClasses, gpaScale],
  )
  const selectedFriend = useMemo(
    () => friends.find((friend) => friend.id === selectedFriendId) ?? null,
    [friends, selectedFriendId],
  )

  const renderOverview = () => (
    <Box sx={{ position: 'relative', pb: 8 }}>
      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Current semester plan
          </Typography>
          <Button
            startIcon={<SettingsRoundedIcon />}
            variant="outlined"
            onClick={() => setIsTimelineDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Timeline settings
          </Button>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Slide in direction="up">
              <InteractivePanel
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid',
                  borderColor: 'rgba(148,163,184,0.18)',
                  boxShadow: '0 16px 32px rgba(15,23,42,0.3)',
                  height: '100%',
                }}
                hoverSx={{
                  boxShadow: '0 26px 52px rgba(59,130,246,0.32)',
                  borderColor: 'rgba(59,130,246,0.34)',
                }}
                lift={7}
              >
                <Stack spacing={2}>
                  <Typography variant="overline" sx={{ color: 'primary.light', letterSpacing: 2 }}>
                    Academic health
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#38bdf8' }}>
                      {averageGpa ?? '—'}
                    </Typography>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Average GPA
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                        Based on recorded previous classes.
                      </Typography>
                    </Stack>
                  </Stack>
                  {!averageGpa && (
                    <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.55)' }}>
                      Add your completed courses and grades to see GPA insights.
                    </Typography>
                  )}
                  {averageGpa && (
                    <Stack spacing={1}>
                      <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                        GPA scale assumes A=4.0 and subtracts 0.3 for each minus/plus step.
                      </Typography>
                      <Chip
                        label={`${gradedCoursesCount} graded courses`}
                        sx={{
                          alignSelf: 'flex-start',
                          background: 'rgba(59,130,246,0.2)',
                          color: '#f8fafc',
                        }}
                      />
                    </Stack>
                  )}
                </Stack>
              </InteractivePanel>
            </Slide>
          </Grid>
          <Grid item xs={12} md={8}>
            <Slide in direction="up" style={{ transitionDelay: '120ms' }}>
              <InteractivePanel
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: 'rgba(15,23,42,0.78)',
                  border: '1px solid',
                  borderColor: 'rgba(148,163,184,0.16)',
                  boxShadow: '0 18px 36px rgba(15,23,42,0.32)',
                  height: '100%',
                }}
                hoverSx={{
                  boxShadow: '0 26px 52px rgba(59,130,246,0.35)',
                  borderColor: 'rgba(59,130,246,0.38)',
                }}
                lift={8}
              >
                <Stack spacing={1}>
                  <Typography variant="overline" sx={{ color: 'primary.light', letterSpacing: 1.5 }}>
                    Quick stats
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                    Track your academic trajectory as you update semesters and past coursework.
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ mt: 2, flexWrap: 'wrap' }}
                  >
                    <InteractivePanel
                      component={Paper}
                      sx={{
                        flex: 1,
                        p: 3,
                        borderRadius: 2.5,
                        background: 'rgba(30,41,59,0.9)',
                        border: '1px solid',
                        borderColor: 'rgba(148,163,184,0.18)',
                        boxShadow: '0 14px 28px rgba(15,23,42,0.28)',
                      }}
                      hoverSx={{
                        boxShadow: '0 22px 42px rgba(59,130,246,0.28)',
                        borderColor: 'rgba(59,130,246,0.34)',
                      }}
                      lift={6}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {semesters.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                        Planned semesters
                      </Typography>
                    </InteractivePanel>
                    <InteractivePanel
                      component={Paper}
                      sx={{
                        flex: 1,
                        p: 3,
                        borderRadius: 2.5,
                        background: 'rgba(30,41,59,0.9)',
                        border: '1px solid',
                        borderColor: 'rgba(148,163,184,0.18)',
                        boxShadow: '0 14px 28px rgba(15,23,42,0.28)',
                      }}
                      hoverSx={{
                        boxShadow: '0 22px 42px rgba(59,130,246,0.28)',
                        borderColor: 'rgba(59,130,246,0.34)',
                      }}
                      lift={6}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {semesters.reduce((count, semester) => count + semester.classes.length, 0)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                        Planned classes
                      </Typography>
                    </InteractivePanel>
                    <InteractivePanel
                      component={Paper}
                      sx={{
                        flex: 1,
                        p: 3,
                        borderRadius: 2.5,
                        background: 'rgba(30,41,59,0.9)',
                        border: '1px solid',
                        borderColor: 'rgba(148,163,184,0.18)',
                        boxShadow: '0 14px 28px rgba(15,23,42,0.28)',
                      }}
                      hoverSx={{
                        boxShadow: '0 22px 42px rgba(59,130,246,0.28)',
                        borderColor: 'rgba(59,130,246,0.34)',
                      }}
                      lift={6}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {previousClasses.length}
                      </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                      Logged previous classes
                    </Typography>
                  </InteractivePanel>
                    <InteractivePanel
                      component={Paper}
                      sx={{
                        flex: 1,
                        p: 3,
                        borderRadius: 2.5,
                        background: 'rgba(30,41,59,0.9)',
                        border: '1px solid',
                        borderColor: 'rgba(148,163,184,0.18)',
                        boxShadow: '0 14px 28px rgba(15,23,42,0.28)',
                      }}
                      hoverSx={{
                        boxShadow: '0 22px 42px rgba(59,130,246,0.28)',
                        borderColor: 'rgba(59,130,246,0.34)',
                      }}
                      lift={6}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {friends.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                        Connected friends
                      </Typography>
                    </InteractivePanel>
                  </Stack>
                </Stack>
              </InteractivePanel>
            </Slide>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {semesters.map((semester, index) => (
            <Grid item xs={12} md={6} key={semester.id}>
              <Slide in direction="up" style={{ transitionDelay: `${index * 90}ms` }}>
                <InteractivePanel
                  sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5,
                    borderRadius: 3,
                    background: 'rgba(15,23,42,0.78)',
                    border: '1px solid',
                    borderColor: 'rgba(148,163,184,0.16)',
                    boxShadow: '0 18px 36px rgba(15,23,42,0.32)',
                  }}
                  hoverSx={{
                    boxShadow: '0 26px 52px rgba(59,130,246,0.35)',
                    borderColor: 'rgba(59,130,246,0.38)',
                  }}
                  lift={8}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="overline" sx={{ color: 'primary.light' }}>
                      {semester.year}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {semester.name} Semester
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                      Plan classes and track professor details.
                    </Typography>
                  </Stack>

                  {semester.classes.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(226,232,240,0.5)', fontStyle: 'italic' }}
                    >
                      No classes planned yet — use the add button to build your schedule.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {semester.classes.map((course, courseIndex) => (
                        <InteractivePanel
                          key={`${semester.id}-${course.name}-${courseIndex}`}
                          sx={{
                            p: 2.5,
                            borderRadius: 2.5,
                            background: 'rgba(30,41,59,0.9)',
                            border: '1px solid',
                            borderColor: 'rgba(148,163,184,0.18)',
                            boxShadow: '0 12px 28px rgba(15,23,42,0.28)',
                          }}
                          hoverSx={{
                            boxShadow: '0 22px 44px rgba(59,130,246,0.3)',
                            borderColor: 'rgba(59,130,246,0.4)',
                          }}
                          lift={6}
                        >
                          <Stack
                            direction="row"
                            alignItems="flex-start"
                            justifyContent="space-between"
                            spacing={2}
                          >
                            <Stack spacing={0.75}>
                              <Typography sx={{ fontWeight: 600 }}>
                                {course.name}
                              </Typography>
                              {course.professor && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <PersonRoundedIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                                  <Typography
                                    variant="body2"
                                    sx={{ color: 'rgba(226,232,240,0.78)' }}
                                  >
                                    {course.professor}
                                  </Typography>
                                </Stack>
                              )}
                              {course.rmp && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <LinkRoundedIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                                  <Typography
                                    component="a"
                                    href={
                                      course.rmp.startsWith('http')
                                        ? course.rmp
                                        : `https://${course.rmp}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    variant="body2"
                                    sx={{
                                      color: 'primary.light',
                                      textDecoration: 'none',
                                      '&:hover': { textDecoration: 'underline' },
                                    }}
                                  >
                                    Rate my professor
                                  </Typography>
                                </Stack>
                              )}
                            </Stack>
                            <Stack spacing={1} alignItems="flex-end">
                              {course.credits ? (
                                <Chip
                                  label={`${course.credits} credits`}
                                  size="small"
                                  sx={{
                                    background: 'rgba(59,130,246,0.25)',
                                    color: '#f8fafc',
                                  }}
                                />
                              ) : null}
                              <Button
                                size="small"
                                onClick={() => handleRemoveClass(semester.id, courseIndex)}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                              >
                                Remove
                              </Button>
                            </Stack>
                          </Stack>
                        </InteractivePanel>
                      ))}
                    </Stack>
                  )}
                </InteractivePanel>
              </Slide>
            </Grid>
          ))}
        </Grid>

        <InteractivePanel
          component={Paper}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(15,23,42,0.78)',
            border: '1px solid rgba(148,163,184,0.16)',
            boxShadow: '0 18px 36px rgba(15,23,42,0.28)',
          }}
          hoverSx={{
            boxShadow: '0 28px 56px rgba(59,130,246,0.32)',
            borderColor: 'rgba(59,130,246,0.32)',
          }}
          lift={7}
        >
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Professor insights
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.65)' }}>
                Keep track of who&apos;s teaching and their RMP links.
              </Typography>
            </Stack>

            {professorDirectory.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: 'rgba(226,232,240,0.5)', fontStyle: 'italic' }}
              >
                Add classes with professor details to see insights populate here.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {professorDirectory.map((entry) => (
                  <InteractivePanel
                    key={entry.professor}
                    sx={{
                      p: 3,
                      borderRadius: 2.5,
                      background: 'rgba(30,41,59,0.9)',
                      border: '1px solid',
                      borderColor: 'rgba(148,163,184,0.18)',
                      boxShadow: '0 18px 32px rgba(15,23,42,0.28)',
                    }}
                    hoverSx={{
                      boxShadow: '0 26px 52px rgba(59,130,246,0.32)',
                      borderColor: 'rgba(59,130,246,0.35)',
                    }}
                    lift={7}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {entry.professor[0].toUpperCase()}
                        </Avatar>
                        <Stack spacing={0.5}>
                          <Typography sx={{ fontWeight: 600 }}>
                            {entry.professor}
                          </Typography>
                          {entry.rmp ? (
                            <Typography
                              component="a"
                              href={
                                entry.rmp.startsWith('http')
                                  ? entry.rmp
                                  : `https://${entry.rmp}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              variant="body2"
                              sx={{
                                color: 'primary.light',
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              Rate my professor
                            </Typography>
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{ color: 'rgba(226,232,240,0.6)', fontStyle: 'italic' }}
                            >
                              RMP link not provided
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                      <Divider sx={{ borderColor: 'rgba(148,163,184,0.18)' }} />
                      <Stack spacing={1}>
                        {entry.courses.map((course) => (
                          <Stack
                            key={`${entry.professor}-${course.name}-${course.semester}`}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                              {course.name}
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{ color: 'rgba(226,232,240,0.6)', ml: 1 }}
                              >
                                ({course.semester})
                              </Typography>
                            </Typography>
                            {course.credits ? (
                              <Chip
                                label={`${course.credits}cr`}
                                size="small"
                                sx={{
                                  background: 'rgba(59,130,246,0.25)',
                                  color: '#f8fafc',
                                }}
                              />
                            ) : null}
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </InteractivePanel>
                ))}
              </Stack>
            )}
          </Stack>
        </InteractivePanel>
      </Stack>

      <Tooltip title="Add class" placement="left">
        <Fab
          color="primary"
          size="medium"
          onClick={handleOpenAddClassDialog}
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 32 },
            bottom: { xs: 16, md: 32 },
            boxShadow: '0 20px 45px rgba(59,130,246,0.45)',
            zIndex: 1300,
            transition: 'transform 200ms ease, box-shadow 200ms ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 24px 60px rgba(59,130,246,0.55)',
            },
          }}
        >
          <AddRoundedIcon />
        </Fab>
      </Tooltip>
    </Box>
  )

  const renderSchedule = () => (
    <Fade in>
      <Grid container spacing={3}>
        {scheduleUploads.map((item, index) => (
          <Grid item xs={12} md={4} key={item.key}>
            <Slide in direction="up" style={{ transitionDelay: `${index * 80}ms` }}>
              <InteractivePanel
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: 'rgba(15,23,42,0.75)',
                  border: '1px dashed',
                  borderColor: 'rgba(148,163,184,0.32)',
                  minHeight: 260,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                  boxShadow: '0 14px 30px rgba(15,23,42,0.28)',
                }}
                hoverSx={{
                  borderStyle: 'solid',
                  borderColor: 'rgba(59,130,246,0.38)',
                  boxShadow: '0 26px 48px rgba(59,130,246,0.3)',
                }}
                lift={7}
              >
                <Avatar
                  sx={{
                    bgcolor: 'rgba(59,130,246,0.25)',
                    color: 'primary.light',
                    width: 64,
                    height: 64,
                  }}
                >
                  <CloudUploadRoundedIcon fontSize="large" />
                </Avatar>
                <Stack spacing={1}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                    {item.helper}
                  </Typography>
                </Stack>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUploadRoundedIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Select file
                  <input
                    hidden
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls"
                    onChange={(event) =>
                      handleScheduleUpload(item.key, event.target.files?.[0] ?? null)
                    }
                  />
                </Button>
                {uploadedFiles[item.key] && (
                  <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.8)' }}>
                    Selected: {uploadedFiles[item.key].name}
                  </Typography>
                )}
              </InteractivePanel>
            </Slide>
          </Grid>
        ))}
      </Grid>
    </Fade>
  )

  const renderSettings = () => (
    <Fade in>
      <InteractivePanel
        component={Paper}
        sx={{
          p: 0,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(148,163,184,0.18)',
          maxWidth: 720,
          boxShadow: '0 22px 48px rgba(15,23,42,0.32)',
        }}
        hoverSx={{
          boxShadow: '0 32px 64px rgba(59,130,246,0.32)',
          borderColor: 'rgba(59,130,246,0.32)',
        }}
        lift={9}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.55), rgba(14,165,233,0.45))',
            py: 4,
            px: 5,
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: 'rgba(15,23,42,0.85)',
                color: '#f8fafc',
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {profileName ? profileName[0].toUpperCase() : 'S'}
            </Avatar>
            <Stack spacing={0.75}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Personal settings
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(248,250,252,0.8)' }}>
                Update your display details for this demo session.
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Box
          component="form"
          onSubmit={handleSettingsSubmit}
          sx={{ py: 5, px: { xs: 3, sm: 5 } }}
        >
          <Stack spacing={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Display name"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Account email"
                  value={userEmail ?? 'demo@hd4scheduler.com'}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password"
                  type="password"
                  value={profilePassword}
                  onChange={(event) => setProfilePassword(event.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Confirm password"
                  type="password"
                  value={profilePassword}
                  onChange={(event) => setProfilePassword(event.target.value)}
                  helperText="Demo only — changes are not persisted."
                  fullWidth
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button type="submit" variant="contained" sx={{ minWidth: 160 }}>
                Save changes
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setProfileName(defaultName)
                  setProfilePassword('demo-pass')
                }}
                sx={{ minWidth: 160 }}
              >
                Reset to defaults
              </Button>
            </Stack>

            <Collapse in={settingsSaved}>
              <Alert
                severity="success"
                variant="filled"
                sx={{ borderRadius: 2, alignItems: 'center' }}
              >
                Preferences saved for this demo session.
              </Alert>
            </Collapse>
          </Stack>
        </Box>
      </InteractivePanel>
    </Fade>
  )

  const renderPreviousClasses = () => (
    <Box sx={{ position: 'relative', pb: 8 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Completed coursework
        </Typography>
        <Grid container spacing={3}>
          {previousClasses.map((item, index) => (
            <Grid item xs={12} md={6} key={`${item.course}-${index}`}>
              <Slide in direction="up" style={{ transitionDelay: `${index * 80}ms` }}>
                <InteractivePanel
                  component={Card}
                  sx={{
                    borderRadius: 3,
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid',
                    borderColor: 'rgba(148,163,184,0.18)',
                    boxShadow: '0 16px 32px rgba(15,23,42,0.28)',
                  }}
                  hoverSx={{
                    boxShadow: '0 26px 54px rgba(59,130,246,0.32)',
                    borderColor: 'rgba(59,130,246,0.34)',
                  }}
                  lift={7}
                >
                  <CardHeader
                    avatar={
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(59,130,246,0.25)',
                          color: 'primary.light',
                        }}
                      >
                        <CheckCircleRoundedIcon />
                      </Avatar>
                    }
                    title={
                      <Typography sx={{ fontWeight: 600 }}>{item.course}</Typography>
                    }
                    subheader={
                      <Typography sx={{ color: 'rgba(226,232,240,0.7)' }}>
                        {item.semester}
                      </Typography>
                    }
                  />
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Chip
                        label={`Grade: ${item.grade || 'N/A'}`}
                        sx={{
                          alignSelf: 'flex-start',
                          background: 'rgba(59,130,246,0.25)',
                          color: '#f8fafc',
                          fontWeight: 600,
                        }}
                      />
                      {item.professor && (
                        <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.78)' }}>
                          Professor: {item.professor}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </InteractivePanel>
              </Slide>
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Tooltip title="Add previous class" placement="left">
        <Fab
          color="primary"
          size="medium"
          onClick={() => setIsAddPreviousClassOpen(true)}
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 32 },
            bottom: { xs: 16, md: 32 },
            boxShadow: '0 20px 45px rgba(59,130,246,0.45)',
            zIndex: 1300,
            transition: 'transform 200ms ease, box-shadow 200ms ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 24px 60px rgba(59,130,246,0.55)',
            },
          }}
        >
          <AddRoundedIcon />
        </Fab>
      </Tooltip>
    </Box>
  )

  const renderFriends = () => (
    <Fade in>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <InteractivePanel
              component={Paper}
              sx={{
                p: 4,
                borderRadius: 3,
                background: 'rgba(15,23,42,0.78)',
                border: '1px solid',
                borderColor: 'rgba(148,163,184,0.18)',
                boxShadow: '0 18px 36px rgba(15,23,42,0.28)',
              }}
              hoverSx={{
                boxShadow: '0 28px 56px rgba(59,130,246,0.32)',
                borderColor: 'rgba(59,130,246,0.34)',
              }}
              lift={7}
            >
              <Stack component="form" spacing={3} onSubmit={handleSendFriendInvite}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonAddRoundedIcon sx={{ color: 'primary.light' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Add a friend
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                  Invite friends by email to compare schedules and plan together.
                </Typography>
                <TextField
                  label="Friend email"
                  type="email"
                  value={friendEmailInput}
                  onChange={(event) => setFriendEmailInput(event.target.value)}
                  fullWidth
                />
                <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>
                  Send invite
                </Button>
              </Stack>
            </InteractivePanel>

            <InteractivePanel
              component={Paper}
              sx={{
                p: 4,
                borderRadius: 3,
                background: 'rgba(15,23,42,0.78)',
                border: '1px solid',
                borderColor: 'rgba(148,163,184,0.18)',
                boxShadow: '0 18px 36px rgba(15,23,42,0.28)',
              }}
              hoverSx={{
                boxShadow: '0 28px 56px rgba(59,130,246,0.32)',
                borderColor: 'rgba(59,130,246,0.34)',
              }}
              lift={7}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <MarkEmailUnreadRoundedIcon sx={{ color: 'primary.light' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Friend requests
                  </Typography>
                </Stack>
                {friendRequests.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(226,232,240,0.55)', fontStyle: 'italic' }}
                  >
                    No pending requests right now.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {friendRequests.map((request) => (
                      <InteractivePanel
                        key={request.id}
                        component={Paper}
                        sx={{
                          p: 2.5,
                          borderRadius: 2.5,
                          background: 'rgba(30,41,59,0.9)',
                          border: '1px solid',
                          borderColor: 'rgba(148,163,184,0.18)',
                          boxShadow: '0 12px 26px rgba(15,23,42,0.28)',
                        }}
                        hoverSx={{
                          boxShadow: '0 20px 40px rgba(59,130,246,0.28)',
                          borderColor: 'rgba(59,130,246,0.32)',
                        }}
                        lift={5}
                        highlightColor="rgba(124,58,237,0.4)"
                      >
                        <Stack spacing={1.5}>
                          <Stack spacing={0.25}>
                            <Typography sx={{ fontWeight: 600 }}>{request.name}</Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                              {request.email}
                            </Typography>
                          </Stack>
                          {request.mutualCourses?.length ? (
                            <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.6)' }}>
                              Mutual courses: {request.mutualCourses.join(', ')}
                            </Typography>
                          ) : null}
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleRespondFriendRequest(request.id, true)}
                              sx={{ textTransform: 'none' }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleRespondFriendRequest(request.id, false)}
                              sx={{ textTransform: 'none' }}
                            >
                              Decline
                            </Button>
                          </Stack>
                        </Stack>
                      </InteractivePanel>
                    ))}
                  </Stack>
                )}
              </Stack>
            </InteractivePanel>
          </Stack>
        </Grid>
        <Grid item xs={12} md={8}>
          <InteractivePanel
            component={Paper}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(15,23,42,0.78)',
              border: '1px solid',
              borderColor: 'rgba(148,163,184,0.18)',
              boxShadow: '0 18px 36px rgba(15,23,42,0.28)',
              minHeight: 420,
            }}
            hoverSx={{
              boxShadow: '0 28px 56px rgba(59,130,246,0.32)',
              borderColor: 'rgba(59,130,246,0.34)',
            }}
            lift={7}
          >
            <Stack spacing={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <EventAvailableRoundedIcon sx={{ color: 'primary.light' }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Friend schedules
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                Compare availability with your friends to coordinate study sessions or classes.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl sx={{ minWidth: { xs: '100%', sm: 240 } }}>
                  <InputLabel id="friend-select-label">Select friend</InputLabel>
                  <Select
                    labelId="friend-select-label"
                    label="Select friend"
                    value={selectedFriendId ?? ''}
                    onChange={(event) => setSelectedFriendId(event.target.value)}
                    displayEmpty
                  >
                    {friends.map((friend) => (
                      <MenuItem key={friend.id} value={friend.id}>
                        {friend.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Chip
                  label={`${friends.length} friends`}
                  sx={{
                    alignSelf: { xs: 'flex-start', sm: 'center' },
                    background: 'rgba(59,130,246,0.2)',
                    color: '#f8fafc',
                  }}
                />
              </Stack>
              {friends.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(226,232,240,0.55)', fontStyle: 'italic' }}
                >
                  Add friends to start viewing their schedules.
                </Typography>
              ) : selectedFriend ? (
                <InteractivePanel
                  component={Paper}
                  sx={{
                    p: 3,
                    borderRadius: 2.5,
                    background: 'rgba(30,41,59,0.9)',
                    border: '1px solid',
                    borderColor: 'rgba(148,163,184,0.18)',
                    boxShadow: '0 16px 32px rgba(15,23,42,0.28)',
                  }}
                  hoverSx={{
                    boxShadow: '0 26px 48px rgba(59,130,246,0.3)',
                    borderColor: 'rgba(59,130,246,0.34)',
                  }}
                  lift={6}
                >
                  <Stack spacing={2}>
                    <Stack spacing={0.5}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedFriend.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                        {selectedFriend.email}
                      </Typography>
                    </Stack>
                    <Divider sx={{ borderColor: 'rgba(148,163,184,0.18)' }} />
                    <Stack spacing={1.5}>
                      {selectedFriend.schedule.map((entry, index) => (
                        <InteractivePanel
                          key={`${selectedFriend.id}-${index}`}
                          component={Paper}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            background: 'rgba(15,23,42,0.85)',
                            border: '1px solid',
                            borderColor: 'rgba(148,163,184,0.14)',
                            boxShadow: '0 10px 24px rgba(15,23,42,0.25)',
                          }}
                          hoverSx={{
                            boxShadow: '0 18px 32px rgba(59,130,246,0.25)',
                            borderColor: 'rgba(59,130,246,0.3)',
                          }}
                          lift={4}
                          highlightColor="rgba(14,165,233,0.35)"
                        >
                          <Stack direction="row" justifyContent="space-between" spacing={2}>
                            <Typography sx={{ fontWeight: 600 }}>{entry.course}</Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.75)' }}>
                              {entry.day}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: 'rgba(148,163,184,0.8)' }}>
                            {entry.time}
                          </Typography>
                        </InteractivePanel>
                      ))}
                    </Stack>
                  </Stack>
                </InteractivePanel>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(226,232,240,0.55)', fontStyle: 'italic' }}
                >
                  Select a friend to view their schedule.
                </Typography>
              )}
            </Stack>
          </InteractivePanel>
        </Grid>
      </Grid>
    </Fade>
  )

  const content = {
    overview: renderOverview(),
    schedule: renderSchedule(),
    settings: renderSettings(),
    previousClasses: renderPreviousClasses(),
    friends: renderFriends(),
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <Drawer
        variant="permanent"
        elevation={0}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            px: 3,
            py: 4,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(148, 163, 184, 0.15)',
          },
        }}
      >
        <Stack spacing={5} sx={{ height: '100%' }}>
          <Fade in timeout={700}>
            <Stack spacing={1}>
              <Typography variant="overline" sx={{ color: 'primary.light' }}>
                HD4 SCHEDULER
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.65)' }}>
                Navigate your academic planning experience.
              </Typography>
            </Stack>
          </Fade>

          <List sx={{ flexGrow: 1 }}>
            {navigationItems.map((item, index) => {
              const isActive = activeSection === item.value
              return (
                <Slide
                  key={item.value}
                  direction="right"
                  in
                  style={{ transitionDelay: `${index * 80 + 200}ms` }}
                >
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemButton
                      onClick={() => setActiveSection(item.value)}
                      sx={{
                        borderRadius: 2,
                        color: isActive ? '#f8fafc' : '#e2e8f0',
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(14,165,233,0.22))'
                          : 'transparent',
                        transform: isActive ? 'translateX(6px)' : 'none',
                        transition:
                          'transform 220ms ease, background 220ms ease, color 220ms ease',
                        '&:hover': {
                          background: 'rgba(59,130,246,0.15)',
                          transform: 'translateX(6px)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? '#f8fafc' : 'primary.light',
                          minWidth: 42,
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 600 }}>{item.label}</Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </Slide>
              )
            })}
          </List>

          <Box>
            <Divider sx={{ borderColor: 'rgba(148,163,184,0.18)', mb: 2 }} />
            <ListItem disablePadding sx={{ mb: 2 }}>
              <ListItemButton
                onClick={() => setActiveSection('settings')}
                selected={activeSection === 'settings'}
                sx={{
                  borderRadius: 2,
                  color: activeSection === 'settings' ? '#f8fafc' : '#e2e8f0',
                  background:
                    activeSection === 'settings'
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(14,165,233,0.22))'
                      : 'transparent',
                  '&:hover': {
                    background: 'rgba(59,130,246,0.15)',
                    transform: 'translateX(6px)',
                  },
                  transform: activeSection === 'settings' ? 'translateX(6px)' : 'none',
                  transition: 'transform 220ms ease, background 220ms ease, color 220ms ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: activeSection === 'settings' ? '#f8fafc' : 'primary.light',
                    minWidth: 42,
                  }}
                >
                  <SettingsRoundedIcon />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600 }}>Settings</Typography>}
                />
              </ListItemButton>
            </ListItem>

            <Box
              onMouseEnter={() => setShowSignOut(true)}
              onMouseLeave={() => setShowSignOut(false)}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {userEmail ? userEmail[0].toUpperCase() : 'S'}
                </Avatar>
                <Stack spacing={0.25}>
                  <Typography sx={{ color: '#f8fafc', fontWeight: 600 }}>
                    {userEmail ?? 'Guest User'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(226,232,240,0.65)' }}>
                    Hover to sign out
                  </Typography>
                </Stack>
              </Stack>
              <Collapse in={showSignOut}>
                <Button
                  startIcon={<LogoutRoundedIcon />}
                  onClick={onLogout}
                  fullWidth
                  sx={{
                    mt: 2,
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    textTransform: 'none',
                  }}
                >
                  Sign out
                </Button>
              </Collapse>
            </Box>
          </Box>
        </Stack>
      </Drawer>

      <Box
        component="section"
        sx={{
          flexGrow: 1,
          ml: `${drawerWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          position: 'relative',
          background:
            'radial-gradient(circle at 65% 20%, rgba(59,130,246,0.25), transparent 60%), radial-gradient(circle at 10% 75%, rgba(14,165,233,0.2), transparent 60%), linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        }}
      >
        <AppBar
          position="static"
          sx={{
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 10px 40px rgba(15,23,42,0.35)',
          }}
        >
          <Toolbar>
            <Stack>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Hello, {userEmail ?? 'Scheduler'} 👋
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.75)' }}>
                Here&apos;s an overview of your academic schedule.
              </Typography>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, px: { xs: 3, md: 6 }, py: 6 }}>{content[activeSection]}</Box>
      </Box>

      <Dialog
        open={isTimelineDialogOpen}
        onClose={() => setIsTimelineDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Timeline settings</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              label="Starting academic year"
              type="number"
              value={startYear}
              onChange={(event) => setStartYear(event.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="timeline-first-semester-label">First semester</InputLabel>
              <Select
                labelId="timeline-first-semester-label"
                label="First semester"
                value={firstSemester}
                onChange={(event) => setFirstSemester(event.target.value)}
              >
                {semesterSequence.map((semesterOption) => (
                  <MenuItem key={semesterOption} value={semesterOption}>
                    {semesterOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Total semesters"
              type="number"
              value={semesterCount}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (!Number.isNaN(value) && value > 0) {
                  setSemesterCount(value)
                }
              }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTimelineDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isAddClassDialogOpen}
        onClose={() => setIsAddClassDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add a class</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="add-class-semester-label">Semester</InputLabel>
              <Select
                labelId="add-class-semester-label"
                label="Semester"
                value={newClassForm.semesterId}
                onChange={(event) =>
                  setNewClassForm((prev) => ({ ...prev, semesterId: event.target.value }))
                }
              >
                {semesters.map((semester) => (
                  <MenuItem key={semester.id} value={semester.id}>
                    {semester.name} {semester.year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Class name"
              value={newClassForm.name}
              onChange={(event) =>
                setNewClassForm((prev) => ({ ...prev, name: event.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Credits"
              type="number"
              value={newClassForm.credits}
              onChange={(event) =>
                setNewClassForm((prev) => ({ ...prev, credits: event.target.value }))
              }
            />
            <TextField
              label="Professor"
              value={newClassForm.professor}
              onChange={(event) =>
                setNewClassForm((prev) => ({ ...prev, professor: event.target.value }))
              }
            />
            <TextField
              label="Rate My Professor link"
              value={newClassForm.rmp}
              onChange={(event) =>
                setNewClassForm((prev) => ({ ...prev, rmp: event.target.value }))
              }
              placeholder="https://www.ratemyprofessors.com/..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddClassDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddClass} variant="contained">
            Add class
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isAddPreviousClassOpen}
        onClose={() => setIsAddPreviousClassOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add previous class</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              label="Class name"
              value={previousClassForm.course}
              onChange={(event) =>
                setPreviousClassForm((prev) => ({ ...prev, course: event.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Semester"
              value={previousClassForm.semester}
              onChange={(event) =>
                setPreviousClassForm((prev) => ({ ...prev, semester: event.target.value }))
              }
              placeholder="Fall 2024"
              fullWidth
            />
            <TextField
              label="Grade"
              value={previousClassForm.grade}
              onChange={(event) =>
                setPreviousClassForm((prev) => ({ ...prev, grade: event.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Professor"
              value={previousClassForm.professor}
              onChange={(event) =>
                setPreviousClassForm((prev) => ({
                  ...prev,
                  professor: event.target.value,
                }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddPreviousClassOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPreviousClass} variant="contained">
            Add class
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HomePage
