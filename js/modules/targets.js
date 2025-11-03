/**
 * Targets Module
 * Handles all target tracking functionality including store targets, yearly analysis, and trends
 * 
 * Dependencies:
 * - safeConsole (config.js - window.safeConsole)
 * - loadCentralTargets (data-loader-utils.js - window.loadCentralTargets)
 * - allData (window.allData - global data array)
 */

class TargetModule {
    constructor() {
        this.centralTargets = {yearly: {}, monthly: {}};
        this.initialized = false;
    }

    /**
     * Initialize the targets module by loading central targets
     */
    async init() {
        try {
            const safeConsole = window.safeConsole || console;
            
            // Hedefleri yükle
            if (typeof window.loadCentralTargets === 'function') {
                const targets = await window.loadCentralTargets();
                if (targets && typeof targets === 'object') {
                    this.centralTargets = targets;
                    safeConsole.log('✅ Hedef takip modülü başlatıldı');
                } else {
                    safeConsole.warn('⚠️ Hedefler yüklenemedi, varsayılan değerler kullanılacak');
                }
            } else {
                safeConsole.warn('⚠️ loadCentralTargets fonksiyonu bulunamadı');
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('❌ Hedef takip modülü başlatılamadı:', error);
        }
    }

    /**
     * Tüm mağazaların hedeflerini yükle ve göster
     */
    loadAllStoresTargets() {
        const safeConsole = window.safeConsole || console;
        const allData = window.allData || [];
        
        const year = document.getElementById('targetFilterYear')?.value;
        const month = document.getElementById('targetFilterMonth')?.value || '';
        const container = document.getElementById('allStoresTargetsContainer');
        
        if (!container) {
            safeConsole.warn('⚠️ allStoresTargetsContainer bulunamadı');
            return;
        }
        
        safeConsole.log('📊 Tüm mağazalar hedef listesi yükleniyor:', {year, month, monthType: typeof month, monthLength: month.length});
        
        // Tüm mağazaları bul
        const allStores = new Set();
        allData.forEach(item => {
            if (item.store && item.store !== 'Analitik' && !item.store.toLowerCase().includes('eğitim')) {
                allStores.add(item.store);
            }
        });
        
        const storesList = Array.from(allStores).sort();
        
        // Her mağaza için hedef ve gerçekleşme hesapla
        const storesData = storesList.map(storeName => {
            // Mağaza adından [ID] prefix'ini temizle
            const cleanStoreName = storeName.replace(/^\[\d+\]\s*/, '');
            
            // Hedefi al (Esnek eşleştirme ile)
            let target = 0;
            
            if (month) {
                // AYLIK HEDEF - Önce centralTargets, sonra localStorage
                if (this.centralTargets.monthly && this.centralTargets.monthly[year]) {
                    const targetKey = this._findTargetKey(this.centralTargets.monthly[year], cleanStoreName);
                    if (targetKey && this.centralTargets.monthly[year][targetKey] && this.centralTargets.monthly[year][targetKey][month]) {
                        target = this.centralTargets.monthly[year][targetKey][month];
                    }
                }
                
                if (target === 0) {
                    const localTargets = JSON.parse(localStorage.getItem('monthlyTargets') || '{}');
                    if (localTargets[year]) {
                        const targetKey = this._findTargetKey(localTargets[year], cleanStoreName);
                        if (targetKey && localTargets[year][targetKey][month]) {
                            target = localTargets[year][targetKey][month];
                        }
                    }
                }
            } else {
                // YILLIK HEDEF - Önce centralTargets, sonra localStorage
                if (this.centralTargets.yearly && this.centralTargets.yearly[year]) {
                    const targetKey = this._findTargetKey(this.centralTargets.yearly[year], cleanStoreName);
                    if (targetKey) {
                        target = this.centralTargets.yearly[year][targetKey];
                    }
                }
                
                if (target === 0) {
                    const localTargets = JSON.parse(localStorage.getItem('yearlyTargets') || '{}');
                    if (localTargets[year]) {
                        const targetKey = this._findTargetKey(localTargets[year], cleanStoreName);
                        if (targetKey) {
                            target = localTargets[year][targetKey];
                        }
                    }
                }
            }
            
            // Gerçekleşmeyi hesapla
            const storeData = allData.filter(item => {
                if (item.store !== storeName) return false;
                if (!item.date) return false;
                
                if (month) {
                    return item.date.startsWith(`${year}-${month}`);
                } else {
                    return item.date.startsWith(year);
                }
            });
            
            const achieved = storeData.reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0);
            const percentage = target > 0 ? (achieved / target * 100) : 0;
            const remaining = target - achieved;
            
            // Kalan gün hesapla
            const today = new Date();
            let daysLeft = 0;
            
            if (month) {
                const lastDay = new Date(year, parseInt(month), 0);
                daysLeft = Math.max(0, Math.ceil((lastDay - today) / (1000 * 60 * 60 * 24)));
            } else {
                const lastDay = new Date(year, 11, 31);
                daysLeft = Math.max(0, Math.ceil((lastDay - today) / (1000 * 60 * 60 * 24)));
            }
            
            const dailyRequired = daysLeft > 0 ? remaining / daysLeft : 0;
            
            return {
                name: storeName,
                target,
                achieved,
                percentage,
                remaining,
                daysLeft,
                dailyRequired
            };
        });
        
        // Hedefsiz mağazaları ayır
        const storesWithTarget = storesData.filter(store => store.target > 0);
        const storesWithoutTarget = storesData.filter(store => store.target === 0);
        
        // Hedefli mağazaları yüzdeye göre sırala
        storesWithTarget.sort((a, b) => b.percentage - a.percentage);
        
        // Hedefsiz mağazaları alfabetik sırala
        storesWithoutTarget.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        
        // Önce hedefli, sonra hedefsiz mağazalar
        const sortedStoresData = [...storesWithTarget, ...storesWithoutTarget];
        
        safeConsole.log(`📊 Toplam ${storesData.length} mağaza, ${storesWithTarget.length} hedefli, ${storesWithoutTarget.length} hedefsiz`);
        
        // HTML oluştur
        let html = '<div style="margin-bottom: 20px; text-align: center;">';
        html += '<h3 style="margin: 0; font-size: 1.5em;">';
        html += (month ? year + ' - ' + ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][parseInt(month) - 1] + ' Dönemi' : year + ' Yılı') + ' Mağaza Hedef Durumları';
        html += '</h3>';
        html += '<p style="color: #6c757d; margin-top: 5px;">Toplam ' + sortedStoresData.length + ' mağaza</p>';
        html += '</div>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">';
        
