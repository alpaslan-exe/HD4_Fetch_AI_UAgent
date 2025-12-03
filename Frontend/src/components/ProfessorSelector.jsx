// src/components/ProfessorSelector.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ApiService from '../services/api.js';

const ProfessorSelector = ({
  open,
  onClose,
  onAddProfessor,
  semesterId,
  currentCourseName = '',
  currentProfessor = ''
}) => {
  const [schoolName, setSchoolName] = useState('University of Michigan - Dearborn');
  const [department, setDepartment] = useState('Computer Science');
  const [courseNumber, setCourseNumber] = useState('');
  const [courseName, setCourseName] = useState(currentCourseName);
  const [semesterCode, setSemesterCode] = useState('f25');
  const [deptCode, setDeptCode] = useState('CIS');
  const [loading, setLoading] = useState(false);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessorIndex, setSelectedProfessorIndex] = useState(0);
  const [agentRecommendations, setAgentRecommendations] = useState([]);
  const [preferenceTags, setPreferenceTags] = useState(['engaging', 'clear', 'helpful']);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Extract semester code from semesterId (e.g., "2025-Fall" -> "f25")
  useEffect(() => {
    if (semesterId) {
      const [year, semesterName] = semesterId.split('-');
      const codeMap = { 'Spring': 'sp', 'Summer': 'su', 'Fall': 'f', 'Winter': 'w' };
      const code = codeMap[semesterName] || 'f';
      setSemesterCode(`${code}${year.slice(-2)}`);
    }
  }, [semesterId]);

  const handleFetchProfessors = async () => {
    // Only require schoolName, department, and courseNumber; courseName is now optional.
    if (!schoolName || !department || !courseNumber) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const result = await ApiService.getProfessorData(
        schoolName,
        department,
        courseNumber,
        semesterCode,
        courseName, // may be ''
        deptCode
      );

      // Extract professors from the result
      if (result.schedule && result.schedule[semesterCode]) {
        const courseData = result.schedule[semesterCode][0];
        if (courseData && Array.isArray(courseData.professors)) {
          setProfessors(courseData.professors);
          setSelectedProfessorIndex(0);
          
          // Automatically get AI recommendations
          await getAgentRecommendations(courseData.professors);
        } else {
          setProfessors([]);
        }
      } else {
        setProfessors([]);
      }
    } catch (error) {
      console.error('Error fetching professors:', error);
      alert('Error fetching professor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAgentRecommendations = async (profs) => {
    setLoadingRecommendations(true);
    try {
      // Format professors data for agent
      const courses = [{
        course: `${deptCode} ${courseNumber}`,
        instructors: profs.map(prof => ({
          name: prof.name,
          score_overall: prof.avgRating || 0,
          would_take_again_pct: prof.wouldTakeAgainPercent || 0,
          difficulty: prof.avgDifficulty || 3.0,
          recent_evals: prof.latestComments || []
        }))
      }];

      const response = await ApiService.getAgentRecommendations(
        preferenceTags,
        courses
      );

      if (response.success && response.recommendations) {
        setAgentRecommendations(response.recommendations);
      }
    } catch (error) {
      console.error('Error getting agent recommendations:', error);
      setAgentRecommendations(['Unable to get AI recommendations at this time.']);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleAddSelectedProfessor = () => {
    if (professors.length > 0 && selectedProfessorIndex < professors.length) {
      const selectedProf = professors[selectedProfessorIndex];
      onAddProfessor({
        semesterId,
        name: courseName,
        professor: selectedProf.name,
        rmp: selectedProf.id ? `https://www.ratemyprofessors.com/professor/${selectedProf.id}` : '',
        professorData: selectedProf, // Include all professor data for display
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Find Professor for Course</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <TextField
            label="School Name"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            fullWidth
            required
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Course Number"
              value={courseNumber}
              onChange={(e) => setCourseNumber(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Department Code"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              fullWidth
            />
          </Stack>
          <TextField
            label="Course Name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            fullWidth
            helperText="Enter the full course name (e.g., 'Software Engineering') [optional]"
            // Not required: do not add 'required' prop
          />
          <FormControl fullWidth>
            <InputLabel id="semester-code-label">Semester Code</InputLabel>
            <Select
              labelId="semester-code-label"
              value={semesterCode}
              label="Semester Code"
              onChange={(e) => setSemesterCode(e.target.value)}
            >
              <MenuItem value="f25">Fall 2025 (f25)</MenuItem>
              <MenuItem value="sp25">Spring 2025 (sp25)</MenuItem>
              <MenuItem value="su25">Summer 2025 (su25)</MenuItem>
              <MenuItem value="w25">Winter 2025 (w25)</MenuItem>
              <MenuItem value="f24">Fall 2024 (f24)</MenuItem>
              <MenuItem value="sp24">Spring 2024 (sp24)</MenuItem>
              <MenuItem value="su24">Summer 2024 (su24)</MenuItem>
              <MenuItem value="w24">Winter 2024 (w24)</MenuItem>
            </Select>
          </FormControl>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: 'rgba(226,232,240,0.7)' }}>
              AI Preference Tags (customize to get better recommendations):
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {['engaging', 'clear', 'helpful', 'organized', 'approachable', 'fair grader'].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  color={preferenceTags.includes(tag) ? 'primary' : 'default'}
                  onClick={() => {
                    if (preferenceTags.includes(tag)) {
                      setPreferenceTags(preferenceTags.filter(t => t !== tag));
                    } else {
                      setPreferenceTags([...preferenceTags, tag]);
                    }
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
          </Box>

          <Button
            variant="contained"
            onClick={handleFetchProfessors}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Fetching Professors...' : 'Search Professors'}
          </Button>

          {agentRecommendations.length > 0 && (
            <Card 
              sx={{ 
                mt: 3,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.15))',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 3,
              }}
            >
              <CardHeader
                title={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      🤖 AI Recommendations
                    </Typography>
                    {loadingRecommendations && (
                      <Chip label="Analyzing..." size="small" color="primary" />
                    )}
                  </Stack>
                }
                subheader={
                  <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                    Based on your preferences: {preferenceTags.join(', ')}
                  </Typography>
                }
              />
              <CardContent>
                <Stack spacing={1.5}>
                  {agentRecommendations.map((rec, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        borderRadius: 2,
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

          {professors.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Available Professors
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="professor-select-label">Select Professor</InputLabel>
                <Select
                  labelId="professor-select-label"
                  value={selectedProfessorIndex}
                  label="Select Professor"
                  onChange={(e) => setSelectedProfessorIndex(e.target.value)}
                >
                  {professors.map((prof, index) => (
                    <MenuItem key={prof.id} value={index}>
                      {prof.name} (Rating: {prof.avgRating || 'N/A'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {professors[selectedProfessorIndex] && (
                <Card 
                  sx={{ 
                    background: 'rgba(30,41,59,0.9)',
                    border: '1px solid rgba(148,163,184,0.18)',
                    borderRadius: 3,
                  }}
                >
                  <CardHeader
                    title={
                      <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {professors[selectedProfessorIndex].name}
                      </Typography>
                    }
                    subheader={
                      <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                        Selected Professor
                      </Typography>
                    }
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                        <Chip 
                          label={`Rating: ${professors[selectedProfessorIndex].avgRating || 'N/A'}`} 
                          variant="outlined" 
                          size="small"
                        />
                        <Chip 
                          label={`Difficulty: ${professors[selectedProfessorIndex].avgDifficulty || 'N/A'}`} 
                          variant="outlined" 
                          size="small"
                        />
                        <Chip 
                          label={`Would Take Again: ${professors[selectedProfessorIndex].wouldTakeAgainPercent || 'N/A'}%`} 
                          variant="outlined" 
                          size="small"
                        />
                      </Stack>
                      
                      {professors[selectedProfessorIndex].teacherTags && 
                       professors[selectedProfessorIndex].teacherTags.length > 0 && (
                        <Box>
                          <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)', mb: 1 }}>
                            Tags:
                          </Typography>
                          <Stack direction="row" flexWrap="wrap" gap={0.5}>
                            {professors[selectedProfessorIndex].teacherTags.slice(0, 5).map((tag, idx) => (
                              <Chip 
                                key={idx} 
                                label={tag} 
                                size="small"
                                sx={{ background: 'rgba(59,130,246,0.2)', color: '#f8fafc' }}
                              />
                            ))}
                            {professors[selectedProfessorIndex].teacherTags.length > 5 && (
                              <Chip 
                                label={`+${professors[selectedProfessorIndex].teacherTags.length - 5} more`} 
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </Box>
                      )}
                      
                      {professors[selectedProfessorIndex].latestComments && 
                       professors[selectedProfessorIndex].latestComments.length > 0 && (
                        <Box>
                          <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)', mb: 1 }}>
                            Recent Reviews:
                          </Typography>
                          <Stack spacing={1}>
                            {professors[selectedProfessorIndex].latestComments.map((comment, idx) => (
                              <Typography 
                                key={idx} 
                                variant="body2" 
                                sx={{ 
                                  color: 'rgba(226,232,240,0.9)', 
                                  fontStyle: 'italic',
                                  pl: 2,
                                  borderLeft: '2px solid rgba(59,130,246,0.3)',
                                }}
                              >
                                "{comment || 'No review available'}"
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {professors.length === 0 && !loading && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(226,232,240,0.5)', 
                fontStyle: 'italic',
                textAlign: 'center',
                py: 4
              }}
            >
              Search for professors above to see results populate here.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAddSelectedProfessor}
          disabled={professors.length === 0}
          variant="contained"
        >
          Add Professor to Schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfessorSelector;
