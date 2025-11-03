/**
 * Channel Filter Module
 * Handles sales channel filtering (Retail, Wholesale, Online, Corporate, Central)
 */

// Global Kanal Filtresi Fonksiyonu (window scope'una ekle)
window.handleChannelFilter = function(clickedId) {
    safeConsole.log('🔄 handleChannelFilter çağrıldı, tıklanan:', clickedId);
    safeConsole.log('📊 baseData boyutu:', baseData.length);
    safeConsole.log('📊 allData boyutu:', allData.length);
    
    const channelAll = document.getElementById('channelAll').checked;
    const channelRetail = document.getElementById('channelRetail').checked;
    const channelWholesale = document.getElementById('channelWholesale').checked;
    const channelOnline = document.getElementById('channelOnline').checked;
    const channelCorporate = document.getElementById('channelCorporate').checked;
    const channelCentral = document.getElementById('channelCentral').checked;
    
    safeConsole.log('✅ Checkbox durumları:', {channelAll, channelRetail, channelWholesale, channelOnline, channelCorporate, channelCentral});
    
    // Eğer Tümü tıklandıysa, diğerlerini kapat
    if (clickedId === 'channelAll' && channelAll) {
        document.getElementById('channelRetail').checked = false;
        document.getElementById('channelWholesale').checked = false;
        document.getElementById('channelOnline').checked = false;
        document.getElementById('channelCorporate').checked = false;
        document.getElementById('channelCentral').checked = false;
        activeChannels = {all: true, retail: false, wholesale: false, online: false, corporate: false, central: false};
    }
    // Eğer diğer bir kanal tıklandıysa, Tümü'yü kapat
    else if (clickedId !== 'channelAll' && (channelRetail || channelWholesale || channelOnline || channelCorporate || channelCentral)) {
        document.getElementById('channelAll').checked = false;
        activeChannels = {
            all: false,
            retail: channelRetail,
            wholesale: channelWholesale,
            online: channelOnline,
            corporate: channelCorporate,
            central: channelCentral
        };
    }
    // Hiçbiri seçili değilse Tümü'yü aktif et
    else if (!channelAll && !channelRetail && !channelWholesale && !channelOnline && !channelCorporate && !channelCentral) {
        document.getElementById('channelAll').checked = true;
        activeChannels = {all: true, retail: false, wholesale: false, online: false, corporate: false, central: false};
    }
    // Sadece Tümü kapatıldıysa hiçbir şey yapma (diğerleri zaten kapalı)
    else if (clickedId === 'channelAll' && !channelAll) {
        document.getElementById('channelAll').checked = true;
        activeChannels = {all: true, retail: false, wholesale: false, online: false, corporate: false, central: false};
    }
    
    // Veriyi filtrele
    applyChannelFilter();
};

function applyChannelFilter() {
    safeConsole.log('🏢 applyChannelFilter başladı');
    safeConsole.log('📊 activeChannels:', activeChannels);
    safeConsole.log('📊 baseData uzunluk:', baseData.length);
    
    // Spinner'ı göster
    const spinner = document.getElementById('channelLoadingSpinner');
    const loadingText = document.getElementById('channelLoadingText');
    spinner.style.display = 'flex';
    
    // Hangi kanal seçiliyse onu göster
    const channelNames = {
        retail: '🏪 Perakende',
        wholesale: '📦 Toptan Satış',
        online: '🌐 Online Satış',
        corporate: '🏢 Kurumsal Satış',
        central: '🏛️ Merkezi Satış'
    };
    
    let activeChannelName = 'Tüm Kanallar';
    if (!activeChannels.all) {
        const active = Object.keys(activeChannels).filter(key => activeChannels[key] && key !== 'all');
        activeChannelName = active.map(key => channelNames[key]).join(' + ');
    }
    
    loadingText.textContent = `🔄 ${activeChannelName} verileri yükleniyor...`;
    
    // Filtrelemeyi setTimeout ile geciktir - UI'ın güncellenmesi için
    setTimeout(() => {
        // Tümü seçiliyse tüm veriyi kullan
        if (activeChannels.all) {
            // STACK OVERFLOW ÖNLEME: Spread yerine slice kullan (büyük array'lerde güvenli)
            allData = baseData.slice();
            // Dashboard modülü için window.allData'ya güncelle
            if (typeof window !== 'undefined') {
                window.allData = allData;
            }
            safeConsole.log('✅ Tümü seçili, allData uzunluk:', allData.length);
            document.getElementById('channelFilterInfo').textContent = '📊 Aktif: Tüm Kanallar (19)';
        } else {
        // Seçili kanallara göre filtrele
        const selectedChannels = [];
        
        if (activeChannels.retail) {
            // 14 perakende mağaza
            allData = baseData.filter(item => 
                item.store && item.store.toLowerCase().includes('perakende')
            );
            selectedChannels.push('Perakende');
        }
        
        if (activeChannels.wholesale) {
            const wholesaleData = baseData.filter(item => 
                item.store && item.store.toLowerCase().includes('toptan')
            );
            // STACK OVERFLOW ÖNLEME: Büyük array'lerde spread yerine loop ile ekle
            if (activeChannels.retail) {
                for (let i = 0; i < wholesaleData.length; i++) {
                    allData.push(wholesaleData[i]);
                }
            } else {
                allData = wholesaleData.slice();
            }
            selectedChannels.push('Toptan');
        }
        
        if (activeChannels.online) {
            const onlineData = baseData.filter(item => 
                item.store && item.store.toLowerCase().includes('online')
            );
            // STACK OVERFLOW ÖNLEME: Büyük array'lerde spread yerine loop ile ekle
            if (activeChannels.retail || activeChannels.wholesale) {
                for (let i = 0; i < onlineData.length; i++) {
                    allData.push(onlineData[i]);
                }
            } else {
                allData = onlineData.slice();
            }
            selectedChannels.push('Online');
        }
        
        if (activeChannels.corporate) {
            const corporateData = baseData.filter(item => 
                item.store && item.store.toLowerCase().includes('kurumsal')
            );
            // STACK OVERFLOW ÖNLEME: Büyük array'lerde spread yerine loop ile ekle
            if (activeChannels.retail || activeChannels.wholesale || activeChannels.online) {
                for (let i = 0; i < corporateData.length; i++) {
                    allData.push(corporateData[i]);
                }
            } else {
                allData = corporateData.slice();
            }
            selectedChannels.push('Kurumsal');
        }
        
        if (activeChannels.central) {
            const centralData = baseData.filter(item => 
                item.store && item.store.toLowerCase().includes('merkezi')
            );
            // STACK OVERFLOW ÖNLEME: Büyük array'lerde spread yerine loop ile ekle
            if (activeChannels.retail || activeChannels.wholesale || activeChannels.online || activeChannels.corporate) {
                for (let i = 0; i < centralData.length; i++) {
                    allData.push(centralData[i]);
                }
            } else {
                allData = centralData.slice();
            }
            selectedChannels.push('Merkezi');
        }
        
        document.getElementById('channelFilterInfo').textContent = `📊 Aktif: ${selectedChannels.join(' + ')} (${allData.length.toLocaleString('tr-TR')} kayıt)`;
    }
    
    // Dashboard modülü için window.allData'ya güncelle
    if (typeof window !== 'undefined') {
        window.allData = allData;
    }
    
    // STACK OVERFLOW ÖNLEME: Spread yerine slice kullan (büyük array'lerde güvenli)
    filteredData = allData.slice();
    
    // TÜM SAYFA YENİDEN HESAPLANIYOR!
    updateAfterChannelFilter();
    }, 100); // 100ms gecikme - UI'ın spinner'ı göstermesi için
}

