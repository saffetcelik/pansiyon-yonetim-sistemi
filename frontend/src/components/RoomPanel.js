import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRooms, updateRoomStatus } from '../store/roomSlice';
import { ROOM_STATUS, ROOM_STATUS_NAMES, ROOM_STATUS_COLORS } from '../services/roomService';

const RoomPanel = () => {
  const dispatch = useDispatch();
  const { rooms, loading, error } = useSelector((state) => state.rooms);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    dispatch(fetchRooms());
  }, [dispatch]);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await dispatch(updateRoomStatus({ roomId, status: newStatus })).unwrap();
      setSelectedRoom(null);
    } catch (error) {
      console.error('Oda durumu güncellenemedi:', error);
    }
  };

  const getRoomStatusColor = (status) => {
    return ROOM_STATUS_COLORS[status] || '#gray';
  };

  const getRoomIcon = (status) => {
    switch (status) {
      case ROOM_STATUS.AVAILABLE:
        return '✅';
      case ROOM_STATUS.OCCUPIED:
        return '🔴';
      case ROOM_STATUS.CLEANING:
        return '🧹';
      case ROOM_STATUS.MAINTENANCE:
        return '🔧';
      case ROOM_STATUS.OUT_OF_ORDER:
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div>Odalar yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        background: '#ffebee', 
        color: '#c62828', 
        borderRadius: '8px',
        margin: '20px'
      }}>
        Hata: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>
        🏨 Oda Durumu Paneli ({rooms.length} Oda)
      </h2>

      {/* Room Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => handleRoomClick(room)}
            style={{
              border: '2px solid #ddd',
              borderRadius: '12px',
              padding: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: selectedRoom?.id === room.id ? '#e3f2fd' : 'white',
              borderColor: selectedRoom?.id === room.id ? '#2196f3' : getRoomStatusColor(room.status),
              boxShadow: selectedRoom?.id === room.id ? '0 4px 12px rgba(33, 150, 243, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
              transform: selectedRoom?.id === room.id ? 'translateY(-2px)' : 'none'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px',
                color: '#333'
              }}>
                Oda {room.roomNumber}
              </h3>
              <span style={{ fontSize: '20px' }}>
                {getRoomIcon(room.status)}
              </span>
            </div>

            <div style={{
              padding: '8px 12px',
              borderRadius: '20px',
              backgroundColor: getRoomStatusColor(room.status),
              color: 'white',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              {ROOM_STATUS_NAMES[room.status]}
            </div>

            <div style={{ fontSize: '12px', color: '#666' }}>
              <div>👥 {room.capacity} kişilik</div>
              <div>💰 ₺{room.pricePerNight}/gece</div>
              {room.hasSeaView && <div>🌊 Deniz manzarası</div>}
              {room.hasBalcony && <div>🏖️ Balkon</div>}
              {room.hasAirConditioning && <div>❄️ Klima</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Status Change Modal */}
      {selectedRoom && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>
              Oda {selectedRoom.roomNumber} - Durum Değiştir
            </h3>
            
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Şu anki durum: <strong>{ROOM_STATUS_NAMES[selectedRoom.status]}</strong>
            </p>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Yeni durum seçin:</p>
              {Object.entries(ROOM_STATUS_NAMES).map(([status, name]) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(selectedRoom.id, parseInt(status))}
                  disabled={parseInt(status) === selectedRoom.status}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px',
                    margin: '5px 0',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: parseInt(status) === selectedRoom.status 
                      ? '#f5f5f5' 
                      : getRoomStatusColor(parseInt(status)),
                    color: parseInt(status) === selectedRoom.status ? '#999' : 'white',
                    cursor: parseInt(status) === selectedRoom.status ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {getRoomIcon(parseInt(status))} {name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedRoom(null)}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>📊 Durum Özeti</h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          {Object.entries(ROOM_STATUS_NAMES).map(([status, name]) => {
            const count = rooms.filter(room => room.status === parseInt(status)).length;
            return (
              <div
                key={status}
                style={{
                  padding: '10px 15px',
                  borderRadius: '20px',
                  backgroundColor: getRoomStatusColor(parseInt(status)),
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {getRoomIcon(parseInt(status))} {name}: {count}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoomPanel;
