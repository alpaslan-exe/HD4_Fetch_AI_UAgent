// src/components/ProfessorDetails.jsx
import { useState } from 'react';
import {
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
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled, alpha } from '@mui/material/styles';

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <Button {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const ProfessorDetails = ({ professor, courseName, expandedInitially = false }) => {
  const [expanded, setExpanded] = useState(expandedInitially);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  if (!professor) {
    return null;
  }

  return (
    <Card 
      sx={{ 
        mt: 1,
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: 2.5,
      }}
    >
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {professor.name}
            </Typography>
            <ExpandMore
              expand={expanded}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
              sx={{ 
                color: 'primary.light',
                minWidth: 'auto',
                p: 0.5,
              }}
            >
              <ExpandMoreIcon />
            </ExpandMore>
          </Stack>
        }
        subheader={
          <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
            Professor Details for {courseName}
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
              <Chip 
                label={`Rating: ${professor.avgRating || 'N/A'}`} 
                variant="outlined" 
                size="small"
                sx={{ 
                  background: professor.avgRating ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148,163,184,0.18)',
                  color: professor.avgRating ? '#dcfce7' : 'inherit' 
                }}
              />
              <Chip 
                label={`Difficulty: ${professor.avgDifficulty || 'N/A'}`} 
                variant="outlined" 
                size="small"
                sx={{ 
                  background: professor.avgDifficulty ? 'rgba(248, 113, 113, 0.2)' : 'rgba(148,163,184,0.18)',
                  color: professor.avgDifficulty ? '#fecaca' : 'inherit' 
                }}
              />
              <Chip 
                label={`Would Take Again: ${professor.wouldTakeAgainPercent || 'N/A'}%`} 
                variant="outlined" 
                size="small"
                sx={{ 
                  background: professor.wouldTakeAgainPercent ? 'rgba(96, 165, 250, 0.2)' : 'rgba(148,163,184,0.18)',
                  color: professor.wouldTakeAgainPercent ? '#dbeafe' : 'inherit' 
                }}
              />
            </Stack>
            
            {professor.teacherTags && professor.teacherTags.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)', mb: 1 }}>
                  Professor Tags:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {professor.teacherTags.slice(0, 10).map((tag, idx) => (
                    <Chip 
                      key={idx} 
                      label={tag} 
                      size="small"
                      sx={{ 
                        background: 'rgba(59,130,246,0.2)', 
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                        height: '24px'
                      }}
                    />
                  ))}
                  {professor.teacherTags.length > 10 && (
                    <Chip 
                      label={`+${professor.teacherTags.length - 10} more`} 
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', height: '24px' }}
                    />
                  )}
                </Stack>
              </Box>
            )}
            
            {professor.latestComments && professor.latestComments.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)', mb: 1 }}>
                  Recent Reviews:
                </Typography>
                <Stack spacing={1}>
                  {professor.latestComments.map((comment, idx) => (
                    <Typography 
                      key={idx} 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(226,232,240, 0.9)', 
                        fontStyle: 'italic',
                        pl: 2,
                        borderLeft: '2px solid rgba(59,130,246,0.3)',
                        py: 0.5,
                        fontSize: '0.875rem'
                      }}
                    >
                      "{comment || 'No review available'}"
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
            
            <Divider sx={{ borderColor: 'rgba(148,163,184,0.18)', my: 1 }} />
            
            {professor.id || professor.rmp ? (
              <Button
                variant="outlined"
                size="small"
                href={professor.rmp || `https://www.ratemyprofessors.com/professor/${professor.id}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  alignSelf: 'flex-start',
                  textTransform: 'none',
                  borderColor: 'rgba(59,130,246,0.3)',
                  color: 'primary.light',
                  '&:hover': {
                    borderColor: 'primary.main',
                    background: 'rgba(59,130,246,0.1)'
                  }
                }}
              >
                View Full Profile on RMP
              </Button>
            ) : null}
          </Stack>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default ProfessorDetails;
