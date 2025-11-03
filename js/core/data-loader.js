/**
 * Data Loader Module
 * Handles loading and caching of year data from GZIP files
 */

// GZIP Decompression ve Yıl Yükleme Fonksiyonları

async function loadYearData(year) {
    // Çift yükleme önleme kontrolü
    if (loadedYears.has(year) && loadedDataCache[year]) {
        safeConsole.log(`⏭️ ${year} zaten yüklü, cache'den döndürülüyor...`);
        // Cache'den veriyi döndür
        return loadedDataCache[year];
    }
    
    // Hemen ekle - race condition önleme
    loadedYears.add(year);
    
    try {
        safeConsole.log(`📦 ${year} yükleniyor...`);
        
        // GZIP dosyasını indir - Akıllı Cache ile
        // Tüm yıllar (2023, 2024, 2025) repository'de ve Vercel'de mevcut
        const version = getDailyVersion(); // Günlük versiyon
        const timestamp = Date.now(); // Anlık timestamp
        
        // Tüm yıllar için Vercel'den yükle (basit ve güvenilir)
        const dataUrl = `data-${year}.json.gz?v=${version}&t=${timestamp}`;
        
        let response;
        try {
            response = await fetch(dataUrl, {
                headers: {
                    'Cache-Control': 'public, max-age=86400' // 24 saat cache
                }
            });
        } catch (fetchError) {
            throw new Error(`${year} verisi yüklenemedi: ${fetchError.message}`);
        }
        
        // Response kontrolü - HTML dönerse (404 sayfası) hata ver
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
            // Eğer HTML dönüyorsa (404 sayfası), daha anlamlı hata mesajı ver
            if (contentType.includes('text/html')) {
                throw new Error(`${year} verisi bulunamadı - Dosya mevcut değil (404). Lütfen veri dosyalarının Vercel'de olduğundan emin olun.`);
            }
            throw new Error(`${year} verisi bulunamadı (${response.status}: ${response.statusText})`);
        }
        
        // Content-Type kontrolü - JSON/GZIP bekleniyor
        if (!contentType.includes('application') && !contentType.includes('gzip') && !contentType.includes('octet-stream')) {
            safeConsole.warn(`⚠️ ${year} için beklenmeyen Content-Type: ${contentType}`);
        }
        
        // ArrayBuffer olarak al
        const arrayBuffer = await response.arrayBuffer();
        
        // GZIP açma - SYNC (fallback: Eğer GZIP değilse direkt text olarak oku)
        let decompressed;
        try {
            // Önce dosyanın GZIP olup olmadığını kontrol et (ilk 2 byte: 1F 8B)
            const uint8Array = new Uint8Array(arrayBuffer);
            const isGzip = uint8Array.length >= 2 && uint8Array[0] === 0x1F && uint8Array[1] === 0x8B;
            
            if (isGzip && typeof pako !== 'undefined') {
                // GZIP dosyası - pako ile aç
                try {
                    decompressed = pako.ungzip(uint8Array, { to: 'string' });
                } catch (gzipError) {
                    // GZIP açma başarısız, direkt text olarak dene
                    safeConsole.warn(`⚠️ GZIP açma başarısız (${year}), direkt text olarak deneniyor...`, gzipError);
                    const decoder = new TextDecoder('utf-8');
                    decompressed = decoder.decode(uint8Array);
                }
            } else if (!isGzip) {
                // GZIP değil, direkt text olarak oku
                safeConsole.log(`⚠️ ${year} dosyası GZIP formatında değil, direkt text olarak okunuyor...`);
                const decoder = new TextDecoder('utf-8');
                decompressed = decoder.decode(uint8Array);
            } else {
                throw new Error('GZIP açma kütüphanesi yüklenmedi. Lütfen sayfayı yenileyin.');
            }
        } catch (e) {
            console.error(`❌ GZIP açma hatası (${year}):`, e);
            // Son fallback: Direkt text olarak dene
            try {
                const decoder = new TextDecoder('utf-8');
                decompressed = decoder.decode(new Uint8Array(arrayBuffer));
                safeConsole.log(`✅ ${year} direkt text olarak okundu (fallback)`);
            } catch (fallbackError) {
                throw new Error(`GZIP açma başarısız: ${e.message}`);
            }
        }
        
        // JSON'a çevir (PERFORMANS: Büyük JSON'lar için async parse)
        // Önce HTML response kontrolü yap (404 sayfası olabilir)
        const trimmedDecompressed = decompressed.trim();
        if (trimmedDecompressed.startsWith('<!DOCTYPE') || trimmedDecompressed.startsWith('<html') || trimmedDecompressed.startsWith('<HTML')) {
            throw new Error(`${year} verisi bulunamadı - HTML sayfası döndü (404). Dosya mevcut değil.`);
        }
        
        let yearData;
        if (decompressed.length > 1000000) { // 1MB'dan büyükse async parse
            yearData = await new Promise((resolve, reject) => {
                if (typeof requestIdleCallback !== 'undefined') {
                    requestIdleCallback(() => {
                        try {
                            resolve(JSON.parse(decompressed));
                        } catch (e) {
                            // JSON parse hatası - muhtemelen HTML response
                            if (e.message && e.message.includes('Unexpected token')) {
                                reject(new Error(`${year} verisi geçersiz format - HTML sayfası döndü (404). Dosya mevcut değil.`));
                            } else {
                                reject(e);
                            }
                        }
                    }, { timeout: 2000 });
                } else {
                    setTimeout(() => {
                        try {
                            resolve(JSON.parse(decompressed));
                        } catch (e) {
                            // JSON parse hatası - muhtemelen HTML response
                            if (e.message && e.message.includes('Unexpected token')) {
                                reject(new Error(`${year} verisi geçersiz format - HTML sayfası döndü (404). Dosya mevcut değil.`));
                            } else {
                                reject(e);
                            }
                        }
                    }, 0);
                }
            });
        } else {
            try {
                yearData = JSON.parse(decompressed);
            } catch (e) {
                // JSON parse hatası - muhtemelen HTML response
                if (e.message && e.message.includes('Unexpected token')) {
                    throw new Error(`${year} verisi geçersiz format - HTML sayfası döndü (404). Dosya mevcut değil.`);
                }
                throw e;
            }
        }
        
        safeConsole.log(`✅ ${year} yüklendi: ${yearData?.details?.length || 0} kayıt`);
        if (!yearData?.details) {
            safeConsole.warn(`⚠️ ${year} verisi boş veya geçersiz`);
        }
        
        // Cache'e kaydet
        loadedDataCache[year] = yearData;
        
        // loadedYears.add(year) zaten fonksiyon başında yapıldı
        return yearData;
        
    } catch (error) {
        console.error(`❌ ${year} yükleme hatası:`, error);
        throw error;
    }
}

// Export to window for global access
if (typeof window !== 'undefined') {
    window.loadYearData = loadYearData;
}

