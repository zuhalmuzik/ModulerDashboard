/**
 * Store Utility Functions
 * Mağaza ile ilgili yardımcı fonksiyonlar
 */

/**
 * MAĞAZA ÇALIŞMA SAATLERİ VE KAPALILIKLARI
 * @constant {Object} STORE_WORKING_HOURS
 */
const STORE_WORKING_HOURS = {
    // Özel saatli mağazalar (10:00-20:00, Pazar kapalı)
    'Tünel': { openHour: 10, closeHour: 20, closedDays: [0] }, // 0 = Pazar
    'İzmir': { openHour: 10, closeHour: 20, closedDays: [0] },
    'Antalya': { openHour: 10, closeHour: 20, closedDays: [0] },
    'Kızılay': { openHour: 10, closeHour: 20, closedDays: [0] },
    // Default: Tüm diğer mağazalar (10:00-22:00, 7 gün açık)
    'default': { openHour: 10, closeHour: 22, closedDays: [] }
};

/**
 * Mağaza çalışma saatlerini kontrol eden fonksiyon
 * @param {string} storeName - Mağaza adı
 * @returns {Object} Çalışma saatleri objesi { openHour, closeHour, closedDays }
 */
function getStoreWorkingHours(storeName) {
    if (!storeName) return STORE_WORKING_HOURS.default;
    
    // Mağaza adını temizle (kodları kaldır)
    const cleanName = storeName.replace(/\[.*?\]\s*/g, '').trim();
    
    // Özel mağazalarda arama yap (kısmi eşleşme)
    for (const [key, hours] of Object.entries(STORE_WORKING_HOURS)) {
        if (key !== 'default' && cleanName.toLowerCase().includes(key.toLowerCase())) {
            return hours;
        }
    }
    
    // Bulunamazsa default döndür
    return STORE_WORKING_HOURS.default;
}

/**
 * Mağaza ismini normalize eden fonksiyon (stock-locations mapping için)
 * @param {string} storeName - Normalize edilecek mağaza adı
 * @returns {string} Normalize edilmiş mağaza adı
 */
function normalizeStoreName(storeName) {
    if (!storeName) return '';
    
    // "Perakende - " kısmını kaldır
    const cleaned = storeName.replace('Perakende - ', '');
    
    // Küçük harfe çevir ve boşlukları temizle
    const normalized = cleaned.toLowerCase().trim();
    
    // Mapping tablosu (satış verisindeki mağaza isimleri -> stock-locations'daki değerler)
    const storeMapping = {
        'kentpark': 'KENTPARK',
        'akasya': 'AKASYA',
        'tünel': 'TÜNEL',
        'izmir': 'İzmir',
        'kızılay': 'KIZILAY',
        'hilltown': 'Hilltown',
        'kanyon': 'KANYON',
        'antalya': 'ANTALYA',
        'adana': 'ADANA',
        'bursa': 'BURSA',
        'uniq': 'UNIQ',
        'mavibahçe': 'MAVİBAHÇE',
        'temaworld': 'TEMAWORLD',
        'bodrum': 'BODRUM',
        'outlet': 'OUTLET'
    };
    
    // Eşleşme ara
    for (const [key, value] of Object.entries(storeMapping)) {
        if (normalized.includes(key)) {
            return value;
        }
    }
    
    return storeName; // Eşleşme yoksa orijinal ismi döndür
}

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.STORE_WORKING_HOURS = STORE_WORKING_HOURS;
    window.getStoreWorkingHours = getStoreWorkingHours;
    window.normalizeStoreName = normalizeStoreName;
}

