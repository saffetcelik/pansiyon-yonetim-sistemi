import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRooms, updateRoomStatus } from '../store/roomSlice';
import { ROOM_STATUS, ROOM_STATUS_NAMES, ROOM_STATUS_COLORS } from '../services/roomService';

const RoomPanel = () => {
  const dispatch = useDispatch();
  const { rooms, loading, error } = useSelector((state) => state.rooms);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);

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
            onMouseEnter={() => setHoveredRoom(room.id)}
            onMouseLeave={() => setHoveredRoom(null)}
            className="room-card"
            style={{
              border: '2px solid #ddd',
              borderRadius: '12px',
              padding: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: selectedRoom?.id === room.id ? '#e3f2fd' :
                             hoveredRoom === room.id ? '#f8f9fa' : 'white',
              borderColor: selectedRoom?.id === room.id ? '#2196f3' :
                          hoveredRoom === room.id ? getRoomStatusColor(room.status) : '#ddd',
              boxShadow: selectedRoom?.id === room.id ? '0 8px 25px rgba(33, 150, 243, 0.4)' :
                        hoveredRoom === room.id ? '0 6px 20px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
              transform: selectedRoom?.id === room.id ? 'translateY(-4px) scale(1.02)' :
                        hoveredRoom === room.id ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Hover glow effect */}
            {hoveredRoom === room.id && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(45deg, ${getRoomStatusColor(room.status)}20, transparent)`,
                borderRadius: '12px',
                pointerEvents: 'none',
                opacity: 0.3
              }} />
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              position: 'relative',
              zIndex: 1
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                color: '#333',
                transition: 'color 0.3s ease',
                fontWeight: hoveredRoom === room.id ? '600' : '500'
              }}>
                Oda {room.roomNumber}
              </h3>
              <span style={{
                fontSize: hoveredRoom === room.id ? '24px' : '20px',
                transition: 'all 0.3s ease',
                transform: hoveredRoom === room.id ? 'rotate(10deg)' : 'rotate(0deg)'
              }}>
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
              marginBottom: '10px',
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.3s ease',
              transform: hoveredRoom === room.id ? 'scale(1.05)' : 'scale(1)',
              boxShadow: hoveredRoom === room.id ? `0 4px 12px ${getRoomStatusColor(room.status)}40` : 'none'
            }}>
              {ROOM_STATUS_NAMES[room.status]}
            </div>

            <div style={{
              fontSize: '12px',
              color: hoveredRoom === room.id ? '#555' : '#666',
              position: 'relative',
              zIndex: 1,
              transition: 'color 0.3s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '4px',
                transition: 'transform 0.3s ease',
                transform: hoveredRoom === room.id ? 'translateX(2px)' : 'translateX(0)'
              }}>
                <span style={{ marginRight: '4px' }}>👥</span>
                {room.capacity} kişilik
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '4px',
                transition: 'transform 0.3s ease',
                transform: hoveredRoom === room.id ? 'translateX(2px)' : 'translateX(0)',
                fontWeight: hoveredRoom === room.id ? '600' : '400'
              }}>
                <span style={{ marginRight: '4px' }}>💰</span>
                ₺{room.pricePerNight}/gece
              </div>
              {room.hasSeaView && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '4px',
                  transition: 'transform 0.3s ease',
                  transform: hoveredRoom === room.id ? 'translateX(2px)' : 'translateX(0)'
                }}>
                  <span style={{ marginRight: '4px' }}>🌊</span>
                  Deniz manzarası
                </div>
              )}
              {room.hasBalcony && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '4px',
                  transition: 'transform 0.3s ease',
                  transform: hoveredRoom === room.id ? 'translateX(2px)' : 'translateX(0)'
                }}>
                  <span style={{ marginRight: '4px' }}>🏖️</span>
                  Balkon
                </div>
              )}
              {room.hasAirConditioning && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.3s ease',
                  transform: hoveredRoom === room.id ? 'translateX(2px)' : 'translateX(0)'
                }}>
                  <span style={{ marginRight: '4px' }}>❄️</span>
                  Klima
                </div>
              )}
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
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'scale(1)',
                    boxShadow: parseInt(status) === selectedRoom.status ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (parseInt(status) !== selectedRoom.status) {
                      e.target.style.transform = 'scale(1.02) translateY(-1px)';
                      e.target.style.boxShadow = `0 4px 12px ${getRoomStatusColor(parseInt(status))}40`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (parseInt(status) !== selectedRoom.status) {
                      e.target.style.transform = 'scale(1) translateY(0)';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    marginRight: '8px',
                    transition: 'transform 0.3s ease'
                  }}>
                    {getRoomIcon(parseInt(status))}
                  </span>
                  {name}
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
                fontSize: '14px',
                transition: 'all 0.3s ease',
                transform: 'scale(1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.borderColor = '#adb5bd';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#ddd';
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
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05) translateY(-2px)';
                  e.target.style.boxShadow = `0 6px 20px ${getRoomStatusColor(parseInt(status))}40`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1) translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <span style={{
                  display: 'inline-block',
                  marginRight: '8px',
                  transition: 'transform 0.3s ease'
                }}>
                  {getRoomIcon(parseInt(status))}
                </span>
                {name}: {count}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoomPanel;
