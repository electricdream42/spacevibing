# Galactic Journey - Space Simulation

An immersive 3D space simulation that takes you on a breathtaking journey through the cosmos. Fly past planets, stars, and nebulae in this awe-inspiring exploration of space.

## Features

- Realistic 3D rendering of planets with textures and atmospheric effects
- Dynamic starfield with thousands of stars
- Beautiful nebula clouds with glowing particle effects
- Smooth camera path for automated fly-through
- Interactive controls for manual exploration
- Optimized for performance with detailed visuals

## How to Run

1. Clone or download this repository
2. Open the project folder in your favorite code editor
3. Start a local server to view the simulation:

Using Python:
```
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

Using Node.js:
```
# If you have npx installed
npx http-server

# Or install http-server globally
npm install -g http-server
http-server
```

4. Open your browser and navigate to `http://localhost:8000` (or whichever port your server is using)

## Controls

- **Auto-pilot mode** (default): Sit back and enjoy the ride through space
- **Manual control**: Press the spacebar to toggle manual control
  - Use mouse to look around
  - Left-click and drag to rotate the view
  - Right-click and drag to pan
  - Scroll to zoom in/out

## Customization

The simulation is highly customizable. Here are some ways to modify it:

### Adding More Planets

Edit `js/main.js` and add more planets with the `createPlanet` function:

```javascript
const newPlanet = createPlanet(scene, {
    radius: 8,
    texture: 'saturn',
    position: new THREE.Vector3(-60, 10, 30),
    rotationSpeed: 0.005,
    hasRings: true
});
```

### Changing the Camera Path

Modify the camera path in `js/main.js` by adding or changing points:

```javascript
cameraPath.addPoint(new THREE.Vector3(x, y, z));
```

### Adding More Nebulae

Create additional nebulae with different colors:

```javascript
createNebula(scene, {
    position: new THREE.Vector3(x, y, z),
    scale: 80,
    color: 0x00aaff, // Blue nebula
    density: 10
});
```

## Performance Tips

If the simulation runs slowly on your device:

1. Reduce the number of stars in the starfield (in `js/main.js`):
   ```javascript
   createStarfield(scene, 5000); // Reduce from 10000 to 5000
   ```

2. Use lower polygon counts for planets by modifying the `js/components/planet.js` file:
   ```javascript
   const planetGeometry = new THREE.SphereGeometry(radius, 32, 32); // Reduce from 64 to 32
   ```

3. Disable some of the visual effects or reduce nebula density

## Credits

- Planet textures sourced from the Three.js examples repository
- Built with Three.js, a powerful JavaScript 3D library
- Inspired by space exploration and astronomy

## License

MIT License - Feel free to use, modify, and distribute this code for personal or commercial projects. 