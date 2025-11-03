/**
 * Filtering Module
 * Handles all filtering functionality including manual filters, AI-powered smart search, and advanced analysis
 * 
 * Dependencies:
 * - filter-utils.js (getSelectedValues, updateSelectionCount)
 * - string-utils.js (fuzzyMatch)
 * - safeConsole (config.js - window.safeConsole)
 * - allData (global - window.allData)
 * - filteredData (global - window.filteredData)
 * - updateSummary (summary.js)
 * - performAdvancedAnalysis (bu modül içinde)
 */

/**
 * Filtreleri uygular ve veriyi filtreler
 * @param {Array} dataSource - Veri kaynağı (opsiyonel, window.allData kullanılır)
 */
function applyFilters(dataSource = null) {
    const allData = dataSource || (typeof window !== 'undefined' && window.allData) || [];
    
    // getSelectedValues filter-utils.js'den geliyor
    if (typeof getSelectedValues === 'undefined') {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.error('❌ getSelectedValues fonksiyonu bulunamadı!');
        }
        return;
    }
    
    const brands = getSelectedValues('filterBrand');
    const cat1s = getSelectedValues('filterCategory1'); // category_2 verisi
    const cat2s = getSelectedValues('filterCategory2'); // category_3 verisi
    const cat3s = getSelectedValues('filterCategory3'); // category_4 verisi
    const salesPersons = getSelectedValues('filterSalesPerson');
    const stores = getSelectedValues('filterStore');
    const cities = getSelectedValues('filterCity');
    const years = getSelectedValues('filterYear');
    const months = getSelectedValues('filterMonth');
    const days = getSelectedValues('filterDay');
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🔍 Çoklu Filtreler:', {
            brands: brands.length,
            cat1s: cat1s.length,
            cat2s: cat2s.length,
            cat3s: cat3s.length,
            salesPersons: salesPersons.length,
            stores: stores.length,
            cities: cities.length,
            years: years.length,
            months: months.length,
            days: days.length
        });
    }
    
    let filteredResult = allData.filter(item => {
        // Marka filtresi (çoklu)
        if (brands.length > 0 && !brands.includes(item.brand)) return false;
        
        // Kategori filtreleri (çoklu) - KAYDIRILMIŞ
        if (cat1s.length > 0 && !cat1s.includes(item.category_2)) return false; // Kategori 1 = category_2
        if (cat2s.length > 0 && !cat2s.includes(item.category_3)) return false; // Kategori 2 = category_3
        if (cat3s.length > 0 && !cat3s.includes(item.category_4)) return false; // Kategori 3 = category_4
        
        // Satış temsilcisi filtresi (çoklu)
        if (salesPersons.length > 0 && !salesPersons.includes(item.sales_person)) return false;
        
        // Mağaza filtresi (çoklu) - KISMI EŞLEME
        if (stores.length > 0) {
            const itemStore = (item.store || '').toLowerCase();
            const matches = stores.some(store => itemStore.includes(store.toLowerCase()));
            if (!matches) return false;
        }
        
        // Şehir filtresi (çoklu)
        if (cities.length > 0 && !cities.includes(item.city)) return false;
        
        // Tarih filtreleri (çoklu)
        if (years.length > 0 || months.length > 0 || days.length > 0) {
            if (!item.date) return false;
            
            const dateParts = item.date.split('-');
            if (dateParts.length < 3) return false;
            
            if (years.length > 0 && !years.includes(dateParts[0])) return false;
            if (months.length > 0 && !months.includes(dateParts[1])) return false;
            if (days.length > 0 && !days.includes(dateParts[2])) return false;
        }
        
        return true;
    });
    
    // Global filteredData'yı güncelle
    if (typeof window !== 'undefined') {
        window.filteredData = filteredResult;
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`Filtreleme sonucu: ${filteredResult.length} kayit`);
    }
    
    // Debug panel göster
    const debugPanel = document.getElementById('debugPanel');
    const debugInfo = document.getElementById('debugInfo');
    if (filteredResult.length > 0 && debugPanel && debugInfo) {
        // Toplam USD ve Miktar hesapla
        const totalUSD = filteredResult.reduce((sum, item) => sum + (parseFloat(item.usd_amount) || 0), 0);
        const totalQty = filteredResult.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
        
        // Benzersiz mağazaları say
        const uniqueStores = new Set(filteredResult.map(item => item.store)).size;
        
        // Tarih dağılımı
        const dateDistribution = {};
        filteredResult.forEach(item => {
            const date = item.date || 'Bilinmeyen';
            dateDistribution[date] = (dateDistribution[date] || 0) + 1;
        });
        const topDates = Object.entries(dateDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        let debugText = `<strong>Toplam Kayit:</strong> ${allData.length.toLocaleString('tr-TR')}<br>`;
        debugText += `<strong>Filtrelenmis Kayit:</strong> ${filteredResult.length.toLocaleString('tr-TR')}<br>`;
        debugText += `<strong>Toplam USD:</strong> $${totalUSD.toLocaleString('tr-TR', {minimumFractionDigits: 2})}<br>`;
        debugText += `<strong>Toplam Miktar:</strong> ${totalQty.toLocaleString('tr-TR', {minimumFractionDigits: 2})}<br>`;
        debugText += `<strong>Benzersiz Magaza:</strong> ${uniqueStores}<br><br>`;
        
        debugText += `<strong>Aktif Filtreler:</strong><br>`;
        if (stores.length > 0) debugText += `- Magaza: ${stores.join(', ')}<br>`;
        if (years.length > 0) debugText += `- Yil: ${years.join(', ')}<br>`;
        if (months.length > 0) debugText += `- Ay: ${months.join(', ')}<br>`;
        if (days.length > 0) debugText += `- Gun: ${days.join(', ')}<br>`;
        if (brands.length > 0) debugText += `- Marka: ${brands.join(', ')}<br>`;
        if (cat1s.length > 0) debugText += `- Kategori 1: ${cat1s.join(', ')}<br>`;
        
        debugText += `<br><strong>En Cok Kayit Olan 5 Gun:</strong><br>`;
        topDates.forEach(([date, count]) => {
            debugText += `- ${date}: ${count} kayit<br>`;
        });
        
        debugText += `<br><strong>Ornek Kayitlar (ilk 3):</strong><br>`;
        for (let i = 0; i < Math.min(3, filteredResult.length); i++) {
            debugText += `<br>${i+1}. Tarih: ${filteredResult[i].date} | Magaza: ${filteredResult[i].store}<br>`;
            debugText += `   USD: $${parseFloat(filteredResult[i].usd_amount).toFixed(2)} | Miktar: ${filteredResult[i].quantity}<br>`;
            debugText += `   Musteri: ${filteredResult[i].partner}<br>`;
        }
        
        debugInfo.innerHTML = debugText;
        debugPanel.style.display = 'block';
    }
    
    // Özeti güncelle
    if (typeof updateSummary === 'function') {
        updateSummary(filteredResult);
    }
}

