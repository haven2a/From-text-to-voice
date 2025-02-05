require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد الاتصال بـ Supabase
const supabase = createClient('https://your-project-url.supabase.co', 'your-anon-key');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تقديم الملفات الثابتة من المجلد 'public'
app.use(express.static(path.join(__dirname, 'public')));

// تعديل سياسة Content Security Policy للسماح بتحميل الخطوط من Google Fonts
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com;"
  );
  next();
});

// إعداد خدمة البريد الإلكتروني باستخدام Nodemailer (باستخدام Gmail كمثال)
console.log("📧 إعداد خدمة البريد الإلكتروني...");
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
console.log("✅ تم إعداد خدمة البريد الإلكتروني!");

// المسار الرئيسي: تقديم ملف index.html من المجلد 'public'
app.get('/', (req, res) => {
  console.log("وصلت إلى الصفحة الرئيسية");
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تسجيل المستخدم عبر نقطة النهاية /subscribe
app.post('/subscribe', async (req, res) => {
  console.log("📩 استلام طلب تسجيل:", req.body);
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    console.log("⚠️ جميع الحقول مطلوبة!");
    return res.status(400).json({ message: '⚠️ جميع الحقول مطلوبة!' });
  }

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    console.log("⚠️ البريد الإلكتروني غير صالح!");
    return res.status(400).json({ message: '⚠️ البريد الإلكتروني غير صحيح.' });
  }

  try {
    console.log("🔑 تسجيل المستخدم باستخدام Supabase...");
    // تسجيل المستخدم باستخدام Supabase Authentication
    const { user, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.log("⚠️ خطأ في التسجيل:", error.message);
      return res.status(400).json({ message: `⚠️ ${error.message}` });
    }

    console.log("✅ تم التسجيل بنجاح!");
    
    // إرسال بريد إلكتروني للمستخدم عند نجاح التسجيل
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'تم التسجيل بنجاح!',
      text: `مرحبًا ${name}،\n\nلقد تم تسجيلك بنجاح في التطبيق. شكرًا لاستخدامك خدمتنا!`
    };

    // إرسال البريد الإلكتروني
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("⚠️ فشل إرسال البريد الإلكتروني:", error);
      } else {
        console.log("✅ تم إرسال البريد الإلكتروني بنجاح:", info.response);
      }
    });

    res.status(200).json({ message: '✅ تم التسجيل بنجاح!' });
  } catch (err) {
    console.log("⚠️ حدث خطأ غير متوقع:", err.message);
    res.status(500).json({ message: '⚠️ حدث خطأ في الخادم!' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
});
