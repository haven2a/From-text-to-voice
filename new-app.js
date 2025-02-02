require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron'); // إضافة مكتبة الكرون

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const usersFile = path.join(__dirname, 'users.json');

// التأكد من أن ملف المستخدمين موجود
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
}

// إعداد خدمة البريد الإلكتروني
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// مسار تسجيل المستخدمين
app.post('/api/subscribe', async (req, res) => {
    console.log('📩 بيانات التسجيل المستلمة:', req.body);
    const { name, email, password } = req.body;

    // التحقق من أن جميع الحقول مدخلة
    if (!name || !email || !password) {
        return res.status(400).json({ message: '⚠️ جميع الحقول مطلوبة!' });
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: '⚠️ البريد الإلكتروني غير صحيح.' });
    }

    try {
        let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

        // التحقق من أن البريد الإلكتروني غير مسجل مسبقًا
        if (users.some(user => user.email === email)) {
            return res.status(400).json({ message: '⚠️ البريد الإلكتروني مسجل مسبقًا.' });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء بيانات المستخدم الجديد
        const newUser = {
            id: users.length + 1, // إضافة معرف للمستخدم
            name,
            email,
            password: hashedPassword,
            registeredAt: new Date().toISOString()
        };

        users.push(newUser);
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

        // إعداد البريد الإلكتروني التأكيدي
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'تم التسجيل بنجاح 🎉',
            text: `مرحبًا ${name}،\n\nلقد تم تسجيلك بنجاح في النظام. شكرًا لاستخدامك خدمتنا!`
        };

        // إرسال البريد الإلكتروني
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('❌ خطأ في إرسال البريد:', error);
            } else {
                console.log('✅ تم إرسال البريد:', info.response);
            }
        });

        res.status(201).json({ message: '✅ تم التسجيل بنجاح وتم إرسال بريد التأكيد!' });

    } catch (error) {
        console.error('❌ خطأ في تسجيل المستخدم:', error);
        res.status(500).json({ message: '❌ حدث خطأ أثناء التسجيل.' });
    }
});


// ===========================
// المهام المجدولة باستخدام node-cron (دون التأثير على محتوى السيرفر)
// ===========================

// مهمة: التحقق من الاشتراكات - تُنفذ في الدقيقة 0 من كل ساعة
cron.schedule('0 * * * *', () => {
    console.log(`🔍 [${new Date().toLocaleString()}] تشغيل مهمة التحقق من الاشتراكات.`);
    // أضف هنا الكود اللازم للتعامل مع الاشتراكات، مثل التحقق من حالة المستخدمين أو تحديث بياناتهم.
});

// مهمة: إرسال التذكيرات - تُنفذ في الساعة 9 صباحاً يوميًا
cron.schedule('0 9 * * *', () => {
    console.log(`⏰ [${new Date().toLocaleString()}] تشغيل مهمة إرسال التذكيرات.`);
    // أضف هنا الكود اللازم لإرسال التذكيرات، مثل استدعاء دالة لإرسال البريد الإلكتروني للمستخدمين.
});

// مهمة: تنظيف البيانات القديمة - تُنفذ في منتصف الليل كل يوم أحد
cron.schedule('0 0 * * 0', () => {
    console.log(`🧹 [${new Date().toLocaleString()}] تشغيل مهمة تنظيف البيانات القديمة.`);
    // أضف هنا الكود اللازم لتنظيف البيانات القديمة، مثل إزالة المستخدمين غير النشطين.
});


// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});
