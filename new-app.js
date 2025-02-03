// تحميل متغيرات البيئة من ملف .env
require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// الاتصال بـ Supabase باستخدام المتغيرات من ملف .env
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// إعداد خدمة البريد الإلكتروني باستخدام Nodemailer (باستخدام Gmail كمثال)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   // بريدك الإلكتروني
    pass: process.env.EMAIL_PASS    // كلمة مرور البريد (أو كلمة مرور التطبيق إذا كنت تستخدم المصادقة الثنائية)
  }
});

// نقطة النهاية لتسجيل المستخدمين
app.post('/api/subscribe', async (req, res) => {
  console.log('📩 بيانات التسجيل المستلمة:', req.body);
  const { name, email, password } = req.body;

  // التحقق من وجود جميع الحقول المطلوبة
  if (!name || !email || !password) {
    return res.status(400).json({ message: '⚠️ جميع الحقول مطلوبة!' });
  }

  try {
    // التحقق مما إذا كان البريد الإلكتروني مسجل مسبقًا
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userCheckError) {
      console.error('❌ خطأ في التحقق من البريد الإلكتروني:', userCheckError);
      return res.status(500).json({ message: '❌ حدث خطأ أثناء التحقق من البريد الإلكتروني.' });
    }

    if (existingUser) {
      return res.status(400).json({ message: '⚠️ البريد الإلكتروني مسجل مسبقًا.' });
    }

    // تشفير كلمة المرور قبل حفظها
    const hashedPassword = await bcrypt.hash(password, 10);

    // إضافة المستخدم إلى جدول "users" في Supabase
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword }]);

    if (insertError) {
      console.error('❌ خطأ في إضافة المستخدم:', insertError);
      return res.status(500).json({ message: '❌ حدث خطأ أثناء إضافة المستخدم.' });
    }

    // إعداد خيارات البريد الإلكتروني للتأكيد
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'تم التسجيل بنجاح 🎉',
      text: `مرحبًا ${name},\n\nلقد تم تسجيلك بنجاح في النظام. شكرًا لاستخدامك خدمتنا!`
    };

    // إرسال البريد الإلكتروني التأكيدي
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('❌ خطأ في إرسال البريد:', err);
      } else {
        console.log('✅ تم إرسال البريد:', info.response);
      }
    });

    // إرسال استجابة ناجحة
    res.status(201).json({ message: '✅ تم التسجيل بنجاح وتم إرسال بريد التأكيد!' });
  } catch (error) {
    console.error('❌ خطأ في تسجيل المستخدم:', error);
    res.status(500).json({ message: '❌ حدث خطأ أثناء التسجيل.' });
  }
});

// المهام المجدولة باستخدام node-cron

// مهمة التحقق من الاشتراكات كل ساعة
cron.schedule('0 * * * *', () => {
  console.log(`🔍 [${new Date().toLocaleString()}] تشغيل مهمة التحقق من الاشتراكات.`);
});

// مهمة إرسال التذكيرات يوميًا في الساعة 9 صباحًا
cron.schedule('0 9 * * *', () => {
  console.log(`⏰ [${new Date().toLocaleString()}] تشغيل مهمة إرسال التذكيرات.`);
});

// مهمة تنظيف البيانات القديمة كل أسبوع (كل يوم أحد منتصف الليل)
cron.schedule('0 0 * * 0', () => {
  console.log(`🧹 [${new Date().toLocaleString()}] تشغيل مهمة تنظيف البيانات القديمة.`);
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});
