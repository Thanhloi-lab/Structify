import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css';
import { SettingsProvider } from './contexts/SettingsContext'

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <SettingsProvider
    loadType="GET_SETTINGS"
    saveType="SAVE_SETTINGS"
    updatedEventType="SETTINGS_UPDATED"
    autoLoad
  >
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </SettingsProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
