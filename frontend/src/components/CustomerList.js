import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers } from '../store/slices/customerSlice';
import customSwal, { confirmDialog, successMessage, errorMessage } from '../utils/sweetalert';
import { Tooltip } from 'react-tooltip';
import { customerService } from '../services/api';

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

const CustomerList = ({ onEditCustomer, onCreateCustomer }) => {
  const dispatch = useDispatch();
  const { customers, loading, error } = useSelector((state) => {
    console.log('Current state:', state.customers);
    return state.customers;
  });
  
  const [filters, setFilters] = useState({
    name: '',
    tcKimlikNo: '',
    phone: '',
    email: '',
    city: ''
  });

  const [localFilters, setLocalFilters] = useState(filters);

  // Debounce hook
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // Debounced filters for auto-search
  const debouncedFilters = useDebounce(localFilters, 500);

  useEffect(() => {
    console.log('Fetching customers with filters:', filters);
    dispatch(fetchCustomers(filters))
      .unwrap()
      .then(result => {
        console.log('Customers fetched successfully:', result);
      })
      .catch(error => {
        console.error('Error fetching customers:', error);
        // İsteğe bağlı olarak kullanıcıya hata bildirimi gösterilebilir
        customSwal.fire({
          title: 'Bağlantı Hatası',
          text: 'Müşteri verileri yüklenirken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin.',
          icon: 'error',
          confirmButtonText: 'Tamam'
        });
      });
  }, [dispatch, filters]);

  // Auto-search effect
  useEffect(() => {
    if (JSON.stringify(debouncedFilters) !== JSON.stringify(filters)) {
      setFilters(debouncedFilters);
    }
  }, [debouncedFilters, filters]);

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };



  const handleClearFilters = () => {
    const clearedFilters = {
      name: '',
      tcKimlikNo: '',
      phone: '',
      email: '',
      city: ''
    };
    setLocalFilters(clearedFilters);
    setFilters(clearedFilters);
  };

  const handleDelete = async (id) => {
    // Müşteri bilgilerini bul
    const customerToDelete = customers.find(c => (c.id || c.Id) === id);
    if (!customerToDelete) {
      console.error('Silinecek müşteri bulunamadı:', id);
      return;
    }
    
    // Müşteri bilgilerini düzenle
    const customer = {
      id: customerToDelete.id || customerToDelete.Id,
      firstName: customerToDelete.firstName || customerToDelete.FirstName || '',
      lastName: customerToDelete.lastName || customerToDelete.LastName || '',
      fullName: customerToDelete.fullName || customerToDelete.FullName || 
                `${customerToDelete.firstName || customerToDelete.FirstName || ''} ${customerToDelete.lastName || customerToDelete.LastName || ''}`,
      tcKimlikNo: customerToDelete.tcKimlikNo || customerToDelete.TCKimlikNo,
      passportNo: customerToDelete.passportNo || customerToDelete.PassportNo,
      phone: customerToDelete.phone || customerToDelete.Phone,
      email: customerToDelete.email || customerToDelete.Email,
      address: customerToDelete.address || customerToDelete.Address,
      city: customerToDelete.city || customerToDelete.City,
      country: customerToDelete.country || customerToDelete.Country,
    };
    
    // Müşteri bilgilerini HTML olarak hazırla
    const customerInfoHtml = `
      <div class="bg-gray-50 p-4 rounded-md mt-3 mb-4 text-left">
        <h3 class="font-medium text-gray-800 mb-2">${customer.fullName}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            ${customer.tcKimlikNo ? `<p><span class="text-gray-600">TC:</span> ${customer.tcKimlikNo}</p>` : ''}
            ${customer.passportNo ? `<p><span class="text-gray-600">Pasaport:</span> ${customer.passportNo}</p>` : ''}
            ${customer.phone ? `<p><span class="text-gray-600">Telefon:</span> ${customer.phone}</p>` : ''}
          </div>
          <div>
            ${customer.email ? `<p><span class="text-gray-600">E-posta:</span> ${customer.email}</p>` : ''}
            ${(customer.address || customer.city || customer.country) ? 
              `<p><span class="text-gray-600">Adres:</span> ${[customer.address, customer.city, customer.country].filter(Boolean).join(', ')}</p>` : ''}
          </div>
        </div>
      </div>
    `;
    
    // "No" butonunu gizlemek için CSS ekle
    document.head.insertAdjacentHTML('beforeend', `
      <style id="remove-no-button">
        .swal2-deny {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          visibility: hidden !important;
          position: absolute !important;
          pointer-events: none !important;
        }
      </style>
    `);
    
    // SweetAlert2 ayarları
    const result = await customSwal.fire({
      title: 'Müşteriyi Sil',
      html: `<p>Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>${customerInfoHtml}`,
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: false,
      showConfirmButton: true,
      showCloseButton: false,
      allowEscapeKey: true,
      allowOutsideClick: false,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal',
      buttonsStyling: true,
      didOpen: () => {
        // Buton stillerini ayarla
        const confirmBtn = document.querySelector('.swal2-confirm');
        const cancelBtn = document.querySelector('.swal2-cancel');
        
        if (confirmBtn) {
          confirmBtn.style.backgroundColor = '#dc2626';
          confirmBtn.style.color = '#ffffff';
          confirmBtn.style.border = '2px solid #dc2626';
          confirmBtn.style.fontWeight = '600';
          confirmBtn.style.padding = '10px 20px';
          confirmBtn.style.borderRadius = '6px';
          confirmBtn.style.fontSize = '14px';
        }

        if (cancelBtn) {
          cancelBtn.style.backgroundColor = '#6b7280';
          cancelBtn.style.color = '#ffffff';
          cancelBtn.style.border = '2px solid #6b7280';
          cancelBtn.style.fontWeight = '600';
          cancelBtn.style.padding = '10px 20px';
          cancelBtn.style.borderRadius = '6px';
          cancelBtn.style.fontSize = '14px';
        }
      }
    });

    if (result.isConfirmed) {
      try {
        await customerService.delete(id);
        // Silme işlemi başarılı - müşteri bilgilerini göster ve silindi mesajı ver
        await customSwal.fire({
          title: 'Başarılı!',
          html: `<p>Müşteri başarıyla silindi.</p>
                 <div class="text-sm text-gray-600 mt-2">${customer.fullName}</div>`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          showCancelButton: false,
          showDenyButton: false,
          background: '#ffffff',
          color: '#1f2937'
        });
        dispatch(fetchCustomers(filters));
      } catch (error) {
        console.error('Error deleting customer:', error);

        // Rezervasyon hatası kontrolü
        if (error.isReservationError) {
          // Aktif ve geçmiş rezervasyonları grupla
          const activeReservations = error.activeReservations || [];
          const pastReservations = error.pastReservations || [];
          
          // HTML içeriğini oluştur
          let reservationHTML = `<div class="mt-3 text-left"><p class="font-medium text-red-600">${error.message}</p>`;
          
          // Aktif rezervasyonlar
          if (activeReservations.length > 0) {
            reservationHTML += `
              <div class="mt-3">
                <p class="font-medium">Aktif Rezervasyonlar:</p>
                <ul class="list-disc pl-5 mt-2">
                  ${activeReservations.map(res => 
                    `<li>${res.roomNumber || 'Oda'} (${getStatusText(res.status)}): 
                    ${new Date(res.checkInDate).toLocaleDateString('tr-TR')} - 
                    ${new Date(res.checkOutDate).toLocaleDateString('tr-TR')}</li>`
                  ).join('')}
                </ul>
              </div>`;
          }
          
          // Geçmiş rezervasyonlar
          if (pastReservations.length > 0) {
            reservationHTML += `
              <div class="mt-3">
                <p class="font-medium">Geçmiş Rezervasyonlar:</p>
                <ul class="list-disc pl-5 mt-2">
                  ${pastReservations.map(res => 
                    `<li>${res.roomNumber || 'Oda'} (${getStatusText(res.status)}): 
                    ${new Date(res.checkInDate).toLocaleDateString('tr-TR')} - 
                    ${new Date(res.checkOutDate).toLocaleDateString('tr-TR')}</li>`
                  ).join('')}
                </ul>
              </div>`;
          }
          
          reservationHTML += `</div>`;

          document.head.insertAdjacentHTML('beforeend', `
            <style id="remove-no-button-error">
              .swal2-deny {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                visibility: hidden !important;
                position: absolute !important;
                pointer-events: none !important;
              }
            </style>
          `);
          
          await customSwal.fire({
            title: 'Müşteri Silinemedi',
            html: reservationHTML,
            icon: 'error',
            confirmButtonText: 'Tamam',
            showCancelButton: false,
            showDenyButton: false,
            background: '#ffffff',
            color: '#1f2937',
            confirmButtonColor: '#dc2626',
            didOpen: () => {
              const confirmBtn = document.querySelector('.swal2-confirm');
              if (confirmBtn) {
                confirmBtn.style.backgroundColor = '#dc2626';
                confirmBtn.style.color = '#ffffff';
                confirmBtn.style.border = '2px solid #dc2626';
                confirmBtn.style.fontWeight = '600';
                confirmBtn.style.padding = '10px 20px';
                confirmBtn.style.borderRadius = '6px';
                confirmBtn.style.fontSize = '14px';
              }
            }
          });
          return;
        }

        // Diğer hatalar için
        let errorMessage = 'Müşteri silinirken bir hata oluştu.';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        document.head.insertAdjacentHTML('beforeend', `
          <style id="remove-no-button-warning">
            .swal2-deny {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
              visibility: hidden !important;
              position: absolute !important;
              pointer-events: none !important;
            }
          </style>
        `);
        
        await customSwal.fire({
          title: 'Uyarı!',
          text: errorMessage,
          icon: 'warning',
          confirmButtonText: 'Tamam',
          showCancelButton: false,
          showDenyButton: false,
          background: '#ffffff',
          color: '#1f2937',
          confirmButtonColor: '#dc2626',
          didOpen: () => {
            const confirmBtn = document.querySelector('.swal2-confirm');
            if (confirmBtn) {
              confirmBtn.style.backgroundColor = '#dc2626';
              confirmBtn.style.color = '#ffffff';
              confirmBtn.style.border = '2px solid #dc2626';
              confirmBtn.style.fontWeight = '600';
              confirmBtn.style.padding = '10px 20px';
              confirmBtn.style.borderRadius = '6px';
              confirmBtn.style.fontSize = '14px';
            }
          }
        });
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };
  
  // Rezervasyon durumunu Türkçeye çeviren yardımcı fonksiyon
  const getStatusText = (status) => {
    const statusMap = {
      'Active': 'Aktif',
      'CheckedIn': 'Giriş Yapıldı',
      'CheckedOut': 'Çıkış Yapıldı',
      'Completed': 'Tamamlandı',
      'Canceled': 'İptal Edildi',
      'Reserved': 'Rezerve',
      'Confirmed': 'Onaylandı',
      'NoShow': 'Gelmedi'
    };
    
    return statusMap[status] || status;
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
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Müşteriler</h2>
          <button
            onClick={onCreateCustomer}
            className="bg-white text-green-600 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors text-sm sm:text-base"
          >
            + Yeni Müşteri
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input
              type="text"
              value={localFilters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              placeholder="Ad veya soyad ara..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
            <input
              type="text"
              value={localFilters.tcKimlikNo}
              onChange={(e) => handleFilterChange('tcKimlikNo', e.target.value)}
              placeholder="TC Kimlik No..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="text"
              value={localFilters.phone}
              onChange={(e) => handleFilterChange('phone', e.target.value)}
              placeholder="Telefon numarası..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="text"
              value={localFilters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              placeholder="E-posta adresi..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
            <input
              type="text"
              value={localFilters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              placeholder="Şehir..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleClearFilters} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors text-sm">
            Temizle
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TC / Pasaport</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adres</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doğum Tarihi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers && customers.length > 0 ? (
              customers.map((customer, index) => {
                const customerData = {
                  id: customer.id || customer.Id,
                  fullName: customer.fullName || customer.FullName || `${customer.firstName || customer.FirstName || ''} ${customer.lastName || customer.LastName || ''}`,
                  tcKimlikNo: customer.tcKimlikNo || customer.TCKimlikNo,
                  passportNo: customer.passportNo || customer.PassportNo,
                  phone: customer.phone || customer.Phone,
                  email: customer.email || customer.Email,
                  address: customer.address || customer.Address,
                  city: customer.city || customer.City,
                  country: customer.country || customer.Country,
                  dateOfBirth: customer.dateOfBirth || customer.DateOfBirth,
                };
                return (
                  <tr key={customerData.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{customerData.fullName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {customerData.tcKimlikNo && <div>TC: {customerData.tcKimlikNo}</div>}
                      {customerData.passportNo && <div>Pasaport: {customerData.passportNo}</div>}
                      {!customerData.tcKimlikNo && !customerData.passportNo && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {customerData.phone && <div>📞 {customerData.phone}</div>}
                      {customerData.email && <div>✉️ {customerData.email}</div>}
                      {!customerData.phone && !customerData.email && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {customerData.address && <div>{customerData.address}</div>}
                      {customerData.city && customerData.country && <div className="text-gray-500">{customerData.city}, {customerData.country}</div>}
                      {!customerData.address && !customerData.city && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(customerData.dateOfBirth)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1">
                        <button onClick={() => onEditCustomer(customer)} className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50" title="Düzenle">✏️</button>
                        <button onClick={() => handleDelete(customerData.id)} className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50" title="Sil">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-500">Henüz müşteri kaydı bulunmuyor.</p>
                  <p className="text-sm text-gray-400 mt-1">Yeni bir müşteri eklemek için 'Yeni Müşteri' düğmesini kullanın.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {customers && customers.length > 0 ? (
          customers.map((customer, index) => {
            const customerData = {
              id: customer.id || customer.Id,
              fullName: customer.fullName || customer.FullName || `${customer.firstName || customer.FirstName || ''} ${customer.lastName || customer.LastName || ''}`,
              tcKimlikNo: customer.tcKimlikNo || customer.TCKimlikNo,
              passportNo: customer.passportNo || customer.PassportNo,
              phone: customer.phone || customer.Phone,
              email: customer.email || customer.Email,
              city: customer.city || customer.City,
              country: customer.country || customer.Country,
              dateOfBirth: customer.dateOfBirth || customer.DateOfBirth,
            };
            return (
              <div key={customerData.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}. {customerData.fullName}</p>
                    {customerData.tcKimlikNo && <p className="text-xs text-gray-500 mt-0.5">TC: {customerData.tcKimlikNo}</p>}
                    {customerData.passportNo && <p className="text-xs text-gray-500 mt-0.5">Pasaport: {customerData.passportNo}</p>}
                    {customerData.phone && <p className="text-xs text-gray-600 mt-1">📞 {customerData.phone}</p>}
                    {customerData.email && <p className="text-xs text-gray-600">✉️ {customerData.email}</p>}
                    {(customerData.city || customerData.country) && (
                      <p className="text-xs text-gray-500 mt-0.5">📍 {[customerData.city, customerData.country].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => onEditCustomer(customer)} className="text-green-600 p-2 rounded-md hover:bg-green-50 touch-manipulation text-base">✏️</button>
                    <button onClick={() => handleDelete(customerData.id)} className="text-red-600 p-2 rounded-md hover:bg-red-50 touch-manipulation text-base">🗑️</button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">Henüz müşteri kaydı bulunmuyor.</p>
            <p className="text-sm text-gray-400 mt-1">Yeni bir müşteri eklemek için yukarıdaki butonu kullanın.</p>
          </div>
        )}
      </div>

      {/* Total count */}
      {customers.length > 0 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Toplam <span className="font-medium">{customers.length}</span> kayıt
          </div>
        </div>
      )}

      {/* Tooltips */}
      <Tooltip id="edit-tooltip" />
      <Tooltip id="delete-tooltip" />
    </div>
  );
};


export default CustomerList;
