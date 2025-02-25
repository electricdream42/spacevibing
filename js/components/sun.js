import * as THREE from 'three';
import { loadingManager } from '../utils/loading.js';

/**
 * Create a sun with proper lighting and effects
 * @param {THREE.Scene} scene - The scene to add the sun to
 * @param {Object} options - Configuration options
 * @returns {THREE.Group} - The sun object
 */
function createSun(scene, options = {}) {
    const {
        radius = 15,
        position = new THREE.Vector3(0, 0, 0),
        color = 0xffdd88, // Warm sun color
        intensity = 1.5
    } = options;
    
    // Create a group to hold all sun-related objects
    const sunGroup = new THREE.Group();
    
    // Create the sun sphere
    const sunGeometry = new THREE.SphereGeometry(radius, 64, 64);
    
    // Load sun texture
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const sunTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/sun.jpg');
    
    // Create custom shader material for sun with animated glow
    const sunMaterial = new THREE.ShaderMaterial({
        uniforms: {
            sunTexture: { value: sunTexture },
            time: { value: 0 },
            color: { value: new THREE.Color(color) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D sunTexture;
            uniform float time;
            uniform vec3 color;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            
            void main() {
                // Basic texture
                vec4 texColor = texture2D(sunTexture, vUv);
                
                // Add pulsing glow based on time
                float pulse = 0.5 + 0.5 * sin(time * 0.5);
                float glow = 0.8 + 0.2 * pulse;
                
                // Edge glow (brighter at edges)
                float edgeFactor = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
                edgeFactor = pow(edgeFactor, 2.0) * 0.5;
                
                // Final color
                vec3 finalColor = texColor.rgb * color * glow;
                finalColor += color * edgeFactor * glow;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
        transparent: true
    });
    
    // Create sun mesh
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.copy(position);
    
    // Add point light at the sun's center
    const sunLight = new THREE.PointLight(color, intensity, 1000);
    sunLight.position.copy(position);
    
    // Create an omnidirectional light for general illumination
    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    
    // Add everything to the group
    sunGroup.add(sun);
    sunGroup.add(sunLight);
    scene.add(ambientLight);
    
    // Add animation update function
    sun.onBeforeRender = function(renderer, scene, camera, geometry, material) {
        material.uniforms.time.value = performance.now() * 0.001; // Time in seconds
    };
    
    // Add the group to the scene
    scene.add(sunGroup);
    
    return sunGroup;
}

export { createSun }; 