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
  CircularProgress,
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
  IconButton,
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
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import InteractivePanel from '../components/InteractivePanel.jsx'
import ProfessorDetails from '../components/ProfessorDetails.jsx'
import ProfessorSelector from '../components/ProfessorSelector.jsx'
import ApiService from '../services/api'

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

const HomePage = ({ onLogout, user }) => {
  const [activeSection, setActiveSection] = useState('overview')
  const [startYear, setStartYear] = useState(new Date().getFullYear())
  const [firstSemester, setFirstSemester] = useState('Fall')
  const [semesterCount, setSemesterCount] = useState(4)
  const [semesters, setSemesters] = useState(() =>
    generateSemesters(new Date().getFullYear(), 'Fall', 4).map((semester) => ({
      ...semester,
      backendId: null,
      classes: [],
    })),
  )
  const [showSignOut, setShowSignOut] = useState(false)
  const userEmail = user?.email || ''
  const defaultName = useMemo(
    () => user?.displayName || (userEmail ? userEmail.split('@')[0] : 'Student User'),
    [user, userEmail],
  )
  const [profileName, setProfileName] = useState(defaultName)
  const [profilePassword, setProfilePassword] = useState('demo-pass')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState({
    pathway: null,
    previous: null,
    current: null,
  })
  const [existingUploads, setExistingUploads] = useState({
    'pathway-plan': [],
    'previous-classes': [],
    'current-semester': [],
  })
  const [uploadStatus, setUploadStatus] = useState({
    pathway: { loading: false, error: null },
    previous: { loading: false, error: null },
    current: { loading: false, error: null },
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
  const [isProfessorSelectorOpen, setIsProfessorSelectorOpen] = useState(false)
  const [newClassForm, setNewClassForm] = useState({
    semesterId: '',
    name: '',
    credits: '',
    professor: '',
    rmp: '',
  })
  
  // Schedule generation state
  const [activeGenerationSemesterId, setActiveGenerationSemesterId] = useState(null)
  const [loadingGenerationSemesterId, setLoadingGenerationSemesterId] = useState(null)
  const [semesterPendingProfessorSelection, setSemesterPendingProfessorSelection] = useState(null)
  const [generatedSemesters, setGeneratedSemesters] = useState(new Set())
  const [generatedCourses, setGeneratedCourses] = useState([])
  const [isProfessorChoiceDialogOpen, setIsProfessorChoiceDialogOpen] = useState(false)
  const [currentCourseForProfessor, setCurrentCourseForProfessor] = useState(null)
  const [agentRecommendations, setAgentRecommendations] = useState({})
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
          : { ...semester, backendId: null, classes: [] }
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
    const eligibleSemesters = semesters
      .filter((semester) => semester.classes.length === 0 && !generatedSemesters.has(semester.id))
      .map((semester) => semester.id)

    if (eligibleSemesters.length === 0) {
      if (activeGenerationSemesterId !== null) {
        setActiveGenerationSemesterId(null)
      }
      return
    }

    const desiredActiveId = eligibleSemesters.includes(activeGenerationSemesterId)
      ? activeGenerationSemesterId
      : eligibleSemesters[0]

    if (desiredActiveId !== activeGenerationSemesterId) {
      setActiveGenerationSemesterId(desiredActiveId)
    }
  }, [semesters, generatedSemesters, activeGenerationSemesterId])

  // Load existing uploads on mount
  useEffect(() => {
    const loadUploads = async () => {
      try {
        const types = ['pathway-plan', 'previous-classes', 'current-semester']
        for (const type of types) {
          const response = await ApiService.getUploads(type)
          setExistingUploads((prev) => ({
            ...prev,
            [type]: response.uploads || [],
          }))
        }
      } catch (error) {
        console.error('Error loading uploads:', error)
      }
    }
    loadUploads()
  }, [])

  // Load semesters from database on mount
  useEffect(() => {
    loadSemestersFromDatabase()
  }, [])
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

  const handleRemoveClass = async (semesterId, classId) => {
    try {
      // If classId is a database ID (number), delete from database
      if (typeof classId === 'number' || (typeof classId === 'string' && !classId.includes('-'))) {
        // Get semester ID from database
        const [year, semesterName] = semesterId.split('-')
        const existingSemesters = await ApiService.getSemesters(parseInt(year))
        const semesterInDb = existingSemesters.semesters?.find(
          s => s.year === parseInt(year) && s.name === semesterName
        )
        
        if (semesterInDb) {
          await ApiService.deleteClass(semesterInDb.id, classId)
        }
      }
      
      // Update local state
      setSemesters((prev) =>
        prev.map((semester) =>
          semester.id === semesterId
            ? {
                ...semester,
                classes: semester.classes.filter((cls) => cls.id !== classId),
              }
            : semester,
        ),
      )
    } catch (error) {
      console.error('Error removing class:', error)
      alert('Failed to remove class. Please try again.')
    }
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

  const handleAddClass = async () => {
    if (!newClassForm.name.trim() || !newClassForm.semesterId) return

    try {
      const { backendId } = await ensureSemesterInDatabase(newClassForm.semesterId)

      if (!backendId) {
        throw new Error('Unable to determine semester identifier for class creation')
      }

      const creditsValue = newClassForm.credits ? Number(newClassForm.credits) : 3
      
      // Save class to database
      const classData = {
        name: newClassForm.name.trim(),
        credits: Number.isNaN(creditsValue) ? 3 : creditsValue,
        professor: newClassForm.professor.trim() || '',
        rateMyProfessorUrl: newClassForm.rmp.trim() || '',
        rmpLink: newClassForm.rmp.trim() || ''
      }
      
      await ApiService.createClass(backendId, classData)
      
      // Reload semesters from database to get the updated data
      await loadSemestersFromDatabase()
      
      setIsAddClassDialogOpen(false)
      // Reset form after adding
      setNewClassForm({
        semesterId: semesters.length > 0 ? semesters[0].id : '',
        name: '',
        credits: '',
        professor: '',
        rmp: '',
      })
    } catch (error) {
      console.error('Error adding class:', error)
      alert('Failed to add class. Please try again.')
    }
  }

  const handleAddProfessorFromClassForm = (professorData) => {
    // Update the form with the selected professor
    setNewClassForm(prev => ({
      ...prev,
      professor: professorData.professor,
      rmp: professorData.rmp,
    }))
  }

  const handleAddProfessorToSchedule = (professorData) => {
    // Add the class with the selected professor to the schedule
    const creditsValue = 3; // Default credits, could be configurable
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === professorData.semesterId
          ? {
              ...semester,
              classes: [
                ...semester.classes,
                {
                  name: professorData.name,
                  credits: creditsValue,
                  professor: professorData.professor,
                  rmp: professorData.rmp,
                },
              ],
            }
          : semester,
      ),
    )
  }

  const handleScheduleUpload = async (key, file) => {
    if (!file) return
    
    // Map UI key to API type
    const typeMapping = {
      pathway: 'pathway-plan',
      previous: 'previous-classes',
      current: 'current-semester',
    }
    const uploadType = typeMapping[key]
    
    setUploadStatus((prev) => ({
      ...prev,
      [key]: { loading: true, error: null },
    }))
    
    try {
      await ApiService.uploadFile(file, uploadType)
      setUploadedFiles((prev) => ({
        ...prev,
        [key]: file,
      }))
      
      // Reload uploads for this type
      const response = await ApiService.getUploads(uploadType)
      setExistingUploads((prev) => ({
        ...prev,
        [uploadType]: response.uploads || [],
      }))
      
      setUploadStatus((prev) => ({
        ...prev,
        [key]: { loading: false, error: null },
      }))
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus((prev) => ({
        ...prev,
        [key]: { loading: false, error: error.message },
      }))
    }
  }

  const handleDeleteUpload = async (uploadId, type) => {
    try {
      await ApiService.deleteUpload(uploadId)
      
      // Reload uploads for this type
      const response = await ApiService.getUploads(type)
      setExistingUploads((prev) => ({
        ...prev,
        [type]: response.uploads || [],
      }))
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleSettingsSubmit = async (event) => {
    event.preventDefault()
    
    try {
      // Update user profile on backend
      await ApiService.updateUserProfile({
        displayName: profileName,
      })
      
      setSettingsSaved(true)
      
      // Optionally update local user state if passed from parent
      // This would require passing a user update function from App.jsx
    } catch (error) {
      console.error('Error updating profile:', error)
      // Could add error state here to show user
    }
  }

  const ensureSemesterInDatabase = async (displaySemesterId) => {
    if (!displaySemesterId) {
      throw new Error('Semester identifier missing')
    }

    const [yearPart, ...nameParts] = displaySemesterId.split('-')
    const year = parseInt(yearPart, 10)
    const semesterName = nameParts.join('-')

    if (Number.isNaN(year) || !semesterName) {
      throw new Error(`Invalid semester identifier: ${displaySemesterId}`)
    }

    const semesterFromState = semesters.find((semester) => semester.id === displaySemesterId)
    if (semesterFromState?.backendId) {
      return {
        backendId: semesterFromState.backendId,
        year: semesterFromState.year,
        name: semesterFromState.name
      }
    }

    let semesterInDb = null

    const localYearCount = semesters.filter((semester) => semester.year === year).length

    let inferredPosition = Math.max(localYearCount, 0)

    try {
      const existingSemesters = await ApiService.getSemesters(year)
      const semesterList = existingSemesters.semesters ?? []
      const remoteMax = semesterList.reduce((max, entry) => Math.max(max, entry.position ?? 0), -1)
      inferredPosition = Math.max(remoteMax + 1, localYearCount)

      semesterInDb = semesterList.find(
        (s) => s.year === year && s.name === semesterName
      )
    } catch (err) {
      console.warn('Semester lookup failed, will create if needed', err)
    }

    if (!semesterInDb) {
      const createdSemester = await ApiService.createSemester({
        name: semesterName,
        year,
        position: inferredPosition >= 0 ? inferredPosition : 0,
      })
      semesterInDb = createdSemester?.semester ?? createdSemester
    }

    const backendId =
      semesterInDb?.id ||
      semesterInDb?.semester_id ||
      `${year}-${semesterName.toLowerCase()}`

    const dbPosition = semesterInDb?.position ?? inferredPosition ?? 0

    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === displaySemesterId
          ? { ...semester, backendId, name: semesterName, year, position: dbPosition }
          : semester
      )
    )

    return { backendId, year, name: semesterName, position: dbPosition }
  }

  const getCourseKey = (course) => {
    if (!course) return ''
    return course.course_code ? `${course.course_code}__${course.course_name}` : course.course_name
  }

  const buildRateMyProfessorUrl = (professorId) =>
    professorId ? `https://www.ratemyprofessors.com/professor/${professorId}` : ''

  const handleGenerateSchedule = async (semesterId) => {
    setActiveGenerationSemesterId(semesterId)
    setLoadingGenerationSemesterId(semesterId)
    setSemesterPendingProfessorSelection(null)
    setGeneratedCourses([])
    setCurrentCourseForProfessor(null)
    setAgentRecommendations({})

    try {
      // Generate exactly 4 classes for the semester
      const mockCourses = [
        {
          school_name: "University of Michigan - Dearborn",
          department: "Computer Science",
          course_number: "450",
          course_name: "Database Systems",
          semester_code: semesterId.split('-')[1].toLowerCase().substring(0, 1) + semesterId.split('-')[0].substring(2),
          dept_code: "CIS"
        },
        {
          school_name: "University of Michigan - Dearborn",
          department: "Computer Science", 
          course_number: "485",
          course_name: "Software Engineering",
          semester_code: semesterId.split('-')[1].toLowerCase().substring(0, 1) + semesterId.split('-')[0].substring(2),
          dept_code: "CIS"
        },
        {
          school_name: "University of Michigan - Dearborn",
          department: "Computer Science",
          course_number: "375",
          course_name: "Web Development",
          semester_code: semesterId.split('-')[1].toLowerCase().substring(0, 1) + semesterId.split('-')[0].substring(2),
          dept_code: "CIS"
        },
        {
          school_name: "University of Michigan - Dearborn",
          department: "Computer Science",
          course_number: "430",
          course_name: "Data Structures",
          semester_code: semesterId.split('-')[1].toLowerCase().substring(0, 1) + semesterId.split('-')[0].substring(2),
          dept_code: "CIS"
        }
      ]
      
      // Call generate-schedule endpoint
      const result = await ApiService.generateSchedule(mockCourses)
      
      if (result.schedule) {
        // Extract courses from schedule
        const semesterKey = Object.keys(result.schedule)[0]
        const courses = (result.schedule[semesterKey] || []).slice(0, 4)
        const normalizedCourses = courses.map((course) => {
          if (course.course_code) {
            return course
          }

          const fallbackSource = mockCourses.find(
            (mockCourse) => mockCourse.course_name === course.course_name
          )

          let courseCode = null
          if (fallbackSource) {
            const prefix = fallbackSource.dept_code || ''
            courseCode = `${prefix ? `${prefix} ` : ''}${fallbackSource.course_number}`.trim()
          }

          return {
            ...course,
            course_code: courseCode,
          }
        })

        if (normalizedCourses.length === 0) {
          setSemesterPendingProfessorSelection(null)
          alert('No courses were generated for this semester. Please try again.')
          return
        }

        setSemesterPendingProfessorSelection(semesterId)
        
        // Get AI recommendations for each course
        const recommendationsMap = {}
        
        for (const course of normalizedCourses) {
          if (course.professors && course.professors.length > 0) {
            try {
              const agentResponse = await ApiService.getAgentRecommendations(
                ['engaging', 'clear', 'helpful'], // Default preferences
                [{
                  course: course.course_name,
                  instructors: course.professors.map(prof => ({
                    name: prof.name,
                    score_overall: prof.avgRating || 0,
                    would_take_again_pct: prof.wouldTakeAgainPercent || 0,
                    difficulty: prof.avgDifficulty || 3.0,
                    recent_evals: prof.latestComments || []
                  }))
                }]
              )
              
              if (agentResponse.success) {
                const courseKey = getCourseKey(course)
                recommendationsMap[courseKey] = {
                  recommendations: agentResponse.recommendations,
                  professors: course.professors
                }
              }
            } catch (err) {
              console.error(`Error getting recommendations for ${course.course_name}:`, err)
            }
          }
        }
        
        setAgentRecommendations(recommendationsMap)
        setGeneratedCourses(normalizedCourses)

        // Start professor selection flow
        setCurrentCourseForProfessor(normalizedCourses[0])
        setIsProfessorChoiceDialogOpen(true)
      } else {
        setSemesterPendingProfessorSelection(null)
        alert('No schedule data was returned. Please try again.')
      }
    } catch (error) {
      console.error('Error generating schedule:', error)
      setSemesterPendingProfessorSelection(null)
      alert('Failed to generate schedule. Please try again.')
    } finally {
      setLoadingGenerationSemesterId(null)
    }
  }

  const handleProfessorChoice = async (professor) => {
    if (!semesterPendingProfessorSelection || !currentCourseForProfessor) return

    const targetSemesterId = semesterPendingProfessorSelection
    const courseIndex = generatedCourses.findIndex(c => c === currentCourseForProfessor)

    try {
      const { backendId } = await ensureSemesterInDatabase(targetSemesterId)

      if (!backendId) {
        throw new Error('Unable to resolve semester identifier for saving class')
      }

      const rateMyProfessorUrl = buildRateMyProfessorUrl(professor.id)

      const classData = {
        name: currentCourseForProfessor.course_name,
        credits: parseInt(currentCourseForProfessor.credits || '3', 10),
        professor: professor.name,
        rateMyProfessorUrl,
        rmpLink: rateMyProfessorUrl,
      }

      await ApiService.createClass(backendId, classData)

      setSemesters((prev) =>
        prev.map((semester) =>
          semester.id === targetSemesterId
            ? {
                ...semester,
                backendId,
                classes: [
                  ...semester.classes,
                  {
                    id: `${semester.id}-${currentCourseForProfessor.course_name}-${Date.now()}`,
                    name: currentCourseForProfessor.course_name,
                    courseCode: currentCourseForProfessor.course_code || '',
                    credits: currentCourseForProfessor.credits || '3',
                    professor: professor.name,
                    rmp: rateMyProfessorUrl,
                    professorData: professor,
                  },
                ].slice(0, 4),
              }
            : semester
        )
      )

      if (courseIndex < generatedCourses.length - 1) {
        setCurrentCourseForProfessor(generatedCourses[courseIndex + 1])
      } else {
        await loadSemestersFromDatabase()

        setIsProfessorChoiceDialogOpen(false)
        setGeneratedSemesters(prev => {
          const updated = new Set(prev)
          updated.add(targetSemesterId)
          return updated
        })
        setGeneratedCourses([])
        setCurrentCourseForProfessor(null)
        setAgentRecommendations({})
        setSemesterPendingProfessorSelection(null)
      }
    } catch (error) {
      console.error('Error saving class:', error)
      alert('Failed to save class. Please try again.')
    }
  }

  const handleSkipProfessor = async () => {
    if (!semesterPendingProfessorSelection || !currentCourseForProfessor) return

    // Add class without professor
    const courseIndex = generatedCourses.findIndex(c => c === currentCourseForProfessor)
    const targetSemesterId = semesterPendingProfessorSelection
    
    try {
      const { backendId } = await ensureSemesterInDatabase(targetSemesterId)

      if (!backendId) {
        throw new Error('Unable to resolve semester identifier for saving class')
      }

      const classData = {
        name: currentCourseForProfessor.course_name,
        credits: parseInt(currentCourseForProfessor.credits || '3', 10),
        professor: 'TBD',
        rateMyProfessorUrl: '',
        rmpLink: '',
      }

      await ApiService.createClass(backendId, classData)

      setSemesters((prev) =>
        prev.map((semester) =>
          semester.id === targetSemesterId
            ? {
                ...semester,
                backendId,
                classes: [
                  ...semester.classes,
                  {
                    id: `${semester.id}-${currentCourseForProfessor.course_name}-${Date.now()}`,
                    name: currentCourseForProfessor.course_name,
                    courseCode: currentCourseForProfessor.course_code || '',
                    credits: currentCourseForProfessor.credits || '3',
                    professor: 'TBD',
                    rmp: '',
                  },
                ].slice(0, 4),
              }
            : semester
        )
      )
      
      if (courseIndex < generatedCourses.length - 1) {
        setCurrentCourseForProfessor(generatedCourses[courseIndex + 1])
      } else {
        await loadSemestersFromDatabase()
        
        setIsProfessorChoiceDialogOpen(false)
        setGeneratedSemesters(prev => {
          const updated = new Set(prev)
          updated.add(targetSemesterId)
          return updated
        })
        setGeneratedCourses([])
        setCurrentCourseForProfessor(null)
        setAgentRecommendations({})
        setSemesterPendingProfessorSelection(null)
      }
    } catch (error) {
      console.error('Error saving class:', error)
      alert('Failed to save class. Please try again.')
    }
  }

  // Load semesters from database
  const loadSemestersFromDatabase = async () => {
    try {
      const response = await ApiService.getSemesters(null, true) // Get all semesters with classes
      
      if (response.semesters && response.semesters.length > 0) {
        // Convert database semesters to local state format
        const dbSemesters = response.semesters.map(semester => ({
          id: `${semester.year}-${semester.name}`,
          backendId: semester.id,
          name: semester.name,
          year: semester.year,
          classes: semester.classes?.map(cls => ({
            id: cls.id,
            name: cls.name,
            courseCode: cls.courseCode || '',
            credits: cls.credits?.toString() || '3',
            professor: cls.professor || '',
            rmp: cls.rateMyProfessorUrl || '',
          })) || []
        }))
        
        // Merge with generated semesters that don't exist in DB yet
        setSemesters(prev => {
          const merged = [...prev]
          dbSemesters.forEach(dbSem => {
            const index = merged.findIndex(s => s.id === dbSem.id)
            if (index >= 0) {
              merged[index] = {
                ...merged[index],
                ...dbSem,
              }
            } else {
              merged.push(dbSem)
            }
          })
          return merged
        })
        
        // Mark semesters that have classes as generated
        const semestersWithClasses = new Set(
          dbSemesters
            .filter(s => s.classes.length > 0)
            .map(s => s.id)
        )
        setGeneratedSemesters(semestersWithClasses)
      }
    } catch (error) {
      console.error('Error loading semesters:', error)
    }
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
                    <Stack spacing={2}>
                      <Typography
                        variant="body2"
                        sx={{ color: 'rgba(226,232,240,0.5)', fontStyle: 'italic' }}
                      >
                        No classes planned yet
                      </Typography>
                      {generatedSemesters.has(semester.id) ? (
                        <Button
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: 'primary.main',
                            color: 'primary.light',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: 'primary.light',
                              background: 'rgba(59,130,246,0.1)',
                            }
                          }}
                        >
                          📝 INSERT/UPDATE GRADES
                        </Button>
                      ) : loadingGenerationSemesterId === semester.id ? (
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                          <CircularProgress size={20} />
                          <Typography variant="body2" sx={{ color: 'primary.light' }}>
                            Generating schedule...
                          </Typography>
                        </Stack>
                      ) : activeGenerationSemesterId === semester.id ? (
                        <Button
                          variant="contained"
                          onClick={() => handleGenerateSchedule(semester.id)}
                          sx={{
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            }
                          }}
                        >
                          🤖 Generate with AI
                        </Button>
                      ) : (
                        <Button
                          disabled={Boolean(loadingGenerationSemesterId)}
                          variant="outlined"
                          onClick={() => setActiveGenerationSemesterId(semester.id)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: 'rgba(148,163,184,0.4)',
                            color: 'rgba(226,232,240,0.8)',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: 'primary.light',
                              color: 'primary.light',
                              background: 'rgba(59,130,246,0.08)',
                            }
                          }}
                        >
                          Focus this semester
                        </Button>
                      )}
                    </Stack>
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
                              {course.professor && (
                                <ProfessorDetails 
                                  professor={{ 
                                    name: course.professor,
                                    id: 'unknown',
                                    avgRating: null,
                                    avgDifficulty: null,
                                    wouldTakeAgainPercent: null,
                                    teacherTags: [],
                                    latestComments: []
                                  }} 
                                  courseName={course.name}
                                  expandedInitially={false}
                                />
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
                                onClick={() => handleRemoveClass(semester.id, course.id)}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                              >
                                Remove
                              </Button>
                            </Stack>
                          </Stack>
                        </InteractivePanel>
                      ))}
                      
                      {generatedSemesters.has(semester.id) && (
                        <Button
                          variant="outlined"
                          sx={{
                            mt: 2,
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: 'primary.main',
                            color: 'primary.light',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: 'primary.light',
                              background: 'rgba(59,130,246,0.1)',
                            }
                          }}
                        >
                          📝 INSERT/UPDATE GRADES
                        </Button>
                      )}
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
                  startIcon={uploadStatus[item.key]?.loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadRoundedIcon />}
                  disabled={uploadStatus[item.key]?.loading}
                  sx={{ borderRadius: 2 }}
                >
                  {uploadStatus[item.key]?.loading ? 'Uploading...' : 'Select file'}
                  <input
                    hidden
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls"
                    onChange={(event) =>
                      handleScheduleUpload(item.key, event.target.files?.[0] ?? null)
                    }
                  />
                </Button>
                
                {uploadStatus[item.key]?.error && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {uploadStatus[item.key].error}
                  </Alert>
                )}
                
                {uploadedFiles[item.key] && !uploadStatus[item.key]?.loading && !uploadStatus[item.key]?.error && (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Uploaded: {uploadedFiles[item.key].name}
                  </Alert>
                )}
                
                {/* Show existing uploads */}
                {(() => {
                  const typeMapping = {
                    pathway: 'pathway-plan',
                    previous: 'previous-classes',
                    current: 'current-semester',
                  }
                  const uploads = existingUploads[typeMapping[item.key]] || []
                  
                  if (uploads.length > 0) {
                    return (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(226,232,240,0.6)' }}>
                          Previous uploads:
                        </Typography>
                        {uploads.slice(0, 3).map((upload) => (
                          <Stack
                            key={upload.id}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              background: 'rgba(100,116,139,0.1)',
                            }}
                          >
                            <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem', color: 'rgba(226,232,240,0.8)' }}>
                              {upload.originalName}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUpload(upload.id, typeMapping[item.key])}
                              sx={{ color: 'error.light' }}
                            >
                              <DeleteRoundedIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        ))}
                      </Stack>
                    )
                  }
                  return null
                })()}
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
            <Button
              variant="outlined"
              onClick={() => {
                setIsProfessorSelectorOpen(true);
                setIsAddClassDialogOpen(false);
              }}
              sx={{ mt: 2 }}
            >
              Find Professor with RMP Integration
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddClassDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddClass} variant="contained">
            Add class
          </Button>
        </DialogActions>
      </Dialog>

      <ProfessorSelector
        open={isProfessorSelectorOpen}
        onClose={() => {
          setIsProfessorSelectorOpen(false);
          setIsAddClassDialogOpen(true); // Return to add class dialog
        }}
        onAddProfessor={handleAddProfessorToSchedule}
        semesterId={newClassForm.semesterId}
        currentCourseName={newClassForm.name}
        currentProfessor={newClassForm.professor}
      />

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

      {/* Professor Choice Dialog for Generated Schedule */}
      <Dialog
        open={isProfessorChoiceDialogOpen}
        onClose={() => {}}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
      >
      <DialogTitle>
        {currentCourseForProfessor && (
          <Stack spacing={1}>
            <Typography variant="h6">
              {`Choose Professor for ${currentCourseForProfessor.course_code ? `${currentCourseForProfessor.course_code} — ${currentCourseForProfessor.course_name}` : currentCourseForProfessor.course_name}`}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
              AI-recommended professors based on your preferences
            </Typography>
          </Stack>
        )}
      </DialogTitle>
        <DialogContent dividers>
          {currentCourseForProfessor && (
            <Stack spacing={3}>
              {/* AI Recommendations */}
              {agentRecommendations[getCourseKey(currentCourseForProfessor)]?.recommendations && (
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.15))',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 2,
                  }}
                >
                  <CardHeader
                    title={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ fontWeight: 600 }}>
                          🤖 AI Recommendation
                        </Typography>
                      </Stack>
                    }
                  />
                  <CardContent>
                    <Stack spacing={1.5}>
                      {agentRecommendations[getCourseKey(currentCourseForProfessor)].recommendations.map((rec, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 2,
                            borderRadius: 1.5,
                            background: 'rgba(30,41,59,0.5)',
                            border: '1px solid rgba(148,163,184,0.15)',
                          }}
                        >
                          <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.95)' }}>
                            {rec}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Professor List */}
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Available Professors:
                </Typography>
              {currentCourseForProfessor.professors?.map((prof, idx) => (
                  <Card
                    key={prof.id || idx}
                    sx={{
                      background: 'rgba(30,41,59,0.9)',
                      border: '1px solid rgba(148,163,184,0.18)',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        background: 'rgba(59,130,246,0.1)',
                      }
                    }}
                    onClick={() => handleProfessorChoice(prof)}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {prof.name}
                        </Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                          <Chip
                            label={`Rating: ${prof.avgRating || 'N/A'}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`Difficulty: ${prof.avgDifficulty || 'N/A'}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`Would Take Again: ${prof.wouldTakeAgainPercent || 'N/A'}%`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                        {prof.teacherTags && prof.teacherTags.length > 0 && (
                          <Stack direction="row" flexWrap="wrap" gap={0.5}>
                            {prof.teacherTags.slice(0, 5).map((tag, tagIdx) => (
                              <Chip
                                key={tagIdx}
                                label={tag}
                                size="small"
                                sx={{ background: 'rgba(59,130,246,0.2)' }}
                              />
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSkipProfessor}>
            Skip (Add Later)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HomePage
