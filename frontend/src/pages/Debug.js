import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { authService } from '../services/authService';

const Debug = () => {
  const authState = useSelector((state) => state.auth);
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      const result = await authService.login({
        username: 'admin',
        password: 'admin123'
      });
      setTestResult('Login Test Result: ' + JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult('Login Error: ' + error.message);
    }
    setLoading(false);
  };

  const testManagerLogin = async () => {
    setLoading(true);
    try {
      const result = await authService.login({
        username: 'manager',
        password: 'manager123'
      });
      setTestResult('Manager Login Test: ' + JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult('Manager Login Error: ' + error.message);
    }
    setLoading(false);
  };

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5297/api/test/health');
      const data = await response.json();
      setTestResult('API Test: ' + JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult('API Error: ' + error.message);
    }
    setLoading(false);
  };

  const testUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5297/api/test/users');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        setTestResult(`HTTP Error: ${response.status} ${response.statusText}`);
        return;
      }

      const text = await response.text();
      console.log('Response text:', text);

      if (!text) {
        setTestResult('Empty response from server');
        return;
      }

      const data = JSON.parse(text);
      setTestResult('Users Test: ' + JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult('Users Error: ' + error.message);
      console.error('Full error:', error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 Debug Sayfası</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Redux Auth State:</h3>
        <pre style={{ background: 'white', padding: '10px', borderRadius: '3px', overflow: 'auto' }}>
          {JSON.stringify(authState, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '5px' }}>
        <h3>LocalStorage:</h3>
        <pre style={{ background: 'white', padding: '10px', borderRadius: '3px', overflow: 'auto' }}>
          authToken: {localStorage.getItem('authToken') || 'null'}{'\n'}
          user: {localStorage.getItem('user') || 'null'}{'\n'}
          tokenExpiresAt: {localStorage.getItem('tokenExpiresAt') || 'null'}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testAPI}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Test Ediliyor...' : 'API Test Et'}
        </button>

        <button
          onClick={testUsers}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Test Ediliyor...' : 'Kullanıcıları Listele'}
        </button>

        <button
          onClick={testLogin}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Test Ediliyor...' : 'Admin Login Test'}
        </button>

        <button
          onClick={testManagerLogin}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Test Ediliyor...' : 'Manager Login Test'}
        </button>
      </div>

      {testResult && (
        <div style={{ padding: '15px', background: '#e8f5e8', borderRadius: '5px' }}>
          <h3>Test Sonucu:</h3>
          <pre style={{ background: 'white', padding: '10px', borderRadius: '3px', overflow: 'auto' }}>
            {testResult}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
        <h3>Authentication Durumu:</h3>
        <p><strong>isAuthenticated:</strong> {authState.isAuthenticated ? 'true' : 'false'}</p>
        <p><strong>user:</strong> {authState.user ? 'var' : 'yok'}</p>
        <p><strong>token:</strong> {authState.token ? 'var' : 'yok'}</p>
        <p><strong>loading:</strong> {authState.loading ? 'true' : 'false'}</p>
        <p><strong>error:</strong> {authState.error || 'yok'}</p>
      </div>
    </div>
  );
};

export default Debug;
