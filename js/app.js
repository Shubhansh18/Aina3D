// js/app.js - Aina3D Application Logic (Refactored)

function AinaApp() {
    return {
        // Navigation State
        currentPage: 'landing',
        profileStep: 1,
        hasScrolled: false, // New state for header styling
        mobileMenuOpen: false,
        
        // Data Models
        userProfile: {
            gender: null, // 'male' or 'female'
            height: 170,
            weight: 70,
            chest: 90,
            waist: 75,
            hip: 95
        },
        
        // Studio State
        loading: false,
        clothingCatalog: [
            { id: 1, name: 'Basic Tee', brand: 'Uniqlo', emoji: '👕', price: '₹999' },
            { id: 2, name: 'Linen Kurta', brand: 'FabIndia', emoji: '👔', price: '₹1,499' },
            { id: 3, name: 'Slim Jeans', brand: 'Levi\'s', emoji: '👖', price: '₹2,999' },
            { id: 4, name: 'Summer Dress', brand: 'H&M', emoji: '👗', price: '₹1,799' },
            { id: 5, name: 'Oxford Shirt', brand: 'Zara', emoji: '👔', price: '₹2,299' },
            { id: 6, name: 'Athletic Set', brand: 'Nike', emoji: '🏃', price: '₹3,599' },
            { id: 7, name: 'Party Blazer', brand: 'Raymond', emoji: '🧥', price: '₹4,999' },
            { id: 8, name: 'Chinos', brand: 'Gap', emoji: '👖', price: '₹1,899' }
        ],
        currentClothingItem: null,
        
        feedbackData: {
            rating: 0,
            comment: ''
        },

        // ===== INIT =====
        init() {
            console.log('Aina3D MVP initialized');
            
            const saved = localStorage.getItem('aina_profile');
            if (saved) {
                this.userProfile = JSON.parse(saved);
            }

            // Scroll listener for Sticky Header effect
            window.addEventListener('scroll', () => {
                this.hasScrolled = window.scrollY > 20;
            });
            
            // Initialize the new Digital Loom Hero
            setTimeout(() => {
                if (typeof initHeroAnimation === 'function') {
                    initHeroAnimation();
                }
            }, 100);
        },

        // ===== NAVIGATION =====
        goToPage(page) {
            this.currentPage = page;

            // Scroll to top when changing views
            window.scrollTo(0, 0);
            
            // If going to studio, trigger the 3D init
            if (page === 'studio') {
                this.$nextTick(() => {
                    this.loadStudio();
                });
            }
        },

        // ===== PROFILE LOGIC =====
        setGender(gender) {
            this.userProfile.gender = gender;
            // Set defaults based on gender
            if (gender === 'female') {
                this.userProfile.height = 162;
                this.userProfile.weight = 60;
                this.userProfile.chest = 88;
                this.userProfile.waist = 70;
            } else {
                this.userProfile.height = 175;
                this.userProfile.weight = 75;
                this.userProfile.chest = 96;
                this.userProfile.waist = 82;
            }
            this.profileStep = 2;
        },

        finishProfile() {
            this.loading = true;
            // Simulate processing
            setTimeout(() => {
                localStorage.setItem('aina_profile', JSON.stringify(this.userProfile));
                this.loading = false;
                this.profileStep = 1; // Reset for next time
                this.goToPage('studio');
            }, 1000);
        },

        // ===== STUDIO LOGIC =====
        loadStudio() {
            // Ensure global functions from models.js are available
            if (typeof init3DScene === 'function') {
                // We use a flag to prevent double-init in models.js usually, 
                // but here we just ensure the scene is ready
                init3DScene(); 
                
                // Load specific model
                const bodyType = this.getBodyType(this.userProfile);
                this.loading = true;
                
                // Call the global function exposed by models.js
                load3DModel(this.userProfile.gender, bodyType, () => {
                    this.loading = false;
                });
            }
        },

        selectClothing(index) {
            this.currentClothingItem = this.clothingCatalog[index];
            // Here you would trigger texture changes in Three.js
            // console.log("Applied texture:", this.currentClothingItem.name);
        },

        resetView() {
            if (typeof resetModelView === 'function') {
                resetModelView();
            }
        },

        // ===== HELPERS =====
        getBodyType(profile) {
            const { gender, chest } = profile;
            if (!gender) return 'average';
            
            if (gender === 'male') {
                if (chest < 90) return 'lean';
                if (chest < 100) return 'average';
                if (chest < 110) return 'athletic';
                return 'curvy'; // fallback map
            } else {
                if (chest < 85) return 'lean';
                if (chest < 95) return 'average';
                if (chest < 105) return 'curvy';
                return 'plus_size';
            }
        },

        getBodyTypeLabel() {
            const type = this.getBodyType(this.userProfile);
            return type.charAt(0).toUpperCase() + type.slice(1);
        },

        submitFeedback() {
            alert("Thanks! Your feedback helps us improve.");
            this.feedbackData = { rating: 0, comment: '' };
            this.goToPage('landing');
        }
    };
}