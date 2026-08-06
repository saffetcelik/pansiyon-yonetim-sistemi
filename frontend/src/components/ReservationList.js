import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReservations,
  setFilters,
  clearFilters,
  deleteReservation
} from '../store/slices/reservationSlice';
import { fetchRooms } from '../store/slices/roomSlice';
import CheckInOutModal from './CheckInOutModal';
import CustomerModal from './CustomerModal';
import Swal from 'sweetalert2';
import { Tooltip } from 'react-tooltip';
import { format, parse } from 'date-fns';
import { tr as trLocale } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import { FaCalendarAlt } from 'react-icons/fa';
// jQuery gerekli - globale ekle
import $ from 'jquery';
// DataTables temel kütüphanesini import et
import 'datatables.net';
// DataTables responsive modülünü import et
import 'datatables.net-responsive';
// CSS dosyalarını import et
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import "../styles/datatables.css"; // Özel DataTables stilleri
import "../styles/datatables.pagination.css"; // Sayfalama için özel stiller

// API Base URL - Domain üzerinden erişim için dinamik URL belirleme
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // ASLA localhost kullanma - sadece gerçek localhost erişiminde
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:5297/api`;
  }

  // Tüm domain erişimleri için domain üzerinden API kullan
  return `${protocol}//${hostname}/api`;
};

// jQuery'yi global değişkenlere ekle
window.$ = $;
window.jQuery = $;

// Türkçe lokalizasyonu kaydet
registerLocale('tr', trLocale);

// Tarihi DD/MM/YYYY formatında göstermek için yardımcı fonksiyon
const formatDateForDisplay = (isoDate) => {
  if (!isoDate) return '';
  return format(new Date(isoDate), 'dd/MM/yyyy', { locale: trLocale });
};

// DD/MM/YYYY formatındaki tarihi ISO formatına çevirmek için yardımcı fonksiyon
const parseDisplayDate = (displayDate) => {
  if (!displayDate) return '';
  try {
    const parsedDate = parse(displayDate, 'dd/MM/yyyy', new Date());
    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    return '';
  }
};

