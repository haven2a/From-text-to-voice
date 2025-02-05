require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js'); // إذا كنت تحتاج الاتصال بـ Supabase

const app = express();
const PORT = process.env.PORT || 3000;

// تفعيل cors
app.use(cors());

// استخدام middleware لتحليل بيانات النماذج (URL-encoded) فقط
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

// إعداد خدمة البريد الإلكتروني باستخدام Nodemailer (مثال باستخدام Gmail)
console.log("📧 إعداد خدمة البريد الإلكتروني...");
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,    // يُحمَّل من ملف .env
    pass: process.env.EMAIL_PASS
  }
});
console.log("✅ تم إعداد خدمة البريد الإلكتروني!");

// المسار الرئيسي: تقديم ملف index.html من مجلد 'public'
app.get('/', (req, res) => {
  console.log("وصلت إلى الصفحة الرئيسية");
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تسجيل المستخدم عبر نقطة النهاية /subscribe
app.post('/subscribe', async (req, res) => {
  console.log("📩 استلام طلب تسجيل:", req.body);
  const { name, email, password } = req.body;

  // التحقق من وجود جميع الحقول المطلوبة
  if (!name || !email || !password) {
    console.log("⚠️ جميع الحقول مطلوبة!");
    return res.status(400).send("⚠️ جميع الحقول مطلوبة!");
  }

  // التحقق من صحة البريد الإلكتروني باستخدام تعبير نمطي
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    console.log("⚠️ البريد الإلكتروني غير صالح!");
    return res.status(400).send("⚠️ البريد الإلكتروني غير صحيح.");
  }

  console.log("🔑 تشفير كلمة المرور...");
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("✅ تم تشفير كلمة المرور");

  // هنا يمكنك إضافة الكود لحفظ بيانات المستخدم في قاعدة البيانات (مثلاً باستخدام Supabase)
  // مثال (معلق):
  // const { data, error } = await supabase
  //   .from('users')
  //   .insert([{ name, email, password: hashedPassword }]);

  // إعداد رسالة تأكيد التسجيل عبر البريد الإلكتروني
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'تأكيد التسجيل',
    text: `مرحبًا ${name}!\n\nتم تسجيلك بنجاح في تطبيقنا.\n\nشكراً لاختيارك لنا!`
  };

  // إرسال البريد الإلكتروني
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("⚠️ فشل إرسال البريد الإلكتروني:", error);
      return res.status(500).send("⚠️ حدث خطأ أثناء إرسال البريد الإلكتروني");
    } else {
      console.log("✅ تم إرسال البريد الإلكتروني بنجاح:", info.response);
      return res.status(200).send("✅ تم التسجيل بنجاح!");
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
});