function updateAfterChannelFilter() {
    // Info kartlarını güncelle
    const totalRecordsEl = document.getElementById('totalRecords');
    if (totalRecordsEl) {
        totalRecordsEl.textContent = allData.length.toLocaleString('tr-TR');
    }
    
    const totalUSD = allData.reduce((sum, item) => sum + (parseFloat(item.usd_amount) || 0), 0);
    const totalUSDEl = document.getElementById('totalUSD');
    if (totalUSDEl) {
        totalUSDEl.textContent = '$' + totalUSD.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    
    // Günlük Ortalama Hesapla
    const uniqueDates = [...new Set(allData.map(item => item.date))];
    const dailyAverage = uniqueDates.length > 0 ? totalUSD / uniqueDates.length : 0;
    const dailyAverageEl = document.getElementById('dailyAverage');
    if (dailyAverageEl) {
        dailyAverageEl.textContent = '$' + dailyAverage.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    
    // Sepet Ortalaması Hesapla (Toplam USD / Satış Fatura Sayısı - İadeler Hariç)
    const invoiceKeys = allData
        .filter(item => {
            const amt = parseFloat(item.usd_amount || 0);
            if (item.move_type) return item.move_type === 'out_invoice';
            return amt > 0;
        })
        .map(item => item.move_name || item.move_id || `${item.date || ''}-${item.partner || ''}-${item.store || ''}-${item.product || ''}`)
        .filter(Boolean);
    const uniqueInvoices = new Set(invoiceKeys).size;
    const basketAverage = uniqueInvoices > 0 ? totalUSD / uniqueInvoices : 0;
    const basketAverageEl = document.getElementById('basketAverage');
    if (basketAverageEl) {
        basketAverageEl.textContent = '$' + basketAverage.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    
    // Filtreleri yeniden doldur
    populateFilters();
    updateSummary();
    
    // Dashboard'ı yenile
    if (typeof loadDashboard === 'function' && allData) {
        loadDashboard(allData);
    }
    
    // Müşteri analizini yenile
    analyzeCustomers();
    
    // Hedef takibini yenile
    if (window.targetsModule) {
        window.targetsModule.loadAllStoresTargets();
    }
    
    // Şehir analizini yenile
    analyzeCityPerformance();
    
    // Yıllık hedef analizini yenile
    if (window.targetsModule) {
        window.targetsModule.performYearlyTargetAnalysis();
    }
    
    // Spinner'ı gizle
    setTimeout(() => {
        document.getElementById('channelLoadingSpinner').style.display = 'none';
    }, 500); // Tüm işlemler bittikten 500ms sonra kapat
}

// Export functions to window for global access
if (typeof window !== 'undefined') {
    window.applyChannelFilter = applyChannelFilter;
    window.updateAfterChannelFilter = updateAfterChannelFilter;
}

