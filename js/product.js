// Product data and functionality
const productData = [
    {
        id: 1,
        name: "Premium Leather Handbag",
        price: 175.16, // wholesale price
        rrp: 442.19, // recommended retail price
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        images: [
            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        category: "handbags",
        rating: 4.8,
        ratingCount: 124,
        location: "karachi",
        sellerType: "manufacturer",
        isAmazonChoice: true,
        verified: { amazon: true, ebay: true },
        description: "High-quality genuine leather handbag with multiple compartments and durable zippers. Perfect for professional use.",
        specifications: {
            material: "Genuine Leather",
            dimensions: "12 x 8 x 5 inches",
            color: "Brown",
            weight: "1.2 kg"
        },
        sellerInfo: {
            name: "Leather Crafts Co.",
            rating: 4.7,
            responseTime: "Within 2 hours",
            memberSince: "2020"
        }
    },
    {
        id: 2,
        name: "Handmade Jewelry Set",
        price: 29.99,
        rrp: 39.99,
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        images: [
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        category: "jewelry",
        rating: 4.6,
        ratingCount: 89,
        location: "lahore",
        sellerType: "supplier",
        isAmazonChoice: true,
        verified: { amazon: true, ebay: false },
        description: "Elegant handmade jewelry set with traditional design and premium materials. Includes necklace and earrings.",
        specifications: {
            material: "Sterling Silver",
            type: "Necklace & Earrings Set",
            color: "Silver",
            weight: "45 grams"
        },
        sellerInfo: {
            name: "Traditional Jewelers",
            rating: 4.5,
            responseTime: "Within 1 hour",
            memberSince: "2019"
        }
    },
    {
        id: 3,
        name: "Wooden Home Decor",
        price: 39.99,
        rrp: 49.99,
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        images: [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        category: "home-decor",
        rating: 4.7,
        ratingCount: 67,
        location: "islamabad",
        sellerType: "manufacturer",
        isAmazonChoice: false,
        verified: { amazon: false, ebay: true },
        description: "Handcrafted wooden home decor items with intricate designs and natural finish. Adds elegance to any space.",
        specifications: {
            material: "Solid Wood",
            dimensions: "Various Sizes",
            finish: "Natural",
            care: "Dry cloth cleaning"
        },
        sellerInfo: {
            name: "Wood Artisans",
            rating: 4.8,
            responseTime: "Within 3 hours",
            memberSince: "2021"
        }
    },
    {
        id: 4,
        name: "Traditional Clothing",
        price: 59.99,
        rrp: 74.99,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        images: [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        category: "clothing",
        rating: 4.9,
        ratingCount: 203,
        location: "karachi",
        sellerType: "supplier",
        isAmazonChoice: true,
        verified: { amazon: true, ebay: true },
        description: "Authentic Pakistani traditional clothing with premium fabric and intricate embroidery. Available in various sizes.",
        specifications: {
            material: "Pure Cotton",
            sizes: "S, M, L, XL",
            color: "Multiple Colors",
            care: "Hand wash recommended"
        },
        sellerInfo: {
            name: "Traditional Wear House",
            rating: 4.9,
            responseTime: "Within 1 hour",
            memberSince: "2018"
        }
    },
    {
        id: 5,
        name: "Embroidered Textiles",
        price: 34.99,
        rrp: 45.99,
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "textiles",
        rating: 4.5,
        ratingCount: 56,
        location: "faisalabad",
        sellerType: "manufacturer",
        isAmazonChoice: false,
        verified: { amazon: true, ebay: false },
        description: "Beautiful embroidered textiles with traditional patterns and vibrant colors. Perfect for home decoration.",
        specifications: {
            material: "Cotton Blend",
            dimensions: "60 x 90 inches",
            pattern: "Traditional Embroidery",
            care: "Dry clean only"
        },
        sellerInfo: {
            name: "Textile Masters",
            rating: 4.6,
            responseTime: "Within 4 hours",
            memberSince: "2020"
        }
    },
    {
        id: 6,
        name: "Leather Wallet",
        price: 24.99,
        rrp: 29.99,
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "leather",
        rating: 4.4,
        ratingCount: 78,
        location: "lahore",
        sellerType: "retailer",
        isAmazonChoice: true,
        verified: { amazon: true, ebay: false },
        description: "Genuine leather wallet with multiple card slots and coin compartment. Slim design with RFID protection.",
        specifications: {
            material: "Genuine Leather",
            slots: "8 Card Slots",
            features: "RFID Protection",
            color: "Black"
        },
        sellerInfo: {
            name: "Leather Accessories Co.",
            rating: 4.4,
            responseTime: "Within 2 hours",
            memberSince: "2022"
        }
    },
    {
        id: 7,
        name: "Handmade Footwear",
        price: 44.99,
        rrp: 54.99,
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "footwear",
        rating: 4.7,
        ratingCount: 112,
        location: "karachi",
        sellerType: "manufacturer",
        isAmazonChoice: false,
        verified: { amazon: false, ebay: true },
        description: "Comfortable handmade footwear with traditional design and modern comfort features. Available in multiple colors.",
        specifications: {
            material: "Leather Upper",
            sizes: "6-12",
            sole: "Rubber",
            type: "Traditional"
        },
        sellerInfo: {
            name: "Footwear Artisans",
            rating: 4.7,
            responseTime: "Within 3 hours",
            memberSince: "2019"
        }
    },
    {
        id: 8,
        name: "Sports Equipment",
        price: 69.99,
        rrp: 89.99,
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "sports",
        rating: 4.3,
        ratingCount: 45,
        location: "rawalpindi",
        sellerType: "supplier",
        isAmazonChoice: false,
        verified: { amazon: true, ebay: true },
        description: "High-quality sports equipment for various activities and training needs. Durable and professional grade.",
        specifications: {
            material: "Premium Materials",
            type: "Training Equipment",
            weight: "Varies by item",
            warranty: "1 Year"
        },
        sellerInfo: {
            name: "Sports Gear Pro",
            rating: 4.3,
            responseTime: "Within 6 hours",
            memberSince: "2021"
        }
    },
    {
        id: 9,
        name: "Silk Scarves Collection",
        price: 19.99,
        rrp: 24.99,
        image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "textiles",
        rating: 4.6,
        ratingCount: 89,
        location: "karachi",
        sellerType: "manufacturer",
        isAmazonChoice: true,
        verified: { amazon: true, ebay: true },
        description: "Luxurious silk scarves with traditional prints and vibrant colors. Perfect accessory for any outfit.",
        specifications: {
            material: "Pure Silk",
            dimensions: "35 x 35 inches",
            pattern: "Traditional Print",
            care: "Dry clean only"
        },
        sellerInfo: {
            name: "Silk Traditions",
            rating: 4.7,
            responseTime: "Within 2 hours",
            memberSince: "2019"
        }
    },
    {
        id: 10,
        name: "Handcrafted Pottery",
        price: 32.99,
        rrp: 42.99,
        image: "https://images.unsplash.com/photo-1577937927131-a4c6be1f3ea9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "home-decor",
        rating: 4.8,
        ratingCount: 67,
        location: "lahore",
        sellerType: "manufacturer",
        isAmazonChoice: false,
        verified: { amazon: false, ebay: true },
        description: "Beautiful handcrafted pottery with traditional designs and glazed finish. Unique pieces for home decoration.",
        specifications: {
            material: "Clay Pottery",
            finish: "Glazed",
            type: "Decorative Items",
            care: "Hand wash only"
        },
        sellerInfo: {
            name: "Pottery Artisans",
            rating: 4.8,
            responseTime: "Within 4 hours",
            memberSince: "2020"
        }
    },
    {
        id: 7,
        name: "Designer Leather Tote Bag",
        price: 89.99,
        rrp: 129.99,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        images: [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        category: "handbags",
        rating: 4.7,
        ratingCount: 98,
        location: "karachi",
        sellerType: "manufacturer",
        isAmazonChoice: true,
        verified: { amazon: true, ebay: true },
        description: "Elegant designer tote bag made from premium leather with spacious interior and stylish design.",
        specifications: {
            material: "Premium Leather",
            dimensions: "15 x 12 x 6 inches",
            color: "Black",
            weight: "1.5 kg"
        },
        sellerInfo: {
            name: "Designer Bags Co.",
            rating: 4.8,
            responseTime: "Within 2 hours",
            memberSince: "2019"
        }
    },
    {
        id: 8,
        name: "Vintage Leather Crossbody Bag",
        price: 65.99,
        rrp: 89.99,
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        images: [
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        category: "handbags",
        rating: 4.6,
        ratingCount: 76,
        location: "lahore",
        sellerType: "supplier",
        isAmazonChoice: false,
        verified: { amazon: false, ebay: true },
        description: "Vintage-style crossbody bag with adjustable strap and multiple compartments for daily use.",
        specifications: {
            material: "Genuine Leather",
            dimensions: "10 x 8 x 4 inches",
            color: "Brown",
            weight: "0.8 kg"
        },
        sellerInfo: {
            name: "Vintage Leather Works",
            rating: 4.5,
            responseTime: "Within 3 hours",
            memberSince: "2021"
        }
    }
];

// Global variables for marketplace
let currentPage = 1;
const productsPerPage = 8;
let filteredProducts = [...productData];
let isLoading = false;

// Utility functions
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star text-warning"></i>';
    }
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star text-warning"></i>';
    }
    return stars;
}

function formatLocation(location) {
    const locations = {
        'karachi': 'Karachi',
        'lahore': 'Lahore',
        'islamabad': 'Islamabad',
        'faisalabad': 'Faisalabad',
        'rawalpindi': 'Rawalpindi'
    };
    return locations[location] || location;
}

function formatSellerType(sellerType) {
    const types = {
        'supplier': 'Supplier',
        'retailer': 'Retailer',
        'manufacturer': 'Manufacturer'
    };
    return types[sellerType] || sellerType;
}

// Product functions
function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featured-products');
    if (!featuredContainer) return;
    
    // Amazon Choice items; show multiple & auto-scroll horizontally
    const featuredProducts = productData.filter(p => p.isAmazonChoice);
    if (!featuredProducts.length) {
        featuredContainer.innerHTML = '<div class="text-center text-muted">No featured products available.</div>';
        return;
    }
    
    // Duplicate products for seamless scrolling
    const duplicatedProducts = [...featuredProducts, ...featuredProducts];
    
    const itemsHtml = duplicatedProducts.map(product => {
        const markupPct = product.rrp && product.price ? (((product.rrp - product.price) / product.price) * 100) : 0;
        const markupText = `${markupPct.toFixed(2)}%`;
        return `
            <div class="featured-item">
                <div class="card product-card h-100">
                    <div class="position-relative aspect-9-16">
                        <img src="${product.image}" alt="${product.name}">
                        <span class="markup-badge">${markupText}</span>
                        ${product.isAmazonChoice ? '<span class="amazon-choice-badge">Amazon\'s Choice</span>' : ''}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title mb-1">${product.name}</h6>
                        <div class="rating mb-1">
                            ${generateStarRating(product.rating)}
                            <span class="rating-count">(${product.ratingCount})</span>
                        </div>
                        <div class="small text-muted">RRP: $${(product.rrp || product.price).toFixed(2)}</div>
                        <div class="mb-2 small">
                            <a href="https://www.amazon.co.uk/s?k=${encodeURIComponent(product.name)}" target="_blank" style="text-decoration:none;">
                                <span class="platform-badge amazon" style="background:#212529;color:#fff;padding:4px 8px;border-radius:10px;display:inline-flex;align-items:center;gap:6px;"><i class="fab fa-amazon"></i> Verified on Amazon</span>
                            </a>
                            <span class="mx-1">·</span>
                            <a href="https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(product.name)}" target="_blank" style="text-decoration:none;">
                                <span class="platform-badge ebay" style="background:#212529;color:#fff;padding:4px 8px;border-radius:10px;display:inline-flex;align-items:center;gap:6px;"><i class="fab fa-ebay"></i> Verified on eBay</span>
                            </a>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="price h6 text-primary mb-0">$${product.price.toFixed(2)}</span>
                            <button class="btn btn-primary btn-sm" onclick="viewProductDetail(${product.id})">Details</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    featuredContainer.innerHTML = `
        <div class="amazon-choice-products">
            <div class="featured-scroller">${itemsHtml}</div>
        </div>
    `;

    // Enhanced auto scroll with pause on hover
    setTimeout(() => setupAutoScroll(), 300);
}

function setupAutoScroll() {
    const scroller = document.querySelector('.featured-scroller');
    if (!scroller) return;
    
    let isScrolling = true;
    let scrollSpeed = 0.5;
    let direction = 1;
    let animationId;
    
    function scroll() {
        if (!isScrolling) {
            animationId = requestAnimationFrame(scroll);
            return;
        }
        
        scroller.scrollLeft += scrollSpeed * direction;
        
        // Check if we need to reverse direction or reset
        if (scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2) {
            direction = -1;
        } else if (scroller.scrollLeft <= 0) {
            direction = 1;
        }
        
        animationId = requestAnimationFrame(scroll);
    }
    
    // Start scrolling
    animationId = requestAnimationFrame(scroll);
    
    // Pause on hover
    scroller.addEventListener('mouseenter', () => {
        isScrolling = false;
    });
    
    // Resume on mouse leave
    scroller.addEventListener('mouseleave', () => {
        isScrolling = true;
    });
    
    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    scroller.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isScrolling = false;
    });
    
    scroller.addEventListener('touchend', () => {
        setTimeout(() => {
            isScrolling = true;
        }, 2000); // Resume after 2 seconds
    });
}

function loadMarketplaceProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    console.log('Loading marketplace products...');
    
    renderProducts();
    updateProductCount();
}

function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    const startIndex = 0;
    const endIndex = currentPage * productsPerPage;
    const productsToShow = filteredProducts.slice(0, endIndex);
    
    console.log('Rendering products:', productsToShow.length);
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-12 text-center">
                <div class="py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No products found</h4>
                    <p class="text-muted">Try adjusting your filters or search terms</p>
                    <button class="btn btn-primary" onclick="resetFilters()">Reset Filters</button>
                </div>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = productsToShow.map(product => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card product-card h-100">
                <div class="position-relative">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}" style="height: 250px; object-fit: cover;">
                    ${product.isAmazonChoice ? '<span class="amazon-choice-badge">Amazon\'s Choice</span>' : ''}
                    ${(() => { const m = product.rrp && product.price ? (((product.rrp - product.price)/product.price)*100) : 0; return `<span class=\"markup-badge\">${m.toFixed(2)}%</span>`; })()}
                    <div class="product-actions">
                        <button class="btn btn-light btn-sm" title="Add to Wishlist" onclick="addToWishlist(${product.id})">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="btn btn-light btn-sm" title="Quick View" onclick="quickView(${product.id})">
                            <i class="far fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.name}</h5>
                    <div class="rating mb-2">
                        ${generateStarRating(product.rating)}
                        <span class="rating-count">(${product.ratingCount})</span>
                    </div>
                    <p class="card-text text-medium flex-grow-1">${product.description.substring(0, 100)}...</p>
                    <div class="small text-muted mb-2">
                        RRP: $${(product.rrp || product.price).toFixed(2)} · Profit: ${product.rrp ? Math.round(((product.rrp - product.price) / product.rrp) * 100) : 0}%
                    </div>
                    <div class="mb-2 small">
                        <a href="https://www.amazon.co.uk/s?k=${encodeURIComponent(product.name)}" target="_blank" style="text-decoration:none;">
                            <span class="platform-badge amazon" style="background:#212529;color:#fff;padding:4px 8px;border-radius:10px;display:inline-flex;align-items:center;gap:6px;"><i class="fab fa-amazon"></i> Verified on Amazon</span>
                        </a>
                        <span class="mx-1">·</span>
                        <a href="https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(product.name)}" target="_blank" style="text-decoration:none;">
                            <span class="platform-badge ebay" style="background:#212529;color:#fff;padding:4px 8px;border-radius:10px;display:inline-flex;align-items:center;gap:6px;"><i class="fab fa-ebay"></i> Verified on eBay</span>
                        </a>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="price h5 text-primary">$${product.price.toFixed(2)}</span>
                        <button class="btn btn-primary btn-sm" onclick="viewProductDetail(${product.id})">View Details</button>
                    </div>
                    <div class="product-meta mt-2">
                        <span><i class="fas fa-map-marker-alt"></i> ${formatLocation(product.location)}</span>
                        <span>${formatSellerType(product.sellerType)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function viewProductDetail(productId) {
    // Store product data in sessionStorage for the detail page
    const product = productData.find(p => p.id === productId);
    if (product) {
        sessionStorage.setItem('currentProduct', JSON.stringify(product));
        window.location.href = `product-detail.html?id=${productId}`;
    }
}

async function handleContact(productId) {
    const product = productData.find(p => p.id === productId);
    if (!product) return;
    // Require Rs 1000 payment to contact
    const ok = await (window.payments?.requireAccess('contact') || Promise.resolve(true));
    if (!ok) return;
    // After payment, go to detail; WhatsApp button on detail will open chat
    viewProductDetail(productId);
}

function quickView(productId) {
    const product = productData.find(p => p.id === productId);
    if (!product) return;
    
    // Create quick view modal
    const modalHtml = `
        <div class="modal fade" id="quickViewModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${product.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <img src="${product.image}" class="img-fluid rounded" alt="${product.name}">
                            </div>
                            <div class="col-md-6">
                                <div class="rating mb-2">
                                    ${generateStarRating(product.rating)}
                                    <span class="rating-count">(${product.ratingCount} reviews)</span>
                                </div>
                                <h4 class="price text-primary">$${product.price.toFixed(2)}</h4>
                                <p class="text-medium">${product.description}</p>
                                <div class="product-specs">
                                    <h6>Specifications:</h6>
                                    <ul class="list-unstyled">
                                        ${Object.entries(product.specifications || {}).map(([key, value]) => 
                                            `<li><strong>${key}:</strong> ${value}</li>`
                                        ).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="viewProductDetail(${product.id})">View Full Details</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('quickViewModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body and show it
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('quickViewModal'));
    modal.show();
}

function addToWishlist(productId) {
    // Simple wishlist functionality
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        
        // Show success message
        alert('Product added to wishlist!');
    } else {
        alert('Product already in wishlist!');
    }
}

// Filter functions
function setupFilters() {
    const priceSlider = document.querySelector('.price-filter');
    const minPriceDisplay = document.getElementById('min-price');
    const maxPriceDisplay = document.getElementById('max-price');
    
    if (priceSlider && minPriceDisplay) {
        // Set initial values
        minPriceDisplay.textContent = priceSlider.value;
        maxPriceDisplay.textContent = priceSlider.max;
        
        priceSlider.addEventListener('input', function() {
            minPriceDisplay.textContent = this.value;
        });
    }
    
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
}

function applyFilters() {
    const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked'))
        .map(checkbox => checkbox.value);
    
    const maxPrice = parseInt(document.querySelector('.price-filter').value);
    const selectedLocation = document.querySelector('.location-filter').value;
    
    const selectedSellerTypes = Array.from(document.querySelectorAll('.seller-filter:checked'))
        .map(checkbox => checkbox.value);
    
    const selectedRatings = Array.from(document.querySelectorAll('.rating-filter:checked'))
        .map(checkbox => parseInt(checkbox.value));
    
    filteredProducts = productData.filter(product => {
        if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
            return false;
        }
        
        if (product.price > maxPrice) {
            return false;
        }
        
        if (selectedLocation !== 'all' && product.location !== selectedLocation) {
            return false;
        }
        
        if (selectedSellerTypes.length > 0 && !selectedSellerTypes.includes(product.sellerType)) {
            return false;
        }
        
        if (selectedRatings.length > 0) {
            const minRating = Math.min(...selectedRatings);
            if (product.rating < minRating) {
                return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    renderProducts();
    updateProductCount();
}

function resetFilters() {
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    const priceSlider = document.querySelector('.price-filter');
    if (priceSlider) {
        priceSlider.value = 500;
    }
    
    document.getElementById('min-price').textContent = '10';
    document.getElementById('max-price').textContent = '500';
    
    document.querySelector('.location-filter').value = 'all';
    
    document.querySelectorAll('.seller-filter').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    document.querySelectorAll('.rating-filter').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    filteredProducts = [...productData];
    currentPage = 1;
    renderProducts();
    updateProductCount();
}

function sortProducts(sortBy) {
    switch(sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => b.id - a.id);
            break;
        default:
            filteredProducts.sort((a, b) => {
                if (a.isAmazonChoice && !b.isAmazonChoice) return -1;
                if (!a.isAmazonChoice && b.isAmazonChoice) return 1;
                return b.rating - a.rating;
            });
            break;
    }
}

function updateProductCount() {
    const productCount = document.getElementById('product-count');
    if (productCount) {
        productCount.textContent = `Showing ${Math.min(filteredProducts.length, currentPage * productsPerPage)} of ${filteredProducts.length} products`;
    }
}

function setupInfiniteScroll() {
    window.addEventListener('scroll', function() {
        if (isLoading) return;
        
        const loadingIndicator = document.getElementById('loading-indicator');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (scrollTop + windowHeight >= documentHeight - 100) {
            if (currentPage * productsPerPage < filteredProducts.length) {
                isLoading = true;
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'block';
                }
                
                setTimeout(() => {
                    currentPage++;
                    renderProducts();
                    updateProductCount();
                    isLoading = false;
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                }, 1000);
            }
        }
    });
}

// Initialize product-related functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing products...');
    
    // Load products on appropriate pages
    if (document.getElementById('featured-products')) {
        console.log('Found featured products container');
        loadFeaturedProducts();
    }
    
    if (document.getElementById('products-grid')) {
        console.log('Found products grid container');
        // Try backend first
        (async () => {
            try {
                if (window.API) {
                    const rows = await API.products();
                    if (rows?.length) {
                        filteredProducts = rows.map(r => ({
                            id: r.id,
                            name: r.name,
                            price: r.price,
                            rrp: r.rrp || r.price,
                            image: r.image || 'img/projects-1.jpg',
                            category: r.category,
                            rating: 4.5,
                            ratingCount: 10,
                            location: 'karachi',
                            sellerType: 'supplier',
                            isAmazonChoice: false,
                            verified: { amazon: !!r.verifiedAmazon, ebay: !!r.verifiedEbay },
                            description: r.description || '',
                            sellerInfo: { name: 'Verified Seller' }
                        }));
                    }
                }
            } catch (e) { console.warn('Backend unavailable, using local data'); }
            loadMarketplaceProducts();
            setupFilters();
            setupInfiniteScroll();
            const sortSelect = document.querySelector('.sort-select');
            if (sortSelect) {
                sortSelect.addEventListener('change', function() {
                    sortProducts(this.value);
                    renderProducts();
                });
            }
        })();
    }
    
    // Check if products are loading
    console.log('Product data available:', productData.length, 'products');
});

// Expose product data for other scripts (e.g., popular deals)
window.productData = productData;