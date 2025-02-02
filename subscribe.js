// subscribe.js

// وظيفة لإنشاء اشتراك جديد
function subscribeUser(email) {
    // تحقق من صحة البريد الإلكتروني
    if (!validateEmail(email)) {
        console.error("البريد الإلكتروني غير صالح.");
        return;
    }

    // هنا يمكنك إضافة الكود لإرسال بيانات الاشتراك إلى الخادم (مثلاً عبر API)
    console.log(`تم الاشتراك بنجاح باستخدام البريد الإلكتروني: ${email}`);
}

// وظيفة للتحقق من صحة البريد الإلكتروني
function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

// يمكن استدعاء الوظيفة في التطبيق الخاص بك كما يلي:
subscribeUser("example@example.com");
