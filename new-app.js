require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تحديد مسار صفحة index.html
app.use(express.static(path.join(__dirname, 'public'))); // استخدم مجلد 'public' لخدمة الملفات الثابتة

const usersFile = path.join(__dirname, 'users.json');

// التأكد من أن ملف المستخدمين موجود
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
}

// إعداد خدمة البريد الإلكتروني
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // استخدام البريد الإلكتروني من ملف البيئة
        pass: process.env.EMAIL_PASS    // استخدام كلمة المرور من ملف البيئة
    }
});

// مسار تسجيل المستخدمين
app.post('/api/subscribe', async (req, res) => {
    console.log('بيانات التسجيل:', req.body); // تسجيل البيانات المستلمة من العميل
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: '⚠️ جميع الحقول مطلوبة!' });
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: '⚠️ البريد الإلكتروني غير صحيح.' });
    }

    try {
        let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

        if (users.some(user => user.email === email)) {
            return res.status(400).json({ message: '⚠️ البريد الإلكتروني مسجل مسبقًا.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = { name, email, password: hashedPassword, registeredAt: new Date().toISOString() };
        users.push(newUser);

        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

        const mailOptions = {
            from: process.env.EMAIL_USER,  // استخدام البريد الإلكتروني من ملف البيئة
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

// مسار تسجيل الدخول
app.post('/api/login', async (req, res) => {
    console.log('بيانات تسجيل الدخول:', req.body); // تسجيل البيانات المستلمة من العميل
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: '⚠️ البريد الإلكتروني وكلمة المرور مطلوبان!' });
    }

    try {
        let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(400).json({ message: '⚠️ البريد الإلكتروني غير موجود.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: '⚠️ كلمة المرور غير صحيحة.' });
        }

        res.status(200).json({ message: '✅ تم تسجيل الدخول بنجاح!' });

    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        res.status(500).json({ message: '❌ حدث خطأ أثناء تسجيل الدخول.' });
    }
});

// المسار الذي يعرض صفحة index.html كصفحة رئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // أرسل ملف index.html
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});
