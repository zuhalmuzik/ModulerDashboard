/**
 * String Utility Functions
 * Pure string manipulation and matching functions
 */

/**
 * Fuzzy matching - Kelime bazlı arama (bulanık eşleşme)
 * @param {string} query - Aranan metin
 * @param {string} target - Hedef metin
 * @returns {boolean} Eşleşme var mı?
 */
function fuzzyMatch(query, target) {
    const queryWords = query.split(/\s+/);
    const targetLower = target.toLowerCase();
    return queryWords.some(word => {
        if (word.length < 3) return false;
        return targetLower.includes(word) || levenshteinDistance(word, targetLower) < 3;
    });
}

/**
 * Levenshtein Distance (Düzenleme mesafesi) - AI arama için
 * @param {string} a - İlk string
 * @param {string} b - İkinci string
 * @returns {number} Düzenleme mesafesi
 */
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Türkçe karakter normalizasyonu
 * @param {string} str - Normalize edilecek string
 * @returns {string} Normalize edilmiş string
 */
function normalizeTurkish(str) {
    if (!str) return '';
    
    // Genişletilmiş Türkçe karakter mapping'i
    const turkishMap = {
        // Temel Türkçe karakterler
        'ı': 'i', 'İ': 'i', 'I': 'i',
        'ş': 's', 'Ş': 's', 'S': 's',
        'ğ': 'g', 'Ğ': 'g', 'G': 'g',
        'ü': 'u', 'Ü': 'u', 'U': 'u',
        'ö': 'o', 'Ö': 'o', 'O': 'o',
        'ç': 'c', 'Ç': 'c', 'C': 'c',
        
        // Yaygın yazım hataları
        'i': 'i', 'I': 'i', 'İ': 'i',
        's': 's', 'S': 's', 'Ş': 's',
        'g': 'g', 'G': 'g', 'Ğ': 'g',
        'u': 'u', 'U': 'u', 'Ü': 'u',
        'o': 'o', 'O': 'o', 'Ö': 'o',
        'c': 'c', 'C': 'c', 'Ç': 'c',
        
        // Özel durumlar
        'a': 'a', 'A': 'a', 'Â': 'a',
        'e': 'e', 'E': 'e', 'Ê': 'e',
        'b': 'b', 'B': 'b',
        'd': 'd', 'D': 'd',
        'f': 'f', 'F': 'f',
        'h': 'h', 'H': 'h',
        'j': 'j', 'J': 'j',
        'k': 'k', 'K': 'k',
        'l': 'l', 'L': 'l',
        'm': 'm', 'M': 'm',
        'n': 'n', 'N': 'n',
        'p': 'p', 'P': 'p',
        'q': 'q', 'Q': 'q',
        'r': 'r', 'R': 'r',
        't': 't', 'T': 't',
        'v': 'v', 'V': 'v',
        'w': 'w', 'W': 'w',
        'x': 'x', 'X': 'x',
        'y': 'y', 'Y': 'y',
        'z': 'z', 'Z': 'z'
    };
    
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Özel karakterleri kaldır
        .split('')
        .map(char => turkishMap[char] || char)
        .join('')
        .replace(/\s+/g, '') // Boşlukları kaldır
        .replace(/\d+/g, ''); // Sayıları kaldır
}

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.fuzzyMatch = fuzzyMatch;
    window.levenshteinDistance = levenshteinDistance;
    window.normalizeTurkish = normalizeTurkish;
}