/**
 * Tüm filtreleri sıfırlar
 */
function resetFilters() {
    // Tüm checkbox'ların seçimlerini temizle
    ['filterBrand', 'filterCategory1', 'filterCategory2', 'filterCategory3', 'filterCategory4',
     'filterSalesPerson', 'filterStore', 'filterCity', 'filterYear', 'filterMonth', 'filterDay'].forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);
        }
    });
    
    // Seçim sayılarını güncelle
    if (typeof updateSelectionCount === 'function') {
        ['countBrand', 'countCategory1', 'countCategory2', 'countCategory3', 'countCategory4',
         'countSalesPerson', 'countStore', 'countCity', 'countYear', 'countMonth', 'countDay'].forEach(id => {
            const countSpan = document.getElementById(id);
            if (countSpan) countSpan.textContent = '';
        });
    }
    
    const smartSearchEl = document.getElementById('smartSearch');
    if (smartSearchEl) smartSearchEl.value = '';
    
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) debugPanel.style.display = 'none';
    
    const aiAnalysisPanel = document.getElementById('aiAnalysisPanel');
    if (aiAnalysisPanel) aiAnalysisPanel.style.display = 'none';
    
    // Global filteredData'yı tüm veriye eşitle
    const allData = (typeof window !== 'undefined' && window.allData) || [];
    // STACK OVERFLOW ÖNLEME: Spread yerine slice kullan (büyük array'lerde güvenli)
    const filteredResult = allData.slice();
    
    if (typeof window !== 'undefined') {
        window.filteredData = filteredResult;
    }
    
    // Özeti güncelle
    if (typeof updateSummary === 'function') {
        updateSummary(filteredResult);
    }
}

// ==================== AI-POWERED SMART SEARCH ====================

/**
 * 🤖 AI AGENT - Gelişmiş Doğal Dil İşleme Motoru
 * @param {string} query - Kullanıcı sorgusu
 */
function applySmartSearch(query = null) {
    const searchInput = document.getElementById('smartSearch');
    const queryText = query || (searchInput ? searchInput.value.trim() : '');
    
    if (!queryText) {
        resetFilters();
        return;
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🤖 AI AGENT BAŞLATILIYOR...');
        safeConsole.log('📝 Sorgu:', queryText);
    }
    
    // Önce filtreleri sıfırla
    resetFilters();
    
    // AI Agent analizi
    const aiAnalysis = analyzeQueryWithAI(queryText);
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🧠 AI Analiz Sonucu:', aiAnalysis);
    }
    
    // Filtreleri uygula
    applyAIFilters(aiAnalysis);
    
    // Veriyi filtrele
    const allData = (typeof window !== 'undefined' && window.allData) || [];
    const filteredResult = filterDataWithAI(allData, aiAnalysis);
    
    // Global filteredData'yı güncelle
    if (typeof window !== 'undefined') {
        window.filteredData = filteredResult;
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`✅ AI Agent Sonucu: ${filteredResult.length} kayıt bulundu`);
    }
    
    // Gelişmiş soru tipleri için özel analiz
    if (aiAnalysis.queryType !== 'basic') {
        performAdvancedAnalysis(aiAnalysis, filteredResult);
    } else {
        // Kullanıcıya AI'nın ne anladığını göster
        showAIInterpretation(aiAnalysis, filteredResult.length);
    }
    
    // Özeti güncelle
    if (typeof updateSummary === 'function') {
        updateSummary(filteredResult);
    }
}

