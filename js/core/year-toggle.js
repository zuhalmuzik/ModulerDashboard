/**
 * Year Toggle Module
 * Handles year selection and data loading/unloading
 */

let selectedYears = new Set(); // Seçili yılları tut
let yearToggleLock = false; // Yıl toggle işlemi devam ederken başka işlem engelle
let yearUpdateTimeout = null; // Debounce için

// Yıl toggle'larını initialize et
function initializeYearToggles(availableYears) {
    const container = document.getElementById('yearToggleContainer');
    if (!container) return;
    
    // Varsayılan: sadece en güncel yıl seçili (ör: 2025)
    const latestYear = (availableYears
        .map(y => y.toString())
        .sort((a,b) => parseInt(a) - parseInt(b))
        .pop());
    selectedYears = new Set([latestYear]);
    
    // Toggle'ları oluştur
    container.innerHTML = '';
    availableYears.sort().reverse().forEach(year => {
        const isSelected = selectedYears.has(year.toString());
        const toggleItem = document.createElement('div');
        toggleItem.className = isSelected ? 'year-toggle-item active' : 'year-toggle-item';
        toggleItem.dataset.year = year;
        toggleItem.innerHTML = `
            <div class="year-toggle-switch ${isSelected ? 'active' : ''}" onclick="event.stopPropagation(); toggleYear('${year}')"></div>
            <span class="year-toggle-label" onclick="toggleYear('${year}')">${year}</span>
        `;
        container.appendChild(toggleItem);
    });
    
    container.style.display = 'flex';
    updateYearToggleUI();
}

// Yıl toggle fonksiyonu (Optimized: Debounce + Loading State)
async function toggleYear(year) {
    // Eğer bir işlem devam ediyorsa, bekle
    if (yearToggleLock) {
        safeConsole.log(`⏸️ Yıl değişikliği zaten işleniyor, bekleniyor...`);
        return;
    }
    
    const wasSelected = selectedYears.has(year);
    
    // UI'ı hemen güncelle (kullanıcı geri bildirimi için)
    if (wasSelected) {
        selectedYears.delete(year);
    } else {
        selectedYears.add(year);
    }
    updateYearToggleUI();
    
    // Debounce: Kullanıcı hızlı tıklarsa sadece son tıklamayı işle
    if (yearUpdateTimeout) {
        clearTimeout(yearUpdateTimeout);
    }
    
    yearUpdateTimeout = setTimeout(async () => {
        yearToggleLock = true;
        
        try {
            // Loading göster
            const statusEl = document.getElementById('dataStatus');
            if (statusEl) {
                statusEl.innerHTML = '<span class="status-badge status-warning">⏳ Yükleniyor...</span>';
            }
            
            if (wasSelected) {
                // Yılı kaldır
                await removeYearDataOptimized(year);
            } else {
                // Yılı ekle
                await loadYearDataAndMergeOptimized(year);
            }
            
            // UI güncellemeleri (asenkron, non-blocking)
            requestAnimationFrame(() => {
                updateYearToggleUI();
                updateDataStatusOptimized();
            });
            
        } catch (error) {
            console.error('❌ Yıl toggle hatası:', error);
            // Hata durumunda geri al
            if (wasSelected) {
                selectedYears.add(year);
            } else {
                selectedYears.delete(year);
            }
            updateYearToggleUI();
            updateDataStatusOptimized();
        } finally {
            yearToggleLock = false;
        }
    }, 300); // 300ms debounce
}

// Yıl verisini kaldır (Optimized: Asenkron işlemler)
async function removeYearDataOptimized(year) {
    safeConsole.log(`🗑️ ${year} yılı verisi kaldırılıyor...`);
    
    // allData'dan bu yılın verilerini kaldır
    const yearStr = year.toString();
    allData = allData.filter(item => {
        if (!item.date) return true;
        const itemYear = item.date.split('-')[0];
        return itemYear !== yearStr;
    });
    
    // Dashboard modülü için window.allData'ya güncelle
    if (typeof window !== 'undefined') {
        window.allData = allData;
    }
    
    // STACK OVERFLOW ÖNLEME: Spread yerine slice kullan (büyük array'lerde güvenli)
    baseData = allData.slice();
    // STACK OVERFLOW ÖNLEME: Spread yerine slice kullan (büyük array'lerde güvenli)
    filteredData = allData.slice();
        
    // Cache'den kaldır
    loadedYears.delete(year);
    if (loadedDataCache[year]) {
        delete loadedDataCache[year];
    }
    
    // UI güncellemeleri (requestIdleCallback ile - PERFORMANS OPTİMİZASYONU)
    const updateUI = () => {
        populateFilters();
        updateSummary();
    };
    
    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(updateUI, { timeout: 200 });
    } else {
        requestAnimationFrame(updateUI);
    }
    
    // Ağır işlemleri asenkron yap (requestIdleCallback ile - tarayıcı boşta iken)
    const heavyOperations = () => {
        if (typeof loadDashboard === 'function' && allData) {
            loadDashboard(allData);
        }
        analyzeCustomers();
        if (window.targetsModule) {
            window.targetsModule.loadAllStoresTargets();
        }
        analyzeCityPerformance();
        if (window.targetsModule) {
            window.targetsModule.performYearlyTargetAnalysis();
        }
        populateSalespersonYearFilter();
        populateStoreYearFilter();
    };
    
    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(heavyOperations, { timeout: 500 });
    } else {
        setTimeout(heavyOperations, 100);
    }
    
    safeConsole.log(`✅ ${year} yılı verisi kaldırıldı. Kalan veri: ${allData.length} kayıt`);
}

