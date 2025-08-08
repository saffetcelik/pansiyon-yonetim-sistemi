import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr as trLocale } from 'date-fns/locale';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('tr', trLocale);

const DateInput = ({ value, onChange, error, placeholder = 'GG/AA/YYYY', clearable = true, minDate, maxDate }) => {
  return (
    <div style={{ position: 'relative' }}>
      <DatePicker
        selected={value ? new Date(value) : null}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        locale="tr"
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholder}
        className={`w-full !pl-3 !pr-8 py-2 !border !rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
        wrapperClassName={error ? 'date-picker-error' : 'date-picker-normal'}
      />
      {/* Çarpı takvim ikonunun hemen solunda */}
      {clearable && value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            position: 'absolute',
            right: '32px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#9CA3AF'
          }}
          tabIndex={-1}
        >
          <FaTimes size={16} />
        </button>
      )}
      <FaCalendarAlt 
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9CA3AF',
          pointerEvents: 'none'
        }}
        size={16}
      />
    </div>
  );
};

export default DateInput;
