import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReservations,
  setFilters,
  clearFilters,
  setPagination,
  deleteReservation
} from '../store/slices/reservationSlice';
import CheckInOutModal from './CheckInOutModal';
import Swal from 'sweetalert2';
import { Tooltip } from 'react-tooltip';
import { reservationService } from '../services/api';

const ReservationList = ({ onEditReservation, onCreateReservation }) => {
  const dispatch = useDispatch();
  const { 
    reservations, 
    loading, 
    error, 
    filters, 
    pagination 
  } = useSelector((state) => state.reservations);

  const [localFilters, setLocalFilters] = useState(filters);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [selectedReservationForAction, setSelectedReservationForAction] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Redux store'daki filters değiştiğinde localFilters'ı güncelle
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Component ilk yüklendiğinde varsayılan filtreleri uygula
  useEffect(() => {
    console.log('Component mounted, current filters:', filters);
    // Varsayılan filtreleri zorla uygula
    if (filters.status !== 'exclude-checked-out') {
      console.log('Setting default filter to exclude-checked-out');
      dispatch(setFilters({ ...filters, status: 'exclude-checked-out' }));
    } else {
      // Filtre zaten doğruysa direkt fetch yap
      console.log('Filter already correct, fetching reservations');
      dispatch(fetchReservations({ ...filters, ...pagination }));
    }
  }, []);

  // Filters değiştiğinde rezervasyonları getir
  useEffect(() => {
    console.log('Fetching reservations with filters:', filters);
    dispatch(fetchReservations({ ...filters, ...pagination }));
  }, [dispatch, filters, pagination]);



  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    dispatch(setFilters(localFilters));
    dispatch(setPagination({ page: 1 }));
  };

  const handleClearFilters = () => {
    setLocalFilters({
      status: 'exclude-checked-out', // Varsayılan olarak çıkış yapılanları hariç tut
      customerName: '',
      roomNumber: '',
      checkInDate: '',
      checkOutDate: '',
    });
    dispatch(clearFilters());
    dispatch(setPagination({ page: 1 }));
  };

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }));
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Rezervasyonu Sil',
      text: 'Bu rezervasyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteReservation(id)).unwrap();
        await Swal.fire({
          title: 'Başarılı!',
          text: 'Rezervasyon başarıyla silindi.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        dispatch(fetchReservations({ ...filters, ...pagination }));
      } catch (error) {
        console.error('Error deleting reservation:', error);
        await Swal.fire({
          title: 'Hata!',
          text: 'Rezervasyon silinirken bir hata oluştu.',
          icon: 'error',
          confirmButtonText: 'Tamam'
        });
      }
    }
  };

  const handleCheckIn = (reservation) => {
    setSelectedReservationForAction(reservation);
    setShowCheckInModal(true);
  };

  const handleCheckOut = (reservation) => {
    setSelectedReservationForAction(reservation);
    setShowCheckOutModal(true);
  };

  const handleCloseActionModals = () => {
    setShowCheckInModal(false);
    setShowCheckOutModal(false);
    setSelectedReservationForAction(null);
  };

  const handleQuickStatusChange = async (reservationId, newStatus) => {
    try {
      console.log('Updating status:', reservationId, newStatus);

      // Use dedicated status update endpoint
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');

      if (!token) {
        await Swal.fire({
          title: 'Hata!',
          text: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
          icon: 'error',
          confirmButtonText: 'Tamam'
        });
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`http://localhost:5297/api/reservations/${reservationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: parseInt(newStatus) })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Status update failed: ${response.status}`);
      }

      await Swal.fire({
        title: 'Başarılı!',
        text: 'Rezervasyon durumu güncellendi.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      // Refresh the list
      dispatch(fetchReservations({ ...filters, ...pagination }));
      setOpenDropdownId(null);
    } catch (error) {
      console.error('Error updating reservation status:', error);
      await Swal.fire({
        title: 'Hata!',
        text: 'Rezervasyon durumu güncellenirken bir hata oluştu.',
        icon: 'error',
        confirmButtonText: 'Tamam'
      });
      setOpenDropdownId(null);
    }
  };

  const toggleDropdown = (reservationId) => {
    setOpenDropdownId(openDropdownId === reservationId ? null : reservationId);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      0: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      1: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-800' },
      2: { label: 'Giriş Yapıldı', color: 'bg-green-100 text-green-800' },
      3: { label: 'Çıkış Yapıldı', color: 'bg-gray-100 text-gray-800' },
      4: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800' },
      5: { label: 'Gelmedi', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: 'Bilinmiyor', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Rezervasyonlar</h2>
          <button
            onClick={onCreateReservation}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            + Yeni Rezervasyon
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={localFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              <option value="exclude-checked-out">Çıkış Yapılanlar Hariç</option>
              <option value="0">Beklemede</option>
              <option value="1">Onaylandı</option>
              <option value="2">Giriş Yapıldı</option>
              <option value="3">Çıkış Yapıldı</option>
              <option value="4">İptal Edildi</option>
              <option value="5">Gelmedi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Adı</label>
            <input
              type="text"
              value={localFilters.customerName}
              onChange={(e) => handleFilterChange('customerName', e.target.value)}
              placeholder="Müşteri adı ara..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oda No</label>
            <input
              type="text"
              value={localFilters.roomNumber}
              onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
              placeholder="Oda numarası..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giriş Tarihi</label>
            <input
              type="date"
              value={localFilters.checkInDate}
              onChange={(e) => handleFilterChange('checkInDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Çıkış Tarihi</label>
            <input
              type="date"
              value={localFilters.checkOutDate}
              onChange={(e) => handleFilterChange('checkOutDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleApplyFilters}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Filtrele
          </button>
          <button
            onClick={handleClearFilters}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto relative">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Müşteriler
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oda
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarihler
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Misafir
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tutar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {/* Ana müşteri avatarı */}
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {reservation.customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>

                    {/* Müşteri bilgileri */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {reservation.customerName}
                        {reservation.customers && reservation.customers.length > 1 && (
                          <span className="ml-1 text-xs text-gray-500">
                            (Ana müşteri)
                          </span>
                        )}
                      </div>

                      {/* Çoklu müşteri gösterimi */}
                      {reservation.customers && reservation.customers.length > 1 && (
                        <div className="flex items-center mt-1 space-x-1">
                          {/* Diğer müşteri avatarları (maksimum 3 göster) */}
                          {reservation.customers.slice(1, 4).map((customer, index) => (
                            <div
                              key={customer.customerId}
                              className="h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              title={customer.customerName}
                            >
                              {customer.customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                          ))}

                          {/* Fazla müşteri sayısı */}
                          {reservation.customers.length > 4 && (
                            <div className="h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium">
                              +{reservation.customers.length - 4}
                            </div>
                          )}

                          {/* Toplam müşteri sayısı */}
                          <span className="text-xs text-gray-500 ml-2">
                            {reservation.customers.length} kişi
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {reservation.roomNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {reservation.numberOfGuests}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(reservation.totalAmount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Ödenen: {formatCurrency(reservation.paidAmount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(reservation.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEditReservation(reservation)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                      data-tooltip-id="edit-reservation-tooltip"
                      data-tooltip-content="Rezervasyonu düzenle"
                    >
                      ✏️
                    </button>

                    {(reservation.status === 0 || reservation.status === 1) && (
                      <button
                        onClick={() => handleCheckIn(reservation)}
                        className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50"
                        data-tooltip-id="checkin-tooltip"
                        data-tooltip-content="Giriş yap"
                      >
                        🏨
                      </button>
                    )}

                    {reservation.status === 2 && (
                      <button
                        onClick={() => handleCheckOut(reservation)}
                        className="text-orange-600 hover:text-orange-900 p-2 rounded-md hover:bg-orange-50"
                        data-tooltip-id="checkout-tooltip"
                        data-tooltip-content="Çıkış yap"
                      >
                        🚪
                      </button>
                    )}

                    {/* Quick Status Change Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(reservation.id)}
                        className="text-purple-600 hover:text-purple-900 p-2 rounded-md hover:bg-purple-50"
                        data-tooltip-id="status-change-tooltip"
                        data-tooltip-content="Durum değiştir"
                      >
                        ⚡
                      </button>

                      {openDropdownId === reservation.id && (
                        <>
                          {/* Overlay */}
                          <div
                            className="fixed inset-0 bg-black bg-opacity-25"
                            style={{ zIndex: 9998 }}
                            onClick={() => setOpenDropdownId(null)}
                          />
                          {/* Dropdown */}
                          <div
                            className="fixed bg-white rounded-md shadow-xl border border-gray-200"
                            style={{
                              zIndex: 9999,
                              minWidth: '200px',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                          <div className="py-1">
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b bg-gray-50">
                              Durum Değiştir
                            </div>
                            {reservation.status !== 0 && (
                              <button
                                onClick={() => handleQuickStatusChange(reservation.id, 0)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                🟡 Beklemede
                              </button>
                            )}
                            {reservation.status !== 1 && (
                              <button
                                onClick={() => handleQuickStatusChange(reservation.id, 1)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                🔵 Onaylandı
                              </button>
                            )}
                            {reservation.status !== 4 && (
                              <button
                                onClick={() => handleQuickStatusChange(reservation.id, 4)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                🔴 İptal Et
                              </button>
                            )}
                            {reservation.status !== 5 && (
                              <button
                                onClick={() => handleQuickStatusChange(reservation.id, 5)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                ❌ Gelmedi
                              </button>
                            )}
                            <div className="border-t">
                              <button
                                onClick={() => setOpenDropdownId(null)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                              >
                                ✕ İptal
                              </button>
                            </div>
                          </div>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(reservation.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                      data-tooltip-id="delete-reservation-tooltip"
                      data-tooltip-content="Rezervasyonu sil"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total > pagination.pageSize && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Önceki
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Toplam <span className="font-medium">{pagination.total}</span> kayıttan{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.pageSize + 1}
                </span>{' '}
                -{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                </span>{' '}
                arası gösteriliyor
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Önceki
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Sonraki
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && reservations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">Rezervasyon bulunamadı</div>
          <div className="text-gray-400 text-sm">
            Yeni bir rezervasyon oluşturmak için yukarıdaki butonu kullanın.
          </div>
        </div>
      )}

      {/* Check-in/Check-out Modals */}
      <CheckInOutModal
        isOpen={showCheckInModal}
        onClose={handleCloseActionModals}
        reservation={selectedReservationForAction}
        type="checkin"
      />

      <CheckInOutModal
        isOpen={showCheckOutModal}
        onClose={handleCloseActionModals}
        reservation={selectedReservationForAction}
        type="checkout"
      />

      {/* Tooltips */}
      <Tooltip id="edit-reservation-tooltip" />
      <Tooltip id="checkin-tooltip" />
      <Tooltip id="checkout-tooltip" />
      <Tooltip id="status-change-tooltip" />
      <Tooltip id="delete-reservation-tooltip" />
    </div>
  );
};

export default ReservationList;
