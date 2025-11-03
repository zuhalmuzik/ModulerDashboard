/**
 * Dashboard Initialization
 * Auto-starts dashboard and defines global data loading functions
 */

// ===== GLOBAL DATA LOADING FUNCTION =====
// Sayfa yüklendiğinde dashboard'ı otomatik başlat
(function() {
    'use strict';
    
    safeConsole.log('🚀 Dashboard otomatik başlatılıyor...');
    setTimeout(() => {
        window.loadData();
    }, 1000); // 1 saniye loading
})();

// ===== GLOBAL DATA LOADING FUNCTION =====
// Bu fonksiyon sayfa yüklenir yüklenmez tanımlanır
window.loadData = async function() {
    safeConsole.log('🚀 loadData fonksiyonu çağrıldı');
    try {
        // Loading progress'i güncelle
        if (typeof dataLoadProgress !== 'undefined') {
            dataLoadProgress.dataFiles = true;
            if (typeof window.checkLoadingComplete === 'function') {
                window.checkLoadingComplete();
            } else if (typeof checkLoadingComplete === 'function') {
                checkLoadingComplete();
            }
        }
        
        if (document.getElementById('dataStatus')) {
            document.getElementById('dataStatus').innerHTML = '<span class="status-badge" style="background:#ffc107;color:#000;">⏳ Yükleniyor...</span>';
        }
        
        // Hedef takip modülünü başlat
        if (window.targetsModule && typeof window.targetsModule.init === 'function') {
            await window.targetsModule.init();
        }
        
        // İlk olarak metadata'yı yükle
        const metadata = await loadMetadata();
        safeConsole.log('📊 Metadata yüklendi:', metadata);
        
        if (!metadata || !metadata.years || metadata.years.length === 0) {
            throw new Error('Geçerli yıl verisi bulunamadı');
        }
        
        // Tüm yılları yükle
        await loadAllYearsData(metadata);
        
        safeConsole.log('✅ Veri yükleme tamamlandı');
        
    } catch (error) {
        safeConsole.error('❌ Veri yükleme hatası:', error);
        if (document.getElementById('dataStatus')) {
            document.getElementById('dataStatus').innerHTML = '<span class="status-badge" style="background:#dc3545;color:#fff;">❌ Hata</span>';
        }
    }
};

// ===== METADATA CACHE CONTROL (OPTIMIZED) =====
// NOT: isMetadataUpdated kullanımında memory cache temizleme mantığı hala HTML'de (loadedYears.clear())

// ===== GLOBAL METADATA LOADING FUNCTION =====
window.loadMetadata = async function() {
    try {
        // Akıllı Cache: Metadata için saatlik versiyon
        const version = getHourlyVersion();
        const timestamp = Date.now(); // Anlık timestamp
        const response = await fetch(`data-metadata.json?v=${version}&t=${timestamp}`, {
            headers: {
                'Cache-Control': 'public, max-age=3600' // 1 saat cache
            }
        });
        if (!response.ok) throw new Error('Metadata yüklenemedi');
        const newMetadata = await response.json();
        
        // Metadata güncelleme kontrolü
        const shouldReload = isMetadataUpdated(newMetadata);
        
        if (shouldReload) {
            safeConsole.log('✅ Metadata yüklendi ve güncellendi:', newMetadata);
        } else {
            safeConsole.log('✅ Metadata yüklendi (değişiklik yok):', newMetadata);
        }
        
        metadata = newMetadata;
        metadata.needsReload = shouldReload; // Flag ekle
        return metadata;
    } catch (error) {
        safeConsole.error('❌ Metadata yükleme hatası:', error);
        throw error;
    }
};

