/**
 * Time Utility Functions
 * Pure functions for time/date extraction and processing
 */

/**
 * Tarih/saat bilgisini item'dan çıkarır
 * @param {Object} item - Satış verisi item'ı
 * @returns {Object} {hour: number, dayOfWeek: number} - hour: 0-23, dayOfWeek: 0-6 (0=Pazartesi, 6=Pazar)
 */
function extractTimeInfo(item) {
    let hour = null;
    let dayOfWeek = null;
    
    // 1. Önce create_hour ve day_of_week varsa kullan
    if (item.create_hour !== undefined && item.create_hour !== null && item.create_hour !== 0) {
        hour = parseInt(item.create_hour);
    }
    if (item.day_of_week !== undefined && item.day_of_week !== null && item.day_of_week !== '') {
        dayOfWeek = parseInt(item.day_of_week);
    }
    
    // 2. Yoksa item.date'den parse et
    if ((hour === null || hour === 0) && item.date) {
        try {
            // Format: "2025-01-15" veya "2025-01-15 14:30:00"
            const dateStr = item.date.trim();
            
            // Saat bilgisi varsa çıkar
            if (dateStr.includes(' ') || dateStr.includes('T')) {
                const datetimeMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})[T\s]+(\d{2}):(\d{2}):(\d{2})/);
                if (datetimeMatch) {
                    const [, datePart, hourStr] = datetimeMatch;
                    hour = parseInt(hourStr);
                    
                    // Tarihten gün bilgisini çıkar
                    const dateObj = new Date(datePart + 'T12:00:00');
                    if (!isNaN(dateObj.getTime())) {
                        // JavaScript: 0=Pazar, 6=Cumartesi
                        // Python: 0=Pazartesi, 6=Pazar
                        // Python değerine çevir: JS_Pazar(0) -> Python_Pazar(6), JS_Pazartesi(1) -> Python_Pazartesi(0)
                        const jsDay = dateObj.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
                        dayOfWeek = (jsDay === 0) ? 6 : jsDay - 1; // Python formatı: 0=Pazartesi, 6=Pazar
                    }
                } else {
                    // Sadece tarih formatı: "2025-01-15"
                    const dateObj = new Date(dateStr + 'T12:00:00');
                    if (!isNaN(dateObj.getTime())) {
                        const jsDay = dateObj.getDay();
                        dayOfWeek = (jsDay === 0) ? 6 : jsDay - 1;
                    }
                }
            } else {
                // Sadece tarih: "2025-01-15"
                const dateObj = new Date(dateStr + 'T12:00:00');
                if (!isNaN(dateObj.getTime())) {
                    const jsDay = dateObj.getDay();
                    dayOfWeek = (jsDay === 0) ? 6 : jsDay - 1;
                }
            }
        } catch (e) {
            // safeConsole config.js'den gelecek (window objesinde)
            if (typeof safeConsole !== 'undefined') {
                safeConsole.warn('⚠️ Tarih parse hatası:', item.date, e);
            }
        }
    }
    
    // 3. Geçerli aralık kontrolü
    if (hour !== null && (hour < 0 || hour >= 24)) hour = null;
    if (dayOfWeek !== null && (dayOfWeek < 0 || dayOfWeek >= 7)) dayOfWeek = null;
    
    return {
        hour: hour !== null ? hour : 0,
        dayOfWeek: dayOfWeek !== null ? dayOfWeek : 0
    };
}

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.extractTimeInfo = extractTimeInfo;
}