/**
 * 🧠 AI Analiz Motoru - GELİŞMİŞ VERSİYON
 * @param {string} query - Kullanıcı sorgusu
 * @returns {Object} Analiz sonucu
 */
function analyzeQueryWithAI(query) {
    const allData = (typeof window !== 'undefined' && window.allData) || [];
    const lowerQuery = query.toLowerCase();
    
    const analysis = {
        intent: 'search', // search, filter, analyze, compare, recommendation
        queryType: 'basic', // basic, person_analysis, city_analysis, product_recommendation
        entities: {
            stores: [],
            brands: [],
            categories: [],
            cities: [],
            salesPersons: [],
            products: [],
            dateRange: null,
            years: [],
            months: [],
            keywords: []
        },
        question: {
            type: null, // "who_sold_what", "city_bought_what", "where_to_sell", "best_for"
            subject: null, // Kişi adı, şehir adı, ürün adı
            object: null, // Ürün, marka, kategori
            action: null // "sattı", "aldı", "satmalı", "konumlandırmalı"
        },
        confidence: 0,
        interpretation: '',
        needsGPT: false // Karmaşık soru mu?
    };
    
    // ==================== GELİŞMİŞ SORU TİPİ TESPİTİ ====================
    
    // 1. "X en çok hangi Y sattı/aldı?" pattern
    const personSoldPattern = /(.+?)\s+(en\s+çok|en\s+fazla)?\s*hangi\s+(ürün|marka|kategori|model).*?(sattı|satmış|satıyor)/i;
    const personSoldMatch = query.match(personSoldPattern);
    
    if (personSoldMatch) {
        analysis.queryType = 'person_analysis';
        analysis.question.type = 'who_sold_what';
        analysis.question.subject = personSoldMatch[1].trim();
        analysis.question.object = personSoldMatch[3]; // ürün, marka, kategori
        analysis.question.action = 'sattı';
        analysis.intent = 'analyze';
        if (typeof safeConsole !== 'undefined') {
            safeConsole.log('🎯 Tespit: Kişi analizi -', analysis.question.subject, 'hangi', analysis.question.object, 'sattı?');
        }
    }
    
    // 2. "X hangi Y aldı?" pattern (Şehir/Müşteri bazlı)
    const cityBoughtPattern = /(.+?)\s+(en\s+çok|en\s+fazla)?\s*hangi\s+(marka|model|kategori|ürün).*?(aldı|almış|alıyor|satın\s+aldı)/i;
    const cityBoughtMatch = query.match(cityBoughtPattern);
    
    if (cityBoughtMatch) {
        analysis.queryType = 'city_analysis';
        analysis.question.type = 'city_bought_what';
        analysis.question.subject = cityBoughtMatch[1].trim();
        analysis.question.object = cityBoughtMatch[3];
        analysis.question.action = 'aldı';
        analysis.intent = 'analyze';
        if (typeof safeConsole !== 'undefined') {
            safeConsole.log('🎯 Tespit: Şehir/Müşteri analizi -', analysis.question.subject, 'hangi', analysis.question.object, 'aldı?');
        }
    }
    
    // 3. "Hangi X'de Y daha çok satıyor/satar?" pattern (Öneri)
    const whereToSellPattern = /hangi\s+(mağaza|şehir|yer).*?(satmalı|satmalıyım|satmak|konumlandır|daha\s+çok\s+sat)/i;
    const whereToSellMatch = query.match(whereToSellPattern);
    
    if (whereToSellMatch) {
        analysis.queryType = 'product_recommendation';
        analysis.question.type = 'where_to_sell';
        analysis.question.action = 'satmalı';
        analysis.intent = 'recommendation';
        analysis.needsGPT = true; // Öneri için GPT kullanılabilir
        if (typeof safeConsole !== 'undefined') {
            safeConsole.log('🎯 Tespit: Ürün konumlandırma önerisi');
        }
    }
    
    // 4. "X için en iyi Y nedir?" pattern
    const bestForPattern = /(.+?)\s+için\s+en\s+iyi\s+(mağaza|şehir|yer|kategori)/i;
    const bestForMatch = query.match(bestForPattern);
    
    if (bestForMatch) {
        analysis.queryType = 'product_recommendation';
        analysis.question.type = 'best_for';
        analysis.question.subject = bestForMatch[1].trim();
        analysis.question.object = bestForMatch[2];
        analysis.intent = 'recommendation';
        if (typeof safeConsole !== 'undefined') {
            safeConsole.log('🎯 Tespit: En iyi yer önerisi -', analysis.question.subject, 'için');
        }
    }
    
    // 5. "Hangi X Y'de popüler/çok satıyor?" pattern
    const popularWherePattern = /hangi\s+(ürün|marka|kategori).*?(şehir|mağaza|yer).*?(popüler|çok\s+sat|başarılı)/i;
    const popularWhereMatch = query.match(popularWherePattern);
    
    if (popularWhereMatch) {
        analysis.queryType = 'city_analysis';
        analysis.question.type = 'what_popular_where';
        analysis.question.object = popularWhereMatch[1];
        analysis.intent = 'analyze';
        if (typeof safeConsole !== 'undefined') {
            safeConsole.log('🎯 Tespit: Popülerlik analizi');
        }
    }
    
    // 1. MAĞAZA TESPİTİ (Fuzzy matching ile)
    const allStores = [...new Set(allData.map(item => item.store).filter(Boolean))];
    if (typeof fuzzyMatch !== 'undefined') {
        allStores.forEach(store => {
            const storeLower = store.toLowerCase();
            // Tam eşleşme veya kısmi eşleşme
            if (lowerQuery.includes(storeLower) || 
                storeLower.includes(lowerQuery) ||
                fuzzyMatch(lowerQuery, storeLower)) {
                analysis.entities.stores.push(store);
            }
        });
    } else {
        // Fallback: sadece basit eşleşme
        allStores.forEach(store => {
            if (lowerQuery.includes(store.toLowerCase()) || store.toLowerCase().includes(lowerQuery)) {
                analysis.entities.stores.push(store);
            }
        });
    }
    
    // Yaygın mağaza kısaltmaları
    const storeAliases = {
        'aka': 'akasya', 'kadi': 'kadıköy', 'kadı': 'kadıköy',
        'beylik': 'beylikdüzü', 'beyl': 'beylikdüzü'
    };
    for (const [alias, fullName] of Object.entries(storeAliases)) {
        if (lowerQuery.includes(alias)) {
            const matchingStores = allStores.filter(s => s.toLowerCase().includes(fullName));
            analysis.entities.stores.push(...matchingStores);
        }
    }
    
    // 2. MARKA TESPİTİ
    const allBrands = [...new Set(allData.map(item => item.brand).filter(Boolean))];
    allBrands.forEach(brand => {
        if (lowerQuery.includes(brand.toLowerCase())) {
            analysis.entities.brands.push(brand);
        }
    });
    
    // 3. KATEGORİ TESPİTİ (Tüm seviyeler)
    const allCategories = new Set();
    allData.forEach(item => {
        [item.category_1, item.category_2, item.category_3, item.category_4].forEach(cat => {
            if (cat) allCategories.add(cat);
        });
    });
    Array.from(allCategories).forEach(category => {
        if (lowerQuery.includes(category.toLowerCase())) {
            analysis.entities.categories.push(category);
        }
    });
    
    // Yaygın kategori anahtar kelimeleri
    const categoryKeywords = {
        'gitar': ['gitar', 'guitar'],
        'piyano': ['piyano', 'piano'],
        'davul': ['davul', 'drum', 'bateri'],
        'keman': ['keman', 'violin'],
        'saz': ['saz', 'bağlama'],
        'aksesu': ['aksesuar', 'aksesuarlar']
    };
    for (const [key, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => lowerQuery.includes(kw))) {
            const matchingCats = Array.from(allCategories).filter(c => 
                c.toLowerCase().includes(key)
            );
            analysis.entities.categories.push(...matchingCats);
        }
    }
    
    // 4. TARİH ANALİZİ (Gelişmiş)
    // "son X gün/ay" tespiti
    const timePatterns = [
        /son\s+(\d+)\s+(gün|gun)/i,
        /son\s+(\d+)\s+(ay)/i,
        /son\s+(\d+)\s+(hafta)/i,
        /geçen\s+(\d+)\s+(gün|gun|ay|hafta)/i,
        /gecen\s+(\d+)\s+(gün|gun|ay|hafta)/i
    ];
    
    for (const pattern of timePatterns) {
        const match = query.match(pattern);
        if (match) {
            const amount = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            const today = new Date();
            
            if (unit.includes('ay')) {
                today.setMonth(today.getMonth() - amount);
            } else if (unit.includes('hafta')) {
                today.setDate(today.getDate() - (amount * 7));
            } else {
                today.setDate(today.getDate() - amount);
            }
            
            analysis.entities.dateRange = {
                from: today.toISOString().split('T')[0],
                to: new Date().toISOString().split('T')[0],
                description: `Son ${amount} ${unit}`
            };
            break;
        }
    }
    
    // Ay isimleri (Türkçe ve İngilizce)
    const monthNames = {
        'ocak': '01', 'january': '01', 'jan': '01',
        'şubat': '02', 'subat': '02', 'february': '02', 'feb': '02',
        'mart': '03', 'march': '03', 'mar': '03',
        'nisan': '04', 'april': '04', 'apr': '04',
        'mayıs': '05', 'mayis': '05', 'may': '05',
        'haziran': '06', 'june': '06', 'jun': '06',
        'temmuz': '07', 'july': '07', 'jul': '07',
        'ağustos': '08', 'agustos': '08', 'august': '08', 'aug': '08',
        'eylül': '09', 'eylul': '09', 'september': '09', 'sep': '09',
        'ekim': '10', 'october': '10', 'oct': '10',
        'kasım': '11', 'kasim': '11', 'november': '11', 'nov': '11',
        'aralık': '12', 'aralik': '12', 'december': '12', 'dec': '12'
    };
    
    for (const [monthName, monthNum] of Object.entries(monthNames)) {
        if (lowerQuery.includes(monthName)) {
            analysis.entities.months.push(monthNum);
        }
    }
    
    // Yıl tespiti (2020-2030)
    const yearMatches = query.match(/\b(202[0-9])\b/g);
    if (yearMatches) {
        analysis.entities.years.push(...yearMatches);
    }
    
    // 5. ŞEHİR TESPİTİ
    const allCities = [...new Set(allData.map(item => item.city).filter(Boolean))];
    allCities.forEach(city => {
        if (lowerQuery.includes(city.toLowerCase())) {
            analysis.entities.cities.push(city);
        }
    });
    
    // 6. SATIŞ TEMSİLCİSİ TESPİTİ (Fuzzy matching ile)
    const allSalesPersons = [...new Set(allData.map(item => item.sales_person).filter(Boolean))];
    allSalesPersons.forEach(person => {
        const personLower = person.toLowerCase();
        // Tam eşleşme veya kısmi eşleşme (ad veya soyad)
        const queryWords = lowerQuery.split(/\s+/);
        const personWords = personLower.split(/\s+/);
        
        const matches = queryWords.some(qw => 
            personWords.some(pw => pw.includes(qw) || qw.includes(pw))
        );
        
        if (matches || lowerQuery.includes(personLower)) {
            analysis.entities.salesPersons.push(person);
        }
    });
    
    // 6.5. ÜRÜN TESPİTİ (Yeni ürün önerileri için)
    const allProducts = [...new Set(allData.map(item => item.product).filter(Boolean))];
    
    // Ürün anahtar kelimeleri
    const productKeywords = {
        'gitar': ['gitar', 'guitar', 'elektro gitar', 'akustik gitar'],
        'piyano': ['piyano', 'piano', 'dijital piyano', 'akustik piyano'],
        'davul': ['davul', 'drum', 'bateri', 'davul seti'],
        'keman': ['keman', 'violin'],
        'saz': ['saz', 'bağlama'],
        'amfi': ['amfi', 'amplifier', 'amplifikatör']
    };
    
    for (const [key, keywords] of Object.entries(productKeywords)) {
        if (keywords.some(kw => lowerQuery.includes(kw))) {
            const matchingProducts = allProducts.filter(p => 
                p.toLowerCase().includes(key)
            );
            analysis.entities.products.push(...matchingProducts.slice(0, 5)); // İlk 5 ürün
        }
    }
    
    // 7. GENEL ANAHTAR KELİMELER
    const stopWords = ['ve', 'veya', 'ile', 'için', 'son', 'gün', 'gun', 'ay', 'yıl', 'yil', 
                       'toplam', 'kaç', 'kac', 'ne', 'kadar', 'göster', 'goster', 'bul', 'ara'];
    const words = query.toLowerCase().split(/\s+/).filter(w => 
        w.length > 2 && !stopWords.includes(w) && !/^\d+$/.test(w)
    );
    analysis.entities.keywords = words;
    
    // 8. GÜVENİLİRLİK SKORU
    let confidence = 0;
    if (analysis.entities.stores.length > 0) confidence += 30;
    if (analysis.entities.brands.length > 0) confidence += 25;
    if (analysis.entities.categories.length > 0) confidence += 20;
    if (analysis.entities.dateRange || analysis.entities.years.length > 0 || analysis.entities.months.length > 0) confidence += 15;
    if (analysis.entities.keywords.length > 0) confidence += 10;
    analysis.confidence = Math.min(confidence, 100);
    
    // 9. YORUMLAMA
    const parts = [];
    if (analysis.entities.stores.length > 0) parts.push(`Mağaza: ${analysis.entities.stores.join(', ')}`);
    if (analysis.entities.brands.length > 0) parts.push(`Marka: ${analysis.entities.brands.join(', ')}`);
    if (analysis.entities.categories.length > 0) parts.push(`Kategori: ${analysis.entities.categories.join(', ')}`);
    if (analysis.entities.dateRange) parts.push(`Tarih: ${analysis.entities.dateRange.description}`);
    else if (analysis.entities.years.length > 0) parts.push(`Yıl: ${analysis.entities.years.join(', ')}`);
    if (analysis.entities.months.length > 0) parts.push(`Ay: ${analysis.entities.months.join(', ')}`);
    if (analysis.entities.keywords.length > 0) parts.push(`Anahtar: ${analysis.entities.keywords.join(', ')}`);
    
    analysis.interpretation = parts.length > 0 ? parts.join(' | ') : 'Genel arama';
    
    return analysis;
}

