// js/models.js - Three.js 3D Model Management

let scene, camera, renderer, currentModel;
let heroScene, heroCamera, heroRenderer;
let particleSystem, skeletonLine;
let isSceneInitialized = false;
let mouseLight; // The light that follows the mouse
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

// ===== INITIALIZATION =====

function init3DScene() {
    const container = document.getElementById('3d-model-canvas');
    if (!container) return;
    if (renderer) return;

    scene = new THREE.Scene();
    scene.background = null; 

    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 5.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;

    while(container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);

    setupStudioLighting();
    setupInteraction(container);

    window.addEventListener('resize', () => {
        if (!container) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });

    animate();
}

// ===== STUDIO LIGHTING =====

function setupStudioLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.2); 
    keyLight.position.set(2, 5, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x4f46e5, 0.8); 
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
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
    window.addEventListener('mouseup', () => isDragging = false);
    container.addEventListener('mousemove', (e) => {
        if (!isDragging || !currentModel) return;
        const deltaMove = { x: e.clientX - previousMousePosition.x };
        currentModel.rotation.y += deltaMove.x * 0.008;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
}

// ===== MODEL LOADING =====

function load3DModel(modelName, onComplete) {
    // 1. Check for Loaders
    if (typeof THREE.GLTFLoader === 'undefined') {
        console.error("ERROR: GLTFLoader missing.");
        if (onComplete) onComplete();
        return;
    }

    // 2. Cleanup Old Model
    if (currentModel) {
        scene.remove(currentModel);
        currentModel.traverse((c) => { if(c.isMesh) { c.geometry.dispose(); c.material.dispose(); } });
        currentModel = null;
    }
    
    const safeName = modelName.toLowerCase().replace(/ /g, '_');
    const modelUrl = `assets/models/${safeName}.glb`;
    console.log(`Loading: ${modelUrl}`);

    // 3. Initialize Loader
    const loader = new THREE.GLTFLoader();

    // === DRACO DECODER SETUP (FIXED VERSION) ===
    if (typeof THREE.DRACOLoader !== 'undefined') {
        const dracoLoader = new THREE.DRACOLoader();
        
        // POINT TO EXACTLY THE SAME VERSION AS THE JS LOADER (r128)
        // This prevents "Draco Decoder version mismatch" errors
        dracoLoader.setDecoderPath('https://unpkg.com/three@0.128.0/examples/js/libs/draco/');
        
        dracoLoader.setDecoderConfig({ type: 'js' });
        loader.setDRACOLoader(dracoLoader);
    }
    
    // 4. Load File
    loader.load(
        modelUrl,
        (gltf) => {
            const object = gltf.scene;
            
            object.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if(node.material) node.material.side = THREE.DoubleSide;
                }
            });

            // Auto-Centering & Scaling
            const box = new THREE.Box3().setFromObject(object);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            const maxDim = Math.max(size.y);
            const isMobile = camera.aspect < 1;
            const targetHeight = isMobile ? 2.5 : 2.8; 
            const scaleFactor = targetHeight / maxDim;

            object.scale.setScalar(scaleFactor);
            object.position.x = -center.x * scaleFactor;
            object.position.z = -center.z * scaleFactor;
            object.position.y = -box.min.y * scaleFactor - 1.4;

            currentModel = object;
            scene.add(currentModel);
            currentModel.rotation.y = 0; 

            console.log("Model loaded successfully!");
            if (onComplete) onComplete();
        },
        undefined,
        (error) => {
            console.error("Load Error:", error);
            // Alert user so they know it failed
            alert(`Failed to load ${safeName}.glb.\nCheck console for version mismatch or 404.`);
            if (onComplete) onComplete();
        }
    );
}

function resetModelView() {
    if (currentModel) {
        currentModel.rotation.set(0, 0, 0);
        camera.position.set(0, 0.8, 5.5);
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