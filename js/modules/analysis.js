/**
 * Analysis Module
 * Functions for customer and city performance analysis
 */

// Chart instance'ları module scope'ta tut (window'a da export edilebilir)
let customerCityChart = null;
let customerTrendChart = null;

// City analysis chart instances
let cityBrandChartInstance = null;
let cityProductChartInstance = null;
let cityCategoryChartInstance = null;
let cityMonthlyChartInstance = null;
let cityYearlyChartInstance = null;

// City district table sort state
let cityDistrictSortColumn = 2; // Varsayılan: Satış sütunu
let cityDistrictSortAsc = false; // Varsayılan: Azalan sıralama

/**
 * Müşteri analizi yapar ve grafikleri render eder
 * @param {Array} dataSource - Veri kaynağı (allData veya window.allData)
 */
function analyzeCustomers(dataSource = null) {
    const data = dataSource || (typeof window !== 'undefined' && window.allData) || [];
    
    if (!data || data.length === 0) {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn('⚠️ analyzeCustomers: Veri yok');
        }
        return;
    }
    
    // Mağaza filtresi
    const selectedStore = document.getElementById('customerStoreFilter')?.value || '';
    
    // Müşteri verilerini analiz et (mağaza filtresi ile)
    const customerData = {};
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    data.forEach(item => {
        // Mağaza filtresi kontrolü
        if (selectedStore && item.store !== selectedStore) {
            return;
        }
        
        const partner = item.partner;
        if (!partner) return;
        
        if (!customerData[partner]) {
            customerData[partner] = {
                name: partner,
                totalSales: 0,
                orderCount: 0,
                city: item.partner_city || 'Bilinmiyor', // İL bilgisi (state_id)
                lastOrderDate: item.date || ''
            };
        }
        
        customerData[partner].totalSales += parseFloat(item.usd_amount || 0);
        customerData[partner].orderCount += 1;
        
        if (item.date && item.date > customerData[partner].lastOrderDate) {
            customerData[partner].lastOrderDate = item.date;
        }
    });
    
    // Array'e çevir ve sırala
    const customers = Object.values(customerData).sort((a, b) => b.totalSales - a.totalSales);
    
    // İstatistikler
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => {
        if (!c.lastOrderDate) return false;
        const lastOrder = new Date(c.lastOrderDate);
        return lastOrder >= ninetyDaysAgo;
    }).length;
    
    const avgOrderValue = totalCustomers > 0 ? customers.reduce((sum, c) => sum + c.totalSales, 0) / totalCustomers : 0;
    const maxOrderValue = customers.length > 0 ? customers[0].totalSales : 0;
    
    const totalCustomersEl = document.getElementById('totalCustomers');
    const activeCustomersEl = document.getElementById('activeCustomers');
    const avgOrderValueEl = document.getElementById('avgOrderValue');
    const maxOrderValueEl = document.getElementById('maxOrderValue');
    
    if (totalCustomersEl) totalCustomersEl.textContent = totalCustomers.toLocaleString('tr-TR');
    if (activeCustomersEl) activeCustomersEl.textContent = activeCustomers.toLocaleString('tr-TR');
    if (avgOrderValueEl) avgOrderValueEl.textContent = '$' + avgOrderValue.toLocaleString('tr-TR', {minimumFractionDigits: 2});
    if (maxOrderValueEl) maxOrderValueEl.textContent = '$' + maxOrderValue.toLocaleString('tr-TR', {minimumFractionDigits: 2});
    
    // Top 30 müşteri kartları (otomatik göster)
    renderTopCustomers(customers.slice(0, 30));
    
    // Grafikler
    renderCustomerCityChart(customers);
    renderCustomerTrendChart(data);
    
    // Mağaza filtresi dropdown'ını doldur (eğer boşsa)
    populateCustomerStoreFilter(data);
}

/**
 * Müşteri mağaza filtresi dropdown'ını doldurur
 * @param {Array} dataSource - Veri kaynağı (allData veya window.allData)
 */
function populateCustomerStoreFilter(dataSource = null) {
    const storeFilter = document.getElementById('customerStoreFilter');
    if (!storeFilter) return;
    
    // Eğer zaten doldurulmuşsa, sadece seçili değeri koru
    if (storeFilter.options.length > 1) {
        return;
    }
    
    const data = dataSource || (typeof window !== 'undefined' && window.allData) || [];
    
    // Tüm mağazaları topla (Analitik ve Eğitim hariç)
    const storeSet = new Set();
    data.forEach(item => {
        if (item.store && item.store !== 'Analitik' && !item.store.toLowerCase().includes('eğitim')) {
            storeSet.add(item.store);
        }
    });
    
    // Dropdown'ı doldur
    storeFilter.innerHTML = '<option value="">Tüm Mağazalar</option>';
    Array.from(storeSet).sort().forEach(store => {
        storeFilter.innerHTML += `<option value="${store}">${store}</option>`;
    });
}

/**
 * Top müşterileri kart olarak render eder
 * @param {Array} topCustomers - Müşteri dizisi
 */
