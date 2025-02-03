// إضافة مستمع الحدث عند تقديم النموذج
form.addEventListener('submit', function(event) {
    event.preventDefault(); // منع الإرسال الافتراضي للنموذج

    // تعطيل الزر أثناء الإرسال
    subscribeButton.disabled = true;
    subscribeButton.textContent = 'جارٍ الاشتراك...';

    // الحصول على البريد الإلكتروني من الحقل
    const email = emailInput.value;

    // التحقق من صحة البريد الإلكتروني
    if (!validateEmail(email)) {
        alert('البريد الإلكتروني غير صالح.');
        subscribeButton.disabled = false;
        subscribeButton.textContent = 'اشترك';
        return;
    }

    // إرسال البيانات إلى الخادم
    fetch('/api/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        alert('تم الاشتراك بنجاح!');
        // إعادة تفعيل الزر وإعادة النص
        subscribeButton.disabled = false;
        subscribeButton.textContent = 'اشترك';
        // يمكنك إضافة منطق إضافي هنا بعد الاشتراك الناجح
    })
    .catch(error => {
        console.error('حدث خطأ:', error);
        alert('حدث خطأ أثناء الاشتراك.');
        subscribeButton.disabled = false;
        subscribeButton.textContent = 'اشترك';
    });
});
