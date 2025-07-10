import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createReservation,
  updateReservation,
  fetchReservations
} from '../store/slices/reservationSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { customerService, roomService } from '../services/api';
import Swal from 'sweetalert2';
import CustomerModal from './CustomerModal';

const ReservationModal = ({ isOpen, onClose, reservation = null, isEdit = false }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.reservations);
  
  const [formData, setFormData] = useState({
    customerId: '',
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 1,
    totalAmount: 0,
    paidAmount: 0,
    status: 0, // Default: Beklemede
    notes: ''
  });

  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]); // Çoklu müşteri listesi
  const [formErrors, setFormErrors] = useState({});
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [selectedRoomOccupiedDates, setSelectedRoomOccupiedDates] = useState([]);
  const [showRoomCards, setShowRoomCards] = useState(false); // Modern oda seçimi için
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false); // Yeni müşteri modal'ı

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && reservation) {
      setFormData({
        customerId: reservation.customerId,
        roomId: reservation.roomId,
        checkInDate: reservation.checkInDate.split('T')[0],
        checkOutDate: reservation.checkOutDate.split('T')[0],
        numberOfGuests: reservation.numberOfGuests,
        totalAmount: reservation.totalAmount,
        paidAmount: reservation.paidAmount,
        status: reservation.status,
        notes: reservation.notes || ''
      });
      setSelectedCustomer({
        id: reservation.customerId,
        fullName: reservation.customerName
      });

      // Edit modunda rezervasyondaki müşterileri yükle
      if (reservation.customers && reservation.customers.length > 0) {
        const customers = reservation.customers.map(c => ({
          id: c.customerId,
          fullName: c.customerName,
          tcKimlikNo: c.tcKimlikNo,
          phone: c.phone
        }));
        setSelectedCustomers(customers);
      } else {
        // Eski rezervasyonlar için sadece ana müşteriyi ekle
        setSelectedCustomers([{
          id: reservation.customerId,
          fullName: reservation.customerName
        }]);
      }
    } else {
      // Reset form for new reservation
      setFormData({
        customerId: '',
        roomId: '',
        checkInDate: '',
        checkOutDate: '',
        numberOfGuests: 1,
        totalAmount: 0,
        paidAmount: 0,
        status: 0, // Default: Beklemede
        notes: ''
      });
      setSelectedCustomer(null);
      setSelectedCustomers([]); // Çoklu müşteri listesini temizle
      setCustomerSearch('');
    }
  }, [isEdit, reservation]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadRooms();
    }
  }, [isOpen]);

  // Load available rooms when dates change
  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate) {
      loadAvailableRooms();
    }
  }, [formData.checkInDate, formData.checkOutDate]);

  const loadRooms = async () => {
    try {
      const response = await roomService.getAll();
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadAvailableRooms = async () => {
    if (!formData.checkInDate || !formData.checkOutDate) return;

    // Tarih doğrulaması - CheckOut tarihi CheckIn tarihinden sonra olmalı
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);

    if (checkOut <= checkIn) {
      console.log('Invalid date range, skipping room availability check');
      setAvailableRooms([]);
      return;
    }

    setIsLoadingRooms(true);
    try {
      console.log('Loading available rooms for:', {
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        excludeReservationId: isEdit ? reservation?.id : null
      });

      const response = await roomService.getAvailability(
        formData.checkInDate,
        formData.checkOutDate,
        isEdit ? reservation?.id : null // Edit durumunda mevcut rezervasyonu hariç tut
      );

      console.log('Available rooms response:', response.data);
      setAvailableRooms(response.data);
    } catch (error) {
      console.error('Error loading available rooms:', error);
      setAvailableRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Seçilen oda için dolu tarihleri yükle
  const loadSelectedRoomOccupiedDates = async (roomId) => {
    if (!roomId) {
      setSelectedRoomOccupiedDates([]);
      return;
    }

    try {
      console.log('Loading occupied dates for room:', roomId);

      const response = await roomService.getOccupiedDates(
        roomId,
        null, // startDate - varsayılan olarak bugün
        null, // endDate - varsayılan olarak 1 yıl sonra
        isEdit ? reservation?.id : null // Edit durumunda mevcut rezervasyonu hariç tut
      );

      console.log('Room occupied dates response:', response.data);
      console.log('Occupied periods:', response.data.occupiedPeriods);
      setSelectedRoomOccupiedDates(response.data.occupiedPeriods || []);
    } catch (error) {
      console.error('Error loading room occupied dates:', error);
      setSelectedRoomOccupiedDates([]);
    }
  };

  const searchCustomers = async (query) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }

    try {
      const response = await customerService.search(query);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    }
  };

  const handleCustomerSearch = (value) => {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    searchCustomers(value);
  };

  const handleCustomerSelect = (customer) => {
    // Oda kapasitesi kontrolü
    const selectedRoom = availableRooms.find(room => room.id == formData.roomId) ||
                        rooms.find(room => room.id == formData.roomId);

    if (selectedRoom && selectedCustomers.length >= selectedRoom.capacity) {
      alert(`Bu oda maksimum ${selectedRoom.capacity} kişi kapasitesine sahiptir.`);
      return;
    }

    // Müşteriyi listeye ekle (eğer zaten yoksa)
    if (!selectedCustomers.find(c => c.id === customer.id)) {
      const newCustomers = [...selectedCustomers, customer];
      setSelectedCustomers(newCustomers);

      // İlk müşteri ana müşteri olur
      if (newCustomers.length === 1) {
        setSelectedCustomer(customer);
        setFormData(prev => ({ ...prev, customerId: customer.id }));
      }

      // Misafir sayısını güncelle
      setFormData(prev => ({ ...prev, numberOfGuests: newCustomers.length }));
    }

    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  // Müşteri kaldırma fonksiyonu
  const handleRemoveCustomer = (customerId) => {
    const newCustomers = selectedCustomers.filter(c => c.id !== customerId);
    setSelectedCustomers(newCustomers);

    // Eğer ana müşteri kaldırılıyorsa, yeni ana müşteri belirle
    if (selectedCustomer?.id === customerId) {
      const newPrimaryCustomer = newCustomers.length > 0 ? newCustomers[0] : null;
      setSelectedCustomer(newPrimaryCustomer);
      setFormData(prev => ({
        ...prev,
        customerId: newPrimaryCustomer?.id || '',
        numberOfGuests: newCustomers.length || 1
      }));
    } else {
      // Sadece misafir sayısını güncelle
      setFormData(prev => ({ ...prev, numberOfGuests: newCustomers.length || 1 }));
    }
  };

  // Yeni müşteri kaydedildiğinde çağrılacak fonksiyon
  const handleCustomerCreated = (newCustomer) => {
    // Yeni müşteriyi otomatik olarak seç
    const customerForSelection = {
      id: newCustomer.id,
      fullName: `${newCustomer.firstName} ${newCustomer.lastName}`,
      tcKimlikNo: newCustomer.tcKimlikNo,
      phone: newCustomer.phone
    };

    handleCustomerSelect(customerForSelection);

    // Modal'ı kapat
    setShowNewCustomerModal(false);

    Swal.fire({
      title: 'Başarılı!',
      text: 'Yeni müşteri kaydedildi ve rezervasyona eklendi.',
      icon: 'success',
      timer: 2000
    });
  };

  // Otomatik fiyat hesaplama
  const calculateTotalAmount = () => {
    if (!formData.checkInDate || !formData.checkOutDate || !formData.roomId) {
      return 0;
    }

    const selectedRoom = availableRooms.find(room => room.id == formData.roomId) ||
                        rooms.find(room => room.id == formData.roomId);

    if (!selectedRoom) return 0;

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    return nights * selectedRoom.pricePerNight;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Oda, tarih değiştiğinde otomatik fiyat hesapla
      if (field === 'roomId' || field === 'checkInDate' || field === 'checkOutDate') {
        if (newData.checkInDate && newData.checkOutDate && newData.roomId) {
          const selectedRoom = availableRooms.find(room => room.id == newData.roomId) ||
                              rooms.find(room => room.id == newData.roomId);

          if (selectedRoom) {
            const checkIn = new Date(newData.checkInDate);
            const checkOut = new Date(newData.checkOutDate);
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

            if (nights > 0) {
              newData.totalAmount = nights * selectedRoom.pricePerNight;
            }
          }
        }
      }

      // Oda değiştiğinde misafir sayısını kontrol et ve dolu tarihleri yükle
      if (field === 'roomId' && value) {
        const selectedRoom = availableRooms.find(room => room.id == value) ||
                            rooms.find(room => room.id == value);
        if (selectedRoom && newData.numberOfGuests > selectedRoom.capacity) {
          newData.numberOfGuests = selectedRoom.capacity;
        }

        // Seçilen oda için dolu tarihleri yükle
        loadSelectedRoomOccupiedDates(value);
      } else if (field === 'roomId' && !value) {
        // Oda seçimi temizlendiğinde dolu tarihleri de temizle
        setSelectedRoomOccupiedDates([]);
      }

      return newData;
    });

    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Tarih seçiminde dolu tarihleri kontrol et
  const isDateDisabled = (date, isCheckOut = false) => {
    if (!formData.roomId || selectedRoomOccupiedDates.length === 0) {
      return false; // Oda seçilmemişse veya dolu tarih yoksa tüm tarihler müsait
    }

    const selectedDate = new Date(date);

    for (const period of selectedRoomOccupiedDates) {
      // Tarih formatını düzelt - ISO string'i parse et
      const checkIn = new Date(period.checkInDate || period.CheckInDate);
      const checkOut = new Date(period.checkOutDate || period.CheckOutDate);

      // Geçersiz tarih kontrolü
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        console.warn('Invalid date in occupied period:', period);
        continue;
      }

      if (isCheckOut) {
        // Check-out tarihi için: dolu periyodun içinde olmamalı
        if (selectedDate > checkIn && selectedDate <= checkOut) {
          return true;
        }
      } else {
        // Check-in tarihi için: dolu periyodun içinde olmamalı
        if (selectedDate >= checkIn && selectedDate < checkOut) {
          return true;
        }
      }
    }

    return false;
  };

  // Müsait tarih aralıklarını bul
  const getAvailableDateRanges = () => {
    if (!formData.roomId || selectedRoomOccupiedDates.length === 0) {
      return []; // Oda seçilmemişse veya dolu tarih yoksa kısıtlama yok
    }

    const ranges = [];
    const today = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1);

    // Dolu periyodları tarihe göre sırala
    const sortedPeriods = [...selectedRoomOccupiedDates].sort((a, b) => {
      const dateA = new Date(a.checkInDate || a.CheckInDate);
      const dateB = new Date(b.checkInDate || b.CheckInDate);
      return dateA - dateB;
    });

    let currentDate = today;

    for (const period of sortedPeriods) {
      const periodStart = new Date(period.checkInDate || period.CheckInDate);
      const periodEnd = new Date(period.checkOutDate || period.CheckOutDate);

      // Geçersiz tarih kontrolü
      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
        console.warn('Invalid date in period:', period);
        continue;
      }

      // Mevcut tarih ile dolu periyod başlangıcı arasında müsait aralık varsa ekle
      if (currentDate < periodStart) {
        ranges.push({
          start: new Date(currentDate),
          end: new Date(periodStart.getTime() - 24 * 60 * 60 * 1000) // 1 gün öncesi
        });
      }

      // Sonraki müsait tarih dolu periyodun bitiminden sonra
      currentDate = new Date(periodEnd.getTime());
    }

    // Son dolu periyoddan sonra müsait aralık varsa ekle
    if (currentDate < oneYearLater) {
      ranges.push({
        start: new Date(currentDate),
        end: oneYearLater
      });
    }

    return ranges;
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerId || selectedCustomers.length === 0) {
      errors.customerId = 'En az bir müşteri seçimi zorunludur';
    }

    if (!formData.roomId) {
      errors.roomId = 'Oda seçimi zorunludur';
    }

    if (!formData.checkInDate) {
      errors.checkInDate = 'Giriş tarihi zorunludur';
    }

    if (!formData.checkOutDate) {
      errors.checkOutDate = 'Çıkış tarihi zorunludur';
    }

    if (formData.checkInDate && formData.checkOutDate) {
      if (new Date(formData.checkInDate) >= new Date(formData.checkOutDate)) {
        errors.checkOutDate = 'Çıkış tarihi giriş tarihinden sonra olmalıdır';
      }

      if (new Date(formData.checkInDate) < new Date().setHours(0, 0, 0, 0)) {
        errors.checkInDate = 'Giriş tarihi bugünden önce olamaz';
      }
    }

    if (formData.numberOfGuests < 1) {
      errors.numberOfGuests = 'Misafir sayısı en az 1 olmalıdır';
    }

    // Oda kapasitesi kontrolü
    if (formData.roomId && formData.numberOfGuests) {
      const selectedRoom = availableRooms.find(room => room.id == formData.roomId) ||
                          rooms.find(room => room.id == formData.roomId);
      if (selectedRoom && formData.numberOfGuests > selectedRoom.capacity) {
        errors.numberOfGuests = `Bu oda maksimum ${selectedRoom.capacity} kişiliktir`;
      }
    }

    if (formData.totalAmount < 0) {
      errors.totalAmount = 'Toplam tutar 0\'dan küçük olamaz';
    }

    if (formData.paidAmount < 0) {
      errors.paidAmount = 'Ödenen tutar 0\'dan küçük olamaz';
    }

    if (formData.paidAmount > formData.totalAmount) {
      errors.paidAmount = 'Ödenen tutar toplam tutardan fazla olamaz';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const reservationData = {
        ...formData,
        checkInDate: new Date(formData.checkInDate).toISOString(),
        checkOutDate: new Date(formData.checkOutDate).toISOString(),
        numberOfGuests: parseInt(formData.numberOfGuests),
        totalAmount: parseFloat(formData.totalAmount),
        paidAmount: parseFloat(formData.paidAmount),
        customerIds: selectedCustomers.map(c => c.id) // Çoklu müşteri ID'leri
      };

      if (isEdit) {
        await dispatch(updateReservation({
          id: reservation.id,
          reservationData
        })).unwrap();
      } else {
        await dispatch(createReservation(reservationData)).unwrap();
      }

      // Show success message
      await Swal.fire({
        title: 'Başarılı!',
        text: `Rezervasyon başarıyla ${isEdit ? 'güncellendi' : 'oluşturuldu'}.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      // Refresh reservations list
      dispatch(fetchReservations({}));
      onClose();
    } catch (error) {
      console.error('Error saving reservation:', error);
      let errorMessage = `Rezervasyon ${isEdit ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu.`;

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Girilen bilgilerde hata var. Lütfen kontrol edin.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      }

      await Swal.fire({
        title: 'Hata!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Tamam'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {isEdit ? 'Rezervasyon Düzenle' : 'Yeni Rezervasyon'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giriş Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (formData.roomId && isDateDisabled(selectedDate, false)) {
                      // Dolu tarih seçilmeye çalışılıyorsa uyarı ver
                      Swal.fire({
                        title: 'Uyarı!',
                        text: 'Seçilen tarih bu oda için dolu. Lütfen başka bir tarih seçin.',
                        icon: 'warning',
                        confirmButtonText: 'Tamam'
                      });
                      return;
                    }
                    handleInputChange('checkInDate', selectedDate);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.checkInDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.checkInDate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.checkInDate}</p>
                )}
                {formData.roomId && selectedRoomOccupiedDates.length > 0 && (
                  <p className="text-blue-500 text-xs mt-1">
                    ⚠️ Bu oda için bazı tarihler dolu. Dolu tarihleri seçemezsiniz.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Çıkış Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (formData.roomId && isDateDisabled(selectedDate, true)) {
                      // Dolu tarih seçilmeye çalışılıyorsa uyarı ver
                      Swal.fire({
                        title: 'Uyarı!',
                        text: 'Seçilen tarih bu oda için dolu. Lütfen başka bir tarih seçin.',
                        icon: 'warning',
                        confirmButtonText: 'Tamam'
                      });
                      return;
                    }
                    handleInputChange('checkOutDate', selectedDate);
                  }}
                  min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.checkOutDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.checkOutDate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.checkOutDate}</p>
                )}
              </div>
            </div>

            {/* Room Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Oda *
                </label>
                <button
                  type="button"
                  onClick={() => setShowRoomCards(!showRoomCards)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showRoomCards ? '📋 Liste Görünümü' : '🏠 Detaylı Görünüm'}
                </button>
              </div>

              {isLoadingRooms ? (
                <div className="text-sm text-gray-500">Müsait odalar yükleniyor...</div>
              ) : showRoomCards ? (
                // Modern Card Görünümü
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(availableRooms.length > 0 ? availableRooms : rooms).map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleInputChange('roomId', room.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.roomId == room.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg font-semibold text-gray-900">
                              Oda {room.roomNumber}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {room.roomType || room.type}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              👥 {room.capacity} kişi
                            </span>
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            {room.description && (
                              <p className="mb-1">{room.description}</p>
                            )}
                          </div>

                          {/* Oda Özellikleri */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {room.hasWiFi && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">📶 WiFi</span>
                            )}
                            {room.hasTV && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">📺 TV</span>
                            )}
                            {room.hasAirConditioning && (
                              <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded">❄️ Klima</span>
                            )}
                            {room.hasMinibar && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">🍷 Minibar</span>
                            )}
                            {room.hasBalcony && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">🏡 Balkon</span>
                            )}
                            {room.hasSeaView && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">🌊 Deniz Manzarası</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {room.pricePerNight} TL
                          </div>
                          <div className="text-xs text-gray-500">/ gece</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(availableRooms.length > 0 ? availableRooms : rooms).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Müsait oda bulunamadı</p>
                    </div>
                  )}
                </div>
              ) : (
                // Klasik Select Görünümü
                <select
                  value={formData.roomId}
                  onChange={(e) => handleInputChange('roomId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.roomId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Oda seçin</option>
                  {(availableRooms.length > 0 ? availableRooms : rooms).map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomNumber} - {room.roomType || room.type} - {room.capacity} kişi ({room.pricePerNight} TL/gece)
                    </option>
                  ))}
                </select>
              )}

              {formErrors.roomId && (
                <p className="text-red-500 text-xs mt-1">{formErrors.roomId}</p>
              )}
              {formData.checkInDate && formData.checkOutDate && availableRooms.length === 0 && !isLoadingRooms && (
                <p className="text-yellow-600 text-xs mt-1">
                  Seçilen tarihler için müsait oda bulunamadı
                </p>
              )}
              {formData.roomId && selectedRoomOccupiedDates.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-blue-700 text-xs font-medium mb-1">Bu oda için dolu tarihler:</p>
                  <div className="text-blue-600 text-xs">
                    {selectedRoomOccupiedDates.map((period, index) => {
                      const checkIn = new Date(period.checkInDate || period.CheckInDate);
                      const checkOut = new Date(period.checkOutDate || period.CheckOutDate);

                      // Geçersiz tarih kontrolü
                      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
                        return (
                          <div key={index}>
                            • Geçersiz tarih
                          </div>
                        );
                      }

                      return (
                        <div key={index}>
                          • {checkIn.toLocaleDateString('tr-TR')} - {checkOut.toLocaleDateString('tr-TR')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Number of Guests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Misafir Sayısı *
              </label>
              <input
                type="number"
                min="1"
                max={(() => {
                  const selectedRoom = availableRooms.find(room => room.id == formData.roomId) ||
                                      rooms.find(room => room.id == formData.roomId);
                  return selectedRoom ? selectedRoom.capacity : 10;
                })()}
                value={formData.numberOfGuests}
                onChange={(e) => handleInputChange('numberOfGuests', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.numberOfGuests ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.numberOfGuests && (
                <p className="text-red-500 text-xs mt-1">{formErrors.numberOfGuests}</p>
              )}
              {formData.roomId && (() => {
                const selectedRoom = availableRooms.find(room => room.id == formData.roomId) ||
                                    rooms.find(room => room.id == formData.roomId);
                return selectedRoom ? (
                  <p className="text-gray-500 text-xs mt-1">
                    Bu oda maksimum {selectedRoom.capacity} kişiliktir
                  </p>
                ) : null;
              })()}
            </div>

            {/* Status Selection (only for edit mode) */}
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rezervasyon Durumu
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Beklemede</option>
                  <option value={1}>Onaylandı</option>
                  <option value={2}>Giriş Yapıldı</option>
                  <option value={3}>Çıkış Yapıldı</option>
                  <option value={4}>İptal Edildi</option>
                  <option value={5}>Gelmedi</option>
                </select>
              </div>
            )}

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toplam Tutar (TL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.totalAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.totalAmount && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.totalAmount}</p>
                )}
                {formData.checkInDate && formData.checkOutDate && formData.roomId && (() => {
                  const selectedRoom = availableRooms.find(room => room.id == formData.roomId) ||
                                      rooms.find(room => room.id == formData.roomId);
                  if (selectedRoom) {
                    const checkIn = new Date(formData.checkInDate);
                    const checkOut = new Date(formData.checkOutDate);
                    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                    return (
                      <p className="text-gray-500 text-xs mt-1">
                        {nights} gece × {selectedRoom.pricePerNight} TL = {nights * selectedRoom.pricePerNight} TL
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ödenen Tutar (TL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paidAmount}
                  onChange={(e) => handleInputChange('paidAmount', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.paidAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.paidAmount && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.paidAmount}</p>
                )}
              </div>
            </div>

            {/* Customer Selection */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Müşteriler *
                  {formData.roomId && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({selectedCustomers.length}/{rooms.find(r => r.id == formData.roomId)?.capacity || availableRooms.find(r => r.id == formData.roomId)?.capacity || 0} kişi)
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(true)}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
                >
                  ➕ Yeni Müşteri
                </button>
              </div>

              {/* Selected Customers List */}
              {selectedCustomers.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between bg-blue-50 p-2 rounded-md">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                          {index === 0 ? 'Ana Müşteri' : `Misafir ${index}`}
                        </span>
                        <span className="font-medium text-blue-900">{customer.fullName}</span>
                        {customer.tcKimlikNo && (
                          <span className="text-xs text-blue-600">TC: {customer.tcKimlikNo}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomer(customer.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="Müşteriyi kaldır"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Müşteri eklemek için ara..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.customerId && (
                <p className="text-red-500 text-xs mt-1">{formErrors.customerId}</p>
              )}

              {/* Customer Dropdown */}
              {showCustomerDropdown && customers.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {customers
                    .filter(customer => !selectedCustomers.find(sc => sc.id === customer.id))
                    .map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="font-medium">{customer.fullName}</div>
                      <div className="text-sm text-gray-500">
                        {customer.tcKimlikNo && `TC: ${customer.tcKimlikNo}`}
                        {customer.phone && ` | Tel: ${customer.phone}`}
                      </div>
                    </div>
                  ))}
                  {customers.filter(customer => !selectedCustomers.find(sc => sc.id === customer.id)).length === 0 && (
                    <div className="px-4 py-2 text-gray-500 text-sm">
                      Tüm müşteriler zaten eklendi
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rezervasyon ile ilgili notlar..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Oluştur')}
              </button>
            </div>
          </form>
        </div>

        {/* Orijinal CustomerModal'ı Kullan */}
        <CustomerModal
          isOpen={showNewCustomerModal}
          onClose={() => setShowNewCustomerModal(false)}
          onCustomerCreated={handleCustomerCreated}
          isEdit={false}
        />
      </div>
    </div>
  );
};

export default ReservationModal;