/**
 * 🔧 AI Filtrelerini Uygula
 * @param {Object} analysis - AI analiz sonucu
 */
function applyAIFilters(analysis) {
    // Mağaza filtrelerini seç
    if (analysis.entities.stores.length > 0) {
        const storeContainer = document.getElementById('filterStore');
        if (storeContainer) {
            const checkboxes = storeContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                if (analysis.entities.stores.some(store => 
                    cb.value.toLowerCase().includes(store.toLowerCase())
                )) {
                    cb.checked = true;
                }
            });
            if (typeof updateSelectionCount === 'function') {
                updateSelectionCount('filterStore', 'countStore');
            }
        }
    }
    
    // Marka filtrelerini seç
    if (analysis.entities.brands.length > 0) {
        const brandContainer = document.getElementById('filterBrand');
        if (brandContainer) {
            const checkboxes = brandContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                if (analysis.entities.brands.includes(cb.value)) {
                    cb.checked = true;
                }
            });
            if (typeof updateSelectionCount === 'function') {
                updateSelectionCount('filterBrand', 'countBrand');
            }
        }
    }
    
    // Yıl filtrelerini seç
    if (analysis.entities.years.length > 0) {
        const yearContainer = document.getElementById('filterYear');
        if (yearContainer) {
            const checkboxes = yearContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                if (analysis.entities.years.includes(cb.value)) {
                    cb.checked = true;
                }
            });
            if (typeof updateSelectionCount === 'function') {
                updateSelectionCount('filterYear', 'countYear');
            }
        }
    }
    
    // Ay filtrelerini seç
    if (analysis.entities.months.length > 0) {
        const monthContainer = document.getElementById('filterMonth');
        if (monthContainer) {
            const checkboxes = monthContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                if (analysis.entities.months.includes(cb.value)) {
                    cb.checked = true;
                }
            });
            if (typeof updateSelectionCount === 'function') {
                updateSelectionCount('filterMonth', 'countMonth');
            }
        }
    }
}

