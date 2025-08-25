import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import customSwal, { confirmDialog, successMessage, errorMessage } from '../utils/sweetalert';

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

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const { token } = useSelector(state => state.auth);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const apiBaseUrl = getBaseUrl();
      const response = await axios.get(`${apiBaseUrl}/product`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.filter(p => p.isActive && p.stockQuantity > 0));
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
      customSwal.fire('Hata', 'Ürünler yüklenirken hata oluştu', 'error');
    }
  };

  const fetchCustomers = async () => {
    try {
      const apiBaseUrl = getBaseUrl();
      const response = await axios.get(`${apiBaseUrl}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Response'un data property'sini kontrol et
      const customerData = response.data.data || response.data;
      setCustomers(Array.isArray(customerData) ? customerData : []);
    } catch (error) {
      console.error('Müşteriler yüklenirken hata:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        customSwal.fire('Uyarı', 'Stok miktarını aştınız!', 'warning');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
        maxStock: product.stockQuantity
      }]);
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stockQuantity) {
      customSwal.fire('Uyarı', 'Stok miktarını aştınız!', 'warning');
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountAmount(0);
    setNotes('');
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    return subtotal - discountAmount;
  };

  const processSale = async () => {
    if (cart.length === 0) {
      customSwal.fire('Uyarı', 'Sepet boş!', 'warning');
      return;
    }

    const total = calculateTotal();
    if (total < 0) {
      customSwal.fire('Uyarı', 'İndirim tutarı toplam tutardan fazla olamaz!', 'warning');
      return;
    }

    setLoading(true);

    try {
      const saleData = {
        customerId: selectedCustomer?.id || null,
        discountAmount: discountAmount,
        paymentMethod: paymentMethod,
        notes: notes,
        saleItems: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };

      const apiBaseUrl = getBaseUrl();
      const response = await axios.post(`${apiBaseUrl}/sale`, saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      customSwal.fire({
        title: 'Satış Tamamlandı!',
        text: `Satış No: ${response.data.saleNumber}`,
        icon: 'success',
        confirmButtonText: 'Tamam'
      });

      clearCart();
      fetchProducts(); // Refresh products to update stock
    } catch (error) {
      console.error('Satış işlemi hatası:', error);
      customSwal.fire('Hata', 'Satış işlemi sırasında hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.categoryName === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(products.map(p => p.categoryName))];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Büfe Satış Noktası</h1>
          <p className="text-gray-600 mt-2">Ürün seçin ve satış işlemini tamamlayın</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Ürünler</h2>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Ürün ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-blue-600 mb-1">
                        ₺{product.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stok: {product.stockQuantity}
                      </p>
                      <div className="mt-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {product.categoryName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Ürün bulunamadı</p>
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Sepet</h2>

              {/* Customer Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri (Opsiyonel)
                </label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === parseInt(e.target.value));
                    setSelectedCustomer(customer || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Müşteri seçin...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items */}
              <div className="mb-4 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Sepet boş</p>
                ) : (
                  cart.map(item => (
                    <div key={item.productId} className="flex items-center justify-between py-2 border-b border-gray-200">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-800">{item.productName}</h4>
                        <p className="text-xs text-gray-500">₺{item.unitPrice.toFixed(2)} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="ml-2 text-right">
                        <p className="font-semibold text-sm">₺{item.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Details */}
              {cart.length > 0 && (
                <div className="space-y-4">
                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İndirim (₺)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ödeme Yöntemi
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Cash">Nakit</option>
                      <option value="Card">Kart</option>
                      <option value="Transfer">Havale</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notlar
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Satış notları..."
                    />
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Ara Toplam:</span>
                      <span>₺{cart.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>İndirim:</span>
                      <span>-₺{discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Toplam:</span>
                      <span>₺{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={processSale}
                      disabled={loading || calculateTotal() < 0}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                    >
                      {loading ? 'İşleniyor...' : 'Satışı Tamamla'}
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Sepeti Temizle
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
