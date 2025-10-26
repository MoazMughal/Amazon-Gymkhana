// Lightweight Firebase Web v9 compat loader via CDN
// Note: Works offline-free with placeholders; replace config to enable
(function() {
    const scripts = [
        'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js'
    ];
    let loaded = 0;
    scripts.forEach(src => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => {
            loaded++;
            if (loaded === scripts.length) initFirebase();
        };
        document.head.appendChild(s);
    });

    function initFirebase() {
        if (!window.firebase || !window.firebaseConfig || window.firebase.apps?.length) return;
        try {
            window.firebase.initializeApp(window.firebaseConfig);
            window.auth = window.firebase.auth();
            window.db = window.firebase.firestore();
            bindAuthForms();
            protectDashboard();
        } catch (e) {
            console.warn('Firebase init skipped (missing/invalid config). Auth will be mock-only.', e);
            bindAuthForms(true);
            protectDashboard(true);
        }
    }

    function bindAuthForms(mock = false) {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;
                if (!email || !password) return alert('Please fill in all fields');
                try {
                    if (window.API) {
                        const { token } = await API.login({ email, password });
                        API.setToken(token);
                    } else if (!mock && window.auth) {
                        await window.auth.signInWithEmailAndPassword(email, password);
                    } else {
                        localStorage.setItem('mockUser', JSON.stringify({ email }));
                    }
                    window.location.href = 'dashboard.html';
                } catch (err) {
                    alert(err.message || 'Login failed');
                }
            });
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const firstName = document.getElementById('firstName').value.trim();
                const lastName = document.getElementById('lastName').value.trim();
                const email = document.getElementById('email').value.trim();
                const phone = document.getElementById('phone').value.trim();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const agreeTerms = document.getElementById('agreeTerms').checked;
                const userType = document.querySelector('.user-type-btn.active')?.dataset.type || 'supplier';
                if (password !== confirmPassword) return alert('Passwords do not match');
                if (!agreeTerms) return alert('Please agree to Terms and Privacy Policy');
                try {
                    if (window.API) {
                        const { token } = await API.register({ firstName, lastName, email, phone, password, userType });
                        API.setToken(token);
                    } else if (!mock && window.auth) {
                        const cred = await window.auth.createUserWithEmailAndPassword(email, password);
                        const uid = cred.user.uid;
                        const profile = { firstName, lastName, email, phone, userType, createdAt: Date.now() };
                        await window.db.collection('users').doc(uid).set(profile);
                    } else {
                        localStorage.setItem('mockUser', JSON.stringify({ email }));
                    }
                    window.location.href = 'dashboard.html';
                } catch (err) {
                    alert(err.message || 'Registration failed');
                }
            });
        }
    }

    function protectDashboard(mock = false) {
        if (!location.pathname.endsWith('dashboard.html')) return;
        if (mock) {
            const mockUser = localStorage.getItem('mockUser');
            if (!mockUser) return location.replace('login.html');
            bindDashboard(mock);
            return;
        }
        if (!window.auth) return;
        window.auth.onAuthStateChanged(user => {
            if (!user) return location.replace('login.html');
            bindDashboard(false, user);
        });
    }

    function bindDashboard(mock = false, user = null) {
        const addForm = document.getElementById('addProductForm');
        if (!addForm) return;
        addForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Require Rs 1000 payment to list
            const ok = await (window.payments?.requireAccess('listing') || Promise.resolve(true));
            if (!ok) return;
            const name = document.getElementById('productName').value.trim();
            const category = document.getElementById('productCategory').value;
            const description = document.getElementById('productDescription').value.trim();
            const price = parseFloat(document.getElementById('productPrice').value);
            const size = document.getElementById('productSize').value.trim();
            const quantity = parseInt(document.getElementById('productQuantity').value, 10);
            const record = {
                name, category, description, price, size, quantity,
                status: 'Pending', createdAt: Date.now(),
                sellerId: mock ? 'mock' : user?.uid || 'unknown'
            };
            try {
                if (mock) {
                    const items = JSON.parse(localStorage.getItem('myProducts') || '[]');
                    items.push(record);
                    localStorage.setItem('myProducts', JSON.stringify(items));
                } else {
                    await window.db.collection('products').add(record);
                }
                alert('Product submitted for approval!');
                this.reset();
            } catch (err) {
                alert(err.message || 'Failed to save product');
            }
        });
    }
})();

