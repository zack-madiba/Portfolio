document.addEventListener('DOMContentLoaded', function() {
    // =============================================
    // ANIMATIONS AU SCROLL (Intersection Observer)
    // =============================================
    const animateOnScroll = function() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        document.querySelectorAll('.animate-fade, .animate-slide').forEach(el => {
            observer.observe(el);
        });
    };

    // =============================================
    // FONCTIONNALITÉ DE COPIE DES BLOCS DE CODE
    // =============================================
    const setupCodeCopyButtons = function() {
        document.querySelectorAll('.code-copy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const codeBlock = this.closest('.code-section').querySelector('.code-block');
                const codeText = codeBlock.innerText;
                
                navigator.clipboard.writeText(codeText).then(() => {
                    const icon = this.querySelector('i');
                    const originalClass = icon.className;
                    
                    // Feedback visuel
                    icon.className = 'bi bi-check2';
                    this.style.background = '#50fa7b';
                    this.style.color = '#282a36';
                    
                    // Réinitialisation après 2 secondes
                    setTimeout(() => {
                        icon.className = originalClass;
                        this.style.background = '#44475a';
                        this.style.color = '#f8f8f2';
                    }, 2000);
                }).catch(err => {
                    console.error('Erreur lors de la copie : ', err);
                });
            });
        });
    };

    // =============================================
    // GESTION DES SCHEMAS INTERACTIFS
    // =============================================
    const setupInteractiveSchemas = function() {
        document.querySelectorAll('.schema-container').forEach(container => {
            const preview = container.querySelector('.schema-preview');
            const full = container.querySelector('.schema-full');
            
            if (preview && full) {
                // Masquer le contenu complet par défaut
                full.style.display = 'none';
                
                // Gestion des événements
                const showFull = () => {
                    preview.style.display = 'none';
                    full.style.display = 'block';
                };
                
                const showPreview = () => {
                    preview.style.display = 'block';
                    full.style.display = 'none';
                };
                
                // Desktop - hover
                container.addEventListener('mouseenter', showFull);
                container.addEventListener('mouseleave', showPreview);
                
                // Mobile - tap
                container.addEventListener('click', function(e) {
                    if (window.innerWidth <= 768) {
                        if (preview.style.display !== 'none') {
                            showFull();
                        } else {
                            showPreview();
                        }
                    }
                });
            }
        });
    };

    // =============================================
    // INITIALISATION DE TOUTES LES FONCTIONNALITÉS
    // =============================================
    const initAll = function() {
        animateOnScroll();
        setupCodeCopyButtons();
        setupInteractiveSchemas();
        
        // ScrollSpy Bootstrap si nécessaire
        if (typeof bootstrap !== 'undefined' && bootstrap.ScrollSpy) {
            const sideNav = document.getElementById('sideNav');
            if (sideNav) {
                new bootstrap.ScrollSpy(document.body, {
                    target: '#sideNav',
                    rootMargin: '0px 0px -40%',
                });
            }
        }
    };

    // Démarrer l'initialisation
    initAll();

    // Réinitialiser au redimensionnement de la fenêtre
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            document.querySelectorAll('.schema-container').forEach(container => {
                const preview = container.querySelector('.schema-preview');
                const full = container.querySelector('.schema-full');
                if (preview && full) {
                    preview.style.display = 'block';
                    full.style.display = 'none';
                }
            });
        }, 250);
    });
});