function renderTopCustomers(topCustomers) {
    const grid = document.getElementById('topCustomersGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    topCustomers.forEach((customer, index) => {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span class="customer-rank">${index + 1}</span>
                <div style="flex: 1;">
                    <h4 style="margin: 0; font-size: 1.1em;">${customer.name}</h4>
                    <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 0.9em;">📍 ${customer.city}</p>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                    <p style="margin: 0; font-size: 0.85em; color: #6c757d;">Toplam Satış</p>
                    <p style="margin: 5px 0 0 0; font-size: 1.2em; font-weight: 700; color: #667eea;">$${customer.totalSales.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</p>
                </div>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                    <p style="margin: 0; font-size: 0.85em; color: #6c757d;">Sipariş Sayısı</p>
                    <p style="margin: 5px 0 0 0; font-size: 1.2em; font-weight: 700; color: #764ba2;">${customer.orderCount}</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/**
 * Müşteri şehir dağılımı grafiğini render eder
 * @param {Array} customers - Müşteri dizisi
 */
function renderCustomerCityChart(customers) {
    const ctx = document.getElementById('customerCityChart');
    if (!ctx) return;
    
    // Şehir bazında müşteri sayısı
    const cityData = {};
    customers.forEach(c => {
        const city = c.city || 'Bilinmiyor';
        cityData[city] = (cityData[city] || 0) + 1;
    });
    
    const sortedCities = Object.entries(cityData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (customerCityChart) {
        customerCityChart.destroy();
    }
    
    // Chart.js ve ChartDataLabels global olarak yüklenmiş olmalı
    if (typeof Chart === 'undefined' || typeof ChartDataLabels === 'undefined') {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn('⚠️ Chart.js veya ChartDataLabels yüklenmemiş');
        }
        return;
    }
    
    customerCityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedCities.map(c => c[0]),
            datasets: [{
                data: sortedCities.map(c => c[1]),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(199, 199, 199, 0.8)',
                    'rgba(83, 102, 255, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                datalabels: {
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: (value, ctx) => {
                        let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        let percentage = (value * 100 / sum).toFixed(1) + "%";
                        return percentage;
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

/**
 * Yıllık müşteri trend grafiğini render eder
 * @param {Array} dataSource - Veri kaynağı (allData veya window.allData)
 */
function renderCustomerTrendChart(dataSource = null) {
    const ctx = document.getElementById('customerTrendChart');
    if (!ctx) return;
    
    const data = dataSource || (typeof window !== 'undefined' && window.allData) || [];
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('📊 Yıllık Müşteri Trendi oluşturuluyor...');
    }
    
    // Yıllara göre müşteri sayısı
    const yearlyCustomers = {};
    const years = new Set();
    
    data.forEach(item => {
        if (!item.date || !item.partner) return;
        const year = item.date.substring(0, 4);
        years.add(year);
        if (!yearlyCustomers[year]) {
            yearlyCustomers[year] = new Set();
        }
        yearlyCustomers[year].add(item.partner);
    });
    
    // Yılları sırala
    const sortedYears = Array.from(years).sort();
    const customerCounts = sortedYears.map(year => yearlyCustomers[year].size);
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('📊 Yıllar:', sortedYears);
        safeConsole.log('📊 Müşteri sayıları:', customerCounts);
    }
    
    if (customerTrendChart) {
        customerTrendChart.destroy();
    }
    
    // Chart.js ve ChartDataLabels global olarak yüklenmiş olmalı
    if (typeof Chart === 'undefined' || typeof ChartDataLabels === 'undefined') {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn('⚠️ Chart.js veya ChartDataLabels yüklenmemiş');
        }
        return;
    }
    
    // Renk paleti (Dashboard ile aynı)
    const colors = [
        'rgba(102, 126, 234, 0.8)',   // 2020 - Mor
        'rgba(250, 112, 154, 0.8)',   // 2021 - Pembe
        'rgba(56, 239, 125, 0.8)',    // 2022 - Yeşil
        'rgba(255, 193, 7, 0.8)',     // 2023 - Sarı
        'rgba(245, 87, 108, 0.8)',    // 2024 - Kırmızı
        'rgba(72, 219, 251, 0.8)'     // 2025 - Turkuaz
    ];
    
    customerTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedYears,
            datasets: [{
                label: 'Aktif Müşteri Sayısı',
                data: customerCounts,
                backgroundColor: sortedYears.map((year, idx) => colors[idx % colors.length]),
                borderColor: sortedYears.map((year, idx) => colors[idx % colors.length].replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 10,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Müşteri: ' + context.parsed.y.toLocaleString('tr-TR');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('tr-TR');
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        },
        plugins: [ChartDataLabels]
    });
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('✅ Yıllık Müşteri Trendi grafiği oluşturuldu');
    }
}

// ==================== CITY PERFORMANCE ANALYSIS ====================

/**
 * Şehir performans analizi yapar
 * @param {Array} dataSource - Veri kaynağı (allData veya window.allData)
 */
function analyzeCityPerformance(dataSource = null) {
    const data = dataSource || (typeof window !== 'undefined' && window.allData) || [];
    
    const selectedCity = document.getElementById('citySelect')?.value || '';
    const selectedDistrict = document.getElementById('districtSelect')?.value || '';
    const dateStart = document.getElementById('cityDateStart')?.value || '';
    const dateEnd = document.getElementById('cityDateEnd')?.value || '';
    
    if (!selectedCity) {
        const container = document.getElementById('cityAnalysisContainer');
        if (container) container.style.display = 'none';
        return;
    }
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🌍 Şehir analizi:', selectedCity, selectedDistrict ? `/ ${selectedDistrict}` : '', 'Tarih:', dateStart, '-', dateEnd);
    }
    
    // Seçilen şehirdeki tüm ilçeleri topla (normalize için)
    const allDistrictsInCity = [];
    if (selectedDistrict) {
        data.forEach(item => {
            if (item.partner_city === selectedCity && item.city) {
                allDistrictsInCity.push(item.city);
            }
        });
    }
    
    // Şehir verilerini filtrele (şehir + ilçe + tarih) - NORMALİZE EDİLMİŞ
    const cityData = data.filter(item => {
        if (item.partner_city !== selectedCity) return false;
        
        if (selectedDistrict && item.city) {
            const normalizedItemDistrict = (typeof normalizeDistrictName !== 'undefined') 
                ? normalizeDistrictName(item.city, allDistrictsInCity)
                : item.city;
            if (normalizedItemDistrict !== selectedDistrict) return false;
        } else if (selectedDistrict && !item.city) {
            return false;
        }
        
        if (dateStart && item.date < dateStart) return false;
        if (dateEnd && item.date > dateEnd) return false;
        
        return true;
    });
    
    if (cityData.length === 0) {
        alert('Bu şehir için veri bulunamadı');
        return;
    }
    
    // Özet bilgileri hesapla
    const totalSales = cityData.reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0);
    const totalQty = cityData.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
    const uniqueCustomers = new Set(cityData.map(item => item.partner)).size;
    const uniqueDates = new Set(cityData.map(item => item.date)).size;
    
    // Sepet ortalaması için fatura sayısı
    const invoiceKeys = cityData
        .filter(item => {
            const amt = parseFloat(item.usd_amount || 0);
            if (item.move_type) return item.move_type === 'out_invoice';
            return amt > 0;
        })
        .map(item => item.move_name || item.move_id || `${item.date || ''}-${item.partner || ''}-${item.store || ''}-${item.product || ''}`)
        .filter(Boolean);
    const uniqueInvoices = new Set(invoiceKeys).size;
    const avgBasket = uniqueInvoices > 0 ? totalSales / uniqueInvoices : 0;
    const dailyAverage = totalSales / Math.max(uniqueDates, 1);
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🌍 Şehir Analizi - Sepet Ortalaması Hesaplama:');
        safeConsole.log('   📦 Toplam Kayıt:', cityData.length);
        safeConsole.log('   🧾 Fatura Sayısı:', uniqueInvoices);
        safeConsole.log('   💰 Toplam Satış:', totalSales.toLocaleString('tr-TR', {minimumFractionDigits: 2}));
        safeConsole.log('   🛒 Sepet Ortalaması:', avgBasket.toLocaleString('tr-TR', {minimumFractionDigits: 2}));
    }
    
    // En çok satış yapan temsilci
    const salespersonData = {};
    cityData.forEach(item => {
        const salesperson = item.sales_person || 'Bilinmiyor';
        if (!salespersonData[salesperson]) salespersonData[salesperson] = 0;
        salespersonData[salesperson] += parseFloat(item.usd_amount || 0);
    });
    
    // En çok satış yapan mağaza
    const storeData = {};
    cityData.forEach(item => {
        const store = item.store || 'Bilinmiyor';
        if (!storeData[store]) storeData[store] = 0;
        storeData[store] += parseFloat(item.usd_amount || 0);
    });
    
    // Nüfus ve kişi başı satış hesapla
    const cityPopulations = (typeof window !== 'undefined' && window.cityPopulations) || {};
    const cityPopulation = cityPopulations[selectedCity] || 0;
    const perCapitaSales = cityPopulation > 0 ? totalSales / cityPopulation : 0;
    
    // UI güncelle
    const totalSalesEl = document.getElementById('cityTotalSales');
    const totalQtyEl = document.getElementById('cityTotalQty');
    const customerCountEl = document.getElementById('cityCustomerCount');
    const avgBasketEl = document.getElementById('cityAvgBasket');
    const dailyAverageEl = document.getElementById('cityDailyAverage');
    const populationEl = document.getElementById('cityPopulation');
    const perCapitaEl = document.getElementById('cityPerCapitaSales');
    const topSalespersonsEl = document.getElementById('cityTopSalespersons');
    const topStoresEl = document.getElementById('cityTopStores');
    
    if (totalSalesEl) totalSalesEl.textContent = '$' + totalSales.toLocaleString('tr-TR', {minimumFractionDigits: 2});
    if (totalQtyEl) totalQtyEl.textContent = totalQty.toLocaleString('tr-TR', {minimumFractionDigits: 2});
    if (customerCountEl) customerCountEl.textContent = uniqueCustomers;
    if (avgBasketEl) avgBasketEl.textContent = '$' + avgBasket.toLocaleString('tr-TR', {minimumFractionDigits: 2});
    if (dailyAverageEl) dailyAverageEl.textContent = '$' + dailyAverage.toLocaleString('tr-TR', {minimumFractionDigits: 2});
    
    if (cityPopulation > 0) {
        const popInMillions = (cityPopulation / 1000000).toFixed(2);
        if (populationEl) populationEl.textContent = popInMillions + 'M';
        if (perCapitaEl) perCapitaEl.textContent = '$' + perCapitaSales.toLocaleString('tr-TR', {minimumFractionDigits: 2});
    } else {
        if (populationEl) populationEl.textContent = 'Veri Yok';
        if (perCapitaEl) perCapitaEl.textContent = '-';
    }
    
    // İlk 5 Temsilci
    const top5Salespersons = Object.entries(salespersonData).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let spHTML = '';
    top5Salespersons.forEach((sp, idx) => {
        const percent = (sp[1] / totalSales * 100).toFixed(1);
        spHTML += `<div style="margin: 5px 0;">${idx + 1}. ${sp[0]}: <strong>$${sp[1].toLocaleString('tr-TR', {minimumFractionDigits: 2})}</strong> (%${percent})</div>`;
    });
    if (topSalespersonsEl) topSalespersonsEl.innerHTML = spHTML;
    
    // İlk 5 Mağaza
    const top5Stores = Object.entries(storeData).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let storeHTML = '';
    top5Stores.forEach((store, idx) => {
        const percent = (store[1] / totalSales * 100).toFixed(1);
        storeHTML += `<div style="margin: 5px 0;">${idx + 1}. ${store[0]}: <strong>$${store[1].toLocaleString('tr-TR', {minimumFractionDigits: 2})}</strong> (%${percent})</div>`;
    });
    if (topStoresEl) topStoresEl.innerHTML = storeHTML;
    
    // Container'ı göster
    const container = document.getElementById('cityAnalysisContainer');
    if (container) container.style.display = 'block';
    
    // Grafikleri render et
    renderCityBrandChart(cityData);
    renderCityProductChart(cityData);
    renderCityCategoryChart(cityData);
    renderCityMonthlyChart(cityData);
    renderCityYearlyChart(cityData);
    
    // AI analiz
    performCityAIAnalysis(cityData, selectedCity, {totalSales, totalQty, uniqueCustomers, avgBasket});
    
    // İlçe listesi tablosunu render et
    renderCityDistrictTable(cityData, selectedCity);
    
    // İlçe listesi bölümünü göster
    const districtSection = document.getElementById('cityFullDistrictSection');
    if (districtSection) {
        districtSection.style.display = 'block';
    }
}

