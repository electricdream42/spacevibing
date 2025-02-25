import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';

import { createStarfield } from './components/starfield.js';
import { createPlanet } from './components/planet.js';
import { createSun } from './components/sun.js';
import { createNebula } from './components/nebula.js';
import { createSkybox } from './components/skybox.js';
import { loadingManager, updateProgress } from './utils/loading.js';
import { CameraPath } from './utils/cameraPath.js';

// Global variables
let scene, camera, renderer, controls;
let cameraPath;
let composer; // For post-processing
let clock = new THREE.Clock();
let isAutoPilot = true; // Start in auto-pilot mode
let loadingScreen = document.getElementById('loading');
let titleCard = document.getElementById('title-card');
let locationInfo = document.getElementById('location-info');
let journeyStarted = false;
let currentLocationIndex = -1;
let lastLocationChangeTime = 0;
let starfieldObjects; // To store starfield and shooting stars
let dramaticEventTriggered = false;
let dramaticEventProgress = 0;

// Music control
const backgroundMusic = document.getElementById('background-music');
const musicToggle = document.getElementById('music-toggle');
const volumeSlider = document.getElementById('volume-slider');
const volumeDisplay = document.getElementById('volume-display');

// Celestial points of interest with descriptions
const cosmicLocations = [
    {
        name: "Solar Core",
        description: "The heart of our cosmic journey begins near a massive star, its energy radiating across light years.",
        triggerDistance: 50,
        position: new THREE.Vector3(10, 10, 40)
    },
    {
        name: "Nebula Vortex",
        description: "A swirling cloud of gas and cosmic dust, birthplace of new stars and home to ancient stellar remnants.",
        triggerDistance: 60,
        position: new THREE.Vector3(-70, 20, -60)
    },
    {
        name: "Terrestrial World",
        description: "A blue-green oasis in the void, reminding us of the rarity and fragility of life in the cosmos.",
        triggerDistance: 40,
        position: new THREE.Vector3(30, 0, 0)
    },
    {
        name: "Galactic Horizon",
        description: "At the edge of a galaxy's spiral arm, countless stars stretch into infinity beyond human comprehension.",
        triggerDistance: 70,
        position: new THREE.Vector3(-100, -30, 80)
    },
    {
        name: "Cosmic Waypoint",
        description: "A region where electromagnetic waves from distant quasars converge, creating a celestial lighthouse.",
        triggerDistance: 50,
        position: new THREE.Vector3(90, 40, -90)
    }
];

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00015);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = 50;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // slightly brighter
    document.body.appendChild(renderer.domElement);
    
    // Set up post-processing
    setupPostProcessing();
    
    // Add ambient light (general space illumination)
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);
    
    // Add skybox (distant stars backdrop)
    createSkybox(scene);
    
    // Add starfield (closer stars as particles)
    starfieldObjects = createStarfield(scene, 15000); // More stars for dramatic effect
    
    // Add sun at the center
    const sun = createSun(scene, {
        radius: 18,
        intensity: 2.0,
        color: 0xffa030 // More orange-ish for dramatic effect
    });
    
    // Create planets at various distances with more dramatic options
    const earth = createPlanet(scene, {
        radius: 5,
        texture: 'earth',
        position: new THREE.Vector3(30, 0, 0),
        rotationSpeed: 0.01,
        hasAtmosphere: true,
        moons: [{ radius: 1.2, distance: 10 }]
    });
    
    const mars = createPlanet(scene, {
        radius: 2.5,
        texture: 'mars',
        position: new THREE.Vector3(-40, 5, 20),
        rotationSpeed: 0.008
    });
    
    const jupiter = createPlanet(scene, {
        radius: 12,
        texture: 'jupiter',
        position: new THREE.Vector3(100, -20, -50),
        rotationSpeed: 0.02
    });
    
    const saturn = createPlanet(scene, {
        radius: 10,
        texture: 'saturn',
        position: new THREE.Vector3(-90, 15, -70),
        rotationSpeed: 0.018,
        hasRings: true,
        tilt: 0.4
    });
    
    // Add multiple nebulae for more visual interest
    createNebula(scene, {
        position: new THREE.Vector3(-100, 30, -80),
        scale: 100,
        color: 0x8844aa, // Purple
        density: 12
    });
    
    createNebula(scene, {
        position: new THREE.Vector3(150, -40, 100),
        scale: 180,
        color: 0x00aaff, // Blue
        density: 10,
        opacity: 0.4
    });
    
    createNebula(scene, {
        position: new THREE.Vector3(70, 80, -120),
        scale: 140,
        color: 0xff5500, // Orange
        density: 8,
        opacity: 0.3
    });
    
    // Create a more dramatic camera path
    setupCameraPath();
    
    // Add orbit controls for manual control
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = !isAutoPilot;
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Toggle between auto-pilot and manual control with spacebar
    window.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            isAutoPilot = !isAutoPilot;
            controls.enabled = !isAutoPilot;
            
            // Display mode change
            const info = document.getElementById('info');
            info.textContent = isAutoPilot ? 'Auto-Pilot Mode (Press SPACE for manual control)' : 'Manual Control Mode (Press SPACE for auto-pilot)';
            info.style.opacity = 1;
            setTimeout(() => { info.style.opacity = 0.5; }, 2000);
        }
    });
    
    // Hide loading screen once everything is ready
    loadingScreen.style.opacity = 0;
    setTimeout(() => { loadingScreen.style.display = 'none'; }, 1000);
    
    // Set up music controls
    setupMusicControls();
    
    // Set up start journey button
    document.getElementById('start-journey').addEventListener('click', startJourney);
}