// Yıl verisini yükle ve birleştir (Optimized: Asenkron işlemler)
async function loadYearDataAndMergeOptimized(year) {
    try {
        safeConsole.log(`📦 ${year} yılı verisi yükleniyor...`);
        
        const yearData = await loadYearData(year);
        if (!yearData?.details || yearData.details.length === 0) {
            safeConsole.warn(`⚠️ ${year} yılında veri bulunamadı`);
            return;
        }
        
        // Verileri işle (chunk'lara bölerek, non-blocking - PERFORMANS OPTİMİZASYONU)
        // INP ve FID performansı için chunk size küçültüldü ve delay artırıldı
        const chunkSize = 3000; // 5000 → 3000 (INP/FID iyileştirme: daha küçük chunk'lar, daha responsive)
        const chunks = [];
        for (let i = 0; i < yearData.details.length; i += chunkSize) {
            chunks.push(yearData.details.slice(i, i + chunkSize));
        }
        
        let processedYearData = [];
        // requestIdleCallback kullan (tarayıcı boşta iken çalışır)
        const processChunk = (chunkIndex) => {
            return new Promise((resolve) => {
                if (typeof requestIdleCallback !== 'undefined') {
                    // Modern tarayıcılar için requestIdleCallback
                    requestIdleCallback(() => {
                        const chunk = chunks[chunkIndex];
                        const processedChunk = chunk.map(item => applyDiscountLogic(item));
                        // STACK OVERFLOW ÖNLEME: Spread yerine loop ile ekle
                        for (let i = 0; i < processedChunk.length; i++) {
                            processedYearData.push(processedChunk[i]);
                        }
                        resolve();
                    }, { timeout: 200 }); // INP/FID iyileştirme: 100ms → 200ms (daha uzun timeout)
                } else {
                    // Fallback: setTimeout (daha uzun delay)
                    setTimeout(() => {
                        const chunk = chunks[chunkIndex];
                        const processedChunk = chunk.map(item => applyDiscountLogic(item));
                        // STACK OVERFLOW ÖNLEME: Spread yerine loop ile ekle
                        for (let i = 0; i < processedChunk.length; i++) {
                            processedYearData.push(processedChunk[i]);
                        }
                        resolve();
                    }, 100); // INP/FID iyileştirme: 50ms → 100ms (daha uzun bekleme, main thread'i daha az blokla)
                }
            });
        };
        
        // Chunk'ları sırayla işle (async, non-blocking)
        for (let i = 0; i < chunks.length; i++) {
            await processChunk(i);
            // Progress göstergesi (büyük veriler için)
            if (chunks.length > 5 && i % 5 === 0) {
                const progress = Math.round((i / chunks.length) * 100);
                safeConsole.log(`📊 ${year} işleniyor: %${progress}`);
            }
        }
        
        // Mevcut verilere ekle (async, non-blocking)
        // STACK OVERFLOW ÖNLEME: Spread operator yerine loop ile ekle (büyük array'lerde güvenli)
        await new Promise(resolve => {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => {
                    // Spread operator büyük array'lerde stack overflow yapar → Loop ile ekle
                    for (let i = 0; i < processedYearData.length; i++) {
                        allData.push(processedYearData[i]);
                    }
                    // Array kopyalama: Spread yerine slice kullan (daha güvenli)
                    baseData = allData.slice();
                    filteredData = allData.slice();
                    resolve();
                }, { timeout: 200 }); // INP/FID iyileştirme: 100ms → 200ms
            } else {
                setTimeout(() => {
                    // Spread operator büyük array'lerde stack overflow yapar → Loop ile ekle
                    for (let i = 0; i < processedYearData.length; i++) {
                        allData.push(processedYearData[i]);
                    }
                    // Array kopyalama: Spread yerine slice kullan (daha güvenli)
                    baseData = allData.slice();
                    filteredData = allData.slice();
                    resolve();
                }, 0);
            }
        });
        
        safeConsole.log(`✅ ${year} yılı yüklendi: ${processedYearData.length} kayıt`);
        
        // UI güncellemeleri (requestIdleCallback ile - tarayıcı boşta iken)
        const updateUI = () => {
            populateFilters();
            updateSummary();
        };
        
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(updateUI, { timeout: 300 }); // INP/FID iyileştirme: 200ms → 300ms
        } else {
            requestAnimationFrame(() => setTimeout(updateUI, 50)); // Ekstra delay eklendi
        }
        
        // Ağır işlemleri asenkron yap (requestIdleCallback ile - tarayıcı boşta iken)
        const heavyOperations = () => {
            loadDashboard();
            analyzeCustomers();
            loadAllStoresTargets();
            analyzeCityPerformance();
            performYearlyTargetAnalysis();
            populateSalespersonYearFilter();
            populateStoreYearFilter();
        };
        
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(heavyOperations, { timeout: 800 }); // INP/FID iyileştirme: 500ms → 800ms (ağır işlemler için daha uzun bekleme)
        } else {
            setTimeout(heavyOperations, 200); // INP/FID iyileştirme: 100ms → 200ms
        }
        
    } catch (error) {
        console.error(`❌ ${year} yılı yükleme hatası:`, error);
        // Hata durumunda toggle'ı geri al
        selectedYears.delete(year);
        updateYearToggleUI();
    }
}

