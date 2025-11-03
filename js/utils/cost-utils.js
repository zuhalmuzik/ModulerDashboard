/**
 * Cost Tracking Utility Functions
 * Handles GPT API cost tracking and monthly reset logic
 * 
 * Dependencies:
 * - safeConsole (config.js)
 * - window.queryCostTracker (global tracker from HTML)
 * - localStorage (browser global)
 */

/**
 * Aylık reset kontrolü yapar (her ayın başında maliyetleri sıfırlar)
 */
function checkMonthlyReset() {
    // queryCostTracker'a erişim - window üzerinden (HTML'de tanımlı)
    const tracker = (typeof window !== 'undefined' && window.queryCostTracker) ? 
                    window.queryCostTracker : null;
    
    if (!tracker) {
        if (typeof console !== 'undefined') {
            console.warn('⚠️ queryCostTracker bulunamadı');
        }
        return;
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (tracker.lastResetDate !== currentMonth) {
        tracker.monthlyQueries = 0;
        tracker.monthlyCost = 0;
        tracker.lastResetDate = currentMonth;
        localStorage.setItem('gpt_monthly_queries', '0');
        localStorage.setItem('gpt_monthly_cost', '0');
        localStorage.setItem('gpt_last_reset', currentMonth);
    }
}

/**
 * GPT API sorgu maliyetini hesaplar ve günceller
 * @param {string} model - GPT model adı (gpt-3.5-turbo, gpt-4-turbo, gpt-4o-mini)
 * @param {number} inputTokens - Input token sayısı
 * @param {number} outputTokens - Output token sayısı
 * @returns {number} Hesaplanan maliyet
 */
function updateQueryCost(model, inputTokens, outputTokens) {
    checkMonthlyReset();
    
    const tracker = (typeof window !== 'undefined' && window.queryCostTracker) ? 
                    window.queryCostTracker : null;
    
    if (!tracker) {
        if (typeof console !== 'undefined') {
            console.warn('⚠️ queryCostTracker bulunamadı');
        }
        return 0;
    }
    
    let cost = 0;
    if (model === 'gpt-3.5-turbo') {
        cost = (inputTokens / 1000 * 0.0005) + (outputTokens / 1000 * 0.0015);
    } else if (model === 'gpt-4-turbo') {
        cost = (inputTokens / 1000 * 0.01) + (outputTokens / 1000 * 0.03);
    } else if (model === 'gpt-4o-mini') {
        cost = (inputTokens / 1000 * 0.00015) + (outputTokens / 1000 * 0.0006);
    }
    
    tracker.totalQueries++;
    tracker.totalCost += cost;
    tracker.monthlyQueries++;
    tracker.monthlyCost += cost;
    
    localStorage.setItem('gpt_total_queries', tracker.totalQueries.toString());
    localStorage.setItem('gpt_total_cost', tracker.totalCost.toFixed(4));
    localStorage.setItem('gpt_monthly_queries', tracker.monthlyQueries.toString());
    localStorage.setItem('gpt_monthly_cost', tracker.monthlyCost.toFixed(4));
    
    if (typeof safeConsole !== 'undefined') {
        safeConsole.log(`💰 GPT Maliyet: $${cost.toFixed(4)} | Aylık Toplam: $${tracker.monthlyCost.toFixed(2)} (${tracker.monthlyQueries} sorgu)`);
    }
    
    return cost;
}

/**
 * Maliyet istatistiklerini debug panel'e gösterir
 */
function showCostStats() {
    checkMonthlyReset();
    
    const tracker = (typeof window !== 'undefined' && window.queryCostTracker) ? 
                    window.queryCostTracker : null;
    
    if (!tracker) {
        if (typeof console !== 'undefined') {
            console.warn('⚠️ queryCostTracker bulunamadı');
        }
        return;
    }
    
    const statsHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 10px; margin: 10px 0;">
            <h4 style="margin: 0 0 10px 0;">💰 GPT Maliyet İstatistikleri</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <strong>Bu Ay:</strong><br>
                    ${tracker.monthlyQueries} sorgu<br>
                    $${tracker.monthlyCost.toFixed(2)} (~${(tracker.monthlyCost * 30).toFixed(0)} TL)
                </div>
                <div>
                    <strong>Toplam:</strong><br>
                    ${tracker.totalQueries} sorgu<br>
                    $${tracker.totalCost.toFixed(2)}
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.9em; opacity: 0.9;">
                📊 Ortalama: $${(tracker.monthlyCost / Math.max(tracker.monthlyQueries, 1)).toFixed(4)}/sorgu
            </div>
        </div>
    `;
    
    // Stats'ı debug panel'e ekle
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel && debugPanel.style.display === 'block') {
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.innerHTML += statsHTML;
        }
    }
}

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.checkMonthlyReset = checkMonthlyReset;
    window.updateQueryCost = updateQueryCost;
    window.showCostStats = showCostStats;
}

