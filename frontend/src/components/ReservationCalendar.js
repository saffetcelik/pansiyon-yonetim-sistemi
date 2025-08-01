import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { reservationService } from '../services/api';
import '../styles/calendar.css';

const ReservationCalendar = ({ onReservationClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const response = await reservationService.getCalendar(month, year);
      setCalendarData(response.data);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setError('Takvim verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getReservationsForDate = (date) => {
    if (!date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return calendarData.filter(reservation => {
      const checkIn = new Date(reservation.checkInDate).toISOString().split('T')[0];
      const checkOut = new Date(reservation.checkOutDate).toISOString().split('T')[0];
      return dateStr >= checkIn && dateStr < checkOut;
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      0: 'bg-yellow-200 text-yellow-800', // Pending
      1: 'bg-blue-200 text-blue-800',     // Confirmed
      2: 'bg-green-200 text-green-800',   // Checked In
      3: 'bg-gray-200 text-gray-800',     // Checked Out
      4: 'bg-red-200 text-red-800',       // Cancelled
      5: 'bg-red-300 text-red-900',       // No Show
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    if (!date) return false;
    return date.getMonth() === currentDate.getMonth();
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

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
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Rezervasyon Takvimi</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-white font-medium min-w-[200px] text-center">
              {formatMonthYear(currentDate)}
            </div>
            
            <button
              onClick={() => navigateMonth(1)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={goToToday}
              className="bg-white text-purple-600 px-3 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors ml-4"
            >
              Bugün
            </button>
          </div>
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

      {/* Calendar */}
      <div className="p-6">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const reservations = getReservationsForDate(date);
            const isCurrentDay = isToday(date);
            const isCurrentMonthDay = isCurrentMonth(date);

            return (
              <div
                key={index}
                className={`min-h-[120px] border border-gray-200 p-1 ${
                  !isCurrentMonthDay ? 'bg-gray-50' : 'bg-white'
                } ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
              >
                {date && (
                  <>
                    {/* Date Number */}
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentDay 
                        ? 'text-blue-600 font-bold' 
                        : isCurrentMonthDay 
                          ? 'text-gray-900' 
                          : 'text-gray-400'
                    }`}>
                      {date.getDate()}
                    </div>

                    {/* Reservations */}
                    <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar">
                      {reservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          onClick={() => onReservationClick && onReservationClick(reservation)}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity mb-1 ${getStatusColor(reservation.status)}`}
                          title={`${reservation.customerName} - ${reservation.roomNumber}`}
                        >
                          <div className="truncate font-medium">
                            {reservation.customerName}
                          </div>
                          <div className="truncate">
                            {reservation.roomNumber}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-200 rounded mr-2"></div>
            <span>Beklemede</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-200 rounded mr-2"></div>
            <span>Onaylandı</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-200 rounded mr-2"></div>
            <span>Giriş Yapıldı</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 rounded mr-2"></div>
            <span>Çıkış Yapıldı</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-200 rounded mr-2"></div>
            <span>İptal/Gelmedi</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {calendarData.filter(r => r.status === 1).length}
            </div>
            <div className="text-sm text-gray-600">Onaylandı</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {calendarData.filter(r => r.status === 2).length}
            </div>
            <div className="text-sm text-gray-600">Giriş Yapıldı</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {calendarData.filter(r => r.status === 0).length}
            </div>
            <div className="text-sm text-gray-600">Beklemede</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {calendarData.length}
            </div>
            <div className="text-sm text-gray-600">Toplam</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationCalendar;
