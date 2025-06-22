import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  checkInReservation, 
  checkOutReservation,
  fetchReservations 
} from '../store/slices/reservationSlice';

const CheckInOutModal = ({ 
  isOpen, 
  onClose, 
  reservation, 
  type = 'checkin' // 'checkin' or 'checkout'
}) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.reservations);
  
  const [formData, setFormData] = useState({
    actualDate: '',
    notes: '',
    additionalCharges: 0,
    paymentAmount: 0
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen && reservation) {
      const now = new Date();
      setFormData({
        actualDate: now.toISOString().slice(0, 16), // datetime-local format
        notes: '',
        additionalCharges: 0,
        paymentAmount: type === 'checkout' ? (reservation.totalAmount - reservation.paidAmount) : 0
      });
      setFormErrors({});
    }
  }, [isOpen, reservation, type]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.actualDate) {
      errors.actualDate = `${type === 'checkin' ? 'Giriş' : 'Çıkış'} tarihi zorunludur`;
    } else {
      const actualDate = new Date(formData.actualDate);
      const now = new Date();
      
      if (actualDate > now) {
        errors.actualDate = `${type === 'checkin' ? 'Giriş' : 'Çıkış'} tarihi gelecekte olamaz`;
      }

      if (type === 'checkin') {
        const checkInDate = new Date(reservation.checkInDate);
        if (actualDate < checkInDate.setHours(0, 0, 0, 0)) {
          errors.actualDate = 'Giriş tarihi rezervasyon başlangıç tarihinden önce olamaz';
        }
      } else {
        const checkOutDate = new Date(reservation.checkOutDate);
        if (actualDate > checkOutDate.setHours(23, 59, 59, 999)) {
          errors.actualDate = 'Çıkış tarihi rezervasyon bitiş tarihinden sonra olamaz';
        }
      }
    }

    if (formData.additionalCharges < 0) {
      errors.additionalCharges = 'Ek ücret negatif olamaz';
    }

    if (formData.paymentAmount < 0) {
      errors.paymentAmount = 'Ödeme tutarı negatif olamaz';
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
      const actionData = {
        id: reservation.id,
        [type === 'checkin' ? 'checkInData' : 'checkOutData']: {
          [type === 'checkin' ? 'actualCheckInDate' : 'actualCheckOutDate']: formData.actualDate,
          notes: formData.notes,
          additionalCharges: parseFloat(formData.additionalCharges) || 0,
          paymentAmount: parseFloat(formData.paymentAmount) || 0
        }
      };

      if (type === 'checkin') {
        await dispatch(checkInReservation(actionData)).unwrap();
      } else {
        await dispatch(checkOutReservation(actionData)).unwrap();
      }

      // Refresh reservations list
      dispatch(fetchReservations({}));
      onClose();
    } catch (error) {
      console.error(`Error during ${type}:`, error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !reservation) return null;

  const isCheckIn = type === 'checkin';
  const title = isCheckIn ? 'Check-in İşlemi' : 'Check-out İşlemi';
  const actionColor = isCheckIn ? 'green' : 'orange';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Reservation Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Rezervasyon Bilgileri</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>Müşteri:</strong> {reservation.customerName}</div>
              <div><strong>Oda:</strong> {reservation.roomNumber}</div>
              <div><strong>Misafir Sayısı:</strong> {reservation.numberOfGuests}</div>
              <div><strong>Rezervasyon Tarihleri:</strong> {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}</div>
              <div><strong>Toplam Tutar:</strong> {formatCurrency(reservation.totalAmount)}</div>
              <div><strong>Ödenen:</strong> {formatCurrency(reservation.paidAmount)}</div>
              <div><strong>Kalan:</strong> {formatCurrency(reservation.totalAmount - reservation.paidAmount)}</div>
            </div>
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
            {/* Actual Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isCheckIn ? 'Gerçek Giriş Tarihi' : 'Gerçek Çıkış Tarihi'} *
              </label>
              <input
                type="datetime-local"
                value={formData.actualDate}
                onChange={(e) => handleInputChange('actualDate', e.target.value)}
                max={new Date().toISOString().slice(0, 16)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${actionColor}-500 ${
                  formErrors.actualDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.actualDate && (
                <p className="text-red-500 text-xs mt-1">{formErrors.actualDate}</p>
              )}
            </div>

            {/* Additional Charges (for checkout) */}
            {!isCheckIn && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ek Ücretler (TL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.additionalCharges}
                  onChange={(e) => handleInputChange('additionalCharges', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${actionColor}-500 ${
                    formErrors.additionalCharges ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {formErrors.additionalCharges && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.additionalCharges}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Minibar, telefon, hasar vb. ek ücretler
                </p>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isCheckIn ? 'Ek Ödeme (TL)' : 'Tahsil Edilen Tutar (TL)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.paymentAmount}
                onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${actionColor}-500 ${
                  formErrors.paymentAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {formErrors.paymentAmount && (
                <p className="text-red-500 text-xs mt-1">{formErrors.paymentAmount}</p>
              )}
              {!isCheckIn && (
                <p className="text-xs text-gray-500 mt-1">
                  Kalan tutar: {formatCurrency(reservation.totalAmount - reservation.paidAmount + parseFloat(formData.additionalCharges || 0))}
                </p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={`${isCheckIn ? 'Check-in' : 'Check-out'} ile ilgili notlar...`}
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
                className={`px-4 py-2 bg-${actionColor}-600 text-white rounded-md hover:bg-${actionColor}-700 disabled:opacity-50`}
              >
                {loading ? 'İşleniyor...' : (isCheckIn ? 'Check-in Yap' : 'Check-out Yap')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckInOutModal;
