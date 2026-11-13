import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ELEMENTS } from '../data/elements';
import { ChemicalElement, ChemicalFamily, ColorOverlayMode } from '../types/element';
import { BLOCK_META, getElementHexColor } from '../utils/quantum';

interface PhaseSpace3DViewProps {
  selectedElement: ChemicalElement;
  onSelectElement: (el: ChemicalElement) => void;
  overlay: ColorOverlayMode;
  familyFilter: ChemicalFamily | 'all';
  isDark: boolean;
}

type CameraPreset = 'iso' | 'xy' | 'xz' | 'focus';

// Pre-allocated math helpers (zero GC inside animation/render loops)
const _vec3 = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _color = new THREE.Color();
const _dummy = new THREE.Object3D();

function getElementPosition3D(el: ChemicalElement, out: THREE.Vector3): THREE.Vector3 {
  // X: col32 (1..32) centered around 0 -> (-15.5 .. +15.5) * 0.72
  const x = (el.col32 - 16.5) * 0.72;
  // Y: principal energy level n = 1..7 -> 1.4 .. 10.4
  const y = 1.2 + (el.period - 1) * 1.45;
  // Z: chemical character (0 = nonmetal -> -5.5, 100 = strong metal -> +5.5)
  const z = ((el.metallicCharacter - 50) / 50) * 5.2;
  return out.set(x, y, z);
}

