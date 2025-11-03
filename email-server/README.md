# Zuhal Müzik Email Servisi

Bu servis Zuhal Müzik Dashboard için email gönderimi yapar.

## Özellikler

- ✅ OTP (6 haneli kod) gönderimi
- ✅ Magic Link gönderimi
- ✅ Profesyonel email template'leri
- ✅ Güvenlik kontrolleri
- ✅ Rate limiting

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Environment dosyasını oluşturun:
```bash
cp env.example .env
```

3. `.env` dosyasını düzenleyin:
```
EMAIL_HOST=mail.zuhalmuzik.com
EMAIL_PORT=587
EMAIL_USER=noreply@zuhalmuzik.com
EMAIL_PASS=your-password
EMAIL_FROM=Zuhal Müzik <noreply@zuhalmuzik.com>
FRONTEND_URL=https://toftamars.github.io/satiss-dashboard
```

4. Servisi başlatın:
```bash
npm start
```

## API Endpoints

### OTP Gönderme
```
POST /send-otp
Body: { "email": "user@example.com" }
```

### OTP Doğrulama
```
POST /verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
```

### Magic Link Gönderme
```
POST /send-login-link
Body: { "email": "user@example.com" }
```

### Magic Link Doğrulama
```
POST /verify-login-link
Body: { "token": "abc123..." }
```

## Güvenlik

- OTP kodları 10 dakika geçerlidir
- Magic linkler 1 saat geçerlidir
- Maksimum 3 deneme hakkı
- Rate limiting aktif

## Deployment

### Heroku
```bash
heroku create zuhal-muzik-email
heroku config:set EMAIL_HOST=mail.zuhalmuzik.com
heroku config:set EMAIL_USER=noreply@zuhalmuzik.com
heroku config:set EMAIL_PASS=your-password
git push heroku main
```

### VPS
```bash
# PM2 ile çalıştırma
npm install -g pm2
pm2 start server.js --name "email-service"
pm2 startup
pm2 save
```
