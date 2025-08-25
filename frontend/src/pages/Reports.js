import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

// API Base URL - Domain üzerinden erişim için dinamik URL belirleme
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  console.log('Reports - Hostname:', hostname, 'Protocol:', protocol);
  
  // ASLA localhost kullanma - sadece gerçek localhost erişiminde
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:5297/api`;
  }
  
  // Tüm domain erişimleri için domain üzerinden API kullan
  return `${protocol}//${hostname}/api`;
};

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  const { token, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      Swal.fire('Hata', 'Lütfen önce giriş yapın', 'error');
      return;
    }

    if (activeTab === 'dashboard') {
      fetchDashboardSummary();
    }
  }, [activeTab, isAuthenticated, token]);

  const testAuth = async () => {
    if (!token) {
      console.log('Token bulunamadı:', token);
      return;
    }

    try {
      const apiBaseUrl = getBaseUrl();
      const response = await axios.get(`${apiBaseUrl}/reports/test`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Auth test response:', response.data);
    } catch (error) {
      console.error('Auth test hatası:', error);
      console.error('Error response:', error.response);
    }
  };

  const fetchDashboardSummary = async () => {
    if (!token) {
      console.log('Token bulunamadı:', token);
      Swal.fire('Hata', 'Lütfen önce giriş yapın', 'error');
      return;
    }

    // Önce auth test yapalım
    await testAuth();

    setLoading(true);
    console.log('Dashboard summary fetch başlatılıyor...');
    try {
      const apiBaseUrl = getBaseUrl();
      const response = await axios.get(`${apiBaseUrl}/reports/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: new Date().toISOString().split('T')[0] }
      });
      console.log('Dashboard response:', response.data);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Dashboard verisi alınırken hata:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Dashboard verisi alınırken hata oluştu';
      Swal.fire('Hata', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupancyReport = async () => {
    if (!token) {
      Swal.fire('Hata', 'Lütfen önce giriş yapın', 'error');
      return;
    }

    setLoading(true);
    try {
      const apiBaseUrl = getBaseUrl();
      const response = await axios.get(`${apiBaseUrl}/reports/occupancy`, {
        headers: { Authorization: `Bearer ${token}` },
        params: dateRange
      });
      setOccupancyData(response.data);
    } catch (error) {
      console.error('Doluluk raporu alınırken hata:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Doluluk raporu alınırken hata oluştu';
      Swal.fire('Hata', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueReport = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = getBaseUrl();
      const response = await axios.get(`${apiBaseUrl}/reports/revenue`, {
        headers: { Authorization: `Bearer ${token}` },
        params: dateRange
      });
      setRevenueData(response.data);
    } catch (error) {
      console.error('Gelir raporu alınırken hata:', error);
      Swal.fire('Hata', 'Gelir raporu alınırken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerReport = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = getBaseUrl();
      const response = await axios.get(`${apiBaseUrl}/reports/customers/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
        params: dateRange
      });
      setCustomerData(response.data);
    } catch (error) {
      console.error('Müşteri raporu alınırken hata:', error);
      Swal.fire('Hata', 'Müşteri raporu alınırken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async (reportType) => {
    try {
      const apiBaseUrl = getBaseUrl();
      const response = await axios.get(`${apiBaseUrl}/reports/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { reportType, ...dateRange },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_raporu_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire('Başarılı', 'Rapor Excel formatında indirildi', 'success');
    } catch (error) {
      console.error('Excel export hatası:', error);
      Swal.fire('Hata', 'Excel export sırasında hata oluştu', 'error');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'occupancy':
        fetchOccupancyReport();
        break;
      case 'revenue':
        fetchRevenueReport();
        break;
      case 'customers':
        fetchCustomerReport();
        break;
      default:
        break;
    }
  };

  const handleDateRangeChange = () => {
    switch (activeTab) {
      case 'occupancy':
        fetchOccupancyReport();
        break;
      case 'revenue':
        fetchRevenueReport();
        break;
      case 'customers':
        fetchCustomerReport();
        break;
      default:
        break;
    }
  };

  const renderDashboard = () => {
    if (!dashboardData) return <div className="text-center py-8">Dashboard verisi yükleniyor...</div>;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Bugünkü Gelir</p>
                <p className="text-2xl font-bold">₺{dashboardData.todayRevenue?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Aylık Gelir</p>
                <p className="text-2xl font-bold">₺{dashboardData.monthRevenue?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Doluluk Oranı</p>
                <p className="text-2xl font-bold">%{dashboardData.todayOccupancy?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="text-3xl">🏨</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Müsait Oda</p>
                <p className="text-2xl font-bold">{dashboardData.availableRooms || 0}</p>
              </div>
              <div className="text-3xl">🛏️</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Bugünkü Aktiviteler</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Check-in</span>
                <span className="font-semibold text-green-600">{dashboardData.checkInsToday || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Check-out</span>
                <span className="font-semibold text-blue-600">{dashboardData.checkOutsToday || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Toplam Rezervasyon</span>
                <span className="font-semibold text-purple-600">{dashboardData.totalReservations || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Yıllık Performans</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Yıllık Gelir</span>
                <span className="font-semibold text-green-600">₺{dashboardData.yearRevenue?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ortalama Doluluk</span>
                <span className="font-semibold text-blue-600">%{dashboardData.monthOccupancy?.toFixed(1) || '0.0'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOccupancyReport = () => {
    if (!occupancyData) return <div className="text-center py-8">Doluluk raporu yükleniyor...</div>;

    const chartData = {
      labels: occupancyData.dailyBreakdown?.map(d => format(new Date(d.date), 'dd/MM')) || [],
      datasets: [
        {
          label: 'Doluluk Oranı (%)',
          data: occupancyData.dailyBreakdown?.map(d => d.occupancyRate) || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Günlük Doluluk Oranı Trendi',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    };

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ortalama Doluluk</h3>
            <p className="text-3xl font-bold text-blue-600">%{occupancyData.averageOccupancyRate?.toFixed(1)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Toplam Oda Geceleri</h3>
            <p className="text-3xl font-bold text-green-600">{occupancyData.totalRoomNights}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Dolu Oda Geceleri</h3>
            <p className="text-3xl font-bold text-purple-600">{occupancyData.occupiedRoomNights}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Room Type Breakdown */}
        {occupancyData.roomTypeBreakdown && occupancyData.roomTypeBreakdown.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Oda Tipi Bazında Doluluk</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Oda Tipi</th>
                    <th className="px-4 py-2 text-right">Doluluk Oranı</th>
                    <th className="px-4 py-2 text-right">Toplam Oda</th>
                    <th className="px-4 py-2 text-right">Gelir</th>
                  </tr>
                </thead>
                <tbody>
                  {occupancyData.roomTypeBreakdown.map((room, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{room.roomType}</td>
                      <td className="px-4 py-2 text-right">%{room.occupancyRate?.toFixed(1)}</td>
                      <td className="px-4 py-2 text-right">{room.totalRooms}</td>
                      <td className="px-4 py-2 text-right">₺{room.revenue?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRevenueReport = () => {
    if (!revenueData) return <div className="text-center py-8">Gelir raporu yükleniyor...</div>;

    const chartData = {
      labels: revenueData.dailyBreakdown?.map(d => format(new Date(d.date), 'dd/MM')) || [],
      datasets: [
        {
          label: 'Toplam Gelir (₺)',
          data: revenueData.dailyBreakdown?.map(d => d.totalRevenue) || [],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Rezervasyon Geliri (₺)',
          data: revenueData.dailyBreakdown?.map(d => d.reservationRevenue) || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Satış Geliri (₺)',
          data: revenueData.dailyBreakdown?.map(d => d.saleRevenue) || [],
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Günlük Gelir Trendi',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    // Payment method pie chart
    const paymentMethodData = {
      labels: ['Nakit', 'Kart', 'Havale'],
      datasets: [
        {
          data: [
            revenueData.revenueBySource?.cashRevenue || 0,
            revenueData.revenueBySource?.cardRevenue || 0,
            revenueData.revenueBySource?.transferRevenue || 0,
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(168, 85, 247, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Toplam Gelir</h3>
            <p className="text-3xl font-bold text-green-600">₺{revenueData.totalRevenue?.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Rezervasyon</h3>
            <p className="text-3xl font-bold text-blue-600">₺{revenueData.reservationRevenue?.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Satış</h3>
            <p className="text-3xl font-bold text-purple-600">₺{revenueData.saleRevenue?.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Büyüme Oranı</h3>
            <p className={`text-3xl font-bold ${revenueData.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueData.growthRate >= 0 ? '+' : ''}%{revenueData.growthRate?.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ödeme Yöntemleri</h3>
            <Doughnut data={paymentMethodData} />
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerReport = () => {
    if (!customerData) return <div className="text-center py-8">Müşteri raporu yükleniyor...</div>;

    // Customer type pie chart
    const customerTypeData = {
      labels: ['Yeni Müşteri', 'Geri Dönen Müşteri'],
      datasets: [
        {
          data: [customerData.newCustomers || 0, customerData.returningCustomers || 0],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Toplam Müşteri</h3>
            <p className="text-3xl font-bold text-blue-600">{customerData.totalCustomers}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Yeni Müşteri</h3>
            <p className="text-3xl font-bold text-green-600">{customerData.newCustomers}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Geri Dönen</h3>
            <p className="text-3xl font-bold text-purple-600">{customerData.returningCustomers}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ort. Harcama</h3>
            <p className="text-3xl font-bold text-orange-600">₺{customerData.averageSpendingPerCustomer?.toFixed(2)}</p>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Müşteri Dağılımı</h3>
            <Doughnut data={customerTypeData} />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">En Değerli Müşteriler</h3>
            <div className="space-y-3">
              {customerData.topCustomers?.slice(0, 5).map((customer, index) => (
                <div key={customer.customerId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{customer.customerName}</p>
                    <p className="text-sm text-gray-600">{customer.totalReservations} rezervasyon</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₺{customer.totalSpending?.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{customer.customerType}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demographics */}
        {customerData.demographics && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Müşteri Demografikleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country Breakdown */}
              {Object.keys(customerData.demographics.countryBreakdown || {}).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Ülke Dağılımı</h4>
                  <div className="space-y-2">
                    {Object.entries(customerData.demographics.countryBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([country, count]) => (
                        <div key={country} className="flex justify-between">
                          <span className="text-gray-600">{country}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* City Breakdown */}
              {Object.keys(customerData.demographics.cityBreakdown || {}).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Şehir Dağılımı</h4>
                  <div className="space-y-2">
                    {Object.entries(customerData.demographics.cityBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([city, count]) => (
                        <div key={city} className="flex justify-between">
                          <span className="text-gray-600">{city}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Raporlar ve Analizler</h1>
          <p className="text-gray-600 mt-2">Detaylı iş raporları ve performans analizleri</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'occupancy', label: 'Doluluk', icon: '🏨' },
                { id: 'revenue', label: 'Gelir', icon: '💰' },
                { id: 'customers', label: 'Müşteriler', icon: '👥' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Date Range and Export Controls */}
          {activeTab !== 'dashboard' && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <button
                    onClick={handleDateRangeChange}
                    className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Güncelle
                  </button>
                </div>
                <button
                  onClick={() => exportToExcel(activeTab)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  📊 Excel İndir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'occupancy' && renderOccupancyReport()}
              {activeTab === 'revenue' && renderRevenueReport()}
              {activeTab === 'customers' && renderCustomerReport()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
