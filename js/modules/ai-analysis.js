/**
 * AI Analysis Module
 * Handles AI-powered data analysis, insights generation, and recommendations
 * 
 * Dependencies:
 * - safeConsole (config.js - window.safeConsole)
 * - filteredData (global - window.filteredData)
 */

/**
 * 🤖 Ana AI Analiz Fonksiyonu
 * Filtrelenmiş verileri analiz eder ve öngörüler üretir
 */
function performAIAnalysis() {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🤖 AI Analiz başlatılıyor...');
    }
    
    const panel = document.getElementById('aiAnalysisPanel');
    const filteredData = (typeof window !== 'undefined' && window.filteredData) || [];
    
    if (!panel || filteredData.length === 0) return;
    
    // Veri analizi
    const analysis = analyzeData(filteredData);
    
    // Öngörüler ve öneriler
    const insights = generateInsights(analysis);
    
    // HTML oluştur
    let html = `
        <div class="analysis-panel">
            <h2 style="margin: 0 0 20px 0; font-size: 2em;">🤖 AI Analiz & Öneriler</h2>
            <p style="opacity: 0.9; margin-bottom: 20px;">Filtrelenen ${filteredData.length.toLocaleString('tr-TR')} kayıt üzerinden yapılan akıllı analiz sonuçları</p>
            
            ${insights.positive.length > 0 ? `
            <div class="analysis-section">
                <h3>✅ Olumlu Tespitler</h3>
                ${insights.positive.map(item => `
                    <div class="insight-item insight-positive">
                        <span class="insight-icon">✅</span>
                        <strong>${item.title}</strong><br>
                        ${item.description}
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${insights.negative.length > 0 ? `
            <div class="analysis-section">
                <h3>⚠️ Dikkat Edilmesi Gerekenler</h3>
                ${insights.negative.map(item => `
                    <div class="insight-item insight-negative">
                        <span class="insight-icon">⚠️</span>
                        <strong>${item.title}</strong><br>
                        ${item.description}
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${insights.neutral.length > 0 ? `
            <div class="analysis-section">
                <h3>💡 Önemli Bilgiler</h3>
                ${insights.neutral.map(item => `
                    <div class="insight-item insight-neutral">
                        <span class="insight-icon">💡</span>
                        <strong>${item.title}</strong><br>
                        ${item.description}
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="analysis-section">
                <h3>🎯 Aksiyon Önerileri</h3>
                ${insights.recommendations.map(item => `
                    <div class="recommendation">
                        <span class="recommendation-icon">${item.icon}</span>
                        <div>
                            <strong style="font-size: 1.1em;">${item.title}</strong><br>
                            <p style="margin: 10px 0 0 0; opacity: 0.95;">${item.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    panel.innerHTML = html;
    panel.style.display = 'block';
}

/**
 * 📊 Veri Analiz Fonksiyonu
 * Ham veriyi analiz eder ve metrikler çıkarır
 * @param {Array} data - Analiz edilecek veri
 * @returns {Object} Analiz sonucu (metrikler, toplamlar, sıralamalar)
 */
function analyzeData(data) {
    if (!data || data.length === 0) {
        return {
            totalUSD: 0,
            totalQty: 0,
            avgOrderValue: 0,
            recordCount: 0,
            storeData: {},
            brandData: {},
            categoryData: {},
            customerData: {},
            salesPersonData: {},
            dateData: {},
            topStores: [],
            topBrands: [],
            topCategories: [],
            topCustomers: [],
            topSalesPersons: []
        };
    }
    
    // Temel metrikler
    const totalUSD = data.reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0);
    const totalQty = data.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
    const avgOrderValue = data.length > 0 ? totalUSD / data.length : 0;
    
    // Mağaza analizi
    const storeData = {};
    data.forEach(item => {
        const store = item.store || 'Bilinmiyor';
        if (!storeData[store]) {
            storeData[store] = {sales: 0, count: 0, qty: 0};
        }
        storeData[store].sales += parseFloat(item.usd_amount || 0);
        storeData[store].count += 1;
        storeData[store].qty += parseFloat(item.quantity || 0);
    });
    
    // Marka analizi
    const brandData = {};
    data.forEach(item => {
        const brand = item.brand || 'Bilinmiyor';
        if (!brandData[brand]) {
            brandData[brand] = {sales: 0, count: 0};
        }
        brandData[brand].sales += parseFloat(item.usd_amount || 0);
        brandData[brand].count += 1;
    });
    
    // Kategori analizi
    const categoryData = {};
    data.forEach(item => {
        const cat = item.category_2 || item.category_1 || 'Bilinmiyor';
        if (!categoryData[cat]) {
            categoryData[cat] = {sales: 0, count: 0};
        }
        categoryData[cat].sales += parseFloat(item.usd_amount || 0);
        categoryData[cat].count += 1;
    });
    
    // Müşteri analizi
    const customerData = {};
    data.forEach(item => {
        const customer = item.partner || 'Bilinmiyor';
        if (!customerData[customer]) {
            customerData[customer] = {sales: 0, count: 0};
        }
        customerData[customer].sales += parseFloat(item.usd_amount || 0);
        customerData[customer].count += 1;
    });
    
    // Satış temsilcisi analizi
    const salesPersonData = {};
    data.forEach(item => {
        const person = item.sales_person || 'Bilinmiyor';
        if (!salesPersonData[person]) {
            salesPersonData[person] = {sales: 0, count: 0};
        }
        salesPersonData[person].sales += parseFloat(item.usd_amount || 0);
        salesPersonData[person].count += 1;
    });
    
    // Tarih analizi
    const dateData = {};
    data.forEach(item => {
        if (!item.date) return;
        const month = item.date.substring(0, 7);
        if (!dateData[month]) {
            dateData[month] = {sales: 0, count: 0};
        }
        dateData[month].sales += parseFloat(item.usd_amount || 0);
        dateData[month].count += 1;
    });
    
    // Sıralama
    const topStores = Object.entries(storeData).sort((a, b) => b[1].sales - a[1].sales);
    const topBrands = Object.entries(brandData).sort((a, b) => b[1].sales - a[1].sales);
    const topCategories = Object.entries(categoryData).sort((a, b) => b[1].sales - a[1].sales);
    const topCustomers = Object.entries(customerData).sort((a, b) => b[1].sales - a[1].sales);
    const topSalesPersons = Object.entries(salesPersonData).sort((a, b) => b[1].sales - a[1].sales);
    
    return {
        totalUSD,
        totalQty,
        avgOrderValue,
        recordCount: data.length,
        storeData,
        brandData,
        categoryData,
        customerData,
        salesPersonData,
        dateData,
        topStores,
        topBrands,
        topCategories,
        topCustomers,
        topSalesPersons
    };
}

/**
 * 💡 İçgörü Üretim Fonksiyonu
 * Analiz sonuçlarından işlevsel öngörüler ve öneriler üretir
 * @param {Object} analysis - analyzeData() fonksiyonundan gelen analiz sonucu
 * @returns {Object} İçgörüler (positive, negative, neutral, recommendations)
 */
function generateInsights(analysis) {
    const insights = {
        positive: [],
        negative: [],
        neutral: [],
        recommendations: []
    };
    
    if (!analysis || analysis.recordCount === 0) {
        return insights;
    }
    
    // Olumlu tespitler
    if (analysis.topStores.length > 0) {
        const topStore = analysis.topStores[0];
        const storePercent = analysis.totalUSD > 0 
            ? (topStore[1].sales / analysis.totalUSD * 100).toFixed(1) 
            : 0;
        if (storePercent > 30) {
            insights.positive.push({
                title: `En Başarılı Mağaza: ${topStore[0]}`,
                description: `<span class="metric-highlight">$${topStore[1].sales.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span> satış ile toplam satışların <span class="metric-highlight">%${storePercent}</span>'ini gerçekleştirmiş. Mükemmel performans! 🎉`
            });
        }
    }
    
    if (analysis.topBrands.length > 0) {
        const topBrand = analysis.topBrands[0];
        insights.positive.push({
            title: `En Çok Satan Marka: ${topBrand[0]}`,
            description: `<span class="metric-highlight">${topBrand[1].count}</span> adet satış ile lider marka. Stok yönetimine dikkat edin.`
        });
    }
    
    if (analysis.avgOrderValue > 100) {
        insights.positive.push({
            title: 'Yüksek Ortalama Sipariş Değeri',
            description: `Ortalama sipariş değeri <span class="metric-highlight">$${analysis.avgOrderValue.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>. Müşteriler yüksek değerli ürünleri tercih ediyor.`
        });
    }
    
    // Dikkat edilmesi gerekenler
    if (analysis.topStores.length > 1) {
        const topStore = analysis.topStores[0];
        const secondStore = analysis.topStores[1];
        const gap = topStore[1].sales > 0
            ? ((topStore[1].sales - secondStore[1].sales) / topStore[1].sales * 100).toFixed(1)
            : 0;
        if (gap > 50) {
            insights.negative.push({
                title: 'Mağazalar Arası Dengesizlik',
                description: `${topStore[0]} ile ${secondStore[0]} arasında <span class="metric-highlight">%${gap}</span> fark var. Düşük performanslı mağazalara destek gerekebilir.`
            });
        }
    }
    
    if (analysis.topCustomers.length > 0) {
        const topCustomer = analysis.topCustomers[0];
        const customerPercent = analysis.totalUSD > 0
            ? (topCustomer[1].sales / analysis.totalUSD * 100).toFixed(1)
            : 0;
        if (customerPercent > 20) {
            insights.negative.push({
                title: 'Tek Müşteriye Bağımlılık Riski',
                description: `${topCustomer[0]} toplam satışların <span class="metric-highlight">%${customerPercent}</span>'ini oluşturuyor. Müşteri portföyünü çeşitlendirmeyi düşünün.`
            });
        }
    }
    
    if (analysis.recordCount < 10) {
        insights.negative.push({
            title: 'Düşük Veri Hacmi',
            description: `Sadece <span class="metric-highlight">${analysis.recordCount}</span> kayıt analiz edildi. Daha geniş tarih aralığı seçerek daha sağlıklı analiz yapabilirsiniz.`
        });
    }
    
    // Önemli bilgiler
    // En Popüler Kategoriler (All ve Analitik olanları hariç tut)
    const validCategories = analysis.topCategories.filter(cat => 
        !cat[0].toLowerCase().includes('all') && 
        !cat[0].toLowerCase().includes('analitik') &&
        !cat[0].toLowerCase().includes('eğitim')
    ).slice(0, 5);
    
    if (validCategories.length > 0) {
        const categoryDetails = validCategories.map((cat, idx) => {
            const percent = analysis.totalUSD > 0
                ? (cat[1].sales / analysis.totalUSD * 100).toFixed(1)
                : 0;
            return `${idx + 1}. <strong>${cat[0]}</strong>: <span class="metric-highlight">${cat[1].count}</span> adet, <span class="metric-highlight">%${percent}</span>`;
        }).join('<br>');
        
        insights.neutral.push({
            title: '🎸 En Popüler Kategoriler (İlk 5)',
            description: categoryDetails
        });
    }
    
    // En Başarılı Satış Temsilcileri (İlk 5)
    if (analysis.topSalesPersons.length > 0) {
        const topSalesPersons = analysis.topSalesPersons.slice(0, 5);
        const salesPersonDetails = topSalesPersons.map((person, idx) => {
            const percent = analysis.totalUSD > 0
                ? (person[1].sales / analysis.totalUSD * 100).toFixed(1)
                : 0;
            return `${idx + 1}. <strong>${person[0]}</strong>: <span class="metric-highlight">$${person[1].sales.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span> (<span class="metric-highlight">%${percent}</span>)`;
        }).join('<br>');
        
        insights.neutral.push({
            title: '👤 En Başarılı Satış Temsilcileri (İlk 5)',
            description: salesPersonDetails
        });
    }
    
    const uniqueCustomers = Object.keys(analysis.customerData || {}).length;
    insights.neutral.push({
        title: 'Müşteri Çeşitliliği',
        description: `<span class="metric-highlight">${uniqueCustomers}</span> farklı müşteri ile işlem yapılmış.`
    });
    
    // Öneriler
    insights.recommendations.push({
        icon: '🎯',
        title: 'Hedef Belirleme',
        description: `Mevcut performans: <span class="metric-highlight">$${analysis.totalUSD.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>. "Hedef Takip" sekmesinden aylık/yıllık hedeflerinizi belirleyin ve ilerlemenizi takip edin.`
    });
    
    if (analysis.topStores.length > 1) {
        const weakStores = analysis.topStores.slice(-2);
        insights.recommendations.push({
            icon: '📈',
            title: 'Düşük Performanslı Mağazalara Odaklanın',
            description: `${weakStores.map(s => s[0]).join(' ve ')} mağazalarının performansını artırmak için özel kampanyalar düzenleyin.`
        });
    }
    
    // En Çok Satan Markalar (İlk 5)
    if (analysis.topBrands.length > 0) {
        const topBrands = analysis.topBrands.slice(0, 5);
        const brandDetails = topBrands.map((brand, idx) => {
            const percent = analysis.totalUSD > 0
                ? (brand[1].sales / analysis.totalUSD * 100).toFixed(1)
                : 0;
            return `${idx + 1}. <strong>${brand[0]}</strong>: <span class="metric-highlight">${brand[1].count}</span> adet, <span class="metric-highlight">%${percent}</span>`;
        }).join('<br>');
        
        insights.recommendations.push({
            icon: '🏷️',
            title: 'Stok Optimizasyonu - En Çok Satan Markalar (İlk 5)',
            description: brandDetails + '<br><br>Bu markaların stok seviyelerini yakından takip edin.'
        });
    }
    
    insights.recommendations.push({
        icon: '👥',
        title: 'Müşteri İlişkileri',
        description: `"Müşteri Analizi" sekmesinden top müşterilerinizi inceleyin ve özel teklifler sunarak sadakati artırın.`
    });
    
    if (analysis.avgOrderValue < 50) {
        insights.recommendations.push({
            icon: '💰',
            title: 'Ortalama Sipariş Değerini Artırın',
            description: `Mevcut ortalama: <span class="metric-highlight">$${analysis.avgOrderValue.toFixed(2)}</span>. Cross-selling ve up-selling stratejileri uygulayın.`
        });
    }
    
    insights.recommendations.push({
        icon: '📊',
        title: 'Düzenli Raporlama',
        description: `"Excel'e Aktar" özelliğini kullanarak haftalık/aylık raporlar oluşturun ve trendleri takip edin.`
    });
    
    return insights;
}

// Geriye dönük uyumluluk için window objesine export et
if (typeof window !== 'undefined') {
    window.performAIAnalysis = performAIAnalysis;
    window.analyzeData = analyzeData;
    window.generateInsights = generateInsights;
}

