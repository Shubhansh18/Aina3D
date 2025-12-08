// js/models.js - Three.js 3D Model Management

let scene, camera, renderer, currentModel;
let isSceneInitialized = false;
let heroScene, heroCamera, heroRenderer;
let particleSystem, skeletonLine;
let mouseLight; // The light that follows the mouse
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

// ===== INITIALIZATION =====

function init3DScene() {
    const container = document.getElementById('3d-model-canvas');
    
    // Prevent double init or init on missing container
    if (!container || isSceneInitialized) return;
    
    console.log('Initializing Immersive Studio...');
    
    // Scene setup
    scene = new THREE.Scene();
    // Transparent background to blend with CSS gradient
    scene.background = null; 
    
    // Camera setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 4.5); // Slightly lower and closer for intimacy
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    
    // Clear existing canvas if any (hot reload safety)
    while(container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);
    
    // Lighting
    setupStudioLighting();
    
    // Controls
    setupInteraction(container);
    
    // Resize Handler
    window.addEventListener('resize', () => {
        if (!container) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
    
    // Animation Loop
    animate();
    
    isSceneInitialized = true;
}

// ===== STUDIO LIGHTING =====

function setupStudioLighting() {
    // 1. Ambient Light (Cool/Neutral base)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // 2. Key Light (Warm, from top-right) - "The Sun"
    const keyLight = new THREE.DirectionalLight(0xffedd5, 0.9); // Slight Coral tint
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);
    
    // 3. Rim Light (Cool, from back-left) - "The Edge"
    const rimLight = new THREE.DirectionalLight(0x4f46e5, 0.6); // Indigo tint
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);
    
    // 4. Fill Light (Soft, from front)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(0, 0, 5);
    scene.add(fillLight);
}

// ===== INTERACTIONS =====

function setupInteraction(container) {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    document.addEventListener('mouseup', () => isDragging = false);
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !currentModel) return;
        
        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
        };
        
        // Rotate model smoothly
        currentModel.rotation.y += deltaMove.x * 0.05;
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Mobile Touch Support
    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, {passive: false});

    container.addEventListener('touchmove', (e) => {
        if (!isDragging || !currentModel) return;
        const deltaMove = { x: e.touches[0].clientX - previousMousePosition.x };
        currentModel.rotation.y += deltaMove.x * 0.005;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, {passive: false});
    
    container.addEventListener('touchend', () => isDragging = false);
}

// ===== MODEL LOADING =====

function load3DModel(gender, bodyType, onComplete) {
    if (currentModel) {
        scene.remove(currentModel);
        currentModel = null;
    }
    
    // Fallback logic for demo purposes if specific model doesn't exist
    const modelType = 'average'; 
    const modelPath = `assets/models/${gender}_${modelType}.obj`;
    const mtlPath = `assets/models/${gender}_${modelType}.mtl`;
    
    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.load(mtlPath, (materials) => {
        materials.preload();
        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        
        objLoader.load(modelPath, (object) => {
            // Material Optimizations for "Modern Look"
            object.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    // Slightly shinier skin for realism
                    if(node.material) {
                        node.material.shininess = 10; 
                    }
                }
            });
            
            // Normalize Scale
            const box = new THREE.Box3().setFromObject(object);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            // Fit to view height
            const maxDim = Math.max(size.y);
            const scale = 2.5 / maxDim; 
            object.scale.multiplyScalar(scale);
            
            // Center bottom at (0,0,0)
            object.position.x = -center.x * scale;
            object.position.y = -box.min.y * scale - 1.2; // Adjust floor height
            object.position.z = -center.z * scale;
            
            currentModel = object;
            scene.add(currentModel);
            
            // Initial Animation Entrance
            currentModel.rotation.y = Math.PI; // Face forward
            
            if (onComplete) onComplete();
            
        }, undefined, (err) => {
            console.error('Error loading model:', err);
            if (onComplete) onComplete(); // Finish loading anyway to show UI
        });
    }, undefined, (err) => {
        console.error('Error loading materials:', err);
        if (onComplete) onComplete();
    });
}

