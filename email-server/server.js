const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:8000', 'http://localhost:3000', 'https://toftamars.github.io'],
    credentials: true
}));
app.use(express.json());

// Email transporter konfigürasyonu
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'mail.zuhalmuzik.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'noreply@zuhalmuzik.com',
        pass: process.env.EMAIL_PASS || 'your-password'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// OTP kodları saklama (production'da Redis kullanın)
const otpStorage = new Map();

// 6 haneli OTP kodu oluştur
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Güvenli token oluştur
function generateSecureToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Email template'leri
function createOTPEmailTemplate(otpCode) {
    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 450px; margin: 0 auto; background: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 1.8em; font-weight: 700; letter-spacing: 1px; color: #000000;">🔐 Zuhal Müzik</h1>
                <p style="margin: 8px 0 0 0; font-size: 1em; opacity: 0.95; font-weight: 500; color: #000000;">Dashboard Doğrulama</p>
            </div>
            <div style="padding: 30px; background: white;">
                <h2 style="color: #2d3748; text-align: center; margin-bottom: 20px; font-size: 1.4em; font-weight: 600;">Giriş Kodunuz</h2>
                <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; border: 2px solid #e2e8f0;">
                    <div style="font-size: 2.8em; font-weight: 800; color: #667eea; letter-spacing: 4px; margin: 10px 0; font-family: 'Courier New', monospace;">${otpCode}</div>
                </div>
                <p style="color: #4a5568; text-align: center; margin-bottom: 20px; font-size: 1em; line-height: 1.5;">
                    Bu kod <strong style="color: #667eea;">1 saat</strong> geçerlidir.<br>
                    Dashboard'a giriş yapmak için bu kodu kullanın.
                </p>
                <div style="background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); border: 1px solid #feb2b2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #c53030; font-size: 0.9em; font-weight: 500; text-align: center;">
                        ⚠️ Güvenlik için bu kodu kimseyle paylaşmayın
                    </p>
                </div>
            </div>
            <div style="background: #2d3748; padding: 20px; text-align: center; color: white;">
                <p style="margin: 0; font-size: 0.85em; opacity: 0.9;">
                    <strong>Zuhal Müzik Ekibi</strong><br>
                    <span style="opacity: 0.7;">Bu email otomatik olarak gönderilmiştir</span>
                </p>
            </div>
        </div>
    `;
}

function createLoginLinkTemplate(loginUrl) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 2em;">🚀 Zuhal Müzik Dashboard</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Giriş Linki</p>
            </div>
            <div style="padding: 30px; background: white;">
                <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Dashboard'a Giriş</h2>
                <p style="color: #666; text-align: center; margin-bottom: 30px;">
                    Dashboard'a giriş yapmak için aşağıdaki butona tıklayın:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 1.1em;">
                        🔐 Dashboard'a Giriş Yap
                    </a>
                </div>
                <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; color: #0c5460; font-size: 0.9em;">
                        ℹ️ Bu link 1 saat geçerlidir ve sadece bir kez kullanılabilir.
                    </p>
                </div>
                <p style="color: #999; font-size: 0.9em; text-align: center; margin-top: 30px;">
                    Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
                </p>
            </div>
            <div style="background: #333; padding: 20px; text-align: center; color: white;">
                <p style="margin: 0; font-size: 0.9em;">
                    Zuhal Müzik Ekibi<br>
                    Bu email otomatik olarak gönderilmiştir.
                </p>
            </div>
        </div>
    `;
}

// API Endpoints

