function AinaApp() {
    return {
        // Navigation State
        currentPage: 'landing',
        mobileMenuOpen: false,
        profileStep: 1,
        hasScrolled: false,
        
        // Unit State
        unitSystem: 'metric', // 'metric' (cm/kg) or 'imperial' (in/lbs)

        // Data Models
        userProfile: {
            gender: null,
            bodyShape: 'rectangle', // Default
            height: 170,
            weight: 70,
            shoulder: 45,
            chest: 90,
            belly: 80,
            waist: 75,
            hips: 95
        },

        // Body Shapes Config
        bodyShapes: [],
        
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
        
        feedbackData: { rating: 0, comment: '' },

        // ===== INIT =====
        init() {
            console.log('Aina3D initialized');
            const saved = localStorage.getItem('trueform_profile');
            if (saved) {
                this.userProfile = JSON.parse(saved);
                // Restore correct shapes list based on saved gender
                if (this.userProfile.gender) {
                    this.updateBodyShapesList(this.userProfile.gender);
                }
            }
            
            window.addEventListener('scroll', () => {
                this.hasScrolled = window.scrollY > 20;
            });

            setTimeout(() => {
                if (typeof initHeroAnimation === 'function') {
                    initHeroAnimation();
                }
            }, 100);
        },

        // 3. NEW HELPER FUNCTION (Add this to your methods)
        updateBodyShapesList(gender) {
            if (gender === 'male') {
                this.bodyShapes = [
                    { id: 'rectangle', label: 'Rectangle', emoji: '▮' },
                    { id: 'triangle', label: 'Triangle', emoji: '▲' },
                    { id: 'inverted_triangle', label: 'Inverted Triangle', emoji: '▼' },
                    { id: 'trapezoid', label: 'Trapezoid', emoji: '⏢' }, // Male specific
                    { id: 'oval', label: 'Oval', emoji: '●' }
                ];
            } else {
                this.bodyShapes = [
                    { id: 'rectangle', label: 'Rectangle', emoji: '▮' },
                    { id: 'triangle', label: 'Triangle', emoji: '▲' },
                    { id: 'inverted_triangle', label: 'Inverted Triangle', emoji: '▼' },
                    { id: 'hourglass', label: 'Hourglass', emoji: '⏳' }, // Female specific
                    { id: 'oval', label: 'Oval', emoji: '●' }
                ];
            }
        },

        // NEW: Jumps directly to the measurement sliders (bypassing gender)
        editProfile() {
            this.profileStep = 2; // Force Step 2
            this.currentPage = 'profile';
            window.scrollTo(0, 0);
        },

        // ===== NAVIGATION =====
        goToPage(page) {
            this.currentPage = page;
            window.scrollTo(0, 0);
            
            // Only reset to Step 1 if we are NOT going to profile
            // This prevents "Edit" clicks from being reset if logic overlaps
            if (page !== 'profile') {
                setTimeout(() => { this.profileStep = 1; }, 300);
            }

            if (page === 'studio') {
                this.$nextTick(() => { this.loadStudio(); });
            }
        },

        goBackProfile() {
            if (this.profileStep > 1) {
                this.profileStep--; // Go back to Gender Selection
            } else {
                this.goToPage('landing'); // Go back to Home
            }
        },

        // ===== UNIT LOGIC =====
        toggleUnits(system) {
            if (this.unitSystem === system) return;
            
            this.unitSystem = system;
            
            // Only convert Linear Measurements (Not Weight)
            if (system === 'imperial') {
                // Metric (cm) -> Imperial (inch)
                this.userProfile.height = Math.round(this.userProfile.height / 2.54);
                this.userProfile.shoulder = Math.round(this.userProfile.shoulder / 2.54);
                this.userProfile.chest = Math.round(this.userProfile.chest / 2.54);
                this.userProfile.belly = Math.round(this.userProfile.belly / 2.54);
                this.userProfile.waist = Math.round(this.userProfile.waist / 2.54);
                this.userProfile.hips = Math.round(this.userProfile.hips / 2.54);
            } else {
                // Imperial (inch) -> Metric (cm)
                this.userProfile.height = Math.round(this.userProfile.height * 2.54);
                this.userProfile.shoulder = Math.round(this.userProfile.shoulder * 2.54);
                this.userProfile.chest = Math.round(this.userProfile.chest * 2.54);
                this.userProfile.belly = Math.round(this.userProfile.belly * 2.54);
                this.userProfile.waist = Math.round(this.userProfile.waist * 2.54);
                this.userProfile.hips = Math.round(this.userProfile.hips * 2.54);
            }
        },

        // ===== PROFILE LOGIC =====
        setGender(gender) {
            this.userProfile.gender = gender;
            
            // Update the body shape options immediately
            this.updateBodyShapesList(gender);
            
            // Set Default Measurements (Metric)
            if (gender === 'female') {
                this.userProfile.height = 162;
                this.userProfile.weight = 60;
                this.userProfile.shoulder = 38;
                this.userProfile.chest = 88;
                this.userProfile.belly = 70;
                this.userProfile.waist = 68;
                this.userProfile.hips = 96;
            } else {
                this.userProfile.height = 175;
                this.userProfile.weight = 75;
                this.userProfile.shoulder = 44;
                this.userProfile.chest = 96;
                this.userProfile.belly = 85;
                this.userProfile.waist = 82;
                this.userProfile.hips = 94;
            }

            // Convert defaults if in Imperial mode
            if (this.unitSystem === 'imperial') {
                this.userProfile.height = Math.round(this.userProfile.height / 2.54);
                this.userProfile.shoulder = Math.round(this.userProfile.shoulder / 2.54);
                this.userProfile.chest = Math.round(this.userProfile.chest / 2.54);
                this.userProfile.belly = Math.round(this.userProfile.belly / 2.54);
                this.userProfile.waist = Math.round(this.userProfile.waist / 2.54);
                this.userProfile.hips = Math.round(this.userProfile.hips / 2.54);
            }

            this.profileStep = 2;
        },

        finishProfile() {
            this.loading = true;
            // Always save as Metric for consistency in backend/3D loader
            const exportProfile = { ...this.userProfile };
            
            if (this.unitSystem === 'imperial') {
                exportProfile.height = Math.round(exportProfile.height * 2.54);
                exportProfile.weight = Math.round(exportProfile.weight / 2.20462);
                exportProfile.shoulder = Math.round(exportProfile.shoulder * 2.54);
                exportProfile.chest = Math.round(exportProfile.chest * 2.54);
                exportProfile.belly = Math.round(exportProfile.belly * 2.54);
                exportProfile.waist = Math.round(exportProfile.waist * 2.54);
                exportProfile.hips = Math.round(exportProfile.hips * 2.54);
            }

            setTimeout(() => {
                localStorage.setItem('trueform_profile', JSON.stringify(exportProfile));
                this.loading = false;
                this.profileStep = 1; 
                this.goToPage('studio');
            }, 1000);
        },

        loadStudio() {
            if (typeof init3DScene === 'function') {
                // 1. Initialize Scene (Camera, Lights)
                init3DScene(); 
                
                // 2. Run the Math Logic
                const smartShape = this.calculateSmartShape();
                
                // Debug Log: Use this to verify your inputs vs result
                console.log(`%c Detected Body Type: ${smartShape.toUpperCase()} `, 'background: #4F46E5; color: #fff; font-weight: bold;');
                
                // 3. Construct Model Filename
                // Expected format: male_trapezoid, female_hourglass, etc.
                const modelName = `${this.userProfile.gender}_${smartShape}`;
                
                this.loading = true;
                
                // 4. Trigger GLB Loader
                load3DModel(modelName, () => {
                    this.loading = false;
                });
            }
        },  

        selectClothing(index) {
            this.currentClothingItem = this.clothingCatalog[index];
        },

        resetView() {
            if (typeof resetModelView === 'function') {
                resetModelView();
            }
        },

        // ===== HELPERS =====
        getBodyType(profile) {
            // Helper needs metric values for calculation
            let chest = profile.chest;
            if (this.unitSystem === 'imperial') {
                chest = chest * 2.54;
            }

            const { gender } = profile;
            if (!gender) return 'average';
            
            if (gender === 'male') {
                if (chest < 90) return 'lean';
                if (chest < 100) return 'average';
                if (chest < 110) return 'athletic';
                return 'curvy'; 
            } else {
                if (chest < 85) return 'lean';
                if (chest < 95) return 'average';
                if (chest < 105) return 'curvy';
                return 'plus_size';
            }
        },

        // ===== SMART SHAPE LOGIC (Mathematically Accurate) =====
        calculateSmartShape() {
            const p = this.userProfile;
            
            // 1. Normalize Units: Convert everything to CM for consistent math
            // If user is in 'imperial' (inches), convert to cm. If 'metric', keep as is.
            const convert = (val) => this.unitSystem === 'imperial' ? val * 2.54 : val;

            // Normalized Measurements (m)
            const m = {
                shoulder: convert(p.shoulder),
                chest: convert(p.chest), // Bust for females
                belly: convert(p.belly),
                waist: convert(p.waist),
                hips: convert(p.hips),
            };

            console.log("Analyzing Measurements (cm):", m);

            // 2. MALE LOGIC
            if (p.gender === 'male') {
                // Ratio Calculations
                const shoulderHipRatio = m.shoulder / m.hips; // SHR
                const waistChestRatio = m.waist / m.chest;    // WCR

                // A. OVAL CHECK (Priority 1)
                // If belly is the widest point (larger than chest + buffer)
                if (m.belly > m.chest + 2) {
                    return 'oval';
                }

                // B. INVERTED TRIANGLE CHECK (Priority 2)
                // Shoulders are significantly wider than hips (>10% difference)
                if (shoulderHipRatio > 1.1) {
                    return 'inverted_triangle';
                }

                // C. TRIANGLE CHECK (Priority 3)
                // Hips are wider than shoulders (>5% difference)
                if (shoulderHipRatio < 0.95) {
                    return 'triangle';
                }

                // D. TRAPEZOID vs RECTANGLE
                // Trapezoid = "V-Taper" (Waist is < 88% of chest width)
                // Rectangle = Straight (Waist is close to chest width)
                if (waistChestRatio < 0.88) {
                    return 'trapezoid'; // Athletic/Fit
                } else {
                    return 'rectangle'; // Straight/Blocky
                }
            }
            
            // 3. FEMALE LOGIC
            if (p.gender === 'female') {
                // Ratio Calculations
                const hipBustRatio = m.hips / m.chest;       // HBR
                const shoulderHipRatio = m.shoulder / m.hips;// SHR
                const waistHipRatio = m.waist / m.hips;      // WHR

                // A. OVAL CHECK (Priority 1)
                // If the waist or belly is wider than the bust
                if (m.belly > m.chest || m.waist > m.chest) {
                    return 'oval';
                }

                // B. TRIANGLE / PEAR CHECK (Priority 2)
                // Hips are significantly wider than Bust (>5% wider)
                if (hipBustRatio > 1.05) {
                    return 'triangle';
                }

                // C. INVERTED TRIANGLE CHECK (Priority 3)
                // Shoulders or Bust are wider than Hips
                if (shoulderHipRatio > 1.05) {
                    return 'inverted_triangle';
                }

                // D. HOURGLASS vs RECTANGLE
                // Both have balanced top/bottom. The difference is the waist definition.
                // Hourglass = Defined waist (Waist is < 80% of hips)
                // Rectangle = Straight waist (Waist is > 80% of hips)
                if (waistHipRatio < 0.80) {
                    return 'hourglass';
                } else {
                    return 'rectangle';
                }
            }
            
            return 'rectangle'; // Safety Fallback
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