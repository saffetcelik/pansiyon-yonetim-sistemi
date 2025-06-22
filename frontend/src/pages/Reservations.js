import React, { useState } from 'react';
import ReservationList from '../components/ReservationList';
import ReservationModal from '../components/ReservationModal';
import ReservationCalendar from '../components/ReservationCalendar';

const Reservations = () => {
  const [activeView, setActiveView] = useState('list'); // 'list' or 'calendar'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleCreateReservation = () => {
    setShowCreateModal(true);
  };

  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedReservation(null);
  };

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rezervasyon Yönetimi</h1>
              <p className="mt-2 text-gray-600">
                Tüm rezervasyonları görüntüleyin, düzenleyin ve yönetin.
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('list')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeView === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Liste
              </button>
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeView === 'calendar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📅 Takvim
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeView === 'list' ? (
          <ReservationList
            onCreateReservation={handleCreateReservation}
            onEditReservation={handleEditReservation}
          />
        ) : (
          <ReservationCalendar
            onReservationClick={handleReservationClick}
          />
        )}

        {/* Reservation Modals */}
        <ReservationModal
          isOpen={showCreateModal}
          onClose={handleCloseModals}
          isEdit={false}
        />

        <ReservationModal
          isOpen={showEditModal}
          onClose={handleCloseModals}
          reservation={selectedReservation}
          isEdit={true}
        />
      </div>
    </div>
  );
};

export default Reservations;
