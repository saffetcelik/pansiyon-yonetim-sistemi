import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import Swal from 'sweetalert2';

const StockModal = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'StockIn',
    quantity: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const transactionTypes = [
    { value: 'StockIn', label: 'Stok Girişi', icon: '📥', color: 'text-green-600' },
    { value: 'StockOut', label: 'Stok Çıkışı', icon: '📤', color: 'text-red-600' },
    { value: 'Adjustment', label: 'Stok Düzeltme', icon: '⚖️', color: 'text-blue-600' }
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: 'StockIn',
        quantity: '',
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Geçerli bir miktar giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const stockData = {
        type: formData.type,
        quantity: parseInt(formData.quantity),
        notes: formData.notes.trim() || null
      };

      await productService.updateStock(product.id, stockData);
      onSave();
    } catch (error) {
      console.error('Error updating stock:', error);
      let errorMessage = 'Stok güncellenirken bir hata oluştu.';
      
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
    } finally {
      setLoading(false);
    }
  };

  const getNewStockQuantity = () => {
    if (!formData.quantity || !product) return product?.stockQuantity || 0;
    
    const quantity = parseInt(formData.quantity);
    const currentStock = product.stockQuantity;
    
    switch (formData.type) {
      case 'StockIn':
        return currentStock + quantity;
      case 'StockOut':
        return Math.max(0, currentStock - quantity);
      case 'Adjustment':
        return quantity;
      default:
        return currentStock;
    }
  };

  const selectedType = transactionTypes.find(type => type.value === formData.type);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Stok Güncelle
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Product Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-600">
            Mevcut Stok: <span className="font-medium">{product.stockQuantity} {product.unit}</span>
          </p>
          <p className="text-sm text-gray-600">
            Min. Seviye: <span className="font-medium">{product.minStockLevel} {product.unit}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşlem Tipi *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {transactionTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-lg mr-3">{type.icon}</span>
                  <span className={`font-medium ${type.color}`}>
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miktar ({product.unit}) *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={formData.type === 'Adjustment' ? 'Yeni stok miktarı' : 'Miktar'}
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Stock Preview */}
          {formData.quantity && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Yeni Stok:</span> {getNewStockQuantity()} {product.unit}
              </p>
              {getNewStockQuantity() <= product.minStockLevel && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠️ Minimum stok seviyesinin altında!
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="İşlem hakkında notlar (opsiyonel)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${
                selectedType?.color === 'text-green-600' ? 'bg-green-600 hover:bg-green-700' :
                selectedType?.color === 'text-red-600' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Güncelleniyor...' : 'Stok Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockModal;
