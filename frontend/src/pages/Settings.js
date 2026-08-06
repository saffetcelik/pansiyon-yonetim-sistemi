import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { logoutUser } from '../store/slices/authSlice';
import { authService } from '../services/authService';
import { backupService } from '../services/api';
import Swal from 'sweetalert2';

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

  // ── Yedekleme State'leri ──
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [backupSettings, setBackupSettings] = useState({
    autoBackupEnabled: true,
    backupIntervalHours: 24,
    maxLocalBackupCount: 5,
    cloudBackupEnabled: false,
    cloudProvider: 'GoogleDrive',
    cloudClientId: '',
    cloudClientSecret: '',
    cloudApiKeyToken: '',
    maxCloudBackupCount: 5,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingCloud, setTestingCloud] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'backup') {
      loadBackupsData();
    }
  }, [activeTab]);

  const loadBackupsData = async () => {
    setLoadingBackups(true);
    try {
      const [listRes, settingsRes] = await Promise.all([
        backupService.getBackups(),
        backupService.getSettings()
      ]);
      if (listRes.data?.data) setBackups(listRes.data.data);
      if (settingsRes.data?.data) setBackupSettings(settingsRes.data.data);
    } catch (e) {
      console.error('Yedekleme verileri yüklenirken hata:', e);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

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

  // ── Yedek İşlemleri ──
  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await backupService.createBackup();
      Swal.fire({
        icon: 'success',
        title: 'Yedek Oluşturuldu!',
        text: `Veritabanı yedeği (${res.data.data.fileName}) başarıyla kaydedildi.`,
        confirmButtonColor: '#2563eb'
      });
      loadBackupsData();
    } catch (e) {
      Swal.fire('Hata', 'Yedek oluşturulamadı: ' + (e.response?.data?.message || e.message), 'error');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreFromFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirm = await Swal.fire({
      title: '⚠️ VERİTABANI GERİ YÜKLENECEK!',
      html: `<strong>${file.name}</strong> dosyası veritabanına uygulanacak.<br><br><span class="text-red-600 font-bold">Mevcut veriler yedeğin alındığı anki durumla değiştirilecektir.</span> Devam etmek istiyor musunuz?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Geri Yükle',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (!confirm.isConfirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    Swal.fire({ title: 'Geri Yükleniyor...', text: 'Veritabanı güncelleniyor, lütfen bekleyiniz.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      await backupService.restoreBackup(formData);
      Swal.fire('Başarılı', 'Veritabanı başarıyla seçilen yedeğe geri yüklendi!', 'success');
      loadBackupsData();
    } catch (err) {
      Swal.fire('Hata', 'Geri yükleme başarısız: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRestoreFromLocal = async (fileName) => {
    const confirm = await Swal.fire({
      title: '⚠️ GERİ YÜKLEME ONAYI',
      html: `Yerel yedek <strong>${fileName}</strong> uygulanacak.<br><br>Devam etmek istediğinizden emin misiniz?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Geri Yükle',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({ title: 'Geri Yükleniyor...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      await backupService.restoreBackup(new FormData()); // Query String fileName kullanır
      Swal.fire('Başarılı', 'Veritabanı başarıyla geri yüklendi!', 'success');
    } catch (err) {
      Swal.fire('Hata', 'Geri yükleme başarısız: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleDeleteBackup = async (fileName) => {
    const confirm = await Swal.fire({
      title: 'Yedek Silinecek',
      text: `${fileName} silinsin mi?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#dc2626',
    });

    if (!confirm.isConfirmed) return;

    try {
      await backupService.deleteBackup(fileName);
      Swal.fire('Silindi', 'Yedek dosyası silindi.', 'success');
      loadBackupsData();
    } catch (e) {
      Swal.fire('Hata', 'Silme işlemi başarısız!', 'error');
    }
  };

  const handleSaveBackupSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await backupService.saveSettings(backupSettings);
      Swal.fire({
        icon: 'success',
        title: 'Ayarlar Kaydedildi',
        text: 'Otomatik yedekleme ve bulut konfigürasyonu güncellendi.',
        confirmButtonColor: '#2563eb'
      });
    } catch (e) {
      Swal.fire('Hata', 'Ayarlar kaydedilemedi!', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestCloudConnection = async () => {
    setTestingCloud(true);
    try {
      const res = await backupService.testCloud({
        provider: backupSettings.cloudProvider,
        clientId: backupSettings.cloudClientId,
        clientSecret: backupSettings.cloudClientSecret,
        apiKeyToken: backupSettings.cloudApiKeyToken
      });
      const data = res.data?.data;
      if (data?.success) {
        Swal.fire('Bağlantı Başarılı! 🟢', data.message, 'success');
      } else {
        Swal.fire('Bağlantı Başarısız 🔴', data?.message || 'Bulut bağlantısı kurulamadı.', 'error');
      }
    } catch (e) {
      Swal.fire('Hata', 'Bulut testi sırasında hata oluştu.', 'error');
    } finally {
      setTestingCloud(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <Link to="/dashboard" className="text-2xl font-bold text-white hover:opacity-90 transition-opacity flex items-center gap-2">
                🏨 Güneş Pansiyon — ⚙️ Ayarlar
              </Link>
              <p className="text-blue-100 text-sm mt-1">
                <Link to="/dashboard" className="hover:underline text-white font-medium inline-flex items-center gap-1">
                  ← 🏠 Ana Sayfaya Dön
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-1.5"
              >
                🏠 <span>Ana Sayfa</span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-1.5"
              >
                🚪 <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-6 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👤 Profil Bilgileri
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔒 Şifre Değiştir
              </button>
              <button
                onClick={() => setActiveTab('session')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'session'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🕐 Oturum Ayarları
              </button>
              <button
                onClick={() => setActiveTab('backup')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'backup'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💾 Yedekleme & Bulut
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
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900">🍪 Cookie Süresi</h4>
                    <p className="text-green-700 text-sm mt-1">30 gün (1 ay)</p>
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

            {/* ─── Yedekleme ve Bulut Tab ─── */}
            {activeTab === 'backup' && (
              <div className="space-y-8">
                
                {/* 1. Hızlı Manuel Aksiyonlar */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    📦 Veritabanı Anlık İşlemler
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tüm veritabanı yedeğini anında indirebilir veya elinizdeki yedeği yükleyerek veritabanını geri yükleyebilirsiniz.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={handleCreateBackup}
                      disabled={creatingBackup}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold text-sm shadow-md transition-all active:scale-95"
                    >
                      📥 {creatingBackup ? 'Yedek Alınıyor...' : 'Şimdi Tam Yedek Al'}
                    </button>

                    <label className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all active:scale-95 cursor-pointer">
                      📤 Yedek Dosyasından Geri Yükle
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".sql"
                        onChange={handleRestoreFromFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Yerel Yedekler Listesi */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      📋 Kayıtlı Yerel Yedekler
                      {loadingBackups && <span className="text-xs text-blue-500 font-normal animate-pulse">Yükleniyor...</span>}
                    </h3>
                    <button
                      type="button"
                      onClick={loadBackupsData}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      🔄 Yenile
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dosya Adı</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Boyut</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Oluşturulma Tarihi</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Türü</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {backups && backups.length > 0 ? (
                          backups.map((b) => (
                            <tr key={b.fileName} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono font-medium text-gray-900 text-xs">
                                {b.fileName}
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-xs">{b.fileSizeFormatted}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs">
                                {new Date(b.createdAt).toLocaleString('tr-TR')}
                              </td>
                              <td className="px-4 py-3 text-xs">
                                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                  b.isAutoBackup ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {b.isAutoBackup ? 'Otomatik' : 'Manuel'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <a
                                    href={backupService.downloadUrl(b.fileName)}
                                    download={b.fileName}
                                    className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium border border-blue-200"
                                    title="İndir"
                                  >
                                    ⬇️ İndir
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreFromLocal(b.fileName)}
                                    className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-medium border border-amber-200"
                                    title="Geri Yükle"
                                  >
                                    🔄 Geri Yükle
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBackup(b.fileName)}
                                    className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium border border-red-200"
                                    title="Sil"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic text-xs">
                              Henüz kayıtlı bir yerel yedek bulunmuyor.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Otomatik Yerel & Bulut Konfigürasyonu Formu */}
                <form onSubmit={handleSaveBackupSettings} className="space-y-6 pt-4 border-t border-gray-200">
                  
                  {/* Otomatik Zamanlanmış Yedekleme */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      ⏰ Otomatik Zamanlanmış Yedekleme
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Otomatik Yedekleme</label>
                        <select
                          value={backupSettings.autoBackupEnabled ? 'true' : 'false'}
                          onChange={e => setBackupSettings(prev => ({ ...prev, autoBackupEnabled: e.target.value === 'true' }))}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                        >
                          <option value="true">✅ Aktif</option>
                          <option value="false">❌ Pasif</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Çalışma Periyodu (Saat)</label>
                        <select
                          value={backupSettings.backupIntervalHours}
                          onChange={e => setBackupSettings(prev => ({ ...prev, backupIntervalHours: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                        >
                          <option value={6}>Her 6 Saat</option>
                          <option value={12}>Her 12 Saat</option>
                          <option value={24}>Her 24 Saat (Günlük)</option>
                          <option value={48}>Her 48 Saat (2 Günde Bir)</option>
                          <option value={168}>Her 168 Saat (Haftalık)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Maksimum Tutulacak Yerel Yedek Sayısı
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={backupSettings.maxLocalBackupCount}
                          onChange={e => setBackupSettings(prev => ({ ...prev, maxLocalBackupCount: parseInt(e.target.value) || 5 }))}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                        />
                        <p className="text-[11px] text-gray-500 mt-1">Eski yedekler otomatik temizlenir (Varsayılan: 5).</p>
                      </div>
                    </div>
                  </div>

                  {/* Bulut Depolama Entegrasyonu */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        ☁️ Bulut Depolama Entegrasyonu (Google Drive / Yandex Disk / OneDrive)
                      </h3>
                      <button
                        type="button"
                        onClick={handleTestCloudConnection}
                        disabled={testingCloud}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        🔌 {testingCloud ? 'Test Ediliyor...' : 'Bulut Bağlantısını Test Et'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Bulut Otomatik Senkronizasyon</label>
                        <select
                          value={backupSettings.cloudBackupEnabled ? 'true' : 'false'}
                          onChange={e => setBackupSettings(prev => ({ ...prev, cloudBackupEnabled: e.target.value === 'true' }))}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                        >
                          <option value="true">✅ Bulut Yedekleme Aktif</option>
                          <option value="false">❌ Pasif</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Bulut Servisi Seçin</label>
                        <select
                          value={backupSettings.cloudProvider}
                          onChange={e => setBackupSettings(prev => ({ ...prev, cloudProvider: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-semibold"
                        >
                          <option value="GoogleDrive">🌐 Google Drive</option>
                          <option value="YandexDisk">🟡 Yandex Disk</option>
                          <option value="OneDrive">🟦 OneDrive (Microsoft)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        🔑 {backupSettings.cloudProvider} API Kimlik Bilgileri
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Client ID / Uygulama Kimliği</label>
                          <input
                            type="text"
                            value={backupSettings.cloudClientId || ''}
                            onChange={e => setBackupSettings(prev => ({ ...prev, cloudClientId: e.target.value }))}
                            placeholder="Örn: 123456789-abc.apps.googleusercontent.com"
                            className="w-full px-3 py-2 border rounded-md text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Client Secret / Uygulama Gizli Anahtarı</label>
                          <input
                            type="password"
                            value={backupSettings.cloudClientSecret || ''}
                            onChange={e => setBackupSettings(prev => ({ ...prev, cloudClientSecret: e.target.value }))}
                            placeholder="Client Secret"
                            className="w-full px-3 py-2 border rounded-md text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          API Key / OAuth Access Token / Refresh Token *
                        </label>
                        <input
                          type="password"
                          value={backupSettings.cloudApiKeyToken || ''}
                          onChange={e => setBackupSettings(prev => ({ ...prev, cloudApiKeyToken: e.target.value }))}
                          placeholder="API Key veya Access Token yapıştırınız..."
                          className="w-full px-3 py-2 border rounded-md text-xs font-mono"
                        />
                      </div>

                      <div className="w-1/2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Bulut Tarafında Tutulacak Max Yedek Sayısı
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={backupSettings.maxCloudBackupCount || 5}
                          onChange={e => setBackupSettings(prev => ({ ...prev, maxCloudBackupCount: parseInt(e.target.value) || 5 }))}
                          className="w-full px-3 py-2 border rounded-md text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-lg shadow-md transition"
                    >
                      {savingSettings ? 'Kaydediliyor...' : '💾 Tüm Yedekleme ve Bulut Ayarlarını Kaydet'}
                    </button>
                  </div>
                </form>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
