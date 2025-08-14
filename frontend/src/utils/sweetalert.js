import Swal from 'sweetalert2';

// SweetAlert özel yapılandırması
// Swal objesinin boş olma ihtimaline karşı güvenli bir başlatma
let customSwal;

try {
  // Swal'ın yüklenmesini bekle ve sonra yapılandır
  if (Swal && typeof Swal.mixin === 'function') {
    customSwal = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger'
      },
      buttonsStyling: true,
      showDenyButton: false,
      showCloseButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      reverseButtons: false,
      focusConfirm: true,
    });
  } else {
    console.warn('SweetAlert2 tam olarak yüklenemedi, varsayılan yapılandırma kullanılıyor.');
    customSwal = Swal || { fire: () => Promise.reject(new Error('SweetAlert2 is not available')) };
  }
} catch (error) {
  console.error('SweetAlert2 yapılandırması sırasında hata oluştu:', error);
  // Basit bir polyfill oluştur
  customSwal = {
    fire: (options) => {
      console.error('SweetAlert2 yüklenemedi, dialog gösterilemiyor:', options);
      return Promise.reject(new Error('SweetAlert2 is not available'));
    }
  };
}

// No butonunu tamamen kaldıracak CSS ekle
const addNoButtonStyles = () => {
  const styleId = 'swal-no-button-styles';
  // Eğer stil zaten eklenmediyse ekle
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .swal2-deny, .hidden-button {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        visibility: hidden !important;
        position: absolute !important;
        pointer-events: none !important;
        opacity: 0 !important;
        overflow: hidden !important;
      }
      .swal2-actions {
        gap: 0.5rem !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// Standart SweetAlert onay dialogu
export const confirmDialog = (options) => {
  return customSwal.fire({
    title: options.title || 'Emin misiniz?',
    text: options.text || 'Bu işlemi gerçekleştirmek istediğinize emin misiniz?',
    icon: options.icon || 'warning',
    showCancelButton: true,
    confirmButtonText: options.confirmText || 'Evet',
    cancelButtonText: options.cancelText || 'İptal',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    ...options
  });
};

// Uyarı mesajı
export const alertMessage = (options) => {
  return customSwal.fire({
    title: options.title || 'Dikkat',
    text: options.text || '',
    icon: options.icon || 'info',
    confirmButtonText: options.confirmText || 'Tamam',
    confirmButtonColor: '#dc2626',
    timer: options.timer || undefined,
    timerProgressBar: options.timer ? true : false,
    ...options
  });
};

// Hata mesajı
export const errorMessage = (options) => {
  return customSwal.fire({
    title: options.title || 'Hata',
    text: options.text || 'Bir hata oluştu.',
    icon: 'error',
    confirmButtonText: options.confirmText || 'Tamam',
    confirmButtonColor: '#dc2626',
    ...options
  });
};

// Başarı mesajı
export const successMessage = (options) => {
  return customSwal.fire({
    title: options.title || 'Başarılı',
    text: options.text || 'İşlem başarıyla tamamlandı.',
    icon: 'success',
    confirmButtonText: options.confirmText || 'Tamam',
    confirmButtonColor: '#dc2626',
    timer: options.timer || 2000,
    timerProgressBar: options.timer ? true : false,
    ...options
  });
};

// Sayfa yüklendiğinde stilleri ekle
if (typeof window !== 'undefined') {
  addNoButtonStyles();
}

export default customSwal;
