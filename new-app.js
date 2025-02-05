require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// إعداد الاتصال بـ Supabase باستخدام المتغيرات من ملف .env
const supabase = createClient(
  process.env.SUPABASE_URL,  // من ملف .env
  process.env.SUPABASE_KEY   // من ملف .env
);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إضافة رؤوس Content Security Policy للسماح بتحميل الأنماط والخطوط من Google Fonts
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
    user: process.env.EMAIL_USER,   // البريد الإلكتروني من ملف .env
    pass: process.env.EMAIL_PASS    // كلمة مرور البريد من ملف .env
  }
});
console.log("✅ تم إعداد خدمة البريد الإلكتروني!");

// المسار الرئيسي: تأكد من وجود ملف index.html في نفس المجلد
app.get('/', (req, res) => {
  console.log("وصلت إلى الصفحة الرئيسية");
  res.sendFile(path.join(__dirname, 'index.html'));
});

// تسجيل المستخدم عبر نقطة النهاية /api/subscribe
app.post('/api/subscribe', async (req, res) => {
  console.log("📩 استلام طلب تسجيل:", req.body);
  const { name, email, password } = req.body;

  // التحقق من وجود جميع الحقول المطلوبة
  if (!name || !email || !password) {
    console.log("⚠️ جميع الحقول مطلوبة!");
    return res.status(400).json({ message: '⚠️ جميع الحقول مطلوبة!' });
  }

  // التحقق من صحة البريد الإلكتروني باستخدام تعبير منتظم
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    console.log("⚠️ البريد الإلكتروني غير صالح!");
    return res.status(400).json({ message: '⚠️ البريد الإلكتروني غير صحيح.' });
  }

  try {
    console.log("🔍 البحث عن البريد الإلكتروني في Supabase...");
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) {
      throw error;
    }

    if (data.length > 0) {
      console.log("⚠️ البريد الإلكتروني مسجل مسبقًا!");
      return res.status(400).json({ message: '⚠️ البريد الإلكتروني مسجل مسبقًا.' });
    }

    console.log("🔑 تشفير كلمة المرور...");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("📦 حفظ المستخدم في Supabase...");
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          registered_at: new Date()
        }
      ]);

    if (insertError) {
      throw insertError;
    }

    console.log("✅ تم حفظ المستخدم بنجاح!");

    console.log("📨 إرسال بريد التأكيد...");
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'تم التسجيل بنجاح',
      text: `مرحبًا ${name}،\n\nلقد تم تسجيلك بنجاح في النظام. شكرًا لاستخدامك خدمتنا!`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ خطأ في إرسال البريد:', error);
      } else {
        console.log('✅ تم إرسال البريد:', info.response);
      }
    });

    res.status(201).json({ message: '✅ تم التسجيل بنجاح وتم إرسال بريد التأكيد!' });
  } catch (error) {
    console.error("❌ خطأ أثناء التسجيل:", error);
    res.status(500).json({ message: '❌ حدث خطأ أثناء التسجيل.', error: error.message });
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});