function resetModelView() {
    if (currentModel) {
        // Smooth transition could be added here with TWEEN.js
        currentModel.rotation.set(0, Math.PI, 0);
        camera.position.set(0, 1.2, 4.5);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function initHeroAnimation() {
    const container = document.getElementById('hero-canvas');
    if (!container) return;

    // 1. Scene Setup
    heroScene = new THREE.Scene();
    // Slightly lighter fog to create depth without hiding particles
    heroScene.fog = new THREE.FogExp2(0x0f172a, 0.02); 

    const width = container.clientWidth;
    const height = container.clientHeight;

    heroCamera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    heroCamera.position.z = 30;

    heroRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    heroRenderer.setPixelRatio(window.devicePixelRatio);
    heroRenderer.setSize(width, height);
    
    // Clear previous canvas
    while(container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(heroRenderer.domElement);

    // 2. The Particle Torso (High Visibility)
    const count = 1800; // More dense
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const originPositions = new Float32Array(count * 3);

    // High Contrast Colors (Cyan -> Violet)
    const color1 = new THREE.Color(0x22d3ee); // Cyan 400
    const color2 = new THREE.Color(0xc084fc); // Violet 400

    for (let i = 0; i < count; i++) {
        const t = Math.random() * Math.PI * 2;
        const y = (Math.random() * 26) - 13; // Taller
        
        // Hourglass Shape Logic
        let r = (Math.cos(y * 0.15) * 6.5) + (Math.random() * 1.5); 
        
        const x = r * Math.cos(t);
        const z = r * Math.sin(t);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        originPositions[i * 3] = x;
        originPositions[i * 3 + 1] = y;
        originPositions[i * 3 + 2] = z;

        // Color Gradient
        const mixedColor = color1.clone().lerp(color2, (y + 13) / 26);
        
        // Boost brightness randomly for "sparkle" effect
        if (Math.random() > 0.8) mixedColor.addScalar(0.3);

        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Glowing Material
    const material = new THREE.PointsMaterial({
        size: 0.6, // Larger dots
        vertexColors: true,
        map: getCircleTexture(),
        alphaTest: 0.1,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending, // CRITICAL: Makes them glow
        depthWrite: false // CRITICAL: Prevents dark outlines
    });

    particleSystem = new THREE.Points(geometry, material);
    heroScene.add(particleSystem);

    // 3. Central Axis Line (Subtle Anchor)
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -100, 0),
        new THREE.Vector3(0, 100, 0)
    ]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.1 });
    skeletonLine = new THREE.Line(lineGeo, lineMat);
    heroScene.add(skeletonLine);

    // 4. Lighting
    // Ambient is higher now so model is always visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    heroScene.add(ambientLight);

    // Mouse Light (Scanner)
    mouseLight = new THREE.PointLight(0xffffff, 3, 30);
    mouseLight.position.set(0, 0, 10);
    heroScene.add(mouseLight);

    // 5. Interaction
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        targetX = mouseX * 20;
        targetY = mouseY * 20;
    });

    // Wave Effect State
    let waveActive = false;
    let waveFrame = 0;
    
    container.addEventListener('mousedown', () => {
        waveActive = true;
        waveFrame = 0;
        // Bright Flash on Click
        const flash = new THREE.PointLight(0xffffff, 10, 50);
        flash.position.set(0,0,20);
        heroScene.add(flash);
        setTimeout(() => heroScene.remove(flash), 100);
    });

    // 6. Animation
    const animate = () => {
        requestAnimationFrame(animate);

        const positions = particleSystem.geometry.attributes.position.array;
        const time = Date.now() * 0.0015;

        // Light Follow
        mouseLight.position.x += (targetX - mouseLight.position.x) * 0.1;
        mouseLight.position.y += (targetY - mouseLight.position.y) * 0.1;

        // Rotation
        particleSystem.rotation.y += (mouseX * 0.8 - particleSystem.rotation.y) * 0.05;
        particleSystem.rotation.x += (-mouseY * 0.5 - particleSystem.rotation.x) * 0.05;
        
        // Gentle constant rotation when idle
        if (Math.abs(mouseX) < 0.1) particleSystem.rotation.y += 0.02;

        // Particle Animation
        for (let i = 0; i < count; i++) {
            const px = originPositions[i * 3];
            const py = originPositions[i * 3 + 1];
            const pz = originPositions[i * 3 + 2];

            // Idle Breathing
            const breath = 1 + Math.sin(time + py * 0.4) * 0.02;
            
            // Shockwave
            let waveOffset = 0;
            if (waveActive) {
                const waveY = 15 - (waveFrame * 0.8);
                const dist = Math.abs(py - waveY);
                if (dist < 3) {
                    waveOffset = (3 - dist) * 0.4; // Push out
                }
            }

            positions[i * 3] = px * (breath + waveOffset);
            positions[i * 3 + 1] = py; 
            positions[i * 3 + 2] = pz * (breath + waveOffset);
        }

        if (waveActive) {
            waveFrame++;
            if (waveFrame > 60) waveActive = false;
        }

        particleSystem.geometry.attributes.position.needsUpdate = true;
        heroRenderer.render(heroScene, heroCamera);
    };

    animate();

    window.addEventListener('resize', () => {
        if(!container) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        heroCamera.aspect = newWidth / newHeight;
        heroCamera.updateProjectionMatrix();
        heroRenderer.setSize(newWidth, newHeight);
    });
}

// Helper: Generates a soft glow texture for particles
function getCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; // Higher res
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); // Bright center
    grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}