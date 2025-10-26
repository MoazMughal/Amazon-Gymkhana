// Simple payments module (mock + Firestore when available)
window.payments = (function() {
    const CONTACT_KEY = 'paid_contact_access';
    const LISTING_KEY = 'paid_listing_access';
    const PRICE_RS = 1000;

    function hasPaid(type) {
        const key = type === 'listing' ? LISTING_KEY : CONTACT_KEY;
        const local = localStorage.getItem(key) === 'true';
        return local;
    }

    async function persistPaid(type) {
        const key = type === 'listing' ? LISTING_KEY : CONTACT_KEY;
        localStorage.setItem(key, 'true');
        // Optional: store to Firestore under user doc if available
        if (window.db && window.auth?.currentUser) {
            try {
                await window.db.collection('users').doc(window.auth.currentUser.uid)
                    .set({ payments: { [key]: true } }, { merge: true });
            } catch (e) {
                console.warn('Failed to persist payment to Firestore (non-blocking)', e);
            }
        }
    }

    function ensureModal() {
        if (document.getElementById('paymentModal')) return;
        const html = `
        <div class="modal fade" id="paymentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Complete Access Payment</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-2">Pay Rs ${PRICE_RS} PKR to unlock access:</p>
                        <ul class="mb-3">
                            <li>View WhatsApp contact details</li>
                            <li>Submit product listings for approval</li>
                        </ul>
                        <div class="alert alert-info mb-3">Mock payment for demo. Integrate JazzCash/Easypaisa/Stripe on backend for production.</div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-success" id="mockPayBtn">Pay Rs ${PRICE_RS} Now</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function showModalAndPay(type) {
        ensureModal();
        const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
        const btn = document.getElementById('mockPayBtn');
        const handler = async function() {
            btn.disabled = true;
            btn.textContent = 'Processing...';
            setTimeout(async () => {
                await persistPaid(type);
                modal.hide();
                btn.disabled = false;
                btn.textContent = `Pay Rs ${PRICE_RS} Now`;
                document.getElementById('paymentModal').removeEventListener('hidden.bs.modal', cleanup);
                if (pendingResolve) { pendingResolve(true); pendingResolve = null; }
            }, 1000);
        };
        function cleanup() { btn.removeEventListener('click', handler); }
        btn.addEventListener('click', handler);
        document.getElementById('paymentModal').addEventListener('hidden.bs.modal', cleanup);
        modal.show();
    }

    let pendingResolve = null;
    function requireAccess(type) {
        return new Promise(resolve => {
            if (hasPaid(type)) return resolve(true);
            pendingResolve = resolve;
            showModalAndPay(type);
        });
    }

    return { hasPaid, requireAccess };
})();