        sortedStoresData.forEach(store => {
            // Hedefsiz mağazalar için özel görünüm
            if (store.target === 0) {
                html += '<div class="storeCard" style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); color: white; opacity: 0.7;">';
                html += '<h3 style="margin: 0 0 15px 0; font-size: 1.5em; color: white;">' + store.name + '</h3>';
                html += '<div style="text-align: center; padding: 40px 0;">';
                html += '<div style="font-size: 3em; margin-bottom: 10px;">📊</div>';
                html += '<div style="font-size: 1.1em; opacity: 0.9; margin-bottom: 10px;">Hedef Tanımlanmamış</div>';
                html += '<div style="font-size: 1.3em; font-weight: 600; margin-top: 15px;">';
                html += 'Gerçekleşme: $' + store.achieved.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                html += '</div></div></div>';
                return;
            }
            
            const bgColor = this._getPerformanceColor(store.percentage);
            const textColor = 'white';
            
            // İçerik belirleme
            let contentHtml = '';
            
            if (store.percentage >= 130) {
                contentHtml = this._generateContentForAbove130(store);
            } else if (store.percentage >= 100) {
                contentHtml = this._generateContentForAbove100(store, month);
            } else {
                contentHtml = this._generateContentForBelow100(store, month);
            }
            
            html += '<div style="background: ' + bgColor + '; color: ' + textColor + '; padding: 25px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">';
            html += '<h3 style="margin: 0 0 20px 0; font-size: 1.3em; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">🏪 ' + store.name + '</h3>';
            html += contentHtml;
            html += '</div>';
        });
        
