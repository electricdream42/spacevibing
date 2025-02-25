import * as THREE from 'three';

/**
 * Camera path utility for smooth camera movement through space
 * Uses Catmull-Rom spline for natural motion between points
 */
class CameraPath {
    constructor() {
        this.points = [];
        this.curve = null;
    }
    
    /**
     * Add a point to the camera path
     * @param {THREE.Vector3} point - 3D point to add to the path
     */
    addPoint(point) {
        this.points.push(point);
        this._updateCurve();
    }
    
    /**
     * Get a point on the path at a specific position (0 to 1)
     * @param {number} t - Position along the path (0 to 1)
     * @returns {THREE.Vector3} - The point on the curve
     */
    getPointAt(t) {
        if (!this.curve || this.points.length < 2) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        return this.curve.getPointAt(t);
    }
    
    /**
     * Update the curve based on current points
     * @private
     */
    _updateCurve() {
        if (this.points.length < 2) {
            this.curve = null;
            return;
        }
        
        // Create a closed loop path
        this.curve = new THREE.CatmullRomCurve3(
            this.points,
            true, // closed
            'centripetal', // curve type
            0.5 // tension
        );
    }
    
    /**
     * Visualize the path (useful for debugging)
     * @param {THREE.Scene} scene - Scene to add the visualization to
     * @param {number} segments - Number of segments to divide the path into
     * @param {string} color - Color of the path
     */
    visualize(scene, segments = 100, color = 0xffff00) {
        if (!this.curve) return;
        
        const geometry = new THREE.BufferGeometry().setFromPoints(
            this.curve.getPoints(segments)
        );
        const material = new THREE.LineBasicMaterial({ color: color });
        const curveObject = new THREE.Line(geometry, material);
        
        scene.add(curveObject);
        return curveObject;
    }
}

export { CameraPath }; 