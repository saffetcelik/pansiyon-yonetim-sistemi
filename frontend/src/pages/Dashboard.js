import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import RoomPanel from '../components/RoomPanel';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{
        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h1>🏨 Güneş Pansiyon Yönetim Sistemi</h1>
        <p>Hoş geldiniz, {user?.fullName || user?.firstName || 'Kullanıcı'}!</p>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '2px solid white',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Çıkış Yap
        </button>
      </div>

      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>👋 Hoş Geldiniz!</h2>
            <p style={{ margin: '0 0 15px 0', color: '#666' }}>
              Güneş Pansiyon Yönetim Sistemi'ne giriş yaptınız.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              background: user?.roleName === 'Admin' ? '#f44336' : '#2196f3',
              color: 'white',
              padding: '5px 15px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '5px'
            }}>
              {user?.roleName === 'Admin' ? '👑 Yönetici' : '👨‍💼 Müdür'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {user?.lastLoginDate && (
                <>Son Giriş: {new Date(user.lastLoginDate).toLocaleString('tr-TR')}</>
              )}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '20px'
        }}>
          <div style={{
            background: '#e3f2fd',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#1976d2' }}>📊 Hızlı Erişim</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              Oda durumları aşağıda görüntülenir
            </p>
          </div>

          <div style={{
            background: '#f3e5f5',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#7b1fa2' }}>🔧 Yönetim</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              Oda durumlarını tek tıkla değiştirin
            </p>
          </div>

          {user?.roleName === 'Admin' && (
            <div style={{
              background: '#ffebee',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#d32f2f' }}>👑 Admin</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                Tam yetki ile sistem yönetimi
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Room Management Panel */}
      <RoomPanel />
    </div>
  );
};

export default Dashboard;
