/**
 * Product Utility Functions
 * Pure functions for product/discount logic
 */

/**
 * İndirim ürünlerini tespit eden yardımcı fonksiyon
 * @param {Object} item - Ürün objesi
 * @returns {boolean} İndirim ürünü mü?
 */
function isDiscountProduct(item) {
    const productName = (item.product || '').toLowerCase();
    return productName.includes('[disc]') ||
           productName.includes('indirim') || 
           productName.includes('discount') ||
           productName.includes('toplam tutarda indirim');
}

/**
 * İndirim ürünlerinin tutarını negatif yapan fonksiyon
 * NOT: Şu anda devre dışı (Odoo zaten indirimleri düşüyor)
 * @param {Object} item - Ürün objesi
 * @returns {Object} İşlenmiş ürün objesi
 */
function applyDiscountLogic(item) {
    // TEST MODU: İndirim mantığı devre dışı (Odoo zaten indirimleri düşüyor)
    // TEST SONUCU: Log ($39,171,668.53) ile sayfa ($38,805,606) karşılaştırılacak
    return item; // Geçici olarak değişiklik yapmadan döndür
    
    // ORİJİNAL KOD (şimdilik devre dışı):
    // if (isDiscountProduct(item)) {
    //     // İndirim ürünleri için tutar negatif, miktar pozitif
    //     return {
    //         ...item,
    //         usd_amount: -Math.abs(parseFloat(item.usd_amount || 0)),
    //         quantity: Math.abs(parseFloat(item.quantity || 0)),
    //         _isDiscount: true  // İndirim işareti ekle (filtreleme için)
    //     };
    // }
    // return item;
}

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.isDiscountProduct = isDiscountProduct;
    window.applyDiscountLogic = applyDiscountLogic;
}

