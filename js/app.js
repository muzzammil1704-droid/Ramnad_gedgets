const app = {
            products: [],
            cart: [],
            currentStep: 1,
            currentCategory: 'all',
            
            baseUrl: 'data/',
            
            jsonFiles: {
                all: 'all.json',
                smartwatch: 'smartwatches.json',
                earbuds: 'earbuds.json',
                headphone: 'headphones.json',
                speaker: 'speakers.json'
            },

            async init() {
                // Always try to load from JSON first for reliability
                try {
                    await this.fetchProducts('all');
                } catch (e) {
                    console.error('JSON load failed, trying localStorage', e);
                    const saved = this.loadFromLocalStorage();
                    if (saved && saved.length > 0) {
                        this.products = saved;
                        this.renderProducts('all');
                    }
                }
                this.updateCartBadge();
            },

            async fetchProducts(category) {
                const grid = document.getElementById('products-grid');
                grid.innerHTML = `
                    <div class="col-span-3 text-center py-16">
                        <div class="loader"></div>
                        <p class="text-gray-400 mt-4">Loading products...</p>
                    </div>`;

                try {
                    const fileName = this.jsonFiles[category] || this.jsonFiles.all;
                    const response = await fetch(this.baseUrl + fileName);
                    
                    if (!response.ok) throw new Error('Failed to load products');
                    
                    const data = await response.json();
                    this.products = data;
                    this.currentCategory = category;
                    this.renderProducts(category);
                } catch (error) {
                    console.error('Error loading products:', error);
                    grid.innerHTML = `
                        <div class="col-span-3 text-center py-16">
                            <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-exclamation-triangle text-3xl text-red-300"></i>
                            </div>
                            <p class="text-gray-500 mb-2">Failed to load products.</p>
                            <button onclick="app.fetchProducts('${category}')" class="text-blue-600 underline">Retry</button>
                        </div>`;
                }
            },

            formatPrice(price) {
                return '₹' + price.toLocaleString('en-IN');
            },

            renderProducts(filter = 'all') {
                const grid = document.getElementById('products-grid');
                
                if (this.products.length === 0) {
                    grid.innerHTML = `
                        <div class="col-span-3 text-center py-16">
                            <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-box-open text-3xl text-blue-300"></i>
                            </div>
                            <p class="text-gray-400 text-lg font-medium">Coming Soon!</p>
                            <p class="text-gray-400 text-sm mt-1">Products in this category will be added soon.</p>
                        </div>`;
                    return;
                }

                grid.innerHTML = this.products.map((product, idx) => {
                    const discount = Math.round(((product.original - product.price) / product.original) * 100);
                    const hasVideo = product.video ? true : false;
                    const images = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
                    const hasGallery = images.length > 1;
                    
                    let mediaHtml = '';
                    // Prefer photo gallery when multiple images exist (so photos always show)
                    // If video also exists, show VIDEO badge on the gallery
                    if (hasGallery) {
                        const slides = images.map((src, i) => `
                            <div class="card-gallery-slide ${i === 0 ? 'active' : ''}">
                                <img src="${src}" alt="${product.name}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/400x400/f1f5f9/64748b?text=${encodeURIComponent(product.name)}'">
                            </div>
                        `).join('');
                        const dots = images.map((_, i) => `
                            <span class="card-gallery-dot ${i === 0 ? 'active' : ''}"></span>
                        `).join('');
                        mediaHtml = `
                            <div class="card-gallery" data-index="${idx}" data-count="${images.length}">
                                <div class="card-gallery-track">
                                    ${slides}
                                </div>
                                <div class="card-gallery-dots">
                                    ${dots}
                                </div>
                                ${hasVideo ? `<div class="video-badge"><i class="fas fa-video"></i> VIDEO</div>` : ''}
                            </div>`;
                    } else if (hasVideo) {
                        mediaHtml = `
                            <div class="video-container">
                                <video class="product-video" muted loop playsinline preload="metadata" onmouseover="this.play()" onmouseout="this.pause()">
                                    <source src="${product.video}" type="video/mp4">
                                </video>
                                <div class="video-badge">
                                    <i class="fas fa-video"></i> VIDEO
                                </div>
                                <div class="video-play-icon">
                                    <i class="fas fa-play text-blue-600 text-xl"></i>
                                </div>
                            </div>`;
                    } else {
                        mediaHtml = `
                            <img src="${images[0] || product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='https://via.placeholder.com/400x400/f1f5f9/64748b?text=${encodeURIComponent(product.name)}'">`;
                    }
                    
                    return `
                    <div class="product-card group" onclick="app.showProductDetail(${idx})">
                        <div class="product-image-container">
                            ${mediaHtml}
                            <div class="discount-float">
                                <i class="fas fa-tags"></i> -${discount}% OFF
                            </div>
                            <button onclick="event.stopPropagation(); app.addToCart(${idx})" class="add-to-cart-btn">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                        </div>
                        <div class="p-5">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-xs font-medium text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-1 rounded-full">${product.category}</span>
                                <div class="flex text-yellow-400 text-xs">
                                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                                </div>
                            </div>
                            <h4 class="font-heading font-semibold text-lg mb-1 text-gray-900">${product.name}</h4>
                            <p class="text-gray-500 text-sm mb-3">${product.desc}</p>
                            <div class="flex items-center justify-between">
                                <div>
                                    <span class="text-xl font-bold text-blue-600">${this.formatPrice(product.price)}</span>
                                    <span class="text-sm text-gray-400 line-through ml-2">${this.formatPrice(product.original)}</span>
                                </div>
                                <button onclick="event.stopPropagation(); app.addToCart(${idx})" class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
                }).join('');
                
                // Start auto-slideshow for card galleries
                this.startCardGalleries();
            },

            startCardGalleries() {
                // Clear previous intervals
                if (this._cardGalleryIntervals) {
                    this._cardGalleryIntervals.forEach(clearInterval);
                }
                this._cardGalleryIntervals = [];
                
                document.querySelectorAll('.card-gallery').forEach(gallery => {
                    const slides = gallery.querySelectorAll('.card-gallery-slide');
                    const dots = gallery.querySelectorAll('.card-gallery-dot');
                    if (slides.length <= 1) return;
                    
                    let current = 0;
                    const interval = setInterval(() => {
                        slides[current].classList.remove('active');
                        dots[current].classList.remove('active');
                        current = (current + 1) % slides.length;
                        slides[current].classList.add('active');
                        dots[current].classList.add('active');
                    }, 2500); // change every 2.5 seconds
                    
                    this._cardGalleryIntervals.push(interval);
                });
            },

            showProductDetail(index) {
                const product = this.products[index];
                const discount = Math.round(((product.original - product.price) / product.original) * 100);
                
                // Media container - Video + Image Gallery (both show when available)
                const mediaContainer = document.getElementById('modal-media-container');
                const hasVideo = product.video ? true : false;
                const images = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
                
                // Build combined media list: video first (if any), then photos
                const mediaItems = [];
                if (hasVideo) {
                    mediaItems.push({ type: 'video', src: product.video });
                }
                images.forEach(src => mediaItems.push({ type: 'image', src }));
                
                if (mediaItems.length > 1) {
                    // Combined swipeable gallery (video + photos)
                    const slides = mediaItems.map((item, i) => {
                        if (item.type === 'video') {
                            return `
                                <div class="gallery-slide">
                                    <div class="video-container h-full">
                                        <video class="product-video" muted loop playsinline controls ${i === 0 ? 'autoplay' : ''}>
                                            <source src="${item.src}" type="video/mp4">
                                            Your browser does not support the video tag.
                                        </video>
                                        <div class="video-badge"><i class="fas fa-video"></i> VIDEO</div>
                                    </div>
                                </div>`;
                        }
                        return `
                            <div class="gallery-slide">
                                <img src="${item.src}" alt="${product.name} - ${i+1}" onerror="this.src='https://via.placeholder.com/400x400/f1f5f9/64748b?text=${encodeURIComponent(product.name)}'">
                            </div>`;
                    }).join('');
                    
                    const dots = mediaItems.map((item, i) => `
                        <button class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}" onclick="app.goToSlide(${i})" title="${item.type === 'video' ? 'Video' : 'Photo ' + i}">
                            ${item.type === 'video' ? '<i class="fas fa-video text-xs"></i>' : ''}
                        </button>
                    `).join('');
                    
                    mediaContainer.innerHTML = `
                        <div class="gallery-wrapper h-full">
                            <div class="gallery-track" id="gallery-track">
                                ${slides}
                            </div>
                            <button class="gallery-nav prev" onclick="app.prevSlide()">
                                <i class="fas fa-chevron-left text-gray-700"></i>
                            </button>
                            <button class="gallery-nav next" onclick="app.nextSlide()">
                                <i class="fas fa-chevron-right text-gray-700"></i>
                            </button>
                            <div class="gallery-dots" id="gallery-dots">
                                ${dots}
                            </div>
                            <button onclick="app.closeProductModal()" class="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors md:hidden z-20">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    
                    // Track current slide + sync dots + pause/play video
                    this._galleryIndex = 0;
                    this._galleryCount = mediaItems.length;
                    const track = document.getElementById('gallery-track');
                    if (track) {
                        track.addEventListener('scroll', () => {
                            const idx = Math.round(track.scrollLeft / track.clientWidth);
                            if (idx !== this._galleryIndex) {
                                this._galleryIndex = idx;
                                this.updateGalleryDots();
                                this.handleGalleryVideo(idx);
                            }
                        });
                    }
                    // Ensure first video plays
                    this.handleGalleryVideo(0);
                } else if (hasVideo) {
                    // Only video
                    mediaContainer.innerHTML = `
                        <div class="video-container h-full">
                            <video class="product-video" autoplay muted loop playsinline controls>
                                <source src="${product.video}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                            <button onclick="app.closeProductModal()" class="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors md:hidden z-20">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                } else if (images.length === 1) {
                    // Single image
                    const imgSrc = images[0] || product.image;
                    mediaContainer.innerHTML = `
                        <img id="modal-product-image" src="${imgSrc}" class="w-full h-full object-cover" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400x400/f1f5f9/64748b?text=${encodeURIComponent(product.name)}'">
                        <button onclick="app.closeProductModal()" class="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors md:hidden z-20">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                } else {
                    // Fallback empty
                    mediaContainer.innerHTML = `
                        <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                            <i class="fas fa-image text-4xl text-gray-300"></i>
                        </div>
                    `;
                }
                
                document.getElementById('modal-product-category').textContent = product.category;
                document.getElementById('modal-product-name').textContent = product.name;
                document.getElementById('modal-product-desc').textContent = product.desc;
                document.getElementById('modal-product-price').textContent = this.formatPrice(product.price);
                document.getElementById('modal-product-original').textContent = this.formatPrice(product.original);
                document.getElementById('modal-product-discount').textContent = `-${discount}% OFF`;
                
                document.getElementById('modal-add-to-cart').onclick = () => { 
                    this.addToCart(index); 
                    this.closeProductModal(); 
                };
                
                document.getElementById('modal-whatsapp-enquire').onclick = () => {
                    this.enquireWhatsApp(product);
                };
                
                const modal = document.getElementById('product-modal');
                const content = modal.querySelector('.modal-content');
                modal.classList.remove('hidden');
                setTimeout(() => { 
                    content.classList.remove('scale-95', 'opacity-0'); 
                    content.classList.add('scale-100', 'opacity-100'); 
                }, 10);
            },

            goToSlide(index) {
                const track = document.getElementById('gallery-track');
                if (!track) return;
                this._galleryIndex = index;
                track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
                this.updateGalleryDots();
                this.handleGalleryVideo(index);
            },

            nextSlide() {
                if (this._galleryIndex < this._galleryCount - 1) {
                    this.goToSlide(this._galleryIndex + 1);
                } else {
                    this.goToSlide(0);
                }
            },

            prevSlide() {
                if (this._galleryIndex > 0) {
                    this.goToSlide(this._galleryIndex - 1);
                } else {
                    this.goToSlide(this._galleryCount - 1);
                }
            },

            updateGalleryDots() {
                const dots = document.querySelectorAll('#gallery-dots .gallery-dot');
                dots.forEach((dot, i) => {
                    if (i === this._galleryIndex) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            },

            handleGalleryVideo(activeIndex) {
                const track = document.getElementById('gallery-track');
                if (!track) return;
                const slides = track.querySelectorAll('.gallery-slide');
                slides.forEach((slide, i) => {
                    const video = slide.querySelector('video');
                    if (video) {
                        if (i === activeIndex) {
                            video.play().catch(() => {});
                        } else {
                            video.pause();
                        }
                    }
                });
            },

            closeProductModal() {
                const modal = document.getElementById('product-modal');
                const content = modal.querySelector('.modal-content');
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    // Stop any playing videos
                    const videos = modal.querySelectorAll('video');
                    videos.forEach(v => v.pause());
                }, 300);
            },

            enquireWhatsApp(product) {
                const message = `Hi, I'm interested in this product:%0A%0A*${product.name}*%0ACategory: ${product.category}%0APrice: ${this.formatPrice(product.price)}%0AOriginal: ${this.formatPrice(product.original)}%0A%0ACan you provide more details?`;
                window.open(`https://wa.me/917092427154?text=${message}`, '_blank');
                this.showToast('Opening WhatsApp...');
            },

            addToCart(index) {
                const product = this.products[index];
                const existing = this.cart.find(item => item.name === product.name);
                if (existing) { 
                    existing.quantity++; 
                } else { 
                    this.cart.push({ ...product, quantity: 1 }); 
                }
                this.updateCartBadge();
                this.showToast(`${product.name} added to cart`);
            },

            updateCartBadge() {
                const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
                const badge = document.getElementById('cart-badge');
                if (count > 0) { 
                    badge.textContent = count; 
                    badge.classList.remove('hidden'); 
                } else { 
                    badge.classList.add('hidden'); 
                }
            },

            showCart() {
                if (this.cart.length === 0) { 
                    this.showToast('Your cart is empty'); 
                    return; 
                }
                this.openCheckout();
            },

            openCheckout() {
                this.currentStep = 1;
                this.renderCheckoutItems();
                this.updateSteps();
                const overlay = document.getElementById('checkout-overlay');
                const content = document.getElementById('checkout-content');
                overlay.classList.remove('hidden');
                setTimeout(() => { 
                    content.classList.remove('scale-95', 'opacity-0'); 
                    content.classList.add('scale-100', 'opacity-100'); 
                }, 10);
            },

            closeCheckout() {
                const overlay = document.getElementById('checkout-overlay');
                const content = document.getElementById('checkout-content');
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            },

            renderCheckoutItems() {
                const container = document.getElementById('checkout-items');
                const emptyMsg = document.getElementById('empty-cart-msg');
                const summary = document.getElementById('cart-summary');
                const continueBtn = document.getElementById('continue-btn');
                const countEl = document.getElementById('cart-item-count');
                
                if (this.cart.length === 0) {
                    container.innerHTML = '';
                    emptyMsg.classList.remove('hidden');
                    summary.classList.add('hidden');
                    continueBtn.classList.add('hidden');
                    countEl.textContent = '0 items';
                    return;
                }
                
                emptyMsg.classList.add('hidden');
                summary.classList.remove('hidden');
                continueBtn.classList.remove('hidden');
                
                const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
                countEl.textContent = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
                
                const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                
                container.innerHTML = this.cart.map((item, idx) => `
                    <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <img src="${item.image}" class="w-16 h-16 rounded-lg object-cover bg-gray-100">
                        <div class="flex-1">
                            <h4 class="font-medium text-gray-900">${item.name}</h4>
                            <p class="text-xs text-gray-500">${item.category}</p>
                            <div class="flex items-center gap-3 mt-2">
                                <button onclick="app.updateQuantity(${idx}, -1)" class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">-</button>
                                <span class="font-medium w-6 text-center">${item.quantity}</span>
                                <button onclick="app.updateQuantity(${idx}, 1)" class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">+</button>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-blue-600">${this.formatPrice(item.price * item.quantity)}</p>
                            <button onclick="app.removeItem(${idx})" class="text-xs text-red-500 hover:text-red-700 mt-1">Remove</button>
                        </div>
                    </div>`).join('');
                    
                document.getElementById('checkout-subtotal').textContent = this.formatPrice(subtotal);
                document.getElementById('checkout-total').textContent = this.formatPrice(subtotal);
            },

            updateQuantity(idx, change) {
                this.cart[idx].quantity += change;
                if (this.cart[idx].quantity <= 0) this.cart.splice(idx, 1);
                this.updateCartBadge();
                this.renderCheckoutItems();
            },

            removeItem(idx) {
                this.cart.splice(idx, 1);
                this.updateCartBadge();
                this.renderCheckoutItems();
            },

            goToStep(step) {
                document.querySelectorAll('.checkout-step').forEach(el => el.classList.add('hidden'));
                document.getElementById(`checkout-step-${step}`).classList.remove('hidden');
                this.currentStep = step;
                this.updateSteps();
                if (step === 3) this.renderConfirmation();
            },

            updateSteps() {
                [1, 2, 3].forEach(i => {
                    const el = document.getElementById(`step-${i}`);
                    el.className = 'step';
                    if (i < this.currentStep) {
                        el.classList.add('completed');
                        el.innerHTML = '<i class="fas fa-check text-sm"></i>';
                        if (document.getElementById(`progress-${i}`)) document.getElementById(`progress-${i}`).style.width = '100%';
                    } else if (i === this.currentStep) { 
                        el.classList.add('active'); 
                        el.textContent = i; 
                    } else { 
                        el.classList.add('pending'); 
                        el.textContent = i; 
                    }
                });
            },

            renderConfirmation() {
                const name = document.getElementById('addr-name').value;
                const phone = document.getElementById('addr-phone').value;
                const email = document.getElementById('addr-email').value;
                const street = document.getElementById('addr-street').value;
                const city = document.getElementById('addr-city').value;
                const pincode = document.getElementById('addr-pincode').value;
                const state = document.getElementById('addr-state').value;
                const notes = document.getElementById('addr-notes').value;
                
                document.getElementById('confirm-address').innerHTML = `
                    <p class="font-semibold">${name}</p><p>${phone}</p>${email ? `<p>${email}</p>` : ''}
                    <p class="mt-2">${street}</p><p>${city}, ${state} - ${pincode}</p>
                    ${notes ? `<p class="mt-2 italic">Note: ${notes}</p>` : ''}`;
                    
                const container = document.getElementById('confirm-items');
                container.innerHTML = this.cart.map(item => `
                    <div class="flex justify-between py-2 border-b border-gray-100">
                        <span>${item.name} × ${item.quantity}</span>
                        <span class="font-medium">${this.formatPrice(item.price * item.quantity)}</span>
                    </div>`).join('');
                    
                const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                document.getElementById('confirm-total').textContent = this.formatPrice(total);
            },

            placeOrder() {
                const name = document.getElementById('addr-name').value;
                const phone = document.getElementById('addr-phone').value;
                const email = document.getElementById('addr-email').value;
                const street = document.getElementById('addr-street').value;
                const city = document.getElementById('addr-city').value;
                const pincode = document.getElementById('addr-pincode').value;
                const state = document.getElementById('addr-state').value;
                const notes = document.getElementById('addr-notes').value;
                
                let message = `*New Order - RAMNADGADGETS*%0A%0A*Customer:*%0AName: ${name}%0APhone: ${phone}%0A`;
                if (email) message += `Email: ${email}%0A`;
                message += `%0A*Delivery Address:*%0A${street}%0A${city}, ${state} - ${pincode}%0A`;
                if (notes) message += `%0ANote: ${notes}%0A`;
                message += `%0A*Order Items:*%0A`;
                
                this.cart.forEach((item, i) => {
                    message += `${i+1}. ${item.name}%0A   Qty: ${item.quantity} | ${this.formatPrice(item.price)} each%0A   Subtotal: ${this.formatPrice(item.price * item.quantity)}%0A%0A`;
                });
                
                const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                message += `*Total: ${this.formatPrice(total)}*%0APayment: Cash on Delivery`;
                
                window.open(`https://wa.me/917092427154?text=${message}`, '_blank');
                this.showToast('Opening WhatsApp...');
                
                setTimeout(() => { 
                    this.cart = []; 
                    this.updateCartBadge(); 
                    this.closeCheckout(); 
                    this.showToast('Order sent!'); 
                }, 2000);
            },

            showModal(type) {
                const content = document.getElementById('modal-content');
                const overlay = document.getElementById('modal-overlay');
                let html = '';
                
                if (type === 'search') {
                    html = `<div class="flex justify-between items-center mb-4"><h3 class="font-heading text-xl font-bold">Search Products</h3><button onclick="app.closeModal()" class="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"><i class="fas fa-times"></i></button></div>
                    <div class="relative mb-4"><input type="text" class="form-input pl-10" placeholder="Search products..." onkeyup="app.handleSearch(this.value)"><i class="fas fa-search absolute left-4 top-3.5 text-gray-400"></i></div>
                    <div id="search-results" class="space-y-2 max-h-60 overflow-y-auto"></div>`;
                } else if (type === 'menu') {
                    html = `<div class="flex justify-between items-center mb-6"><h3 class="font-heading text-xl font-bold">Menu</h3><button onclick="app.closeModal()" class="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"><i class="fas fa-times"></i></button></div>
                    <nav class="space-y-2">
                        <a href="#" onclick="app.closeModal(); app.goHome()" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"><span class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><i class="fas fa-home text-purple-600"></i></span> Home</a>
                        <a href="#" onclick="app.closeModal(); app.filterCategory('smartwatch')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"><span class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><i class="fas fa-clock text-blue-600"></i></span> Smart Watches</a>
                        <a href="#" onclick="app.closeModal(); app.filterCategory('headphone')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"><span class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><i class="fas fa-headphones-alt text-blue-600"></i></span> Headphones</a>
                        <a href="#" onclick="app.closeModal(); app.filterCategory('earbuds')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"><span class="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center"><i class="fas fa-headphones text-pink-600"></i></span> Earbuds</a>
                        <a href="#" onclick="app.closeModal(); app.filterCategory('speaker')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"><span class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><i class="fas fa-volume-up text-green-600"></i></span> Speakers</a>
                        <a href="#" onclick="app.closeModal(); app.showCart()" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"><span class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><i class="fas fa-shopping-cart text-blue-600"></i></span> Cart</a>
                        <a href="https://wa.me/917092427154" target="_blank" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"><span class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><i class="fab fa-whatsapp text-green-600"></i></span> Contact Us</a>
                        <a href="#" onclick="app.closeModal(); app.openAdmin()" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"><span class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><i class="fas fa-cog text-gray-600"></i></span> Admin</a>
                    </nav>`;
                } else if (type === 'orders') {
                    html = `<div class="flex justify-between items-center mb-4"><h3 class="font-heading text-xl font-bold">My Orders</h3><button onclick="app.closeModal()" class="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"><i class="fas fa-times"></i></button></div>
                    <div class="text-center py-8 text-gray-400"><div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><i class="fas fa-box text-3xl text-gray-300"></i></div><p>No orders yet.</p><button onclick="app.closeModal(); app.scrollToProducts()" class="mt-4 text-blue-600 font-medium hover:underline">Browse Products</button></div>`;
                }
                
                content.innerHTML = html;
                overlay.classList.remove('hidden');
                setTimeout(() => { 
                    content.classList.remove('scale-95', 'opacity-0'); 
                    content.classList.add('scale-100', 'opacity-100'); 
                }, 10);
            },

            closeModal() {
                const content = document.getElementById('modal-content');
                const overlay = document.getElementById('modal-overlay');
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            },

            handleSearch(query) {
                const results = document.getElementById('search-results');
                if (!query.trim()) { 
                    results.innerHTML = ''; 
                    return; 
                }
                
                const filtered = this.products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
                
                if (filtered.length === 0) { 
                    results.innerHTML = '<p class="text-center text-gray-400 py-4">No products found</p>'; 
                    return; 
                }
                
                results.innerHTML = filtered.map(p => {
                    const idx = this.products.indexOf(p);
                    return `<div class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors" onclick="app.closeModal(); app.showProductDetail(${idx})">
                        <img src="${p.image}" class="w-12 h-12 rounded-lg object-cover bg-gray-100">
                        <div class="flex-1"><p class="font-medium text-gray-900">${p.name}</p><p class="text-sm text-blue-600">${this.formatPrice(p.price)}</p></div>
                    </div>`;
                }).join('');
            },

            filterCategory(cat) {
                this.fetchProducts(cat);
                document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
                const map = { all: 'btn-all', smartwatch: 'btn-smartwatch', headphone: 'btn-headphone', earbuds: 'btn-earbuds', speaker: 'btn-speaker' };
                if (map[cat]) document.getElementById(map[cat]).classList.add('active');
            },

            showToast(msg) {
                const toast = document.getElementById('toast');
                document.getElementById('toast-message').textContent = msg;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            },


            // ========== ADMIN PANEL ==========
            adminPassword: 'ramnad123',
            editingIndex: -1,
            originalProducts: null,

            openAdmin() {
                const modal = document.getElementById('admin-modal');
                const content = document.getElementById('admin-content');
                modal.classList.remove('hidden');
                setTimeout(() => {
                    content.classList.remove('scale-95', 'opacity-0');
                    content.classList.add('scale-100', 'opacity-100');
                }, 10);
                // Check if already logged in this session
                if (sessionStorage.getItem('adminLoggedIn') === 'true') {
                    document.getElementById('admin-login').classList.add('hidden');
                    document.getElementById('admin-dashboard').classList.remove('hidden');
                    this.renderAdminList();
                }
            },

            closeAdmin() {
                const modal = document.getElementById('admin-modal');
                const content = document.getElementById('admin-content');
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => modal.classList.add('hidden'), 300);
            },

            adminLogin() {
                const pass = document.getElementById('admin-password').value;
                if (pass === this.adminPassword) {
                    sessionStorage.setItem('adminLoggedIn', 'true');
                    document.getElementById('admin-login').classList.add('hidden');
                    document.getElementById('admin-dashboard').classList.remove('hidden');
                    this.renderAdminList();
                    this.showToast('Admin logged in');
                } else {
                    this.showToast('Wrong password!');
                }
            },

            renderAdminList() {
                const list = document.getElementById('admin-product-list');
                if (!this.products.length) {
                    list.innerHTML = '<p class="text-gray-500">No products</p>';
                    return;
                }
                list.innerHTML = this.products.map((p, i) => `
                    <div class="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4">
                        <img src="${p.image || (p.images && p.images[0]) || ''}" class="w-16 h-16 object-cover rounded-lg" onerror="this.src='https://via.placeholder.com/64'">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-gray-900 truncate">${p.name}</h4>
                            <p class="text-sm text-gray-500">${p.category} • ₹${p.price} <span class="line-through text-gray-400">₹${p.original}</span></p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="app.editProduct(${i})" class="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="app.deleteProduct(${i})" class="w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            },

            showAddProductForm() {
                this.editingIndex = -1;
                document.getElementById('form-title').textContent = 'Add New Product';
                document.getElementById('f-name').value = '';
                document.getElementById('f-category').value = 'Smart Watch';
                document.getElementById('f-price').value = '';
                document.getElementById('f-original').value = '';
                document.getElementById('f-images').value = 'images/';
                document.getElementById('f-desc').value = '';
                document.getElementById('f-edit-index').value = '-1';
                document.getElementById('admin-form').classList.remove('hidden');
            },

            editProduct(index) {
                const p = this.products[index];
                this.editingIndex = index;
                document.getElementById('form-title').textContent = 'Edit Product';
                document.getElementById('f-name').value = p.name || '';
                document.getElementById('f-category').value = p.category || 'Smart Watch';
                document.getElementById('f-price').value = p.price || '';
                document.getElementById('f-original').value = p.original || '';
                // Show all images, one per line
                const imgs = p.images && p.images.length ? p.images : (p.image ? [p.image] : []);
                document.getElementById('f-images').value = imgs.join('\n');
                document.getElementById('f-desc').value = p.desc || '';
                document.getElementById('f-edit-index').value = index;
                document.getElementById('admin-form').classList.remove('hidden');
            },

            hideAdminForm() {
                document.getElementById('admin-form').classList.add('hidden');
            },

            saveProduct() {
                const name = document.getElementById('f-name').value.trim();
                const category = document.getElementById('f-category').value;
                const price = parseInt(document.getElementById('f-price').value) || 0;
                const original = parseInt(document.getElementById('f-original').value) || price;
                const desc = document.getElementById('f-desc').value.trim();

                // Multiple images - one path per line
                const imagesRaw = document.getElementById('f-images').value.trim();
                const images = imagesRaw
                    .split('\n')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);

                if (!name || !price) {
                    this.showToast('Name and Price required');
                    return;
                }
                if (images.length === 0) {
                    this.showToast('At least one image path needed');
                    return;
                }

                const product = {
                    name,
                    category,
                    desc,
                    price,
                    original,
                    image: images[0],
                    images: images,
                    video: null
                };

                const editIndex = parseInt(document.getElementById('f-edit-index').value);
                if (editIndex >= 0) {
                    this.products[editIndex] = product;
                    this.showToast('Product updated');
                } else {
                    this.products.push(product);
                    this.showToast('Product added');
                }

                this.saveToLocalStorage();
                this.hideAdminForm();
                this.renderAdminList();
                this.renderProducts(this.currentCategory);
            },

            deleteProduct(index) {
                if (!confirm('Delete this product?')) return;
                this.products.splice(index, 1);
                this.saveToLocalStorage();
                this.renderAdminList();
                this.renderProducts(this.currentCategory);
                this.showToast('Product deleted');
            },

            saveToLocalStorage() {
                localStorage.setItem('ramnad_products', JSON.stringify(this.products));
            },

            loadFromLocalStorage() {
                const saved = localStorage.getItem('ramnad_products');
                if (saved) {
                    try {
                        return JSON.parse(saved);
                    } catch(e) {}
                }
                return null;
            },

            downloadJSON() {
                const dataStr = JSON.stringify(this.products, null, 2);
                const blob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'all.json';
                a.click();
                URL.revokeObjectURL(url);
                this.showToast('all.json downloaded — replace in data/ folder');
            },

            resetToOriginal() {
                if (!confirm('Reset all changes and load original products?')) return;
                localStorage.removeItem('ramnad_products');
                location.reload();
            },

            goHome() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                this.filterCategory('all');
            },

            scrollToProducts() {
                document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
            }
        };

        document.addEventListener('DOMContentLoaded', () => app.init());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { 
                app.closeModal(); 
                app.closeProductModal(); 
                app.closeCheckout(); 
                app.closeAdmin();
            }
            // Secret: Ctrl + Shift + A to open Admin
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                app.openAdmin();
            }
        });