// Yıl toggle UI'ı güncelle
function updateYearToggleUI() {
    const container = document.getElementById('yearToggleContainer');
    if (!container) return;
    
    container.querySelectorAll('.year-toggle-item').forEach(item => {
        const year = item.dataset.year;
        const switchEl = item.querySelector('.year-toggle-switch');
        
        if (selectedYears.has(year)) {
            item.classList.add('active');
            if (switchEl) switchEl.classList.add('active');
        } else {
            item.classList.remove('active');
            if (switchEl) switchEl.classList.remove('active');
        }
    });
}

// Veri durumu badge'ini güncelle (Optimized: Cache + Debounce)
// NOT: dataStatusCache index.html'de tanımlı, burada global kullan
if (typeof window.dataStatusCache === 'undefined') {
    window.dataStatusCache = { totalUSD: 0, uniqueDates: null, uniqueInvoices: 0 };
}
const dataStatusCache = window.dataStatusCache;

function updateDataStatusOptimized() {
    const statusEl = document.getElementById('dataStatus');
    if (!statusEl) return;
    
    // Badge güncelle (hafif işlem, hemen)
    if (selectedYears.size === 0) {
        statusEl.innerHTML = '<span class="status-badge status-warning">⚠️ Yıl Seçilmedi</span>';
    } else if (selectedYears.size === 1) {
        statusEl.innerHTML = `<span class="status-badge status-success">✅ ${Array.from(selectedYears)[0]}</span>`;
    } else {
        const yearsList = Array.from(selectedYears).sort().join(', ');
        statusEl.innerHTML = `<span class="status-badge status-success">✅ Seçili Yıllar (${yearsList})</span>`;
    }
    
    // Ağır hesaplamaları asenkron yap (non-blocking)
    if (allData && allData.length > 0) {
        // Toplam kayıt hemen güncelle (çok hızlı)
        const totalRecordsEl = document.getElementById('totalRecords');
        if (totalRecordsEl) {
            totalRecordsEl.textContent = allData.length.toLocaleString('tr-TR');
        }
        
        // Ağır hesaplamaları requestAnimationFrame ile yap
        requestAnimationFrame(() => {
            // Toplam USD
            const totalUSD = allData.reduce((sum, item) => sum + (parseFloat(item.usd_amount) || 0), 0);
            const totalUSDEl = document.getElementById('totalUSD');
            if (totalUSDEl) {
                totalUSDEl.textContent = '$' + totalUSD.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
            
            // Günlük Ortalama (cache'lenebilir)
            if (!dataStatusCache.uniqueDates || dataStatusCache.totalUSD !== totalUSD) {
                dataStatusCache.uniqueDates = [...new Set(allData.map(item => item.date))];
                dataStatusCache.totalUSD = totalUSD;
            }
            const dailyAverage = dataStatusCache.uniqueDates.length > 0 ? totalUSD / dataStatusCache.uniqueDates.length : 0;
            const dailyAverageEl = document.getElementById('dailyAverage');
            if (dailyAverageEl) {
                dailyAverageEl.textContent = '$' + dailyAverage.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
            
            // Sepet Ortalaması (cache'lenebilir)
            if (dataStatusCache.uniqueInvoices === 0 || dataStatusCache.totalUSD !== totalUSD) {
                dataStatusCache.uniqueInvoices = new Set(allData.filter(item => item.move_type === 'out_invoice').map(item => item.move_name).filter(Boolean)).size;
            }
            const basketAverage = dataStatusCache.uniqueInvoices > 0 ? totalUSD / dataStatusCache.uniqueInvoices : 0;
            const basketAverageEl = document.getElementById('basketAverage');
            if (basketAverageEl) {
                basketAverageEl.textContent = '$' + basketAverage.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
        });
    }
}

// Eski fonksiyon (geriye uyumluluk için)
function updateDataStatus() {
    updateDataStatusOptimized();
}

// Export to window for global access
if (typeof window !== 'undefined') {
    window.selectedYears = selectedYears;
    window.initializeYearToggles = initializeYearToggles;
    window.toggleYear = toggleYear;
    window.removeYearDataOptimized = removeYearDataOptimized;
    window.loadYearDataAndMergeOptimized = loadYearDataAndMergeOptimized;
    window.updateYearToggleUI = updateYearToggleUI;
    window.updateDataStatusOptimized = updateDataStatusOptimized;
    window.updateDataStatus = updateDataStatus;
}

