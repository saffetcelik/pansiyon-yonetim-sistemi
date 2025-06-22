import React, { useState } from 'react';
import CustomerList from '../components/CustomerList';
import CustomerModal from '../components/CustomerModal';

const Customers = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleCreateCustomer = () => {
    setShowCreateModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Müşteri Yönetimi</h1>
          <p className="mt-2 text-gray-600">
            Tüm müşterileri görüntüleyin, düzenleyin ve yönetin.
          </p>
        </div>

        {/* Customer List */}
        <CustomerList
          onCreateCustomer={handleCreateCustomer}
          onEditCustomer={handleEditCustomer}
        />

        {/* Customer Modals */}
        <CustomerModal
          isOpen={showCreateModal}
          onClose={handleCloseModals}
          isEdit={false}
        />

        <CustomerModal
          isOpen={showEditModal}
          onClose={handleCloseModals}
          customer={selectedCustomer}
          isEdit={true}
        />
      </div>
    </div>
  );
};

export default Customers;
