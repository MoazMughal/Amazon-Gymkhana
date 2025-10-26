// Placeholder for Amazon rankings integration
// Replace with your server-side proxy that calls Amazon PA-API or scraping service
async function loadAmazonTrending() {
    const endpoint = '/api/amazon/trending'; // your backend proxy
    const cards = document.querySelectorAll('.section-title + .row .col-md-4 .mb-1');
    try {
        const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' }});
        if (!res.ok) throw new Error('Unavailable');
        const items = await res.json();
        // Update top 3 if available
        items.slice(0, 3).forEach((item, idx) => {
            const titleEl = document.querySelectorAll('.section-title + .row h5.mb-1')[idx];
            const rankEl = document.querySelectorAll('.section-title + .row p.text-muted')[idx];
            if (titleEl) titleEl.textContent = item.title || titleEl.textContent;
            if (rankEl) rankEl.textContent = `Ranking: #${item.rank} in ${item.category}`;
        });
    } catch (_) {
        // graceful fallback: keep placeholders
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.section-title')?.textContent.includes('Top Trending Amazon Products')) {
        loadAmazonTrending();
    }
});

