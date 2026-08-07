import React, { useState, useEffect } from 'react';
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
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
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
      0: 'bg-yellow-200 text-yellow-800',
      1: 'bg-blue-200 text-blue-800',
      2: 'bg-green-200 text-green-800',
      3: 'bg-gray-200 text-gray-800',
      4: 'bg-red-200 text-red-800',
      5: 'bg-red-300 text-red-900',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const formatMonthYear = (date) =>
    date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  // ─── PDF / Print ────────────────────────────────────────────────────────────
  const buildPrintHtml = () => {
    const monthLabel = formatMonthYear(currentDate);
    const statusColors = {
      0: '#fef9c3', 1: '#dbeafe', 2: '#dcfce7',
      3: '#f3f4f6', 4: '#fee2e2', 5: '#fecaca'
    };
    const statusLabels = {
      0: 'Beklemede', 1: 'Onaylandı', 2: 'Giriş Yapıldı',
      3: 'Çıkış Yapıldı', 4: 'İptal', 5: 'Gelmedi'
    };

    // Tüm rezervasyonları tarih sırasına göre listele
    const sortedReservations = [...calendarData].sort(
      (a, b) => new Date(a.checkInDate) - new Date(b.checkInDate)
    );

    const resRows = sortedReservations.map((r, i) => {
      const name = (r.reservationName && r.reservationName.trim())
        || (r.customerName && r.customerName.trim())
        || 'Misafir';
      const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
      const statusBg = statusColors[r.status] || '#f3f4f6';
      const nights = Math.max(0, Math.round((new Date(r.checkOutDate) - new Date(r.checkInDate)) / 86400000));
      return `<tr style="background:${bg}">
        <td style="padding:6px 8px;border:1px solid #e5e7eb">${i + 1}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:600">${name}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center">${r.roomNumber || '-'}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center">${new Date(r.checkInDate).toLocaleDateString('tr-TR')}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center">${new Date(r.checkOutDate).toLocaleDateString('tr-TR')}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center">${nights} gece</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center">
          <span style="background:${statusBg};padding:2px 6px;border-radius:4px;font-size:9px;font-weight:600">${statusLabels[r.status] || '?'}</span>
        </td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right">${r.totalAmount ? r.totalAmount.toLocaleString('tr-TR') + ' ₺' : '-'}</td>
      </tr>`;
    }).join('');

    const totalAmount = sortedReservations.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const confirmed = calendarData.filter(r => r.status === 1).length;
    const checkedIn = calendarData.filter(r => r.status === 2).length;
    const pending = calendarData.filter(r => r.status === 0).length;

    return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>Güneş Pansiyon — Rezervasyon Takvimi ${monthLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #1f2937; padding: 16px; }
  h1 { font-size: 16px; font-weight: 700; color: #4c1d95; }
  h2 { font-size: 12px; font-weight: 600; color: #374151; margin-top: 20px; margin-bottom: 6px; }
  .header { border-bottom: 2px solid #7c3aed; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-right { text-align: right; font-size: 9px; color: #6b7280; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
  .stat-card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; text-align: center; }
  .stat-val { font-size: 18px; font-weight: 700; }
  .stat-lbl { font-size: 8px; color: #6b7280; margin-top: 2px; }
  table { border-collapse: collapse; width: 100%; }
  thead { background: #7c3aed; color: white; }
  thead th { padding: 6px 8px; border: 1px solid #6d28d9; text-align: left; font-size: 9px; }
  .legend { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px; font-size: 9px; }
  .legend-item { display: flex; align-items: center; gap: 4px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 2px; }
  @media print { @page { size: A4; margin: 10mm; } }
</style></head><body>
<div class="header">
  <div>
    <h1>🏨 Güneş Pansiyon — Rezervasyon Raporu</h1>
    <p style="color:#6b7280;font-size:9px;margin-top:4px">Dönem: ${monthLabel}</p>
  </div>
  <div class="header-right">
    <p>Yazdırma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
    <p>${new Date().toLocaleTimeString('tr-TR')}</p>
  </div>
</div>

<div class="stats">
  <div class="stat-card"><div class="stat-val" style="color:#7c3aed">${calendarData.length}</div><div class="stat-lbl">Toplam Rezervasyon</div></div>
  <div class="stat-card"><div class="stat-val" style="color:#2563eb">${confirmed}</div><div class="stat-lbl">Onaylandı</div></div>
  <div class="stat-card"><div class="stat-val" style="color:#16a34a">${checkedIn}</div><div class="stat-lbl">Giriş Yapıldı</div></div>
  <div class="stat-card"><div class="stat-val" style="color:#ca8a04">${pending}</div><div class="stat-lbl">Beklemede</div></div>
</div>

<h2>📋 Rezervasyon Listesi — ${monthLabel}</h2>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Misafir / Rezervasyon Adı</th>
      <th style="text-align:center">Oda</th>
      <th style="text-align:center">Giriş</th>
      <th style="text-align:center">Çıkış</th>
      <th style="text-align:center">Süre</th>
      <th style="text-align:center">Durum</th>
      <th style="text-align:right">Tutar</th>
    </tr>
  </thead>
  <tbody>
    ${resRows}
    <tr style="background:#f3f4f6;font-weight:700">
      <td colspan="7" style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right">TOPLAM</td>
      <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right">${totalAmount.toLocaleString('tr-TR')} ₺</td>
    </tr>
  </tbody>
</table>

<div class="legend">
  <div class="legend-item"><div class="legend-dot" style="background:#fef9c3"></div>Beklemede</div>
  <div class="legend-item"><div class="legend-dot" style="background:#dbeafe"></div>Onaylandı</div>
  <div class="legend-item"><div class="legend-dot" style="background:#dcfce7"></div>Giriş Yapıldı</div>
  <div class="legend-item"><div class="legend-dot" style="background:#f3f4f6"></div>Çıkış Yapıldı</div>
  <div class="legend-item"><div class="legend-dot" style="background:#fee2e2"></div>İptal/Gelmedi</div>
</div>
</body></html>`;
  };

  const handlePrint = () => {
    const html = buildPrintHtml();
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  };

  const handlePdfDownload = () => {
    const html = buildPrintHtml();
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  };
  // ────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="printable-area bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-xl font-semibold text-white">Rezervasyon Takvimi</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="no-print bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-white font-bold text-lg min-w-[180px] text-center">
              {formatMonthYear(currentDate)}
            </div>
            
            <button
              onClick={() => navigateMonth(1)}
              className="no-print bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={goToToday}
              className="no-print bg-white text-purple-600 px-3 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors ml-2"
            >
              Bugün
            </button>

            <button
              onClick={handlePdfDownload}
              className="no-print bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-1.5 ml-2 text-sm"
              title="PDF belgesi indir / kaydet"
            >
              📄 <span>PDF İndir</span>
            </button>

            <button
              onClick={handlePrint}
              className="no-print bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-1.5 ml-1 text-sm"
              title="Takvimi yazdır"
            >
              🖨️ <span>Yazdır</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Calendar */}
      <div className="p-4 sm:p-6 w-full">
        <div className="w-full max-h-[75vh] overflow-y-auto custom-scrollbar pr-1 lg:pr-2">
          {/* Week Days Header */}
          <div className="hidden lg:grid grid-cols-7 gap-2 mb-2 sticky top-0 z-20 bg-white pb-2">
            {weekDays.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-bold text-gray-600 bg-gray-50 rounded-lg border shadow-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 lg:gap-2">
          {days.map((date, index) => {
            const dayReservations = getReservationsForDate(date);
            const isCurrentDay = isToday(date);

            return (
              <div
                key={index}
                className={`min-h-[100px] lg:min-h-[120px] border border-gray-200 p-2 lg:p-1 rounded-lg lg:rounded-none ${
                  !date ? 'hidden lg:block bg-gray-50' : 'bg-white shadow-sm lg:shadow-none'
                } ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
              >
                {date && (
                  <>
                    <div className={`text-sm font-medium mb-2 lg:mb-1 pb-1 lg:pb-0 lg:border-0 border-b border-gray-100 ${
                      isCurrentDay ? 'text-blue-600 font-bold' : 'text-gray-900'
                    }`}>
                      <span className="lg:hidden">
                        {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                      </span>
                      <span className="hidden lg:inline">
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1.5 lg:space-y-1 lg:max-h-[160px] lg:overflow-y-auto custom-scrollbar">
                      {dayReservations.map((reservation) => {
                        const displayName =
                          (reservation.reservationName && reservation.reservationName.trim()) ||
                          (reservation.customerName && reservation.customerName.trim()) ||
                          (reservation.customers && reservation.customers.length > 0
                            ? `${reservation.customers[0].firstName || reservation.customers[0].customerName || ''} ${reservation.customers[0].lastName || ''}`.trim()
                            : '') ||
                          `Oda ${reservation.roomNumber}`;

                        return (
                          <div
                            key={reservation.id}
                            onClick={() => onReservationClick && onReservationClick(reservation)}
                            className={`text-xs p-1.5 rounded-lg cursor-pointer hover:opacity-90 transition-all mb-1 border shadow-xs ${getStatusColor(reservation.status)}`}
                            title={`${displayName} - Oda: ${reservation.roomNumber}`}
                          >
                            <div className="truncate font-bold text-[11px] leading-tight">
                              📋 {displayName}
                            </div>
                            <div className="truncate text-[10px] opacity-90 mt-0.5 font-medium">
                              🛏️ Oda {reservation.roomNumber}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          {[
            ['bg-yellow-200', 'Beklemede'],
            ['bg-blue-200', 'Onaylandı'],
            ['bg-green-200', 'Giriş Yapıldı'],
            ['bg-gray-200', 'Çıkış Yapıldı'],
            ['bg-red-200', 'İptal/Gelmedi'],
          ].map(([color, label]) => (
            <div key={label} className="flex items-center">
              <div className={`w-3 h-3 ${color} rounded mr-2`}></div>
              <span>{label}</span>
            </div>
          ))}
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
