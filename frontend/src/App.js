import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store/store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Debug from './pages/Debug';
import Sales from './pages/Sales';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import Swal from 'sweetalert2';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  // ResizeObserver hatalarını bastır ve SweetAlert global ayarları
  useEffect(() => {
    // SweetAlert global konfigürasyonu
    Swal.mixin({
      customClass: {
        popup: 'swal2-popup',
        title: 'swal2-title',
        content: 'swal2-content',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel'
      },
      background: '#ffffff',
      color: '#1f2937',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      showDenyButton: false
    });

    const handleError = (event) => {
      if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        event.stopImmediatePropagation();
        return false;
      }
    };

    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/test" element={<div style={{padding: '20px'}}><h1>Test Sayfası Çalışıyor!</h1></div>} />
              <Route path="/debug" element={<Debug />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <Sales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
