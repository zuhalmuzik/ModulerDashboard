/**
 * Authentication Module
 * Handles Firebase authentication, login, logout, password reset
 * 
 * Dependencies:
 * - Firebase SDK (CDN - firebase-app.js, firebase-auth.js)
 * - safeConsole (config.js - window.safeConsole)
 * - dataLoadProgress (config.js - window.dataLoadProgress)
 * - startRealLoading() (HTML global - window.startRealLoading)
 */

class AuthModule {
    constructor() {
        this.firebaseConfig = null;
        this.auth = null;
        this.app = null;
        this.initialized = false;
        this.eventListenersSetup = false;
    }

    /**
     * Initialize Firebase with config
     * @param {Object} firebaseConfig - Firebase configuration object
     */
    async init(firebaseConfig) {
        try {
            // Firebase SDK import'ları
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { 
                getAuth, 
                signInWithEmailAndPassword, 
                signOut, 
                onAuthStateChanged, 
                sendPasswordResetEmail 
            } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

            this.firebaseConfig = firebaseConfig || this.getDefaultConfig();
            
            // Initialize Firebase
            this.app = initializeApp(this.firebaseConfig);
            this.auth = getAuth(this.app);
            
            // Global olarak erişilebilir yap (geriye uyumluluk için)
            window.firebaseAuth = this.auth;
            window.firebaseSignIn = signInWithEmailAndPassword;
            window.firebaseSignOut = signOut;
            window.firebaseOnAuthStateChanged = onAuthStateChanged;
            window.firebaseSendPasswordResetEmail = sendPasswordResetEmail;
            
            this.initialized = true;
            
            // Event listener'ları kur
            this.setupEventListeners();
            
            // Firebase Auth state listener'ı başlat
            this.initFirebaseAuth();
            
            const safeConsole = window.safeConsole || console;
            safeConsole.log('✅ Firebase Auth modülü başlatıldı');
        } catch (error) {
            console.error('❌ Firebase Auth modülü başlatılamadı:', error);
        }
    }

    /**
     * Get Firebase config from config.js or use default
     */
    getDefaultConfig() {
        // Config.js'den al veya fallback kullan
        if (typeof window !== 'undefined' && window.firebaseConfig) {
            return window.firebaseConfig;
        }
        
        // Fallback config (geliştirme için)
        return {
            apiKey: "AIzaSyD3H_v4Tq5h_30U8sZXYM7wARu9GPg3RDk",
            authDomain: "zuhalrapor.firebaseapp.com",
            projectId: "zuhalrapor",
            storageBucket: "zuhalrapor.firebasestorage.app",
            messagingSenderId: "1070847166914",
            appId: "1:1070847166914:web:b9d05ea13fa3bb5f46ee5b",
            measurementId: "G-HV3MES215N"
        };
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        const loadingScreen = document.getElementById('loadingScreen');
        const mainContainer = document.getElementById('mainContainer');
        
        // Modal'ı göster (CSS class kullan)
        if (modal) {
            modal.classList.add('login-modal--visible');
        }
        
        // Loading screen'i kesinlikle gizle
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Main container'ı kesinlikle gizle
        if (mainContainer) {
            mainContainer.style.display = 'none';
        }
        
        // Body scroll'u engelle
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide login modal
     */
    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('login-modal--visible');
        }
        
        const errorEl = document.getElementById('loginError');
        if (errorEl) {
            errorEl.classList.remove('login-modal__message--visible');
            errorEl.textContent = '';
        }
        
        const successEl = document.getElementById('loginSuccess');
        if (successEl) {
            successEl.classList.remove('login-modal__message--visible');
            successEl.textContent = '';
        }
        
        const emailEl = document.getElementById('loginEmail');
        const passwordEl = document.getElementById('loginPassword');
        if (emailEl) emailEl.value = '';
        if (passwordEl) passwordEl.value = '';
        
        // Body scroll'u geri aç (ama kullanıcı giriş yapmadıysa modal tekrar açılacak)
        document.body.style.overflow = '';
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = document.getElementById('loginError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('login-modal__message--visible');
        }
        
