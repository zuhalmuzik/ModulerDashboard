/**
 * Application Configuration and Constants
 * Global state ve config objeleri
 */

/**
 * Development mode kontrolü
 * @constant {boolean} IS_DEVELOPMENT
 */
const IS_DEVELOPMENT = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

/**
 * Safe console wrapper - Production'da log'ları devre dışı bırakır
 * @constant {Object} safeConsole
 */
const safeConsole = {
    log: IS_DEVELOPMENT ? console.log.bind(console) : () => {},
    warn: IS_DEVELOPMENT ? console.warn.bind(console) : () => {},
    error: console.error.bind(console), // Hatalar her zaman gösterilmeli
    info: IS_DEVELOPMENT ? console.info.bind(console) : () => {},
    debug: IS_DEVELOPMENT ? console.debug.bind(console) : () => {}
};

/**
 * Global Satış Kanalı Filtresi State
 * @constant {Object} activeChannels
 */
let activeChannels = {
    all: true,
    retail: false,
    wholesale: false,
    online: false,
    corporate: false,
    central: false
};

/**
 * Gerçek veri yükleme takibi
 * @constant {Object} dataLoadProgress
 */
let dataLoadProgress = {
    pageInit: false,
    dataFiles: false,
    targets: false,
    ready: false
};

/**
 * Firebase Configuration
 * Environment variables kullanılacak (Vercel'de ayarlanacak)
 * Fallback olarak hardcoded config (development için)
 * Not: Browser'da window.__ENV__ veya başka bir mekanizma ile env variable'ları alınabilir
 * @constant {Object} firebaseConfig
 */
const firebaseConfig = {
    // Vercel'de environment variable'lar build time'da inject edilir
    // Şimdilik hardcoded değerler kullanılıyor
    apiKey: typeof window !== 'undefined' && window.__ENV__?.FIREBASE_API_KEY || "AIzaSyD3H_v4Tq5h_30U8sZXYM7wARu9GPg3RDk",
    authDomain: typeof window !== 'undefined' && window.__ENV__?.FIREBASE_AUTH_DOMAIN || "zuhalrapor.firebaseapp.com",
    projectId: typeof window !== 'undefined' && window.__ENV__?.FIREBASE_PROJECT_ID || "zuhalrapor",
    storageBucket: typeof window !== 'undefined' && window.__ENV__?.FIREBASE_STORAGE_BUCKET || "zuhalrapor.firebasestorage.app",
    messagingSenderId: typeof window !== 'undefined' && window.__ENV__?.FIREBASE_MESSAGING_SENDER_ID || "1070847166914",
    appId: typeof window !== 'undefined' && window.__ENV__?.FIREBASE_APP_ID || "1:1070847166914:web:b9d05ea13fa3bb5f46ee5b",
    measurementId: typeof window !== 'undefined' && window.__ENV__?.FIREBASE_MEASUREMENT_ID || "G-HV3MES215N"
};

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.IS_DEVELOPMENT = IS_DEVELOPMENT;
    window.safeConsole = safeConsole;
    window.activeChannels = activeChannels;
    window.dataLoadProgress = dataLoadProgress;
    window.firebaseConfig = firebaseConfig;
}

