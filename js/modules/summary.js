/**
 * Summary & Export Module
 * Handles summary updates and Excel export functionality
 * 
 * Dependencies:
 * - XLSX (SheetJS - CDN)
 * - safeConsole (config.js - window.safeConsole)
 * - filteredData (global - window.filteredData veya parametre)
 * - allData (global - window.allData)
 * - updateDashboardSummaryCards (dashboard.js)
 * - performAIAnalysis (global)
 */

/**
 * Özet bilgilerini günceller
 * @param {Array} filteredDataSource - Filtrelenmiş veri (opsiyonel, window.filteredData kullanılır)
 */
function updateSummary(filteredDataSource = null) {
    const filteredData = filteredDataSource || (typeof window !== 'undefined' && window.filteredData) || [];
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('updateSummary - Filtrelenmis veri sayisi:', filteredData.length);
    }
    
    // ODOO "ALL ZUHAL" filtresi: Tüm faturaları göster (hem satış hem iade)
    // Odoo arka planda otomatik olarak NET hesaplıyor: Satış - İade
    // İptal (cancel) ve taslak (draft) faturaları HARİÇ TUT
    // applyDiscountLogic zaten devre dışı (Odoo indirimleri zaten düşmüş)
    
    // Sadece onaylanmış (posted) faturaları al - İptal ve taslak hariç
    const allInvoices = filteredData.filter(item => {
        // state alanı varsa kontrol et
        if (item.state) {
            return item.state === 'posted'; // Sadece onaylanmış faturalar
        }
        // state alanı yoksa (geriye dönük uyumluluk) tümünü al
        return true;
    });
    
    // İade faturalarını negatif yap (eğer pozitifse)
    const processedData = allInvoices.map(item => {
        const amount = parseFloat(item.usd_amount || 0);
        // out_refund (iade) faturaları pozitifse negatif yap
        if (item.move_type === 'out_refund' && amount > 0) {
            return { ...item, usd_amount: -amount };
        }
        return item;
    });
    
    // NET hesapla: Satış - İade (Odoo ile uyumlu)
    const totalUSD = processedData.reduce((sum, item) => sum + (parseFloat(item.usd_amount) || 0), 0);
    const totalQty = processedData.filter(item => item.move_type !== 'out_refund').reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const uniquePartners = new Set(filteredData.map(item => item.partner)).size;
    const uniqueProducts = new Set(filteredData.map(item => item.product)).size;
    const uniqueStores = new Set(filteredData.map(item => item.store)).size;
    const uniqueSalespeople = new Set(filteredData.map(item => item.sales_person)).size;
    
    // Günlük ortalama hesapla (NET bazlı)
    const uniqueDays = new Set(processedData.map(item => item.date)).size;
    const dailyAverage = uniqueDays > 0 ? totalUSD / uniqueDays : 0;
    
    // Sepet ortalaması ve fatura sayısı (sadece satış faturaları için)
    const salesInvoices = processedData.filter(item => item.move_type === 'out_invoice' || (item.move_type !== 'out_refund' && parseFloat(item.usd_amount || 0) > 0));
    const invoiceKeys = salesInvoices
        .map(item => item.move_name || item.move_id || `${item.date || ''}-${item.partner || ''}-${item.store || ''}-${item.product || ''}`)
        .filter(Boolean);
    const uniqueInvoices = new Set(invoiceKeys).size;
    const basketAverage = uniqueInvoices > 0 ? totalUSD / uniqueInvoices : 0;
    
    const refundCount = filteredData.filter(item => item.move_type === 'out_refund').length;
    const refundTotal = filteredData
        .filter(item => item.move_type === 'out_refund')
        .reduce((sum, item) => sum + Math.abs(parseFloat(item.usd_amount || 0)), 0);
    const salesTotal = filteredData
        .filter(item => item.move_type === 'out_invoice')
        .reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0);
    
    // Debug: İptal ve taslak kontrolü
    const draftCount = filteredData.filter(item => item.state === 'draft').length;
    const cancelCount = filteredData.filter(item => item.state === 'cancel').length;
    const postedCount = filteredData.filter(item => item.state === 'posted').length;
    const noStateCount = filteredData.filter(item => !item.state).length;
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('Ozet (NET - Odoo ile uyumlu):', {
            totalUSD_NET: totalUSD,
            salesTotal: salesTotal,
            refundTotal: refundTotal,
            totalQty, 
            uniquePartners: new Set(processedData.map(item => item.partner)).size,
            uniqueProducts: new Set(processedData.map(item => item.product)).size,
            uniqueStores: new Set(processedData.map(item => item.store)).size,
            uniqueSalespeople: new Set(processedData.map(item => item.sales_person)).size,
            dailyAverage, 
            basketAverage,
            toplamKayit: processedData.length,
            satisKayitSayisi: filteredData.filter(item => item.move_type === 'out_invoice').length,
            iadeKayitSayisi: refundCount,
            stateKontrolu: {
                posted: postedCount,
                draft: draftCount,
                cancel: cancelCount,
                stateYok: noStateCount
            },
            beklentiOdoo: '$39,171,668.53'
        });
    }
    
    // Eski Sales sekmesi elementleri - null check
    const summaryUSD = document.getElementById('summaryUSD');
    const summaryQuantity = document.getElementById('summaryQuantity');
    const summaryPartners = document.getElementById('summaryPartners');
    const summaryProducts = document.getElementById('summaryProducts');
    
    if (summaryUSD) summaryUSD.textContent = '$' + totalUSD.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (summaryQuantity) summaryQuantity.textContent = totalQty.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (summaryPartners) summaryPartners.textContent = uniquePartners.toLocaleString('tr-TR');
    if (summaryProducts) summaryProducts.textContent = uniqueProducts.toLocaleString('tr-TR');
    
    // Dashboard özet kartları - helper fonksiyon kullan
    if (typeof updateDashboardSummaryCards === 'function') {
        updateDashboardSummaryCards({
            totalSales: totalUSD,
            totalQty: totalQty,
            uniqueCustomers: uniquePartners,
            uniqueProducts: uniqueProducts,
            uniqueStores: uniqueStores,
            uniqueSalespeople: uniqueSalespeople,
            dailyAverage: dailyAverage,
            basketAverage: basketAverage,
            uniqueInvoices: uniqueInvoices
        });
    }
    
    // AI Analiz yap
    if (filteredData.length > 0 && typeof performAIAnalysis === 'function') {
        performAIAnalysis();
    }
}

