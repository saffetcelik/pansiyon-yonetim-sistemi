import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRooms } from '../store/roomSlice';
import { ROOM_STATUS_NAMES, ROOM_STATUS_COLORS } from '../services/roomService';

const RoomStatusList = () => {
  const dispatch = useDispatch();
  const { rooms, loading, error } = useSelector((state) => state.rooms);

  useEffect(() => {
    dispatch(fetchRooms());
  }, [dispatch]);

  if (loading) return <div>Odalar yükleniyor...</div>;
  if (error) return <div style={{ color: 'red' }}>Hata: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="rounded-lg shadow p-4 flex flex-col items-start"
          style={{ backgroundColor: '#fff', borderLeft: `6px solid ${ROOM_STATUS_COLORS[room.status]}` }}
        >
          <div className="flex items-center mb-2">
            <span className="font-bold text-lg mr-2">Oda {room.roomNumber}</span>
            <span
              className="px-2 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: ROOM_STATUS_COLORS[room.status], color: '#fff' }}
            >
              {ROOM_STATUS_NAMES[room.status]}
            </span>
          </div>
          <div className="text-sm text-gray-600">Kapasite: {room.capacity}</div>
          <div className="text-sm text-gray-600">₺{room.pricePerNight}/gece</div>
        </div>
      ))}
    </div>
  );
};

export default RoomStatusList;
