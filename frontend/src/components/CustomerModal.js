import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCustomer, fetchCustomers } from '../store/slices/customerSlice';
import { customerService } from '../services/api';

const CustomerModal = ({ isOpen, onClose, customer = null, isEdit = false }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.customers);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    tcKimlikNo: '',
    passportNo: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: 'Türkiye',
    dateOfBirth: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        tcKimlikNo: customer.tcKimlikNo || '',
        passportNo: customer.passportNo || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || 'Türkiye',
        dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : ''
      });
    } else {
      // Reset form for new customer
      setFormData({
        firstName: '',
        lastName: '',
        tcKimlikNo: '',
        passportNo: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        country: 'Türkiye',
        dateOfBirth: ''
      });
    }
    setFormErrors({});
  }, [isEdit, customer, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // TC Kimlik No validation
  const validateTCKimlik = (tcKimlik) => {
    if (!tcKimlik) return true; // Optional field
    
    // Remove any non-digit characters
    const tc = tcKimlik.replace(/\D/g, '');
    
    // Must be exactly 11 digits
    if (tc.length !== 11) return false;
    
    // First digit cannot be 0
    if (tc[0] === '0') return false;
    
    // TC Kimlik algorithm check
    const digits = tc.split('').map(Number);
    const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
    const check1 = (sum1 * 7 - sum2) % 10;
    const check2 = (sum1 + sum2 + digits[9]) % 10;
    
    return check1 === digits[9] && check2 === digits[10];
  };

  const validateForm = () => {
    const errors = {};

    // Required fields
    if (!formData.firstName.trim()) {
      errors.firstName = 'Ad alanı zorunludur';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Soyad alanı zorunludur';
    }

    // At least one identification required
    if (!formData.tcKimlikNo && !formData.passportNo) {
      errors.identification = 'TC Kimlik No veya Pasaport No\'dan en az biri zorunludur';
    }

    // TC Kimlik validation
    if (formData.tcKimlikNo && !validateTCKimlik(formData.tcKimlikNo)) {
      errors.tcKimlikNo = 'Geçerli bir TC Kimlik No giriniz';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    // Phone validation (basic)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Geçerli bir telefon numarası giriniz';
    }

    // Date validation
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (birthDate > today) {
        errors.dateOfBirth = 'Doğum tarihi gelecekte olamaz';
      } else if (age > 120) {
        errors.dateOfBirth = 'Geçerli bir doğum tarihi giriniz';
      }
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
      const customerData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null
      };

      if (isEdit) {
        await customerService.update(customer.id, customerData);
      } else {
        await dispatch(createCustomer(customerData)).unwrap();
      }

      // Refresh customers list
      dispatch(fetchCustomers({}));
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
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
              {isEdit ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
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
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ad"
                />
                {formErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soyad *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Soyad"
                />
                {formErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Identification */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TC Kimlik No
                </label>
                <input
                  type="text"
                  value={formData.tcKimlikNo}
                  onChange={(e) => handleInputChange('tcKimlikNo', e.target.value)}
                  maxLength="11"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formErrors.tcKimlikNo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="12345678901"
                />
                {formErrors.tcKimlikNo && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.tcKimlikNo}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pasaport No
                </label>
                <input
                  type="text"
                  value={formData.passportNo}
                  onChange={(e) => handleInputChange('passportNo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formErrors.passportNo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="A1234567"
                />
                {formErrors.passportNo && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.passportNo}</p>
                )}
              </div>
            </div>

            {/* Identification Error */}
            {formErrors.identification && (
              <p className="text-red-500 text-xs">{formErrors.identification}</p>
            )}

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+90 555 123 45 67"
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ornek@email.com"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adres
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tam adres..."
              />
            </div>

            {/* City and Country */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="İstanbul"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ülke
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Türkiye"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doğum Tarihi
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">{formErrors.dateOfBirth}</p>
              )}
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
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
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

export default CustomerModal;
