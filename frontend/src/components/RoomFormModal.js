import React, { useState, useEffect } from 'react';
// Bu kütüphanenin yüklü olduğundan emin olun: npm install react-number-format
import { NumericFormat } from 'react-number-format';

const RoomFormModal = ({ room, rooms, onClose, onSave }) => {
  const getInitialFormData = () => {
    if (room) {
      return {
        id: room.id,
        roomNumber: room.roomNumber || '',
        capacity: room.capacity || 1,
        pricePerNight: room.pricePerNight || 0,
        hasSeaView: room.hasSeaView || false,
        hasBalcony: room.hasBalcony || false,
        hasAirConditioning: room.hasAirConditioning || false,
      };
    }
    return {
      roomNumber: '',
      capacity: 1,
      pricePerNight: 0,
      hasSeaView: false,
      hasBalcony: false,
      hasAirConditioning: false,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [roomNumberError, setRoomNumberError] = useState('');

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [room]);

  // Oda numarası doğrulaması
  useEffect(() => {
    if (!formData.roomNumber) {
      setRoomNumberError('');
      return;
    }
    const isDuplicate = rooms.some(
      r => r.roomNumber === formData.roomNumber && r.id !== formData.id
    );
    if (isDuplicate) {
      setRoomNumberError('Bu oda numarası zaten kullanılıyor.');
    } else {
      setRoomNumberError('');
    }
  }, [formData.roomNumber, rooms, formData.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePriceChange = (values) => {
    const { floatValue } = values;
    setFormData(prev => ({ ...prev, pricePerNight: floatValue || 0 }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomNumberError) return; // Hata varsa kaydetmeyi engelle
    onSave(formData);
  };

  return (
    <div className="modal-backdrop active">
      <div className="modal-content">
        <h2>{room ? 'Odayı Düzenle' : 'Yeni Oda Ekle'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Oda Numarası</label>
            <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} required />
            {roomNumberError && <p className="form-error">{roomNumberError}</p>}
          </div>
          <div className="form-group">
            <label>Kapasite</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required min="1" />
          </div>
          <div className="form-group">
            <label>Gecelik Fiyat (₺)</label>
            <NumericFormat
              name="pricePerNight"
              value={formData.pricePerNight}
              onValueChange={handlePriceChange}
              thousandSeparator="."
              decimalSeparator=","
              prefix={'₺ '}
              decimalScale={2}
              fixedDecimalScale
              className="numeric-input"
              required
            />
          </div>
          <div className="form-group-checkbox">
              <input type="checkbox" id="hasSeaView" name="hasSeaView" checked={formData.hasSeaView} onChange={handleChange} />
              <label htmlFor="hasSeaView">Deniz Manzarası</label>
          </div>
          <div className="form-group-checkbox">
              <input type="checkbox" id="hasBalcony" name="hasBalcony" checked={formData.hasBalcony} onChange={handleChange} />
              <label htmlFor="hasBalcony">Balkon</label>
          </div>
          <div className="form-group-checkbox">
              <input type="checkbox" id="hasAirConditioning" name="hasAirConditioning" checked={formData.hasAirConditioning} onChange={handleChange} />
              <label htmlFor="hasAirConditioning">Klima</label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={!!roomNumberError}>Kaydet</button>
            <button type="button" onClick={onClose} className="btn-secondary">İptal</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;
