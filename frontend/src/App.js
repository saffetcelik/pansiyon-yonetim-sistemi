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
import DebugPanel from './components/DebugPanel';
import SweetAlertInit from './components/SweetAlertInit';

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
  // SweetAlert2 Initialize
  
  // ResizeObserver hatalarını bastır
  useEffect(() => {
    const handleError = (event) => {
      if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        event.stopImmediatePropagation();
        return false;
      }
    };

    window.addEventListener('error', handleError);

    // Temizleme işlemi
    return () => {
      window.removeEventListener('error', handleError);
      
      // SweetAlert stil temizliği
      const styleElement = document.getElementById('sweetalert-global-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SweetAlertInit />
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
          
          {/* Debug panel - sadece geliştirme ortamında görünür */}
          {process.env.NODE_ENV !== 'production' && <DebugPanel />}
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
