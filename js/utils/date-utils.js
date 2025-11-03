/**
 * Date Utility Functions
 * Pure functions - No dependencies, no side effects
 */

/**
 * Günlük versiyon string'i oluşturur (YYYYMMDD formatında)
 * @returns {string} Günlük versiyon (örn: "20250115")
 */
function getDailyVersion() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Saatlik versiyon string'i oluşturur (YYYYMMDDHH formatında)
 * @returns {string} Saatlik versiyon (örn: "2025011514")
 */
function getHourlyVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    return `${year}${month}${day}${hour}`;
}

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.getDailyVersion = getDailyVersion;
    window.getHourlyVersion = getHourlyVersion;
}