/**
 * Şehir marka grafiğini render eder
 */
function renderCityBrandChart(data) {
    const brandData = {};
    data.forEach(item => {
        const brand = item.brand || 'Bilinmiyor';
        if (!brandData[brand]) brandData[brand] = {sales: 0, qty: 0};
        brandData[brand].sales += parseFloat(item.usd_amount || 0);
        brandData[brand].qty += parseFloat(item.quantity || 0);
    });
    
    const sorted = Object.entries(brandData).sort((a, b) => b[1].sales - a[1].sales).slice(0, 10);
    const labels = sorted.map(item => item[0]);
    const salesValues = sorted.map(item => item[1].sales);
    const qtyValues = sorted.map(item => item[1].qty);
    
    const ctx = document.getElementById('cityBrandChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    if (cityBrandChartInstance) {
        cityBrandChartInstance.destroy();
    }
    
    cityBrandChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Satış (USD - KDV Hariç)',
                data: salesValues,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                yAxisID: 'y'
            }, {
                label: 'Miktar',
                data: qtyValues,
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 2,
                yAxisID: 'y'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {display: true, position: 'top'}
            },
            scales: {
                x: {beginAtZero: true}
            }
        }
    });
}

/**
 * Şehir ürün grafiğini render eder
 */
function renderCityProductChart(data) {
    const productData = {};
    data.forEach(item => {
        const product = item.product || 'Bilinmiyor';
        if (!productData[product]) productData[product] = {sales: 0, qty: 0};
        productData[product].sales += parseFloat(item.usd_amount || 0);
        productData[product].qty += parseFloat(item.quantity || 0);
    });
    
    const sorted = Object.entries(productData).sort((a, b) => b[1].sales - a[1].sales).slice(0, 10);
    const labels = sorted.map(item => item[0].substring(0, 30) + (item[0].length > 30 ? '...' : ''));
    const salesValues = sorted.map(item => item[1].sales);
    const qtyValues = sorted.map(item => item[1].qty);
    
    const ctx = document.getElementById('cityProductChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    if (cityProductChartInstance) {
        cityProductChartInstance.destroy();
    }
    
    cityProductChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Satış (USD - KDV Hariç)',
                data: salesValues,
                backgroundColor: 'rgba(56, 239, 125, 0.6)',
                borderColor: 'rgba(56, 239, 125, 1)',
                borderWidth: 2,
                yAxisID: 'y'
            }, {
                label: 'Miktar',
                data: qtyValues,
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 2,
                yAxisID: 'y'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {display: true, position: 'top'}
            },
            scales: {
                x: {beginAtZero: true}
            }
        }
    });
}