/**
 * 🔍 AI ile Veri Filtreleme
 * @param {Array} data - Filtrelenecek veri
 * @param {Object} analysis - AI analiz sonucu
 * @returns {Array} Filtrelenmiş veri
 */
function filterDataWithAI(data, analysis) {
    return data.filter(item => {
        // Mağaza kontrolü
        if (analysis.entities.stores.length > 0) {
            const itemStore = (item.store || '').toLowerCase();
            const matches = analysis.entities.stores.some(store => 
                itemStore.includes(store.toLowerCase())
            );
            if (!matches) return false;
        }
        
        // Marka kontrolü
        if (analysis.entities.brands.length > 0) {
            if (!analysis.entities.brands.includes(item.brand)) return false;
        }
        
        // Kategori kontrolü (tüm seviyeler)
        if (analysis.entities.categories.length > 0) {
            const itemCategories = [item.category_1, item.category_2, item.category_3, item.category_4]
                .filter(Boolean).map(c => c.toLowerCase());
            const matches = analysis.entities.categories.some(cat => 
                itemCategories.some(ic => ic.includes(cat.toLowerCase()) || cat.toLowerCase().includes(ic))
            );
            if (!matches) return false;
        }
        
        // Tarih aralığı kontrolü
        if (analysis.entities.dateRange) {
            if (!item.date || item.date < analysis.entities.dateRange.from) return false;
        }
        
        // Yıl kontrolü
        if (analysis.entities.years.length > 0 && item.date) {
            const itemYear = item.date.split('-')[0];
            if (!analysis.entities.years.includes(itemYear)) return false;
        }
        
        // Ay kontrolü
        if (analysis.entities.months.length > 0 && item.date) {
            const itemMonth = item.date.split('-')[1];
            if (!analysis.entities.months.includes(itemMonth)) return false;
        }
        
        // Şehir kontrolü
        if (analysis.entities.cities.length > 0) {
            if (!analysis.entities.cities.includes(item.city)) return false;
        }
        
        // Satış temsilcisi kontrolü
        if (analysis.entities.salesPersons.length > 0) {
            if (!analysis.entities.salesPersons.includes(item.sales_person)) return false;
        }
        
        // Anahtar kelime kontrolü (fuzzy)
        if (analysis.entities.keywords.length > 0) {
            const searchableText = [
                item.partner, item.product, item.brand,
                item.category_1, item.category_2, item.category_3, item.category_4,
                item.sales_person, item.store, item.city
            ].filter(Boolean).join(' ').toLowerCase();
            
            const matches = analysis.entities.keywords.some(keyword => 
                searchableText.includes(keyword)
            );
            if (!matches) return false;
        }
        
        return true;
    });
}