// Start the cosmic journey
function startJourney() {
    titleCard.style.opacity = 0;
    setTimeout(() => { titleCard.style.display = 'none'; }, 2000);
    
    // Start background music
    backgroundMusic.play();
    musicToggle.textContent = "⏸️";
    
    journeyStarted = true;
    
    // Set initial info text
    document.getElementById('info').textContent = 'Auto-Pilot Mode (Press SPACE for manual control)';
}

// Set up a more dramatic camera path
function setupCameraPath() {
    cameraPath = new CameraPath();
    
    // Add more points for a more complex and dramatic path
    cameraPath.addPoint(new THREE.Vector3(0, 20, 100)); // Starting view of the solar system
    cameraPath.addPoint(new THREE.Vector3(30, 40, 80)); // Higher viewpoint
    cameraPath.addPoint(new THREE.Vector3(60, 10, 40)); // Swooping down
    cameraPath.addPoint(new THREE.Vector3(70, -10, 0)); // Diving below the plane
    cameraPath.addPoint(new THREE.Vector3(40, -30, -30)); // Deep dive
    cameraPath.addPoint(new THREE.Vector3(-20, -20, -60)); // Changing direction
    cameraPath.addPoint(new THREE.Vector3(-60, 0, -80)); // Leveling out
    cameraPath.addPoint(new THREE.Vector3(-100, 30, -50)); // Rising up
    cameraPath.addPoint(new THREE.Vector3(-80, 50, 10)); // High viewpoint
    cameraPath.addPoint(new THREE.Vector3(-30, 40, 60)); // Arcing back
    cameraPath.addPoint(new THREE.Vector3(20, 20, 80)); // Returning to start
    
    // Uncomment to visualize the path (helpful for debugging)
    // cameraPath.visualize(scene);
}

// Set up post-processing effects
function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    
    // Standard render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Bloom effect for glowing objects
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.0,    // strength
        0.4,    // radius
        0.85    // threshold
    );
    composer.addPass(bloomPass);
    
    // Film grain effect for more dramatic, cinematic look
    const filmPass = new FilmPass(
        0.25,   // noise intensity
        0.5,    // scanline intensity
        648,    // scanline count
        false   // grayscale
    );
    composer.addPass(filmPass);
    
    // Gamma correction pass
    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    composer.addPass(gammaCorrectionPass);
}

// Set up music controls
function setupMusicControls() {
    // Volume control
    volumeSlider.addEventListener('input', () => {
        const volume = volumeSlider.value / 100;
        backgroundMusic.volume = volume;
        volumeDisplay.textContent = `${volumeSlider.value}%`;
    });
    
    // Set initial volume
    backgroundMusic.volume = volumeSlider.value / 100;
    
    // Play/pause toggle
    musicToggle.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play();
            musicToggle.textContent = "⏸️";
        } else {
            backgroundMusic.pause();
            musicToggle.textContent = "▶️";
        }
    });
}

