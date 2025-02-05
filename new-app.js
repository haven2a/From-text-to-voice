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
    user: process.env.EMAIL_USER,   // البريد الإلكتروني من ملف .env
    pass: process.env.EMAIL_PASS    // كلمة مرور البريد من ملف .env
  }
});
console.log("✅ تم إعداد خدمة البريد الإلكتروني!");

// المسار الرئيسي: تقديم ملف index.html من المجلد 'public'
app.get('/', (req, res) => {
  console.log("وصلت إلى الصفحة الرئيسية");
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

    // إدخال المستخدم في قاعدة البيانات
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
        }
      ]);

    if (insertError) {
      throw insertError;
    }

    console.log("✅ تم تسجيل المستخدم بنجاح!");

    // إرسال بريد إلكتروني تأكيد
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'تأكيد التسجيل',
      text: `مرحبًا ${name}, تم تسجيلك بنجاح في تطبيقنا!`,
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 تم إرسال البريد الإلكتروني!");

    res.status(200).json({ message: 'تم التسجيل بنجاح!' });
  } catch (error) {
    console.error("⚠️ حدث خطأ أثناء التسجيل:", error.message);
    res.status(500).json({ message: 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.' });
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
});