/**
 * Şehir kategori grafiğini render eder
 */
function renderCityCategoryChart(data) {
    const categoryData = {};
    data.forEach(item => {
        const category = item.category_2 || 'Bilinmiyor';
        if (category.toLowerCase() === 'all' || category.toLowerCase().includes('analitik') || category.toLowerCase().includes('eğitim')) {
            return;
        }
        if (!categoryData[category]) categoryData[category] = {sales: 0, qty: 0};
        categoryData[category].sales += parseFloat(item.usd_amount || 0);
        categoryData[category].qty += parseFloat(item.quantity || 0);
    });
    
    const sorted = Object.entries(categoryData).sort((a, b) => b[1].sales - a[1].sales).slice(0, 10);
    const labels = sorted.map(item => item[0]);
    const salesValues = sorted.map(item => item[1].sales);
    const qtyValues = sorted.map(item => item[1].qty);
    
    const ctx = document.getElementById('cityCategoryChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    if (cityCategoryChartInstance) {
        cityCategoryChartInstance.destroy();
    }
    
    cityCategoryChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Satış (USD - KDV Hariç)',
                data: salesValues,
                backgroundColor: 'rgba(245, 87, 108, 0.6)',
                borderColor: 'rgba(245, 87, 108, 1)',
                borderWidth: 2,
                yAxisID: 'y'
            }, {
                label: 'Miktar',
                data: qtyValues,
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 2,
                yAxisID: 'y'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {display: true, position: 'top'}
            },
            scales: {
                x: {beginAtZero: true}
            }
        }
    });
}

