import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../store/slices/authSlice';
import Reservations from './Reservations';
import Customers from './Customers';
import Products from './Products';
import Sales from './Sales';
import Rooms from './Rooms';
import { reservationService, customerService, roomService } from '../services/api';
import RoomPanel from '../components/RoomPanel';
import RoomStatusList from '../components/RoomStatusList';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    dispatch(logoutUser());
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats();
    }
  }, [activeTab]);

  // Sayfa yüklendiğinde stats'ları yükle
  useEffect(() => {
    loadDashboardStats();
  }, []);

  // Her 30 saniyede bir stats'ları yenile (opsiyonel)
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const interval = setInterval(() => {
        loadDashboardStats();
      }, 30000); // 30 saniye

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const loadDashboardStats = async () => {
    setLoadingStats(true);
    try {
      console.log('Loading dashboard stats from new API...');

      // Yeni dashboard stats API'sini kullan
      const [dashboardRes, customersRes] = await Promise.all([
        reservationService.getDashboardStats(),
        customerService.getAll({ pageSize: 1 })
      ]);

      const stats = dashboardRes.data;
      console.log('Dashboard stats from API:', stats);

      setDashboardStats({
        totalReservations: stats.totalActiveReservations || 0,
        todayCheckIns: stats.todayCheckIns || 0,
        todayCheckOuts: stats.todayCheckOuts || 0,
        totalCustomers: customersRes.data?.pagination?.total || stats.totalCustomers || 0,
        occupiedRooms: stats.occupiedRooms || 0,
        totalRooms: stats.totalRooms || 0
      });

      console.log('Dashboard stats updated:', {
        todayCheckIns: stats.todayCheckIns,
        todayCheckOuts: stats.todayCheckOuts,
        occupiedRooms: stats.occupiedRooms,
        totalRooms: stats.totalRooms
      });

    } catch (error) {
      console.error('Error loading dashboard stats:', error);

      // Fallback: Eski yöntem
      console.log('Falling back to old method...');
      try {
        const [allReservationsRes, customersRes, roomsRes] = await Promise.all([
          reservationService.getAll({ pageSize: 1000 }),
          customerService.getAll({ pageSize: 1 }),
          roomService.getAll()
        ]);

        const allReservations = allReservationsRes.data?.data || allReservationsRes.data || [];
        const rooms = roomsRes.data || [];
        const reservationsArray = Array.isArray(allReservations) ? allReservations : [];
        const roomsArray = Array.isArray(rooms) ? rooms : [];

        // Basit hesaplama
        const todayCheckIns = reservationsArray.filter(r => {
          if (!r.actualCheckInDate) return false;
          const checkInDate = new Date(r.actualCheckInDate).toDateString();
          const todayDate = new Date().toDateString();
          return checkInDate === todayDate;
        });

        const todayCheckOuts = reservationsArray.filter(r => {
          if (!r.actualCheckOutDate) return false;
          const checkOutDate = new Date(r.actualCheckOutDate).toDateString();
          const todayDate = new Date().toDateString();
          return checkOutDate === todayDate;
        });

        const occupiedRooms = reservationsArray.filter(r => r.status === 2).length; // CheckedIn

        setDashboardStats({
          totalReservations: reservationsArray.length,
          todayCheckIns: todayCheckIns.length,
          todayCheckOuts: todayCheckOuts.length,
          totalCustomers: customersRes.data?.pagination?.total || 0,
          occupiedRooms: occupiedRooms,
          totalRooms: roomsArray.length
        });
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
      }
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
      case 'rooms':
        return <Rooms />;
      case 'dashboard':
      default:
        return (
          <div>
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">👋 Hoş Geldiniz!</h2>
                  <p className="text-gray-600 mb-2 sm:mb-4 text-sm sm:text-base">
                    Güneş Pansiyon Yönetim Sistemi'ne giriş yaptınız.
                  </p>
                </div>
                <div className="text-left sm:text-right">
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
              <div className="flex justify-between items-center mt-4 sm:mt-6 mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">📊 Güncel İstatistikler</h3>
                <button
                  onClick={loadDashboardStats}
                  disabled={loadingStats}
                  className="flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
                >
                  <svg className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${loadingStats ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loadingStats ? 'Yenileniyor...' : 'Yenile'}
                </button>
              </div>

              {loadingStats ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-4 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Bugünkü Check-in</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-900">{dashboardStats.todayCheckIns}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-4 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-green-600 truncate">Bugünkü Check-out</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-900">{dashboardStats.todayCheckOuts}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-4 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-purple-600">Dolu Odalar</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-900">
                          {dashboardStats.occupiedRooms}/{dashboardStats.totalRooms}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-4 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-orange-600 truncate">Toplam Müşteri</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-900">{dashboardStats.totalCustomers}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* RoomPanel (readonly) */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-4 sm:mt-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Oda Durumları</h3>
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
        <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">🏨 Güneş Pansiyon</h1>
              <p className="text-blue-100 text-xs sm:text-sm truncate">
                Hoş geldiniz, {user?.fullName || user?.firstName || 'Kullanıcı'}!
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 ml-2 flex-shrink-0">
              <button
                onClick={() => navigate('/settings')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 font-medium"
                title="Ayarlar"
              >
                <span className="hidden sm:inline">⚙️ Ayarlar</span>
                <span className="sm:hidden text-lg">⚙️</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 font-medium"
                title="Çıkış Yap"
              >
                <span className="hidden sm:inline">Çıkış Yap</span>
                <span className="sm:hidden text-lg">🚪</span>
              </button>
              {/* Hamburger - mobile only */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all duration-200"
                aria-label="Menü"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
          {/* Desktop nav */}
          <nav className="hidden sm:flex overflow-x-auto scrollbar-hide">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-shrink-0 py-4 px-3 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          {/* Mobile nav - horizontal scrollable tabs */}
          <nav className="sm:hidden flex overflow-x-auto scrollbar-hide border-b-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`flex-shrink-0 flex flex-col items-center py-2 px-3 border-b-2 font-medium text-xs transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="mt-0.5 whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="w-full mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
