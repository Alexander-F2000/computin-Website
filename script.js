/* ============================================================
   ComPutIn — Site officiel (refonte v2)
   Interactions : GSAP + ScrollTrigger, parallax multi-couches,
   reveals au scroll, compteurs, accordéon FAQ, menu mobile.
   Respecte `prefers-reduced-motion` et les appareils tactiles.
   ============================================================ */

(function () {
    'use strict';

    /* ---------- Détection d'environnement ---------- */
    var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
    var HAS_GSAP = typeof window.gsap !== 'undefined';

    /* Marqueur JS pour permettre les états initiaux CSS */
    document.documentElement.classList.add('js');

    /* ---------- Fallback sans GSAP : tout afficher ---------- */
    if (!HAS_GSAP || REDUCED_MOTION) {
        // Révéler tous les éléments animables immédiatement
        document.querySelectorAll('[data-animate]').forEach(function (el) {
            el.classList.add('is-visible');
        });
        // Sans GSAP : libérer les lignes masquées du hero (CSS-only)
        if (!HAS_GSAP) {
            document.querySelectorAll('.line-inner').forEach(function (el) {
                el.style.transform = 'none';
            });
        } else {
            // GSAP présent mais reduced-motion : texte visible
            gsap.set('.line-inner', { y: 0 });
        }
        // Compter quand même les stats (sans animation fluide)
        initCounters(false);
        initUI(); // accordéon + menu mobile + header scroll
        if (!HAS_GSAP) return;
    }

    /* ============================================================
       ANIMATIONS GSAP
    ============================================================ */
    if (HAS_GSAP && !REDUCED_MOTION) {
        gsap.registerPlugin(ScrollTrigger);

        /* --- Hero : révélation des lignes (masked line reveal) --- */
        gsap.timeline({ defaults: { ease: 'power3.out' } })
            .fromTo('.hero-badge', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
            .fromTo('.line-inner',
                { yPercent: 110 },
                { yPercent: 0, duration: 0.9, stagger: 0.12 },
                '-=0.3')
            .fromTo('.hero-subtitle', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.4')
            .fromTo('.hero-buttons', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5');

        /* --- Hero : entrée du mockup téléphone (elastic drop) --- */
        gsap.fromTo('.hero-visual',
            { y: 120, opacity: 0, rotateY: 18 },
            {
                y: 0, opacity: 1, rotateY: 0, duration: 1.4,
                ease: 'elastic.out(1, 0.55)', delay: 0.35
            });

        /* --- Héro : parallax multi-couches au scroll --- */
        if (IS_TOUCH === false || window.innerWidth >= 1024) {
            var layers = document.querySelectorAll('.hero .layer[data-depth]');
            layers.forEach(function (layer) {
                var depth = parseFloat(layer.getAttribute('data-depth')) || 0;
                if (depth === 4) return; // couche contenu : gestion fluide
                gsap.to(layer, {
                    yPercent: depth === 0 ? 0 : depth * 22,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '.hero',
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true
                    }
                });
            });
        }

        /* --- Reveals au scroll (data-animate + data-delay) --- */
        document.querySelectorAll('[data-animate]').forEach(function (el) {
            // Les éléments du hero sont animés par la timeline d'entrée
            if (el.closest('[data-scene="hero"]')) return;
            var delay = parseFloat(el.getAttribute('data-delay')) || 0;
            gsap.to(el, {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: 'power3.out',
                delay: delay,
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    once: true
                }
            });
        });

        /* --- Compteurs de stats --- */
        initCounters(true);

        /* --- Parallax léger des décorations CTA --- */
        gsap.to('.glow-cta', {
            yPercent: -12,
            ease: 'none',
            scrollTrigger: {
                trigger: '.download',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    }

    /* ============================================================
       COMPTEURS
    ============================================================ */
    function initCounters(animate) {
        var counters = document.querySelectorAll('.stat-number[data-count]');
        if (!counters.length) return;

        if (!animate) {
            counters.forEach(function (el) {
                el.textContent = formatNumber(el.getAttribute('data-count'));
            });
            return;
        }

        counters.forEach(function (el) {
            var target = parseInt(el.getAttribute('data-count'), 10);
            var obj = { val: 0 };

            gsap.to(obj, {
                val: target,
                duration: 2,
                ease: 'power2.out',
                onUpdate: function () { el.textContent = formatNumber(Math.round(obj.val)); },
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                    once: true
                }
            });
        });
    }

    function formatNumber(n) {
        return n.toLocaleString('fr-FR');
    }

    /* ============================================================
       UI : accordéon FAQ, menu mobile, header scroll
    ============================================================ */
    function initUI() {
        /* --- Header : fond au scroll --- */
        var header = document.getElementById('header');
        function onScroll() {
            if (window.scrollY > 24) {
                header.classList.add('is-scrolled');
            } else {
                header.classList.remove('is-scrolled');
            }
        }
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        /* --- Menu mobile --- */
        var menuBtn = document.getElementById('mobileMenuBtn');
        var navLinks = document.getElementById('navLinks');

        if (menuBtn && navLinks) {
            menuBtn.addEventListener('click', function () {
                var open = navLinks.classList.toggle('is-open');
                menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
                menuBtn.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
            });

            // Fermer le menu après clic sur un lien
            navLinks.querySelectorAll('a').forEach(function (link) {
                link.addEventListener('click', function () {
                    navLinks.classList.remove('is-open');
                    menuBtn.setAttribute('aria-expanded', 'false');
                    menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                });
            });
        }

        /* --- Accordéon FAQ --- */
        document.querySelectorAll('.faq-question').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var item = btn.closest('.faq-item');
                var answer = item.querySelector('.faq-answer');
                var isOpen = item.classList.contains('is-open');

                // Fermer les autres
                document.querySelectorAll('.faq-item.is-open').forEach(function (other) {
                    if (other === item) return;
                    other.classList.remove('is-open');
                    other.querySelector('.faq-answer').style.maxHeight = '0';
                    other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                });

                // Basculer le courant
                item.classList.toggle('is-open', !isOpen);
                btn.setAttribute('aria-expanded', String(!isOpen));
                answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : '0';
            });
        });

        /* --- Lisser l'ancre de téléchargement (lien APK réel) --- */
        // Rien à faire : les liens internes utilisent scroll-behavior CSS.
    }

    initUI();

    /* Rafraîchir ScrollTrigger après chargement complet (polices, images) */
    if (window.ScrollTrigger) {
        window.addEventListener('load', function () {
            ScrollTrigger.refresh();
        });
    }

})();