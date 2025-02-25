import * as THREE from 'three';
import { loadingManager } from '../utils/loading.js';

// Cache for planet textures to avoid reloading
const textureCache = {};

// Predefined planet textures with their URLs
const planetTextures = {
    earth: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    mars: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars_1k_color.jpg',
    jupiter: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/jupiter_1k.jpg',
    saturn: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_1k.jpg',
    moon: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
    mercury: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mercury.jpg',
    venus: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/venus_atmosphere.jpg',
    neptune: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/neptune.jpg',
    uranus: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/uranus.jpg',
    pluto: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/pluto.jpg',
    // Fallback for custom textures
    generic: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
};

/**
 * Create a planet with texture and rotation
 * @param {THREE.Scene} scene - The scene to add the planet to
 * @param {Object} options - Configuration options
 * @returns {THREE.Group} - The planet group including any moons
 */
function createPlanet(scene, options = {}) {
    const {
        radius = 5,
        texture = 'earth',
        position = new THREE.Vector3(0, 0, 0),
        rotationSpeed = 0.005,
        tilt = 0.2, // Planet axis tilt in radians
        hasRings = false,
        hasAtmosphere = false,
        moons = [] // Array of moon configurations
    } = options;
    
    // Create a group to hold the planet and any moons
    const planetGroup = new THREE.Group();
    planetGroup.position.copy(position);
    
    // Load planet texture
    const textureLoader = new THREE.TextureLoader(loadingManager);
    
    // Determine texture URL
    const textureUrl = texture in planetTextures 
        ? planetTextures[texture] 
        : (typeof texture === 'string' ? texture : planetTextures.generic);
    
    // Use cached texture if available
    if (!textureCache[textureUrl]) {
        textureCache[textureUrl] = textureLoader.load(textureUrl);
    }
    
    // Create planet geometry and material
    const planetGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
        map: textureCache[textureUrl],
        bumpScale: 0.1,
        roughness: 0.8,
        metalness: 0.1
    });
    
    // Create planet mesh with proper tilt
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.rotation.x = tilt;
    
    // Add rings if specified (e.g., for Saturn)
    if (hasRings) {
        const ringsGeometry = new THREE.RingGeometry(
            radius * 1.4, // inner radius
            radius * 2.2, // outer radius
            128 // segments
        );
        
        // Load rings texture
        const ringsTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_rings.png');
        
        const ringsMaterial = new THREE.MeshStandardMaterial({
            map: ringsTexture,
            transparent: true,
            side: THREE.DoubleSide,
            roughness: 0.7,
            metalness: 0.2
        });
        
        const rings = new THREE.Mesh(ringsGeometry, ringsMaterial);
        rings.rotation.x = Math.PI / 2;
        rings.rotation.y = tilt;
        planetGroup.add(rings);
    }
    
    // Add atmosphere if specified (e.g., for Earth)
    if (hasAtmosphere) {
        const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.025, 64, 64);
        const atmosphereMaterial = new THREE.MeshLambertMaterial({
            color: 0x4ca6ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planetGroup.add(atmosphere);
    }
    
    // Add moons if specified
    moons.forEach(moon => {
        const moonRadius = moon.radius || radius * 0.27;
        const moonDistance = moon.distance || radius * 3;
        const moonRotationSpeed = moon.rotationSpeed || rotationSpeed * 2;
        
        // Create orbit group for the moon
        const moonOrbit = new THREE.Group();
        const moonAngle = Math.random() * Math.PI * 2; // Random starting position
        
        // Create moon geometry and material
        const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
        const moonMaterial = new THREE.MeshStandardMaterial({
            map: textureCache['moon'] || textureLoader.load(planetTextures.moon),
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Create moon mesh
        const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        moonMesh.position.set(moonDistance, 0, 0);
        
        // Add to orbit and tilt
        moonOrbit.add(moonMesh);
        moonOrbit.rotation.x = Math.random() * 0.5;
        moonOrbit.rotation.y = moonAngle;
        
        // Add animation properties
        moonOrbit.userData = {
            rotationSpeed: moonRotationSpeed,
            angle: moonAngle
        };
        
        planetGroup.add(moonOrbit);
    });
    
    // Add animation update function
    planet.userData = { rotationSpeed };
    planet.onBeforeRender = function() {
        planet.rotation.y += rotationSpeed;
        
        // Update moon positions
        planetGroup.children.forEach(child => {
            if (child !== planet && child.userData && child.userData.rotationSpeed) {
                child.userData.angle += child.userData.rotationSpeed;
                child.rotation.y = child.userData.angle;
            }
        });
    };
    
    // Add planet to group and scene
    planetGroup.add(planet);
    scene.add(planetGroup);
    
    return planetGroup;
}

export { createPlanet }; 