        const successEl = document.getElementById('loginSuccess');
        if (successEl) {
            successEl.classList.remove('login-modal__message--visible');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const successEl = document.getElementById('loginSuccess');
        if (successEl) {
            successEl.textContent = message;
            successEl.classList.add('login-modal__message--visible');
        }
        
        const errorEl = document.getElementById('loginError');
        if (errorEl) {
            errorEl.classList.remove('login-modal__message--visible');
        }
    }

    /**
     * Handle login
     */
    async handleLogin() {
        const emailEl = document.getElementById('loginEmail');
        const passwordEl = document.getElementById('loginPassword');
        
        if (!emailEl || !passwordEl) {
            console.error('❌ Login form elementleri bulunamadı');
            return;
        }
        
        const email = emailEl.value.trim();
        const password = passwordEl.value;
        
        if (!email || !password) {
            this.showError('Lütfen e-posta ve şifre girin.');
            return;
        }
        
        try {
            // Firebase SDK'nın yüklenmesini bekle
            if (!window.firebaseAuth || !window.firebaseSignIn) {
                console.error('❌ Firebase SDK henüz yüklenmedi');
                this.showError('Firebase yükleniyor, lütfen bekleyin...');
                setTimeout(() => this.handleLogin(), 1000);
                return;
            }
            
            // Hata mesajını gizle
            const errorEl = document.getElementById('loginError');
            if (errorEl) {
                errorEl.classList.remove('login-modal__message--visible');
            }
            
            await window.firebaseSignIn(window.firebaseAuth, email, password);
            
            // Login zamanını kaydet (24 saatlik session için)
            localStorage.setItem('lastLoginTime', Date.now().toString());
            localStorage.removeItem('sessionExpired'); // Eğer daha önce expire olmuşsa temizle
            
            this.hideLoginModal();
            
            const safeConsole = window.safeConsole || console;
            safeConsole.log('✅ Giriş başarılı');
        } catch (error) {
            console.error('❌ Giriş hatası:', error);
            
            let errorMessage = 'Giriş başarısız. E-posta ve şifrenizi kontrol edin.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Bu e-posta adresi kayıtlı değil.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Şifre yanlış.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Geçersiz e-posta adresi.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            if (!window.firebaseAuth || !window.firebaseSignOut) {
                console.error('❌ Firebase SDK henüz yüklenmedi');
                return;
            }
            await window.firebaseSignOut(window.firebaseAuth);
            
            const safeConsole = window.safeConsole || console;
            safeConsole.log('✅ Çıkış yapıldı');
        } catch (error) {
            console.error('❌ Çıkış hatası:', error);
            alert('Çıkış yapılırken bir hata oluştu: ' + error.message);
        }
    }

    /**
     * Handle forgot password
     */
    async handleForgotPassword() {
        const emailEl = document.getElementById('loginEmail');
        
        // Email kontrolü
        if (!emailEl || !emailEl.value.trim()) {
            this.showError('Lütfen e-posta adresinizi girin.');
            emailEl?.focus();
            return;
        }
        
        const email = emailEl.value.trim();
        
        try {
            if (!window.firebaseAuth || !window.firebaseSendPasswordResetEmail) {
                console.error('❌ Firebase SDK henüz yüklenmedi');
                this.showError('Firebase yükleniyor, lütfen bekleyin...');
                setTimeout(() => this.handleForgotPassword(), 1000);
                return;
            }
            
            // Hata mesajını gizle
            const errorEl = document.getElementById('loginError');
            if (errorEl) {
                errorEl.classList.remove('login-modal__message--visible');
            }
            
            await window.firebaseSendPasswordResetEmail(window.firebaseAuth, email);
            
            // Başarı mesajı göster
            this.showSuccess(`Şifre sıfırlama linki ${email} adresine gönderildi. Lütfen e-postanızı kontrol edin.`);
            
            const safeConsole = window.safeConsole || console;
            safeConsole.log('✅ Şifre sıfırlama e-postası gönderildi');
        } catch (error) {
            console.error('❌ Şifre sıfırlama hatası:', error);
            
            let errorMessage = 'Şifre sıfırlama e-postası gönderilemedi.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Bu e-posta adresi kayıtlı değil.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Geçersiz e-posta adresi.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        }
    }

    /**
     * Update UI based on auth state
     */
    updateAuthUI(user) {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userName = document.getElementById('currentUserName');
        const mainContainer = document.getElementById('mainContainer');
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (user) {
            // Kullanıcı giriş yapmış
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (userName) {
                userName.textContent = user.email || 'Kullanıcı';
                userName.style.display = 'inline-block';
            }
            
            // Ana içeriği göster
            if (mainContainer) {
                mainContainer.style.display = 'block';
            }
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            
            // Login modal'ı gizle (CSS class kullan)
            const modal = document.getElementById('loginModal');
            if (modal) {
                modal.classList.remove('login-modal--visible');
            }
            
            // Body scroll'u geri aç
            document.body.style.overflow = '';
        } else {
            // Kullanıcı giriş yapmamış
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userName) userName.style.display = 'none';
            
            // TÜM İÇERİĞİ KESİNLİKLE GİZLE
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            
            // Body scroll'u engelle
            document.body.style.overflow = 'hidden';
            
            // Login modal'ı göster
            this.showLoginModal();
        }
    }

    /**
     * Initialize Firebase Auth state listener
     */
    initFirebaseAuth() {
        if (!window.firebaseAuth || !window.firebaseOnAuthStateChanged) {
            // Firebase SDK henüz yüklenmedi, tekrar dene
            setTimeout(() => this.initFirebaseAuth(), 500);
            return;
        }
        
        const safeConsole = window.safeConsole || console;
        safeConsole.log('✅ Firebase Auth listener başlatılıyor...');
        
        // Auth state değişikliklerini dinle
        window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
            safeConsole.log('🔐 Auth state değişti:', user ? user.email : 'Çıkış yapıldı');
            this.updateAuthUI(user);
            
            // Kullanıcı giriş yaptıysa veri yükleme başlat
            if (user) {
                // Biraz bekle (UI güncellensin)
                setTimeout(() => {
                    const dataLoadProgress = window.dataLoadProgress;
                    if (dataLoadProgress && !dataLoadProgress.pageInit) {
                        const startRealLoading = window.startRealLoading;
                        if (startRealLoading) {
                            startRealLoading();
                        }
                    }
                }, 300);
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.eventListenersSetup) {
            return; // Zaten kurulmuş
        }

        // DOMContentLoaded bekleniyor
        const setup = () => {
            // Login button
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => this.showLoginModal());
            }

            // Logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.handleLogout());
            }

            // Login submit button
            const loginSubmitBtn = document.getElementById('loginSubmitBtn');
            if (loginSubmitBtn) {
                loginSubmitBtn.addEventListener('click', () => this.handleLogin());
            }

            // Login cancel button
            const loginCancelBtn = document.getElementById('loginCancelBtn');
            if (loginCancelBtn) {
                loginCancelBtn.addEventListener('click', () => this.hideLoginModal());
            }

            // Forgot password link
            const forgotPasswordLink = document.getElementById('forgotPasswordLink');
            if (forgotPasswordLink) {
                forgotPasswordLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleForgotPassword();
                });
            }

            // Enter tuşu ile login
            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            
            if (emailInput) {
                emailInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        passwordInput?.focus();
                    }
                });
            }
            
            if (passwordInput) {
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleLogin();
                    }
                });
            }

            this.eventListenersSetup = true;
        };

        // DOM hazır mı kontrol et
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }
}

// Global instance oluştur
const authModule = new AuthModule();

// Global olarak erişilebilir yap (geriye uyumluluk için)
window.authModule = authModule;
window.showLoginModal = () => authModule.showLoginModal();
window.hideLoginModal = () => authModule.hideLoginModal();
window.handleLogin = () => authModule.handleLogin();
window.handleLogout = () => authModule.handleLogout();
window.handleForgotPassword = () => authModule.handleForgotPassword();
window.updateAuthUI = (user) => authModule.updateAuthUI(user);
window.initFirebaseAuth = () => authModule.initFirebaseAuth();