        html += '</div>';
        
        if (sortedStoresData.length === 0) {
            html = `
                <div style="text-align: center; padding: 60px; background: #f8f9fa; border-radius: 15px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">📊</div>
                    <h3 style="color: #6c757d; margin-bottom: 10px;">Hedef Bulunamadı</h3>
                    <p style="color: #adb5bd;">Seçili dönem için hiçbir mağazaya hedef tanımlanmamış</p>
                </div>
            `;
        }
        
        try {
            container.innerHTML = html;
            safeConsole.log(`✅ HTML container'a yazıldı!`);
        } catch (error) {
            console.error(`❌ HTML yazma hatası:`, error);
            safeConsole.log(`❌ Hatalı HTML:`, html.substring(0, 500));
        }
        
        // Yıllık Hedef Analizi alanını ekle
        this.renderYearlyTargetAnalysis();
    }

    /**
     * Yıllık Hedef Analizi ve Gelecek Potansiyel alanını render et
     */
    renderYearlyTargetAnalysis() {
        const container = document.getElementById('targetsTab');
        if (!container) return;
        
        // Eski analiz alanını kaldır
        const oldAnalysis = container.querySelector('#yearlyTargetAnalysis');
        if (oldAnalysis) {
            oldAnalysis.remove();
        }
        
        // Yeni analiz alanını ekle
        const analysisDiv = document.createElement('div');
        analysisDiv.id = 'yearlyTargetAnalysis';
        analysisDiv.style.cssText = 'margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);';
        analysisDiv.innerHTML = `
            <h2 style="color: white; text-align: center; margin-bottom: 30px; font-size: 2em;">📊 Yıllık Hedef Analizi ve Gelecek Potansiyel</h2>
            <div id="yearlyAnalysisContent" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">
                <!-- Analiz içeriği buraya yüklenecek -->
            </div>
        `;
        
        container.appendChild(analysisDiv);
        
        // Analizi çalıştır
        this.performYearlyTargetAnalysis();
    }

    /**
     * Yıllık hedef analizi yap ve göster
     */
    performYearlyTargetAnalysis() {
        const safeConsole = window.safeConsole || console;
        const allData = window.allData || [];
        
        safeConsole.log('📊 Yıllık hedef analizi başlatılıyor...');
        
        // Veri kontrolü
        if (!allData || allData.length === 0) {
            safeConsole.log('⚠️ Veri henüz yüklenmedi, analiz atlanıyor');
            return;
        }
        
        // Sadece Hedef Takip sekmesinde çalış
        const targetsTab = document.getElementById('targetsTab');
        if (!targetsTab || !targetsTab.classList.contains('active')) {
            safeConsole.log('⚠️ Hedef Takip sekmesi aktif değil, analiz atlanıyor');
            return;
        }
        
        const container = document.getElementById('yearlyAnalysisContent');
        if (!container) {
            safeConsole.log('⚠️ yearlyAnalysisContent elementi bulunamadı, önce renderYearlyTargetAnalysis çağrılmalı');
            return;
        }
        
        // Mevcut yıl
        const currentYear = new Date().getFullYear();
        
        // Yıl tamamlanma oranları
        const yearProgress2023 = this._getYearProgress(2023);
        const yearProgress2024 = this._getYearProgress(2024);
        const yearProgress2025 = this._getYearProgress(2025);
        
        // Yıllık verileri topla
        const yearlyData = {};
        const years = ['2023', '2024', '2025'];
        
        years.forEach(year => {
            yearlyData[year] = allData.filter(item => item.date && item.date.startsWith(year));
        });
        
        // Mağaza bazlı analiz
        const storeAnalysis = {};
        
        // Tüm mağazaları topla
        const allStores = new Set();
        Object.values(yearlyData).forEach(yearData => {
            yearData.forEach(item => {
                if (item.store) allStores.add(item.store);
            });
        });
        
        // Her mağaza için analiz yap
        allStores.forEach(store => {
            const storeData = {
                name: store,
                years: {},
                trends: {},
                recommendations: []
            };
            
            // Her yıl için mağaza verilerini topla
            years.forEach(year => {
                const yearStoreData = yearlyData[year].filter(item => item.store === store);
                const totalSales = yearStoreData.reduce((sum, item) => sum + parseFloat(item.usd_amount || 0), 0);
                const totalQty = yearStoreData.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
                const invoiceCount = new Set(yearStoreData.filter(item => item.move_type === 'out_invoice').map(item => item.move_name)).size;
                
                storeData.years[year] = {
                    sales: totalSales,
                    qty: totalQty,
                    invoiceCount: invoiceCount,
                    recordCount: yearStoreData.length
                };
            });
            
            // Trend analizi
            const sales2023 = storeData.years['2023']?.sales || 0;
            const sales2024 = storeData.years['2024']?.sales || 0;
            const sales2025 = storeData.years['2025']?.sales || 0;
            
            // Trend hesaplama
            storeData.trends['2023-2024'] = this._calculateTrend(2023, 2024, sales2023, sales2024, yearProgress2023, yearProgress2024);
            storeData.trends['2024-2025'] = this._calculateTrend(2024, 2025, sales2024, sales2025, yearProgress2024, yearProgress2025);
            storeData.trends['2023-2025'] = this._calculateTrend(2023, 2025, sales2023, sales2025, yearProgress2023, yearProgress2025);
            
            // Öneriler oluştur
            const nextYear = currentYear + 1;
            const currentYearSales = storeData.years[currentYear.toString()]?.sales || 0;
            const projectedCurrentYear = yearProgress2025 < 1 && yearProgress2025 > 0 ? 
                (storeData.years['2025']?.sales || 0) / yearProgress2025 : 
                currentYearSales;
            
            const recommendation = this._generateRecommendation(storeData.trends, nextYear, currentYear, projectedCurrentYear);
            storeData.recommendations.push(recommendation);
            
            storeAnalysis[store] = storeData;
        });
        
        // HTML oluştur
        let html = '';
        
        Object.values(storeAnalysis).forEach(store => {
            const bgColor = store.recommendations[0]?.type === 'success' ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' :
                           store.recommendations[0]?.type === 'warning' ? 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)' :
                           store.recommendations[0]?.type === 'danger' ? 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)' :
                           'linear-gradient(135deg, #6c757d 0%, #495057 100%)';
            
            html += `
                <div style="background: ${bgColor}; color: white; padding: 25px; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.2);">
                    <h3 style="margin: 0 0 20px 0; font-size: 1.4em; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">
                        🏪 ${store.name}
                    </h3>
                    
                    <!-- Yıllık Veriler -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                        ${['2023', '2024', '2025'].map(year => {
                            const yearData = store.years[year];
                            const isCurrentYear = year === currentYear.toString();
                            const currentYearProgress = this._getYearProgress(parseInt(year));
                            const isProjected = isCurrentYear && currentYearProgress < 1 && currentYearProgress > 0;
                            const displayValue = isProjected ? 
                                (yearData?.sales || 0) / currentYearProgress : 
                                (yearData?.sales || 0);
                            
                            return `
                                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 0.9em; opacity: 0.8;">
                                        ${year}${isProjected ? ' (Proj.)' : ''}
                                    </div>
                                    <div style="font-size: 1.2em; font-weight: bold;">
                                        $${displayValue.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <!-- Trend Göstergeleri -->
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                        ${[
                            { key: '2023-2024', label: '2023→2024' },
                            { key: '2024-2025', label: '2024→2025' }
                        ].map(trend => {
                            const trendData = store.trends[trend.key];
                            return `
                                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                                    <div style="font-size: 0.9em; opacity: 0.8; margin-bottom: 5px;">
                                        ${trend.label}${trendData?.isProjected ? ' (Proj.)' : ''}
                                    </div>
                                    <div style="font-size: 1.1em; font-weight: bold;">
                                        ${trendData ? 
                                            (trendData.type === 'positive' ? '📈 +' : '📉 ') + 
                                            trendData.growth.toFixed(1) + '%' : 
                                            'N/A'}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <!-- Öneriler -->
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                        <div style="font-size: 0.9em; opacity: 0.8; margin-bottom: 10px;">💡 Analiz ve Öneri</div>
                        <div style="font-size: 1em; font-weight: 500;">
                            ${store.recommendations[0]?.title || 'Bilgi yok'}
                        </div>
                        <div style="font-size: 0.9em; opacity: 0.9; margin-top: 5px;">
                            ${store.recommendations[0]?.description || 'Analiz yapılamadı'}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        safeConsole.log('✅ Yıllık hedef analizi tamamlandı');
    }

    // ========== PRIVATE HELPER METHODS ==========

    /**
     * Hedef anahtarı bul (tam eşleşme veya kısmi eşleşme)
     * @private
     */
    _findTargetKey(targetObj, storeName) {
        if (!targetObj) return null;
        
        // Tam eşleşme
        if (targetObj[storeName]) return storeName;
        
        // Kısmi eşleşme (case-insensitive)
        const storeNameLower = storeName.toLowerCase();
        for (const key of Object.keys(targetObj)) {
            const keyLower = key.toLowerCase();
            if (keyLower.includes(storeNameLower) || storeNameLower.includes(keyLower)) {
                return key;
            }
        }
        return null;
    }

    /**
     * Performans rengini belirle
     * @private
     */
    _getPerformanceColor(percentage) {
        if (percentage >= 130) return '#10b981'; // Yeşil - Parlak
        if (percentage >= 100) return '#22c55e'; // Yeşil
        if (percentage >= 85) return '#f59e0b'; // Turuncu
        return '#ef4444'; // Kırmızı
    }

    /**
     * Yıl tamamlanma oranını hesapla
     * @private
     */
    _getYearProgress(year) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        if (currentYear > year) {
            return 1; // Geçmiş yıl - tamamlandı
        } else if (currentYear === year) {
            // Mevcut yıl - tamamlanma oranını hesapla
            const daysInYear = 365;
            const daysPassed = Math.floor((currentDate - new Date(year, 0, 1)) / (1000 * 60 * 60 * 24));
            return daysPassed / daysInYear;
        } else {
            return 0; // Gelecek yıl - henüz başlamadı
        }
    }

    /**
     * Trend hesapla
     * @private
     */
    _calculateTrend(fromYear, toYear, fromSales, toSales, fromProgress, toProgress) {
        if (fromSales <= 0) return null;
        
        let actualToSales = toSales;
        let isProjected = false;
        
        // Eğer hedef yıl tamamlanmamışsa projeksiyon yap
        if (toProgress < 1 && toProgress > 0) {
            actualToSales = toSales / toProgress;
            isProjected = true;
        }
        
        const growth = ((actualToSales - fromSales) / fromSales) * 100;
        
        return {
            growth: growth,
            type: growth > 0 ? 'positive' : 'negative',
            isProjected: isProjected,
            yearProgress: toProgress,
            projectedSales: isProjected ? actualToSales : toSales
        };
    }

    /**
     * Öneri oluştur
     * @private
     */
    _generateRecommendation(trends, nextYear, currentYear, projectedCurrentYear) {
        const trend2023_2024 = trends['2023-2024'];
        const trend2024_2025 = trends['2024-2025'];
        
        if (trend2023_2024?.type === 'positive' && trend2024_2025?.type === 'positive') {
            return {
                type: 'success',
                title: '🚀 Sürekli Büyüme',
                description: `Mağaza 2 yıldır sürekli büyüyor. ${nextYear} hedefi: $${(projectedCurrentYear * 1.15).toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`
            };
        } else if (trend2023_2024?.type === 'negative' && trend2024_2025?.type === 'positive') {
            return {
                type: 'warning',
                title: '📈 Toparlanma',
                description: `2024'te düşüş yaşadı ama ${currentYear}'te toparlandı. ${nextYear} hedefi: $${(projectedCurrentYear * 1.10).toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`
            };
        } else if (trend2023_2024?.type === 'positive' && trend2024_2025?.type === 'negative') {
            return {
                type: 'danger',
                title: '⚠️ Dikkat Gerekli',
                description: `2024'te büyüdü ama ${currentYear}'te düştü. ${nextYear} hedefi: $${(projectedCurrentYear * 1.05).toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`
            };
        } else {
            return {
                type: 'info',
                title: '📊 Stabil Durum',
                description: `Mağaza stabil performans gösteriyor. ${nextYear} hedefi: $${(projectedCurrentYear * 1.08).toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`
            };
        }
    }

    /**
     * %130 üzeri için içerik oluştur
     * @private
     */
    _generateContentForAbove130(store) {
        let contentHtml = '<div style="text-align: center; margin-bottom: 20px;">';
        contentHtml += '<div style="font-size: 3em; font-weight: bold; margin-bottom: 5px;">' + store.percentage.toFixed(1) + '%</div>';
        contentHtml += '<div style="font-size: 0.9em; opacity: 0.9;">Gerçekleşme</div>';
        contentHtml += '</div>';
        contentHtml += '<div style="text-align: center; font-size: 1.8em; margin: 20px 0;">🏆 Tüm Hedefler Tamamlandı!</div>';
        contentHtml += '<div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 15px;">';
        contentHtml += '<div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 5px;">📊 Gerçekleşen</div>';
        contentHtml += '<div style="font-size: 1.5em; font-weight: bold;">$' + store.achieved.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</div>';
        contentHtml += '</div>';
        contentHtml += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; font-size: 0.9em;">';
        contentHtml += '<div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px;">';
        contentHtml += '<div style="opacity: 0.9; margin-bottom: 3px;">🎯 %100 Hedef</div>';
        contentHtml += '<div style="font-weight: bold;">$' + store.target.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</div>';
        contentHtml += '</div>';
        contentHtml += '<div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px;">';
        contentHtml += '<div style="opacity: 0.9; margin-bottom: 3px;">🏆 %130 Hedef</div>';
        contentHtml += '<div style="font-weight: bold;">$' + (store.target * 1.3).toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</div>';
        contentHtml += '</div></div>';
        return contentHtml;
    }

    /**
     * %100-130 arası için içerik oluştur
     * @private
     */
    _generateContentForAbove100(store, month) {
        let contentHtml = '<div style="text-align: center; margin-bottom: 20px;">';
        contentHtml += '<div style="font-size: 3em; font-weight: bold; margin-bottom: 5px;">' + store.percentage.toFixed(1) + '%</div>';
        contentHtml += '<div style="font-size: 0.9em; opacity: 0.9;">Gerçekleşme</div>';
        contentHtml += '</div>';
        contentHtml += '<div style="text-align: center; font-size: 1.5em; margin: 15px 0; font-weight: bold;">✅ Hedef Gerçekleşti!</div>';
        
        if (month) {
            const remaining130 = Math.max(0, (store.target * 1.3) - store.achieved);
            const dailyRequired130 = store.daysLeft > 0 ? remaining130 / store.daysLeft : 0;
            
            contentHtml += '<div style="font-size: 0.95em; opacity: 0.95; margin-top: 15px; padding: 15px; background: rgba(255,255,255,0.15); border-radius: 10px;">';
            contentHtml += '<div style="margin-bottom: 8px;">🎯 <strong>%130 Hedefi için:</strong></div>';
            contentHtml += '<div style="margin-bottom: 5px;">📊 Gerçekleşen: <strong>$' + store.achieved.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</strong></div>';
            contentHtml += '<div style="margin-bottom: 5px;">📈 Kalan: <strong>$' + remaining130.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</strong></div>';
            contentHtml += '<div style="margin-bottom: 5px;">📅 Kalan Gün: <strong>' + store.daysLeft + '</strong></div>';
            contentHtml += '<div>💰 Günlük Gerekli: <strong>$' + dailyRequired130.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</strong></div>';
            contentHtml += '</div>';
            
            contentHtml += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">';
            contentHtml += '<div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 10px;">';
            contentHtml += '<div style="font-size: 0.85em; opacity: 0.9; margin-bottom: 5px;">🎯 %100 Hedef</div>';
            contentHtml += '<div style="font-size: 1.1em; font-weight: bold;">$' + store.target.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</div>';
            contentHtml += '</div>';
            contentHtml += '<div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 10px;">';
            contentHtml += '<div style="font-size: 0.85em; opacity: 0.9; margin-bottom: 5px;">🏆 %130 Hedef</div>';
            contentHtml += '<div style="font-size: 1.1em; font-weight: bold;">$' + (store.target * 1.3).toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</div>';
            contentHtml += '</div></div>';
        } else {
            contentHtml += '<div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 15px; text-align: center;">';
            contentHtml += '<div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 5px;">🎯 %100 Hedef</div>';
            contentHtml += '<div style="font-size: 1.5em; font-weight: bold;">$' + store.target.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</div>';
            contentHtml += '</div>';
        }
        
        return contentHtml;
    }

    /**
     * %100 altı için içerik oluştur
     * @private
     */
    _generateContentForBelow100(store, month) {
        let contentHtml = '<div style="text-align: center; margin-bottom: 20px;">';
        contentHtml += '<div style="font-size: 3em; font-weight: bold; margin-bottom: 5px;">' + store.percentage.toFixed(1) + '%</div>';
        contentHtml += '<div style="font-size: 0.9em; opacity: 0.9;">Gerçekleşme</div>';
        contentHtml += '</div>';
        
        const remaining100 = Math.max(0, store.target - store.achieved);
        const dailyRequired100 = store.daysLeft > 0 ? remaining100 / store.daysLeft : 0;
        
        contentHtml += '<div style="font-size: 0.95em; opacity: 0.95; margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.15); border-radius: 10px;">';
        contentHtml += '<div style="margin-bottom: 8px;">🎯 <strong>%100 Hedefi için:</strong></div>';
        contentHtml += '<div style="margin-bottom: 5px;">📊 Gerçekleşen: <strong>$' + store.achieved.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</strong></div>';
        contentHtml += '<div style="margin-bottom: 5px;">📈 Kalan: <strong>$' + remaining100.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</strong></div>';
        contentHtml += '<div style="margin-bottom: 5px;">📅 Kalan Gün: <strong>' + store.daysLeft + '</strong></div>';
        contentHtml += '<div>💰 Günlük Gerekli: <strong>$' + dailyRequired100.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</strong></div>';
        contentHtml += '</div>';
        
        contentHtml += '<div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-bottom: 15px; text-align: left;">';
        contentHtml += '<div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 5px;">📊 Gerçekleşen</div>';
        contentHtml += '<div style="font-size: 1.6em; font-weight: bold;">$' + store.achieved.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</div>';
        contentHtml += '</div>';
        
        if (month) {
            contentHtml += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
            contentHtml += '<div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 10px;">';
            contentHtml += '<div style="font-size: 0.85em; opacity: 0.9; margin-bottom: 5px;">🎯 %100 Hedef</div>';
            contentHtml += '<div style="font-size: 1.1em; font-weight: bold;">$' + store.target.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</div>';
            contentHtml += '</div>';
            contentHtml += '<div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 10px;">';
            contentHtml += '<div style="font-size: 0.85em; opacity: 0.9; margin-bottom: 5px;">🏆 %130 Hedef</div>';
            contentHtml += '<div style="font-size: 1.1em; font-weight: bold;">$' + (store.target * 1.3).toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</div>';
            contentHtml += '</div></div>';
        } else {
            contentHtml += '<div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; text-align: center;">';
            contentHtml += '<div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 5px;">🎯 %100 Hedef</div>';
            contentHtml += '<div style="font-size: 1.5em; font-weight: bold;">$' + store.target.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + '</div>';
            contentHtml += '</div>';
        }
        
        return contentHtml;
    }
}

// Global instance oluştur
const targetsModule = new TargetModule();

// Geriye dönük uyumluluk için window objesine export et
if (typeof window !== 'undefined') {
    window.targetsModule = targetsModule;
    window.loadAllStoresTargets = () => targetsModule.loadAllStoresTargets();
    window.performYearlyTargetAnalysis = () => targetsModule.performYearlyTargetAnalysis();
}
