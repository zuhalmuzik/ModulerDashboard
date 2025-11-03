/**
 * Location Utility Functions
 * Handles district name normalization with fuzzy matching
 * 
 * Dependencies:
 * - normalizeTurkish (string-utils.js)
 * - levenshteinDistance (string-utils.js)
 * - safeConsole (config.js)
 * - window.districtMappingCache (global cache from HTML)
 */

/**
 * İlçe ismini normalize eden fonksiyon (büyük mapping table + fuzzy matching)
 * @param {string} districtName - Normalize edilecek ilçe adı
 * @param {Array<string>} masterList - Mevcut ilçe listesi (fuzzy matching için)
 * @returns {string} Normalize edilmiş ilçe adı
 */
function normalizeDistrictName(districtName, masterList) {
    if (!districtName || districtName === 'Bilinmeyen') return districtName;
    
    // Cache'e erişim - window üzerinden (HTML'de tanımlı)
    const cache = (typeof window !== 'undefined' && window.districtMappingCache) ? 
                  window.districtMappingCache : new Map();
    
    // PERFORMANS: Cache kontrolü
    const cacheKey = `${districtName}_${masterList.length}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    
    // PERFORMANS: Önce hızlı kontrol
    const lowerDistrict = districtName.toLowerCase().trim();
    
    // Özel mapping tablosu - benzer isimleri birleştir (TÜM TÜRKİYE)
    const districtMapping = {
        // === GENEL MERKEZ VARYASYONLARI ===
        'merkez': 'MERKEZ',
        'MERKEZ': 'MERKEZ',
        'şehir merkezi': 'MERKEZ',
        'ŞEHİR MERKEZİ': 'MERKEZ',
        'centrum': 'MERKEZ',
        'CENTRUM': 'MERKEZ',
        'merkez ilçe': 'MERKEZ',
        'MERKEZ İLÇE': 'MERKEZ',
        'merkez mahalle': 'MERKEZ',
        'MERKEZ MAHALLE': 'MERKEZ',
        'şehir merkez': 'MERKEZ',
        'ŞEHİR MERKEZ': 'MERKEZ',
        'merkez bölge': 'MERKEZ',
        'MERKEZ BÖLGE': 'MERKEZ',
        
        // === GENEL KÖY VARYASYONLARI ===
        'köy': 'KÖY',
        'KÖY': 'KÖY',
        'köyü': 'KÖY',
        'KÖYÜ': 'KÖY',
        'village': 'KÖY',
        'VILLAGE': 'KÖY',
        'köy merkezi': 'KÖY',
        'KÖY MERKEZİ': 'KÖY',
        'köy mahallesi': 'KÖY',
        'KÖY MAHALLESİ': 'KÖY',
        
        // === GENEL MAHALLE VARYASYONLARI ===
        'mahalle': 'MAHALLE',
        'MAHALLE': 'MAHALLE',
        'mahallesi': 'MAHALLE',
        'MAHALLESİ': 'MAHALLE',
        'neighborhood': 'MAHALLE',
        'NEIGHBORHOOD': 'MAHALLE',
        'mahalle merkezi': 'MAHALLE',
        'MAHALLE MERKEZİ': 'MAHALLE',
        
        // === ZONGULDAK İLÇELERİ ===
        'ereğli': 'EREĞLİ',
        'eregli': 'EREĞLİ', 
        'karadeniz ereğli': 'EREĞLİ',
        'karadeniz ereğlisi': 'EREĞLİ',
        'kdz ereğli': 'EREĞLİ',
        'kdz eregli': 'EREĞLİ',
        'EREĞLİ': 'EREĞLİ',
        'KARADENİZ EREĞLİ': 'EREĞLİ',
        'KARADENİZ EREĞLİSİ': 'EREĞLİ',
        'KDZ EREĞLİ': 'EREĞLİ',
        'zonguldak': 'MERKEZ',
        'ZONGULDAK': 'MERKEZ',
        'zonguldak merkez': 'MERKEZ',
        'kilimli': 'KİLİMLİ',
        'kilimli merkez': 'KİLİMLİ',
        'KİLİMLİ': 'KİLİMLİ',
        'çaycuma': 'ÇAYCUMA',
        'caycuma': 'ÇAYCUMA',
        'ÇAYCUMA': 'ÇAYCUMA',
        'kozlu': 'KOZLU',
        'kozlu merkez': 'KOZLU',
        'KOZLU': 'KOZLU',
        'devrek': 'DEVREK',
        'devrek merkez': 'DEVREK',
        'DEVREK': 'DEVREK',
        'alapli': 'ALAPLI',
        'alaplı': 'ALAPLI',
        'ALAPLI': 'ALAPLI',
        'ALAPLİ': 'ALAPLI',
        'gökçebey': 'GÖKÇEBEY',
        'gokcebey': 'GÖKÇEBEY',
        'GÖKÇEBEY': 'GÖKÇEBEY',
        'GOKCEBEY': 'GÖKÇEBEY',
        
        // === İSTANBUL İLÇELERİ ===
        'kadıköy': 'KADIKÖY',
        'KADIKÖY': 'KADIKÖY',
        'kadıköy merkez': 'KADIKÖY',
        'KADIKÖY MERKEZ': 'KADIKÖY',
        'kadıköy/istanbul': 'KADIKÖY',
        'KADIKÖY/İSTANBUL': 'KADIKÖY',
        'kadikoy': 'KADIKÖY',
        'KADIKOY': 'KADIKÖY',
        'beşiktaş': 'BEŞİKTAŞ',
        'BEŞİKTAŞ': 'BEŞİKTAŞ',
        'besiktas': 'BEŞİKTAŞ',
        'BESIKTAS': 'BEŞİKTAŞ',
        'beşiktaş merkez': 'BEŞİKTAŞ',
        'BEŞİKTAŞ MERKEZ': 'BEŞİKTAŞ',
        'şişli': 'ŞİŞLİ',
        'ŞİŞLİ': 'ŞİŞLİ',
        'sisli': 'ŞİŞLİ',
        'SISLI': 'ŞİŞLİ',
        'şişli merkez': 'ŞİŞLİ',
        'ŞİŞLİ MERKEZ': 'ŞİŞLİ',
        'fatih': 'FATİH',
        'FATİH': 'FATİH',
        'fatih merkez': 'FATİH',
        'FATİH MERKEZ': 'FATİH',
        'beyoğlu': 'BEYOĞLU',
        'BEYOĞLU': 'BEYOĞLU',
        'beyoglu': 'BEYOĞLU',
        'BEYOGLU': 'BEYOĞLU',
        'beyoğlu merkez': 'BEYOĞLU',
        'BEYOĞLU MERKEZ': 'BEYOĞLU',
        'üsküdar': 'ÜSKÜDAR',
        'ÜSKÜDAR': 'ÜSKÜDAR',
        'uskudar': 'ÜSKÜDAR',
        'USKUDAR': 'ÜSKÜDAR',
        'üsküdar merkez': 'ÜSKÜDAR',
        'ÜSKÜDAR MERKEZ': 'ÜSKÜDAR',
        
        // === ANKARA İLÇELERİ ===
        'çankaya': 'ÇANKAYA',
        'ÇANKAYA': 'ÇANKAYA',
        'cankaya': 'ÇANKAYA',
        'CANKAYA': 'ÇANKAYA',
        'çankaya merkez': 'ÇANKAYA',
        'ÇANKAYA MERKEZ': 'ÇANKAYA',
        'keçiören': 'KEÇİÖREN',
        'KEÇİÖREN': 'KEÇİÖREN',
        'kecioren': 'KEÇİÖREN',
        'KECIOREN': 'KEÇİÖREN',
        'keçiören merkez': 'KEÇİÖREN',
        'KEÇİÖREN MERKEZ': 'KEÇİÖREN',
        'mamak': 'MAMAK',
        'MAMAK': 'MAMAK',
        'mamak merkez': 'MAMAK',
        'MAMAK MERKEZ': 'MAMAK',
        'yenimahalle': 'YENİMAHALLE',
        'YENİMAHALLE': 'YENİMAHALLE',
        'yeni mahalle': 'YENİMAHALLE',
        'YENİ MAHALLE': 'YENİMAHALLE',
        'yenimahalle merkez': 'YENİMAHALLE',
        'YENİMAHALLE MERKEZ': 'YENİMAHALLE',
        
        // === İZMİR İLÇELERİ ===
        'konak': 'KONAK',
        'KONAK': 'KONAK',
        'konak merkez': 'KONAK',
        'KONAK MERKEZ': 'KONAK',
        'bornova': 'BORNOVA',
        'BORNOVA': 'BORNOVA',
        'bornova merkez': 'BORNOVA',
        'BORNOVA MERKEZ': 'BORNOVA',
        'karşıyaka': 'KARŞIYAKA',
        'KARŞIYAKA': 'KARŞIYAKA',
        'karsiyaka': 'KARŞIYAKA',
        'KARSIYAKA': 'KARŞIYAKA',
        'karşıyaka merkez': 'KARŞIYAKA',
        'KARŞIYAKA MERKEZ': 'KARŞIYAKA',
        'buca': 'BUCA',
        'BUCA': 'BUCA',
        'buca merkez': 'BUCA',
        'BUCA MERKEZ': 'BUCA',
        'çiğli': 'ÇİĞLİ',
        'ÇİĞLİ': 'ÇİĞLİ',
        'cigli': 'ÇİĞLİ',
        'CIGLI': 'ÇİĞLİ',
        'çiğli merkez': 'ÇİĞLİ',
        'ÇİĞLİ MERKEZ': 'ÇİĞLİ',
        
        // === GAZİANTEP İLÇELERİ ===
        'şahinbey': 'ŞAHİNBEY',
        'ŞAHİNBEY': 'ŞAHİNBEY',
        'sahinbey': 'ŞAHİNBEY',
        'SAHINBEY': 'ŞAHİNBEY',
        'şahinbey merkez': 'ŞAHİNBEY',
        'ŞAHİNBEY MERKEZ': 'ŞAHİNBEY',
        'şehitkamil': 'ŞEHİTKAMİL',
        'ŞEHİTKAMİL': 'ŞEHİTKAMİL',
        'sehitkamil': 'ŞEHİTKAMİL',
        'SEHITKAMIL': 'ŞEHİTKAMİL',
        'şehitkamil merkez': 'ŞEHİTKAMİL',
        'ŞEHİTKAMİL MERKEZ': 'ŞEHİTKAMİL',
        'gaziantep merkez': 'MERKEZ',
        'GAZİANTEP MERKEZ': 'MERKEZ',
        'gaziantep': 'MERKEZ',
        'GAZİANTEP': 'MERKEZ',
        
        // === BURSA İLÇELERİ ===
        'osmangazi': 'OSMANGAZİ',
        'OSMANGAZİ': 'OSMANGAZİ',
        'osmangazi merkez': 'OSMANGAZİ',
        'OSMANGAZİ MERKEZ': 'OSMANGAZİ',
        'nilüfer': 'NİLÜFER',
        'NİLÜFER': 'NİLÜFER',
        'nilufer': 'NİLÜFER',
        'NILUFER': 'NİLÜFER',
        'nilüfer merkez': 'NİLÜFER',
        'NİLÜFER MERKEZ': 'NİLÜFER',
        'yıldırım': 'YILDIRIM',
        'YILDIRIM': 'YILDIRIM',
        'yildirim': 'YILDIRIM',
        'YILDIRIM': 'YILDIRIM',
        'yıldırım merkez': 'YILDIRIM',
        'YILDIRIM MERKEZ': 'YILDIRIM',
        'bursa merkez': 'MERKEZ',
        'BURSA MERKEZ': 'MERKEZ',
        'bursa': 'MERKEZ',
        'BURSA': 'MERKEZ',
        
        // === ANTALYA İLÇELERİ ===
        'kepez': 'KEPEZ',
        'KEPEZ': 'KEPEZ',
        'kepez merkez': 'KEPEZ',
        'KEPEZ MERKEZ': 'KEPEZ',
        'muratpaşa': 'MURATPAŞA',
        'MURATPAŞA': 'MURATPAŞA',
        'muratpasa': 'MURATPAŞA',
        'MURATPASA': 'MURATPAŞA',
        'muratpaşa merkez': 'MURATPAŞA',
        'MURATPAŞA MERKEZ': 'MURATPAŞA',
        'konyaaltı': 'KONYAALTI',
        'KONYAALTI': 'KONYAALTI',
        'konyaalti': 'KONYAALTI',
        'KONYAALTI': 'KONYAALTI',
        'konyaaltı merkez': 'KONYAALTI',
        'KONYAALTI MERKEZ': 'KONYAALTI',
        'antalya merkez': 'MERKEZ',
        'ANTALYA MERKEZ': 'MERKEZ',
        'antalya': 'MERKEZ',
        'ANTALYA': 'MERKEZ',
        
        // === ADANA İLÇELERİ ===
        'seyhan': 'SEYHAN',
        'SEYHAN': 'SEYHAN',
        'seyhan merkez': 'SEYHAN',
        'SEYHAN MERKEZ': 'SEYHAN',
        'yüreğir': 'YÜREĞİR',
        'YÜREĞİR': 'YÜREĞİR',
        'yuregir': 'YÜREĞİR',
        'YUREGIR': 'YÜREĞİR',
        'yüreğir merkez': 'YÜREĞİR',
        'YÜREĞİR MERKEZ': 'YÜREĞİR',
        'çukurova': 'ÇUKUROVA',
        'ÇUKUROVA': 'ÇUKUROVA',
        'cukurova': 'ÇUKUROVA',
        'CUKUROVA': 'ÇUKUROVA',
        'çukurova merkez': 'ÇUKUROVA',
        'ÇUKUROVA MERKEZ': 'ÇUKUROVA',
        'adana merkez': 'MERKEZ',
        'ADANA MERKEZ': 'MERKEZ',
        'adana': 'MERKEZ',
        'ADANA': 'MERKEZ',
        
        // === TÜM TÜRKİYE GENEL MAPPING ===
        // Ek merkez varyasyonları (tüm şehirler için)
        'merkez ilçesi': 'MERKEZ',
        'MERKEZ İLÇESİ': 'MERKEZ',
        'merkez mahallesi': 'MERKEZ',
        'MERKEZ MAHALLESİ': 'MERKEZ',
        'şehir merkez': 'MERKEZ',
        'ŞEHİR MERKEZ': 'MERKEZ',
        'merkez bölgesi': 'MERKEZ',
        'MERKEZ BÖLGESİ': 'MERKEZ',
        
        // Ek köy varyasyonları (tüm şehirler için)
        'köy merkezi': 'KÖY',
        'KÖY MERKEZİ': 'KÖY',
        'köy mahallesi': 'KÖY',
        'KÖY MAHALLESİ': 'KÖY',
        'village': 'KÖY',
        'VILLAGE': 'KÖY',
        'köy merkez': 'KÖY',
        'KÖY MERKEZ': 'KÖY',
        'köy mahalle': 'KÖY',
        'KÖY MAHALLE': 'KÖY',
        
        // Ek mahalle varyasyonları (tüm şehirler için)
        'mahalle merkezi': 'MAHALLE',
        'MAHALLE MERKEZİ': 'MAHALLE',
        'neighborhood': 'MAHALLE',
        'NEIGHBORHOOD': 'MAHALLE',
        'mahalle merkez': 'MAHALLE',
        'MAHALLE MERKEZ': 'MAHALLE',
        'mahalle bölgesi': 'MAHALLE',
        'MAHALLE BÖLGESİ': 'MAHALLE',
        
        // === YAYGIN YAZIM HATALARI (TÜM ŞEHİRLER) ===
        // Muratpaşa varyasyonları (Antalya)
        'murataşpa': 'MURATPAŞA',
        'MURATAŞPA': 'MURATPAŞA',
        'murataşpa': 'MURATPAŞA',
        'MURATAPAŞA': 'MURATPAŞA',
        'murataşpa': 'MURATPAŞA',
        'MURATPŞA': 'MURATPAŞA',
        'muratpşa': 'MURATPAŞA',
        'MURTAPAŞA': 'MURATPAŞA',
        'murtapaş': 'MURATPAŞA',
        'MURTAPAŞ': 'MURATPAŞA',
        
        // ÜSKÜDAR varyasyonları (İstanbul)
        'üsküdar': 'ÜSKÜDAR',
        'ÜSKÜDAR': 'ÜSKÜDAR',
        'uskudar': 'ÜSKÜDAR',
        'USKUDAR': 'ÜSKÜDAR',
        'üsküdar1': 'ÜSKÜDAR',
        'ÜSKÜDAR1': 'ÜSKÜDAR',
        'üskdar': 'ÜSKÜDAR',
        'ÜSKDAR': 'ÜSKÜDAR',
        'üskgdar': 'ÜSKÜDAR',
        'ÜSKGDAR': 'ÜSKÜDAR',
        'üskgüdar': 'ÜSKÜDAR',
        'ÜSKGÜDAR': 'ÜSKÜDAR',
        'üsküadr': 'ÜSKÜDAR',
        'ÜSKÜADR': 'ÜSKÜDAR',
        'üsküar': 'ÜSKÜDAR',
        'ÜSKÜAR': 'ÜSKÜDAR',
        'üsküadar': 'ÜSKÜDAR',
        'ÜSKÜADAR': 'ÜSKÜDAR',
        'üskdüar': 'ÜSKÜDAR',
        'ÜSKDÜAR': 'ÜSKÜDAR',
        'üskdar1': 'ÜSKÜDAR',
        'ÜSKDAR1': 'ÜSKÜDAR',
        'üsküdr': 'ÜSKÜDAR',
        'ÜSKÜDR': 'ÜSKÜDAR',
        'üskdar': 'ÜSKÜDAR',
        'ÜSKDAR': 'ÜSKÜDAR',
        'üsküdar merkez': 'ÜSKÜDAR',
        'ÜSKÜDAR MERKEZ': 'ÜSKÜDAR',
        
        // ÜMRANİYE varyasyonları (İstanbul)
        'ümraniye': 'ÜMRANİYE',
        'ÜMRANİYE': 'ÜMRANİYE',
        'umraniye': 'ÜMRANİYE',
        'UMRANIYE': 'ÜMRANİYE',
        'ümranıye': 'ÜMRANİYE',
        'ÜMRANİYE': 'ÜMRANİYE',
        'ümranıye': 'ÜMRANİYE',
        'ÜMRANİYE': 'ÜMRANİYE',
        'ümranıye merkez': 'ÜMRANİYE',
        'ÜMRANİYE MERKEZ': 'ÜMRANİYE',
        'ümranıye merkez': 'ÜMRANİYE',
        'ÜMRANİYE MERKEZ': 'ÜMRANİYE',
        
        // ÇEKMEKÖY varyasyonları (İstanbul)
        'çekmeköy': 'ÇEKMEKÖY',
        'ÇEKMEKÖY': 'ÇEKMEKÖY',
        'cekmekoy': 'ÇEKMEKÖY',
        'CEKMEKOY': 'ÇEKMEKÖY',
        'çekmekoy': 'ÇEKMEKÖY',
        'ÇEKMEKOY': 'ÇEKMEKÖY',
        'çekmeköy merkez': 'ÇEKMEKÖY',
        'ÇEKMEKÖY MERKEZ': 'ÇEKMEKÖY',
        
        // ÇATALCA varyasyonları (İstanbul)
        'çatalca': 'ÇATALCA',
        'ÇATALCA': 'ÇATALCA',
        'catalca': 'ÇATALCA',
        'CATALCA': 'ÇATALCA',
        'çatalca merkez': 'ÇATALCA',
        'ÇATALCA MERKEZ': 'ÇATALCA',
        
        // Yaygın yazım hataları
        'merkez': 'MERKEZ',
        'MERKEZ': 'MERKEZ',
        'merkez ilçe': 'MERKEZ',
        'MERKEZ İLÇE': 'MERKEZ',
        'merkez ilçesi': 'MERKEZ',
        'MERKEZ İLÇESİ': 'MERKEZ',
        'merkez mahalle': 'MERKEZ',
        'MERKEZ MAHALLE': 'MERKEZ',
        'merkez mahallesi': 'MERKEZ',
        'MERKEZ MAHALLESİ': 'MERKEZ',
        'şehir merkez': 'MERKEZ',
        'ŞEHİR MERKEZ': 'MERKEZ',
        'şehir merkezi': 'MERKEZ',
        'ŞEHİR MERKEZİ': 'MERKEZ',
        'merkez bölge': 'MERKEZ',
        'MERKEZ BÖLGE': 'MERKEZ',
        'merkez bölgesi': 'MERKEZ',
        'MERKEZ BÖLGESİ': 'MERKEZ',
        
        // Diğer yaygın yazım hataları
        'kadıköy': 'KADIKÖY',
        'KADIKÖY': 'KADIKÖY',
        'kadikoy': 'KADIKÖY',
        'KADIKOY': 'KADIKÖY',
        'kadıköy merkez': 'KADIKÖY',
        'KADIKÖY MERKEZ': 'KADIKÖY',
        
        'beşiktaş': 'BEŞİKTAŞ',
        'BEŞİKTAŞ': 'BEŞİKTAŞ',
        'besiktas': 'BEŞİKTAŞ',
        'BESIKTAS': 'BEŞİKTAŞ',
        'beşiktaş merkez': 'BEŞİKTAŞ',
        'BEŞİKTAŞ MERKEZ': 'BEŞİKTAŞ',
        
        'şişli': 'ŞİŞLİ',
        'ŞİŞLİ': 'ŞİŞLİ',
        'sisli': 'ŞİŞLİ',
        'SISLI': 'ŞİŞLİ',
        'şişli merkez': 'ŞİŞLİ',
        'ŞİŞLİ MERKEZ': 'ŞİŞLİ',
        
        'fatih': 'FATİH',
        'FATİH': 'FATİH',
        'fatih merkez': 'FATİH',
        'FATİH MERKEZ': 'FATİH',
        
        'beyoğlu': 'BEYOĞLU',
        'BEYOĞLU': 'BEYOĞLU',
        'beyoglu': 'BEYOĞLU',
        'BEYOGLU': 'BEYOĞLU',
        'beyoğlu merkez': 'BEYOĞLU',
        'BEYOĞLU MERKEZ': 'BEYOĞLU',
        
        // === TÜM TÜRKİYE İLÇE VARYASYONLARI ===
        // Yaygın ilçe isimleri ve varyasyonları
        'merkez': 'MERKEZ',
        'MERKEZ': 'MERKEZ',
        'merkez ilçe': 'MERKEZ',
        'MERKEZ İLÇE': 'MERKEZ',
        'merkez ilçesi': 'MERKEZ',
        'MERKEZ İLÇESİ': 'MERKEZ',
        'merkez mahalle': 'MERKEZ',
        'MERKEZ MAHALLE': 'MERKEZ',
        'merkez mahallesi': 'MERKEZ',
        'MERKEZ MAHALLESİ': 'MERKEZ',
        'şehir merkez': 'MERKEZ',
        'ŞEHİR MERKEZ': 'MERKEZ',
        'şehir merkezi': 'MERKEZ',
        'ŞEHİR MERKEZİ': 'MERKEZ',
        'merkez bölge': 'MERKEZ',
        'MERKEZ BÖLGE': 'MERKEZ',
        'merkez bölgesi': 'MERKEZ',
        'MERKEZ BÖLGESİ': 'MERKEZ',
        
        // Köy varyasyonları
        'köy': 'KÖY',
        'KÖY': 'KÖY',
        'köy merkez': 'KÖY',
        'KÖY MERKEZ': 'KÖY',
        'köy merkezi': 'KÖY',
        'KÖY MERKEZİ': 'KÖY',
        'köy mahalle': 'KÖY',
        'KÖY MAHALLE': 'KÖY',
        'köy mahallesi': 'KÖY',
        'KÖY MAHALLESİ': 'KÖY',
        'village': 'KÖY',
        'VILLAGE': 'KÖY',
        
        // Mahalle varyasyonları
        'mahalle': 'MAHALLE',
        'MAHALLE': 'MAHALLE',
        'mahalle merkez': 'MAHALLE',
        'MAHALLE MERKEZ': 'MAHALLE',
        'mahalle merkezi': 'MAHALLE',
        'MAHALLE MERKEZİ': 'MAHALLE',
        'mahalle bölge': 'MAHALLE',
        'MAHALLE BÖLGE': 'MAHALLE',
        'mahalle bölgesi': 'MAHALLE',
        'MAHALLE BÖLGESİ': 'MAHALLE',
        'neighborhood': 'MAHALLE',
        'NEIGHBORHOOD': 'MAHALLE',
        
        // Alanya varyasyonları
        'alanya': 'ALANYA',
        'ALANYA': 'ALANYA',
        'alanya merkez': 'ALANYA',
        'ALANYA MERKEZ': 'ALANYA',
        'alanya ilçe': 'ALANYA',
        'ALANYA İLÇE': 'ALANYA',
        
        // Manavgat varyasyonları
        'manavgat': 'MANAVGAT',
        'MANAVGAT': 'MANAVGAT',
        'manavgat merkez': 'MANAVGAT',
        'MANAVGAT MERKEZ': 'MANAVGAT',
        'managat': 'MANAVGAT',
        'MANAGAT': 'MANAVGAT',
        'managat merkez': 'MANAVGAT',
        'MANAGAT MERKEZ': 'MANAVGAT',
        
        // Kepez varyasyonları
        'kepez': 'KEPEZ',
        'KEPEZ': 'KEPEZ',
        'kepez merkez': 'KEPEZ',
        'KEPEZ MERKEZ': 'KEPEZ',
        'kepez ilçe': 'KEPEZ',
        'KEPEZ İLÇE': 'KEPEZ',
        
        // Konyaaltı varyasyonları
        'konyaaltı': 'KONYAALTI',
        'KONYAALTI': 'KONYAALTI',
        'konyaalti': 'KONYAALTI',
        'KONYAALTI': 'KONYAALTI',
        'konyaaltı merkez': 'KONYAALTI',
        'KONYAALTI MERKEZ': 'KONYAALTI',
        'konyaalti merkez': 'KONYAALTI',
        'KONYAALTI MERKEZ': 'KONYAALTI',
        
        // === GENEL YAZIM HATALARI (TÜM ŞEHİRLER) ===
        // Türkçe karakter hataları
        'ç': 'Ç',
        'ğ': 'Ğ',
        'ı': 'I',
        'ö': 'Ö',
        'ş': 'Ş',
        'ü': 'Ü',
        
        // Tersine çevirme
        'Ç': 'Ç',
        'Ğ': 'Ğ',
        'I': 'I',
        'Ö': 'Ö',
        'Ş': 'Ş',
        'Ü': 'Ü',
        
        // === KOCAELİ İLÇELERİ ===
        'gebze': 'GEBZE',
        'GEBZE': 'GEBZE',
        'gebze merkez': 'GEBZE',
        'GEBZE MERKEZ': 'GEBZE',
        'izmit': 'İZMİT',
        'İZMİT': 'İZMİT',
        'izmit merkez': 'İZMİT',
        'İZMİT MERKEZ': 'İZMİT',
        'darıca': 'DARICA',
        'DARICA': 'DARICA',
        'darica': 'DARICA',
        'DARICA MERKEZ': 'DARICA',
        'darıca merkez': 'DARICA',
        'gölcük': 'GÖLCÜK',
        'GÖLCÜK': 'GÖLCÜK',
        'golcuk': 'GÖLCÜK',
        'GOLCUK': 'GÖLCÜK',
        'gölcük merkez': 'GÖLCÜK',
        'korfez': 'KÖRFEZ',
        'KÖRFEZ': 'KÖRFEZ',
        'körfez': 'KÖRFEZ',
        'korfez merkez': 'KÖRFEZ',
        'kocaeli merkez': 'İZMİT',
        'KOCAELİ MERKEZ': 'İZMİT',
        'kocaeli': 'İZMİT',
        'KOCAELİ': 'İZMİT',
        
        // === KONYA İLÇELERİ ===
        'selçuklu': 'SELÇUKLU',
        'SELÇUKLU': 'SELÇUKLU',
        'selcuklu': 'SELÇUKLU',
        'SELCUKLU': 'SELÇUKLU',
        'selçuklu merkez': 'SELÇUKLU',
        'meram': 'MERAM',
        'MERAM': 'MERAM',
        'meram merkez': 'MERAM',
        'karatay': 'KARATAY',
        'KARATAY': 'KARATAY',
        'karatay merkez': 'KARATAY',
        'konya merkez': 'SELÇUKLU',
        'KONYA MERKEZ': 'SELÇUKLU',
        'konya': 'SELÇUKLU',
        'KONYA': 'SELÇUKLU',
        
        // === SAMSUN İLÇELERİ ===
        'ilkadım': 'İLKADIM',
        'İLKADIM': 'İLKADIM',
        'ilkadim': 'İLKADIM',
        'İLKADIM': 'İLKADIM',
        'ilkadım merkez': 'İLKADIM',
        'atakum': 'ATAKUM',
        'ATAKUM': 'ATAKUM',
        'atakum merkez': 'ATAKUM',
        'canik': 'CANİK',
        'CANİK': 'CANİK',
        'canik merkez': 'CANİK',
        'tekkeköy': 'TEKKEKÖY',
        'TEKKEKÖY': 'TEKKEKÖY',
        'tekkekoy': 'TEKKEKÖY',
        'TEKKEKOY': 'TEKKEKÖY',
        'samsun merkez': 'İLKADIM',
        'SAMSUN MERKEZ': 'İLKADIM',
        'samsun': 'İLKADIM',
        'SAMSUN': 'İLKADIM',
        
        // === ESKİŞEHİR İLÇELERİ ===
        'odunpazarı': 'ODUNPAZARI',
        'ODUNPAZARI': 'ODUNPAZARI',
        'odunpazari': 'ODUNPAZARI',
        'ODUNPAZARI': 'ODUNPAZARI',
        'odunpazarı merkez': 'ODUNPAZARI',
        'tepebaşı': 'TEPEBAŞI',
        'TEPEBAŞI': 'TEPEBAŞI',
        'tepebasi': 'TEPEBAŞI',
        'TEPEBASI': 'TEPEBAŞI',
        'tepebaşı merkez': 'TEPEBAŞI',
        'eskisehir merkez': 'ODUNPAZARI',
        'ESKİŞEHİR MERKEZ': 'ODUNPAZARI',
        'eskisehir': 'ODUNPAZARI',
        'ESKİŞEHİR': 'ODUNPAZARI',
        
        // === KAYSERİ İLÇELERİ ===
        'melikgazi': 'MELİKGAZİ',
        'MELİKGAZİ': 'MELİKGAZİ',
        'melikgazi merkez': 'MELİKGAZİ',
        'kocasinan': 'KOCASİNAN',
        'KOCASİNAN': 'KOCASİNAN',
        'kocasinan merkez': 'KOCASİNAN',
        'talas': 'TALAS',
        'TALAS': 'TALAS',
        'talas merkez': 'TALAS',
        'kayseri merkez': 'MELİKGAZİ',
        'KAYSERİ MERKEZ': 'MELİKGAZİ',
        'kayseri': 'MELİKGAZİ',
        'KAYSERİ': 'MELİKGAZİ',
        
        // === ŞANLIURFA İLÇELERİ ===
        'haliliye': 'HALİLİYE',
        'HALİLİYE': 'HALİLİYE',
        'haliliye merkez': 'HALİLİYE',
        'eyyübiye': 'EYYÜBİYE',
        'EYYÜBİYE': 'EYYÜBİYE',
        'eyyubiye': 'EYYÜBİYE',
        'EYYUBİYE': 'EYYÜBİYE',
        'eyyübiye merkez': 'EYYÜBİYE',
        'karaköprü': 'KARAKÖPRÜ',
        'KARAKÖPRÜ': 'KARAKÖPRÜ',
        'karakopru': 'KARAKÖPRÜ',
        'KARAKOPRU': 'KARAKÖPRÜ',
        'karaköprü merkez': 'KARAKÖPRÜ',
        'urfa merkez': 'HALİLİYE',
        'URFA MERKEZ': 'HALİLİYE',
        'şanliurfa': 'HALİLİYE',
        'ŞANLIURFA': 'HALİLİYE',
        'şanliurfa merkez': 'HALİLİYE',
        
        // === DENİZLİ İLÇELERİ ===
        'pamukkale': 'PAMUKKALE',
        'PAMUKKALE': 'PAMUKKALE',
        'pamukkale merkez': 'PAMUKKALE',
        'merkezefendi': 'MERKEZEFENDİ',
        'MERKEZEFENDİ': 'MERKEZEFENDİ',
        'merkezefendi merkez': 'MERKEZEFENDİ',
        'denizli merkez': 'PAMUKKALE',
        'DENİZLİ MERKEZ': 'PAMUKKALE',
        'denizli': 'PAMUKKALE',
        'DENİZLİ': 'PAMUKKALE',
        
        // === MERSİN (İÇEL) İLÇELERİ ===
        'mersin': 'YENİŞEHİR',
        'MERSİN': 'YENİŞEHİR',
        'mersin merkez': 'YENİŞEHİR',
        'MERSİN MERKEZ': 'YENİŞEHİR',
        'içel': 'YENİŞEHİR',
        'İÇEL': 'YENİŞEHİR',
        'yenişehir': 'YENİŞEHİR',
        'YENİŞEHİR': 'YENİŞEHİR',
        'yenisehir': 'YENİŞEHİR',
        'YENİSEHİR': 'YENİŞEHİR',
        'yenişehir merkez': 'YENİŞEHİR',
        'toroslar': 'TOROSLAR',
        'TOROSLAR': 'TOROSLAR',
        'toroslar merkez': 'TOROSLAR',
        'akdeniz': 'AKDENİZ',
        'AKDENİZ': 'AKDENİZ',
        'akdeniz merkez': 'AKDENİZ',
        'meziytli': 'MEZİTLİ',
        'MEZİTLİ': 'MEZİTLİ',
        'meziytli merkez': 'MEZİTLİ',
        'mezitli': 'MEZİTLİ',
        'MEZİTLİ': 'MEZİTLİ',
        
        // === MALATYA İLÇELERİ ===
        'battalgazi': 'BATTALGAZİ',
        'BATTALGAZİ': 'BATTALGAZİ',
        'battalgazi merkez': 'BATTALGAZİ',
        'yeşilyurt': 'YEŞİLYURT',
        'YEŞİLYURT': 'YEŞİLYURT',
        'yesilyurt': 'YEŞİLYURT',
        'YESİLYURT': 'YEŞİLYURT',
        'yeşilyurt merkez': 'YEŞİLYURT',
        'malatya merkez': 'BATTALGAZİ',
        'MALATYA MERKEZ': 'BATTALGAZİ',
        'malatya': 'BATTALGAZİ',
        'MALATYA': 'BATTALGAZİ',
        
        // === ERZURUM İLÇELERİ ===
        'yakutiye': 'YAKUTİYE',
        'YAKUTİYE': 'YAKUTİYE',
        'yakutiye merkez': 'YAKUTİYE',
        'palandöken': 'PALANDÖKEN',
        'PALANDÖKEN': 'PALANDÖKEN',
        'palandoken': 'PALANDÖKEN',
        'PALANDOKEN': 'PALANDÖKEN',
        'palandöken merkez': 'PALANDÖKEN',
        'aziziye': 'AZİZİYE',
        'AZİZİYE': 'AZİZİYE',
        'aziziye merkez': 'AZİZİYE',
        'erzurum merkez': 'YAKUTİYE',
        'ERZURUM MERKEZ': 'YAKUTİYE',
        'erzurum': 'YAKUTİYE',
        'ERZURUM': 'YAKUTİYE',
        
        // === VAN İLÇELERİ ===
        'ipekyolu': 'İPEKYOLU',
        'İPEKYOLU': 'İPEKYOLU',
        'ipekyolu merkez': 'İPEKYOLU',
        'tuşba': 'TUŞBA',
        'TUŞBA': 'TUŞBA',
        'tusba': 'TUŞBA',
        'TUSBA': 'TUŞBA',
        'tuşba merkez': 'TUŞBA',
        'edremit': 'EDREMİT',
        'EDREMİT': 'EDREMİT',
        'edremit merkez': 'EDREMİT',
        'van merkez': 'İPEKYOLU',
        'VAN MERKEZ': 'İPEKYOLU',
        'van': 'İPEKYOLU',
        'VAN': 'İPEKYOLU',
        
        // === MANİSA İLÇELERİ ===
        'şehzadeler': 'ŞEHZADELER',
        'ŞEHZADELER': 'ŞEHZADELER',
        'sehzadeler': 'ŞEHZADELER',
        'ŞEHZADELER': 'ŞEHZADELER',
        'şehzadeler merkez': 'ŞEHZADELER',
        'yunusemre': 'YUNUSEMRE',
        'YUNUSEMRE': 'YUNUSEMRE',
        'yunusemre merkez': 'YUNUSEMRE',
        'manisa merkez': 'ŞEHZADELER',
        'MANİSA MERKEZ': 'ŞEHZADELER',
        'manisa': 'ŞEHZADELER',
        'MANİSA': 'ŞEHZADELER',
        
        // === MUĞLA İLÇELERİ ===
        'bodrum': 'BODRUM',
        'BODRUM': 'BODRUM',
        'bodrum merkez': 'BODRUM',
        'marmaris': 'MARMARİS',
        'MARMARİS': 'MARMARİS',
        'marmaris merkez': 'MARMARİS',
        'fethiye': 'FETHİYE',
        'FETHİYE': 'FETHİYE',
        'fethiye merkez': 'FETHİYE',
        'datça': 'DATÇA',
        'DATÇA': 'DATÇA',
        'datca': 'DATÇA',
        'DATCA': 'DATÇA',
        'datça merkez': 'DATÇA',
        'muğla merkez': 'MENTEŞE',
        'MUĞLA MERKEZ': 'MENTEŞE',
        'muğla': 'MENTEŞE',
        'MUĞLA': 'MENTEŞE',
        'menteşe': 'MENTEŞE',
        'MENTEŞE': 'MENTEŞE',
        'mentese': 'MENTEŞE',
        'MENTESE': 'MENTEŞE',
        
        // === TRABZON İLÇELERİ ===
        'ortahisar': 'ORTAHİSAR',
        'ORTAHİSAR': 'ORTAHİSAR',
        'ortahisar merkez': 'ORTAHİSAR',
        'trabzon merkez': 'ORTAHİSAR',
        'TRABZON MERKEZ': 'ORTAHİSAR',
        'trabzon': 'ORTAHİSAR',
        'TRABZON': 'ORTAHİSAR',
        
        // === SİVAS İLÇELERİ ===
        'sivas merkez': 'MERKEZ',
        'SİVAS MERKEZ': 'MERKEZ',
        'sivas': 'MERKEZ',
        'SİVAS': 'MERKEZ',
        
        // === SAKARYA İLÇELERİ ===
        'adapazarı': 'ADAPAZARI',
        'ADAPAZARI': 'ADAPAZARI',
        'adapazari': 'ADAPAZARI',
        'ADAPAZARI MERKEZ': 'ADAPAZARI',
        'adapazarı merkez': 'ADAPAZARI',
        'sakarya merkez': 'ADAPAZARI',
        'SAKARYA MERKEZ': 'ADAPAZARI',
        'sakarya': 'ADAPAZARI',
        'SAKARYA': 'ADAPAZARI',
        'serdivan': 'SERDİVAN',
        'SERDİVAN': 'SERDİVAN',
        'serdivan merkez': 'SERDİVAN',
        
        // === BALIKESİR İLÇELERİ ===
        'karesi': 'KARESİ',
        'KARESİ': 'KARESİ',
        'karesi merkez': 'KARESİ',
        'altıeylül': 'ALTIEYLÜL',
        'ALTIEYLÜL': 'ALTIEYLÜL',
        'altieylul': 'ALTIEYLÜL',
        'ALTIEYLUL': 'ALTIEYLÜL',
        'altıeylül merkez': 'ALTIEYLÜL',
        'balikesir merkez': 'KARESİ',
        'BALIKESİR MERKEZ': 'KARESİ',
        'balikesir': 'KARESİ',
        'BALIKESİR': 'KARESİ',
        
        // === KAHramanmaraş İLÇELERİ ===
        'dulkadiroğlu': 'DULKADİROĞLU',
        'DULKADİROĞLU': 'DULKADİROĞLU',
        'dulkadiroglu': 'DULKADİROĞLU',
        'DULKADİROGLU': 'DULKADİROĞLU',
        'dulkadiroğlu merkez': 'DULKADİROĞLU',
        'onikişubat': 'ONİKİŞUBAT',
        'ONİKİŞUBAT': 'ONİKİŞUBAT',
        'onikisubat': 'ONİKİŞUBAT',
        'ONIKISUBAT': 'ONİKİŞUBAT',
        'onikişubat merkez': 'ONİKİŞUBAT',
        'maras merkez': 'DULKADİROĞLU',
        'MARAŞ MERKEZ': 'DULKADİROĞLU',
        'kahramanmaraş': 'DULKADİROĞLU',
        'KAHRAMANMARAŞ': 'DULKADİROĞLU',
        'maras': 'DULKADİROĞLU',
        'MARAŞ': 'DULKADİROĞLU',
        
        // === HATAY İLÇELERİ ===
        'antakya': 'ANTAKYA',
        'ANTAKYA': 'ANTAKYA',
        'antakya merkez': 'ANTAKYA',
        'defne': 'DEFNE',
        'DEFNE': 'DEFNE',
        'defne merkez': 'DEFNE',
        'hatay merkez': 'ANTAKYA',
        'HATAY MERKEZ': 'ANTAKYA',
        'hatay': 'ANTAKYA',
        'HATAY': 'ANTAKYA',
        'iskenderun': 'İSKENDERUN',
        'İSKENDERUN': 'İSKENDERUN',
        'iskenderun merkez': 'İSKENDERUN',
        
        // === AYDIN İLÇELERİ ===
        'efeler': 'EFELER',
        'EFELER': 'EFELER',
        'efeler merkez': 'EFELER',
        'aydın merkez': 'EFELER',
        'AYDIN MERKEZ': 'EFELER',
        'aydin': 'EFELER',
        'AYDIN': 'EFELER',
        'aydın': 'EFELER',
        'nazilli': 'NAZİLLİ',
        'NAZİLLİ': 'NAZİLLİ',
        'nazilli merkez': 'NAZİLLİ',
        
        // === TEKİRDAĞ İLÇELERİ ===
        'süleymanpaşa': 'SÜLEYMANPAŞA',
        'SÜLEYMANPAŞA': 'SÜLEYMANPAŞA',
        'suleymanpasa': 'SÜLEYMANPAŞA',
        'SULEYMANPASA': 'SÜLEYMANPAŞA',
        'süleymanpaşa merkez': 'SÜLEYMANPAŞA',
        'tekirdag merkez': 'SÜLEYMANPAŞA',
        'TEKİRDAĞ MERKEZ': 'SÜLEYMANPAŞA',
        'tekirdag': 'SÜLEYMANPAŞA',
        'TEKİRDAĞ': 'SÜLEYMANPAŞA',
        'çorlu': 'ÇORLU',
        'ÇORLU': 'ÇORLU',
        'corlu': 'ÇORLU',
        'ÇORLU MERKEZ': 'ÇORLU',
        'çorlu merkez': 'ÇORLU',
        
        // === ORDU İLÇELERİ ===
        'altınordu': 'ALTINORDU',
        'ALTINORDU': 'ALTINORDU',
        'altinordu': 'ALTINORDU',
        'ALTINORDU': 'ALTINORDU',
        'altınordu merkez': 'ALTINORDU',
        'ordu merkez': 'ALTINORDU',
        'ORDU MERKEZ': 'ALTINORDU',
        'ordu': 'ALTINORDU',
        'ORDU': 'ALTINORDU',
        
        // === KIRIKKALE İLÇELERİ ===
        'kırıkkale merkez': 'MERKEZ',
        'KIRIKKALE MERKEZ': 'MERKEZ',
        'kirikkale': 'MERKEZ',
        'KIRIKKALE': 'MERKEZ',
        
        // === ZONGULDAK EKSİK İLÇELER ===
        'giresun': 'GİRESUN',
        'GİRESUN': 'GİRESUN',
        'giresun merkez': 'MERKEZ',
        'rize': 'RİZE',
        'RİZE': 'RİZE',
        'rize merkez': 'MERKEZ',
        'artvin': 'ARTVİN',
        'ARTVİN': 'ARTVİN',
        'artvin merkez': 'MERKEZ',
        
        // Yaygın yazım hataları
        'merkez': 'MERKEZ',
        'MERKEZ': 'MERKEZ',
        'köy': 'KÖY',
        'KÖY': 'KÖY',
        'mahalle': 'MAHALLE',
        'MAHALLE': 'MAHALLE',
        'ilçe': 'İLÇE',
        'İLÇE': 'İLÇE',
        'bölge': 'BÖLGE',
        'BÖLGE': 'BÖLGE'
    };
    
    let result = districtName; // Varsayılan sonuç
    
    // PERFORMANS: Önce hızlı mapping kontrolü
    if (districtMapping[lowerDistrict]) {
        result = districtMapping[lowerDistrict];
    }
    // Büyük harfli versiyonları da kontrol et
    else if (districtMapping[districtName]) {
        result = districtMapping[districtName];
    }
    // PERFORMANS: Direkt eşleşme varsa döndür
    else if (masterList.includes(districtName)) {
        result = districtName;
    }
    // AKILLI FUZZY MATCHING - Tüm veri setleri için
    else {
        const normalized = normalizeTurkish(districtName);
        
        let bestMatch = districtName;
        let bestScore = Infinity;
        
        // Dinamik threshold hesaplama
        const baseThreshold = Math.min(4, Math.max(2, Math.floor(districtName.length * 0.3)));
        const threshold = Math.min(baseThreshold, 5); // Maksimum 5 karakter farkı
        
        // Önce hızlı kontrol - benzer uzunlukta olanları kontrol et
        const targetLength = districtName.length;
        const candidates = masterList.filter(master => 
            Math.abs(master.length - targetLength) <= threshold
        );
        
        // Eğer çok fazla aday varsa, en yakın uzunlukta olanları al
        const limitedCandidates = candidates.length > 50 ? 
            candidates.sort((a, b) => Math.abs(a.length - targetLength) - Math.abs(b.length - targetLength)).slice(0, 50) :
            candidates;
        
        for (const master of limitedCandidates) {
            const masterNormalized = normalizeTurkish(master);
            const distance = levenshteinDistance(normalized, masterNormalized);
            
            // Akıllı skorlama - uzunluk farkını da hesaba kat
            const lengthPenalty = Math.abs(master.length - targetLength) * 0.1;
            const adjustedScore = distance + lengthPenalty;
            
            if (adjustedScore < bestScore && adjustedScore <= threshold) {
                bestScore = adjustedScore;
                bestMatch = master;
            }
        }
        
        // Ek kontrol - başlangıç harfleri aynıysa daha toleranslı ol
        if (bestScore > threshold && districtName.length > 3) {
            const firstChar = normalized.charAt(0);
            const similarCandidates = limitedCandidates.filter(master => 
                normalizeTurkish(master).charAt(0) === firstChar
            );
            
            for (const master of similarCandidates) {
                const masterNormalized = normalizeTurkish(master);
                const distance = levenshteinDistance(normalized, masterNormalized);
                
                if (distance < bestScore && distance <= threshold + 1) {
                    bestScore = distance;
                    bestMatch = master;
                }
            }
        }
        
        if (bestScore <= threshold && bestMatch !== districtName) {
            if (typeof safeConsole !== 'undefined') {
                safeConsole.log(`🔧 Akıllı fuzzy matching: "${districtName}" → "${bestMatch}" (${bestScore.toFixed(2)} skor, ${threshold} threshold)`);
            }
            result = bestMatch;
        }
    }
    
    // Cache'e kaydet
    cache.set(cacheKey, result);
    return result;
}

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.normalizeDistrictName = normalizeDistrictName;
}