/**
 * 💬 AI Yorumunu Göster
 * @param {Object} analysis - AI analiz sonucu
 * @param {number} resultCount - Sonuç sayısı
 */
function showAIInterpretation(analysis, resultCount) {
    const debugPanel = document.getElementById('debugPanel');
    const debugInfo = document.getElementById('debugInfo');
    
    if (!debugPanel || !debugInfo) return;
    
    let html = `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 10px; margin-bottom: 15px;">`;
    html += `<h4 style="margin: 0 0 10px 0; color: white;">🤖 AI Agent Analizi</h4>`;
    html += `<p style="margin: 5px 0; font-size: 0.95em;"><strong>Anladığım:</strong> ${analysis.interpretation}</p>`;
    html += `<p style="margin: 5px 0; font-size: 0.9em;">📊 Güvenilirlik: ${analysis.confidence}% | 🎯 Sonuç: ${resultCount} kayıt</p>`;
    html += `</div>`;
    
    html += `<strong>🔍 Tespit Edilen Varlıklar:</strong><br>`;
    if (analysis.entities.stores.length > 0) html += `🏪 Mağazalar: ${analysis.entities.stores.join(', ')}<br>`;
    if (analysis.entities.brands.length > 0) html += `🏷️ Markalar: ${analysis.entities.brands.join(', ')}<br>`;
    if (analysis.entities.categories.length > 0) html += `📂 Kategoriler: ${analysis.entities.categories.join(', ')}<br>`;
    if (analysis.entities.dateRange) html += `📅 Tarih: ${analysis.entities.dateRange.description}<br>`;
    if (analysis.entities.years.length > 0) html += `📆 Yıl: ${analysis.entities.years.join(', ')}<br>`;
    if (analysis.entities.months.length > 0) html += `📆 Ay: ${analysis.entities.months.join(', ')}<br>`;
    if (analysis.entities.cities.length > 0) html += `🌍 Şehir: ${analysis.entities.cities.join(', ')}<br>`;
    if (analysis.entities.salesPersons.length > 0) html += `👤 Satış Tem.: ${analysis.entities.salesPersons.join(', ')}<br>`;
    if (analysis.entities.keywords.length > 0) html += `🔑 Anahtar Kelimeler: ${analysis.entities.keywords.join(', ')}<br>`;
    
    debugInfo.innerHTML = html;
    debugPanel.style.display = 'block';
}