// Check if camera is near a point of interest
function checkLocationInfo() {
    if (!journeyStarted) return;
    
    const currentTime = Date.now();
    if (currentTime - lastLocationChangeTime < 10000) return; // Minimum 10 seconds between location changes
    
    for (let i = 0; i < cosmicLocations.length; i++) {
        const location = cosmicLocations[i];
        const distance = camera.position.distanceTo(location.position);
        
        if (distance < location.triggerDistance && i !== currentLocationIndex) {
            // Show new location info
            locationInfo.innerHTML = `<h3>${location.name}</h3><p>${location.description}</p>`;
            locationInfo.style.opacity = 1;
            
            // Hide after 8 seconds
            setTimeout(() => {
                locationInfo.style.opacity = 0;
            }, 8000);
            
            currentLocationIndex = i;
            lastLocationChangeTime = currentTime;
            break;
        }
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

// Add a dramatic celestial event (supernova)
function triggerDramaticEvent() {
    if (dramaticEventTriggered) return;
    
    dramaticEventTriggered = true;
    dramaticEventProgress = 0;
    
    // Create a dramatically growing sphere to represent an exploding star
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0xffaa22) }
        },
        vertexShader: `
            varying vec3 vNormal;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 color;
            varying vec3 vNormal;
            
            void main() {
                // Pulsating glow
                float pulse = 0.6 + 0.4 * sin(time * 3.0);
                
                // Edge glow
                float edgeFactor = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
                edgeFactor = pow(edgeFactor, 1.5) * 0.8;
                
                // Final color with edge glow
                vec3 finalColor = color * pulse;
                finalColor += vec3(1.0, 0.7, 0.3) * edgeFactor * pulse;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    
    const supernova = new THREE.Mesh(geometry, material);
    supernova.position.set(-150, 40, -120); // Position away from main path but visible
    supernova.scale.set(1, 1, 1);
    scene.add(supernova);
    
    // Add a point light at the supernova
    const supernovaLight = new THREE.PointLight(0xffdd66, 1, 500);
    supernovaLight.position.copy(supernova.position);
    scene.add(supernovaLight);
    
    // Store these in scene userData for animation
    scene.userData.dramaticEvent = {
        supernova,
        supernovaLight,
        startTime: clock.getElapsedTime(),
        duration: 25 // 25 seconds event
    };
    
    // Show a description of the event
    locationInfo.innerHTML = `<h3>Supernova Detected!</h3><p>Witness the extraordinary death of a massive star, releasing more energy in its final moments than it has throughout its entire lifetime. The shockwave ripples through the surrounding space.</p>`;
    locationInfo.style.opacity = 1;
    
    // Create shockwave particles
    createShockwave(scene, supernova.position.clone(), 25);
    
    // After 10 seconds, fade out the description
    setTimeout(() => {
        locationInfo.style.opacity = 0;
    }, 10000);
}

// Create expanding shockwave particles
function createShockwave(scene, center, duration) {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocity = new Float32Array(particleCount * 3);
    
    // Initialize particles in a spherical shell
    for (let i = 0; i < particleCount; i++) {
        // Random direction (spherical coordinates)
        const phi = Math.acos(Math.random() * 2 - 1); // -1 to 1
        const theta = Math.random() * Math.PI * 2; // 0 to 2π
        
        // Start close to the center
        const radius = 5;
        positions[i * 3] = center.x + radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = center.y + radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = center.z + radius * Math.cos(phi);
        
        // Velocity in same direction as position (outward)
        const speed = 2 + Math.random() * 5;
        velocity[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        velocity[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        velocity[i * 3 + 2] = Math.cos(phi) * speed;
        
        // Color (orange to blue gradient)
        const r = 1.0;
        const g = 0.4 + Math.random() * 0.4; // 0.4 to 0.8
        const b = Math.random() * 0.4; // 0 to 0.4
        
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
        
        // Size
        sizes[i] = 2 + Math.random() * 5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Material with custom shader
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            pointTexture: { value: new THREE.TextureLoader(loadingManager).load(
                'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/spark1.png'
            )}
        },
        vertexShader: `
            attribute float size;
            varying float vSize;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                vSize = size;
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (40.0 / -mvPosition.z) * (1.0 - time/25.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D pointTexture;
            uniform float time;
            varying float vSize;
            varying vec3 vColor;
            
            void main() {
                // Fade out over time
                float opacity = 1.0 - (time / 25.0);
                opacity = max(0.0, opacity);
                
                gl_FragColor = vec4(vColor, opacity) * texture2D(pointTexture, gl_PointCoord);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        vertexColors: true
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Store animation data
    particles.userData = {
        velocity,
        startTime: clock.getElapsedTime(),
        duration: duration,
        update: function(elapsedTime) {
            const positions = particles.geometry.attributes.position.array;
            const runtime = elapsedTime - this.startTime;
            const progress = Math.min(runtime / this.duration, 1.0);
            
            material.uniforms.time.value = runtime;
            
            if (progress < 1.0) {
                // Update positions of particles based on velocity
                for (let i = 0; i < particleCount; i++) {
                    positions[i * 3] += velocity[i * 3] * (1.0 - progress * 0.5); // Slow down over time
                    positions[i * 3 + 1] += velocity[i * 3 + 1] * (1.0 - progress * 0.5);
                    positions[i * 3 + 2] += velocity[i * 3 + 2] * (1.0 - progress * 0.5);
                }
                particles.geometry.attributes.position.needsUpdate = true;
            } else {
                // Remove when complete
                scene.remove(particles);
            }
        }
    };
    
    // Add to scene's updateable objects
    if (!scene.userData.updateableObjects) {
        scene.userData.updateableObjects = [];
    }
    scene.userData.updateableObjects.push(particles);
    
    return particles;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    
    // Update shooting stars
    if (starfieldObjects && starfieldObjects.shootingStars) {
        starfieldObjects.shootingStars.userData.update(delta);
    }
    
    // Update any other scene objects that need animation
    if (scene.userData.updateableObjects) {
        for (let i = scene.userData.updateableObjects.length - 1; i >= 0; i--) {
            const obj = scene.userData.updateableObjects[i];
            if (obj.userData && obj.userData.update) {
                obj.userData.update(elapsedTime);
            }
        }
    }
    
    // Update dramatic event if in progress
    if (dramaticEventTriggered && scene.userData.dramaticEvent) {
        const event = scene.userData.dramaticEvent;
        const eventElapsed = elapsedTime - event.startTime;
        const progress = Math.min(eventElapsed / event.duration, 1.0);
        
        // Update supernova size and brightness
        if (progress < 0.3) {
            // Initial explosion
            const scale = 1 + progress * 100; // Grow from 1 to 30
            event.supernova.scale.set(scale, scale, scale);
            event.supernova.material.uniforms.time.value = elapsedTime;
            
            // Increase light intensity
            event.supernovaLight.intensity = progress * 10;
        } else if (progress < 0.7) {
            // Peak brightness
            event.supernova.material.uniforms.time.value = elapsedTime;
            event.supernovaLight.intensity = 3 + Math.sin(elapsedTime * 3) * 1.5;
        } else {
            // Fade out
            const fadeOut = 1 - ((progress - 0.7) / 0.3);
            const scale = 30 * fadeOut;
            event.supernova.scale.set(scale, scale, scale);
            event.supernova.material.uniforms.time.value = elapsedTime;
            event.supernovaLight.intensity = fadeOut * 3;
        }
        
        // If complete, clean up
        if (progress >= 1.0) {
            scene.remove(event.supernova);
            scene.remove(event.supernovaLight);
            dramaticEventTriggered = false;
            delete scene.userData.dramaticEvent;
        }
    }
    
    if (journeyStarted && isAutoPilot) {
        // Create a more dynamic camera motion
        // Use a longer cycle (5 minutes) for a more leisurely journey
        const pathPosition = (Date.now() % 300000) / 300000;
        
        // Get position on path
        const position = cameraPath.getPointAt(pathPosition);
        camera.position.copy(position);
        
        // Dynamic look-ahead based on time
        const lookAheadAmount = 0.01 + Math.sin(elapsedTime * 0.2) * 0.005; // Varies between 0.005 and 0.015
        const lookAtPosition = cameraPath.getPointAt((pathPosition + lookAheadAmount) % 1);
        camera.lookAt(lookAtPosition);
        
        // Add subtle camera rotation for more dramatic effect
        camera.rotateZ(Math.sin(elapsedTime * 0.05) * 0.001);
        
        // Check if we're near a point of interest
        checkLocationInfo();
        
        // Randomly trigger dramatic event after some time has passed (once per journey)
        if (!dramaticEventTriggered && elapsedTime > 60 && Math.random() < 0.001) {
            triggerDramaticEvent();
        }
    } else if (!isAutoPilot) {
        // Manual control updates
        controls.update();
    }
    
    // Use the composer to render with post-processing
    composer.render();
}

// Start loading assets and initialize when ready
updateProgress(0, 'Initializing...'); // Start progress at 0%
init();
animate(); 