/**
 * Şehir aylık satış grafiğini render eder
 */
function renderCityMonthlyChart(data) {
    const monthlyData = {};
    data.forEach(item => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
        monthlyData[monthKey] += parseFloat(item.usd_amount || 0);
    });
    
    const sorted = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0]));
    const labels = sorted.map(item => item[0]);
    const values = sorted.map(item => item[1]);
    
    const ctx = document.getElementById('cityMonthlyChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    if (cityMonthlyChartInstance) {
        cityMonthlyChartInstance.destroy();
    }
    
    cityMonthlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Aylık Satış (USD)',
                data: values,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {display: true}
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('tr-TR');
                        }
                    }
                }
            }
        }
    });
}

/**
 * Şehir yıllık satış grafiğini render eder
 */
function renderCityYearlyChart(data) {
    const yearlyMonthlyData = {};
    data.forEach(item => {
        const date = new Date(item.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        if (!yearlyMonthlyData[year]) yearlyMonthlyData[year] = {};
        if (!yearlyMonthlyData[year][month]) yearlyMonthlyData[year][month] = 0;
        yearlyMonthlyData[year][month] += parseFloat(item.usd_amount || 0);
    });
    
    const allMonthKeys = new Set();
    Object.values(yearlyMonthlyData).forEach(yearData => {
        Object.keys(yearData).forEach(month => allMonthKeys.add(month));
    });
    const sortedMonths = Array.from(allMonthKeys).sort();
    
    const datasets = [];
    const colors = [
        {border: 'rgba(102, 126, 234, 1)', bg: 'rgba(102, 126, 234, 0.1)'},
        {border: 'rgba(245, 87, 108, 1)', bg: 'rgba(245, 87, 108, 0.1)'},
        {border: 'rgba(56, 239, 125, 1)', bg: 'rgba(56, 239, 125, 0.1)'},
        {border: 'rgba(255, 206, 86, 1)', bg: 'rgba(255, 206, 86, 0.1)'}
    ];
    
    Object.keys(yearlyMonthlyData).sort().forEach((year, idx) => {
        const yearData = yearlyMonthlyData[year];
        const values = sortedMonths.map(month => yearData[month] || 0);
        const color = colors[idx % colors.length];
        
        datasets.push({
            label: `${year} Satışları`,
            data: values,
            borderColor: color.border,
            backgroundColor: color.bg,
            borderWidth: 3,
            fill: true,
            tension: 0.4
        });
    });
    
    const ctx = document.getElementById('cityYearlyChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    if (cityYearlyChartInstance) {
        cityYearlyChartInstance.destroy();
    }
    
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const labels = sortedMonths.map(m => monthNames[parseInt(m) - 1]);
    
    cityYearlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {display: true, position: 'top'},
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toLocaleString('tr-TR', {minimumFractionDigits: 2});
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('tr-TR');
                        }
                    }
                }
            }
        }
    });
}

/**
 * Şehir AI analizi yapar
 */