/**
 * 🎯 GELİŞMİŞ ANALİZ (Kişi, Şehir, Öneri Sorguları)
 * @param {Object} analysis - AI analiz sonucu
 * @param {Array} data - Filtrelenmiş veri
 */
function performAdvancedAnalysis(analysis, data) {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🎯 Gelişmiş analiz başlatılıyor:', analysis.queryType);
    }
    
    const debugPanel = document.getElementById('debugPanel');
    const debugInfo = document.getElementById('debugInfo');
    
    if (!debugPanel || !debugInfo) return;
    
    let html = `<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px;">`;
    html += `<h3 style="margin: 0 0 15px 0; color: white;">🤖 Gelişmiş AI Analizi</h3>`;
    
    if (analysis.queryType === 'person_analysis') {
        // "Mustafa Kılıç en çok hangi ürünü sattı?"
        const personName = analysis.question.subject;
        const objectType = analysis.question.object; // ürün, marka, kategori
        
        // Kişinin verilerini filtrele
        const personData = data.filter(item => 
            item.sales_person && item.sales_person.toLowerCase().includes(personName.toLowerCase())
        );
        
        if (personData.length === 0) {
            html += `<p>⚠️ "${personName}" adlı satış temsilcisi bulunamadı.</p>`;
        } else {
            // Analiz yap
            const results = {};
            personData.forEach(item => {
                let key;
                if (objectType === 'ürün') key = item.product;
                else if (objectType === 'marka') key = item.brand;
                else if (objectType === 'kategori') key = item.category_1;
                else if (objectType === 'model') key = item.product;
                
                if (key) {
                    if (!results[key]) results[key] = {sales: 0, count: 0};
                    results[key].sales += parseFloat(item.usd_amount || 0);
                    results[key].count += 1;
                }
            });
            
            // Sırala
            const sorted = Object.entries(results).sort((a, b) => b[1].sales - a[1].sales);
            const top5 = sorted.slice(0, 5);
            
            html += `<p style="font-size: 1.1em; margin-bottom: 15px;">📊 <strong>${personName}</strong> analizi:</p>`;
            html += `<p>💰 Toplam Satış: <strong>$${personData.reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</strong></p>`;
            html += `<p>📦 Toplam İşlem: <strong>${personData.length}</strong></p>`;
            html += `<hr style="border: 1px solid rgba(255,255,255,0.3); margin: 15px 0;">`;
            html += `<p style="font-size: 1.05em; margin-bottom: 10px;">🏆 En Çok Sattığı ${objectType.charAt(0).toUpperCase() + objectType.slice(1)}ler:</p>`;
            
            top5.forEach((item, index) => {
                html += `<div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 5px; margin: 8px 0;">`;
                html += `<strong>${index + 1}. ${item[0]}</strong><br>`;
                html += `💰 Satış: $${item[1].sales.toLocaleString('tr-TR', {minimumFractionDigits: 2})} | 📦 Adet: ${item[1].count}`;
                html += `</div>`;
            });
            
            // Öneri
            html += `<hr style="border: 1px solid rgba(255,255,255,0.3); margin: 15px 0;">`;
            if (top5.length > 0) {
                html += `<p style="font-size: 1em;">💡 <strong>Öneri:</strong> ${personName}, <strong>${top5[0][0]}</strong> konusunda uzman. Bu ${objectType}'e odaklanmalı ve stok takibi yapmalı.</p>`;
            }
        }
        
    } else if (analysis.queryType === 'city_analysis') {
        // "İstanbul en çok hangi marka piyano aldı?"
        const cityName = analysis.question.subject;
        const objectType = analysis.question.object; // marka, model, kategori
        
        // Şehir verilerini filtrele
        let cityData = data.filter(item => 
            item.city && item.city.toLowerCase().includes(cityName.toLowerCase())
        );
        
        // Eğer partner adı ise
        if (cityData.length === 0) {
            cityData = data.filter(item => 
                item.partner && item.partner.toLowerCase().includes(cityName.toLowerCase())
            );
        }
        
        if (cityData.length === 0) {
            html += `<p>⚠️ "${cityName}" için veri bulunamadı.</p>`;
        } else {
            // Analiz yap
            const results = {};
            cityData.forEach(item => {
                let key;
                if (objectType === 'marka') key = item.brand;
                else if (objectType === 'model') key = item.product;
                else if (objectType === 'kategori') key = item.category_1;
                else if (objectType === 'ürün') key = item.product;
                
                if (key) {
                    if (!results[key]) results[key] = {sales: 0, count: 0};
                    results[key].sales += parseFloat(item.usd_amount || 0);
                    results[key].count += 1;
                }
            });
            
            // Sırala
            const sorted = Object.entries(results).sort((a, b) => b[1].sales - a[1].sales);
            const top5 = sorted.slice(0, 5);
            
            html += `<p style="font-size: 1.1em; margin-bottom: 15px;">📊 <strong>${cityName}</strong> analizi:</p>`;
            html += `<p>💰 Toplam Satış: <strong>$${cityData.reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</strong></p>`;
            html += `<p>📦 Toplam İşlem: <strong>${cityData.length}</strong></p>`;
            html += `<hr style="border: 1px solid rgba(255,255,255,0.3); margin: 15px 0;">`;
            html += `<p style="font-size: 1.05em; margin-bottom: 10px;">🏆 En Çok Tercih Edilen ${objectType.charAt(0).toUpperCase() + objectType.slice(1)}ler:</p>`;
            
            top5.forEach((item, index) => {
                html += `<div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 5px; margin: 8px 0;">`;
                html += `<strong>${index + 1}. ${item[0]}</strong><br>`;
                html += `💰 Satış: $${item[1].sales.toLocaleString('tr-TR', {minimumFractionDigits: 2})} | 📦 Adet: ${item[1].count}`;
                html += `</div>`;
            });
            
            // Öneri
            html += `<hr style="border: 1px solid rgba(255,255,255,0.3); margin: 15px 0;">`;
            if (top5.length > 0) {
                html += `<p style="font-size: 1em;">💡 <strong>Öneri:</strong> ${cityName}'da <strong>${top5[0][0]}</strong> en popüler. Bu ${objectType} için stok artırılmalı.</p>`;
            }
        }
        
    } else if (analysis.queryType === 'product_recommendation') {
        // "Hangi mağazada bu ürünü satmalıyım?"
        html += `<p style="font-size: 1.1em; margin-bottom: 15px;">🎯 Ürün Konumlandırma Önerisi</p>`;
        
        // Kategori veya marka bazlı analiz
        const storeData = {};
        
        data.forEach(item => {
            const store = item.store || 'Bilinmiyor';
            const category = item.category_1 || 'Bilinmiyor';
            
            if (!storeData[store]) storeData[store] = {sales: 0, count: 0, categories: {}};
            storeData[store].sales += parseFloat(item.usd_amount || 0);
            storeData[store].count += 1;
            
            if (!storeData[store].categories[category]) storeData[store].categories[category] = 0;
            storeData[store].categories[category] += parseFloat(item.usd_amount || 0);
        });
        
        // En başarılı mağazaları bul
        const sortedStores = Object.entries(storeData).sort((a, b) => b[1].sales - a[1].sales);
        const top3Stores = sortedStores.slice(0, 3);
        
        html += `<p>📊 Mağaza Performans Analizi:</p>`;
        
        top3Stores.forEach((store, index) => {
            const storeName = store[0];
            const storeStats = store[1];
            const topCategory = Object.entries(storeStats.categories).sort((a, b) => b[1] - a[1])[0];
            
            html += `<div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 5px; margin: 10px 0;">`;
            html += `<strong>${index + 1}. ${storeName}</strong><br>`;
            html += `💰 Toplam Satış: $${storeStats.sales.toLocaleString('tr-TR', {minimumFractionDigits: 2})}<br>`;
            html += `📦 İşlem Sayısı: ${storeStats.count}<br>`;
            html += `🏆 En Güçlü Kategori: ${topCategory ? topCategory[0] : 'N/A'}`;
            html += `</div>`;
        });
        
        // Öneri
        html += `<hr style="border: 1px solid rgba(255,255,255,0.3); margin: 15px 0;">`;
        html += `<p style="font-size: 1em;">💡 <strong>Öneri:</strong></p>`;
        if (top3Stores.length > 0) {
            html += `<p>• <strong>${top3Stores[0][0]}</strong> en yüksek satış performansına sahip.</p>`;
            html += `<p>• Yeni ürün için bu mağazayı tercih edin.</p>`;
            const topCategory = Object.entries(top3Stores[0][1].categories).sort((a, b) => b[1] - a[1])[0];
            if (topCategory) {
                html += `<p>• Özellikle <strong>${topCategory[0]}</strong> kategorisinde güçlü.</p>`;
            }
        }
        
        if (analysis.needsGPT) {
            html += `<hr style="border: 1px solid rgba(255,255,255,0.3); margin: 15px 0;">`;
            html += `<p style="font-size: 0.9em; opacity: 0.9;">🤖 <em>Daha detaylı analiz için GPT-4 kullanılabilir. (İsteğe bağlı)</em></p>`;
        }
    }
    
    html += `</div>`;
    
    debugInfo.innerHTML = html;
    debugPanel.style.display = 'block';
}

// Geriye dönük uyumluluk için window objesine export et
if (typeof window !== 'undefined') {
    window.applyFilters = applyFilters;
    window.resetFilters = resetFilters;
    window.applySmartSearch = applySmartSearch;
    window.analyzeQueryWithAI = analyzeQueryWithAI;
    window.applyAIFilters = applyAIFilters;
    window.filterDataWithAI = filterDataWithAI;
    window.showAIInterpretation = showAIInterpretation;
    window.performAdvancedAnalysis = performAdvancedAnalysis;
}

