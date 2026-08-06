import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createReservation,
  updateReservation,
  fetchReservations
} from '../store/slices/reservationSlice';
import { customerService, roomService } from '../services/api';
import { format } from 'date-fns';
import { tr as trLocale } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import { FaCalendarAlt, FaSearch, FaPlus, FaTimes, FaUserPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import CustomerModal from './CustomerModal';
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";

registerLocale('tr', trLocale);

// ─── Sabit yapılandırma ──────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 0, label: 'Beklemede' },
  { value: 1, label: 'Onaylandı' },
  { value: 2, label: 'Giriş Yapıldı' },
  { value: 3, label: 'Çıkış Yapıldı' },
  { value: 4, label: 'İptal Edildi' },
  { value: 5, label: 'Gelmedi' },
];

// ─── Yardımcı: Boş oda satırı ────────────────────────────────────────────────
const emptyRoomItem = (roomId = '') => ({
  roomId,
  numberOfGuests: 1,
  totalAmount: 0,
  paidAmount: 0,
  customers: [],           // [{id, fullName, tcKimlikNo, phone}]
  customerSearch: '',
  customerResults: [],
  showDropdown: false,
  recentCustomers: [],
});

// ────────────────────────────────────────────────────────────────────────────
const ReservationModal = ({ isOpen, onClose, reservation = null, isEdit = false }) => {
  const dispatch = useDispatch();
  const { reservations: allReservations } = useSelector(state => state.reservations);
  const { loading, error, filters } = useSelector((state) => state.reservations);

  // ── Form state ──
  const [reservationName, setReservationName] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState(0);

  // ── Oda listesi (çoklu oda) ──
  const [roomItems, setRoomItems] = useState([emptyRoomItem()]);

  // ── Müsait odalar ──
  const [availableRooms, setAvailableRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // ── Oda seçim popupı ──
  const [showRoomSelector, setShowRoomSelector] = useState(null); // null | index
  const [occupiedDatesByRoom, setOccupiedDatesByRoom] = useState({});

  // ── Hatalar ──
  const [formErrors, setFormErrors] = useState({});

  // ── Yeni müşteri modal ──
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerTargetIndex, setNewCustomerTargetIndex] = useState(null);

  // ─── Body scroll kilitle ─────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // ─── Modal açılışında başlangıç verileri ─────────────────────────────────
  const prevDatesRef = React.useRef({ checkInDate: '', checkOutDate: '' });
  const isInitialMountRef = React.useRef(true);

  useEffect(() => {
    if (!isOpen) return;

    loadAllRooms();
    isInitialMountRef.current = true;

    if (isEdit && reservation) {
      // Düzenleme modu: mevcut veriyi yükle
      const inDate = reservation.checkInDate?.split('T')[0] || '';
      const outDate = reservation.checkOutDate?.split('T')[0] || '';

      setReservationName(reservation.reservationName || '');
      setCheckInDate(inDate);
      setCheckOutDate(outDate);
      setNotes(reservation.notes || '');
      setStatus(reservation.status ?? 0);

      prevDatesRef.current = { checkInDate: inDate, checkOutDate: outDate };

      const customers = reservation.customers?.length
        ? reservation.customers.map(c => ({
          id: c.customerId,
          fullName: c.customerName,
          tcKimlikNo: c.tcKimlikNo,
          phone: c.phone,
        }))
        : (reservation.customerId
          ? [{ id: reservation.customerId, fullName: reservation.customerName }]
          : []);

      setRoomItems([{
        ...emptyRoomItem(reservation.roomId),
        numberOfGuests: reservation.numberOfGuests || 1,
        totalAmount: reservation.totalAmount || 0,
        paidAmount: reservation.paidAmount || 0,
        customers,
      }]);
    } else {
      // Yeni rezervasyon: temizle
      setReservationName('');
      setCheckInDate('');
      setCheckOutDate('');
      setNotes('');
      setStatus(0);
      setRoomItems([emptyRoomItem()]);
      setAvailableRooms([]);
      setFormErrors({});
      setOccupiedDatesByRoom({});
      prevDatesRef.current = { checkInDate: '', checkOutDate: '' };
    }
  }, [isOpen, isEdit, reservation]);

  // ─── Tarihler değişince müsait odaları yükle + fiyat güncelleme ──────────
  useEffect(() => {
    if (!checkInDate || !checkOutDate) return;
    if (new Date(checkOutDate) <= new Date(checkInDate)) return;

    // İlk yüklemede popup sorma, sadece referansı güncelle
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevDatesRef.current = { checkInDate, checkOutDate };
      loadAvailableRooms();
      return;
    }

    const prevIn = prevDatesRef.current.checkInDate;
    const prevOut = prevDatesRef.current.checkOutDate;
    prevDatesRef.current = { checkInDate, checkOutDate };

    const datesActuallyChanged = prevIn && prevOut && (prevIn !== checkInDate || prevOut !== checkOutDate);
    const newNights = Math.max(0, Math.ceil(
      (new Date(checkOutDate) - new Date(checkInDate)) / 86400000
    ));

    // SADECE DÜZENLEME MODUNDA (isEdit === true) VE KULLANICI TARİHLERİ DEĞİŞTİRDİĞİNDE ONAY SOR
    if (isEdit && datesActuallyChanged) {
      const hasRoomsWithPrices = roomItems.some(
        item => item.roomId && parseFloat(item.totalAmount) > 0
      );

      if (hasRoomsWithPrices) {
        loadAvailableRooms().then(freshRooms => {
          const roomSource = (freshRooms && freshRooms.length > 0) ? freshRooms : allRooms;

          Swal.fire({
            title: 'Tarihler Değişti',
            html: `Yeni süre: <strong>${newNights} gece</strong>.<br>Oda fiyat${roomItems.length > 1 ? 'ları' : 'ı'} yeni tarihe göre güncellensin mi?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Evet, Güncelle',
            cancelButtonText: 'Hayır, Mevcut Kalsın',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
          }).then(result => {
            if (result.isConfirmed) {
              setRoomItems(prev => prev.map(item => {
                if (!item.roomId) return item;
                const room = roomSource.find(r => r.id == item.roomId);
                if (!room) return item;
                return { ...item, totalAmount: newNights * room.pricePerNight };
              }));
            }
          });
        });
        return;
      }
    }

    // YENİ REZERVASYON OLUŞTURURKEN (isEdit === false): ODA FİYATLARINI OTOMATİK HESAPLA VE UYGULA (POPUP SORMADAN)
    loadAvailableRooms().then(freshRooms => {
      const roomSource = (freshRooms && freshRooms.length > 0) ? freshRooms : allRooms;
      setRoomItems(prev => prev.map(item => {
        if (!item.roomId) return item;
        const room = roomSource.find(r => r.id == item.roomId);
        if (!room) return item;
        return { ...item, totalAmount: newNights * room.pricePerNight };
      }));
    });
  }, [checkInDate, checkOutDate, isEdit]);

  // ─── API çağrıları ────────────────────────────────────────────────────────
  const loadAllRooms = async () => {
    try {
      const res = await roomService.getAll(true);
      setAllRooms(res.data);
    } catch (e) {
      console.error('Odalar yüklenirken hata:', e);
    }
  };

  const loadAvailableRooms = async () => {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkOut <= checkIn) { setAvailableRooms([]); return []; }

    setIsLoadingRooms(true);
    try {
      const res = await roomService.getAvailability(
        checkInDate, checkOutDate,
        isEdit ? reservation?.id : null
      );
      setAvailableRooms(res.data);
      return res.data; // fiyat onayı için yeni listeyi döndür
    } catch (e) {
      console.error('Müsait odalar yüklenirken hata:', e);
      setAvailableRooms([]);
      return [];
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const loadRecentCustomersForIndex = async (index) => {
    try {
      const res = await customerService.getRecent(8);
      setRoomItems(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], recentCustomers: res.data };
        return updated;
      });
    } catch (e) {
      console.error('Son müşteriler yüklenirken hata:', e);
    }
  };

  const searchCustomersForIndex = async (index, query) => {
    if (query.length < 2) {
      setRoomItems(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], customerResults: [] };
        return updated;
      });
      return;
    }
    try {
      const res = await customerService.search(query);
      let data = [];
      if (res.data?.data && Array.isArray(res.data.data)) data = res.data.data;
      else if (Array.isArray(res.data)) data = res.data;

      setRoomItems(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], customerResults: data };
        return updated;
      });
    } catch (e) {
      console.error('Müşteri arama hatası:', e);
    }
  };

  // ─── Oda işlemleri ────────────────────────────────────────────────────────
  const handleAddRoomItem = () => {
    setRoomItems(prev => [...prev, emptyRoomItem()]);
  };

  const handleRemoveRoomItem = (index) => {
    if (roomItems.length === 1) return;
    setRoomItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleRoomSelect = async (index, roomId) => {
    const currentItem = roomItems[index];
    const room = (availableRooms.length > 0 ? availableRooms : allRooms)
      .find(r => r.id == roomId);
    const nights = checkInDate && checkOutDate
      ? Math.max(0, Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / 86400000))
      : 0;
    const autoTotal = room ? nights * room.pricePerNight : 0;

    let targetTotalAmount = autoTotal;

    const hasExistingPrice = parseFloat(currentItem.totalAmount) > 0;
    const isRoomChanging = currentItem.roomId && currentItem.roomId != roomId;

    // SADECE DÜZENLEME MODUNDA (isEdit === true) VE ODA VEYA FİYAT DEĞİŞİMİNDE ONAY SOR
    if (isEdit && (hasExistingPrice || isRoomChanging) && autoTotal !== parseFloat(currentItem.totalAmount)) {
      setShowRoomSelector(null);
      const result = await Swal.fire({
        title: 'Oda Seçimi Değişti',
        html: `Seçilen <strong>Oda ${room?.roomNumber || ''}</strong> için tarife: <strong>${autoTotal.toLocaleString('tr-TR')} TL</strong> (${nights} gece x ${room?.pricePerNight || 0} TL).<br><br>Toplam tutar yeni oda tarifesine göre güncellensin mi?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Evet, Güncelle',
        cancelButtonText: `Hayır, Mevcut Fiyat Kalsın (${currentItem.totalAmount} TL)`,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
      });

      if (!result.isConfirmed) {
        targetTotalAmount = currentItem.totalAmount;
      }
    }

    setRoomItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        roomId,
        totalAmount: targetTotalAmount,
      };
      return updated;
    });
    setShowRoomSelector(null);

    // Oda için dolu tarihleri yükle
    if (roomId) {
      try {
        const res = await roomService.getOccupiedDates(
          roomId, null, null,
          isEdit ? reservation?.id : null
        );
        setOccupiedDatesByRoom(prev => ({
          ...prev,
          [roomId]: res.data.occupiedPeriods || []
        }));
      } catch (e) { }
    }
  };

  const getRoomMonthReservations = (roomId, targetDateStr) => {
    if (!roomId || !allReservations || allReservations.length === 0) return [];
    const baseDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const targetMonth = baseDate.getMonth();
    const targetYear = baseDate.getFullYear();

    return allReservations.filter(r => {
      if (r.roomId != roomId) return false;
      if (isEdit && reservation && r.id === reservation.id) return false;
      if (r.status === 4 || r.status === 5) return false;

      const cin = new Date(r.checkInDate);
      const cout = new Date(r.checkOutDate);
      return (cin.getMonth() === targetMonth && cin.getFullYear() === targetYear) ||
             (cout.getMonth() === targetMonth && cout.getFullYear() === targetYear);
    });
  };

  const updateRoomField = (index, field, value) => {
    setRoomItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Hata temizle
    if (formErrors[`room_${index}_${field}`]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[`room_${index}_${field}`];
        return copy;
      });
    }
  };

  // ─── Müşteri işlemleri ───────────────────────────────────────────────────
  const handleCustomerSearch = (index, value) => {
    updateRoomField(index, 'customerSearch', value);
    updateRoomField(index, 'showDropdown', true);
    searchCustomersForIndex(index, value);
  };

  const handleCustomerSelect = (index, customer) => {
    setRoomItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      // Aynı müşteriyi ekleme
      if (item.customers.find(c => c.id === customer.id)) {
        Swal.fire({ title: 'Uyarı', text: 'Bu müşteri zaten eklenmiş.', icon: 'warning', timer: 1500, showConfirmButton: false });
        return prev;
      }
      item.customers = [...item.customers, customer];
      item.numberOfGuests = item.customers.length;
      item.customerSearch = '';
      item.customerResults = [];
      item.showDropdown = false;
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveCustomer = (roomIndex, customerId) => {
    setRoomItems(prev => {
      const updated = [...prev];
      const item = { ...updated[roomIndex] };
      item.customers = item.customers.filter(c => c.id !== customerId);
      item.numberOfGuests = Math.max(1, item.customers.length);
      updated[roomIndex] = item;
      return updated;
    });
  };

  // Yeni müşteri oluşturulunca otomatik ekle
  const handleCustomerCreated = (newCustomer) => {
    const customer = {
      id: newCustomer.id,
      fullName: `${newCustomer.firstName} ${newCustomer.lastName}`,
      tcKimlikNo: newCustomer.tcKimlikNo,
      phone: newCustomer.phone,
    };
    if (newCustomerTargetIndex !== null) {
      handleCustomerSelect(newCustomerTargetIndex, customer);
    }
    setShowNewCustomerModal(false);
    setNewCustomerTargetIndex(null);
    Swal.fire({ title: 'Başarılı!', text: 'Yeni müşteri kaydedildi ve eklendi.', icon: 'success', timer: 2000, showConfirmButton: false });
  };

  // ─── Validation ──────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};

    if (!checkInDate) errors.checkInDate = 'Giriş tarihi zorunludur';
    if (!checkOutDate) errors.checkOutDate = 'Çıkış tarihi zorunludur';
    if (checkInDate && checkOutDate && new Date(checkInDate) >= new Date(checkOutDate)) {
      errors.checkOutDate = 'Çıkış tarihi giriş tarihinden sonra olmalıdır';
    }

    const isMultiRoom = roomItems.length > 1;
    const allHaveCustomers = roomItems.every(item => item.customers.length > 0);
    const anyHasCustomer = roomItems.some(item => item.customers.length > 0);

    // Rezervasyon adı zorunluluk kontrolü
    if (!reservationName.trim()) {
      // Müşteri yoksa VEYA çoklu oda + herhangi birinde müşteri yoksa zorunlu
      if (!anyHasCustomer) {
        errors.reservationName = 'Müşteri seçilmemişse Rezervasyon Adı zorunludur';
      } else if (isMultiRoom && !allHaveCustomers) {
        errors.reservationName = 'Tüm odalarda müşteri seçilmediyse Rezervasyon Adı zorunludur';
      }
    }

    // Oda seçimi
    roomItems.forEach((item, i) => {
      if (!item.roomId) {
        errors[`room_${i}_roomId`] = 'Oda seçimi zorunludur';
      }
      if (item.numberOfGuests < 1) {
        errors[`room_${i}_numberOfGuests`] = 'Misafir sayısı en az 1 olmalıdır';
      }
      if (item.totalAmount < 0) {
        errors[`room_${i}_totalAmount`] = 'Toplam tutar 0\'dan küçük olamaz';
      }
      if (item.paidAmount < 0) {
        errors[`room_${i}_paidAmount`] = 'Ödenen tutar 0\'dan küçük olamaz';
      }
      if (parseFloat(item.paidAmount) > parseFloat(item.totalAmount)) {
        errors[`room_${i}_paidAmount`] = 'Ödenen tutar toplam tutardan fazla olamaz';
      }
      // Çoklu oda + rezervasyon adı yok → her odada müşteri zorunlu
      if (isMultiRoom && !reservationName.trim() && item.customers.length === 0) {
        errors[`room_${i}_customers`] = 'Rezervasyon adı yoksa her odada müşteri seçimi zorunludur';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const isMultiRoom = roomItems.length > 1;
      const groupId = reservation?.reservationGroupId || (isMultiRoom ? crypto.randomUUID() : undefined);

      if (isMultiRoom && !isEdit) {
        // Çoklu oda → backend'e tek POST ile gönder
        const payload = {
          reservationName: reservationName.trim() || null,
          reservationGroupId: groupId,
          checkInDate: new Date(checkInDate).toISOString(),
          checkOutDate: new Date(checkOutDate).toISOString(),
          notes: notes || null,
          roomItems: roomItems.map(item => ({
            roomId: parseInt(item.roomId),
            numberOfGuests: parseInt(item.numberOfGuests),
            totalAmount: parseFloat(item.totalAmount),
            paidAmount: parseFloat(item.paidAmount),
            customerIds: item.customers.map(c => c.id),
          })),
        };
        await dispatch(createReservation(payload)).unwrap();
      } else {
        // Tekil oda (yeni veya düzenleme)
        const item = roomItems[0];
        const payload = {
          reservationName: reservationName.trim() || null,
          reservationGroupId: groupId || null,
          customerId: item.customers[0]?.id || null,
          roomId: parseInt(item.roomId),
          checkInDate: new Date(checkInDate).toISOString(),
          checkOutDate: new Date(checkOutDate).toISOString(),
          numberOfGuests: parseInt(item.numberOfGuests),
          totalAmount: parseFloat(item.totalAmount),
          paidAmount: parseFloat(item.paidAmount),
          notes: notes || null,
          customerIds: item.customers.map(c => c.id),
          status: isEdit ? status : 0,
        };
        if (isEdit) {
          await dispatch(updateReservation({ id: reservation.id, reservationData: payload })).unwrap();
        } else {
          await dispatch(createReservation(payload)).unwrap();
        }
      }

      await Swal.fire({
        title: 'Başarılı!',
        text: `Rezervasyon başarıyla ${isEdit ? 'güncellendi' : 'oluşturuldu'}.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      dispatch(fetchReservations({ ...filters }));
      onClose();
    } catch (err) {
      console.error('Rezervasyon kaydetme hatası:', err);
      let msg = `Rezervasyon ${isEdit ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu.`;
      if (typeof err === 'string') msg = err;
      else if (err?.message) msg = err.message;
      await Swal.fire({ title: 'Hata!', text: msg, icon: 'error', confirmButtonText: 'Tamam' });
    }
  };

  // ─── Odaların gösterim listesi ────────────────────────────────────────────
  const displayRooms = checkInDate && checkOutDate && availableRooms.length > 0
    ? availableRooms
    : allRooms;

  // Seçili oda ID'leri (aynı oda iki kez seçilmesin)
  const selectedRoomIds = roomItems.map(i => parseInt(i.roomId)).filter(Boolean);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-60 overflow-y-auto h-full w-full z-50 px-2 sm:px-4 py-4">
      <div className="relative mx-auto p-4 sm:p-6 border w-full max-w-3xl shadow-2xl rounded-xl bg-white">

        {/* ─── Başlık ─── */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            {isEdit ? '✏️ Rezervasyon Düzenle' : '🏨 Yeni Rezervasyon'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ─── Hata mesajı ─── */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ─── 1. Rezervasyon Adı ─── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Rezervasyon Adı
              <span className="ml-1 text-xs font-normal text-gray-400">(opsiyonel — müşteri yoksa zorunludur)</span>
            </label>
            <input
              type="text"
              value={reservationName}
              onChange={e => { setReservationName(e.target.value); setFormErrors(prev => ({ ...prev, reservationName: '' })); }}
              placeholder="Örn: Burak'ın arkadaşı, Ahmet'in kuzeni"
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formErrors.reservationName ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
            />
            {formErrors.reservationName && (
              <p className="text-red-500 text-xs mt-1">⚠️ {formErrors.reservationName}</p>
            )}
          </div>

          {/* ─── 2. Tarih Seçimi ─── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Giriş Tarihi *</label>
              <div style={{ position: 'relative' }}>
                <DatePicker
                  selected={checkInDate ? new Date(checkInDate) : null}
                  onChange={date => {
                    if (date) { setCheckInDate(format(date, 'yyyy-MM-dd')); setFormErrors(prev => ({ ...prev, checkInDate: '' })); }
                  }}
                  dateFormat="dd/MM/yyyy"
                  locale="tr"
                  minDate={new Date()}
                  placeholderText="GG/AA/YYYY"
                  className="w-full !pl-3 !pr-8 py-2.5 !border !rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  wrapperClassName={formErrors.checkInDate ? 'date-picker-error' : 'date-picker-normal'}
                />
                <FaCalendarAlt style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} size={14} />
              </div>
              {formErrors.checkInDate && <p className="text-red-500 text-xs mt-1">⚠️ {formErrors.checkInDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Çıkış Tarihi *</label>
              <div style={{ position: 'relative' }}>
                <DatePicker
                  selected={checkOutDate ? new Date(checkOutDate) : null}
                  onChange={date => {
                    if (date) { setCheckOutDate(format(date, 'yyyy-MM-dd')); setFormErrors(prev => ({ ...prev, checkOutDate: '' })); }
                  }}
                  dateFormat="dd/MM/yyyy"
                  locale="tr"
                  minDate={checkInDate ? new Date(checkInDate) : new Date()}
                  placeholderText="GG/AA/YYYY"
                  className="w-full !pl-3 !pr-8 py-2.5 !border !rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  wrapperClassName={formErrors.checkOutDate ? 'date-picker-error' : 'date-picker-normal'}
                />
                <FaCalendarAlt style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} size={14} />
              </div>
              {formErrors.checkOutDate && <p className="text-red-500 text-xs mt-1">⚠️ {formErrors.checkOutDate}</p>}
            </div>
          </div>

          {/* ─── 3. Oda Listesi (çoklu) ─── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                🛏️ Odalar
                {isLoadingRooms && <span className="ml-2 text-xs text-blue-500 animate-pulse">Müsait odalar yükleniyor...</span>}
                {checkInDate && checkOutDate && !isLoadingRooms && availableRooms.length > 0 && (
                  <span className="ml-2 text-xs text-green-600">({availableRooms.length} müsait oda)</span>
                )}
              </h4>
              {!isEdit && (
                <button
                  type="button"
                  onClick={handleAddRoomItem}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus size={10} /> Oda Ekle
                </button>
              )}
            </div>

            <div className="space-y-4">
              {roomItems.map((item, index) => {
                const selectedRoom = displayRooms.find(r => r.id == item.roomId);
                const nights = checkInDate && checkOutDate
                  ? Math.max(0, Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / 86400000))
                  : 0;

                return (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50 relative">
                    {/* Oda başlığı */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-700">
                        {roomItems.length > 1 ? `Oda ${index + 1}` : 'Oda Bilgileri'}
                      </span>
                      {roomItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRoomItem(index)}
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                        >
                          <FaTimes size={14} />
                        </button>
                      )}
                    </div>

                    {/* Oda Seçimi */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Oda Seçimi *</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRoomSelector(showRoomSelector === index ? null : index);
                          }}
                          className={`w-full px-3 py-2.5 border rounded-lg text-left text-sm flex items-center justify-between transition ${formErrors[`room_${index}_roomId`]
                              ? 'border-red-400 bg-red-50'
                              : selectedRoom
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-300 bg-white hover:border-gray-400'
                            }`}
                        >
                          <span>
                            {selectedRoom
                              ? `🛏️ Oda ${selectedRoom.roomNumber} — ${selectedRoom.roomType || 'Standart'} (${selectedRoom.capacity} kişi) — ${selectedRoom.pricePerNight} TL/gece`
                              : 'Oda seçin...'
                            }
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Oda Seçim Dropdown */}
                        {showRoomSelector === index && (
                          <div className="absolute z-20 w-full top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                            {displayRooms.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                {checkInDate && checkOutDate ? 'Seçilen tarihler için müsait oda yok' : 'Önce tarih seçin'}
                              </div>
                            ) : (
                              displayRooms.map(room => {
                                const isAlreadySelected = selectedRoomIds.includes(room.id) && room.id != item.roomId;
                                const autoTotal = nights * room.pricePerNight;
                                return (
                                  <div
                                    key={room.id}
                                    onClick={() => !isAlreadySelected && handleRoomSelect(index, room.id)}
                                    className={`p-3 border-b border-gray-100 last:border-0 transition ${isAlreadySelected
                                        ? 'opacity-40 cursor-not-allowed bg-gray-50'
                                        : room.id == item.roomId
                                          ? 'bg-blue-50 cursor-pointer'
                                          : 'hover:bg-blue-50 cursor-pointer'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-gray-900 text-sm">Oda {room.roomNumber}</span>
                                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{room.roomType || 'Standart'}</span>
                                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">👥 {room.capacity}</span>
                                          {isAlreadySelected && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">Seçili</span>}
                                        </div>
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                          {room.hasWiFi && <span className="text-xs text-blue-600">📶</span>}
                                          {room.hasTV && <span className="text-xs text-purple-600">📺</span>}
                                          {room.hasAirConditioning && <span className="text-xs text-cyan-600">❄️</span>}
                                          {room.hasBalcony && <span className="text-xs text-green-600">🏡</span>}
                                          {room.hasMinibar && <span className="text-xs text-orange-600">🍷</span>}
                                          {room.hasSeaView && <span className="text-xs text-blue-600">🌊</span>}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-green-600 text-sm">{room.pricePerNight} TL/gece</div>
                                        {nights > 0 && <div className="text-xs text-gray-500">{nights}g = {autoTotal.toLocaleString('tr-TR')} TL</div>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                      {formErrors[`room_${index}_roomId`] && (
                        <p className="text-red-500 text-xs mt-1">⚠️ {formErrors[`room_${index}_roomId`]}</p>
                      )}

                      {/* Seçili Odanın Ay İçi Mevcut Rezervasyonları Bilgilendirmesi */}
                      {selectedRoom && (
                        <div className="mt-2.5 p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs space-y-1.5">
                          <div className="font-semibold text-blue-950 flex items-center justify-between">
                            <span>📌 Oda {selectedRoom.roomNumber} — {new Date(checkInDate || Date.now()).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} Ayı Mevcut Rezervasyonları:</span>
                            <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                              {getRoomMonthReservations(selectedRoom.id, checkInDate).length} Kayıt
                            </span>
                          </div>
                          {getRoomMonthReservations(selectedRoom.id, checkInDate).length > 0 ? (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {getRoomMonthReservations(selectedRoom.id, checkInDate).map(res => (
                                <div key={res.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                                  <div>
                                    <div className="font-bold text-gray-900">
                                      📋 {res.reservationName || res.customerName || 'Rezervasyon'}
                                    </div>
                                    <div className="text-[11px] text-gray-600">
                                      📅 {new Date(res.checkInDate).toLocaleDateString('tr-TR')} → {new Date(res.checkOutDate).toLocaleDateString('tr-TR')}
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                                    res.status === 2 ? 'bg-green-100 text-green-800' :
                                    res.status === 1 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {res.status === 2 ? 'Giriş Yapıldı' : res.status === 1 ? 'Onaylandı' : 'Beklemede'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">Bu oda için seçilen ayda aktif başka rezervasyon bulunmuyor.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Misafir & Tutar */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Misafir Sayısı *</label>
                        <input
                          type="number" min="1" max="10"
                          value={item.numberOfGuests}
                          onChange={e => updateRoomField(index, 'numberOfGuests', e.target.value)}
                          className={`w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors[`room_${index}_numberOfGuests`] ? 'border-red-400' : 'border-gray-300'
                            }`}
                        />
                        {formErrors[`room_${index}_numberOfGuests`] && (
                          <p className="text-red-500 text-xs mt-0.5">{formErrors[`room_${index}_numberOfGuests`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Toplam Tutar (TL) *</label>
                        <input
                          type="number" step="0.01" min="0"
                          value={item.totalAmount}
                          onChange={e => updateRoomField(index, 'totalAmount', e.target.value)}
                          className={`w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors[`room_${index}_totalAmount`] ? 'border-red-400' : 'border-gray-300'
                            }`}
                        />
                        {nights > 0 && selectedRoom && (
                          <p className="text-gray-400 text-xs mt-0.5">{nights}g × {selectedRoom.pricePerNight} TL</p>
                        )}
                        {formErrors[`room_${index}_totalAmount`] && (
                          <p className="text-red-500 text-xs mt-0.5">{formErrors[`room_${index}_totalAmount`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ödenen Tutar (TL)</label>
                        <input
                          type="number" step="0.01" min="0"
                          value={item.paidAmount}
                          onChange={e => updateRoomField(index, 'paidAmount', e.target.value)}
                          className={`w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors[`room_${index}_paidAmount`] ? 'border-red-400' : 'border-gray-300'
                            }`}
                        />
                        {formErrors[`room_${index}_paidAmount`] && (
                          <p className="text-red-500 text-xs mt-0.5">{formErrors[`room_${index}_paidAmount`]}</p>
                        )}
                      </div>
                    </div>

                    {/* ── Müşteriler ── */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-600">
                          👥 Müşteriler
                          {item.customers.length > 0 && (
                            <span className="ml-1 text-blue-600">({item.customers.length} kişi)</span>
                          )}
                        </label>
                        <button
                          type="button"
                          onClick={() => { setNewCustomerTargetIndex(index); setShowNewCustomerModal(true); }}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                        >
                          <FaUserPlus size={10} /> Yeni Müşteri
                        </button>
                      </div>

                      {/* Seçili müşteriler tablosu */}
                      {item.customers.length > 0 && (
                        <div className="mb-2 border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left px-2 py-1.5 text-gray-600 font-medium">Ad Soyad</th>
                                <th className="text-left px-2 py-1.5 text-gray-600 font-medium hidden sm:table-cell">TC / Tel</th>
                                <th className="text-left px-2 py-1.5 text-gray-600 font-medium">Rol</th>
                                <th className="px-2 py-1.5 w-8"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.customers.map((customer, ci) => (
                                <tr key={customer.id} className="border-t border-gray-100 hover:bg-gray-50">
                                  <td className="px-2 py-1.5 font-medium text-gray-900">{customer.fullName}</td>
                                  <td className="px-2 py-1.5 text-gray-500 hidden sm:table-cell">
                                    {customer.tcKimlikNo && <span>TC: {customer.tcKimlikNo}</span>}
                                    {customer.phone && <span className="ml-1">| {customer.phone}</span>}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${ci === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                      {ci === 0 ? 'Ana' : `Misafir ${ci}`}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomer(index, customer.id)}
                                      className="text-red-400 hover:text-red-600 transition"
                                    >
                                      <FaTimes size={12} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {formErrors[`room_${index}_customers`] && (
                        <p className="text-red-500 text-xs mb-2">⚠️ {formErrors[`room_${index}_customers`]}</p>
                      )}

                      {/* Müşteri Arama */}
                      <div className="relative">
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                          <input
                            type="text"
                            value={item.customerSearch}
                            onChange={e => handleCustomerSearch(index, e.target.value)}
                            onFocus={() => {
                              updateRoomField(index, 'showDropdown', true);
                              if (item.recentCustomers.length === 0) loadRecentCustomersForIndex(index);
                            }}
                            onBlur={() => setTimeout(() => updateRoomField(index, 'showDropdown', false), 150)}
                            placeholder="Müşteri adı, TC veya not ile arayın..."
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Arama dropdown */}
                        {item.showDropdown && (
                          <div className="absolute z-10 w-full top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                            {/* Arama sonuçları */}
                            {item.customerSearch.length >= 2 && item.customerResults.length > 0 && (
                              <>
                                <div className="px-3 py-1.5 bg-gray-50 text-xs font-medium text-gray-500 border-b">Arama Sonuçları</div>
                                {item.customerResults
                                  .filter(c => !item.customers.find(sc => sc.id === c.id))
                                  .map(c => (
                                    <div
                                      key={c.id}
                                      onMouseDown={() => handleCustomerSelect(index, c)}
                                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition"
                                    >
                                      <div className="font-medium text-sm text-gray-900">{c.fullName}</div>
                                      <div className="text-xs text-gray-500">
                                        {c.tcKimlikNo && `TC: ${c.tcKimlikNo}`}
                                        {c.phone && ` | ${c.phone}`}
                                      </div>
                                    </div>
                                  ))
                                }
                                {item.customerResults.filter(c => !item.customers.find(sc => sc.id === c.id)).length === 0 && (
                                  <div className="px-3 py-2 text-sm text-gray-500 text-center">Tüm sonuçlar zaten eklendi</div>
                                )}
                              </>
                            )}
                            {item.customerSearch.length >= 2 && item.customerResults.length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500 text-center">"{item.customerSearch}" için sonuç bulunamadı</div>
                            )}
                            {/* Son eklenen müşteriler */}
                            {item.customerSearch.length < 2 && item.recentCustomers.length > 0 && (
                              <>
                                <div className="px-3 py-1.5 bg-gray-50 text-xs font-medium text-gray-500 border-b">Son Eklenen Müşteriler</div>
                                {item.recentCustomers
                                  .filter(c => !item.customers.find(sc => sc.id === c.id))
                                  .map(c => (
                                    <div
                                      key={c.id}
                                      onMouseDown={() => handleCustomerSelect(index, c)}
                                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition"
                                    >
                                      <div className="font-medium text-sm text-gray-900">{c.fullName}</div>
                                      <div className="text-xs text-gray-500">
                                        {c.tcKimlikNo && `TC: ${c.tcKimlikNo}`}
                                        {c.phone && ` | ${c.phone}`}
                                      </div>
                                    </div>
                                  ))
                                }
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── 4. Durum (sadece düzenleme) ─── */}
          {isEdit && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rezervasyon Durumu</label>
              <select
                value={status}
                onChange={e => setStatus(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* ─── 5. Notlar ─── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">📝 Notlar</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rezervasyon ile ilgili notlar..."
            />
          </div>

          {/* ─── Butonlar ─── */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition flex items-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin">⟳</span> Kaydediliyor...</>
              ) : (
                isEdit ? '✅ Güncelle' : '✅ Oluştur'
              )}
            </button>
          </div>

        </form>
      </div>

      {/* Yeni Müşteri Modal */}
      <CustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => { setShowNewCustomerModal(false); setNewCustomerTargetIndex(null); }}
        onCustomerCreated={handleCustomerCreated}
        isEdit={false}
      />
    </div>
  );
};

export default ReservationModal;
