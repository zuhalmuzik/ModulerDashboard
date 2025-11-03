/**
 * Dashboard Module
 * Handles all dashboard-related functionality including charts, statistics, and AI analysis
 * 
 * Dependencies:
 * - Chart.js (CDN - Chart, ChartDataLabels)
 * - safeConsole (config.js - window.safeConsole)
 * - allData (passed as parameter to loadDashboard)
 */

// Private chart instance variables
let dashYearlyChartInstance = null;
let dashTopStoresChartInstance = null;
let dashTopSalespeopleChartInstance = null;
let dashTopBrandsChartInstance = null;
let dashTopCategoriesChartInstance = null;
let dashTopCitiesChartInstance = null;
let dashTopProductsChartInstance = null;

// Private state variables
let dashYearlyMetricType = 'sales'; // Default: satış
let dashYearlyDataCache = null; // Veriyi cache'le

/**
 * Dashboard özet kartlarını günceller
 * @param {Object} statistics - İstatistik objesi
 */
function updateDashboardSummaryCards(statistics) {
    const {
        totalSales,
        totalQty,
        uniqueCustomers,
        uniqueProducts,
        uniqueStores,
        uniqueSalespeople,
        dailyAverage,
        basketAverage,
        uniqueInvoices
    } = statistics;

    const dashTotalSales = document.getElementById('dashTotalSales');
    const dashTotalQty = document.getElementById('dashTotalQty');
    const dashTotalCustomers = document.getElementById('dashTotalCustomers');
    const dashTotalProducts = document.getElementById('dashTotalProducts');
    const dashTotalStores = document.getElementById('dashTotalStores');
    const dashTotalSalespeople = document.getElementById('dashTotalSalespeople');
    const dashDailyAverage = document.getElementById('dashDailyAverage');
    const dashBasketAverage = document.getElementById('dashBasketAverage');
    const dashTotalInvoices = document.getElementById('dashTotalInvoices');

    if (dashTotalSales) dashTotalSales.textContent = '$' + totalSales.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0});
    if (dashTotalQty) dashTotalQty.textContent = totalQty.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0});
    if (dashTotalCustomers) dashTotalCustomers.textContent = uniqueCustomers.toLocaleString('tr-TR');
    if (dashTotalProducts) dashTotalProducts.textContent = uniqueProducts.toLocaleString('tr-TR');
    if (dashTotalStores) dashTotalStores.textContent = uniqueStores.toLocaleString('tr-TR');
    if (dashTotalSalespeople) dashTotalSalespeople.textContent = uniqueSalespeople.toLocaleString('tr-TR');
    if (dashDailyAverage) dashDailyAverage.textContent = '$' + dailyAverage.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0});
    if (dashBasketAverage) dashBasketAverage.textContent = '$' + basketAverage.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0});
    if (dashTotalInvoices) dashTotalInvoices.textContent = uniqueInvoices.toLocaleString('tr-TR');
}

/**
 * Yıllık grafik metrik tipini değiştirir
 * @param {string} type - 'sales' veya 'qty'
 */
function changeDashYearlyMetric(type) {
    dashYearlyMetricType = type;

    // Buton stillerini güncelle
    const salesBtn = document.getElementById('dashYearlyMetricSales');
    const qtyBtn = document.getElementById('dashYearlyMetricQty');

    if (type === 'sales') {
        if (salesBtn) {
            salesBtn.style.background = '#667eea';
            salesBtn.style.color = 'white';
        }
        if (qtyBtn) {
            qtyBtn.style.background = 'white';
            qtyBtn.style.color = '#667eea';
        }
    } else {
        if (salesBtn) {
            salesBtn.style.background = 'white';
            salesBtn.style.color = '#667eea';
        }
        if (qtyBtn) {
            qtyBtn.style.background = '#667eea';
            qtyBtn.style.color = 'white';
        }
    }

    // Grafiği yeniden çiz - window.allData'dan veriyi al
    if (typeof window !== 'undefined' && window.allData && window.allData.length > 0) {
        renderDashYearlyChart(window.allData);
    } else {
        const safeConsole = (typeof window !== 'undefined' && window.safeConsole) ? window.safeConsole : console;
        safeConsole.warn('⚠️ allData bulunamadı, yıllık grafik güncellenemedi');
    }
}
/**
 * Yıllık karşılaştırma grafiğini render eder
 * @param {Array} data - Satış verileri dizisi
 */
