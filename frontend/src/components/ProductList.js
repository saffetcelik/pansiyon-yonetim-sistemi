import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import Swal from 'sweetalert2';
import { Tooltip } from 'react-tooltip';

const ProductList = ({ onEditProduct, onStockUpdate, refreshTrigger }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const categories = [
    { value: 'Food', label: 'Yiyecek' },
    { value: 'Beverage', label: 'İçecek' },
    { value: 'Snack', label: 'Atıştırmalık' },
    { value: 'Personal', label: 'Kişisel Bakım' },
    { value: 'Other', label: 'Diğer' }
  ];

  useEffect(() => {
    loadProducts();
  }, [refreshTrigger]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      Swal.fire({
        title: 'Hata!',
        text: 'Ürünler yüklenirken hata oluştu.',
        icon: 'error',
        confirmButtonText: 'Tamam'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Ürünü Sil',
      text: 'Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal'
    });

    if (result.isConfirmed) {
      try {
        await productService.delete(id);
        await Swal.fire({
          title: 'Başarılı!',
          text: 'Ürün başarıyla silindi.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        await Swal.fire({
          title: 'Hata!',
          text: 'Ürün silinirken bir hata oluştu.',
          icon: 'error',
          confirmButtonText: 'Tamam'
        });
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !categoryFilter || product.categoryName === categoryFilter;
    const matchesStock = !stockFilter || 
                        (stockFilter === 'low' && product.isLowStock) ||
                        (stockFilter === 'normal' && !product.isLowStock);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockStatusColor = (product) => {
    if (product.stockQuantity === 0) return 'text-red-600 bg-red-50';
    if (product.isLowStock) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusText = (product) => {
    if (product.stockQuantity === 0) return 'Tükendi';
    if (product.isLowStock) return 'Düşük Stok';
    return 'Normal';
  };

  const getCategoryLabel = (categoryName) => {
    const category = categories.find(cat => cat.value === categoryName);
    return category ? category.label : categoryName;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Filters */}
      <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Ürün Ara</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ürün adı veya açıklama..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Kategori</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">Tüm Kategoriler</option>
            {categories.map(category => (<option key={category.value} value={category.value}>{category.label}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Stok Durumu</label>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">Tüm Ürünler</option>
            <option value="low">Düşük Stok</option>
            <option value="normal">Normal Stok</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product, index) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  {product.description && <div className="text-xs text-gray-500">{product.description}</div>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{getCategoryLabel(product.categoryName)}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₺{product.price.toFixed(2)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {product.stockQuantity} {product.unit}
                  <div className="text-xs text-gray-500">Min: {product.minStockLevel}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(product)}`}>{getStockStatusText(product)}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-1">
                    <button onClick={() => onEditProduct(product)} className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50" title="Düzenle">✏️</button>
                    <button onClick={() => onStockUpdate(product)} className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50" title="Stok Güncelle">📦</button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50" title="Sil">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">Toplam <span className="font-medium">{filteredProducts.length}</span> kayıt</div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {filteredProducts.map((product, index) => (
          <div key={product.id} className="p-4 bg-white hover:bg-gray-50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{index + 1}. {product.name}</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStockStatusColor(product)}`}>{getStockStatusText(product)}</span>
                </div>
                {product.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{product.description}</p>}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  <span className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{getCategoryLabel(product.categoryName)}</span>
                  <span className="text-xs font-semibold text-green-700">₺{product.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-600">Stok: {product.stockQuantity} {product.unit}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => onEditProduct(product)} className="text-blue-600 p-2 rounded-md hover:bg-blue-50 touch-manipulation" title="Düzenle">✏️</button>
                <button onClick={() => onStockUpdate(product)} className="text-green-600 p-2 rounded-md hover:bg-green-50 touch-manipulation" title="Stok">📦</button>
                <button onClick={() => handleDelete(product.id)} className="text-red-600 p-2 rounded-md hover:bg-red-50 touch-manipulation" title="Sil">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-base">
            {searchTerm || categoryFilter || stockFilter ? 'Filtrelere uygun ürün bulunamadı.' : 'Henüz ürün eklenmemiş.'}
          </div>
        </div>
      )}

      <Tooltip id="edit-product-tooltip" />
      <Tooltip id="stock-tooltip" />
      <Tooltip id="delete-product-tooltip" />
    </div>
  );
};

export default ProductList;
