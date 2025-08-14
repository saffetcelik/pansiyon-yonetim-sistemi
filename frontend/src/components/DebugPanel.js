import React, { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Debug paneli - Sadece geliştirme ortamında görünür
 */
const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('Kontrol ediliyor...');
  const [authStatus, setAuthStatus] = useState('Kontrol ediliyor...');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // API durumunu kontrol et
    api.get('/test/health')
      .then(response => {
        setApiStatus('Çalışıyor ✅');
      })
      .catch(error => {
        setApiStatus(`Hata: ${error.message} ❌`);
      });

    // Auth durumunu kontrol et
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthStatus('Oturum açık ✅');
    } else {
      setAuthStatus('Oturum kapalı ❌');
    }

    // Konsol log'ları yakalamak için
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      setLogs(prev => [...prev, { type: 'log', message: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '), time: new Date() }].slice(-20));
      originalConsoleLog(...args);
    };

    console.error = (...args) => {
      setLogs(prev => [...prev, { type: 'error', message: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '), time: new Date() }].slice(-20));
      originalConsoleError(...args);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_DEBUG_MODE !== 'true') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg w-96 h-96 overflow-auto">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">Debug Paneli</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">
              ×
            </button>
          </div>
          
          <div className="mb-4">
            <div className="text-sm font-medium mb-1">API Durumu:</div>
            <div className="text-xs bg-gray-700 p-2 rounded">{apiStatus}</div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm font-medium mb-1">Auth Durumu:</div>
            <div className="text-xs bg-gray-700 p-2 rounded">{authStatus}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Son Olaylar:</div>
            <div className="text-xs bg-gray-700 p-2 rounded h-40 overflow-auto">
              {logs.map((log, i) => (
                <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                  [{log.time.toLocaleTimeString()}] {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
          title="Debug Paneli"
        >
          🐞
        </button>
      )}
    </div>
  );
};

export default DebugPanel;
