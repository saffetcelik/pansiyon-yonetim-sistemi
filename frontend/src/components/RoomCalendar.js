import React, { useState, useEffect, useRef } from 'react';
import { reservationService, roomService } from '../services/api';
import '../styles/calendar.css';

const RoomCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('horizontal');
  const printFrameRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const [reservationsRes, roomsRes] = await Promise.all([
        reservationService.getCalendar(month, year),
        roomService.getAll()
      ]);
      
      const sortedRooms = [...(roomsRes.data || [])].sort((a, b) => 
        parseInt(a.roomNumber) - parseInt(b.roomNumber)
      );
      
      setReservations(reservationsRes.data || []);
      setRooms(sortedRooms);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const isRoomReserved = (roomNumber, date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.find(reservation => {
      const checkIn = new Date(reservation.checkInDate).toISOString().split('T')[0];
      const checkOut = new Date(reservation.checkOutDate).toISOString().split('T')[0];
      return reservation.roomNumber === roomNumber && dateStr >= checkIn && dateStr < checkOut;
    });
  };

  const getReservationStyle = (reservation) => {
    if (!reservation) return '';
    const colors = {
      0: 'bg-yellow-200 text-yellow-800',
      1: 'bg-blue-200 text-blue-800',
      2: 'bg-green-200 text-green-800',
      3: 'bg-gray-200 text-gray-800',
      4: 'bg-red-200 text-red-800',
      5: 'bg-red-300 text-red-900',
    };
    return colors[reservation.status] || 'bg-gray-200 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      0: 'Beklemede', 1: 'Onaylandı', 2: 'Giriş Yapıldı',
      3: 'Çıkış Yapıldı', 4: 'İptal Edildi', 5: 'Gelmedi'
    };
    return labels[status] || 'Bilinmiyor';
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const formatMonthYear = (date) =>
    date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });

  const days = getDaysInMonth();

  // ─── PDF / Print ────────────────────────────────────────────────────────────
  const buildPrintHtml = () => {
    const monthLabel = formatMonthYear(currentDate);
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const statusColors = {
      0: '#fef9c3', 1: '#dbeafe', 2: '#dcfce7',
      3: '#f3f4f6', 4: '#fee2e2', 5: '#fecaca'
    };

    // Yatay tablo: Odalar satır, günler sütun
    const colWidths = `<col style="width:120px">` + days.map(() => `<col style="width:${Math.max(28, Math.floor(650 / days.length))}px">`).join('');

    const headerDays = days.map(d => {
      const isToday = d.toDateString() === new Date().toDateString();
      return `<th style="text-align:center;font-size:9px;padding:3px 1px;background:${isToday ? '#3b82f6' : '#6366f1'};color:white;border:1px solid #ccc">
        <div>${d.getDate()}</div>
        <div style="opacity:.8">${dayNames[d.getDay()]}</div>
      </th>`;
    }).join('');

    const roomRows = rooms.map(room => {
      const cells = days.map(date => {
        const res = isRoomReserved(room.roomNumber, date);
        if (!res) return `<td style="border:1px solid #e5e7eb;background:#f9fafb"></td>`;
        const name = (res.reservationName && res.reservationName.trim())
          || (res.customerName && res.customerName.trim())
          || `Oda ${res.roomNumber}`;
        const bg = statusColors[res.status] || '#f3f4f6';
        return `<td style="border:1px solid #e5e7eb;background:${bg};padding:2px;font-size:8px;text-align:center;overflow:hidden" title="${name}">
          <div style="font-weight:600;overflow:hidden;max-height:28px">${name.length > 8 ? name.substring(0, 7) + '…' : name}</div>
        </td>`;
      }).join('');
      return `<tr>
        <td style="border:1px solid #e5e7eb;padding:4px 6px;font-weight:600;font-size:10px;background:#f8fafc;white-space:nowrap">
          Oda ${room.roomNumber}
          <div style="font-size:8px;color:#6b7280;font-weight:400">${room.capacity || ''}  kişilik</div>
        </td>
        ${cells}
      </tr>`;
    }).join('');

    // Özet tablosu
    const summary = rooms.map(room => {
      const roomRes = reservations.filter(r => r.roomNumber === room.roomNumber);
      const confirmed = roomRes.filter(r => r.status === 1).length;
      const checkedIn = roomRes.filter(r => r.status === 2).length;
      const pending = roomRes.filter(r => r.status === 0).length;
      const totalGuests = roomRes.reduce((sum, r) => sum + (r.numberOfGuests || 1), 0);
      return `<tr>
        <td style="padding:5px 8px;border:1px solid #e5e7eb;font-weight:600">Oda ${room.roomNumber}</td>
        <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center">${roomRes.length}</td>
        <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;color:#2563eb">${confirmed}</td>
        <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;color:#16a34a">${checkedIn}</td>
        <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;color:#ca8a04">${pending}</td>
        <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center">${totalGuests}</td>
      </tr>`;
    }).join('');

    return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>Güneş Pansiyon — Oda Takvimi ${monthLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #1f2937; padding: 16px; }
  h1 { font-size: 16px; font-weight: 700; color: #1e1b4b; }
  h2 { font-size: 12px; font-weight: 600; color: #374151; margin-top: 20px; margin-bottom: 6px; }
  .header { border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-right { text-align: right; font-size: 9px; color: #6b7280; }
  table { border-collapse: collapse; width: 100%; }
  .legend { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px; font-size: 9px; }
  .legend-item { display: flex; align-items: center; gap: 4px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 2px; }
  @media print { @page { size: A4 landscape; margin: 10mm; } }
</style></head><body>
<div class="header">
  <div>
    <h1>🏨 Güneş Pansiyon — Oda Takvimi</h1>
    <p style="color:#6b7280;font-size:9px;margin-top:4px">Dönem: ${monthLabel} | Oda Sayısı: ${rooms.length} | Toplam Rezervasyon: ${reservations.length}</p>
  </div>
  <div class="header-right">
    <p>Yazdırma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
    <p>${new Date().toLocaleTimeString('tr-TR')}</p>
  </div>
</div>

<h2>📅 Rezervasyon Matrisi</h2>
<div style="overflow:hidden">
  <table>
    <colgroup>${colWidths}</colgroup>
    <thead>
      <tr>
        <th style="text-align:left;padding:5px 6px;background:#6366f1;color:white;border:1px solid #ccc;font-size:10px">Oda</th>
        ${headerDays}
      </tr>
    </thead>
    <tbody>${roomRows}</tbody>
  </table>
</div>

<div class="legend">
  <div class="legend-item"><div class="legend-dot" style="background:#fef9c3"></div>Beklemede</div>
  <div class="legend-item"><div class="legend-dot" style="background:#dbeafe"></div>Onaylandı</div>
  <div class="legend-item"><div class="legend-dot" style="background:#dcfce7"></div>Giriş Yapıldı</div>
  <div class="legend-item"><div class="legend-dot" style="background:#f3f4f6"></div>Çıkış Yapıldı</div>
  <div class="legend-item"><div class="legend-dot" style="background:#fee2e2"></div>İptal/Gelmedi</div>
</div>

<h2 style="margin-top:24px">📊 Oda Özet Raporu — ${monthLabel}</h2>
<table>
  <thead>
    <tr style="background:#6366f1;color:white">
      <th style="padding:5px 8px;border:1px solid #ccc;text-align:left">Oda</th>
      <th style="padding:5px 8px;border:1px solid #ccc;text-align:center">Toplam Rezervasyon</th>
      <th style="padding:5px 8px;border:1px solid #ccc;text-align:center">Onaylandı</th>
      <th style="padding:5px 8px;border:1px solid #ccc;text-align:center">Giriş Yapıldı</th>
      <th style="padding:5px 8px;border:1px solid #ccc;text-align:center">Beklemede</th>
      <th style="padding:5px 8px;border:1px solid #ccc;text-align:center">Toplam Misafir</th>
    </tr>
  </thead>
  <tbody>${summary}</tbody>
</table>
</body></html>`;
  };

  const handlePrint = () => {
    const html = buildPrintHtml();
    const win = window.open('', '_blank', 'width=1100,height=800');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  };

  const handlePdfDownload = () => {
    const html = buildPrintHtml();
    const win = window.open('', '_blank', 'width=1100,height=800');
    win.document.write(html);
    win.document.close();
    win.focus();
    // Kullanıcı tarayıcıdan "PDF olarak kaydet" seçeneğiyle kaydedebilir
    setTimeout(() => { win.print(); }, 600);
  };
  // ────────────────────────────────────────────────────────────────────────────

  const renderReservationCell = (room, date) => {
    const reservation = isRoomReserved(room.roomNumber, date);
    const displayName = reservation
      ? (reservation.reservationName && reservation.reservationName.trim())
        || (reservation.customerName && reservation.customerName.trim())
        || (reservation.customers && reservation.customers.length > 0
          ? `${reservation.customers[0].firstName || reservation.customers[0].customerName || ''} ${reservation.customers[0].lastName || ''}`.trim()
          : '')
        || `Oda ${reservation.roomNumber}`
      : '';

    return (
      <div
        className={`border-b border-r p-1.5 min-h-[44px] flex flex-col justify-center ${
          reservation
            ? `${getReservationStyle(reservation)} cursor-pointer font-medium`
            : 'hover:bg-gray-50'
        }`}
        title={
          reservation
            ? `${displayName}\nOda: ${reservation.roomNumber}\nGiriş: ${new Date(reservation.checkInDate).toLocaleDateString('tr-TR')}\nÇıkış: ${new Date(reservation.checkOutDate).toLocaleDateString('tr-TR')}\nDurum: ${getStatusLabel(reservation.status)}`
            : 'Müsait'
        }
      >
        {reservation && (
          <>
            <div className="text-[11px] leading-tight font-bold truncate">{displayName}</div>
            <div className="text-[10px] leading-tight truncate opacity-85 mt-0.5">
              👥 {reservation.numberOfGuests || 1} misafir
            </div>
          </>
        )}
      </div>
    );
  };

  const renderRoomInfo = (room) => (
    <div className="font-medium min-w-[150px]">
      <div className="font-medium">Oda {room.roomNumber}</div>
      <div className="text-xs text-gray-500">
        {room.roomType} · {room.capacity} kişilik
      </div>
      <div className="text-xs">
        <span className="font-medium text-green-600">{room.pricePerNight} ₺</span>
        <span className="text-gray-500"> / gece</span>
      </div>
    </div>
  );

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
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">Oda Takvimi</h2>
            <div className="no-print flex items-center space-x-4 bg-white bg-opacity-20 rounded-lg p-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="viewMode"
                  value="horizontal"
                  checked={viewMode === 'horizontal'}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="form-radio text-white border-white focus:ring-white"
                />
                <span className="text-white text-sm font-medium">Yatay Görünüm</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="viewMode"
                  value="vertical"
                  checked={viewMode === 'vertical'}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="form-radio text-white border-white focus:ring-white"
                />
                <span className="text-white text-sm font-medium">Dikey Görünüm</span>
              </label>
            </div>
          </div>
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
              className="no-print bg-white text-indigo-600 px-3 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors ml-2"
            >
              Bugün
            </button>

            <button
              onClick={handlePdfDownload}
              className="no-print bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-1.5 ml-2 text-sm"
              title="PDF olarak kaydet"
            >
              📄 <span>PDF İndir</span>
            </button>

            <button
              onClick={handlePrint}
              className="no-print bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-1.5 ml-1 text-sm"
              title="Yazıcı çıktısı al"
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

      {/* Calendar Grid */}
      <div className="p-6 overflow-x-auto">
        <div className="min-w-max">
          {viewMode === 'horizontal' ? (
            <div className="grid" style={{ gridTemplateColumns: 'minmax(150px, auto) repeat(' + days.length + ', minmax(40px, 1fr))' }}>
              <div className="sticky left-0 z-10 bg-white border-b font-medium p-2">Oda</div>
              {days.map((date, index) => (
                <div
                  key={index}
                  className={`text-center border-b p-2 ${
                    date.toDateString() === new Date().toDateString()
                      ? 'bg-blue-50 font-bold text-blue-600'
                      : ''
                  }`}
                >
                  {date.getDate()}
                </div>
              ))}
              {rooms.map((room) => (
                <React.Fragment key={room.id}>
                  <div className="sticky left-0 z-10 bg-white border-b border-r p-2">
                    {renderRoomInfo(room)}
                  </div>
                  {days.map((date, dateIndex) => (
                    <React.Fragment key={dateIndex}>
                      {renderReservationCell(room, date)}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: `repeat(${rooms.length + 1}, minmax(150px, 1fr))` }}>
              <div className="sticky top-0 z-10 bg-white border-b font-medium p-2">Tarih</div>
              {rooms.map((room) => (
                <div key={room.id} className="sticky top-0 z-10 bg-white border-b border-r p-2">
                  {renderRoomInfo(room)}
                </div>
              ))}
              {days.map((date, dateIndex) => (
                <React.Fragment key={dateIndex}>
                  <div
                    className={`border-b border-r p-2 ${
                      date.toDateString() === new Date().toDateString()
                        ? 'bg-blue-50 font-bold text-blue-600'
                        : ''
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  {rooms.map((room) => (
                    <React.Fragment key={room.id}>
                      {renderReservationCell(room, date)}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex flex-wrap gap-4 text-xs">
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
    </div>
  );
};

export default RoomCalendar;
