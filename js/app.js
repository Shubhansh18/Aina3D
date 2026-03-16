function AinaApp() {
    return {
        currentPage: 'landing',
        mobileMenuOpen: false,
        hasScrolled: false,

        init() {
            window.addEventListener('scroll', () => {
                this.hasScrolled = window.scrollY > 20;
            });
        },

        goToPage(page) {
            this.currentPage = page;
            window.scrollTo(0, 0);
        },
    };
}