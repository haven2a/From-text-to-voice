// إنشاء عنصر النموذج
const form = document.createElement('form');
form.id = 'subscribeForm';

// إنشاء عنصر حقل البريد الإلكتروني
const emailLabel = document.createElement('label');
emailLabel.setAttribute('for', 'email');
emailLabel.textContent = 'البريد الإلكتروني:';
form.appendChild(emailLabel);

const emailInput = document.createElement('input');
emailInput.type = 'email';
emailInput.id = 'email';
emailInput.name = 'email';
emailInput.required = true;
emailInput.placeholder = 'أدخل بريدك الإلكتروني';
form.appendChild(emailInput);

// إنشاء عنصر زر الاشتراك
const subscribeButton = document.createElement('button');
subscribeButton.type = 'submit';
subscribeButton.textContent = 'اشترك';
form.appendChild(subscribeButton);

// إضافة النموذج إلى الجسم
document.body.appendChild(form);

// إضافة مستمع الحدث عند تقديم النموذج
form.addEventListener('submit', function(event) {
    event.preventDefault(); // منع الإرسال الافتراضي للنموذج

    // الحصول على البريد الإلكتروني من الحقل
    const email = emailInput.value;

    // التحقق من صحة البريد الإلكتروني
    if (!validateEmail(email)) {
        alert('البريد الإلكتروني غير صالح.');
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
        // يمكنك إضافة منطق إضافي هنا بعد الاشتراك الناجح
    })
    .catch(error => {
        console.error('حدث خطأ:', error);
        alert('حدث خطأ أثناء الاشتراك.');
    });
});

// دالة للتحقق من صحة البريد الإلكتروني
function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}
