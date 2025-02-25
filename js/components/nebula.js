import * as THREE from 'three';
import { loadingManager } from '../utils/loading.js';

/**
 * Create a nebula cloud effect in space
 * @param {THREE.Scene} scene - The scene to add the nebula to
 * @param {Object} options - Configuration options
 * @returns {THREE.Group} - The nebula object
 */
function createNebula(scene, options = {}) {
    const {
        position = new THREE.Vector3(0, 0, -100),
        scale = 50,
        color = 0x8844aa, // Purple-ish color
        density = 8, // Number of cloud planes
        opacity = 0.35
    } = options;
    
    // Create a group to hold all nebula elements
    const nebulaGroup = new THREE.Group();
    nebulaGroup.position.copy(position);
    
    // Load nebula textures
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const nebulaClouds = [
        textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/lensflare/lensflare0.png'),
        textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/sprites/spark1.png')
    ];
    
    // Create random cloud planes for volumetric appearance
    for (let i = 0; i < density; i++) {
        // Randomize cloud appearance
        const cloudSize = scale * (0.6 + Math.random() * 0.8);
        const cloudOpacity = opacity * (0.5 + Math.random() * 0.5);
        const cloudColor = new THREE.Color(color);
        
        // Adjust hue slightly for variation
        cloudColor.offsetHSL(Math.random() * 0.1 - 0.05, 0, Math.random() * 0.2);
        
        // Create cloud material
        const cloudMaterial = new THREE.MeshBasicMaterial({
            map: nebulaClouds[i % nebulaClouds.length],
            transparent: true,
            opacity: cloudOpacity,
            color: cloudColor,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create cloud plane
        const cloudGeometry = new THREE.PlaneGeometry(cloudSize, cloudSize);
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        // Random position within nebula volume
        cloud.position.set(
            (Math.random() - 0.5) * scale * 0.6,
            (Math.random() - 0.5) * scale * 0.6,
            (Math.random() - 0.5) * scale * 0.6
        );
        
        // Random rotation
        cloud.rotation.x = Math.random() * Math.PI * 2;
        cloud.rotation.y = Math.random() * Math.PI * 2;
        cloud.rotation.z = Math.random() * Math.PI * 2;
        
        // Add cloud to group
        nebulaGroup.add(cloud);
    }
    
    // Add particle system for stars within nebula
    const particleCount = 300;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(particleCount * 3);
    const particlesSizes = new Float32Array(particleCount);
    
    // Generate random particles within nebula space
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        // Position
        particlesPositions[i3] = (Math.random() - 0.5) * scale;
        particlesPositions[i3 + 1] = (Math.random() - 0.5) * scale;
        particlesPositions[i3 + 2] = (Math.random() - 0.5) * scale;
        
        // Size
        particlesSizes[i] = 2 + Math.random() * 4;
    }
    
    // Add attributes to particle geometry
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particlesSizes, 1));
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
        size: 3,
        color: new THREE.Color(color).offsetHSL(0.1, 0, 0.2),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        map: nebulaClouds[1]
    });
    
    // Create particle system
    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    nebulaGroup.add(particles);
    
    // Add a subtle pulsating light inside the nebula
    const nebulaLight = new THREE.PointLight(
        new THREE.Color(color).offsetHSL(0, -0.3, 0.2),
        0.8,
        scale * 2
    );
    
    // Add animation
    const clockStart = Date.now();
    nebulaLight.userData = { clockStart };
    nebulaLight.onBeforeRender = function() {
        const elapsedTime = (Date.now() - clockStart) * 0.001; // seconds
        nebulaLight.intensity = 0.5 + Math.sin(elapsedTime * 0.5) * 0.3;
    };
    
    // Add light to group
    nebulaGroup.add(nebulaLight);
    
    // Add nebula group to scene
    scene.add(nebulaGroup);
    
    return nebulaGroup;
}

export { createNebula }; 