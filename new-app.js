require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// تحميل مفتاح Firebase
console.log("🚀 تحميل مفتاح Firebase...");
try {
    const serviceAccount = require('./firebase-key.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase تم الاتصال به بنجاح!");
} catch (error) {
    console.error("❌ خطأ في تحميل Firebase:", error);
    process.exit(1); // إنهاء السيرفر إذا لم يتم تحميل Firebase بشكل صحيح
}

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إعداد البريد الإلكتروني
console.log("📧 إعداد خدمة البريد الإلكتروني...");
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
console.log("✅ تم إعداد خدمة البريد الإلكتروني!");

// المسار الرئيسي
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// تسجيل المستخدم
app.post('/api/subscribe', async (req, res) => {
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
        console.log("🔍 البحث عن البريد الإلكتروني في Firestore...");
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (!snapshot.empty) {
            console.log("⚠️ البريد الإلكتروني مسجل مسبقًا!");
            return res.status(400).json({ message: '⚠️ البريد الإلكتروني مسجل مسبقًا.' });
        }

        console.log("🔑 تشفير كلمة المرور...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("📦 حفظ المستخدم في Firestore...");
        const newUser = {
            name,
            email,
            password: hashedPassword,
            registeredAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await usersRef.add(newUser);
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

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});