const ReservationList = ({ onEditReservation, onCreateReservation }) => {
  const dispatch = useDispatch();
  const {
    reservations,
    loading,
    error,
    filters
  } = useSelector((state) => state.reservations);

  const { rooms } = useSelector((state) => state.rooms);

  const [localFilters, setLocalFilters] = useState(filters);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showCustomerSearchModal, setShowCustomerSearchModal] = useState(false);
  const [selectedReservationForAction, setSelectedReservationForAction] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [guestPopupReservation, setGuestPopupReservation] = useState(null);
  const [notePopupReservation, setNotePopupReservation] = useState(null);

  // DataTable referansı
  const tableRef = useRef(null);

  // Oda arama alanı için
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const roomDropdownRef = useRef(null);

  // Redux store'daki filters değiştiğinde localFilters'ı güncelle
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Component ilk yüklendiğinde varsayılan filtreleri uygula ve odaları getir
  useEffect(() => {
    console.log('Component mounted, current filters:', filters);
    // Varsayılan filtreleri zorla uygula
    if (filters.status !== 'exclude-checked-out') {
      console.log('Setting default filter to exclude-checked-out');
      dispatch(setFilters({ ...filters, status: 'exclude-checked-out' }));
    } else {
      // Filtre zaten doğruysa direkt fetch yap
      console.log('Filter already correct, fetching reservations');
      dispatch(fetchReservations({ ...filters }));
    }

    // Odaları getir
    dispatch(fetchRooms());
  }, []);

  // Dışarıdaki bir yere tıklanınca dropdown menüyü kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(event.target)) {
        setShowRoomDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roomDropdownRef]);

  // Filters değiştiğinde rezervasyonları getir
  useEffect(() => {
    console.log('Fetching reservations with filters:', filters);
    // sadece customerId ile ara, customerName'i yoksay
    const searchFilters = { ...filters };
    if (searchFilters.customerId) {
      // customerId varsa customerName parametresini göndermemek için boşaltıyoruz
      searchFilters.customerName = '';
    }
    dispatch(fetchReservations(searchFilters));
  }, [dispatch, filters]);

  // DataTables'ı başlat
  useEffect(() => {
    // DataTables yalnızca rezervasyonlar yüklendiyse başlat
    if (!loading && reservations && tableRef.current) {
      try {
        // Tablo zaten başlatıldıysa yok et
        if ($.fn.DataTable && $.fn.DataTable.isDataTable(tableRef.current)) {
          $(tableRef.current).DataTable().destroy();
        }

        // Türkçe lokalizasyonu
        const turkishLanguage = {
          "emptyTable": "Rezervasyon bulunamadı",
          "info": "_TOTAL_ rezervasyondan _START_ - _END_ arası gösteriliyor",
          "infoEmpty": "0 rezervasyon",
          "infoFiltered": "(_MAX_ rezervasyon arasından filtrelendi)",
          "lengthMenu": "Sayfa başına _MENU_ kayıt göster",
          "loadingRecords": "Yükleniyor...",
          "processing": "İşleniyor...",
          "search": "Ara:",
          "zeroRecords": "Eşleşen kayıt bulunamadı",
          "paginate": {
            "first": "İlk",
            "last": "Son",
            "next": "Sonraki",
            "previous": "Önceki"
          },
          "aria": {
            "sortAscending": ": artan sıralama",
            "sortDescending": ": azalan sıralama"
          }
        };

        // DataTable yapılandırması - sayfalama kontrolleri için özelleştirilmiş
        const table = $(tableRef.current).DataTable({
          language: turkishLanguage,
          ordering: true,
          paging: true,
          pageLength: 10,
          pagingType: "full_numbers", // İlk, Son, Önceki, Sonraki ve sayfa numaralarını göster
          lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "Tümü"]],
          // Sayfalama ve diğer kontroller için özel DOM düzeni
          dom: '<"dataTables_wrapper-header"<"dataTables_length-container"l><"dataTables_filter-container"f>>' +
            '<"table-responsive"t>' +
            '<"dataTables_wrapper-footer"<"dataTables_info-container"i><"dataTables_paginate-container"p>>',
          columnDefs: [
            { orderable: false, targets: [1, 7] }, // Müşteriler ve İşlemler sütunlarında sıralama yapma
            { responsivePriority: 1, targets: [0, 1] }, // Oda No ve Müşteri öncelikli gösterilecek
            { responsivePriority: 2, targets: 7 }, // İşlemler sütunu da önemli
            { responsivePriority: 3, targets: [2, 3] } // Giriş/Çıkış tarihleri de gösterilmeli
          ],
          responsive: {
            details: {
              type: 'column',
              target: 'tr',
              renderer: function (api, rowIdx, columns) {
                let data = '';
                // Sadece gizlenen sütunları göster
                columns.filter(col => !col.visible).forEach(col => {
                  data += '<li>' +
                    '<span class="dtr-title">' + col.title + '</span> ' +
                    '<span class="dtr-data">' + col.data + '</span>' +
                    '</li>';
                });

                return data ? '<ul class="dtr-details">' + data + '</ul>' : false;
              }
            }
          },
          drawCallback: function () {
            // Tablo çizildikten sonra responsive uyumluluğu tekrar kontrol et
            $(window).trigger('resize');

            // Search input placeholder ekle
            $('.dataTables_filter input').attr('placeholder', 'Rezervasyon ara...');

            // "Sayfa başına göster" yazısını düzelt
            $('.dataTables_length label').contents().filter(function () {
              return this.nodeType === 3;
            }).replaceWith('Göster: ');

            // Sayfalama düğmelerini iyileştir
            $('.dataTables_paginate .paginate_button.first').html('«');
            $('.dataTables_paginate .paginate_button.previous').html('‹');
            $('.dataTables_paginate .paginate_button.next').html('›');
            $('.dataTables_paginate .paginate_button.last').html('»');
          }
        });

        return () => {
          // Bileşen kaldırıldığında tabloyu temizle
          try {
            if ($.fn.DataTable && $.fn.DataTable.isDataTable(tableRef.current)) {
              $(tableRef.current).DataTable().destroy();
            }
          } catch (error) {
            console.error("DataTable temizlenirken hata oluştu:", error);
          }
        };
      } catch (error) {
        console.error("DataTables başlatılırken bir hata oluştu:", error);
      }
    }
  }, [reservations, loading]);



  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    console.log("Filtreleri uygula:", localFilters);
    dispatch(setFilters(localFilters));
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      status: 'exclude-checked-out', // Varsayılan olarak çıkış yapılanları hariç tut
      customerName: '',
      customerId: null,
      roomNumber: '',
      checkInDate: '',
      checkOutDate: '',
    };
    setLocalFilters(defaultFilters);
    setSelectedCustomer(null);
    console.log("Filtreler temizlendi");
    dispatch(clearFilters());
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setLocalFilters(prev => ({
      ...prev,
      customerName: `${customer.firstName} ${customer.lastName}`, // Sadece görüntüleme için
      customerId: customer.id // API araması için kullanılacak
    }));
    console.log("Seçilen müşteri:", customer);
    console.log("Filtreler güncellendi:", {
      ...localFilters,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerId: customer.id
    });

    // Müşteriyi seçtikten sonra doğrudan filtreleri uygula
    dispatch(setFilters({
      ...localFilters,
      customerName: `${customer.firstName} ${customer.lastName}`, // Bu sadece UI'da gösterilecek
      customerId: customer.id // Backend aramasında kullanılacak
    }));
  };

  // Oda arama fonksiyonu
  const handleRoomSearch = (e) => {
    setRoomSearchTerm(e.target.value);
    setShowRoomDropdown(true);
  };

  // Oda seçme fonksiyonu
  const handleSelectRoom = (room) => {
    setLocalFilters(prev => ({
      ...prev,
      roomNumber: room.roomNumber.toString()
    }));
    setRoomSearchTerm('');
    setShowRoomDropdown(false);
  };

  // Filtrelenmiş oda listesi
  const filteredRooms = roomSearchTerm
    ? rooms.filter(room => {
      const searchTermLower = roomSearchTerm.toLowerCase();

      // Temel oda bilgileri ile arama
      if (room.roomNumber.toString().includes(searchTermLower)) return true;
      if (room.roomType && room.roomType.toLowerCase().includes(searchTermLower)) return true;
      if (room.description && room.description.toLowerCase().includes(searchTermLower)) return true;

      // Oda özellikleri ile arama
      if (searchTermLower.includes('wifi') && room.hasWiFi) return true;
      if ((searchTermLower.includes('tv') || searchTermLower.includes('televizyon')) && room.hasTV) return true;
      if ((searchTermLower.includes('klima') || searchTermLower.includes('air')) && room.hasAirConditioning) return true;
      if ((searchTermLower.includes('balkon') || searchTermLower.includes('balcony')) && room.hasBalcony) return true;
      if ((searchTermLower.includes('minibar') || searchTermLower.includes('bar')) && room.hasMinibar) return true;
      if ((searchTermLower.includes('manzara') || searchTermLower.includes('deniz') ||
        searchTermLower.includes('sea') || searchTermLower.includes('view')) && room.hasSeaView) return true;

      // Kişi kapasitesi ile arama
      if (room.capacity && (
        searchTermLower.includes(room.capacity.toString() + ' kişi') ||
        searchTermLower.includes(room.capacity.toString() + ' kişilik') ||
        searchTermLower === room.capacity.toString()
      )) return true;

      return false;
    })
    : rooms;

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
        dispatch(fetchReservations({ ...filters }));
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

      const apiBaseUrl = getBaseUrl();
      const response = await fetch(`${apiBaseUrl}/reservations/${reservationId}/status`, {
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
      dispatch(fetchReservations({ ...filters }));
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Rezervasyonlar</h2>
          <button
            onClick={onCreateReservation}
            className="bg-white text-blue-600 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm sm:text-base"
          >
            + Yeni Rezervasyon
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
              <option value="2">Giriş Yapıldı</option>
              <option value="3">Çıkış Yapıldı</option>
              <option value="4">İptal Edildi</option>
              <option value="5">Gelmedi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
            <div className="relative">
              <input
                type="text"
                value={localFilters.customerName}
                readOnly
                placeholder="Müşteri seçin..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
              />
              <div className="absolute inset-y-0 right-0 flex">
                {/* Temizleme butonu */}
                {localFilters.customerId && (
                  <button
                    type="button"
                    onClick={() => {
                      // Tüm müşteri bilgilerini sıfırla
                      handleFilterChange('customerName', '');
                      handleFilterChange('customerId', null);
                      setSelectedCustomer(null);
                      console.log("Müşteri filtresi temizlendi");

                      // Otomatik filtreleme yap
                      dispatch(setFilters({
                        ...localFilters,
                        customerName: '',
                        customerId: null
                      }));
                    }}
                    className="px-3 flex items-center border-l hover:bg-gray-100"
                    title="Müşteri filtresini temizle"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {/* Arama butonu */}
                <button
                  type="button"
                  onClick={() => setShowCustomerSearchModal(true)}
                  className="px-3 flex items-center bg-gray-100 hover:bg-gray-200 border-l rounded-r-md"
                  title="Müşteri ara"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oda</label>
            <div className="relative" ref={roomDropdownRef}>
              <input
                type="text"
                value={roomSearchTerm || localFilters.roomNumber || ''}
                onChange={handleRoomSearch}
                onFocus={() => setShowRoomDropdown(true)}
                placeholder="Oda no, tür veya özellik ile ara..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              />
              {(localFilters.roomNumber || roomSearchTerm) && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 flex items-center"
                  onClick={() => {
                    handleFilterChange('roomNumber', '');
                    setRoomSearchTerm('');
                  }}
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Oda Dropdown */}
              {showRoomDropdown && filteredRooms.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-72 overflow-y-auto">
                  {filteredRooms.map(room => (
                    <div
                      key={room.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleSelectRoom(room)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg font-semibold text-gray-900">
                              Oda {room.roomNumber}
                            </span>
                            {room.roomType && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                {room.roomType}
                              </span>
                            )}
                            {room.capacity && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                👥 {room.capacity} kişi
                              </span>
                            )}
                          </div>

                          {room.description && (
                            <div className="text-sm text-gray-600 mb-2">
                              <p className="mb-1 line-clamp-1">{room.description}</p>
                            </div>
                          )}

                          {/* Oda Özellikleri */}
                          <div className="flex flex-wrap gap-1 mb-1">
                            {room.hasWiFi && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">📶 WiFi</span>
                            )}
                            {room.hasTV && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">📺 TV</span>
                            )}
                            {room.hasAirConditioning && (
                              <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded">❄️ Klima</span>
                            )}
                            {room.hasBalcony && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">🏡 Balkon</span>
                            )}
                            {room.hasMinibar && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">🍷 Minibar</span>
                            )}
                            {room.hasSeaView && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">🌊 Manzara</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {room.price && (
                            <>
                              <div className="text-lg font-bold text-green-600">
                                {room.price.toLocaleString('tr-TR')} TL
                              </div>
                              <div className="text-xs text-gray-500">/ gece</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Oda bulunamadı mesajı */}
              {showRoomDropdown && roomSearchTerm && filteredRooms.length === 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 p-4 text-center text-gray-500">
                  <p className="font-medium">"{roomSearchTerm}" ile eşleşen oda bulunamadı</p>
                  <p className="text-xs mt-1">Oda numarası, oda türü veya özellikleri ile arayabilirsiniz</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giriş Tarihi</label>
            <div style={{ position: 'relative' }}>
              <DatePicker
                selected={localFilters.checkInDate ? new Date(localFilters.checkInDate) : null}
                onChange={(date) => {
                  if (date) {
                    // Tarih nesnesini saat bilgisi olmadan oluştur (yerel saat diliminde)
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    const day = date.getDate();

                    // Yeni bir tarih oluştur ve saati ayarla (UTC kayması olmasın)
                    const fixedDate = new Date(year, month, day, 12, 0, 0);

                    // ISO formatında tarih kısmını al (YYYY-MM-DD)
                    const isoDate = fixedDate.toISOString().split('T')[0];
                    console.log("Seçilen giriş tarihi (ISO):", isoDate);

                    handleFilterChange('checkInDate', isoDate);
                  } else {
                    handleFilterChange('checkInDate', '');
                  }
                }}
                dateFormat="dd/MM/yyyy"
                locale="tr"
                placeholderText="GG/AA/YYYY"
                className="w-full !pl-3 !pr-8 py-2 !border !rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                wrapperClassName="date-picker-normal"
              />
              <FaCalendarAlt
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                  pointerEvents: 'none'
                }}
                size={16}
              />
              {localFilters.checkInDate && (
                <button
                  type="button"
                  className="absolute right-30 top-1/2 transform -translate-y-1/2 z-10"
                  onClick={() => handleFilterChange('checkInDate', '')}
                  style={{ right: '30px' }}
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Çıkış Tarihi</label>
            <div style={{ position: 'relative' }}>
              <DatePicker
                selected={localFilters.checkOutDate ? new Date(localFilters.checkOutDate) : null}
                onChange={(date) => {
                  if (date) {
                    // Tarih nesnesini saat bilgisi olmadan oluştur (yerel saat diliminde)
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    const day = date.getDate();

                    // Yeni bir tarih oluştur ve saati ayarla (UTC kayması olmasın)
                    const fixedDate = new Date(year, month, day, 12, 0, 0);

                    // ISO formatında tarih kısmını al (YYYY-MM-DD)
                    const isoDate = fixedDate.toISOString().split('T')[0];
                    console.log("Seçilen çıkış tarihi (ISO):", isoDate);

                    handleFilterChange('checkOutDate', isoDate);
                  } else {
                    handleFilterChange('checkOutDate', '');
                  }
                }}
                dateFormat="dd/MM/yyyy"
                locale="tr"
                placeholderText="GG/AA/YYYY"
                className="w-full !pl-3 !pr-8 py-2 !border !rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                wrapperClassName="date-picker-normal"
              />
              <FaCalendarAlt
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                  pointerEvents: 'none'
                }}
                size={16}
              />
              {localFilters.checkOutDate && (
                <button
                  type="button"
                  className="absolute top-1/2 transform -translate-y-1/2 z-10"
                  onClick={() => handleFilterChange('checkOutDate', '')}
                  style={{ right: '30px' }}
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
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

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table ref={tableRef} className="min-w-full divide-y divide-gray-200 display nowrap w-full table-responsive">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-priority="1">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-priority="1">
                Rezervasyon / Müşteri
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-priority="1">
                Oda
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-priority="3">
                Tarihler
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-priority="4">
                Misafir
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-priority="3">
                Tutar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-priority="2">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-priority="2">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.map((reservation, index) => (
              <tr key={reservation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {(reservation.reservationName || reservation.customerName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Önce rezervasyon adı, yoksa müşteri adı */}
                      {reservation.reservationName ? (
                        <div className="text-sm font-bold text-gray-900 truncate">
                          📋 {reservation.reservationName}
                        </div>
                      ) : null}
                      {reservation.customerName && (
                        <div className={`truncate ${reservation.reservationName ? 'text-xs text-gray-500 mt-0.5' : 'text-sm font-medium text-gray-900'}`}>
                          {reservation.customerName}
                          {reservation.customers && reservation.customers.length > 1 && (
                            <span className="ml-1 text-xs text-gray-400">(Ana)</span>
                          )}
                        </div>
                      )}
                      {!reservation.reservationName && !reservation.customerName && (
                        <div className="text-sm text-gray-400 italic">— İsimsiz —</div>
                      )}
                      {/* Ek müşteriler avatarları */}
                      {reservation.customers && reservation.customers.length > 1 && (
                        <div className="flex items-center mt-1 space-x-1">
                          {reservation.customers.slice(1, 4).map((customer) => (
                            <div
                              key={customer.customerId}
                              className="h-5 w-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              title={customer.customerName}
                            >
                              {customer.customerName ? customer.customerName.charAt(0).toUpperCase() : '?'}
                            </div>
                          ))}
                          {reservation.customers.length > 4 && (
                            <div className="h-5 w-5 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium">
                              +{reservation.customers.length - 4}
                            </div>
                          )}
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
                  {/* Misafir sayısı - tıklanabilir popup */}
                  <button
                    type="button"
                    onClick={() => setGuestPopupReservation(reservation)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-sm font-medium"
                    title="Müşteri listesini gör"
                  >
                    👥 {reservation.numberOfGuests}
                  </button>
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
                  <div className="flex space-x-1 items-center">
                    {/* Not megafon ikonu - sadece not varsa */}
                    {reservation.notes && (
                      <button
                        onClick={() => setNotePopupReservation(reservation)}
                        className="text-amber-500 hover:text-amber-700 p-2 rounded-md hover:bg-amber-50 transition"
                        title="Notu göster"
                      >
                        📢
                      </button>
                    )}

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
                          <div
                            className="fixed inset-0 bg-black bg-opacity-25"
                            style={{ zIndex: 9998 }}
                            onClick={() => setOpenDropdownId(null)}
                          />
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

      {/* Mobile Card View (Teknolojik ve Dokunmatik Dostu) */}
      <div className="md:hidden divide-y divide-gray-200">
        {reservations && reservations.length > 0 ? (
          reservations.map((reservation, index) => (
            <div key={reservation.id} className="p-4 bg-white hover:bg-gray-50">
              {/* Kart Üst Bilgisi */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  {reservation.reservationName ? (
                    <p className="text-base font-bold text-gray-900 truncate">📋 {reservation.reservationName}</p>
                  ) : null}
                  {reservation.customerName && (
                    <p className={`truncate ${reservation.reservationName ? 'text-sm text-gray-600' : 'text-base font-bold text-gray-900'}`}>
                      {reservation.customerName}
                    </p>
                  )}
                  <p className="text-xs text-blue-600 font-bold mt-0.5">
                    🏨 Oda {reservation.roomNumber}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(reservation.status)}
                </div>
              </div>

              {/* Kart Detay Tablosu */}
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-xs space-y-1.5 my-3 text-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">📅 Tarih:</span>
                  <span className="font-semibold text-gray-900">{formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">👥 Misafir:</span>
                  <button
                    type="button"
                    onClick={() => setGuestPopupReservation(reservation)}
                    className="font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2"
                  >
                    {reservation.numberOfGuests} Kişi
                  </button>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-blue-100">
                  <span className="text-gray-500 font-medium">💰 Toplam Tutar:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(reservation.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">💳 Ödenen:</span>
                  <span className="font-semibold text-green-700">{formatCurrency(reservation.paidAmount)}</span>
                </div>
              </div>

              {/* Butonlar: Yazılı ve Dokunmatik Dostu */}
              <div className="flex flex-wrap gap-2 pt-1">
                {/* Not megafon - sadece not varsa */}
                {reservation.notes && (
                  <button
                    type="button"
                    onClick={() => setNotePopupReservation(reservation)}
                    className="flex-1 min-w-[80px] inline-flex items-center justify-center px-3 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg text-xs font-semibold touch-manipulation active:scale-95 transition-all shadow-sm"
                  >
                    📢 Not
                  </button>
                )}

                {/* Düzenle */}
                <button
                  type="button"
                  onClick={() => onEditReservation(reservation)}
                  className="flex-1 min-w-[90px] inline-flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-xs font-semibold touch-manipulation active:scale-95 transition-all shadow-sm"
                >
                  ✏️ Düzenle
                </button>

                {/* Giriş Yap */}
                {(reservation.status === 0 || reservation.status === 1) && (
                  <button
                    type="button"
                    onClick={() => handleCheckIn(reservation)}
                    className="flex-1 min-w-[95px] inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-semibold touch-manipulation active:scale-95 transition-all shadow-sm"
                  >
                    🏨 Giriş Yap
                  </button>
                )}

                {/* Çıkış Yap */}
                {reservation.status === 2 && (
                  <button
                    type="button"
                    onClick={() => handleCheckOut(reservation)}
                    className="flex-1 min-w-[95px] inline-flex items-center justify-center px-3 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg text-xs font-semibold touch-manipulation active:scale-95 transition-all shadow-sm"
                  >
                    🚪 Çıkış Yap
                  </button>
                )}

                {/* Durum Değiştir */}
                <div className="relative flex-1 min-w-[90px]">
                  <button
                    type="button"
                    onClick={() => toggleDropdown(reservation.id)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-lg text-xs font-semibold touch-manipulation active:scale-95 transition-all shadow-sm"
                  >
                    ⚡ Durum
                  </button>

                  {openDropdownId === reservation.id && (
                    <>
                      <div
                        className="fixed inset-0 bg-black bg-opacity-40"
                        style={{ zIndex: 9998 }}
                        onClick={() => setOpenDropdownId(null)}
                      />
                      <div
                        className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 p-2"
                        style={{
                          zIndex: 9999,
                          minWidth: '240px',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="py-1">
                          <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50 rounded-t-lg">
                            Durum Değiştir
                          </div>
                          {reservation.status !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(reservation.id, 0)}
                              className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md my-0.5"
                            >
                              🟡 Beklemede
                            </button>
                          )}
                          {reservation.status !== 4 && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(reservation.id, 4)}
                              className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md my-0.5"
                            >
                              🔴 İptal Et
                            </button>
                          )}
                          {reservation.status !== 5 && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(reservation.id, 5)}
                              className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md my-0.5"
                            >
                              ❌ Gelmedi
                            </button>
                          )}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              type="button"
                              onClick={() => setOpenDropdownId(null)}
                              className="block w-full text-center px-4 py-2.5 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Sil */}
                <button
                  type="button"
                  onClick={() => handleDelete(reservation.id)}
                  className="flex-1 min-w-[70px] inline-flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-semibold touch-manipulation active:scale-95 transition-all shadow-sm"
                >
                  🗑️ Sil
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-gray-500">
            <p className="text-sm">Rezervasyon bulunamadı.</p>
          </div>
        )}
      </div>

      {/* DataTables sayfalama ve arama özelliklerini kullanacağız, bu kısmı kaldırabiliriz */}

      {/* Empty State - DataTables bu durumu otomatik olarak gösterecek */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">Rezervasyonlar yükleniyor...</div>
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

      <CustomerModal
        isOpen={showCustomerSearchModal}
        onClose={() => setShowCustomerSearchModal(false)}
        isSearchMode={true}
        onSelectCustomer={handleSelectCustomer}
      />

      {/* ─── Misafir Listesi Popup ─── */}
      {guestPopupReservation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center px-4"
          onClick={() => setGuestPopupReservation(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">👥 Misafir Listesi</h3>
              <button
                onClick={() => setGuestPopupReservation(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Rezervasyon özeti */}
            <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm">
              {guestPopupReservation.reservationName && (
                <div className="font-bold text-blue-900 mb-1">📋 {guestPopupReservation.reservationName}</div>
              )}
              <div className="flex items-center gap-4 text-gray-600">
                <span>🛏️ Oda {guestPopupReservation.roomNumber}</span>
                <span>📅 {formatDate(guestPopupReservation.checkInDate)} → {formatDate(guestPopupReservation.checkOutDate)}</span>
              </div>
            </div>

            {/* Müşteri listesi */}
            {guestPopupReservation.customers && guestPopupReservation.customers.length > 0 ? (
              <div className="space-y-2">
                {guestPopupReservation.customers.map((c, i) => (
                  <div key={c.customerId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.customerName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{c.customerName}</div>
                      <div className="text-xs text-gray-500">
                        {c.tcKimlikNo && `TC: ${c.tcKimlikNo}`}
                        {c.phone && ` | ${c.phone}`}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {i === 0 ? 'Ana' : `Misafir ${i}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm">Kayıtlı müşteri bulunmuyor</p>
                <p className="text-xs mt-1">Misafir sayısı: {guestPopupReservation.numberOfGuests}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Not Popup ─── */}
      {notePopupReservation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center px-4"
          onClick={() => setNotePopupReservation(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">📢 Rezervasyon Notu</h3>
              <button
                onClick={() => setNotePopupReservation(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Rezervasyon özeti */}
            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-sm border border-amber-200">
              {notePopupReservation.reservationName && (
                <div className="font-bold text-amber-900 mb-1">📋 {notePopupReservation.reservationName}</div>
              )}
              {notePopupReservation.customerName && (
                <div className="text-amber-800 font-medium mb-1">👤 {notePopupReservation.customerName}</div>
              )}
              <div className="flex items-center gap-4 text-amber-700">
                <span>🛏️ Oda {notePopupReservation.roomNumber}</span>
                <span>📅 {formatDate(notePopupReservation.checkInDate)} → {formatDate(notePopupReservation.checkOutDate)}</span>
              </div>
            </div>

            {/* Not içeriği */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                {notePopupReservation.notes}
              </p>
            </div>
          </div>
        </div>
      )}

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
