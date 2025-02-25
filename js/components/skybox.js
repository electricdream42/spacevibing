import * as THREE from 'three';
import { loadingManager } from '../utils/loading.js';

/**
 * Create a skybox to provide the distant cosmic background
 * @param {THREE.Scene} scene - The scene to add the skybox to
 * @param {Object} options - Configuration options
 * @returns {THREE.Mesh} - The skybox mesh
 */
function createSkybox(scene, options = {}) {
    const {
        size = 5000,
        useHDRI = false // HDRI for realistic reflection but heavier
    } = options;
    
    const textureLoader = new THREE.TextureLoader(loadingManager);
    let skyboxMesh;
    
    if (useHDRI) {
        // High-quality HDRI approach (more realistic but heavier)
        // Requires the PMREMGenerator which might not be available in some Three.js bundled versions
        
        // Create cube texture
        const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);
        cubeTextureLoader.setPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/MilkyWay/');
        
        const skyboxTexture = cubeTextureLoader.load([
            'dark-s_px.jpg', 'dark-s_nx.jpg',
            'dark-s_py.jpg', 'dark-s_ny.jpg',
            'dark-s_pz.jpg', 'dark-s_nz.jpg'
        ]);
        
        // Set the scene's background to the skybox texture
        scene.background = skyboxTexture;
        
        return skyboxTexture; // No mesh to return in this case
    } else {
        // Simpler and lighter approach with a large sphere
        const skyGeometry = new THREE.SphereGeometry(size, 64, 64);
        
        // Load a space/starfield texture
        const skyTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/starry-deep-outer-space-galaxy.jpg');
        skyTexture.mapping = THREE.EquirectangularReflectionMapping;
        
        // Create material with the texture on the inside of the sphere
        const skyMaterial = new THREE.MeshBasicMaterial({
            map: skyTexture,
            side: THREE.BackSide, // Render on the inside
        });
        
        // Create and add the skybox
        skyboxMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        scene.add(skyboxMesh);
        
        return skyboxMesh;
    }
}

export { createSkybox }; 