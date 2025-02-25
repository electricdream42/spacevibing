import * as THREE from 'three';
import { loadingManager } from '../utils/loading.js';

/**
 * Create a starfield of particles to simulate distant stars
 * @param {THREE.Scene} scene - The scene to add the starfield to
 * @param {number} count - Number of stars to create
 * @returns {Object} - The starfield objects including regular stars and shooting stars
 */
function createStarfield(scene, count = 5000) {
    // Create geometry for the stars
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    // For dynamic twinkling effect
    const randomOffsets = new Float32Array(count);
    const randomSpeeds = new Float32Array(count);
    
    // Generate random stars with varying colors and sizes
    for (let i = 0; i < count; i++) {
        // Position (random but far from center)
        const radius = THREE.MathUtils.randFloat(200, 2000);
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
        const phi = THREE.MathUtils.randFloat(0, Math.PI);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Color (mostly white/blue, some yellow/red)
        const starType = Math.random();
        if (starType > 0.9) {
            // Red/yellow stars (cooler)
            colors[i * 3] = THREE.MathUtils.randFloat(0.8, 1.0);     // R
            colors[i * 3 + 1] = THREE.MathUtils.randFloat(0.5, 0.8); // G
            colors[i * 3 + 2] = THREE.MathUtils.randFloat(0.0, 0.3); // B
        } else if (starType > 0.5) {
            // White stars (medium)
            colors[i * 3] = THREE.MathUtils.randFloat(0.8, 1.0);     // R
            colors[i * 3 + 1] = THREE.MathUtils.randFloat(0.8, 1.0); // G
            colors[i * 3 + 2] = THREE.MathUtils.randFloat(0.8, 1.0); // B
        } else {
            // Blue stars (hotter)
            colors[i * 3] = THREE.MathUtils.randFloat(0.6, 0.8);     // R
            colors[i * 3 + 1] = THREE.MathUtils.randFloat(0.7, 0.9); // G
            colors[i * 3 + 2] = THREE.MathUtils.randFloat(0.9, 1.0); // B
        }
        
        // Size (varying)
        sizes[i] = THREE.MathUtils.randFloat(1, 5);
        
        // For twinkling
        randomOffsets[i] = Math.random() * Math.PI * 2; // Random phase offset
        randomSpeeds[i] = 0.2 + Math.random() * 2.0; // Random speed for twinkling
    }
    
    // Add attributes to geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Store for animation
    const userData = {
        randomOffsets,
        randomSpeeds,
        sizes: Array.from(sizes), // Store original sizes
        colors: Array.from(colors) // Store original colors
    };
    
    // Load a star texture
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const starTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png');
    
    // Create material for stars
    const material = new THREE.PointsMaterial({
        size: 2,
        sizeAttenuation: true,
        map: starTexture,
        alphaTest: 0.01,
        transparent: true,
        vertexColors: true,
    });
    
    // Create the starfield and add to scene
    const starfield = new THREE.Points(geometry, material);
    starfield.userData = userData;
    scene.add(starfield);
    
    // Add animation function for twinkling
    starfield.onBeforeRender = function(renderer, scene, camera) {
        const time = performance.now() * 0.001; // Time in seconds
        const sizes = starfield.geometry.attributes.size;
        const sizesArray = sizes.array;
        const originalSizes = userData.sizes;
        
        // Update sizes for twinkling effect
        for (let i = 0; i < count; i++) {
            const offset = userData.randomOffsets[i];
            const speed = userData.randomSpeeds[i];
            
            // Oscillate size for twinkling
            const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * speed + offset));
            sizesArray[i] = originalSizes[i] * twinkle;
        }
        
        sizes.needsUpdate = true;
    };
    
    // Add shooting stars
    const shootingStars = createShootingStars(scene);
    
    return { starfield, shootingStars };
}

/**
 * Create shooting stars that periodically streak across the sky
 * @param {THREE.Scene} scene - The scene to add the shooting stars to
 * @returns {Object} - The shooting star system
 */
