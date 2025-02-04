require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');

// تهيئة Firebase باستخدام مفاتيح الخدمة
const serviceAccount = require('./firebase-key.json');  // تأكد من إضافة هذا الملف إلى .gitignore
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إعداد خدمة البريد الإلكتروني
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// مسار الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));  // تأكد من أن index.html موجود
});

// مسار تسجيل المستخدمين
app.post('/api/subscribe', async (req, res) => {
    console.log('بيانات التسجيل:', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: '⚠️ جميع الحقول مطلوبة!' });
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: '⚠️ البريد الإلكتروني غير صحيح.' });
    }

    try {
        // التحقق من وجود البريد الإلكتروني مسبقًا
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (!snapshot.empty) {
            return res.status(400).json({ message: '⚠️ البريد الإلكتروني مسجل مسبقًا.' });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إضافة المستخدم إلى Firestore
        const newUser = {
            name,
            email,
            password: hashedPassword,
            registeredAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await usersRef.add(newUser);

        // إرسال بريد التأكيد
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
        console.error('❌ خطأ في تسجيل المستخدم:', error);
        res.status(500).json({ message: '❌ حدث خطأ أثناء التسجيل.' });
    }
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});
