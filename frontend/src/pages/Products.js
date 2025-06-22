import React, { useState, useEffect } from 'react';
import ProductList from '../components/ProductList';
import ProductModal from '../components/ProductModal';
import StockModal from '../components/StockModal';
import Swal from 'sweetalert2';

const Products = () => {
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleStockUpdate = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const handleCloseModals = () => {
    setShowProductModal(false);
    setShowStockModal(false);
    setSelectedProduct(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProductSaved = () => {
    handleCloseModals();
    Swal.fire({
      title: 'Başarılı!',
      text: 'Ürün başarıyla kaydedildi.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleStockUpdated = () => {
    handleCloseModals();
    Swal.fire({
      title: 'Başarılı!',
      text: 'Stok başarıyla güncellendi.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>
          <p className="text-gray-600">Büfe ürünlerini ve stok durumunu yönetin</p>
        </div>
        <button
          onClick={handleAddProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <span>➕</span>
          <span>Yeni Ürün</span>
        </button>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg shadow">
        <ProductList
          onEditProduct={handleEditProduct}
          onStockUpdate={handleStockUpdate}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          isOpen={showProductModal}
          onClose={handleCloseModals}
          product={selectedProduct}
          onSave={handleProductSaved}
        />
      )}

      {/* Stock Modal */}
      {showStockModal && (
        <StockModal
          isOpen={showStockModal}
          onClose={handleCloseModals}
          product={selectedProduct}
          onSave={handleStockUpdated}
        />
      )}
    </div>
  );
};

export default Products;
