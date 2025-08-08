import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCustomer, fetchCustomers } from '../store/slices/customerSlice';
import { customerService } from '../services/api';
import Swal from 'sweetalert2';
import DateInput from './DateInput';

const CustomerModal = ({ 
  isOpen, 
  onClose, 
  customer = null, 
  isEdit = false, 
  onCustomerCreated = null, 
  isSearchMode = false, 
  onSelectCustomer = null 
}) => {
  const dispatch = useDispatch();
  const { loading, error, customers } = useSelector((state) => state.customers);
  
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [formErrors, setFormErrors] = useState({});

  // handleSearch fonksiyonu, toplu alan aramasını destekleyecek şekilde güncellendi
  const handleSearch = async (query, field = null, value = null, fieldsObj = null) => {
    if (query) setSearchQuery(query);
    try {
      let response;
      // Eğer birden fazla alan birlikte gönderildiyse (fieldsObj)
      if (fieldsObj && Object.keys(fieldsObj).length > 0) {
        response = await customerService.getAll(fieldsObj);
      } else if (field && value && value.trim().length > 0) {
        // Alan bazlı arama (tek alan)
        const searchParams = {};
        searchParams[field] = value;
        response = await customerService.getAll(searchParams);
      } else if (query && query.trim().length >= 2) {
        // Genel arama sorgusu için search endpoint'i kullan
        response = await customerService.search(query);
      } else {
        // Sorgu boş veya çok kısaysa, sonuçları temizle
        setSearchResults([]);
        return;
      }
      // API yanıtı doğrudan dizi olabilir veya data içinde dizi olabilir
      const resultData = Array.isArray(response.data)
        ? response.data
        : (response.data && Array.isArray(response.data.data) ? response.data.data : []);
      setSearchResults(resultData);
    } catch (error) {
      setSearchResults([]);
    }
  };
  
  // Müşteri seçme fonksiyonu
  const handleSelectCustomer = (customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
    onClose();
  };

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
      // Reset form for new customer or search
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
      
      // Clear search results when opening in search mode
      if (isSearchMode) {
        setSearchResults([]);
        setSearchQuery('');
      }
    }
    setFormErrors({});
  }, [isEdit, customer, isOpen, isSearchMode]);

  const handleInputChange = (field, value) => {
    // Ad için ilk harf büyük, diğerleri küçük harf
    if (field === 'firstName' && value) {
      value = value.charAt(0).toLocaleUpperCase('tr-TR') + value.slice(1).toLocaleLowerCase('tr-TR');
    }

    // Soyad için tüm harfler büyük (Türkçe karakter desteğiyle)
    if (field === 'lastName' && value) {
      value = value.toLocaleUpperCase('tr-TR');
    }
    
    // Telefon numarası için maskeleme ve düzenleme
    if (field === 'phone') {
      // Önceki temizlenmiş değeri hesapla (formatı kaldır)
      const prevCleanedValue = formData.phone.replace(/\D/g, '');
      
      // Yeni girilen değeri temizle
      let cleaned = value.replace(/\D/g, '');
      
      // Başında 90 varsa kaldır (uluslararası format temizleme)
      if (cleaned.startsWith('90')) {
        cleaned = cleaned.substring(2);
      }
      
      // Başında 0 varsa kaldır
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      
      // Silme işlemini tespit et: Eğer temizlenmiş yeni değer, eski değerden daha kısaysa
      const isDeletingDigit = cleaned.length < prevCleanedValue.length;
      
      // Eğer değer boşsa, formData'yı da boşalt
      if (cleaned.length === 0) {
        value = '';
      } else {
        // En fazla 10 hane (5XXXXXXXXX formatına uygun)
        cleaned = cleaned.slice(0, 10);
        
        // Formatlı telefon numarası oluşturma +90 (5xx) xxx xx xx
        let formattedPhone = '';
        
        // İlk 3 rakam için (5xx)
        if (cleaned.length <= 3) {
          formattedPhone = `(${cleaned}`;
        }
        // Sonraki 3 rakam için (5xx) xxx
        else if (cleaned.length <= 6) {
          formattedPhone = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        }
        // Sonraki 2 rakam için (5xx) xxx xx
        else if (cleaned.length <= 8) {
          formattedPhone = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        }
        // Son 2 rakam için (5xx) xxx xx xx
        else {
          formattedPhone = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
        }
        
        // +90 ekle
        value = "+90 " + formattedPhone;
      }
    }
    
    // Email için lowercase dönüştürme
    if (field === 'email' && value) {
      value = value.toLowerCase();
    }
    
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

    // TC Kimlik No ve Pasaport No artık opsiyonel

    // TC Kimlik validation
    if (formData.tcKimlikNo && !validateTCKimlik(formData.tcKimlikNo)) {
      errors.tcKimlikNo = 'Geçerli bir TC Kimlik No giriniz';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    // Phone validation - Türkiye telefon numarası formatı
    if (formData.phone) {
      // Telefon numarası doğrulama
      const cleanPhone = formData.phone.replace(/\D/g, '');
      
      // Türk telefonu için 10 haneli olmalı (ön 90 olmadan)
      // +90 ile başlayan toplam 10 rakam olmalı (90 olmadan 10 rakam)
      if (cleanPhone.startsWith('90')) {
        // 90 ile başlıyorsa toplam 12 hane olmalı (90 + 10 hane)
        if (cleanPhone.length < 12) {
          errors.phone = 'Telefon numarası eksik girilmiş';
        } else if (cleanPhone.length > 12) {
          errors.phone = 'Telefon numarası çok uzun';
        }
      } else {
        // 90 ile başlamıyorsa 10 hane olmalı
        if (cleanPhone.length < 10) {
          errors.phone = 'Telefon numarası eksik girilmiş';
        } else if (cleanPhone.length > 10) {
          errors.phone = 'Telefon numarası çok uzun';
        }
      }
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
      // Telefon numarasını düzenleme - Tüm boşluk ve özel karakterleri kaldırıp sadece rakamları kullan
      let formattedPhone = formData.phone;
      if (formattedPhone && formattedPhone.trim() !== '') {
        // Tüm özel karakterleri temizle
        formattedPhone = formattedPhone.replace(/\D/g, '');
        
        // +90 veya başında 90 varsa kaldır
        if (formattedPhone.startsWith('90')) {
          formattedPhone = formattedPhone.substring(2);
        }
        
        // Başında 0 varsa kaldır
        if (formattedPhone.startsWith('0')) {
          formattedPhone = formattedPhone.substring(1);
        }
        
        // Başında 5 ile başladığından emin ol - telefon numaraları için Türkiye formatı
        if (!formattedPhone.startsWith('5') && formattedPhone.length > 0) {
          formattedPhone = '5' + formattedPhone;
        }
        
        // Sadece 10 hane olacak şekilde sınırla (5 ile başlayan 10 haneli telefon)
        formattedPhone = formattedPhone.slice(0, 10);
      }

      const customerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        TCKimlikNo: formData.tcKimlikNo || null,
        PassportNo: formData.passportNo || null,
        phone: formattedPhone || null,
        email: formData.email || null,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null
      };

      console.log('Sending customer data:', customerData);

      let response;
      if (isEdit) {
        response = await customerService.update(customer.id, customerData);
      } else {
        response = await dispatch(createCustomer(customerData)).unwrap();
      }

      // Cancel butonunu asla göstermemek için interval ile DOM'dan kaldır
      let cancelInterval = setInterval(() => {
        const cancelBtn = document.querySelector('.swal2-cancel');
        if (cancelBtn) cancelBtn.remove();
      }, 10);

      await Swal.fire({
        showCancelButton: false,
        showDenyButton: false,
        showCloseButton: false,
        title: 'Başarılı!',
        text: `Müşteri başarıyla ${isEdit ? 'güncellendi' : 'oluşturuldu'}.`,
        icon: 'success',
        confirmButtonText: 'Tamam',
        confirmButtonColor: '#22c55e', // Tailwind green-500
        background: '#ffffff',
        color: '#1f2937'
      });

      clearInterval(cancelInterval);

      // Refresh customers list
      dispatch(fetchCustomers({}));

      // Eğer yeni müşteri oluşturuldu ve callback varsa çağır
      if (!isEdit && onCustomerCreated && response) {
        onCustomerCreated(response);
      }

      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      let errorMessage = `Müşteri ${isEdit ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu.`;

      // Backend validation hatalarını işle
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          // ModelState validation hatalarını işle
          const validationErrors = error.response.data.errors;
          const errorMessages = [];

          Object.keys(validationErrors).forEach(field => {
            const fieldErrors = validationErrors[field];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach(err => errorMessages.push(err));
            }
          });

          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('\n');
          }
        } else if (error.response.status === 400) {
          errorMessage = 'Girilen bilgilerde hata var. Lütfen kontrol edin.';
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      }

      // Özel durumlar için SweetAlert tipini belirle
      let alertType = 'error';
      let alertTitle = 'Hata!';

      // Aynı müşteri kontrolü
      if (errorMessage.includes('TC Kimlik No ile kayıtlı müşteri') ||
          errorMessage.includes('Pasaport No ile kayıtlı müşteri')) {
        alertType = 'warning';
        alertTitle = 'Uyarı!';
      }

      console.log('SweetAlert will show:', { alertTitle, errorMessage, alertType });

      await Swal.fire({
        title: alertTitle,
        text: errorMessage,
        icon: alertType,
        confirmButtonText: 'Tamam',
        background: '#ffffff',
        color: '#1f2937',
        confirmButtonColor: '#dc2626'
      });

      console.log('SweetAlert completed');
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
              {isSearchMode ? 'Müşteri Ara' : isEdit ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
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

          {isSearchMode ? (
            <div className="space-y-4">
              {/* Gelişmiş Arama Bölümü */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newFormData = { ...formData, firstName: value };
                        handleInputChange('firstName', value);
                        // Tüm dolu alanları topla
                        const searchParams = {};
                        if (newFormData.firstName && newFormData.firstName.trim().length >= 2) searchParams.firstName = newFormData.firstName;
                        if (newFormData.lastName && newFormData.lastName.trim().length >= 2) searchParams.lastName = newFormData.lastName;
                        if (newFormData.tcKimlikNo && newFormData.tcKimlikNo.trim().length >= 2) searchParams.tcKimlikNo = newFormData.tcKimlikNo;
                        if (newFormData.phone && newFormData.phone.trim().length >= 2) searchParams.phone = newFormData.phone;
                        if (Object.keys(searchParams).length > 0) {
                          handleSearch(null, null, null, searchParams);
                        } else if (searchResults.length > 0) {
                          setSearchResults([]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="Ad"
                    />
                    {formData.firstName && (
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center"
                        onClick={() => {
                          const newFormData = { ...formData, firstName: '' };
                          setFormData(newFormData);
                          // Diğer alanları kontrol et
                          const searchParams = {};
                          if (newFormData.lastName && newFormData.lastName.trim().length >= 2) searchParams.lastName = newFormData.lastName;
                          if (newFormData.tcKimlikNo && newFormData.tcKimlikNo.trim().length >= 2) searchParams.tcKimlikNo = newFormData.tcKimlikNo;
                          if (newFormData.phone && newFormData.phone.trim().length >= 2) searchParams.phone = newFormData.phone;
                          if (Object.keys(searchParams).length > 0) {
                            handleSearch(null, null, null, searchParams);
                          } else if (searchResults.length > 0) {
                            setSearchResults([]);
                          }
                        }}
                      >
                        <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soyad
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newFormData = { ...formData, lastName: value };
                        handleInputChange('lastName', value);
                        // Tüm dolu alanları topla
                        const searchParams = {};
                        if (newFormData.firstName && newFormData.firstName.trim().length >= 2) searchParams.firstName = newFormData.firstName;
                        if (newFormData.lastName && newFormData.lastName.trim().length >= 2) searchParams.lastName = newFormData.lastName;
                        if (newFormData.tcKimlikNo && newFormData.tcKimlikNo.trim().length >= 2) searchParams.tcKimlikNo = newFormData.tcKimlikNo;
                        if (newFormData.phone && newFormData.phone.trim().length >= 2) searchParams.phone = newFormData.phone;
                        if (Object.keys(searchParams).length > 0) {
                          handleSearch(null, null, null, searchParams);
                        } else if (searchResults.length > 0) {
                          setSearchResults([]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="Soyad"
                    />
                    {formData.lastName && (
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center"
                        onClick={() => {
                          const newFormData = { ...formData, lastName: '' };
                          setFormData(newFormData);
                          // Diğer alanları kontrol et
                          const searchParams = {};
                          if (newFormData.firstName && newFormData.firstName.trim().length >= 2) searchParams.firstName = newFormData.firstName;
                          if (newFormData.tcKimlikNo && newFormData.tcKimlikNo.trim().length >= 2) searchParams.tcKimlikNo = newFormData.tcKimlikNo;
                          if (newFormData.phone && newFormData.phone.trim().length >= 2) searchParams.phone = newFormData.phone;
                          if (Object.keys(searchParams).length > 0) {
                            handleSearch(null, null, null, searchParams);
                          } else if (searchResults.length > 0) {
                            setSearchResults([]);
                          }
                        }}
                      >
                        <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TC Kimlik No
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.tcKimlikNo}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newFormData = { ...formData, tcKimlikNo: value };
                        handleInputChange('tcKimlikNo', value);
                        // Tüm dolu alanları topla
                        const searchParams = {};
                        if (newFormData.firstName && newFormData.firstName.trim().length >= 2) searchParams.firstName = newFormData.firstName;
                        if (newFormData.lastName && newFormData.lastName.trim().length >= 2) searchParams.lastName = newFormData.lastName;
                        if (newFormData.tcKimlikNo && newFormData.tcKimlikNo.trim().length >= 2) searchParams.tcKimlikNo = newFormData.tcKimlikNo;
                        if (newFormData.phone && newFormData.phone.trim().length >= 2) searchParams.phone = newFormData.phone;
                        if (Object.keys(searchParams).length > 0) {
                          handleSearch(null, null, null, searchParams);
                        } else if (searchResults.length > 0) {
                          setSearchResults([]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="TC Kimlik No"
                      maxLength="11"
                    />
                    {formData.tcKimlikNo && (
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center"
                        onClick={() => {
                          const newFormData = { ...formData, tcKimlikNo: '' };
                          setFormData(newFormData);
                          // Diğer alanları kontrol et
                          const searchParams = {};
                          if (newFormData.firstName && newFormData.firstName.trim().length >= 2) searchParams.firstName = newFormData.firstName;
                          if (newFormData.lastName && newFormData.lastName.trim().length >= 2) searchParams.lastName = newFormData.lastName;
                          if (newFormData.phone && newFormData.phone.trim().length >= 2) searchParams.phone = newFormData.phone;
                          if (Object.keys(searchParams).length > 0) {
                            handleSearch(null, null, null, searchParams);
                          } else if (searchResults.length > 0) {
                            setSearchResults([]);
                          }
                        }}
                      >
                        <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newFormData = { ...formData, phone: value };
                        handleInputChange('phone', value);
                        // Tüm dolu alanları topla
                        const searchParams = {};
                        if (newFormData.firstName && newFormData.firstName.trim().length >= 2) searchParams.firstName = newFormData.firstName;
                        if (newFormData.lastName && newFormData.lastName.trim().length >= 2) searchParams.lastName = newFormData.lastName;
                        if (newFormData.tcKimlikNo && newFormData.tcKimlikNo.trim().length >= 2) searchParams.tcKimlikNo = newFormData.tcKimlikNo;
                        if (newFormData.phone && newFormData.phone.trim().length >= 2) searchParams.phone = newFormData.phone;
                        if (Object.keys(searchParams).length > 0) {
                          handleSearch(null, null, null, searchParams);
                        } else if (searchResults.length > 0) {
                          setSearchResults([]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="+90 (5xx) xxx xx xx"
                    />
                    {formData.phone && (
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center"
                        onClick={() => {
                          const newFormData = { ...formData, phone: '' };
                          setFormData(newFormData);
                          // Diğer alanları kontrol et
                          const searchParams = {};
                          if (newFormData.firstName && newFormData.firstName.trim().length >= 2) searchParams.firstName = newFormData.firstName;
                          if (newFormData.lastName && newFormData.lastName.trim().length >= 2) searchParams.lastName = newFormData.lastName;
                          if (newFormData.tcKimlikNo && newFormData.tcKimlikNo.trim().length >= 2) searchParams.tcKimlikNo = newFormData.tcKimlikNo;
                          if (Object.keys(searchParams).length > 0) {
                            handleSearch(null, null, null, searchParams);
                          } else if (searchResults.length > 0) {
                            setSearchResults([]);
                          }
                        }}
                      >
                        <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genel Arama
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      if (value.trim().length >= 2) {
                        handleSearch(value);
                      } else if (value.trim().length === 0) {
                        setSearchResults([]);
                      }
                    }}
                    placeholder="İsim, telefon, TC Kimlik No ile ara..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="absolute inset-y-0 right-2 flex items-center"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Arama Sonuçları */}
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {searchResults.map(customer => (
                      <li key={customer.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                        <div className="flex-grow">
                          <h3 className="text-sm font-medium">{customer.firstName} {customer.lastName}</h3>
                          <div className="text-xs text-gray-500 grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
                            {customer.phone && <p className="mb-0">Tel: {customer.phone}</p>}
                            {customer.tcKimlikNo && <p className="mb-0">TC: {customer.tcKimlikNo}</p>}
                            {customer.passportNo && <p className="mb-0">Pasaport: {customer.passportNo}</p>}
                            {customer.email && <p className="mb-0">E-posta: {customer.email}</p>}
                          </div>
                          {customer.address && (
                            <p className="text-xs text-gray-500 truncate max-w-md mt-1">
                              Adres: {customer.address}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(customer)}
                          className="px-3 py-1 ml-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex-shrink-0"
                        >
                          Seç
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : searchQuery.trim().length > 0 || Object.values(formData).some(val => typeof val === 'string' && val.trim().length >= 2) ? (
                  <div className="p-4 text-center text-gray-500">
                    Sonuç bulunamadı
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p>Arama yapmak için:</p>
                    <p className="mt-1 font-medium">- En az 2 karakter girin</p>
                    <p>- Ad, soyad, TC kimlik no veya telefon numarası ile arayabilirsiniz</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Normal Form */
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
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      formErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+90 (5xx) xxx xx xx"
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ornek@email.com"
                  />
                </div>
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
              <DateInput
                value={formData.dateOfBirth}
                onChange={(date) => {
                  if (date) {
                    // react-datepicker Date objesi döner, yyyy-MM-dd formatına çevir
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    handleInputChange('dateOfBirth', `${y}-${m}-${d}`);
                  } else {
                    handleInputChange('dateOfBirth', '');
                  }
                }}
                error={formErrors.dateOfBirth}
                maxDate={new Date()}
                clearable={true}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
