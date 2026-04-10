import { CircularProgress, Typography, Box } from '@mui/material';

export default function LoadingPage() {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <CircularProgress color="primary" />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Loading Structify ...
      </Typography>
    </Box>
  );
}
