import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { authService } from '../services/authService';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Şifre değiştirme state'i
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Şifre doğrulama
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor!' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır!' });
      setLoading(false);
      return;
    }

    try {
      const result = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Şifre başarıyla değiştirildi!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Şifre değiştirme işlemi başarısız!' });
    }

    setLoading(false);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">⚙️ Ayarlar</h1>
              <p className="text-blue-100 text-sm">
                Hesap ayarlarınızı yönetin
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

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👤 Profil Bilgileri
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔒 Şifre Değiştir
              </button>
              <button
                onClick={() => setActiveTab('session')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'session'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🕐 Oturum Ayarları
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profil Bilgileri Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Profil Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ad</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {user?.firstName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Soyad</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {user?.lastName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {user?.username}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user?.role === 0 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user?.role === 0 ? 'Admin' : 'Manager'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefon</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {user?.phone || 'Belirtilmemiş'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Şifre Değiştir Tab */}
            {activeTab === 'password' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Şifre Değiştir</h3>
                
                {message.text && (
                  <div className={`p-4 rounded-md ${
                    message.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mevcut Şifre
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Yeni Şifre
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      required
                      minLength={6}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Yeni Şifre Tekrar
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                      minLength={6}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Oturum Ayarları Tab */}
            {activeTab === 'session' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Oturum Ayarları</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900">🔐 JWT Token Süresi</h4>
                    <p className="text-blue-700 text-sm mt-1">30 gün (1 ay)</p>
                    <p className="text-blue-600 text-xs mt-2">
                      JWT token'ınız 30 gün boyunca geçerlidir. Otomatik çıkış olmaz.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900">🍪 Cookie Süresi</h4>
                    <p className="text-green-700 text-sm mt-1">30 gün (1 ay)</p>
                    <p className="text-green-600 text-xs mt-2">
                      Tarayıcı cookie'leri 30 gün boyunca geçerlidir. Bu süre boyunca otomatik giriş yapabilirsiniz.
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900">⚡ Otomatik Çıkış</h4>
                    <p className="text-yellow-700 text-sm mt-1">30 gün sonra</p>
                    <p className="text-yellow-600 text-xs mt-2">
                      Oturum 30 gün boyunca açık kalır. Sadece manuel çıkış veya 30 gün sonra otomatik çıkış.
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">📊 Mevcut Oturum Bilgileri</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p><strong>Son Giriş:</strong> {user?.lastLoginDate ? new Date(user.lastLoginDate).toLocaleString('tr-TR') : 'Bilinmiyor'}</p>
                      <p><strong>Kullanıcı ID:</strong> {user?.id}</p>
                      <p><strong>Durum:</strong> <span className="text-green-600 font-medium">Aktif</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