function createShootingStars(scene) {
    const count = 20; // Number of potential shooting stars
    const activeMax = 3; // Maximum number active at once
    
    // Create geometry for shooting stars
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    
    // Initialize all to inactive (alpha = 0)
    for (let i = 0; i < count; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
        alphas[i] = 0; // Hidden initially
    }
    
    // Add attributes to geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    
    // Custom shader material for shooting stars with trails
    const shootingStarMaterial = new THREE.ShaderMaterial({
        uniforms: {
            pointTexture: { value: new THREE.TextureLoader(loadingManager).load(
                'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/spark1.png') 
            }
        },
        vertexShader: `
            attribute float size;
            attribute float alpha;
            varying float vAlpha;
            
            void main() {
                vAlpha = alpha;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D pointTexture;
            varying float vAlpha;
            
            void main() {
                gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha) * texture2D(pointTexture, gl_PointCoord);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
    });
    
    // Create points for shooting stars
    const shootingStars = new THREE.Points(geometry, shootingStarMaterial);
    scene.add(shootingStars);
    
    // Store active shooting stars data
    const activeShootingStars = [];
    
    // Function to create a new shooting star
    function createNewShootingStar() {
        if (activeShootingStars.length >= activeMax) return;
        
        // Find an inactive slot
        let slot = -1;
        for (let i = 0; i < count; i++) {
            if (alphas.array[i] <= 0) {
                slot = i;
                break;
            }
        }
        
        if (slot === -1) return; // No free slots
        
        // Random direction in upper hemisphere
        const phi = THREE.MathUtils.randFloat(0, Math.PI * 0.4); // Angle from top
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2); // Around horizon
        
        // Random distance
        const radius = THREE.MathUtils.randFloat(300, 600);
        
        // Start position
        const startX = radius * Math.sin(phi) * Math.cos(theta);
        const startY = radius * Math.cos(phi); // Mostly from above
        const startZ = radius * Math.sin(phi) * Math.sin(theta);
        
        // End position (continuing in mostly same direction but downward)
        const endPhi = phi + THREE.MathUtils.randFloat(0.3, 0.6); // Continue downward
        const endTheta = theta + THREE.MathUtils.randFloat(-0.1, 0.1); // Slight curve
        
        // Calculate end position
        const endX = radius * Math.sin(endPhi) * Math.cos(endTheta);
        const endY = radius * Math.cos(endPhi);
        const endZ = radius * Math.sin(endPhi) * Math.sin(endTheta);
        
        // Shooting star data
        const speed = THREE.MathUtils.randFloat(0.5, 2.0);
        const shootingStar = {
            index: slot,
            startPosition: new THREE.Vector3(startX, startY, startZ),
            endPosition: new THREE.Vector3(endX, endY, endZ),
            progress: 0,
            speed: speed,
            size: THREE.MathUtils.randFloat(6, 10),
            maxAlpha: THREE.MathUtils.randFloat(0.7, 1.0)
        };
        
        // Activate it
        positions[slot * 3] = startX;
        positions[slot * 3 + 1] = startY;
        positions[slot * 3 + 2] = startZ;
        sizes[slot] = shootingStar.size;
        alphas[slot] = 0.1; // Start faint
        
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.size.needsUpdate = true;
        geometry.attributes.alpha.needsUpdate = true;
        
        activeShootingStars.push(shootingStar);
    }
    
    // Function to update shooting stars
    function updateShootingStars(deltaTime) {
        for (let i = activeShootingStars.length - 1; i >= 0; i--) {
            const star = activeShootingStars[i];
            star.progress += deltaTime * star.speed * 0.1;
            
            // Update position - lerp from start to end
            const pos = new THREE.Vector3().lerpVectors(
                star.startPosition,
                star.endPosition,
                star.progress
            );
            
            const idx = star.index;
            positions[idx * 3] = pos.x;
            positions[idx * 3 + 1] = pos.y;
            positions[idx * 3 + 2] = pos.z;
            
            // Update alpha - fade in, then fade out
            let newAlpha = 0;
            if (star.progress < 0.2) {
                // Fade in
                newAlpha = THREE.MathUtils.mapLinear(star.progress, 0, 0.2, 0, star.maxAlpha);
            } else if (star.progress < 0.8) {
                // Full visibility
                newAlpha = star.maxAlpha;
            } else if (star.progress < 1) {
                // Fade out
                newAlpha = THREE.MathUtils.mapLinear(star.progress, 0.8, 1, star.maxAlpha, 0);
            }
            
            alphas[idx] = newAlpha;
            
            // Remove if complete
            if (star.progress >= 1.0) {
                alphas[idx] = 0;
                activeShootingStars.splice(i, 1);
            }
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.alpha.needsUpdate = true;
    }
    
    // Periodically create new shooting stars
    let lastCheck = 0;
    
    // Animation loop
    let clockStart = Date.now();
    shootingStars.userData = {
        update: function(deltaTime) {
            const now = Date.now();
            
            // Update existing shooting stars
            updateShootingStars(deltaTime);
            
            // Occasionally create new shooting stars
            if (now - lastCheck > 3000) { // Check every 3 seconds
                lastCheck = now;
                if (Math.random() < 0.4) { // 40% chance of creating a shooting star
                    createNewShootingStar();
                }
            }
        }
    };
    
    return shootingStars;
}

export { createStarfield }; 