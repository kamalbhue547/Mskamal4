import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';

const canvas = document.querySelector('#universe');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x06070d, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07070d, 0.012);
const camera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 120);

const lensingPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uLensCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uAspect: { value: window.innerWidth / window.innerHeight },
    uLensRadius: { value: 0.03 },
    uStrength: { value: 1.1 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uLensCenter;
    uniform float uAspect;
    uniform float uLensRadius;
    uniform float uStrength;
    varying vec2 vUv;
    void main(){
      vec2 delta = vUv - uLensCenter;
      vec2 radial = vec2(delta.x * uAspect, delta.y);
      float radius = length(radial);
      float safeRadius = max(radius, uLensRadius * 0.8);
      float bend = uStrength * uLensRadius * uLensRadius / safeRadius;
      float outsideHorizon = smoothstep(uLensRadius * 1.02, uLensRadius * 1.72, radius);
      vec2 sourceDelta = delta - (radial / safeRadius) * vec2(1.0 / uAspect, 1.0) * bend * outsideHorizon;
      vec2 sourceUv = clamp(uLensCenter + sourceDelta, vec2(0.001), vec2(0.999));
      vec4 lensed = texture2D(tDiffuse, sourceUv);
      vec4 original = texture2D(tDiffuse, vUv);
      float blend = smoothstep(uLensRadius * 0.82, uLensRadius * 1.2, radius);
      gl_FragColor = mix(original, lensed, blend);
    }`
});
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(lensingPass);
composer.addPass(new OutputPass());

const baseDistance = window.innerWidth < 650 ? 13.5 : 12;
let cameraDistance = baseDistance;
let targetDistance = baseDistance;
let theta = -0.45;
let phi = 1.28;
let targetTheta = theta;
let targetPhi = phi;
const lookTarget = new THREE.Vector3(0, 0.1, 0);

const blackHole = new THREE.Group();
scene.add(blackHole);
const hole = new THREE.Mesh(new THREE.SphereGeometry(1.05, 64, 64), new THREE.MeshBasicMaterial({ color: 0x010104 }));
blackHole.add(hole);

// A subtle gravitationally lensed photon ring, just outside the dark event horizon.
function ring(radius, tube, color, opacity) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 180), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  mesh.rotation.x = Math.PI / 2;
  blackHole.add(mesh);
  return mesh;
}
const photonRing = ring(1.16, 0.018, 0xffa174, 0.68);
const photonHaloRing = ring(1.22, 0.045, 0xfd6d47, 0.12);

const diskMaterial = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uSpeed: { value: 1 }, uTint: { value: new THREE.Color('#ff854e') } },
  vertexShader: `varying vec2 vUv; varying vec3 vPos; void main(){ vUv=uv; vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    varying vec2 vUv; varying vec3 vPos; uniform float uTime; uniform float uSpeed; uniform vec3 uTint;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){
      float angle=vUv.x*6.2831853;
      float flow=angle*7.0-uTime*uSpeed*1.45;
      float n=noise(vec2(flow,vUv.y*19.0))+0.42*noise(vec2(flow*2.1,vUv.y*48.0));
      float center=abs(vUv.y-0.5)*2.0;
      float edge=(1.0-smoothstep(0.31,0.5,center))*smoothstep(0.04,0.18,center);
      float bands=0.48+0.52*sin(flow+vUv.y*18.0+n*5.0);
      vec3 hot=mix(vec3(1.0,0.30,0.10),vec3(1.0,0.88,0.66),smoothstep(0.55,0.95,n+bands*0.22));
      hot=mix(hot,vec3(0.45,0.12,0.11),smoothstep(0.75,1.0,center));
      float alpha=edge*(0.30+0.7*n)*(.52+.48*bands);
      gl_FragColor=vec4(hot,alpha);
    }`
});
const disk = new THREE.Mesh(new THREE.TorusGeometry(2.12, 0.72, 48, 320), diskMaterial);
disk.rotation.x = Math.PI / 2;
blackHole.add(disk);
const innerDisk = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.14, 20, 240), new THREE.MeshBasicMaterial({ color: 0xffb581, transparent: true, opacity: 0.17, blending: THREE.AdditiveBlending, depthWrite: false }));
innerDisk.rotation.x = Math.PI / 2;
blackHole.add(innerDisk);
const outerDisk = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.42, 32, 256), new THREE.MeshBasicMaterial({ color: 0xf35b36, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false }));
outerDisk.rotation.x = Math.PI / 2;
blackHole.add(outerDisk);

// Warm, distant nebula points and a dense star field give the scene depth without image assets.
const starCount = 2400;
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);
const palette = [new THREE.Color('#ffffff'), new THREE.Color('#9cb9ff'), new THREE.Color('#ffd1a1'), new THREE.Color('#c5a5ff')];
for (let i = 0; i < starCount; i++) {
  const radius = 9 + Math.random() * 54;
  const a = Math.random() * Math.PI * 2;
  const z = Math.random() * 2 - 1;
  const radial = Math.sqrt(1 - z * z);
  starPositions[i * 3] = radius * radial * Math.cos(a);
  starPositions[i * 3 + 1] = radius * z * 0.72;
  starPositions[i * 3 + 2] = radius * radial * Math.sin(a);
  const c = palette[Math.floor(Math.random() * palette.length)];
  starColors.set([c.r, c.g, c.b], i * 3);
  starSizes[i] = Math.random() * 1.5 + 0.35;
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
const starMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexColors: true,
  vertexShader: `attribute float size; varying vec3 vColor; void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*(220.0/-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying vec3 vColor; void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float glow=exp(-d*12.0);gl_FragColor=vec4(vColor,glow*.82);}` });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Tiny ambient dust flecks around the accretion plane.
const dustCount = 700;
const dustPositions = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 2.1 + Math.random() * 3.5;
  dustPositions[i * 3] = Math.cos(a) * r;
  dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
  dustPositions[i * 3 + 2] = Math.sin(a) * r;
}
const dustGeometry = new THREE.BufferGeometry();
dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xffa677, size: 0.023, transparent: true, opacity: 0.58, blending: THREE.AdditiveBlending, depthWrite: false }));
blackHole.add(dust);

let isDragging = false;
let previousPointer = { x: 0, y: 0 };
let autoRotate = true;
canvas.addEventListener('pointerdown', (event) => { isDragging = true; autoRotate = false; previousPointer = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', (event) => {
  if (!isDragging) return;
  const dx = event.clientX - previousPointer.x;
  const dy = event.clientY - previousPointer.y;
  targetTheta -= dx * 0.004;
  targetPhi = THREE.MathUtils.clamp(targetPhi + dy * 0.004, 0.36, 1.47);
  previousPointer = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener('pointerup', () => { isDragging = false; });
canvas.addEventListener('pointercancel', () => { isDragging = false; });
canvas.addEventListener('wheel', (event) => { targetDistance = THREE.MathUtils.clamp(targetDistance + event.deltaY * 0.008, 5.3, 22); autoRotate = false; }, { passive: true });

const $ = (selector) => document.querySelector(selector);
const massSlider = $('#mass-slider');
const speedSlider = $('#speed-slider');
let speed = 1;
let mass = 4.3;
let lensing = true;
let diskVisible = true;
const setSliderFill = (input) => { const pct = ((input.value - input.min) / (input.max - input.min)) * 100; input.style.background = `linear-gradient(90deg,#ff986b 0%,#ff986b ${pct}%,#44434d ${pct}%,#44434d 100%)`; };
setSliderFill(massSlider); setSliderFill(speedSlider);
massSlider.addEventListener('input', () => {
  mass = Number(massSlider.value); $('#mass-number').textContent = mass.toFixed(1); $('#mass-value').innerHTML = `${mass.toFixed(1)}M <small>☉</small>`;
  const km = mass * 2.95; $('#radius-value').innerHTML = `${km.toFixed(1)} <small>km</small>`;
  blackHole.scale.setScalar(0.82 + mass * 0.043); setSliderFill(massSlider);
});
speedSlider.addEventListener('input', () => { speed = Number(speedSlider.value); $('#speed-number').textContent = speed.toFixed(1); setSliderFill(speedSlider); });
$('#lens-toggle').addEventListener('click', (event) => { lensing = !lensing; const button = event.currentTarget; button.classList.toggle('is-on', lensing); button.setAttribute('aria-checked', String(lensing)); photonRing.visible = photonHaloRing.visible = lensing; lensingPass.uniforms.uStrength.value = lensing ? 1.1 : 0; });
$('#disk-toggle').addEventListener('click', (event) => { diskVisible = !diskVisible; const button = event.currentTarget; button.classList.toggle('is-on', diskVisible); button.setAttribute('aria-checked', String(diskVisible)); disk.visible = innerDisk.visible = outerDisk.visible = dust.visible = diskVisible; });
$('#collapse-controls').addEventListener('click', (event) => { const panel = document.querySelector('.controls'); panel.classList.toggle('is-collapsed'); event.currentTarget.textContent = panel.classList.contains('is-collapsed') ? '+' : '−'; event.currentTarget.setAttribute('aria-label', panel.classList.contains('is-collapsed') ? 'Expand controls' : 'Collapse controls'); });
let toastTimer;
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2600); }
let entered = false;
$('#explore').addEventListener('click', () => {
  entered = !entered;
  targetDistance = entered ? 5.5 : baseDistance;
  autoRotate = !entered;
  $('#explore').innerHTML = entered ? '<span class="play-icon">↩</span> <span>RETURN TO OBSERVATORY</span><span class="button-arrow">↗</span>' : '<span class="play-icon">▶</span> <span>ENTER THE EVENT HORIZON</span><span class="button-arrow">↗</span>';
  toast(entered ? 'APPROACHING THE PHOTON SPHERE · TIME DILATION INCREASING' : 'RETURNING TO SAFE ORBIT');
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const elapsed = clock.elapsedTime;
  if (autoRotate) targetTheta += delta * 0.035;
  theta += (targetTheta - theta) * 0.035;
  phi += (targetPhi - phi) * 0.035;
  cameraDistance += (targetDistance - cameraDistance) * 0.035;
  camera.position.set(cameraDistance * Math.sin(phi) * Math.sin(theta), cameraDistance * Math.cos(phi), cameraDistance * Math.sin(phi) * Math.cos(theta));
  camera.lookAt(lookTarget);
  diskMaterial.uniforms.uTime.value = elapsed;
  diskMaterial.uniforms.uSpeed.value = speed;
  disk.rotation.z = Math.sin(elapsed * 0.08) * 0.012;
  innerDisk.rotation.z = -elapsed * 0.015;
  outerDisk.rotation.z = elapsed * 0.009;
  stars.rotation.y = elapsed * 0.0015;
  camera.updateMatrixWorld();
  const lensCenter = blackHole.getWorldPosition(new THREE.Vector3()).project(camera);
  lensingPass.uniforms.uLensCenter.value.set(lensCenter.x * 0.5 + 0.5, lensCenter.y * 0.5 + 0.5);
  lensingPass.uniforms.uAspect.value = camera.aspect;
  lensingPass.uniforms.uLensRadius.value = (1.05 * blackHole.scale.x) / (2 * cameraDistance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
  composer.render();
}
animate();
window.addEventListener('resize', () => {
  const width = window.innerWidth, height = window.innerHeight;
  camera.aspect = width / height; camera.updateProjectionMatrix(); composer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); composer.setSize(width, height);
});