function renderDashYearlyChart(data) {
    const ctx = document.getElementById('dashYearlyChart');
    if (!ctx) return;

    // Veriyi her zaman yeniden hesapla (cache sorununu önlemek için)
    const yearlyMonthlyData = {};
    const yearlyMonthlyQty = {};

    data.forEach(item => {
        if (item.date) {
            const year = item.date.substring(0, 4);
            const month = item.date.substring(5, 7);

            // Satış tutarı
            if (!yearlyMonthlyData[year]) yearlyMonthlyData[year] = {};
            if (!yearlyMonthlyData[year][month]) yearlyMonthlyData[year][month] = 0;
            yearlyMonthlyData[year][month] += parseFloat(item.usd_amount || 0);

            // Miktar
            if (!yearlyMonthlyQty[year]) yearlyMonthlyQty[year] = {};
            if (!yearlyMonthlyQty[year][month]) yearlyMonthlyQty[year][month] = 0;
            yearlyMonthlyQty[year][month] += parseFloat(item.quantity || 0);
        }
    });

    // Tüm ayları topla
    const allMonthKeys = new Set();
    Object.values(yearlyMonthlyData).forEach(yearData => {
        Object.keys(yearData).forEach(month => allMonthKeys.add(month));
    });

    const sortedMonths = Array.from(allMonthKeys).sort();
    const sourceData = dashYearlyMetricType === 'sales' ? yearlyMonthlyData : yearlyMonthlyQty;

    // Dataset oluştur (seçilen metriğe göre)
    const datasets = [];
    const colors = [
        {border: 'rgba(102, 126, 234, 1)', bg: 'rgba(102, 126, 234, 0.1)'},
        {border: 'rgba(245, 87, 108, 1)', bg: 'rgba(245, 87, 108, 0.1)'},
        {border: 'rgba(56, 239, 125, 1)', bg: 'rgba(56, 239, 125, 0.1)'},
        {border: 'rgba(255, 206, 86, 1)', bg: 'rgba(255, 206, 86, 0.1)'}
    ];

    Object.keys(sourceData).sort().forEach((year, idx) => {
        const yearData = sourceData[year];
        const values = sortedMonths.map(month => yearData[month] || 0);
        const color = colors[idx % colors.length];

        datasets.push({
            label: `${year}`,
            data: values,
            borderColor: color.border,
            backgroundColor: color.bg,
            borderWidth: 3,
            fill: true,
            tension: 0.4
        });
    });

    if (dashYearlyChartInstance) {
        dashYearlyChartInstance.destroy();
    }

    // Ay isimlerini göster
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const labels = sortedMonths.map(m => monthNames[parseInt(m) - 1]);

    // Y ekseni ayarları
    const isSales = dashYearlyMetricType === 'sales';
    const yAxisLabel = isSales ? 'Satış (USD - KDV Hariç)' : 'Miktar (Adet)';
    const yAxisColor = isSales ? 'rgba(102, 126, 234, 1)' : 'rgba(255, 159, 64, 1)';

    dashYearlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {display: true, position: 'top'},
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (isSales) {
                                return context.dataset.label + ': $' + context.parsed.y.toLocaleString('tr-TR', {minimumFractionDigits: 2});
                            } else {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString('tr-TR', {minimumFractionDigits: 0}) + ' adet';
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yAxisLabel,
                        color: yAxisColor,
                        font: {
                            weight: 'bold',
                            size: 12
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            if (isSales) {
                                return '$' + value.toLocaleString('tr-TR');
                            } else {
                                return value.toLocaleString('tr-TR') + ' adet';
                            }
                        }
                    }
                }
            }
        }
    });
}
/**
 * Top 10 mağaza grafiğini render eder
 * @param {Array} data - Satış verileri dizisi
 */