/**
 * Filtrelenmiş veriyi Excel formatında dışa aktarır
 * @param {Array} filteredDataSource - Filtrelenmiş veri (opsiyonel, window.filteredData kullanılır)
 */
function exportToExcel(filteredDataSource = null) {
    const filteredData = filteredDataSource || (typeof window !== 'undefined' && window.filteredData) || [];
    
    if (filteredData.length === 0) {
        alert('⚠️ Dışa aktarılacak veri yok!');
        return;
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('📥 Excel export başlatılıyor...');
    }
    
    // XLSX kontrolü
    if (typeof XLSX === 'undefined') {
        alert('❌ Excel export kütüphanesi yüklenemedi!');
        return;
    }
    
    // Veriyi Excel formatına dönüştür (Kategori kaydırılmış)
    const excelData = filteredData.map(item => ({
        'İş Ortağı': item.partner || '',
        'Ürün': item.product || '',
        'Marka': item.brand || '',
        'Kategori 1': item.category_2 || '', // category_2 -> Kategori 1
        'Kategori 2': item.category_3 || '', // category_3 -> Kategori 2
        'Kategori 3': item.category_4 || '', // category_4 -> Kategori 3
        'Satış Temsilcisi': item.sales_person || '',
        'Mağaza': item.store || '',
        'Şehir': item.city || '',
        'Tarih': item.date || '',
        'Miktar': parseFloat(item.quantity || 0),
        'USD (KDV Hariç)': parseFloat(item.usd_amount || 0)
    }));
    
    // Özet satırı ekle
    const summary = {
        'İş Ortağı': 'TOPLAM',
        'Ürün': '',
        'Marka': '',
        'Kategori 1': '',
        'Kategori 2': '',
        'Kategori 3': '',
        'Satış Temsilcisi': '',
        'Mağaza': '',
        'Şehir': '',
        'Tarih': '',
        'Miktar': filteredData.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0),
        'USD (KDV Hariç)': filteredData.reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0)
    };
    excelData.push(summary);
    
    // Workbook oluştur
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Sütun genişliklerini ayarla
    ws['!cols'] = [
        {wch: 30}, // İş Ortağı
        {wch: 40}, // Ürün
        {wch: 15}, // Marka
        {wch: 20}, // Kategori 1
        {wch: 20}, // Kategori 2
        {wch: 20}, // Kategori 3
        {wch: 20}, // Satış Temsilcisi
        {wch: 30}, // Mağaza
        {wch: 15}, // Şehir
        {wch: 12}, // Tarih
        {wch: 12}, // Miktar
        {wch: 18}  // USD (KDV Hariç)
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Satış Verileri');
    
    // Dosya adı oluştur
    const today = new Date().toISOString().split('T')[0];
    const filename = `Satis_Analizi_${today}.xlsx`;
    
    // İndir
    XLSX.writeFile(wb, filename);
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`✅ Excel dosyası indirildi: ${filename}`);
    }
    alert(`✅ ${filteredData.length} kayıt Excel'e aktarıldı!\nDosya: ${filename}`);
}

// Geriye dönük uyumluluk için window objesine export et
if (typeof window !== 'undefined') {
    window.updateSummary = updateSummary;
    window.exportToExcel = exportToExcel;
}

