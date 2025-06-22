import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createReservation, 
  updateReservation, 
  fetchReservations 
} from '../store/slices/reservationSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { customerService, roomService } from '../services/api';

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
    notes: ''
  });

  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

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
        notes: reservation.notes || ''
      });
      setSelectedCustomer({
        id: reservation.customerId,
        fullName: reservation.customerName
      });
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
        notes: ''
      });
      setSelectedCustomer(null);
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
    
    setIsLoadingRooms(true);
    try {
      const response = await roomService.getAvailability(
        formData.checkInDate, 
        formData.checkOutDate
      );
      setAvailableRooms(response.data);
    } catch (error) {
      console.error('Error loading available rooms:', error);
      setAvailableRooms([]);
    } finally {
      setIsLoadingRooms(false);
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
    setSelectedCustomer(customer);
    setFormData(prev => ({ ...prev, customerId: customer.id }));
    setCustomerSearch(customer.fullName);
    setShowCustomerDropdown(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerId) {
      errors.customerId = 'Müşteri seçimi zorunludur';
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

    if (formData.numberOfGuests < 1 || formData.numberOfGuests > 10) {
      errors.numberOfGuests = 'Misafir sayısı 1-10 arasında olmalıdır';
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
        paidAmount: parseFloat(formData.paidAmount)
      };

      if (isEdit) {
        await dispatch(updateReservation({ 
          id: reservation.id, 
          reservationData 
        })).unwrap();
      } else {
        await dispatch(createReservation(reservationData)).unwrap();
      }

      // Refresh reservations list
      dispatch(fetchReservations({}));
      onClose();
    } catch (error) {
      console.error('Error saving reservation:', error);
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
            {/* Customer Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Müşteri *
              </label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Müşteri adı, TC kimlik veya telefon ile ara..."
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
                  {customers.map((customer) => (
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
                </div>
              )}
              
              {selectedCustomer && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <span className="text-sm text-blue-700">
                    Seçili: {selectedCustomer.fullName}
                  </span>
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giriş Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.checkInDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.checkInDate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.checkInDate}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Çıkış Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Oda *
              </label>
              {isLoadingRooms ? (
                <div className="text-sm text-gray-500">Müsait odalar yükleniyor...</div>
              ) : (
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
                      {room.roomNumber} - {room.roomType} ({room.pricePerNight} TL/gece)
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
            </div>

            {/* Number of Guests and Amounts */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Misafir Sayısı *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.numberOfGuests}
                  onChange={(e) => handleInputChange('numberOfGuests', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.numberOfGuests ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.numberOfGuests && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.numberOfGuests}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toplam Tutar (TL)
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
      </div>
    </div>
  );
};

export default ReservationModal;
