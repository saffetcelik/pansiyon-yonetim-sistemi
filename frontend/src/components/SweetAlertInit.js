import { useEffect } from 'react';
import Swal from 'sweetalert2';

// Bu bileşen uygulamanın başlangıcında SweetAlert2'yi yapılandırır
export function SweetAlertInit() {
  useEffect(() => {
    // SweetAlert2 global stil ekleme - Tüm "No" butonlarını tamamen gizlemek için
    const sweetAlertStyles = document.createElement('style');
    sweetAlertStyles.id = 'sweetalert-global-styles';
    sweetAlertStyles.textContent = `
      /* No butonunu tamamen kaldır */
      .swal2-actions > button.swal2-deny {
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
        font-size: 0 !important;
      }
      
      /* İki buton arasında boşluk ve genişlik ayarları */
      .swal2-actions {
        display: flex !important;
        justify-content: center !important;
        gap: 1rem !important;
      }
      
      /* Confirm ve Cancel butonları için özel stiller */
      .swal2-confirm, .swal2-cancel {
        flex: 1 !important;
        max-width: 160px !important;
        min-width: 100px !important;
        padding: 10px 20px !important;
      }
    `;
    document.head.appendChild(sweetAlertStyles);
    
    // SweetAlert global ayarlarını yapılandır
    if (Swal) {
      // Global Swal ayarları
      // Global swal ayarları
      const globalSwal = Swal.mixin({
        // Görünüm ayarları
        background: '#ffffff',
        color: '#1f2937',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        
        // Buton ayarları
        showDenyButton: false,
        buttonsStyling: true,
        
        // Özel sınıflar
        customClass: {
          confirmButton: 'swal2-confirm',
          cancelButton: 'swal2-cancel',
          denyButton: 'hidden-deny-button',
          popup: 'custom-popup',
        },
        
        // Dialog açıldığında çalışacak fonksiyon
        didOpen: (popup) => {
          // No butonunu DOM'dan tamamen gizle
          const denyButton = popup.querySelector('.swal2-deny');
          if (denyButton) {
            denyButton.style.display = 'none';
            denyButton.style.visibility = 'hidden';
            denyButton.style.pointerEvents = 'none';
            denyButton.style.opacity = '0';
          }
        }
      });

      // Global ayarları orijinal Swal'a ata - böylece SweetAlert her yerde çalışacak
      window.Swal = globalSwal;
    } else {
      console.error('SweetAlert2 yüklenemedi! Lütfen bağımlılıkları kontrol edin.');
    }
    
    // Temizleme fonksiyonu
    return () => {
      if (sweetAlertStyles && sweetAlertStyles.parentNode) {
        sweetAlertStyles.parentNode.removeChild(sweetAlertStyles);
      }
    };
  }, []);

  return null;
}

export default SweetAlertInit;
