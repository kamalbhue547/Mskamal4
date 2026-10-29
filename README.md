# Singularity — Into the Black Hole

An interactive, real-time Three.js visualization of a stellar-mass black hole. Explore a glowing accretion disk, photon sphere, and a field of distant stars—then tune the mass and orbital speed yourself.

> A black hole is not a hole in space. It's a place where space itself falls in.

## Run it locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run the automated physics checks and create a production build:

```bash
npm test
npm run build
npm run preview
```

## Flight controls

- **Drag** the scene to orbit the black hole.
- **Scroll** or use the mass controls to change your view and the object's scale.
- Adjust the **disk flow rate** and **light-bending strength**.
- Toggle **gravitational lensing** and the **accretion disk** independently.
- Select **Enter the Event Horizon** for a closer approach.

## How it works

The scene is drawn in WebGL with Three.js. A procedural GLSL shader animates turbulence and heat across the accretion disk; a screen-space post-processing shader bends the rendered star field and disk around the projected black-hole shadow to approximate gravitational lensing. The star field and nearby dust are generated at runtime, so no large external assets are needed. Responsive HTML overlays provide observatory telemetry and interactive controls.

This is an educational visualization, not a numerical relativity solver. The horizon radius follows the Schwarzschild estimate `rₛ = 2GM/c²` (about 2.95 km per solar mass). The disk's glow, lensed photon ring, and time-flow controls are artistic representations designed to make the concepts explorable.

## Stack

- Three.js + custom GLSL
- Vite
- Vanilla JavaScript and CSS

## License

MIT. See [LICENSE](LICENSE).
