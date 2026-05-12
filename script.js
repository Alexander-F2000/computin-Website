/* =========================================
   ComPutIn - JavaScript
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {
    
    // =========================================
    // Navbar scroll effect
    // =========================================
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // =========================================
    // Smooth scroll for anchor links
    // =========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // =========================================
    // FAQ Accordion
    // =========================================
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    // =========================================
    // Phone mockup animation
    // =========================================
    const phoneMockup = document.querySelector('.phone-mockup');
    
    if (phoneMockup) {
        // Type button toggle
        const typeButtons = document.querySelectorAll('.type-btn');
        
        typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    // =========================================
    // Intersection Observer for animations
    // =========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .problem-card, .pricing-card, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Add animation class styles
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
    
    // =========================================
    // Counter animation for stats
    // =========================================
    const stats = document.querySelectorAll('.stat-number');
    
    const countUp = (el, target) => {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.textContent = target >= 1000 ? (target / 1000) + 'K+' : target + (el.textContent.includes('%') ? '%' : el.textContent.includes('★') ? '★' : '+');
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current) + (el.textContent.includes('%') ? '%' : el.textContent.includes('★') ? '★' : '+');
            }
        }, 30);
    };
    
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                stats.forEach(stat => {
                    const text = stat.textContent;
                    const num = parseInt(text.replace(/[^0-9]/g, ''));
                    if (!isNaN(num)) {
                        stat.textContent = '0' + text.replace(/[0-9]/g, '');
                        countUp(stat, num);
                    }
                });
                statsObserver.disconnect();
            }
        });
    }, { threshold: 0.5 });
    
    if (stats.length > 0) {
        statsObserver.observe(stats[0].closest('.hero-stats'));
    }
    
    // =========================================
    // Mobile menu toggle
    // =========================================
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '70px';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = 'white';
            navLinks.style.padding = '20px';
            navLinks.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
            navLinks.style.gap = '20px';
        });
    }
    
    // =========================================
    // Pricing card hover effect
    // =========================================
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('featured')) {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (!card.classList.contains('featured')) {
                card.style.transform = 'translateY(0) scale(1)';
            }
        });
    });
    
    // =========================================
    // Download button click tracking
    // =========================================
    const downloadButtons = document.querySelectorAll('.download-btn, .btn-nav, .pricing-card .btn');
    
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                background: rgba(255,255,255,0.5);
                border-radius: 50%;
                width: 100px;
                height: 100px;
                left: ${e.offsetX - 50}px;
                top: ${e.offsetY - 50}px;
                transform: scale(0);
                animation: ripple 0.6s linear;
            `;
            btn.style.position = 'relative';
            btn.style.overflow = 'hidden';
            btn.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add ripple animation
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyle);
    
    // =========================================
    // Contact card interaction
    // =========================================
    const contactCards = document.querySelectorAll('.contact-card');
    
    contactCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
    
    // =========================================
    // Screenshot carousel auto-scroll (if needed)
    // =========================================
    const screenshotsCarousel = document.querySelector('.screenshots-carousel');
    
    if (screenshotsCarousel && window.innerWidth > 1024) {
        let scrollPosition = 0;
        
        // Optional: Add auto-scroll every 5 seconds
        // setInterval(() => {
        //     scrollPosition += 1;
        //     if (scrollPosition >= screenshotsCarousel.children.length) {
        //         scrollPosition = 0;
        //     }
        //     screenshotsCarousel.style.transform = `translateX(-${scrollPosition * 100}%)`;
        // }, 5000);
    }
    
    // =========================================
    // Lazy loading for images (if any)
    // =========================================
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
    
    // =========================================
    // Console message
    // =========================================
    console.log('%c ComPutIn ', 'background: linear-gradient(135deg, #2A6EF0, #5B2C90); color: white; font-size: 24px; padding: 10px 20px; border-radius: 10px;');
    console.log('%c Votre comptabilité simplifiée 💰 ', 'color: #FF7A00; font-size: 14px;');
    
});
