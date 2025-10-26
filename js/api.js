const API = (function(){
    const base = () => window.APP_CONFIG?.API_BASE_URL || '';
    let token = localStorage.getItem('token') || '';
    function setToken(t){ token = t; localStorage.setItem('token', t); }
    async function req(path, options={}){
        const res = await fetch(base()+path, {
            headers: { 'Content-Type': 'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
            ...options
        });
        if (!res.ok) throw await res.json().catch(()=>({error:'Request failed'}));
        return res.json();
    }
    return {
        setToken,
        register: (payload)=>req('/api/auth/register',{method:'POST',body:JSON.stringify(payload)}),
        login: (payload)=>req('/api/auth/login',{method:'POST',body:JSON.stringify(payload)}),
        me: ()=>req('/api/auth/me'),
        pay: (type)=>req(`/api/pay/${type}`,{method:'POST'}),
        products: ()=>req('/api/products'),
        createProduct: (payload)=>req('/api/products',{method:'POST',body:JSON.stringify(payload)}),
        updateProduct: (id,payload)=>req(`/api/products/${id}`,{method:'PUT',body:JSON.stringify(payload)}),
        deleteProduct: (id)=>req(`/api/products/${id}`,{method:'DELETE'}),
        adminPending: ()=>req('/api/admin/products/pending'),
        adminApprove: (id)=>req(`/api/admin/products/${id}/approve`,{method:'POST'}),
        adminVerify: (id,payload)=>req(`/api/admin/products/${id}/verify`,{method:'POST',body:JSON.stringify(payload)})
    };
})();

