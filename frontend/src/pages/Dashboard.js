import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import Reservations from './Reservations';
import Customers from './Customers';
import Products from './Products';
import Sales from './Sales';
import Reports from './Reports';
import Rooms from './Rooms';
import { reservationService, customerService, roomService } from '../services/api';
import RoomPanel from '../components/RoomPanel';
import RoomStatusList from '../components/RoomStatusList';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    totalReservations: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    totalCustomers: 0,
    occupiedRooms: 0,
    totalRooms: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats();
    }
  }, [activeTab]);

  const loadDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Load various statistics
      const [reservationsRes, customersRes, roomsRes] = await Promise.all([
        reservationService.getAll({
          checkInDate: today,
          checkOutDate: today
        }),
        customerService.getAll({ pageSize: 1 }),
        roomService.getAll()
      ]);

      const todayReservations = reservationsRes.data || [];
      const rooms = roomsRes.data || [];

      // Ensure arrays are valid before using filter
      const reservationsArray = Array.isArray(todayReservations) ? todayReservations : [];
      const roomsArray = Array.isArray(rooms) ? rooms : [];

      setDashboardStats({
        totalReservations: reservationsArray.length,
        todayCheckIns: reservationsArray.filter(r =>
          new Date(r.checkInDate).toDateString() === new Date().toDateString() &&
          r.status === 1
        ).length,
        todayCheckOuts: reservationsArray.filter(r =>
          new Date(r.checkOutDate).toDateString() === new Date().toDateString() &&
          r.status === 2
        ).length,
        totalCustomers: customersRes.data?.pagination?.total || 0,
        occupiedRooms: roomsArray.filter(r => r.status === 1).length, // Occupied
        totalRooms: roomsArray.length
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: '🏠' },
    { id: 'reservations', label: 'Rezervasyonlar', icon: '📅' },
    { id: 'customers', label: 'Müşteriler', icon: '👥' },
    { id: 'rooms', label: 'Odalar', icon: '🏨' },
    { id: 'products', label: 'Ürünler', icon: '📦' },
    { id: 'sales', label: 'Büfe Satış', icon: '🛒' },
    { id: 'reports', label: 'Raporlar', icon: '📊' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'reservations':
        return <Reservations />;
      case 'customers':
        return <Customers />;
      case 'products':
        return <Products />;
      case 'sales':
        return <Sales />;
      case 'reports':
        return <Reports />;
      case 'rooms':
        return <Rooms />;
      case 'dashboard':
      default:
        return (
          <div>
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">👋 Hoş Geldiniz!</h2>
                  <p className="text-gray-600 mb-4">
                    Güneş Pansiyon Yönetim Sistemi'ne giriş yaptınız.
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                    user?.roleName === 'Admin'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user?.roleName === 'Admin' ? '👑 Yönetici' : '👨‍💼 Müdür'}
                  </div>
                  {user?.lastLoginDate && (
                    <div className="text-xs text-gray-500">
                      Son Giriş: {new Date(user.lastLoginDate).toLocaleString('tr-TR')}
                    </div>
                  )}
                </div>
              </div>

              {/* Dashboard Statistics */}
              {loadingStats ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Bugünkü Check-in</p>
                        <p className="text-2xl font-bold text-blue-900">{dashboardStats.todayCheckIns}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Bugünkü Check-out</p>
                        <p className="text-2xl font-bold text-green-900">{dashboardStats.todayCheckOuts}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">Dolu Odalar</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {dashboardStats.occupiedRooms}/{dashboardStats.totalRooms}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-600">Toplam Müşteri</p>
                        <p className="text-2xl font-bold text-orange-900">{dashboardStats.totalCustomers}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* RoomPanel (readonly) */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-xl font-bold mb-4">Oda Durumları</h3>
              <RoomPanel readOnly />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">🏨 Güneş Pansiyon</h1>
              <p className="text-blue-100 text-sm">
                Hoş geldiniz, {user?.fullName || user?.firstName || 'Kullanıcı'}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
