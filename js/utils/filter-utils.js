/**
 * Filter Utility Functions
 * Functions for populating and managing filter dropdowns
 */

/**
 * Multi-select checkbox container'ı doldurur
 * @param {string} id - Container element ID
 * @param {Array<string>} values - Gösterilecek değerler
 * @param {string} countId - Seçim sayısını gösterecek element ID
 */
function populateMultiSelect(id, values, countId) {
    const container = document.getElementById(id);
    if (!container) return;
    
    // Mevcut seçimleri koru
    const currentChecked = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    
    container.innerHTML = '';
    
    values.forEach(value => {
        const item = document.createElement('div');
        item.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = value;
        checkbox.id = `${id}_${value.replace(/\s+/g, '_')}`;
        checkbox.checked = currentChecked.includes(value);
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = value;
        
        // Checkbox değiştiğinde sayıyı güncelle
        // updateSelectionCount dom-utils.js'den gelecek
        if (typeof updateSelectionCount === 'function') {
            checkbox.addEventListener('change', () => updateSelectionCount(id, countId));
        }
        
        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
    });
    
    // İlk yüklemede sayıyı güncelle
    if (typeof updateSelectionCount === 'function') {
        updateSelectionCount(id, countId);
    }
}

/**
 * Ana filtreleri doldurur (marka, kategori, mağaza, şehir, tarih)
 * @param {Array} dataSource - Veri kaynağı (allData veya window.allData)
 */
function populateFilters(dataSource = null) {
    // Veri kaynağını belirle: parametre veya global allData
    const data = dataSource || (typeof window !== 'undefined' && window.allData) || [];
    
    if (!data || data.length === 0) {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn('⚠️ populateFilters: Veri yok');
        }
        return;
    }
    
    const brands = new Set();
    const cat1 = new Set();
    const cat2 = new Set();
    const cat3 = new Set();
    const cat4 = new Set();
    const salesPersons = new Set();
    const stores = new Set();
    const cities = new Set();
    const years = new Set();
    const months = new Set();
    const days = new Set();
    
    data.forEach(item => {
        if (item.brand) brands.add(item.brand);
        // Kategori kaydırması: category_2 -> Kategori 1, category_3 -> Kategori 2, category_4 -> Kategori 3
        if (item.category_2) cat1.add(item.category_2);
        if (item.category_3) cat2.add(item.category_3);
        if (item.category_4) cat3.add(item.category_4);
        if (item.sales_person) salesPersons.add(item.sales_person);
        if (item.store) stores.add(item.store);
        if (item.city) cities.add(item.city);
        
        // Tarih bilgilerini ayir
        if (item.date) {
            const dateParts = item.date.split('-');
            if (dateParts.length >= 3) {
                years.add(dateParts[0]); // YYYY
                months.add(dateParts[1]); // MM
                days.add(dateParts[2]); // DD
            }
        }
    });
    
    populateMultiSelect('filterBrand', Array.from(brands).sort(), 'countBrand');
    populateMultiSelect('filterCategory1', Array.from(cat1).sort(), 'countCategory1');
    populateMultiSelect('filterCategory2', Array.from(cat2).sort(), 'countCategory2');
    populateMultiSelect('filterCategory3', Array.from(cat3).sort(), 'countCategory3');
    populateMultiSelect('filterSalesPerson', Array.from(salesPersons).sort(), 'countSalesPerson');
    populateMultiSelect('filterStore', Array.from(stores).sort(), 'countStore');
    populateMultiSelect('filterCity', Array.from(cities).sort(), 'countCity');
    populateMultiSelect('filterYear', Array.from(years).sort().reverse(), 'countYear'); // En yeni once
    populateMultiSelect('filterMonth', Array.from(months).sort(), 'countMonth');
    populateMultiSelect('filterDay', Array.from(days).sort(), 'countDay');
}

/**
 * Mağaza sekmesi için yıl/ay/gün/kategori filtrelerini doldurur
 * @param {Array} dataSource - Veri kaynağı (allData veya window.allData)
 */
function populateStoreYearFilter(dataSource = null) {
    const data = dataSource || (typeof window !== 'undefined' && window.allData) || [];
    
    if (!data || data.length === 0) {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn('⚠️ populateStoreYearFilter: Veri yok');
        }
        return;
    }
    
    const years = new Set();
    const months = new Set();
    const days = new Set();
    const categories = new Set();
    
    data.forEach(item => {
        if (item.date) {
            const dateParts = item.date.split('-');
            if (dateParts.length >= 3) {
                years.add(dateParts[0]); // YYYY
                months.add(dateParts[1]); // MM
                days.add(dateParts[2]); // DD
            }
        }
        // Sadece category_2 (Kategori 2) bilgilerini al
        if (item.category_2 && item.category_2.trim() && item.category_2.toLowerCase() !== 'all') {
            categories.add(item.category_2);
        }
    });
    
    populateMultiSelect('filterStoreYear', Array.from(years).sort().reverse(), 'countStoreYear');
    populateMultiSelect('filterStoreMonth', Array.from(months).sort(), 'countStoreMonth');
    populateMultiSelect('filterStoreDay', Array.from(days).sort(), 'countStoreDay');
    populateMultiSelect('filterStoreCategory', Array.from(categories).sort(), 'countStoreCategory');
}

