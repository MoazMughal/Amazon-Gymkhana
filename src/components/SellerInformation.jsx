import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { useBasket } from '../context/BasketContext';
import { useBuyer } from '../context/BuyerContext';
import { getApiUrl } from '../utils/api';

// Shipping rate tooltip
const ShippingTooltip = () => {
  const [pos, setPos] = useState(null);
  const TOOLTIP_W = 300;
  const handleEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    let left = r.left;
    if (left + TOOLTIP_W > window.innerWidth - 8) left = window.innerWidth - TOOLTIP_W - 8;
    if (left < 8) left = 8;
    setPos({ top: r.bottom + 6, left });
  };
  const tooltip = pos ? createPortal(
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, background: '#1e293b', color: '#fff', borderRadius: '10px', padding: '12px 14px', width: TOOLTIP_W, boxShadow: '0 8px 32px rgba(0,0,0,0.45)', zIndex: 99999, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', bottom: '100%', left: '14px', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid #1e293b' }} />
      <div style={{ fontWeight: '800', marginBottom: '10px', color: '#93c5fd', fontSize: '0.78rem', textAlign: 'center' }}>
        Shipping Rates / kg (By Sea / By Air)
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: '700', fontSize: '0.72rem', color: '#fbbf24', marginBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '3px' }}>Pakistan (PK) to:</div>
        {[
          { to: 'UK (GB)',    rate: 'Rs 800-1,600/kg' },
          { to: 'UAE (AE)',   rate: 'Rs 500-950/kg'   },
          { to: 'USA (US)',   rate: 'Rs 900-1,400/kg' },
          { to: 'China (CN)', rate: 'Rs 700-1,100/kg' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.7rem' }}>
            <span style={{ color: '#cbd5e1' }}>{r.to}</span>
            <span style={{ color: '#93c5fd', fontWeight: '600', whiteSpace: 'nowrap' }}>{r.rate}</span>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontWeight: '700', fontSize: '0.72rem', color: '#fbbf24', marginBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '3px' }}>China (CN) to:</div>
        {[
          { to: 'UK (GB)',       rate: '£2.50-4.00/kg' },
          { to: 'Pakistan (PK)', rate: 'Rs 400-800/kg'  },
          { to: 'UAE (AE)',      rate: 'AED 10-18/kg'   },
          { to: 'USA (US)',      rate: '$3.50-5.50/kg'  },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.7rem' }}>
            <span style={{ color: '#cbd5e1' }}>{r.to}</span>
            <span style={{ color: '#93c5fd', fontWeight: '600', whiteSpace: 'nowrap' }}>{r.rate}</span>
          </div>
        ))}
      </div>
      <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: '0.58rem', color: '#94a3b8', textAlign: 'center' }}>
        By Air - Based on chargeable weight (actual vs volumetric)
      </div>
    </div>, document.body
  ) : null;
  return (
    <><span onMouseEnter={handleEnter} onMouseLeave={() => setPos(null)} style={{ cursor: 'help', color: '#007bff', fontWeight: '600', borderBottom: '1px dashed #007bff' }}>🚚 +shipping</span>{tooltip}</>
  );
};