// OTP gönderme
app.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email adresi gerekli' });
        }
        
        // Domain kontrolü - sadece zuhalmuzik.com uzantılı emaillere izin ver
        const allowedDomains = ['zuhalmuzik.com'];
        const emailDomain = email.split('@')[1];
        
        if (!allowedDomains.includes(emailDomain)) {
            console.log(`❌ Yetkisiz domain: ${emailDomain}`);
            return res.status(403).json({ 
                error: 'Bu email adresi yetkili değil. Sadece @zuhalmuzik.com uzantılı emailler kullanılabilir.' 
            });
        }
        
        console.log(`✅ Yetkili domain: ${emailDomain}`);
        
        const otpCode = generateOTP();
        const expiresAt = Date.now() + (60 * 60 * 1000); // 1 saat
        
        // OTP'yi sakla
        otpStorage.set(email, {
            code: otpCode,
            expiresAt: expiresAt,
            attempts: 0
        });
        
        // Email gönder
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'Zuhal Müzik <noreply@zuhalmuzik.com>',
            to: email,
            subject: 'Zuhal Müzik Dashboard - Doğrulama Kodu',
            html: createOTPEmailTemplate(otpCode)
        });
        
        console.log(`✅ OTP gönderildi: ${email} - ${otpCode}`);
        
        res.json({ 
            success: true, 
            message: 'Doğrulama kodu emailinize gönderildi',
            // Geliştirme için OTP'yi döndür (production'da kaldırın)
            otp: process.env.NODE_ENV === 'development' ? otpCode : undefined
        });
        
    } catch (error) {
        console.error('❌ OTP gönderme hatası:', error);
        res.status(500).json({ 
            error: 'Email gönderilemedi', 
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// OTP doğrulama
app.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email ve OTP gerekli' });
        }
        
        const storedOTP = otpStorage.get(email);
        
        if (!storedOTP) {
            return res.status(400).json({ error: 'OTP bulunamadı veya süresi dolmuş' });
        }
        
        if (Date.now() > storedOTP.expiresAt) {
            otpStorage.delete(email);
            return res.status(400).json({ error: 'OTP süresi dolmuş' });
        }
        
        if (storedOTP.attempts >= 3) {
            otpStorage.delete(email);
            return res.status(400).json({ error: 'Çok fazla deneme yapıldı' });
        }
        
        if (storedOTP.code !== otp) {
            storedOTP.attempts++;
            return res.status(400).json({ error: 'Geçersiz OTP kodu' });
        }
        
        // Başarılı doğrulama
        otpStorage.delete(email);
        
        console.log(`✅ OTP doğrulandı: ${email}`);
        
        res.json({ 
            success: true, 
            message: 'OTP doğrulandı',
            user: {
                email: email,
                name: email.split('@')[0]
            }
        });
        
    } catch (error) {
        console.error('❌ OTP doğrulama hatası:', error);
        res.status(500).json({ error: 'Doğrulama hatası' });
    }
});

// Magic link gönderme
app.post('/send-login-link', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email adresi gerekli' });
        }
        
        // Domain kontrolü - sadece zuhalmuzik.com uzantılı emaillere izin ver
        const allowedDomains = ['zuhalmuzik.com'];
        const emailDomain = email.split('@')[1];
        
        if (!allowedDomains.includes(emailDomain)) {
            console.log(`❌ Yetkisiz domain: ${emailDomain}`);
            return res.status(403).json({ 
                error: 'Bu email adresi yetkili değil. Sadece @zuhalmuzik.com uzantılı emailler kullanılabilir.' 
            });
        }
        
        console.log(`✅ Yetkili domain: ${emailDomain}`);
        
        const loginToken = generateSecureToken();
        const expiresAt = Date.now() + (60 * 60 * 1000); // 1 saat
        const loginUrl = `${process.env.FRONTEND_URL || 'https://toftamars.github.io/satiss-dashboard'}/?token=${loginToken}`;
        
        // Token'ı sakla
        otpStorage.set(loginToken, {
            email: email,
            expiresAt: expiresAt,
            used: false
        });
        
        // Email gönder
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'Zuhal Müzik <noreply@zuhalmuzik.com>',
            to: email,
            subject: 'Zuhal Müzik Dashboard - Giriş Linki',
            html: createLoginLinkTemplate(loginUrl)
        });
        
        console.log(`✅ Login link gönderildi: ${email}`);
        
        res.json({ 
            success: true, 
            message: 'Giriş linki emailinize gönderildi'
        });
        
    } catch (error) {
        console.error('❌ Login link gönderme hatası:', error);
        res.status(500).json({ error: 'Email gönderilemedi' });
    }
});

// Magic link doğrulama
app.post('/verify-login-link', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Token gerekli' });
        }
        
        const storedToken = otpStorage.get(token);
        
        if (!storedToken) {
            return res.status(400).json({ error: 'Geçersiz token' });
        }
        
        if (Date.now() > storedToken.expiresAt) {
            otpStorage.delete(token);
            return res.status(400).json({ error: 'Token süresi dolmuş' });
        }
        
        if (storedToken.used) {
            otpStorage.delete(token);
            return res.status(400).json({ error: 'Token zaten kullanılmış' });
        }
        
        // Başarılı doğrulama
        storedToken.used = true;
        
        console.log(`✅ Login link doğrulandı: ${storedToken.email}`);
        
        res.json({ 
            success: true, 
            message: 'Giriş başarılı',
            user: {
                email: storedToken.email,
                name: storedToken.email.split('@')[0]
            }
        });
        
    } catch (error) {
        console.error('❌ Login link doğrulama hatası:', error);
        res.status(500).json({ error: 'Doğrulama hatası' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Zuhal Müzik Email Service'
    });
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`🚀 Email servisi çalışıyor: http://localhost:${PORT}`);
    console.log(`📧 Email Host: ${process.env.EMAIL_HOST || 'mail.zuhalmuzik.com'}`);
    console.log(`👤 Email User: ${process.env.EMAIL_USER || 'noreply@zuhalmuzik.com'}`);
});

module.exports = app;