function renderDashTopStoresChart(data) {
    const ctx = document.getElementById('dashTopStoresChart');
    if (!ctx) return;

    const storeData = {};
    data.forEach(item => {
        const store = item.store || 'Bilinmiyor';
        if (!storeData[store]) storeData[store] = 0;
        storeData[store] += parseFloat(item.usd_amount || 0);
    });

    const top10 = Object.entries(storeData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const total = top10.reduce((sum, item) => sum + item[1], 0);

    if (dashTopStoresChartInstance) {
        dashTopStoresChartInstance.destroy();
    }

    dashTopStoresChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(s => s[0]),
            datasets: [{
                label: 'Satış (USD)',
                data: top10.map(s => s[1]),
                backgroundColor: 'rgba(250, 112, 154, 0.8)'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed.x / total) * 100).toFixed(1);
                            return 'Satış: $' + context.parsed.x.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            scales: {
                x: {
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
 * Top 10 satış temsilcisi grafiğini render eder
 * @param {Array} data - Satış verileri dizisi
 */
function renderDashTopSalespeopleChart(data) {
    const ctx = document.getElementById('dashTopSalespeopleChart');
    if (!ctx) return;

    const spData = {};
    data.forEach(item => {
        const sp = item.sales_person || 'Bilinmiyor';
        if (!spData[sp]) spData[sp] = 0;
        spData[sp] += parseFloat(item.usd_amount || 0);
    });

    const top10 = Object.entries(spData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const total = top10.reduce((sum, item) => sum + item[1], 0);

    if (dashTopSalespeopleChartInstance) {
        dashTopSalespeopleChartInstance.destroy();
    }

    dashTopSalespeopleChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(s => s[0]),
            datasets: [{
                label: 'Satış (USD)',
                data: top10.map(s => s[1]),
                backgroundColor: 'rgba(67, 233, 123, 0.8)'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed.x / total) * 100).toFixed(1);
                            return 'Satış: $' + context.parsed.x.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            scales: {
                x: {
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
 * Top 10 marka grafiğini render eder
 * @param {Array} data - Satış verileri dizisi
 */
function renderDashTopBrandsChart(data) {
    const ctx = document.getElementById('dashTopBrandsChart');
    if (!ctx) return;

    const brandData = {};
    data.forEach(item => {
        const brand = item.brand || 'Bilinmiyor';
        if (!brandData[brand]) brandData[brand] = 0;
        brandData[brand] += parseFloat(item.usd_amount || 0);
    });

    const top10 = Object.entries(brandData).sort((a, b) => b[1] - a[1]).slice(0, 10);

    if (dashTopBrandsChartInstance) {
        dashTopBrandsChartInstance.destroy();
    }

    dashTopBrandsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: top10.map(s => s[0]),
            datasets: [{
                data: top10.map(s => s[1]),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(245, 87, 108, 0.8)',
                    'rgba(79, 172, 254, 0.8)',
                    'rgba(67, 233, 123, 0.8)',
                    'rgba(56, 249, 215, 0.8)',
                    'rgba(250, 112, 154, 0.8)',
                    'rgba(254, 224, 101, 0.8)',
                    'rgba(0, 242, 254, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': $' + context.parsed.toLocaleString('tr-TR', {minimumFractionDigits: 2});
                        }
                    }
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
 * Top 10 kategori grafiğini render eder
 * @param {Array} data - Satış verileri dizisi
 */
function renderDashTopCategoriesChart(data) {
    const ctx = document.getElementById('dashTopCategoriesChart');
    if (!ctx) return;

    const catData = {};
    data.forEach(item => {
        // Eğer category_1 "All" ise category_2 kullan, değilse category_1
        let cat = (item.category_1 && item.category_1.toLowerCase() !== 'all')
            ? item.category_1
            : (item.category_2 || item.category_3 || 'Diğer');

        // Boş değerleri ve Analitik/Eğitim atla
        if (!cat || cat.toLowerCase() === 'bilinmiyor') return;
        if (cat.toLowerCase().includes('analitik') || cat.toLowerCase().includes('eğitim')) return;

        if (!catData[cat]) catData[cat] = 0;
        catData[cat] += parseFloat(item.usd_amount || 0);
    });

    const top10 = Object.entries(catData).sort((a, b) => b[1] - a[1]).slice(0, 10);

    if (dashTopCategoriesChartInstance) {
        dashTopCategoriesChartInstance.destroy();
    }

    dashTopCategoriesChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: top10.map(s => s[0]),
            datasets: [{
                data: top10.map(s => s[1]),
                backgroundColor: [
                    'rgba(67, 233, 123, 0.8)',
                    'rgba(56, 249, 215, 0.8)',
                    'rgba(79, 172, 254, 0.8)',
                    'rgba(0, 242, 254, 0.8)',
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(245, 87, 108, 0.8)',
                    'rgba(250, 112, 154, 0.8)',
                    'rgba(254, 224, 101, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': $' + context.parsed.toLocaleString('tr-TR', {minimumFractionDigits: 2});
                        }
                    }
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
 * Top 10 şehir grafiğini render eder
 * @param {Array} data - Satış verileri dizisi
 */
function renderDashTopCitiesChart(data) {
    const ctx = document.getElementById('dashTopCitiesChart');
    if (!ctx) return;

    const cityData = {};
    data.forEach(item => {
        // partner_city alanını kullan (şehir bilgisi)
        const city = item.partner_city || 'Bilinmiyor';
        if (!cityData[city]) cityData[city] = 0;
        cityData[city] += parseFloat(item.usd_amount || 0);
    });

    const top10 = Object.entries(cityData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const total = top10.reduce((sum, item) => sum + item[1], 0);

    if (dashTopCitiesChartInstance) {
        dashTopCitiesChartInstance.destroy();
    }

    dashTopCitiesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(s => s[0]),
            datasets: [{
                label: 'Satış (USD)',
                data: top10.map(s => s[1]),
                backgroundColor: 'rgba(79, 172, 254, 0.8)'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed.x / total) * 100).toFixed(1);
                            return 'Satış: $' + context.parsed.x.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            scales: {
                x: {
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
 * Top 10 ürün grafiğini render eder
 * @param {Array} data - Satış verileri dizisi
 */
function renderDashTopProductsChart(data) {
    const ctx = document.getElementById('dashTopProductsChart');
    if (!ctx) return;

    const productData = {};
    data.forEach(item => {
        const product = item.product || 'Bilinmiyor';
        if (!productData[product]) productData[product] = 0;
        productData[product] += parseFloat(item.usd_amount || 0);
    });

    const top10 = Object.entries(productData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const total = top10.reduce((sum, item) => sum + item[1], 0);

    if (dashTopProductsChartInstance) {
        dashTopProductsChartInstance.destroy();
    }

    // Ürün isimlerini temizle ve kısalt
    const shortLabels = top10.map(s => {
        let name = s[0];

        // Başındaki kodları temizle (örn: "[1R] ", "201R] ", "'PEP] ")
        name = name.replace(/^[\[\(]?[A-Z0-9']+[\]\)]?\s*/g, '');

        // Sonundaki gereksiz açıklamaları kısalt (örn: "Dijital Piyano" -> "Piyano")
        name = name.replace(/\s+Dijital\s+Piyano/gi, ' Piyano');
        name = name.replace(/\s+Kuyruklu\s+Piyano/gi, ' K.Piyano');
        name = name.replace(/\s+M\/PEP\s+/gi, ' ');

        // Max 35 karakter
        return name.length > 35 ? name.substring(0, 32) + '...' : name;
    });

    dashTopProductsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: shortLabels,
            datasets: [{
                label: 'Satış (USD)',
                data: top10.map(s => s[1]),
                backgroundColor: 'rgba(240, 147, 251, 0.8)'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            // Tooltip'te tam ürün adını göster
                            return top10[context[0].dataIndex][0];
                        },
                        label: function(context) {
                            const percentage = ((context.parsed.x / total) * 100).toFixed(1);
                            return 'Satış: $' + context.parsed.x.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('tr-TR');
                        }
                    }
                },
                y: {
                    ticks: {
                        autoSkip: false,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}
/**
 * Dashboard AI Analiz fonksiyonu
 * @param {Array} data - Satış verileri dizisi
 */
function performDashboardAIAnalysis(data) {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🤖 Gelişmiş AI Analiz başlatılıyor...');
    }

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const thisYearData = data.filter(item => item.date && item.date.startsWith(currentYear.toString()));
    const lastYearData = data.filter(item => item.date && item.date.startsWith(lastYear.toString()));

    // ========== VERİ GÜNCELLEME TARİHİ VE İVME HESAPLAMA ==========
    const allDates = data.map(item => item.date).filter(d => d).sort();
    const latestDataDate = allDates[allDates.length - 1];
    const latestYear = latestDataDate ? latestDataDate.substring(0, 4) : currentYear;
    const latestMonth = latestDataDate ? latestDataDate.substring(5, 7) : '';
    const latestDay = latestDataDate ? latestDataDate.substring(8, 10) : '';

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const latestMonthName = latestMonth ? monthNames[parseInt(latestMonth) - 1] : '';
    const dataUpdateInfo = `${latestDay} ${latestMonthName} ${latestYear}`;

    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('📅 Son veri güncelleme tarihi:', dataUpdateInfo);
    }

    // ========== YILLIK KARŞILAŞTIRMA (İVME BAZLI) ==========
    const totalSalesThisYear = thisYearData.reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0);
    const totalSalesLastYear = lastYearData.reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0);

    // Bu yıl için geçen gün sayısını hesapla (veri güncelleme tarihine göre)
    const startOfYear = new Date(currentYear, 0, 1);
    const latestDate = new Date(latestDataDate);
    const daysPassedThisYear = Math.ceil((latestDate - startOfYear) / (1000 * 60 * 60 * 24));
    const daysRemainingThisYear = 365 - daysPassedThisYear;

    // Günlük ortalama ciro (bu yıl vs geçen yıl)
    const dailyAvgThisYear = daysPassedThisYear > 0 ? totalSalesThisYear / daysPassedThisYear : 0;
    const dailyAvgLastYear = totalSalesLastYear / 365;

    // Günlük ortalama bazında ivme
    const dailyGrowth = dailyAvgLastYear > 0 ? ((dailyAvgThisYear - dailyAvgLastYear) / dailyAvgLastYear * 100) : 0;

    // Yıl sonu projeksiyonu (mevcut günlük ortalama ile)
    const projectedYearEndSales = dailyAvgThisYear * 365;
    const projectedGrowth = totalSalesLastYear > 0 ? ((projectedYearEndSales - totalSalesLastYear) / totalSalesLastYear * 100) : 0;

    // Hedef hesaplama: 2024 seviyesine ulaşmak için kalan günlerde ne kadar gerekli
    const targetRemainingForLastYear = Math.max(0, totalSalesLastYear - totalSalesThisYear);
    const dailyTargetToMatchLastYear = daysRemainingThisYear > 0 ? targetRemainingForLastYear / daysRemainingThisYear : 0;

    // Basit karşılaştırma (yanıltıcı olabilir ama gösterelim)
    const yearGrowth = lastYearData.length > 0 ? ((totalSalesThisYear - totalSalesLastYear) / totalSalesLastYear * 100) : 0;
    // ========== MAĞAZA ANALİZİ ==========
    const storeData = {};
    const storeDataLastYear = {};
    thisYearData.forEach(item => {
        const store = item.store || 'Bilinmiyor';
        if (!storeData[store]) storeData[store] = 0;
        storeData[store] += parseFloat(item.usd_amount || 0);
    });
    lastYearData.forEach(item => {
        const store = item.store || 'Bilinmiyor';
        if (!storeDataLastYear[store]) storeDataLastYear[store] = 0;
        storeDataLastYear[store] += parseFloat(item.usd_amount || 0);
    });
    const sortedStores = Object.entries(storeData).sort((a, b) => b[1] - a[1]);
    const top10Stores = sortedStores.slice(0, 10);
    const weakStore = sortedStores[sortedStores.length - 1];

    // Mağaza ivme hesaplama
    const storeGrowth = sortedStores.map(([store, sales]) => {
        const lastYearSales = storeDataLastYear[store] || 0;
        const growth = lastYearSales > 0 ? ((sales - lastYearSales) / lastYearSales * 100) : 0;
        return { store, sales, growth };
    }).sort((a, b) => b.growth - a.growth);
    const fastestGrowingStore = storeGrowth[0];
    const slowestGrowingStore = storeGrowth[storeGrowth.length - 1];

    // ========== TEMSİLCİ ANALİZİ ==========
    const spData = {};
    const spDataLastYear = {};
    thisYearData.forEach(item => {
        const sp = item.sales_person || 'Bilinmiyor';
        if (!spData[sp]) spData[sp] = 0;
        spData[sp] += parseFloat(item.usd_amount || 0);
    });
    lastYearData.forEach(item => {
        const sp = item.sales_person || 'Bilinmiyor';
        if (!spDataLastYear[sp]) spDataLastYear[sp] = 0;
        spDataLastYear[sp] += parseFloat(item.usd_amount || 0);
    });
    const sortedSP = Object.entries(spData).sort((a, b) => b[1] - a[1]);
    const top10SP = sortedSP.slice(0, 10);

    // Temsilci ivme hesaplama
    const spGrowth = sortedSP.map(([sp, sales]) => {
        const lastYearSales = spDataLastYear[sp] || 0;
        const growth = lastYearSales > 0 ? ((sales - lastYearSales) / lastYearSales * 100) : 0;
        return { sp, sales, growth };
    }).sort((a, b) => b.growth - a.growth);
    // ========== MARKA ANALİZİ (TOP 10) ==========
    const brandData = {};
    const brandDataLastYear = {};
    thisYearData.forEach(item => {
        const brand = item.brand || 'Bilinmiyor';
        if (!brandData[brand]) brandData[brand] = 0;
        brandData[brand] += parseFloat(item.usd_amount || 0);
    });
    lastYearData.forEach(item => {
        const brand = item.brand || 'Bilinmiyor';
        if (!brandDataLastYear[brand]) brandDataLastYear[brand] = 0;
        brandDataLastYear[brand] += parseFloat(item.usd_amount || 0);
    });
    const sortedBrands = Object.entries(brandData).sort((a, b) => b[1] - a[1]);
    const top10Brands = sortedBrands.slice(0, 10);
    const brandConcentration10 = (top10Brands.reduce((sum, b) => sum + b[1], 0) / totalSalesThisYear * 100);

    // Marka ivme hesaplama
    const brandGrowth = sortedBrands.map(([brand, sales]) => {
        const lastYearSales = brandDataLastYear[brand] || 0;
        const growth = lastYearSales > 0 ? ((sales - lastYearSales) / lastYearSales * 100) : 0;
        return { brand, sales, growth };
    }).sort((a, b) => b.growth - a.growth);
    const fastestGrowingBrand = brandGrowth[0];
    const slowestGrowingBrand = brandGrowth[brandGrowth.length - 1];

    // ========== KATEGORİ ANALİZİ ==========
    const categoryData = {};
    const categoryDataLastYear = {};
    thisYearData.forEach(item => {
        const category = item.category_2 || 'Bilinmiyor';
        if (!categoryData[category]) categoryData[category] = 0;
        categoryData[category] += parseFloat(item.usd_amount || 0);
    });
    lastYearData.forEach(item => {
        const category = item.category_2 || 'Bilinmiyor';
        if (!categoryDataLastYear[category]) categoryDataLastYear[category] = 0;
        categoryDataLastYear[category] += parseFloat(item.usd_amount || 0);
    });
    const sortedCategories = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
    const top10Categories = sortedCategories.slice(0, 10);

    // Kategori ivme hesaplama
    const categoryGrowth = sortedCategories.map(([category, sales]) => {
        const lastYearSales = categoryDataLastYear[category] || 0;
        const growth = lastYearSales > 0 ? ((sales - lastYearSales) / lastYearSales * 100) : 0;
        return { category, sales, growth };
    }).sort((a, b) => b.growth - a.growth);
    const fastestGrowingCategory = categoryGrowth[0];
    const slowestGrowingCategory = categoryGrowth[categoryGrowth.length - 1];
    // Aylık trend - GÜNLÜK ORTALAMA bazında karşılaştırma (ay henüz bitmemiş olabilir)
    const monthlyDataThisYear = {};
    const monthlyDataLastYear = {};
    const monthlyDaysThisYear = {};
    const monthlyDaysLastYear = {};

    thisYearData.forEach(item => {
        const month = item.date.substring(5, 7);
        const day = item.date.substring(8, 10);
        if (!monthlyDataThisYear[month]) {
            monthlyDataThisYear[month] = 0;
            monthlyDaysThisYear[month] = new Set();
        }
        monthlyDataThisYear[month] += parseFloat(item.usd_amount || 0);
        monthlyDaysThisYear[month].add(day);
    });

    lastYearData.forEach(item => {
        const month = item.date.substring(5, 7);
        const day = item.date.substring(8, 10);
        if (!monthlyDataLastYear[month]) {
            monthlyDataLastYear[month] = 0;
            monthlyDaysLastYear[month] = new Set();
        }
        monthlyDataLastYear[month] += parseFloat(item.usd_amount || 0);
        monthlyDaysLastYear[month].add(day);
    });

    const months = Object.keys(monthlyDataThisYear).sort();
    const lastMonth = months[months.length - 1];
    const lastMonthThisYear = monthlyDataThisYear[lastMonth] || 0;
    const lastMonthLastYear = monthlyDataLastYear[lastMonth] || 0;
    const daysThisYear = monthlyDaysThisYear[lastMonth] ? monthlyDaysThisYear[lastMonth].size : 1;
    const daysLastYear = monthlyDaysLastYear[lastMonth] ? monthlyDaysLastYear[lastMonth].size : 1;

    // GÜNLÜK ORTALAMA hesapla (AYLIK bazında)
    const dailyAvgThisMonth = lastMonthThisYear / daysThisYear;
    const dailyAvgLastMonth = lastMonthLastYear / daysLastYear;
    const monthGrowth = dailyAvgLastMonth > 0 ? ((dailyAvgThisMonth - dailyAvgLastMonth) / dailyAvgLastMonth * 100) : 0;

    // Ay tamamlanma durumu
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const isCurrentMonth = (lastMonth === currentMonth);
    const monthCompletionRate = isCurrentMonth ? ((currentDay / 30) * 100).toFixed(0) : 100;
    // ========== MÜŞTERİ ANALİZİ ==========
    const uniqueCustomers = new Set(thisYearData.map(item => item.partner)).size;

    // Sepet ortalaması için fatura sayısı (sağlamlaştırılmış - sadece satış faturaları)
    const invoiceKeysThisYear = thisYearData
        .filter(item => {
            const amt = parseFloat(item.usd_amount || 0);
            if (item.move_type) return item.move_type === 'out_invoice';
            return amt > 0;
        })
        .map(item => item.move_name || item.move_id || `${item.date || ''}-${item.partner || ''}-${item.store || ''}-${item.product || ''}`)
        .filter(Boolean);
    const uniqueInvoices = new Set(invoiceKeysThisYear).size;
    const avgBasketValue = uniqueInvoices > 0 ? totalSalesThisYear / uniqueInvoices : 0;
    const avgCustomerValue = uniqueCustomers > 0 ? totalSalesThisYear / uniqueCustomers : 0;

    // Sepet ortalaması geçen yıl (sağlamlaştırılmış)
    const invoiceKeysLastYear = lastYearData
        .filter(item => {
            const amt = parseFloat(item.usd_amount || 0);
            if (item.move_type) return item.move_type === 'out_invoice';
            return amt > 0;
        })
        .map(item => item.move_name || item.move_id || `${item.date || ''}-${item.partner || ''}-${item.store || ''}-${item.product || ''}`)
        .filter(Boolean);
    const uniqueInvoicesLastYear = new Set(invoiceKeysLastYear).size;
    const avgBasketValueLastYear = uniqueInvoicesLastYear > 0 ? totalSalesLastYear / uniqueInvoicesLastYear : 0;
    const basketGrowth = avgBasketValueLastYear > 0 ? ((avgBasketValue - avgBasketValueLastYear) / avgBasketValueLastYear * 100) : 0;

    const lastMonthName = monthNames[parseInt(lastMonth) - 1];

    // ========== GELİŞMİŞ AI ANALİZ HTML ÇIKTISI ==========
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('📊 Veri güncelleme:', dataUpdateInfo);
        safeConsole.log(`⏱️ ${currentYear}: ${daysPassedThisYear} gün geçti, ${daysRemainingThisYear} gün kaldı`);
        safeConsole.log('📊 Günlük ortalama:', dailyAvgLastYear.toFixed(0), '→', dailyAvgThisYear.toFixed(0), `(${dailyGrowth > 0 ? '+' : ''}${dailyGrowth.toFixed(1)}%)`);
        safeConsole.log('🎯 Yıl sonu tahmini:', projectedYearEndSales.toFixed(0), `(${projectedGrowth > 0 ? '+' : ''}${projectedGrowth.toFixed(1)}%)`);
        safeConsole.log('📈 Basit karşılaştırma (YANILTICI):', yearGrowth.toFixed(1) + '%');
        safeConsole.log('📊 Aylık ivme:', monthGrowth.toFixed(1) + '%');
    }
    const analysis = `
        <!-- Veri Güncelleme Tarihi -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 10px; margin-bottom: 20px; color: white; text-align: center;">
            <strong>📅 Son Veri Güncelleme:</strong> ${dataUpdateInfo} | <strong>🎵 Müzik Enstrüman Sektörü</strong>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div>
                <h4 style="margin-bottom: 15px; color: #38ef7d;">✅ Olumlu Tespitler & Güçlü Yönler</h4>
                <ul style="line-height: 2.2; margin: 0;">
                    ${dailyGrowth > 0 ? `<li><strong>📈 Günlük Ortalama İvme:</strong> %${Math.abs(dailyGrowth).toFixed(1)} artış<br><span style="font-size: 0.9em; color: #666;">💵 ${lastYear}: $${dailyAvgLastYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})}/gün → ${currentYear}: $${dailyAvgThisYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})}/gün<br>🎯 Yıl sonu tahmini: $${projectedYearEndSales.toLocaleString('tr-TR', {minimumFractionDigits: 0})} (%${projectedGrowth.toFixed(1)} büyüme)</span></li>` : ''}
                    ${monthGrowth > 0 ? `<li><strong>📊 ${lastMonthName} Ayı İvme (Günlük Ort.):</strong> %${Math.abs(monthGrowth).toFixed(1)} artış ${isCurrentMonth ? `<span style="color: #667eea;">(⏱️ Ay %${monthCompletionRate} tamamlandı)</span>` : ''}<br><span style="font-size: 0.9em; color: #666;">📅 ${lastYear}: $${dailyAvgLastMonth.toLocaleString('tr-TR', {minimumFractionDigits: 0})}/gün → ${currentYear}: $${dailyAvgThisMonth.toLocaleString('tr-TR', {minimumFractionDigits: 0})}/gün</span></li>` : ''}
                    ${basketGrowth > 0 ? `<li><strong>🛒 Sepet Ortalaması İvmesi:</strong> %${Math.abs(basketGrowth).toFixed(1)} artış<br><span style="font-size: 0.9em; color: #666;">💰 ${lastYear}: $${avgBasketValueLastYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})} → ${currentYear}: $${avgBasketValue.toLocaleString('tr-TR', {minimumFractionDigits: 0})}</span></li>` : ''}
                    ${fastestGrowingStore && fastestGrowingStore.growth > 20 ? `<li><strong>🚀 En Hızlı Büyüyen Mağaza:</strong> ${fastestGrowingStore.store} (%${fastestGrowingStore.growth.toFixed(1)} ivme)<br><span style="font-size: 0.9em; color: #666;">🎯 Best practice kaynak olarak kullanılmalı</span></li>` : ''}
                    ${fastestGrowingBrand && fastestGrowingBrand.growth > 30 ? `<li><strong>🏷️ En Hızlı Büyüyen Marka:</strong> ${fastestGrowingBrand.brand} (%${fastestGrowingBrand.growth.toFixed(1)} ivme)<br><span style="font-size: 0.9em; color: #666;">💡 Bu markaya yatırım artırılmalı</span></li>` : ''}
                    <li><strong>🏷️ Top 10 Marka Performansı:</strong><br>
                        ${top10Brands.map((b, i) => `<span style="font-size: 0.9em;">${i+1}. ${b[0]}: $${b[1].toLocaleString('tr-TR', {minimumFractionDigits: 0})} (%${(b[1]/totalSalesThisYear*100).toFixed(1)})</span>`).join('<br>')}
                        <br><span style="font-size: 0.9em; color: #666;">🎯 Top 10 marka toplam satışın %${brandConcentration10.toFixed(1)}'ini oluşturuyor</span>
                    </li>
                    <li><strong>👥 Müşteri Metrikleri:</strong><br>
                        <span style="font-size: 0.9em;">• ${uniqueCustomers.toLocaleString('tr-TR')} aktif müşteri<br>
                        • Müşteri başı ortalama: $${avgCustomerValue.toLocaleString('tr-TR', {minimumFractionDigits: 0})}<br>
                        • Sepet ortalaması: $${avgBasketValue.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                    </li>
                </ul>
            </div>
            <div>
                <h4 style="margin-bottom: 15px; color: #f5576c;">⚠️ Dikkat Noktaları & İyileştirme Alanları</h4>
                <ul style="line-height: 2.2; margin: 0;">
                    ${yearGrowth < 0 ? `<li><strong>⏱️ ${currentYear} Durum Raporu (${daysPassedThisYear} gün geçti, ${daysRemainingThisYear} gün kaldı):</strong><br><span style="font-size: 0.9em; color: #666;">💵 <strong>${lastYear} Tamamı:</strong> $${totalSalesLastYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})}<br>💵 <strong>${currentYear} Şu An:</strong> $${totalSalesThisYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})} <span style="color: #f5576c;">(-%${Math.abs(yearGrowth).toFixed(1)} - YANILTICI!)</span><br>📊 <strong>Günlük Ortalama:</strong> ${lastYear}: $${dailyAvgLastYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})}/gün → ${currentYear}: $${dailyAvgThisYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})}/gün <span style="${dailyGrowth < 0 ? 'color: #f5576c;' : 'color: #38ef7d;'}">(${dailyGrowth > 0 ? '+' : ''}%${dailyGrowth.toFixed(1)})</span><br>🎯 <strong>Yıl Sonu Tahmini:</strong> $${projectedYearEndSales.toLocaleString('tr-TR', {minimumFractionDigits: 0})} <span style="${projectedGrowth < 0 ? 'color: #f5576c;' : 'color: #38ef7d;'}">(${projectedGrowth > 0 ? '+' : ''}%${projectedGrowth.toFixed(1)} vs ${lastYear})</span><br>🚨 <strong>${lastYear} seviyesini yakalamak için kalan ${daysRemainingThisYear} günde:</strong> $${targetRemainingForLastYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})} ciro gerekli ($${dailyTargetToMatchLastYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})}/gün vs mevcut $${dailyAvgThisYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})}/gün)</span></li>` : ''}
                    ${monthGrowth < 0 ? `<li><strong>⚠️ ${lastMonthName} Ayı Negatif İvme:</strong> %${Math.abs(monthGrowth).toFixed(1)} düşüş ${isCurrentMonth ? `<span style="color: #f5576c;">(⏱️ Ay %${monthCompletionRate} tamamlandı)</span>` : ''}<br><span style="font-size: 0.9em; color: #666;">📅 Günlük ort: $${dailyAvgLastMonth.toLocaleString('tr-TR', {minimumFractionDigits: 0})} → $${dailyAvgThisMonth.toLocaleString('tr-TR', {minimumFractionDigits: 0})}<br>💡 Ay sonu tahmini: $${(dailyAvgThisMonth * 30).toLocaleString('tr-TR', {minimumFractionDigits: 0})} (vs ${lastYear}: $${lastMonthLastYear.toLocaleString('tr-TR', {minimumFractionDigits: 0})})</span></li>` : ''}
                    ${basketGrowth < 0 ? `<li><strong>🛒 Sepet Ortalaması Düşüşü:</strong> %${Math.abs(basketGrowth).toFixed(1)} azalış<br><span style="font-size: 0.9em; color: #666;">⚠️ Cross-selling ve upselling stratejileri güçlendirilmeli</span></li>` : ''}
                    ${slowestGrowingStore && slowestGrowingStore.growth < -10 ? `<li><strong>📊 En Düşük İvmeli Mağaza:</strong> ${slowestGrowingStore.store} (%${slowestGrowingStore.growth.toFixed(1)})<br><span style="font-size: 0.9em; color: #666;">🎯 Acil müdahale ve destek gerekli</span></li>` : ''}
                    ${slowestGrowingBrand && slowestGrowingBrand.growth < -20 ? `<li><strong>🏷️ Düşüş Yaşayan Marka:</strong> ${slowestGrowingBrand.brand} (%${slowestGrowingBrand.growth.toFixed(1)})<br><span style="font-size: 0.9em; color: #666;">💡 Ürün yelpazesi ve fiyatlandırma gözden geçirilmeli</span></li>` : ''}
                    ${weakStore ? `<li><strong>📍 En Düşük Performanslı Mağaza:</strong> ${weakStore[0]} ($${weakStore[1].toLocaleString('tr-TR', {minimumFractionDigits: 0})})<br><span style="font-size: 0.9em; color: #666;">Toplam satışın %${(weakStore[1]/totalSalesThisYear*100).toFixed(2)}'i - Stratejik değerlendirme gerekli</span></li>` : ''}
                    <li><strong>🎯 Marka Çeşitliliği:</strong> Top 10 marka satışların %${brandConcentration10.toFixed(1)}'ini oluşturuyor ${brandConcentration10 > 70 ? '<span style="color: #f5576c;">(⚠️ Risk yüksek!)</span>' : '<span style="color: #38ef7d;">(✓ Dengeli)</span>'}<br><span style="font-size: 0.9em; color: #666;">💡 Portföy çeşitliliği artırılmalı</span></li>
                </ul>
            </div>
        </div>
        
        <hr style="margin: 25px 0; border: none; border-top: 2px solid #667eea;">
        <h4 style="margin-bottom: 15px; color: #667eea;">💡 Stratejik Öneriler & Aksiyon Planı (Müzik Sektörü Özel)</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #38ef7d;">
                <strong>🎯 Kısa Vadeli (1-3 ay)</strong>
                <ul style="margin: 10px 0 0 0; line-height: 2; font-size: 0.95em;">
                    ${monthGrowth < 0 ? `<li><strong>🚨 ACİL:</strong> ${lastMonthName} ayı düşüşü analizi - Stok, kampanya ve sezonsal faktörleri inceleyin</li>` : ''}
                    ${top10Stores.length > 0 ? `<li><strong>🏆 Best Practice:</strong> ${top10Stores[0][0]} mağazasının başarı faktörlerini (vitrin düzeni, müşteri deneyimi, teşhir teknikleri) diğer mağazalara aktarın</li>` : ''}
                    <li><strong>🎸 Ürün Teşhiri:</strong> Gitarlar, klavyeler, davullar için akustik test alanları oluşturun - deneyimsel satış artışı hedefleyin</li>
                    <li><strong>🛒 Sepet Büyütme:</strong> Aksesuar paketleri (teller, kılıflar, tuner) ile cross-selling - hedef: %20 sepet artışı</li>
                    ${top10Brands.length > 0 ? `<li><strong>🏷️ Kampanya:</strong> ${top10Brands[0][0]} için "Yeni Başlayanlar Paketi" kampanyası düzenleyin</li>` : ''}
                    <li><strong>📱 Dijital:</strong> Online mağazada canlı ürün demoları ve sanal deneme özellikleri ekleyin</li>
                </ul>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #667eea;">
                <strong>📈 Orta Vadeli (3-6 ay)</strong>
                <ul style="margin: 10px 0 0 0; line-height: 2; font-size: 0.95em;">
                    <li><strong>👥 Müşteri Segmentasyonu:</strong> Profesyonel müzisyenler, amatörler ve yeni başlayanlar için özel hizmet paketleri</li>
                    <li><strong>🎓 Eğitim Programı:</strong> Mağazalarda ücretsiz enstrüman tanıtım ve deneme workshopları (müşteri bağlılığı %30+ artış)</li>
                    <li><strong>🔧 Servis Geliştirme:</strong> Enstrüman bakım ve onarım servisleri ile satış sonrası gelir kaynağı oluşturun</li>
                    <li><strong>📦 Stok Optimizasyonu:</strong> Sezonsal trendlere göre (okul açılışı, yılbaşı) stok planlaması yapın</li>
                    ${weakStore ? `<li><strong>📊 Mağaza İyileştirme:</strong> ${weakStore[0]} için özel destek programı - ürün karması ve satış ekibi eğitimi</li>` : ''}
                    <li><strong>🌐 Online-Offline Entegrasyon:</strong> Click & Collect, mağazadan deneme sonrası online sipariş sistemi</li>
                </ul>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #fa7268;">
                <strong>🚀 Uzun Vadeli (6-12 ay)</strong>
                <ul style="margin: 10px 0 0 0; line-height: 2; font-size: 0.95em;">
                    <li><strong>🎵 Topluluk Oluşturma:</strong> Müzisyen topluluğu platformu - konserler, jamler, ürün lansmanları düzenleyin</li>
                    <li><strong>🤝 B2B Geliştirme:</strong> Müzik okulları, kurslar ve tiyatrolar ile kurumsal anlaşmalar yapın</li>
                    <li><strong>💼 Kiralama Servisi:</strong> Profesyonel ekipman kiralama servisi başlatın (pasif gelir kaynağı)</li>
                    <li><strong>📊 Data Analytics:</strong> Müşteri satın alma davranışları analizi ile kişiselleştirilmiş öneriler geliştirin</li>
                    <li><strong>🌍 Pazar Genişletme:</strong> Yeni mağaza açılışları için potansiyel şehirleri analiz edin (${currentYear} verilerine göre)</li>
                    <li><strong>🎯 Hedef Belirleme:</strong> ${currentYear + 1} yılı için gerçekçi büyüme hedefleri belirleyin - önerilen: %${yearGrowth > 0 ? (yearGrowth * 1.2).toFixed(0) : '15'} büyüme</li>
                </ul>
            </div>
        </div>
    `;

    const dashAIAnalysis = document.getElementById('dashAIAnalysis');
    if (dashAIAnalysis) {
        dashAIAnalysis.innerHTML = analysis;
    }
}
/**
 * Ana dashboard yükleme fonksiyonu
 * @param {Array} data - Satış verileri dizisi
 */
function loadDashboard(data) {
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('🏠 Dashboard yükleniyor...');
    }

    if (!data || data.length === 0) {
        if (typeof safeConsole !== 'undefined') {
            safeConsole.warn('⚠️ Veri yok, dashboard yüklenemedi');
        }
        return;
    }

    // Genel istatistikler
    const totalSales = data.reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0);
    const totalQty = data.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
    const uniqueCustomers = new Set(data.map(item => item.partner).filter(Boolean)).size;
    const uniqueProducts = new Set(data.map(item => item.product).filter(Boolean)).size;
    const uniqueStores = new Set(data.map(item => item.store).filter(Boolean)).size;
    const uniqueSalespeople = new Set(data.map(item => item.sales_person).filter(Boolean)).size;

    // Günlük Ortalama ve Sepet Ortalaması Hesaplama (GLOBAL MANTIK - DİĞER SEKMELERLE AYNI)
    // Günlük Ortalama = Toplam USD / Benzersiz Tarih Sayısı (tüm zamanlar)
    const uniqueDates = new Set(data.map(item => item.date).filter(Boolean)).size;
    const dailyAverage = uniqueDates > 0 ? totalSales / uniqueDates : 0;

    // Sepet Ortalaması = Toplam USD / Satış Fatura Sayısı (İadeler Hariç) - Sağlamlaştırılmış
    const invoiceKeys = data
        .filter(item => {
            const amt = parseFloat(item.usd_amount || 0);
            if (item.move_type) return item.move_type === 'out_invoice';
            return amt > 0; // move_type yoksa pozitif satışlar
        })
        .map(item => item.move_name || item.move_id || `${item.date || ''}-${item.partner || ''}-${item.store || ''}-${item.product || ''}`)
        .filter(Boolean);
    const uniqueInvoices = new Set(invoiceKeys).size;
    const basketAverage = uniqueInvoices > 0 ? totalSales / uniqueInvoices : 0;

    if (typeof safeConsole !== 'undefined') {
        safeConsole.log('📅 Benzersiz Gün Sayısı (Tüm Zamanlar):', uniqueDates);
        safeConsole.log('💰 Toplam Satış:', totalSales.toLocaleString('tr-TR', {minimumFractionDigits: 2}));
        safeConsole.log('📦 Toplam Kayıt Sayısı:', data.length.toLocaleString('tr-TR'));
        safeConsole.log('🧾 Toplam Fatura Sayısı:', uniqueInvoices.toLocaleString('tr-TR'));
        safeConsole.log('📊 Günlük Ortalama:', dailyAverage.toLocaleString('tr-TR', {minimumFractionDigits: 2}), '(Toplam Satış /', uniqueDates, 'gün)');
        safeConsole.log('🛒 Sepet Ortalaması:', basketAverage.toLocaleString('tr-TR', {minimumFractionDigits: 2}), '(Toplam Satış /', uniqueInvoices, 'fatura)');
    }

    // Özet kartlarını güncelle
    updateDashboardSummaryCards({
        totalSales: totalSales,
        totalQty: totalQty,
        uniqueCustomers: uniqueCustomers,
        uniqueProducts: uniqueProducts,
        uniqueStores: uniqueStores,
        uniqueSalespeople: uniqueSalespeople,
        dailyAverage: dailyAverage,
        basketAverage: basketAverage,
        uniqueInvoices: uniqueInvoices
    });

    // Yıllık karşılaştırma
    renderDashYearlyChart(data);

    // Top performanslar (TÜM ZAMANLAR)
    renderDashTopStoresChart(data);
    renderDashTopSalespeopleChart(data);
    renderDashTopBrandsChart(data);
    renderDashTopCategoriesChart(data);
    renderDashTopCitiesChart(data);
    renderDashTopProductsChart(data);

    // AI Analizi
    performDashboardAIAnalysis(data);
}
// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.loadDashboard = loadDashboard;
    window.changeDashYearlyMetric = changeDashYearlyMetric;
    window.updateDashboardSummaryCards = updateDashboardSummaryCards;
}
