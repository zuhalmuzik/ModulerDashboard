/**
 * Auth Module Initializer
 * Initializes Firebase authentication module when DOM is ready
 */

(function() {
    'use strict';
    
    // DOM hazır olduğunda auth modülünü başlat
    function initAuth() {
        if (window.authModule && window.firebaseConfig) {
            // Config.js'den config'i al ve başlat
            window.authModule.init(window.firebaseConfig);
        } else if (window.authModule) {
            // Modül yüklendi ama config henüz hazır değil, tekrar dene
            setTimeout(initAuth, 100);
        } else {
            // Modül henüz yüklenmedi, tekrar dene
            setTimeout(initAuth, 100);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
})();