const SellerInformation = ({
  product,
  isSellerLoggedIn,
  isAdmin,
  currentSeller,
  onUpdatePrice,
  onRefreshProduct,
  quantity: globalQty = 1
}) => {
  const { convertPrice, formatPrice, currency, currencySymbols, currencyRates } = useCurrency();
  const { addToBasket } = useBasket();
  const { buyer, isLoggedIn: isBuyerLoggedIn } = useBuyer();

  // Convert a price stored in `fromCurrency` to the current display currency
  const convertSellerPrice = (amount, fromCurrency = 'GBP') => {
    const rates = currencyRates || { PKR: 1, GBP: 0.00272, USD: 0.00353, AED: 0.01310 };
    const num = parseFloat(amount) || 0;
    if (num === 0) return `${currencySymbols[currency] || ''}0.00`;
    // Convert to PKR first (base), then to target
    const fromRate = rates[fromCurrency] || rates['GBP'];
    const toRate = rates[currency] || rates['GBP'];
    const inPKR = num / fromRate;
    const converted = inPKR * toRate;
    return `${currencySymbols[currency] || ''}${converted.toFixed(2)}`;
  };
  const navigate = useNavigate();
  const [newPrice, setNewPrice] = useState('');
  const [updating, setUpdating] = useState(false);
  const [unlisting, setUnlisting] = useState(false);
  const [showAllSellers, setShowAllSellers] = useState(false);
  const [sellerQty, setSellerQty] = useState({});
  const [sellerQtyRaw, setSellerQtyRaw] = useState({}); // raw input string while typing
  const [sending, setSending] = useState({});
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [lockedSellerName, setLockedSellerName] = useState('');

  // Guest quotation form state
  const [guestForm, setGuestForm] = useState({}); // { [sellerId]: { name, phone, email, show } }

  const handleUpdatePrice = async () => {
    if (!newPrice || newPrice <= 0) return;
    setUpdating(true);
    try {
      await onUpdatePrice(newPrice);
      setNewPrice('');
      if (onRefreshProduct) await onRefreshProduct();
    } catch { alert('Failed to update price.'); }
    finally { setUpdating(false); }
  };

  const handleUnlistProduct = async () => {
    if (!window.confirm('Remove your listing?')) return;
    setUnlisting(true);
    try {
      const token = localStorage.getItem('sellerToken');
      const res = await fetch(getApiUrl(`sellers/unlist-product/${product.id || product._id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) { alert('Unlisted successfully!'); if (onRefreshProduct) await onRefreshProduct(); }
      else alert(data.message || 'Failed to unlist');
    } catch { alert('Failed to unlist.'); }
    finally { setUnlisting(false); }
  };

  const getQty = (sid, moq) => sellerQty[sid] ?? Math.max(1, moq || 1);
  // While typing: store raw string, don't clamp
  const setQtyRaw = (sid, val) => {
    setSellerQtyRaw(prev => ({ ...prev, [sid]: val }));
  };
  // On blur / +/- buttons: clamp to MOQ
  const setQty = (sid, val, moq) => {
    const min = Math.max(1, moq || 1);
    const num = parseInt(val) || min;
    const clamped = Math.max(min, num);
    setSellerQty(prev => ({ ...prev, [sid]: clamped }));
    setSellerQtyRaw(prev => ({ ...prev, [sid]: String(clamped) }));
  };
  const getDisplayQty = (sid, moq) => {
    if (sellerQtyRaw[sid] !== undefined) return sellerQtyRaw[sid];
    return String(getQty(sid, moq));
  };
  // Show MOQ warning when raw value is below MOQ
  const belowMoq = (sid, moq) => {
    const raw = sellerQtyRaw[sid];
    if (raw === undefined) return false;
    const num = parseInt(raw);
    return !isNaN(num) && num < Math.max(1, moq || 1);
  };

  const handleContactSupplier = async (se) => {
    const sid = se.sellerId || se._id;
    await submitQuotation(se, {
      buyerName: isBuyerLoggedIn ? (`${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || buyer.name || 'Buyer') : 'Guest',
      buyerPhone: isBuyerLoggedIn ? (buyer?.whatsappNo || buyer?.phone || '') : '',
      buyerEmail: isBuyerLoggedIn ? (buyer?.email || '') : '',
      buyerId: isBuyerLoggedIn ? buyer?._id : null,
      senderType: isBuyerLoggedIn ? 'buyer' : 'guest'
    });
  };

  const submitQuotation = async (se, senderInfo) => {
    const sid = se.sellerId || se._id;
    setSending(prev => ({ ...prev, [sid]: true }));

    const mainPrice = parseFloat(String(product.price || '0').replace(/[£₨$€]/g, '')) || 0;
    const sp = parseFloat(se.sellerPrice) || mainPrice;
    const ss = parseFloat(se.sellerShipping) || 0;
    const seFromCurrency = se.priceCurrency || 'GBP';
    const qty = getQty(sid, se.moq);
    const showShipping = ss > 0;
    // Convert to display currency for total — shipping always from PKR
    const rates2 = { PKR: 1, GBP: 0.00272, USD: 0.00353, AED: 0.01310 };
    const fr = rates2[seFromCurrency] || rates2['GBP'];
    const tr = rates2[currency] || rates2['GBP'];
    const spC = (sp / fr) * tr;
    const ssC = (ss / rates2['PKR']) * tr; // shipping always PKR base
    const total = showShipping ? spC + ssC : spC;

    // Save quotation to DB
    try {
      await fetch(getApiUrl('sellers/quotation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id || product.id,
          sellerId: sid,
          sellerUsername: se.username,
          sellerWhatsapp: se.whatsappNo,
          buyerName: senderInfo.buyerName,
          buyerEmail: senderInfo.buyerEmail,
          buyerPhone: senderInfo.buyerPhone,
          buyerId: senderInfo.buyerId,
          senderType: senderInfo.senderType,
          quantity: qty,
          sellerPrice: sp,
          message: `${senderInfo.senderType === 'guest' ? 'Guest' : 'Buyer'} contacted via WhatsApp. Qty: ${qty}, Total: ${formatPrice(total)}`
        })
      });
    } catch (err) {
      console.error('Failed to save quotation:', err);
    }

    // Build WhatsApp message
    const spDisplayMsg = `${currencySymbols[currency] || ''}${spC.toFixed(2)}`;
    const ssDisplayMsg = ss > 0 ? `${currencySymbols[currency] || ''}${ssC.toFixed(2)}` : null;
    const totalDisplayMsg = `${currencySymbols[currency] || ''}${(total * qty).toFixed(2)}`;
    const msg = [
      `Hi ${se.username},`,
      ``,
      `I'm interested in buying *${product.name}*.`,
      ``,
      `📦 Quantity: ${qty} units`,
      `💰 Price/unit: ${spDisplayMsg}${showShipping && ssDisplayMsg ? ` + ${ssDisplayMsg} shipping` : ''}`,
      `💵 Total: ${totalDisplayMsg}`,
      ``,
      `👤 ${senderInfo.senderType === 'guest' ? 'Guest' : 'Buyer'} Info:`,
      `Name: ${senderInfo.buyerName}`,
      ...(senderInfo.buyerPhone ? [`Phone/WhatsApp: ${senderInfo.buyerPhone}`] : []),
      ...(senderInfo.buyerEmail ? [`Email: ${senderInfo.buyerEmail}`] : []),
      ``,
      `Please confirm availability.`
    ].join('\n');

    const phone = se.whatsappNo?.replace(/[^0-9]/g, '');
    const waUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    const win = window.open('', 'whatsapp_web');
    if (win) {
      win.location.href = waUrl;
      win.focus();
    } else {
      window.open(waUrl, 'whatsapp_web');
    }

    setSending(prev => ({ ...prev, [sid]: false }));
  };

  const maskPhone = (phone) => {
    if (!phone) return '';
    const c = phone.replace(/[^0-9+]/g, '');
    if (c.length <= 4) return c;
    // Show first half clearly, replace second half with ****
    const half = Math.ceil(c.length / 2);
    return c.slice(0, half) + '****';
  };

  const mainPrice = parseFloat(String(product.price || '0').replace(/[£₨$€]/g, '')) || 0;

  // Determine if current user is a buyer (not seller, not admin)
  const isBuyer = !isSellerLoggedIn && !isAdmin;

  if (!product.sellers || product.sellers.length === 0) {
    return (
      <div className="mb-2">
        <h3 className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#1f2937' }}>Seller Information</h3>
        <div className="alert alert-info border-0 p-2" style={{ fontSize: '0.7rem' }}>
          <i className="fas fa-info-circle me-1"></i>No seller information available
        </div>
      </div>
    );
  }

  const uniqueSellers = product.sellers.reduce((acc, s) => {
    const id = s.sellerId || s._id;
    if (!id || acc.find(x => (x.sellerId || x._id) === id)) return acc;
    acc.push(s);
    return acc;
  }, []).sort((a, b) => {
    const rates = { PKR: 1, GBP: 0.00272, USD: 0.00353, AED: 0.01310 };
    const toRate = rates[currency] || rates['GBP'];
    const priceA = parseFloat(a.sellerPrice) || mainPrice;
    const priceB = parseFloat(b.sellerPrice) || mainPrice;
    const fromA = rates[a.priceCurrency || 'GBP'] || rates['GBP'];
    const fromB = rates[b.priceCurrency || 'GBP'] || rates['GBP'];
    const ta = (priceA / fromA) * toRate;
    const tb = (priceB / fromB) * toRate;
    return ta - tb;
  });

  const visible = showAllSellers ? uniqueSellers : uniqueSellers.slice(0, 1);

  // Lock logic: only the last seller (highest price) is open; all others are locked.
  // Exception: if only 1 seller, keep open.
  const isLocked = (index) => {
    if (uniqueSellers.length <= 1) return false;
    return index < uniqueSellers.length - 1;
  };

  return (
    <div className="mb-2">
      <style>{`
        .seller-qty-input {
          width: 80px !important;
          height: 34px !important;
          min-width: 80px !important;
          max-width: 80px !important;
          flex: 0 0 80px !important;
          text-align: center !important;
          padding: 0 8px !important;
          font-size: 1rem !important;
          font-weight: 700 !important;
          border: 2px solid #d1d5db !important;
          border-radius: 6px !important;
          color: #1f2937 !important;
          background: #fff !important;
          box-sizing: border-box !important;
          outline: none !important;
          box-shadow: none !important;
          -moz-appearance: textfield !important;
        }
        .seller-qty-input:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px rgba(34,197,94,0.35) !important;
          border-color: #22c55e !important;
          width: 80px !important;
          min-width: 80px !important;
          max-width: 80px !important;
          padding: 0 8px !important;
        }
        .seller-qty-input::-webkit-outer-spin-button,
        .seller-qty-input::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }
        .seller-qty-btn {
          width: 34px !important;
          height: 34px !important;
          min-width: 34px !important;
          max-width: 34px !important;
          min-height: 34px !important;
          flex: 0 0 34px !important;
        }
        .seller-qty-row {
          flex-wrap: nowrap !important;
        }
      `}</style>
      <h3 className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#1f2937' }}>
        <i className="fas fa-store me-1 text-success"></i>Seller Information
      </h3>

      <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '10px', border: '1px solid #c8e6c9' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#2e7d32', marginBottom: '10px' }}>
          <i className="fas fa-users me-1"></i>
          Available from {uniqueSellers.length} seller{uniqueSellers.length > 1 ? 's' : ''}:
        </div>

        {visible.map((se, index) => {
          const sid = se.sellerId || se._id;
          const sp = parseFloat(se.sellerPrice) || mainPrice;
          const ss = parseFloat(se.sellerShipping) || 0;
          const seFromCurrency = se.priceCurrency || 'GBP';
          // Convert seller price from its stored currency to display currency
          const spDisplay = convertSellerPrice(sp, seFromCurrency);
          // Shipping is always stored in PKR — convert from PKR to display currency
          const ssDisplay = ss > 0 ? convertSellerPrice(ss, 'PKR') : null;
          const rates = currencyRates || { PKR: 1, GBP: 0.00272, USD: 0.00353, AED: 0.01310 };
          const fromRate = rates[seFromCurrency] || rates['GBP'];
          const toRate = rates[currency] || rates['GBP'];
          const pkrRate = rates['PKR'] || 1;
          const spConverted = (sp / fromRate) * toRate;
          // Shipping always from PKR base — kept for tooltip info only, not added to price
          const ssConverted = (ss / pkrRate) * toRate;
          // Display price = seller price only (no shipping added)
          const totalConverted = spConverted;
          const totalDisplay = `${currencySymbols[currency] || ''}${totalConverted.toFixed(2)}`;
          const moq = se.moq || 1;
          const qty = getQty(sid, moq);
          const isMine = isSellerLoggedIn && currentSeller && sid?.toString() === currentSeller._id?.toString();
          const locked = false; // membership lock removed

          return (
            <div key={`si-${sid}-${index}`} style={{
              background: index === 0 ? '#f0f9ff' : '#f8f9fa',
              border: `1px solid ${index === 0 ? '#bae6fd' : '#e5e7eb'}`,
              borderRadius: '8px', padding: '10px', marginBottom: '8px',
              position: 'relative',
              overflow: locked ? 'hidden' : 'visible'
            }}>
              {/* Lock overlay for premium sellers */}
              {locked && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '8px',
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 2,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '6px',
                  cursor: 'pointer'
                }} onClick={() => { setLockedSellerName(se.username); setShowMembershipModal(true); }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #ff6600, #ff9900)',
                    borderRadius: '50%', width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255,102,0,0.4)'
                  }}>
                    <i className="fas fa-lock" style={{ color: '#fff', fontSize: '0.9rem' }}></i>
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#c2410c', textAlign: 'center', lineHeight: 1.3 }}>
                    Premium Only<br />
                    <span style={{ fontSize: '0.62rem', fontWeight: '500', color: '#6b7280' }}>Click to unlock</span>
                  </div>
                </div>
              )}
              {index === 0 && (
                <div className="lowest-price-badge mb-2" style={{
                  display: 'inline-block', fontSize: '0.6rem', color: '#fff',
                  backgroundColor: '#16a34a', fontWeight: '700', padding: '3px 8px',
                  borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  <i className="fas fa-tag me-1"></i>Lowest Price
                </div>
              )}

              {/* Seller name + price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1f2937' }}>
                  {se.username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#059669', whiteSpace: 'nowrap' }}>
                    {totalDisplay}
                  </span>
                  <ShippingTooltip />
                </div>
              </div>

              {/* Location + MOQ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>📍 {se.city}, {se.country}</span>
                <span style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', padding: '1px 5px', fontSize: '0.65rem', fontWeight: '700', color: '#856404', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
                  <i className="fas fa-boxes me-1"></i>MOQ:{moq}
                </span>
              </div>

              {/* Qty row — separate line so it never gets cut */}
              {!isMine && (
                <div className="seller-qty-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap', flexShrink: 0 }}>Qty:</span>
                  <button
                    onClick={() => setQty(sid, qty - 1, moq)}
                    disabled={qty <= moq}
                    className="seller-qty-btn"
                    style={{ width: '32px', height: '32px', minWidth: '32px', maxWidth: '32px', minHeight: '32px', maxHeight: '32px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb', cursor: qty <= moq ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qty <= moq ? 0.4 : 1, flexShrink: 0, color: '#374151', padding: '0', lineHeight: 1 }}>−</button>
                  <input
                    type="number"
                    value={getDisplayQty(sid, moq)}
                    onChange={e => setQtyRaw(sid, e.target.value)}
                    onBlur={e => setQty(sid, e.target.value, moq)}
                    className="seller-qty-input"
                    style={{
                      width: '80px',
                      height: '34px',
                      flex: '0 0 80px',
                      textAlign: 'center',
                      padding: '0 8px',
                      fontSize: '1rem',
                      fontWeight: '700',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      flexShrink: 0,
                      flexGrow: 0,
                      color: '#1f2937',
                      background: '#fff',
                      boxSizing: 'border-box',
                      outline: 'none',
                      boxShadow: 'none',
                      MozAppearance: 'textfield',
                      WebkitAppearance: 'none',
                      display: 'block'
                    }} />
                  <button
                    onClick={() => setQty(sid, qty + 1, moq)}
                    className="seller-qty-btn"
                    style={{ width: '32px', height: '32px', minWidth: '32px', maxWidth: '32px', minHeight: '32px', maxHeight: '32px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb', cursor: 'pointer', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#374151', padding: '0', lineHeight: 1 }}>+</button>
                </div>
              )}
              {/* MOQ warning when typing below minimum */}
              {!isMine && belowMoq(sid, moq) && (
                <div style={{ fontSize: '0.62rem', color: '#dc2626', fontWeight: '600', marginTop: '-4px', marginBottom: '4px' }}>
                  ⚠️ Minimum order is {moq} units
                </div>
              )}

              {/* Guest quotation form */}
              {!isMine && isBuyer && !isBuyerLoggedIn && guestForm[sid]?.show && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#15803d', marginBottom: '8px' }}>
                    <i className="fab fa-whatsapp me-1"></i>Contact Supplier — Enter your details
                  </div>
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={guestForm[sid]?.name || ''}
                    onChange={e => setGuestForm(prev => ({ ...prev, [sid]: { ...prev[sid], name: e.target.value } }))}
                    style={{ width: '100%', padding: '5px 8px', fontSize: '0.7rem', border: '1px solid #d1d5db', borderRadius: '5px', marginBottom: '5px', boxSizing: 'border-box' }}
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp / Phone *"
                    value={guestForm[sid]?.phone || ''}
                    onChange={e => setGuestForm(prev => ({ ...prev, [sid]: { ...prev[sid], phone: e.target.value } }))}
                    style={{ width: '100%', padding: '5px 8px', fontSize: '0.7rem', border: '1px solid #d1d5db', borderRadius: '5px', marginBottom: '5px', boxSizing: 'border-box' }}
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={guestForm[sid]?.email || ''}
                    onChange={e => setGuestForm(prev => ({ ...prev, [sid]: { ...prev[sid], email: e.target.value } }))}
                    style={{ width: '100%', padding: '5px 8px', fontSize: '0.7rem', border: '1px solid #d1d5db', borderRadius: '5px', marginBottom: '8px', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleGuestSubmit(se)}
                      disabled={sending[sid]}
                      style={{ flex: 2, padding: '6px', fontSize: '0.7rem', fontWeight: '700', background: '#25d366', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                      {sending[sid] ? 'Sending...' : <><i className="fab fa-whatsapp me-1"></i>Send via WhatsApp</>}
                    </button>
                    <button
                      onClick={() => setGuestForm(prev => ({ ...prev, [sid]: { ...prev[sid], show: false } }))}
                      style={{ flex: 1, padding: '6px', fontSize: '0.7rem', fontWeight: '600', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '5px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Buyer actions — only for buyers */}
              {!isMine && isBuyer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        handleContactSupplier(se);
                      }}
                      style={{
                        flex: '3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: '#25d366', color: 'white', padding: '6px 8px',
                        borderRadius: '5px', fontSize: '0.65rem', fontWeight: '700', textDecoration: 'none',
                        cursor: sending[sid] ? 'not-allowed' : 'pointer', opacity: sending[sid] ? 0.7 : 1,
                        gap: '2px'
                      }}>
                      {sending[sid]
                        ? <><i className="fas fa-spinner fa-spin"></i><span>Sending...</span></>
                        : <>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                              <i className="fab fa-whatsapp" style={{ fontSize: '0.85rem' }}></i>
                              Contact Supplier
                            </span>
                            <span style={{ opacity: 0.9, fontSize: '0.6rem', whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>
                              {isBuyerLoggedIn ? se.whatsappNo : maskPhone(se.whatsappNo)}
                            </span>
                          </>}
                    </a>
                    <button onClick={() => addToBasket({ ...product, selectedSeller: se, quantity: getQty(se.sellerId || se._id, se.moq) })}
                      className="seller-add-to-cart-btn"
                      style={{
                        flex: '1', padding: '7px 6px', fontSize: '0.6rem', fontWeight: '700',
                        background: '#ff9900',
                        color: '#000000', border: 'none', borderRadius: '5px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                        minWidth: '70px', colorScheme: 'light'
                      }}>
                      <i className="fas fa-shopping-cart" style={{ fontSize: '0.7rem', color: '#000000' }}></i>
                      <span style={{ whiteSpace: 'nowrap', color: '#000000' }}>Add to Cart</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Seller management panel */}
              {isMine && (
                <div style={{ marginTop: '8px', background: '#fff3cd', borderRadius: '6px', padding: '8px', border: '1px solid #ffc107' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#856404', marginBottom: '6px' }}>
                    <i className="fas fa-edit me-1"></i>Manage Your Listing
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem' }}>£</span>
                    <input type="number" placeholder="New price" value={newPrice}
                      onChange={e => setNewPrice(e.target.value)} step="0.01"
                      style={{ flex: 1, padding: '4px 6px', fontSize: '0.65rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <button onClick={handleUpdatePrice} disabled={updating || !newPrice}
                      style={{ padding: '4px 8px', fontSize: '0.65rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      {updating ? '...' : 'Update'}
                    </button>
                    <button onClick={handleUnlistProduct} disabled={unlisting}
                      style={{ padding: '4px 8px', fontSize: '0.65rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      {unlisting ? '...' : 'Unlist'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {uniqueSellers.length > 1 && (
          <button onClick={() => setShowAllSellers(!showAllSellers)}
            style={{
              width: '100%', padding: '6px', fontSize: '0.7rem', fontWeight: '600',
              background: 'transparent', border: '1px solid #16a34a', color: '#16a34a',
              borderRadius: '5px', cursor: 'pointer', marginTop: '4px'
            }}>
            <i className={`fas fa-chevron-${showAllSellers ? 'up' : 'down'} me-1`}></i>
            {showAllSellers ? 'See Less' : `See More (${uniqueSellers.length - 1} more seller${uniqueSellers.length - 1 > 1 ? 's' : ''})`}
          </button>
        )}
      </div>
    </div>
  );
};

export default SellerInformation;
