/**
 * DOM Utility Functions
 * Pure DOM manipulation functions
 */

/**
 * Güvenli element güncelleme fonksiyonu
 * @param {string} id - Element ID
 * @param {string|number} value - Güncellenecek değer
 * @param {Function|null} formatter - Opsiyonel format fonksiyonu
 */
function safeUpdateElement(id, value, formatter = null) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = formatter ? formatter(value) : value;
    } else {
        // safeConsole config.js'den gelecek (window objesinde)
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn(`⚠️ Element bulunamadı: ${id}`);
        }
    }
}

/**
 * Seçili checkbox sayısını günceller
 * @param {string} containerId - Container element ID
 * @param {string} countId - Sayı gösterilecek element ID
 */
function updateSelectionCount(containerId, countId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const count = container.querySelectorAll('input[type="checkbox"]:checked').length;
    const countSpan = document.getElementById(countId);
    if (countSpan) {
        if (count > 0) {
            countSpan.textContent = `(${count} seçili)`;
        } else {
            countSpan.textContent = '';
        }
    }
}

/**
 * Seçili checkbox değerlerini döndürür
 * @param {string} containerId - Container element ID
 * @returns {Array<string>} Seçili değerler dizisi
 */
function getSelectedValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
}

/**
 * Checkbox'ları filtrele (arama kutusu için)
 * @param {string} containerId - Container element ID
 * @param {string} searchText - Arama metni
 */
function filterCheckboxes(containerId, searchText) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const searchLower = searchText.toLowerCase().trim();
    const items = container.querySelectorAll('.checkbox-item');
    
    items.forEach(item => {
        const label = item.querySelector('label');
        if (!label) return;
        
        const text = label.textContent.toLowerCase();
        
        if (searchLower === '' || text.includes(searchLower)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.safeUpdateElement = safeUpdateElement;
    window.updateSelectionCount = updateSelectionCount;
    window.getSelectedValues = getSelectedValues;
    // HTML'de oninput ile kullanılmak için filterCheckboxes window'a attach edilmeli
    window.filterCheckboxes = filterCheckboxes;
}