function performCityAIAnalysis(data, cityName, stats) {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🤖 Şehir AI analizi başlatılıyor...');
    }
    
    const brandData = {};
    data.forEach(item => {
        const brand = item.brand || 'Bilinmiyor';
        if (!brandData[brand]) brandData[brand] = 0;
        brandData[brand] += parseFloat(item.usd_amount || 0);
    });
    const topBrands = Object.entries(brandData).sort((a, b) => b[1] - a[1]).slice(0, 3);
    
    const categoryData = {};
    data.forEach(item => {
        const category = item.category_2 || 'Bilinmiyor';
        if (!categoryData[category]) categoryData[category] = 0;
        categoryData[category] += parseFloat(item.usd_amount || 0);
    });
    const topCategories = Object.entries(categoryData).sort((a, b) => b[1] - a[1]).slice(0, 3);
    
    const insights = {
        positive: [],
        neutral: [],
        recommendations: []
    };
    
    if (topBrands.length > 0) {
        const topBrand = topBrands[0];
        const brandShare = (topBrand[1] / stats.totalSales * 100).toFixed(1);
        insights.positive.push({
            title: `🏷️ ${topBrand[0]} Lider Marka`,
            description: `${cityName} ilinde ${topBrand[0]} markası %${brandShare} pay ile lider ($${topBrand[1].toLocaleString('tr-TR', {minimumFractionDigits: 2})}).`
        });
    }
    
    if (topCategories.length > 0) {
        const topCategory = topCategories[0];
        const catShare = (topCategory[1] / stats.totalSales * 100).toFixed(1);
        insights.positive.push({
            title: `📂 ${topCategory[0]} En Popüler Kategori`,
            description: `${cityName} ilinde ${topCategory[0]} kategorisi %${catShare} pay ile en çok tercih edilen ($${topCategory[1].toLocaleString('tr-TR', {minimumFractionDigits: 2})}).`
        });
    }
    
    insights.neutral.push({
        title: `📊 ${cityName} Genel Performans`,
        description: `Toplam ${stats.uniqueCustomers} müşteri, $${stats.totalSales.toLocaleString('tr-TR', {minimumFractionDigits: 2})} satış gerçekleştirdi. Ortalama sepet değeri $${stats.avgBasket.toLocaleString('tr-TR', {minimumFractionDigits: 2})}.`
    });
    
    if (topBrands.length >= 3) {
        insights.neutral.push({
            title: `🏷️ Top 3 Marka`,
            description: `${topBrands.map(b => b[0]).join(', ')} markaları ${cityName} ilinde en çok tercih ediliyor.`
        });
    }
    
    insights.recommendations.push({
        icon: '📦',
        title: 'Stok Optimizasyonu',
        description: `${cityName} ilindeki mağazalarda ${topBrands[0]?.[0] || 'top marka'} markası ve ${topCategories[0]?.[0] || 'top kategori'} kategorisi ürünlerinin stok seviyesini artırın.`
    });
    
    if (topBrands.length > 0 && topBrands[0]) {
        insights.recommendations.push({
            icon: '📢',
            title: 'Bölgesel Kampanya',
            description: `${cityName} ili için ${topBrands[0][0]} markasında özel kampanya düzenleyin. Bu bölgede yüksek talep var.`
        });
    }
    
    insights.recommendations.push({
        icon: '🎯',
        title: 'Müşteri Segmentasyonu',
        description: `${cityName} ilindeki ${stats.uniqueCustomers} müşteriye özel e-posta kampanyaları gönderin. Tercih ettikleri kategorilerdeki yeni ürünleri tanıtın.`
    });
    
    const html = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px;">
            ${insights.positive.length > 0 ? `
            <div class="analysis-section">
                <h3 style="color: white; margin-top: 0;">✅ ${cityName} Güçlü Yönler</h3>
                ${insights.positive.map(item => `
                    <div class="insight-item insight-positive" style="background: rgba(56, 239, 125, 0.2); padding: 15px; border-radius: 10px; margin: 10px 0; border-left: 4px solid #38ef7d;">
                        <span class="insight-icon" style="font-size: 1.5em; margin-right: 10px;">✅</span>
                        <strong style="font-size: 1.1em;">${item.title}</strong><br>
                        <span style="opacity: 0.95; margin-top: 8px; display: block;">${item.description}</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${insights.neutral.length > 0 ? `
            <div class="analysis-section" style="margin-top: 25px;">
                <h3 style="color: white;">💡 Genel Bilgiler</h3>
                ${insights.neutral.map(item => `
                    <div class="insight-item insight-neutral" style="background: rgba(255, 215, 0, 0.2); padding: 15px; border-radius: 10px; margin: 10px 0; border-left: 4px solid #ffd700;">
                        <span class="insight-icon" style="font-size: 1.5em; margin-right: 10px;">💡</span>
                        <strong style="font-size: 1.1em;">${item.title}</strong><br>
                        <span style="opacity: 0.95; margin-top: 8px; display: block;">${item.description}</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="analysis-section" style="margin-top: 25px;">
                <h3 style="color: white;">🎯 Aksiyon Önerileri</h3>
                ${insights.recommendations.map(item => `
                    <div class="recommendation" style="background: rgba(255, 255, 255, 0.15); padding: 18px; border-radius: 10px; margin: 12px 0;">
                        <span class="recommendation-icon" style="font-size: 1.8em; margin-right: 12px;">${item.icon}</span>
                        <div style="display: inline-block; vertical-align: top; width: calc(100% - 50px);">
                            <strong style="font-size: 1.15em; display: block; margin-bottom: 8px;">${item.title}</strong>
                            <p style="margin: 0; opacity: 0.95; line-height: 1.6;">${item.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    const aiContentEl = document.getElementById('cityAIAnalysisContent');
    if (aiContentEl) aiContentEl.innerHTML = html;
}

/**
 * Şehir ilçe tablosunu render eder (basitleştirilmiş versiyon)
 */
function renderCityDistrictTable(cityData, selectedCity) {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🏘️ İlçe listesi tablosu render ediliyor...', selectedCity);
    }
    
    const districtData = {};
    const maxDataSize = 50000;
    const limitedCityData = cityData.length > maxDataSize ? cityData.slice(0, maxDataSize) : cityData;
    
    if (cityData.length > maxDataSize && typeof safeConsole !== 'undefined') {
        safeConsole.log(`⚠️ Veri seti çok büyük (${cityData.length}), ilk ${maxDataSize} kayıt işleniyor...`);
    }
    
    const allDistricts = limitedCityData.map(item => item.city).filter(Boolean);
    
    limitedCityData.forEach(item => {
        const rawDistrict = item.city || 'Bilinmiyor';
        const district = (typeof normalizeDistrictName !== 'undefined') 
            ? normalizeDistrictName(rawDistrict, allDistricts)
            : rawDistrict;
        
        if (!districtData[district]) {
            districtData[district] = {
                sales: 0,
                qty: 0,
                invoiceCount: 0,
                uniqueCustomers: 0,
                invoices: new Set(),
                customers: new Set()
            };
        }
        districtData[district].sales += parseFloat(item.usd_amount || 0);
        districtData[district].qty += parseFloat(item.quantity || 0);
        if (item.move_name) districtData[district].invoices.add(item.move_name);
        else if (item.move_id) districtData[district].invoices.add(item.move_id);
        if (item.partner) districtData[district].customers.add(item.partner);
    });
    
    Object.keys(districtData).forEach(district => {
        districtData[district].invoiceCount = districtData[district].invoices.size;
        districtData[district].uniqueCustomers = districtData[district].customers.size;
        delete districtData[district].invoices;
        delete districtData[district].customers;
    });
    
    const sorted = Object.entries(districtData).sort((a, b) => b[1].sales - a[1].sales);
    const MAX_DISTRICTS = 30;
    let displayData = sorted.slice(0, MAX_DISTRICTS);
    const totalSales = sorted.reduce((sum, item) => sum + item[1].sales, 0);
    
    let html = `
        <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <th style="padding: 15px; text-align: left; cursor: pointer;" onclick="sortCityDistrictTable(0)"># <span style="font-size: 0.8em;">▼</span></th>
                    <th style="padding: 15px; text-align: left; cursor: pointer;" onclick="sortCityDistrictTable(1)">🏘️ İlçe <span style="font-size: 0.8em;">▼</span></th>
                    <th style="padding: 15px; text-align: right; cursor: pointer;" onclick="sortCityDistrictTable(2)">💰 Toplam Satış (USD) <span style="font-size: 0.8em;">▼</span></th>
                    <th style="padding: 15px; text-align: right; cursor: pointer;" onclick="sortCityDistrictTable(3)">📦 Ürün Miktarı <span style="font-size: 0.8em;">▼</span></th>
                    <th style="padding: 15px; text-align: right; cursor: pointer;" onclick="sortCityDistrictTable(4)">🧾 Fatura Adeti <span style="font-size: 0.8em;">▼</span></th>
                    <th style="padding: 15px; text-align: right; cursor: pointer;" onclick="sortCityDistrictTable(5)">👥 Farklı Müşteri <span style="font-size: 0.8em;">▼</span></th>
                    <th style="padding: 15px; text-align: right; cursor: pointer;" onclick="sortCityDistrictTable(6)">🛒 Sepet Ortalaması <span style="font-size: 0.8em;">▼</span></th>
                    <th style="padding: 15px; text-align: right;">📈 Pay (%)</th>
                </tr>
            </thead>
            <tbody id="cityDistrictTableBody">
    `;
    
    displayData.forEach((item, index) => {
        const district = item[0];
        const stats = item[1];
        const share = ((stats.sales / totalSales) * 100).toFixed(1);
        const avgInvoice = stats.invoiceCount > 0 ? (stats.sales / stats.invoiceCount) : 0;
        
        html += `
            <tr style="border-bottom: 1px solid #eee; ${index % 2 === 0 ? 'background: #f8f9fa;' : 'background: white;'}">
                <td style="padding: 12px;">${index + 1}</td>
                <td style="padding: 12px;"><strong>${district}</strong></td>
                <td style="padding: 12px; text-align: right; color: #667eea; font-weight: bold;">$${stats.sales.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                <td style="padding: 12px; text-align: right;">${stats.qty.toLocaleString('tr-TR', {minimumFractionDigits: 0})}</td>
                <td style="padding: 12px; text-align: right; color: #38ef7d; font-weight: bold;">${stats.invoiceCount.toLocaleString('tr-TR')}</td>
                <td style="padding: 12px; text-align: right; color: #764ba2; font-weight: bold;">${stats.uniqueCustomers.toLocaleString('tr-TR')}</td>
                <td style="padding: 12px; text-align: right;">$${avgInvoice.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                <td style="padding: 12px; text-align: right;">
                    <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">%${share}</span>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <p style="margin-top: 10px; color: #6c757d; font-size: 0.9em;">
            💡 <strong>${selectedCity} şehrinde toplam ${sorted.length} ilçe</strong>${sorted.length > MAX_DISTRICTS ? ` (İlk ${MAX_DISTRICTS} ilçe gösteriliyor)` : ''} - Sütun başlıklarına tıklayarak sıralama yapabilirsiniz
        </p>
    `;
    
    const tableEl = document.getElementById('cityFullDistrictTable');
    if (tableEl) tableEl.innerHTML = html;
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('✅ İlçe listesi tablosu render edildi');
    }
}

/**
 * İlçe tablosunu sıralar
 */
function sortCityDistrictTable(column) {
    if (cityDistrictSortColumn === column) {
        cityDistrictSortAsc = !cityDistrictSortAsc;
    } else {
        cityDistrictSortColumn = column;
        cityDistrictSortAsc = false;
    }
    
    const tbody = document.getElementById('cityDistrictTableBody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        const cellsA = a.querySelectorAll('td');
        const cellsB = b.querySelectorAll('td');
        
        let valA, valB;
        
        if (column === 0) {
            valA = parseInt(cellsA[0].textContent);
            valB = parseInt(cellsB[0].textContent);
        } else if (column === 1) {
            valA = cellsA[1].textContent.trim();
            valB = cellsB[1].textContent.trim();
            return cityDistrictSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (column === 2) {
            valA = parseFloat(cellsA[2].textContent.replace(/[^0-9,.-]/g, '').replace(',', '.'));
            valB = parseFloat(cellsB[2].textContent.replace(/[^0-9,.-]/g, '').replace(',', '.'));
        } else if (column === 3) {
            valA = parseFloat(cellsA[3].textContent.replace(/[^0-9,.-]/g, '').replace(',', '.'));
            valB = parseFloat(cellsB[3].textContent.replace(/[^0-9,.-]/g, '').replace(',', '.'));
        } else if (column === 4) {
            valA = parseInt(cellsA[4].textContent.replace(/[^0-9]/g, ''));
            valB = parseInt(cellsB[4].textContent.replace(/[^0-9]/g, ''));
        } else if (column === 5) {
            valA = parseInt(cellsA[5].textContent.replace(/[^0-9]/g, ''));
            valB = parseInt(cellsB[5].textContent.replace(/[^0-9]/g, ''));
        } else if (column === 6) {
            valA = parseFloat(cellsA[6].textContent.replace(/[^0-9,.-]/g, '').replace(',', '.'));
            valB = parseFloat(cellsB[6].textContent.replace(/[^0-9,.-]/g, '').replace(',', '.'));
        }
        
        return cityDistrictSortAsc ? (valA - valB) : (valB - valA);
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

// Geriye dönük uyumluluk için window objesine export et
if (typeof window !== 'undefined') {
    window.analyzeCustomers = analyzeCustomers;
    window.populateCustomerStoreFilter = populateCustomerStoreFilter;
    window.renderTopCustomers = renderTopCustomers;
    window.renderCustomerCityChart = renderCustomerCityChart;
    window.renderCustomerTrendChart = renderCustomerTrendChart;
    
    // City analysis functions
    window.analyzeCityPerformance = analyzeCityPerformance;
    window.renderCityBrandChart = renderCityBrandChart;
    window.renderCityProductChart = renderCityProductChart;
    window.renderCityCategoryChart = renderCityCategoryChart;
    window.renderCityMonthlyChart = renderCityMonthlyChart;
    window.renderCityYearlyChart = renderCityYearlyChart;
    window.performCityAIAnalysis = performCityAIAnalysis;
    window.renderCityDistrictTable = renderCityDistrictTable;
    window.sortCityDistrictTable = sortCityDistrictTable;
    
    // Chart instance'ları window'a da ekle (diğer modüller erişebilsin)
    Object.defineProperty(window, 'customerCityChart', {
        get: () => customerCityChart,
        set: (value) => { customerCityChart = value; }
    });
    Object.defineProperty(window, 'customerTrendChart', {
        get: () => customerTrendChart,
        set: (value) => { customerTrendChart = value; }
    });
}