function createAxisLabelTexture(
  title: string,
  subtitle: string,
  isDark: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.88)';
  ctx.strokeStyle = isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(203, 213, 225, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 56);

  ctx.fillStyle = isDark ? '#94A3B8' : '#475569';
  ctx.font = '22px "IBM Plex Mono", monospace';
  ctx.fillText(subtitle, 256, 94);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createFloorGridTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isDark ? '#0B0F19' : '#F1F5F9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle calibrated grid lines
  ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.45)' : 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 32; i++) {
    const x = (i / 32) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let j = 0; j <= 10; j++) {
    const y = (j / 10) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Z=0 metalloid boundary line
  ctx.strokeStyle = isDark ? 'rgba(13, 148, 136, 0.7)' : 'rgba(13, 148, 136, 0.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function PhaseSpace3DView({
  selectedElement,
  onSelectElement,
  overlay,
  familyFilter,
  isDark,
}: PhaseSpace3DViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<ChemicalElement | null>(null);
  const [dockOpen, setDockOpen] = useState(true);
  const [contextLost, setContextLost] = useState(false);

  // Store latest callbacks & props in refs so WebGL scene never tears down on React state updates
  const onSelectRef = useRef(onSelectElement);
  onSelectRef.current = onSelectElement;
  const selectedRef = useRef(selectedElement);
  selectedRef.current = selectedElement;
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;
  const familyRef = useRef(familyFilter);
  familyRef.current = familyFilter;
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  const sceneApiRef = useRef<{
    setCameraPreset: (preset: CameraPreset) => void;
    syncVisuals: () => void;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 560;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = isDarkRef.current ? 0x070a12 : 0xf8fafc;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.014);

    // Studio reflection environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    camera.position.set(16, 13.5, 19.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 7;
    controls.maxDistance = 48;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 5.2, 0);
    controls.update();

    // 3-point warm/cool studio lighting
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x334155, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.85);
    keyLight.position.set(14, 24, 16);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -16;
    keyLight.shadow.camera.right = 16;
    keyLight.shadow.camera.top = 16;
    keyLight.shadow.camera.bottom = -16;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.75);
    rimLight.position.set(-16, 10, -14);
    scene.add(rimLight);

    // Floor phase-space plane with procedural calibrated grid
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    let floorTex = createFloorGridTexture(isDarkRef.current);
    floorTex.anisotropy = maxAniso;

    const floorGeo = new THREE.PlaneGeometry(25, 12.5);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.85,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Soft radial contact shadow under the phase-space stage
    const axisGroup = new THREE.Group();
    scene.add(axisGroup);

    const axisLineMat = new THREE.LineBasicMaterial({
      color: isDarkRef.current ? 0x475569 : 0x94a3b8,
      transparent: true,
      opacity: 0.75,
    });

    // Principal shell horizontal guide rings (Y = 1..7)
    const shellLineGeo = new THREE.BufferGeometry();
    const shellLineVerts: number[] = [];
    for (let p = 1; p <= 7; p++) {
      const y = 1.2 + (p - 1) * 1.45;
      shellLineVerts.push(-11.8, y, -5.8, 11.8, y, -5.8);
    }
    shellLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(shellLineVerts, 3));
    const shellLines = new THREE.LineSegments(shellLineGeo, axisLineMat);
    axisGroup.add(shellLines);

    // Vertical drop stems from each element to the Y=0 chemical plane
    const stemGeo = new THREE.BufferGeometry();
    const stemVerts = new Float32Array(ELEMENTS.length * 6);
    ELEMENTS.forEach((el, idx) => {
      getElementPosition3D(el, _vec3);
      stemVerts[idx * 6 + 0] = _vec3.x;
      stemVerts[idx * 6 + 1] = 0.03;
      stemVerts[idx * 6 + 2] = _vec3.z;
      stemVerts[idx * 6 + 3] = _vec3.x;
      stemVerts[idx * 6 + 4] = _vec3.y;
      stemVerts[idx * 6 + 5] = _vec3.z;
    });
    stemGeo.setAttribute('position', new THREE.BufferAttribute(stemVerts, 3));
    const stemMat = new THREE.LineBasicMaterial({
      color: isDarkRef.current ? 0x334155 : 0xcbd5e1,
      transparent: true,
      opacity: 0.5,
    });
    const stems = new THREE.LineSegments(stemGeo, stemMat);
    axisGroup.add(stems);

    // Axis label plaques
    const labelAssets: Array<{ mesh: THREE.Mesh; tex: THREE.CanvasTexture }> = [];
    const addLabelPlaque = (
      title: string,
      subtitle: string,
      pos: [number, number, number],
      rotY = 0
    ) => {
      const tex = createAxisLabelTexture(title, subtitle, isDarkRef.current);
      tex.anisotropy = maxAniso;
      const geo = new THREE.PlaneGeometry(4.4, 1.1);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.rotation.y = rotY;
      scene.add(mesh);
      labelAssets.push({ mesh, tex });
    };

    addLabelPlaque('X: ORBITAL FILLING', 's → f → d → p (1..32)', [0, 0.55, 6.8], 0);
    addLabelPlaque('Z+: METALS', 'Electropositive Character', [-13.4, 0.55, 3.8], Math.PI / 2);
    addLabelPlaque('Z−: NONMETALS', 'Electronegative / Closed', [-13.4, 0.55, -3.8], Math.PI / 2);
    addLabelPlaque('Y: SHELL LEVEL', 'Principal n = 1..7', [-12.6, 5.8, -5.8], 0);

    // 118 Element Nodes via two coordinated InstancedMeshes (collar + faceted crystal core)
    const count = ELEMENTS.length;
    const collarGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.14, 6);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.85,
      roughness: 0.25,
    });
    const collarInstanced = new THREE.InstancedMesh(collarGeo, collarMat, count);
    collarInstanced.castShadow = true;
    collarInstanced.receiveShadow = true;
    collarInstanced.frustumCulled = false;

    const coreGeo = new THREE.OctahedronGeometry(0.28, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.18,
      roughness: 0.24,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
    });
    const coreInstanced = new THREE.InstancedMesh(coreGeo, coreMat, count);
    coreInstanced.castShadow = true;
    coreInstanced.receiveShadow = true;
    coreInstanced.frustumCulled = false;
    coreInstanced.layers.enable(1); // Raycast layer 1

    scene.add(collarInstanced);
    scene.add(coreInstanced);

    // Multi-part Selected Element Beacon (3-part composite THREE.Group)
    const beaconGroup = new THREE.Group();
    const beaconRingGeo = new THREE.TorusGeometry(0.54, 0.04, 12, 36);
    const beaconRingMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.6,
      metalness: 0.6,
      roughness: 0.2,
    });
    const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
    beaconRing.rotation.x = Math.PI / 2;

    const beaconHaloGeo = new THREE.TorusGeometry(0.68, 0.02, 8, 36);
    const beaconHaloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    });
    const beaconHalo = new THREE.Mesh(beaconHaloGeo, beaconHaloMat);

    const beaconPinGeo = new THREE.CylinderGeometry(0.025, 0.025, 1, 8);
    const beaconPinMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    const beaconPin = new THREE.Mesh(beaconPinGeo, beaconPinMat);

    beaconGroup.add(beaconRing, beaconHalo, beaconPin);
    getElementPosition3D(selectedRef.current, beaconGroup.position);
    scene.add(beaconGroup);

    const updateInstanceTransformsAndColors = () => {
      const selZ = selectedRef.current.z;
      const activeOverlay = overlayRef.current;
      const activeFamily = familyRef.current;

      ELEMENTS.forEach((el, idx) => {
        getElementPosition3D(el, _vec3);
        const isSelected = el.z === selZ;
        const isFilteredOut = activeFamily !== 'all' && el.family !== activeFamily;
        const scale = isSelected ? 1.42 : isFilteredOut ? 0.55 : 1.0;

        // Collar
        _dummy.position.set(_vec3.x, _vec3.y - 0.16 * scale, _vec3.z);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();
        collarInstanced.setMatrixAt(idx, _dummy.matrix);

        // Core
        _dummy.position.set(_vec3.x, _vec3.y + 0.05 * scale, _vec3.z);
        _dummy.rotation.set(0, (idx * 0.35) % Math.PI, 0);
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();
        coreInstanced.setMatrixAt(idx, _dummy.matrix);

        const hex = getElementHexColor(el, activeOverlay);
        _color.set(hex);
        if (isFilteredOut) {
          _color.lerp(new THREE.Color(isDarkRef.current ? 0x1e293b : 0xcbd5e1), 0.78);
        }
        coreInstanced.setColorAt(idx, _color);

        // Collar tint based on block color subtly mixed with steel
        _color.set(BLOCK_META[el.block].hex).lerp(new THREE.Color(0x94a3b8), 0.55);
        collarInstanced.setColorAt(idx, _color);
      });

      collarInstanced.instanceMatrix.needsUpdate = true;
      coreInstanced.instanceMatrix.needsUpdate = true;
      if (coreInstanced.instanceColor) coreInstanced.instanceColor.needsUpdate = true;
      if (collarInstanced.instanceColor) collarInstanced.instanceColor.needsUpdate = true;
      collarInstanced.computeBoundingSphere();
      coreInstanced.computeBoundingSphere();

      // Update beacon color
      beaconRingMat.color.set(BLOCK_META[selectedRef.current.block].hex);
      beaconRingMat.emissive.set(BLOCK_META[selectedRef.current.block].hex);
    };

    updateInstanceTransformsAndColors();

    // Camera transition state
    let transitionActive = false;
    const setCameraPreset = (preset: CameraPreset) => {
      if (preset === 'iso') {
        _targetPos.set(16, 13.5, 19.5);
        _targetLook.set(0, 5.2, 0);
      } else if (preset === 'xy') {
        _targetPos.set(0, 5.4, 24);
        _targetLook.set(0, 5.4, 0);
      } else if (preset === 'xz') {
        _targetPos.set(0, 26, 0.1);
        _targetLook.set(0, 0, 0);
      } else if (preset === 'focus') {
        getElementPosition3D(selectedRef.current, _targetLook);
        _targetPos.set(_targetLook.x + 4.5, _targetLook.y + 3.2, _targetLook.z + 5.5);
      }
      transitionActive = true;
      requestRender();
    };

    // On-demand render scheduler with software-WebGL pacing
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        renderDirty = false;
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        // Smoothly damp beacon to selected element
        getElementPosition3D(selectedRef.current, _vec3);
        const dampAlpha = 1 - Math.exp(-12 * dt);
        beaconGroup.position.lerp(_vec3, dampAlpha);
        beaconPin.scale.set(1, Math.max(0.1, beaconGroup.position.y), 1);
        beaconPin.position.set(0, -beaconGroup.position.y / 2, 0);
        beaconHalo.rotation.y += dt * 1.1;

        const beaconStillMoving = beaconGroup.position.distanceToSquared(_vec3) > 0.0004;

        if (transitionActive) {
          const camAlpha = 1 - Math.exp(-6 * dt);
          camera.position.lerp(_targetPos, camAlpha);
          controls.target.lerp(_targetLook, camAlpha);
          if (
            camera.position.distanceToSquared(_targetPos) < 0.002 &&
            controls.target.distanceToSquared(_targetLook) < 0.002
          ) {
            transitionActive = false;
          }
        }

        const controlsMoving = controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty || transitionActive || beaconStillMoving || controlsMoving) {
            requestRender();
          }
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    const syncVisuals = () => {
      const nextBg = isDarkRef.current ? 0x070a12 : 0xf8fafc;
      (scene.background as THREE.Color).setHex(nextBg);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(nextBg);
      }
      const nextTex = createFloorGridTexture(isDarkRef.current);
      nextTex.anisotropy = maxAniso;
      floorMat.map = nextTex;
      floorMat.needsUpdate = true;
      floorTex.dispose();
      floorTex = nextTex;

      axisLineMat.color.setHex(isDarkRef.current ? 0x475569 : 0x94a3b8);
      stemMat.color.setHex(isDarkRef.current ? 0x334155 : 0xcbd5e1);

      updateInstanceTransformsAndColors();
      requestRender();
    };

    sceneApiRef.current = { setCameraPreset, syncVisuals };

    controls.addEventListener('change', requestRender);
    controls.addEventListener('start', () => {
      transitionActive = false;
    });

    // Raycasting for hover & click
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let lastHoverCheck = 0;

    const updatePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 45) return;
      lastHoverCheck = now;

      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(coreInstanced, false);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const el = ELEMENTS[hits[0].instanceId];
        setHoveredElement(el);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredElement(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    let pointerDownPos = { x: 0, y: 0 };
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (dx * dx + dy * dy > 25) return; // Dragging orbit, not a click

      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(coreInstanced, false);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const el = ELEMENTS[hits[0].instanceId];
        onSelectRef.current(el);
      }
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1000;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      requestRender();
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();
      collarGeo.dispose();
      collarMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      beaconRingGeo.dispose();
      beaconRingMat.dispose();
      beaconHaloGeo.dispose();
      beaconHaloMat.dispose();
      beaconPinGeo.dispose();
      beaconPinMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      floorTex.dispose();
      shellLineGeo.dispose();
      axisLineMat.dispose();
      stemGeo.dispose();
      stemMat.dispose();
      labelAssets.forEach(({ mesh, tex }) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        tex.dispose();
      });
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneApiRef.current = null;
    };
  }, []);

  // Sync visual props cleanly without tearing down WebGL context
  useEffect(() => {
    sceneApiRef.current?.syncVisuals();
  }, [selectedElement, overlay, familyFilter, isDark]);

  const activeInfo = hoveredElement ?? selectedElement;

  return (
    <div className="relative w-full h-[560px] sm:h-[620px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12]">
      {/* Isolated WebGL mount container */}
      <div ref={mountRef} className="w-full h-full" />

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-white text-sm">
          WebGL context lost — restoring 3D Phase-Space viewport...
        </div>
      )}

      {/* Minimal Top-Left Readout (solid rgba surface, zero backdrop-blur over WebGL) */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <span className="font-mono">{activeInfo.z}</span>
          <span>{activeInfo.name} ({activeInfo.symbol})</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-blue-600 dark:text-blue-400">
            {activeInfo.quantumAddress}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
          {hoveredElement ? 'Hovering node' : 'Selected node'} · Metallicity {activeInfo.metallicCharacter}% · Drag to orbit · Click any node
        </div>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 transition-transform duration-200 ${
          dockOpen ? 'translate-y-0' : 'translate-y-[calc(100%-26px)]'
        }`}
      >
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setDockOpen((v) => !v)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-t-md border border-b-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {dockOpen ? (
              <>
                <ChevronDown className="w-3 h-3" aria-hidden="true" />
                <span>Hide Camera Controls</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3 h-3" aria-hidden="true" />
                <span>Show Camera Controls</span>
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <button
              type="button"
              onClick={() => sceneApiRef.current?.setCameraPreset('iso')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>Isometric Phase-Space</span>
            </button>
            <button
              type="button"
              onClick={() => sceneApiRef.current?.setCameraPreset('xy')}
              className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 whitespace-nowrap cursor-pointer"
            >
              Orbital Plane (X–Y)
            </button>
            <button
              type="button"
              onClick={() => sceneApiRef.current?.setCameraPreset('xz')}
              className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 whitespace-nowrap cursor-pointer"
            >
              Metallic Ridge (X–Z)
            </button>
            <button
              type="button"
              onClick={() => sceneApiRef.current?.setCameraPreset('focus')}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 whitespace-nowrap cursor-pointer"
            >
              Focus {selectedElement.symbol}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
