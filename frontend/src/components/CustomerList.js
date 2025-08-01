import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers } from '../store/slices/customerSlice';
import Swal from 'sweetalert2';
import { Tooltip } from 'react-tooltip';
import { customerService } from '../services/api';

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
    dispatch(fetchCustomers(filters));
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
    const result = await Swal.fire({
      title: 'Müşteriyi Sil',
      text: 'Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: false,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal',
      background: '#ffffff',
      color: '#1f2937',
      customClass: {
        popup: 'swal2-popup',
        title: 'swal2-title',
        content: 'swal2-content',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel'
      },
      didOpen: () => {
        // Force button styles
        const confirmBtn = document.querySelector('.swal2-confirm');
        const cancelBtn = document.querySelector('.swal2-cancel');
        const denyBtn = document.querySelector('.swal2-deny');

        // Hide deny button if it exists
        if (denyBtn) {
          denyBtn.style.display = 'none';
        }

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
        await Swal.fire({
          title: 'Başarılı!',
          text: 'Müşteri başarıyla silindi.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1f2937'
        });
        dispatch(fetchCustomers(filters));
      } catch (error) {
        console.error('Error deleting customer:', error);

        // Backend'den gelen hata mesajını al
        let errorMessage = 'Müşteri silinirken bir hata oluştu.';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        await Swal.fire({
          title: 'Uyarı!',
          text: errorMessage,
          icon: 'warning',
          confirmButtonText: 'Tamam',
          background: '#ffffff',
          color: '#1f2937',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
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
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Müşteriler</h2>
          <button
            onClick={onCreateCustomer}
            className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
          >
            + Yeni Müşteri
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input
              type="text"
              value={localFilters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              placeholder="Ad veya soyad ara..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
            <input
              type="text"
              value={localFilters.tcKimlikNo}
              onChange={(e) => handleFilterChange('tcKimlikNo', e.target.value)}
              placeholder="TC Kimlik No..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="text"
              value={localFilters.phone}
              onChange={(e) => handleFilterChange('phone', e.target.value)}
              placeholder="Telefon numarası..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="text"
              value={localFilters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              placeholder="E-posta adresi..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
            <input
              type="text"
              value={localFilters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              placeholder="Şehir..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ad Soyad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TC Kimlik / Pasaport
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İletişim
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adres
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doğum Tarihi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer, index) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {customer.fullName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {customer.tcKimlikNo && (
                      <div>TC: {customer.tcKimlikNo}</div>
                    )}
                    {customer.passportNo && (
                      <div>Pasaport: {customer.passportNo}</div>
                    )}
                    {!customer.tcKimlikNo && !customer.passportNo && (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {customer.phone && (
                      <div>📞 {customer.phone}</div>
                    )}
                    {customer.email && (
                      <div>✉️ {customer.email}</div>
                    )}
                    {!customer.phone && !customer.email && (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {customer.address && (
                      <div>{customer.address}</div>
                    )}
                    {customer.city && customer.country && (
                      <div className="text-gray-500">{customer.city}, {customer.country}</div>
                    )}
                    {!customer.address && !customer.city && (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(customer.dateOfBirth)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEditCustomer(customer)}
                      className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50"
                      data-tooltip-id="edit-tooltip"
                      data-tooltip-content="Müşteriyi düzenle"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                      data-tooltip-id="delete-tooltip"
                      data-tooltip-content="Müşteriyi sil"
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

      {/* Total count display */}
      {customers.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="text-sm text-gray-700">
            Toplam <span className="font-medium">{customers.length}</span> kayıt gösteriliyor
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">Müşteri bulunamadı</div>
          <div className="text-gray-400 text-sm">
            Yeni bir müşteri oluşturmak için yukarıdaki butonu kullanın.
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
