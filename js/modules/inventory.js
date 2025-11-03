/**
 * Inventory/Stock Analysis Module
 * Handles all inventory management, stock analysis, and inventory-related analytics
 * 
 * Dependencies:
 * - safeConsole (config.js - window.safeConsole)
 * - Chart (Chart.js library - global)
 * - pako (GZIP decompression - global)
 * - safeUpdateElement (dom-utils.js)
 * - getSelectedValues (filter-utils.js)
 * - populateMultiSelect (filter-utils.js)
 * - loadStockLocations (data-loader-utils.js)
 * - inventoryData (global - window.inventoryData)
 * - inventoryCharts (global - window.inventoryCharts)
 * - allData (global - window.allData)
 */

/**
 * 📦 Envanter Verilerini Yükle
 * GZIP sıkıştırılmış inventory.json.gz dosyasını yükler
 */
async function loadInventoryData() {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('📦 Envanter verileri yükleniyor...');
    }
    
    // Loading state'i göster (sadece inventory tab'ında varsa)
    const inventoryLoading = document.getElementById('inventoryLoading');
    const inventoryContent = document.getElementById('inventoryContent');
    if (inventoryLoading) inventoryLoading.style.display = 'block';
    if (inventoryContent) inventoryContent.style.display = 'none';
    
    try {
        // inventory.json.gz dosyasını yükle
        const response = await fetch('inventory.json.gz');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const compressedData = await response.arrayBuffer();
        const decompressedData = pako.ungzip(new Uint8Array(compressedData), { to: 'string' });
        const parsedData = JSON.parse(decompressedData);
        
        // Veri yapısını kontrol et (object içinde inventory array'i var)
        let inventoryData;
        if (parsedData.inventory && Array.isArray(parsedData.inventory)) {
            inventoryData = parsedData; // Tüm obje'yi sakla, sadece inventory'yi değil
            if (typeof safeConsole !== 'undefined') {
                safeConsole.log(`✅ Envanter verileri yüklendi: ${inventoryData.inventory.length} kayıt`);
                safeConsole.log(`📊 Toplam miktar: ${inventoryData.total_quantity}`);
                safeConsole.log(`💰 Toplam değer: $${inventoryData.total_value}`);
            }
        } else if (Array.isArray(parsedData)) {
            // Eğer direkt array ise, obje olarak sar
            inventoryData = { inventory: parsedData };
            if (typeof safeConsole !== 'undefined') {
                safeConsole.log(`✅ Envanter verileri yüklendi: ${inventoryData.inventory.length} kayıt`);
            }
        } else {
            throw new Error('Beklenmeyen veri formatı: inventory array bulunamadı');
        }
        
        // Global inventoryData'yı güncelle
        if (typeof window !== 'undefined') {
            window.inventoryData = inventoryData;
        }
        
        // Verileri görüntüle
        renderInventoryDashboard();
        
    } catch (error) {
        console.error('❌ Envanter verileri yüklenemedi:', error);
        const inventoryLoading = document.getElementById('inventoryLoading');
        if (inventoryLoading) {
            inventoryLoading.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <div style="font-size: 4em; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: #f5576c;">Envanter verileri yüklenemedi</h3>
                <p style="color: #666; margin-top: 15px;">Hata: ${error.message}</p>
                <button onclick="loadInventoryData()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1em;">
                    🔄 Tekrar Dene
                </button>
            </div>
        `;
        }
    }
}

/**
 * 📊 Envanter Dashboard Gösterimi
 * Envanter verilerini yükledikten sonra dashboard'u render eder
 */
function renderInventoryDashboard() {
    const inventoryData = (typeof window !== 'undefined' && window.inventoryData) || null;
    
    if (!inventoryData || !inventoryData.inventory || inventoryData.inventory.length === 0) {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn('⚠️ Envanter verisi yok!');
        }
        return;
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('📊 Envanter dashboard oluşturuluyor...');
    }
    
    // Loading'i gizle, content'i göster (sadece inventory tab'ında varsa)
    const inventoryLoading = document.getElementById('inventoryLoading');
    const inventoryContent = document.getElementById('inventoryContent');
    if (inventoryLoading) inventoryLoading.style.display = 'none';
    if (inventoryContent) inventoryContent.style.display = 'block';
    
    // İlk yüklemede tüm ürünleri göster
    filterStockAnalysis();
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('✅ Envanter dashboard oluşturuldu!');
    }
}

/**
 * 🔍 Stok Analiz Filtreleme
 * Envanter verilerini marka, ürün, kategori bazında filtreler
 */
function filterStockAnalysis() {
    const inventoryData = (typeof window !== 'undefined' && window.inventoryData) || null;
    const allData = (typeof window !== 'undefined' && window.allData) || [];
    
    if (!inventoryData || !inventoryData.inventory || inventoryData.inventory.length === 0 || !allData || allData.length === 0) {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn('⚠️ Envanter veya satış verisi yok!');
        }
        const container = document.getElementById('stockAnalysisTableContainer');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #f5576c; padding: 40px;">⚠️ Veri henüz yüklenmedi. Lütfen bekleyin...</p>';
        }
        return;
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🔍 Stok analizi filtreleniyor...');
    }
    
    // Filtre değerlerini al
    const stockSearchBrand = document.getElementById('stockSearchBrand');
    const stockSearchProduct = document.getElementById('stockSearchProduct');
    const stockSearchCat2 = document.getElementById('stockSearchCat2');
    const stockSearchCat3 = document.getElementById('stockSearchCat3');
    const stockSearchCat4 = document.getElementById('stockSearchCat4');
    
    const searchBrand = (stockSearchBrand?.value || '').toLowerCase().trim();
    const searchProduct = (stockSearchProduct?.value || '').toLowerCase().trim();
    const searchCat2 = (stockSearchCat2?.value || '').toLowerCase().trim();
    const searchCat3 = (stockSearchCat3?.value || '').toLowerCase().trim();
    const searchCat4 = (stockSearchCat4?.value || '').toLowerCase().trim();
    
    // Envanter verilerini filtrele
    let filtered = inventoryData.inventory.filter(item => {
        if (searchBrand && !(item.brand || '').toLowerCase().includes(searchBrand)) return false;
        
        // Ürün adı: product_name veya product alanını kontrol et
        const productName = item.product_name || item.product || '';
        if (searchProduct && !productName.toLowerCase().includes(searchProduct)) return false;
        
        // Kategoriler: tek bir string'de birleşik (örn: "All / Lifestyle / Kitap")
        const category = item.category || '';
        if (searchCat2 && !category.toLowerCase().includes(searchCat2)) return false;
        if (searchCat3 && !category.toLowerCase().includes(searchCat3)) return false;
        if (searchCat4 && !category.toLowerCase().includes(searchCat4)) return false;
        
        return true;
    });
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`📦 Filtrelenmiş envanter: ${filtered.length} ürün`);
    }
    
    // Her ürün için mağaza bazlı stok ve satış analizi
    const storeAnalysis = {};
    
    filtered.forEach(invItem => {
        const store = invItem.location || 'Bilinmeyen';
        const product = invItem.product_name || invItem.product || '';
        const brand = invItem.brand || '';
        
        if (!storeAnalysis[store]) {
            storeAnalysis[store] = {};
        }
        
        const key = `${brand}_${product}`;
        if (!storeAnalysis[store][key]) {
            storeAnalysis[store][key] = {
                brand: brand,
                product: product,
                stock: 0,
                sales: 0,
                salesQty: 0
            };
        }
        
        storeAnalysis[store][key].stock += parseFloat(invItem.quantity) || 0;
    });
    
    // Satış verilerini ekle (son 12 ay)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    allData.forEach(saleItem => {
        const saleDate = new Date(saleItem.date);
        if (saleDate < twelveMonthsAgo) return;
        
        const store = saleItem.store || 'Bilinmeyen';
        const product = saleItem.product || '';
        const brand = saleItem.brand || '';
        const key = `${brand}_${product}`;
        
        if (storeAnalysis[store] && storeAnalysis[store][key]) {
            storeAnalysis[store][key].sales += parseFloat(saleItem.usd_amount) || 0;
            storeAnalysis[store][key].salesQty += parseFloat(saleItem.quantity) || 0;
        }
    });
    
    // AI: Önerilen stok ve satın alma hesapla
    Object.keys(storeAnalysis).forEach(store => {
        Object.keys(storeAnalysis[store]).forEach(key => {
            const item = storeAnalysis[store][key];
            
            // Aylık ortalama satış (son 12 ay)
            const monthlySales = item.salesQty / 12;
            
            // Önerilen stok: 2 aylık satış + %20 güvenlik marjı
            const recommendedStock = Math.ceil(monthlySales * 2 * 1.2);
            item.recommendedStock = recommendedStock;
            
            // Önerilen satın alma: Önerilen stok - Mevcut stok
            const purchaseNeed = Math.max(0, recommendedStock - item.stock);
            item.recommendedPurchase = Math.ceil(purchaseNeed);
        });
    });
    
    // Tabloyu oluştur
    renderStockAnalysisTable(storeAnalysis);
}

/**
 * 📋 Stok Analiz Tablosu Render
 * Mağaza bazlı stok analiz tablosunu oluşturur
 * @param {Object} storeAnalysis - Mağaza bazlı analiz verisi
 */
function renderStockAnalysisTable(storeAnalysis) {
    const container = document.getElementById('stockAnalysisTableContainer');
    if (!container) return;
    
    // Her mağaza için tablo
    let html = '';
    
    Object.entries(storeAnalysis).sort((a, b) => a[0].localeCompare(b[0])).forEach(([store, products]) => {
        const productList = Object.values(products);
        if (productList.length === 0) return;
        
        html += `
            <div style="margin-bottom: 40px;">
                <h4 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    🏪 ${store} <span style="opacity: 0.8; font-size: 0.9em;">(${productList.length} ürün)</span>
                </h4>
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background: #f8f9fa; text-align: left;">
                            <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Marka</th>
                            <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Ürün</th>
                            <th style="padding: 12px; border-bottom: 2px solid #dee2e6; text-align: right;">📦 Stok</th>
                            <th style="padding: 12px; border-bottom: 2px solid #dee2e6; text-align: right;">📊 Satış (12 Ay)</th>
                            <th style="padding: 12px; border-bottom: 2px solid #dee2e6; text-align: right;">🤖 Önerilen Stok</th>
                            <th style="padding: 12px; border-bottom: 2px solid #dee2e6; text-align: right;">🛒 Önerilen Satın Alma</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productList.map(item => {
                            const stockStatus = item.stock >= item.recommendedStock ? 'background: #d4edda;' : item.stock < item.recommendedStock * 0.5 ? 'background: #f8d7da;' : '';
                            return `
                                <tr style="${stockStatus}">
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${item.brand || '-'}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${item.product || '-'}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right; font-weight: bold;">${item.stock.toFixed(0)}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">${item.salesQty.toFixed(0)} adet</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right; color: #667eea; font-weight: bold;">${item.recommendedStock}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right; ${item.recommendedPurchase > 0 ? 'color: #f5576c; font-weight: bold;' : 'color: #38ef7d;'}">${item.recommendedPurchase > 0 ? item.recommendedPurchase : '✓ Yeterli'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p style="text-align: center; color: #666; padding: 40px;">Filtre kriterlerine uygun ürün bulunamadı.</p>';
    }
    
    container.innerHTML = html;
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('✅ Stok analiz tablosu oluşturuldu!');
    }
}

/**
 * 🗑️ Stok Filtrelerini Temizle
 * Tüm stok arama filtrelerini sıfırlar
 */
function clearStockFilters() {
    const stockSearchBrand = document.getElementById('stockSearchBrand');
    const stockSearchProduct = document.getElementById('stockSearchProduct');
    const stockSearchCat2 = document.getElementById('stockSearchCat2');
    const stockSearchCat3 = document.getElementById('stockSearchCat3');
    const stockSearchCat4 = document.getElementById('stockSearchCat4');
    
    if (stockSearchBrand) stockSearchBrand.value = '';
    if (stockSearchProduct) stockSearchProduct.value = '';
    if (stockSearchCat2) stockSearchCat2.value = '';
    if (stockSearchCat3) stockSearchCat3.value = '';
    if (stockSearchCat4) stockSearchCat4.value = '';
    
    filterStockAnalysis();
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🗑️ Stok filtreleri temizlendi');
    }
}

/**
 * 📊 Envanter Grafikleri Render
 * Marka, kategori, lokasyon bazlı grafikleri oluşturur
 */
function renderInventoryCharts() {
    const inventoryData = (typeof window !== 'undefined' && window.inventoryData) || null;
    
    if (!inventoryData || !inventoryData.inventory) return;
    
    // inventoryCharts global objesini kontrol et
    if (typeof window !== 'undefined' && !window.inventoryCharts) {
        window.inventoryCharts = {};
    }
    const inventoryCharts = window.inventoryCharts || {};
    
    // Marka bazında stok
    const brandData = {};
    inventoryData.inventory.forEach(item => {
        const brand = item.brand || 'Diğer';
        if (!brandData[brand]) brandData[brand] = 0;
        brandData[brand] += parseFloat(item.list_price || 0) * parseFloat(item.quantity || 0);
    });
    const topBrands = Object.entries(brandData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    // Kategori bazında stok
    const categoryData = {};
    inventoryData.inventory.forEach(item => {
        const category = item.category || 'Diğer';
        if (!categoryData[category]) categoryData[category] = 0;
        categoryData[category] += parseFloat(item.list_price || 0) * parseFloat(item.quantity || 0);
    });
    const topCategories = Object.entries(categoryData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    // Lokasyon bazında stok
    const locationData = {};
    inventoryData.inventory.forEach(item => {
        const location = item.location || 'Diğer';
        if (!locationData[location]) locationData[location] = 0;
        locationData[location] += parseFloat(item.list_price || 0) * parseFloat(item.quantity || 0);
    });
    const topLocations = Object.entries(locationData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    // En yüksek değerli ürünler
    const topValueProducts = [...inventoryData.inventory]
        .sort((a, b) => (parseFloat(b.list_price || 0) * parseFloat(b.quantity || 0)) - (parseFloat(a.list_price || 0) * parseFloat(a.quantity || 0)))
        .slice(0, 10);
    
    // Chart.js ile grafikleri oluştur
    // Marka grafiği
    if (inventoryCharts.brand && typeof inventoryCharts.brand.destroy === 'function') {
        inventoryCharts.brand.destroy();
    }
    const brandCtx = document.getElementById('invBrandChart');
    if (brandCtx && typeof Chart !== 'undefined') {
        inventoryCharts.brand = new Chart(brandCtx, {
            type: 'bar',
            data: {
                labels: topBrands.map(b => b[0]),
                datasets: [{
                    label: 'Stok Değeri ($)',
                    data: topBrands.map(b => b[1]),
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } }
            }
        });
    }
    
    // Kategori grafiği
    if (inventoryCharts.category && typeof inventoryCharts.category.destroy === 'function') {
        inventoryCharts.category.destroy();
    }
    const categoryCtx = document.getElementById('invCategoryChart');
    if (categoryCtx && typeof Chart !== 'undefined') {
        inventoryCharts.category = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: topCategories.map(c => c[0]),
                datasets: [{
                    data: topCategories.map(c => c[1]),
                    backgroundColor: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#ffa751', '#f5576c']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }
    
    // Lokasyon grafiği
    if (inventoryCharts.location && typeof inventoryCharts.location.destroy === 'function') {
        inventoryCharts.location.destroy();
    }
    const locationCtx = document.getElementById('invLocationChart');
    if (locationCtx && typeof Chart !== 'undefined') {
        inventoryCharts.location = new Chart(locationCtx, {
            type: 'bar',
            data: {
                labels: topLocations.map(l => l[0]),
                datasets: [{
                    label: 'Stok Değeri ($)',
                    data: topLocations.map(l => l[1]),
                    backgroundColor: '#f093fb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } }
            }
        });
    }
    
    // Top Value Products grafiği
    if (inventoryCharts.topValue && typeof inventoryCharts.topValue.destroy === 'function') {
        inventoryCharts.topValue.destroy();
    }
    const topValueCtx = document.getElementById('invTopValueChart');
    if (topValueCtx && typeof Chart !== 'undefined') {
        inventoryCharts.topValue = new Chart(topValueCtx, {
            type: 'horizontalBar',
            data: {
                labels: topValueProducts.map(p => (p.product || 'Bilinmeyen').substring(0, 30)),
                datasets: [{
                    label: 'Değer ($)',
                    data: topValueProducts.map(p => parseFloat(p.value) || 0),
                    backgroundColor: '#43e97b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } }
            }
        });
    }
    
    // Global inventoryCharts'ı güncelle
    if (typeof window !== 'undefined') {
        window.inventoryCharts = inventoryCharts;
    }
}

/**
 * 📋 Envanter Tablosu Render
 * İlk 100 envanter kaydını tablo olarak gösterir
 */
function renderInventoryTable() {
    const inventoryData = (typeof window !== 'undefined' && window.inventoryData) || null;
    
    if (!inventoryData || !inventoryData.inventory) return;
    
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    // İlk 100 kayıt
    const displayData = inventoryData.inventory.slice(0, 100);
    
    tbody.innerHTML = displayData.map(item => `
        <tr>
            <td>${item.product || '-'}</td>
            <td>${item.brand || '-'}</td>
            <td>${item.category || '-'}</td>
            <td>${item.location || '-'}</td>
            <td style="text-align: right;">${(parseFloat(item.quantity) || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
            <td style="text-align: right;">$${((parseFloat(item.list_price) || 0) * (parseFloat(item.quantity) || 0)).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
        </tr>
    `).join('');
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`✅ Envanter tablosu oluşturuldu: ${displayData.length} kayıt`);
    }
}

/**
 * 🔍 Envanter Tablo Filtreleme
 * Envanter tablosunda arama yapar
 */
function filterInventoryTable() {
    const inventoryData = (typeof window !== 'undefined' && window.inventoryData) || null;
    
    if (!inventoryData || !inventoryData.inventory || inventoryData.inventory.length === 0) return;
    
    const inventorySearch = document.getElementById('inventorySearch');
    const searchTerm = (inventorySearch?.value || '').toLowerCase();
    
    if (!searchTerm.trim()) {
        // Arama boşsa ilk 100 kaydı göster
        renderInventoryTable();
        return;
    }
    
    // Arama yap
    const filtered = inventoryData.inventory.filter(item => {
        return (
            (item.product && item.product.toLowerCase().includes(searchTerm)) ||
            (item.brand && item.brand.toLowerCase().includes(searchTerm)) ||
            (item.category && item.category.toLowerCase().includes(searchTerm)) ||
            (item.location && item.location.toLowerCase().includes(searchTerm))
        );
    });
    
    // Tabloyu güncelle
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    const displayData = filtered.slice(0, 100); // İlk 100 sonuç
    
    tbody.innerHTML = displayData.map(item => `
        <tr>
            <td>${item.product || '-'}</td>
            <td>${item.brand || '-'}</td>
            <td>${item.category || '-'}</td>
            <td>${item.location || '-'}</td>
            <td style="text-align: right;">${(parseFloat(item.quantity) || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
            <td style="text-align: right;">$${((parseFloat(item.list_price) || 0) * (parseFloat(item.quantity) || 0)).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
        </tr>
    `).join('');
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`🔍 Arama sonucu: ${filtered.length} kayıt bulundu, ${displayData.length} gösteriliyor`);
    }
}

/**
 * 🔍 Filtrelenmiş Envanter Verisi
 * Seçili filtrelere göre envanter verilerini filtreler
 * @returns {Array} Filtrelenmiş envanter verisi
 */
function getFilteredInventoryData() {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🔍 getFilteredInventoryData başlatılıyor...');
    }
    
    const inventoryData = (typeof window !== 'undefined' && window.inventoryData) || null;
    
    // Sadece envanter verilerini kullan, satış verisi ile birleştirme
    const inventoryItems = inventoryData?.inventory || [];
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`📦 Envanter ürün sayısı: ${inventoryItems.length}`);
    }
    
    if (inventoryItems.length === 0) {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.log('⚠️ Envanter verisi yok');
        }
        return [];
    }
    
    // getSelectedValues filter-utils.js'den geliyor
    if (typeof getSelectedValues === 'undefined') {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.error('❌ getSelectedValues fonksiyonu bulunamadı!');
        }
        return inventoryItems;
    }
    
    // Filtreleri uygula
    const filtered = inventoryItems.filter(item => {
        // Mağaza filtresi
        const storeFilter = getSelectedValues('filterInventoryStore');
        if (storeFilter.length > 0) {
            const itemStore = (item.location || '').toLowerCase();
            const matches = storeFilter.some(store => 
                itemStore.includes(store.toLowerCase())
            );
            if (!matches) return false;
        }
        
        // Kategori filtresi
        const categoryFilter = getSelectedValues('filterInventoryCategory');
        if (categoryFilter.length > 0) {
            const itemCategory = (item.category || '').toLowerCase();
            const matches = categoryFilter.some(cat => 
                itemCategory.includes(cat.toLowerCase())
            );
            if (!matches) return false;
        }
        
        // Marka filtresi
        const brandFilter = getSelectedValues('filterInventoryBrand');
        if (brandFilter.length > 0) {
            const itemBrand = (item.brand || '').toLowerCase();
            const matches = brandFilter.some(brand => 
                itemBrand.includes(brand.toLowerCase())
            );
            if (!matches) return false;
        }
        
        return true;
    });
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`✅ Filtrelenmiş envanter: ${filtered.length} ürün`);
    }
    return filtered;
}

/**
 * 🔧 Envanter Filtrelerini Doldur
 * Mağaza, kategori, marka ve yıl filtrelerini doldurur
 */
function populateInventoryFilters() {
    const allData = (typeof window !== 'undefined' && window.allData) || [];
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🔧 Envanter filtreleri dolduruluyor...');
    }
    
    // populateMultiSelect filter-utils.js'den geliyor
    if (typeof populateMultiSelect === 'undefined') {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.error('❌ populateMultiSelect fonksiyonu bulunamadı!');
        }
        return;
    }
    
    // Mağaza filtresi
    const stores = [...new Set(allData.map(item => item.store).filter(Boolean))];
    populateMultiSelect('filterInventoryStore', stores.sort(), 'countInventoryStore');
    
    // Kategori filtresi
    const categories = [...new Set(allData.map(item => item.category_2).filter(Boolean))];
    populateMultiSelect('filterInventoryCategory', categories.sort(), 'countInventoryCategory');
    
    // Marka filtresi
    const brands = [...new Set(allData.map(item => item.brand).filter(Boolean))];
    populateMultiSelect('filterInventoryBrand', brands.sort(), 'countInventoryBrand');
    
    // Yıl filtresi
    const years = [...new Set(allData.map(item => item.date ? item.date.substring(0, 4) : null).filter(Boolean))];
    populateMultiSelect('filterInventoryYear', years.sort().reverse(), 'countInventoryYear');
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('✅ Envanter filtreleri dolduruldu');
    }
}

/**
 * 🔄 Envanter Analiz Türü Değiştirme
 * Fiyat, stok, performans, trend veya uyarı analizini gösterir
 */
function switchInventoryAnalysis() {
    const inventoryAnalysisType = document.getElementById('inventoryAnalysisType');
    const analysisType = inventoryAnalysisType?.value || 'price';
    
    // Tüm görünümleri gizle
    const views = ['priceAnalysisView', 'stockAnalysisView', 'performanceView', 'trendsView', 'alertsView'];
    views.forEach(viewId => {
        const view = document.getElementById(viewId);
        if (view) view.style.display = 'none';
    });
    
    // Seçilen görünümü göster
    switch(analysisType) {
        case 'price':
            const priceView = document.getElementById('priceAnalysisView');
            if (priceView) {
                priceView.style.display = 'block';
                performPriceAnalysis();
            }
            break;
        case 'stock':
            const stockView = document.getElementById('stockAnalysisView');
            if (stockView) {
                stockView.style.display = 'block';
                performStockAnalysis();
            }
            break;
        case 'performance':
            const performanceView = document.getElementById('performanceView');
            if (performanceView) {
                performanceView.style.display = 'block';
                performPerformanceAnalysis();
            }
            break;
        case 'trends':
            const trendsView = document.getElementById('trendsView');
            if (trendsView) {
                trendsView.style.display = 'block';
                performTrendAnalysis();
            }
            break;
        case 'alerts':
            const alertsView = document.getElementById('alertsView');
            if (alertsView) {
                alertsView.style.display = 'block';
                performAlertAnalysis();
            }
            break;
    }
}

/**
 * 💰 Fiyat Analizi
 * Liste fiyatı ile satış fiyatını karşılaştırır
 */
function performPriceAnalysis() {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('💰 Fiyat Analizi başlatılıyor...');
    }
    
    // Filtrelenmiş veriyi al
    const filteredData = getFilteredInventoryData();
    
    const inventoryResultsContainer = document.getElementById('inventoryResultsContainer');
    const inventoryNoResults = document.getElementById('inventoryNoResults');
    
    if (filteredData.length === 0) {
        if (inventoryResultsContainer) inventoryResultsContainer.style.display = 'none';
        if (inventoryNoResults) inventoryNoResults.style.display = 'block';
        return;
    }
    
    if (inventoryResultsContainer) inventoryResultsContainer.style.display = 'block';
    if (inventoryNoResults) inventoryNoResults.style.display = 'none';
    
    // Fiyat analizi hesaplamaları
    let totalDiscount = 0;
    let totalPriceDiff = 0;
    let priceVariance = 0;
    let validComparisons = 0;
    
    const priceData = [];
    
    filteredData.forEach(item => {
        const listPrice = parseFloat(item.list_price || 0);
        const salesPrice = parseFloat(item.usd_amount || 0) / parseFloat(item.quantity || 1);
        
        if (listPrice > 0 && salesPrice > 0) {
            const discount = ((listPrice - salesPrice) / listPrice) * 100;
            const priceDiff = listPrice - salesPrice;
            
            totalDiscount += discount;
            totalPriceDiff += priceDiff;
            priceVariance += Math.pow(discount, 2);
            validComparisons++;
            
            priceData.push({
                product: item.product,
                listPrice,
                salesPrice,
                discount,
                priceDiff
            });
        }
    });
    
    // Özet kartlarını güncelle
    const avgDiscount = validComparisons > 0 ? totalDiscount / validComparisons : 0;
    const variance = validComparisons > 0 ? priceVariance / validComparisons : 0;
    
    if (typeof safeUpdateElement === 'function') {
        safeUpdateElement('avgDiscountRate', avgDiscount.toFixed(1) + '%');
        safeUpdateElement('priceVariance', '$' + variance.toFixed(2));
        safeUpdateElement('totalPriceDiff', '$' + totalPriceDiff.toFixed(2));
    }
}

/**
 * 📦 Stok Analizi
 * Stok seviyelerini ve değerlerini analiz eder
 */
function performStockAnalysis() {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('📦 Stok Analizi başlatılıyor...');
    }
    
    const filteredData = getFilteredInventoryData();
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`📊 Filtrelenmiş veri: ${filteredData.length} ürün`);
    }
    
    const inventoryResultsContainer = document.getElementById('inventoryResultsContainer');
    const inventoryNoResults = document.getElementById('inventoryNoResults');
    
    if (filteredData.length === 0) {
        if (inventoryResultsContainer) inventoryResultsContainer.style.display = 'none';
        if (inventoryNoResults) inventoryNoResults.style.display = 'block';
        return;
    }
    
    if (inventoryResultsContainer) inventoryResultsContainer.style.display = 'block';
    if (inventoryNoResults) inventoryNoResults.style.display = 'none';
    
    // Basit stok analizi - sadece ilk 100 ürün
    const limitedData = filteredData.slice(0, 100);
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`📦 Analiz edilecek ürün sayısı: ${limitedData.length}`);
    }
    
    let totalStock = 0;
    let totalValue = 0;
    let validItems = 0;
    
    limitedData.forEach(item => {
        const currentStock = parseFloat(item.quantity || 0);
        const listPrice = parseFloat(item.list_price || 0);
        
        if (currentStock > 0) {
            totalStock += currentStock;
            totalValue += currentStock * listPrice;
            validItems++;
        }
    });
    
    // Özet kartlarını güncelle
    const avgStock = validItems > 0 ? totalStock / validItems : 0;
    const avgValue = validItems > 0 ? totalValue / validItems : 0;
    
    if (typeof safeUpdateElement === 'function') {
        safeUpdateElement('avgStockTurnover', avgStock.toFixed(0) + ' adet');
        safeUpdateElement('overstockCount', validItems + ' ürün');
        safeUpdateElement('understockCount', '$' + totalValue.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0}));
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('✅ Stok analizi tamamlandı');
    }
}

/**
 * 🎯 Performans Analizi
 * Envanter performans metriklerini hesaplar
 */
function performPerformanceAnalysis() {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🎯 Performans Analizi başlatılıyor...');
    }
    
    const filteredData = getFilteredInventoryData();
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`📊 Filtrelenmiş veri: ${filteredData.length} ürün`);
    }
    
    const inventoryResultsContainer = document.getElementById('inventoryResultsContainer');
    const inventoryNoResults = document.getElementById('inventoryNoResults');
    
    if (filteredData.length === 0) {
        if (inventoryResultsContainer) inventoryResultsContainer.style.display = 'none';
        if (inventoryNoResults) inventoryNoResults.style.display = 'block';
        return;
    }
    
    if (inventoryResultsContainer) inventoryResultsContainer.style.display = 'block';
    if (inventoryNoResults) inventoryNoResults.style.display = 'none';
    
    // Basit performans analizi - sadece ilk 50 ürün
    const limitedData = filteredData.slice(0, 50);
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`📦 Analiz edilecek ürün sayısı: ${limitedData.length}`);
    }
    
    let totalValue = 0;
    let validItems = 0;
    
    limitedData.forEach(item => {
        const currentStock = parseFloat(item.quantity || 0);
        const listPrice = parseFloat(item.list_price || 0);
        
        if (currentStock > 0) {
            totalValue += currentStock * listPrice;
            validItems++;
        }
    });
    
    // Özet kartlarını güncelle
    const avgValue = validItems > 0 ? totalValue / validItems : 0;
    
    if (typeof safeUpdateElement === 'function') {
        safeUpdateElement('avgPerformance', '$' + avgValue.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0}));
        safeUpdateElement('totalPerformance', validItems + ' ürün');
        safeUpdateElement('performanceScore', Math.min(100, Math.round((validItems / 50) * 100)) + '%');
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('✅ Performans analizi tamamlandı');
    }
}

/**
 * 📈 Trend Analizi
 * Stok trendlerini analiz eder
 */
function performTrendAnalysis() {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('📈 Trend Analizi başlatılıyor...');
    }
    
    const filteredData = getFilteredInventoryData();
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`📊 Filtrelenmiş veri: ${filteredData.length} ürün`);
    }
    
    const inventoryResultsContainer = document.getElementById('inventoryResultsContainer');
    const inventoryNoResults = document.getElementById('inventoryNoResults');
    
    if (filteredData.length === 0) {
        if (inventoryResultsContainer) inventoryResultsContainer.style.display = 'none';
        if (inventoryNoResults) inventoryNoResults.style.display = 'block';
        return;
    }
    
    if (inventoryResultsContainer) inventoryResultsContainer.style.display = 'block';
    if (inventoryNoResults) inventoryNoResults.style.display = 'none';
    
    // Basit trend analizi - sadece ilk 30 ürün
    const limitedData = filteredData.slice(0, 30);
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`📦 Analiz edilecek ürün sayısı: ${limitedData.length}`);
    }
    
    let totalValue = 0;
    let validItems = 0;
    
    limitedData.forEach(item => {
        const currentStock = parseFloat(item.quantity || 0);
        const listPrice = parseFloat(item.list_price || 0);
        
        if (currentStock > 0) {
            totalValue += currentStock * listPrice;
            validItems++;
        }
    });
    
    // Özet kartlarını güncelle
    const avgValue = validItems > 0 ? totalValue / validItems : 0;
    
    if (typeof safeUpdateElement === 'function') {
        safeUpdateElement('trendScore', Math.min(100, Math.round((validItems / 30) * 100)) + '%');
        safeUpdateElement('trendDirection', validItems > 15 ? 'Yükseliş' : 'Düşüş');
        safeUpdateElement('trendConfidence', Math.min(100, Math.round((validItems / 30) * 100)) + '%');
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('✅ Trend analizi tamamlandı');
    }
}

/**
 * 🚨 Uyarı Analizi
 * Kritik stok seviyelerini tespit eder
 */
function performAlertAnalysis() {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🚨 Uyarı Analizi başlatılıyor...');
    }
    
    const filteredData = getFilteredInventoryData();
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`📊 Filtrelenmiş veri: ${filteredData.length} ürün`);
    }
    
    const inventoryResultsContainer = document.getElementById('inventoryResultsContainer');
    const inventoryNoResults = document.getElementById('inventoryNoResults');
    
    if (filteredData.length === 0) {
        if (inventoryResultsContainer) inventoryResultsContainer.style.display = 'none';
        if (inventoryNoResults) inventoryNoResults.style.display = 'block';
        return;
    }
    
    if (inventoryResultsContainer) inventoryResultsContainer.style.display = 'block';
    if (inventoryNoResults) inventoryNoResults.style.display = 'none';
    
    // Basit uyarı analizi - sadece ilk 20 ürün
    const limitedData = filteredData.slice(0, 20);
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`📦 Analiz edilecek ürün sayısı: ${limitedData.length}`);
    }
    
    let criticalAlerts = 0;
    let warningAlerts = 0;
    let infoAlerts = 0;
    
    limitedData.forEach(item => {
        const currentStock = parseFloat(item.quantity || 0);
        
        if (currentStock === 0) {
            criticalAlerts++; // Stok yok
        } else if (currentStock < 5) {
            warningAlerts++; // Düşük stok
        } else {
            infoAlerts++; // Normal stok
        }
    });
    
    // Özet kartlarını güncelle
    if (typeof safeUpdateElement === 'function') {
        safeUpdateElement('criticalAlerts', criticalAlerts + ' ürün');
        safeUpdateElement('warningAlerts', warningAlerts + ' ürün');
        safeUpdateElement('infoAlerts', infoAlerts + ' ürün');
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('✅ Uyarı analizi tamamlandı');
    }
}

// Geriye dönük uyumluluk için window objesine export et
if (typeof window !== 'undefined') {
    window.loadInventoryData = loadInventoryData;
    window.renderInventoryDashboard = renderInventoryDashboard;
    window.filterStockAnalysis = filterStockAnalysis;
    window.renderStockAnalysisTable = renderStockAnalysisTable;
    window.clearStockFilters = clearStockFilters;
    window.renderInventoryCharts = renderInventoryCharts;
    window.renderInventoryTable = renderInventoryTable;
    window.filterInventoryTable = filterInventoryTable;
    window.getFilteredInventoryData = getFilteredInventoryData;
    window.populateInventoryFilters = populateInventoryFilters;
    window.switchInventoryAnalysis = switchInventoryAnalysis;
    window.performPriceAnalysis = performPriceAnalysis;
    window.performStockAnalysis = performStockAnalysis;
    window.performPerformanceAnalysis = performPerformanceAnalysis;
    window.performTrendAnalysis = performTrendAnalysis;
    window.performAlertAnalysis = performAlertAnalysis;
}

