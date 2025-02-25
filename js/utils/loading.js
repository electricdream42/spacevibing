import * as THREE from 'three';

// Progress tracking elements
const progressBar = document.getElementById('progress-bar');
const loadingText = document.getElementById('loading-text');

// Create loading manager to track progress
const loadingManager = new THREE.LoadingManager();

// Update progress UI
function updateProgress(progress, message = null) {
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (message && loadingText) {
        loadingText.textContent = message;
    }
}

// Configure loading manager events
loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal) * 100;
    updateProgress(progress, `Loading assets... ${Math.floor(progress)}%`);
};

loadingManager.onLoad = function() {
    updateProgress(100, 'Ready for launch!');
};

loadingManager.onError = function(url) {
    console.error('Error loading', url);
    updateProgress(100, 'Some assets failed to load, but we can still continue.');
};

export { loadingManager, updateProgress }; 