document.addEventListener('DOMContentLoaded', function() {
    console.log('Main.js loaded successfully');
    
    // Initialize infinite scroll for featured products
    initializeInfiniteScroll();
    
    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading animation to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#' || !this.getAttribute('href')) {
                e.preventDefault();
            }
            
            // Add ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .btn {
            position: relative;
            overflow: hidden;
        }
        .ripple-effect {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
        }
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');

    if (searchInput && searchButton) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    function performSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            window.location.href = `marketplace.html?search=${encodeURIComponent(searchTerm)}`;
        }
    }

    // Handle URL parameters for search
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam && document.getElementById('products-grid')) {
        // This would be handled in the marketplace page
        console.log('Search term:', searchParam);
    }

    // Add animation on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.product-card, .zone-card, .step-card');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = "1";
                element.style.transform = "translateY(0)";
            }
        });
    };

    // Set initial styles for animation
    document.querySelectorAll('.product-card, .zone-card, .step-card').forEach(element => {
        element.style.opacity = "0";
        element.style.transform = "translateY(20px)";
        element.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    });

    // Run on load and scroll
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);

    // Newsletter subscription
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            // Here you would typically send this to your backend
            alert('Thank you for subscribing to our newsletter!');
            this.reset();
        });
    }

    // Amazon verification button functionality
    initializeAmazonVerification();

    // Initialize wishlist badge and populate demo data
    wishlist.updateBadge();
    populatePopularDeals();
    populateLatestSuppliers();
});

// Infinite scroll initialization
function initializeInfiniteScroll() {
    const featuredScroller = document.querySelector('.featured-scroller');
    if (!featuredScroller) return;

    // Clone all items for seamless looping
    const items = featuredScroller.innerHTML;
    featuredScroller.innerHTML = items + items;
    
    // Adjust animation duration based on content length
    const itemCount = featuredScroller.children.length;
    const animationDuration = itemCount * 2; // Adjust multiplier as needed
    
    featuredScroller.style.animationDuration = `${animationDuration}s`;
}

// Amazon verification functionality
function initializeAmazonVerification() {
    // Add verify buttons to all product cards
    document.querySelectorAll('.product-card').forEach(card => {
        const title = card.querySelector('.card-title').textContent;
        const verifyBtn = document.createElement('a');
        verifyBtn.className = 'amazon-verify-btn';
        verifyBtn.innerHTML = '<i class="fab fa-amazon"></i> Verify on Amazon';
        verifyBtn.href = generateAmazonSearchUrl(title);
        verifyBtn.target = '_blank';
        
        const cardBody = card.querySelector('.card-body');
        cardBody.appendChild(verifyBtn);
    });
}

// Generate Amazon search URL based on product title
function generateAmazonSearchUrl(productTitle) {
    const searchQuery = encodeURIComponent(productTitle + ' Pakistan');
    return `https://www.amazon.com/s?k=${searchQuery}`;
}

// Utility function for formatting numbers
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Utility function for handling API calls
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Local storage utilities
const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },
    
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
};

// Wishlist functionality
const wishlist = {
    add: (productId) => {
        const wishlistItems = storage.get('wishlist') || [];
        if (!wishlistItems.includes(productId)) {
            wishlistItems.push(productId);
            storage.set('wishlist', wishlistItems);
            wishlist.updateBadge();
            return true;
        }
        return false;
    },
    
    remove: (productId) => {
        let wishlistItems = storage.get('wishlist') || [];
        wishlistItems = wishlistItems.filter(id => id !== productId);
        storage.set('wishlist', wishlistItems);
        wishlist.updateBadge();
        return true;
    },
    
    getAll: () => {
        return storage.get('wishlist') || [];
    },
    
    updateBadge: () => {
        const badge = document.querySelector('.wishlist-badge');
        if (badge) {
            const count = wishlist.getAll().length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
};

function populatePopularDeals() {
    const container = document.getElementById('popular-deals');
    if (!container) return;
    const deals = (window.productData || []).slice(0, 6);
    container.innerHTML = deals.map(d => `
        <div class="col-6 col-md-4 col-lg-2 mb-4">
            <div class="deal-card">
                <div class="thumb"><img src="${d.image}" alt="${d.name}"></div>
                <div class="body">
                    <div class="fw-bold small">${d.name}</div>
                    <div class="small text-muted">$${d.price.toFixed(2)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function populateLatestSuppliers() {
    const container = document.getElementById('latest-suppliers');
    if (!container) return;
    const demo = [
        { 
            name: 'K2 Textiles', 
            category: 'Textiles', 
            city: 'Faisalabad', 
            desc: 'Premium embroidered fabric and home linens', 
            phone: '+92 300 0000001', 
            tags: ['Textiles','Embroidery','Home'],
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop'
        },
        { 
            name: 'Silver Craft', 
            category: 'Jewelry', 
            city: 'Lahore', 
            desc: 'Handmade sterling silver jewelry', 
            phone: '+92 300 0000002', 
            tags: ['Jewelry','Handmade','Sterling'],
            image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop'
        },
        { 
            name: 'Leather Hive', 
            category: 'Leather Goods', 
            city: 'Karachi', 
            desc: 'Bags, wallets and accessories', 
            phone: '+92 300 0000003', 
            tags: ['Leather','Bags','Wallets'],
            image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop'
        },
        { 
            name: 'WoodNest', 
            category: 'Home Decor', 
            city: 'Islamabad', 
            desc: 'Handcrafted wooden decor and gifts', 
            phone: '+92 300 0000004', 
            tags: ['Home Decor','Wood','Handcrafted'],
            image: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=1200&auto=format&fit=crop'
        },
        { 
            name: 'Pak Ceramics', 
            category: 'Home & Kitchen', 
            city: 'Multan', 
            desc: 'Traditional blue pottery and ceramics', 
            phone: '+92 300 0000005', 
            tags: ['Ceramics','Pottery','Handmade'],
            image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=1200&auto=format&fit=crop'
        },
        { 
            name: 'Saffron Delight', 
            category: 'Food & Spices', 
            city: 'Quetta', 
            desc: 'Premium Pakistani saffron and spices', 
            phone: '+92 300 0000006', 
            tags: ['Spices','Saffron','Organic'],
            image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1200&auto=format&fit=crop'
        },
        { 
            name: 'Marble Masters', 
            category: 'Construction', 
            city: 'Peshawar', 
            desc: 'Quality marble and stone products', 
            phone: '+92 300 0000007', 
            tags: ['Marble','Stone','Construction'],
            image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1200&auto=format&fit=crop'
        },
        { 
            name: 'Sport Gear Co', 
            category: 'Sports', 
            city: 'Sialkot', 
            desc: 'Sports equipment and fitness gear', 
            phone: '+92 300 0000008', 
            tags: ['Sports','Fitness','Equipment'],
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop'
        }
    ];
    container.innerHTML = demo.map(s => `
        <div class="col-md-6 col-lg-3 mb-4">
            <div class="supplier-card">
                <div class="verified-badge">
                    <i class="fas fa-check-circle"></i> Verified
                </div>
                <div class="thumb">
                    <img src="${s.image}" alt="${s.name}">
                </div>
                <div class="body">
                    <div class="fw-bold">${s.name}</div>
                    <div class="small text-muted mb-1">${s.category} · ${s.city}</div>
                    <div class="small">${s.desc}</div>
                    <div class="small mt-2 blurred">${s.phone} · info@example.com</div>
                    <button class="btn btn-primary btn-sm mt-2 locked-btn" disabled>Join Now</button>
                    <div class="tags">
                        ${s.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}