/**
 * Satış temsilcisi sekmesi için yıl/ay/gün filtrelerini doldurur
 * @param {Array} dataSource - Veri kaynağı (allData veya window.allData)
 */
function populateSalespersonYearFilter(dataSource = null) {
    const data = dataSource || (typeof window !== 'undefined' && window.allData) || [];
    
    if (!data || data.length === 0) {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn('⚠️ populateSalespersonYearFilter: Veri yok');
        }
        return;
    }
    
    const years = new Set();
    const months = new Set();
    const days = new Set();
    
    data.forEach(item => {
        if (item.date) {
            const dateParts = item.date.split('-');
            if (dateParts.length >= 3) {
                years.add(dateParts[0]); // YYYY
                months.add(dateParts[1]); // MM
                days.add(dateParts[2]); // DD
            }
        }
    });
    
    populateMultiSelect('filterSalespersonYear', Array.from(years).sort().reverse(), 'countSalespersonYear');
    populateMultiSelect('filterSalespersonMonth', Array.from(months).sort(), 'countSalespersonMonth');
    populateMultiSelect('filterSalespersonDay', Array.from(days).sort(), 'countSalespersonDay');
}

/**
 * Ürün filtrelerini initialize eder (kategori dropdown, mağaza dropdown)
 * Global kategorileri window.allCategories ve window.allCategoriesHierarchical'e atar
 * @param {Array} dataSource - Veri kaynağı (allData veya window.allData)
 */
function initializeProductFilters(dataSource = null) {
    const data = dataSource || (typeof window !== 'undefined' && window.allData) || [];
    
    if (!data || data.length === 0) {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn('⚠️ initializeProductFilters: Veri yok');
        }
        return;
    }
    
    // Tüm kategorileri topla (hiyerarşik olarak + ara seviyeler)
    const categoryMap = new Map();
    data.forEach(item => {
        const cat1 = item.category_1 || '';
        const cat2 = item.category_2 || '';
        const cat3 = item.category_3 || '';
        const cat4 = item.category_4 || '';
        
        // Her seviyeyi ayrı ayrı ekle
        const levels = [cat1, cat2, cat3, cat4].filter(c => c && c.trim());
        
        // Tüm kombinasyonları ekle (ara seviyeler dahil)
        for (let i = 1; i <= levels.length; i++) {
            const hierarchy = levels.slice(0, i).join(' > ');
            if (hierarchy && !categoryMap.has(hierarchy)) {
                categoryMap.set(hierarchy, {
                    cat1: levels[0] || '',
                    cat2: levels[1] || '',
                    cat3: levels[2] || '',
                    cat4: levels[3] || ''
                });
            }
        }
    });
    
    // Global kategorileri window objesine atla
    if (typeof window !== 'undefined') {
        window.allCategoriesHierarchical = Array.from(categoryMap.keys()).sort();
        
        // Basit liste için de tüm kategorileri topla
        const categorySet = new Set();
        data.forEach(item => {
            if (item.category_1) categorySet.add(item.category_1);
            if (item.category_2) categorySet.add(item.category_2);
            if (item.category_3) categorySet.add(item.category_3);
            if (item.category_4) categorySet.add(item.category_4);
        });
        window.allCategories = Array.from(categorySet).sort();
    }
    
    // Mağaza dropdown'ını doldur
    const storeSet = new Set();
    data.forEach(item => {
        if (item.store && item.store !== 'Analitik' && !item.store.toLowerCase().includes('eğitim')) {
            storeSet.add(item.store);
        }
    });
    const storeFilter = document.getElementById('productStoreFilter');
    if (storeFilter) {
        storeFilter.innerHTML = '<option value="">Tüm Mağazalar</option>';
        Array.from(storeSet).sort().forEach(store => {
            storeFilter.innerHTML += `<option value="${store}">${store}</option>`;
        });
    }
}

// Geriye dönük uyumluluk için window objesine export et
if (typeof window !== 'undefined') {
    window.populateMultiSelect = populateMultiSelect;
    window.populateFilters = populateFilters;
    window.populateStoreYearFilter = populateStoreYearFilter;
    window.populateSalespersonYearFilter = populateSalespersonYearFilter;
    window.initializeProductFilters = initializeProductFilters;
}

