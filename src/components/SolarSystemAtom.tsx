import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { useLanguage } from '../i18n/LanguageContext';
import { ChemicalElement, OrbitalBlock } from '../types/element';
import { BLOCK_META } from '../utils/quantum';
import { getShellSummaries, ShellSummary } from './BohrShellDiagram';

interface SolarSystemAtomProps {
  element: ChemicalElement;
  focusedShellN: number | null;
  onFocusShell: (n: number | null) => void;
  compact?: boolean;
}

type OrbitLayout = 'tilted' | 'ecliptic';
type CameraViewPreset = 'angled' | 'top' | 'edge';

const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3(0, 0, 0);

interface OrbitRingRuntime {
  n: number;
  ringGroup: THREE.Group;
  ringMesh: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  cloudMesh: THREE.Mesh;
  cloudMat: THREE.MeshBasicMaterial;
  radius: number;
  baseTiltX: number;
  baseTiltZ: number;
  angularSpeed: number;
  electrons: Array<{
    mesh: THREE.Mesh;
    mat: THREE.MeshPhysicalMaterial;
    baseAngle: number;
    block: OrbitalBlock;
  }>;
}

function createStarfieldGeometry(count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Deterministic Fibonacci-like pseudo-random spherical shell
    const u = ((i * 0.61803398875) % 1) * 2 - 1;
    const theta = i * 2.39996323;
    const r = 42 + (i % 17) * 1.8;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    positions[i * 3 + 0] = r * s * Math.cos(theta);
    positions[i * 3 + 1] = r * u;
    positions[i * 3 + 2] = r * s * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

export function SolarSystemAtom({
  element,
  focusedShellN,
  onFocusShell,
  compact = false,
}: SolarSystemAtomProps) {
  const { isAr, getElementName } = useLanguage();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const [orbitLayout, setOrbitLayout] = useState<OrbitLayout>('tilted');
  const [showClouds, setShowClouds] = useState(false);
  const [dockOpen, setDockOpen] = useState(true);
  const [contextLost, setContextLost] = useState(false);

  const shells = useMemo(() => getShellSummaries(element), [element]);

  const stateRef = useRef({
    isPlaying,
    speed,
    orbitLayout,
    showClouds,
    focusedShellN,
    element,
    shells,
  });
  stateRef.current = {
    isPlaying,
    speed,
    orbitLayout,
    showClouds,
    focusedShellN,
    element,
    shells,
  };

  const sceneApiRef = useRef<{
    rebuildAtom: () => void;
    updateHighlightAndLayout: () => void;
    setCameraPreset: (preset: CameraViewPreset) => void;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 720;
    const height = container.clientHeight || (compact ? 360 : 460);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = 0x060913;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.012);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    camera.position.set(0, 12.5, 22);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 6;
    controls.maxDistance = 42;
    controls.target.set(0, 0, 0);
    controls.update();

    // Lighting rig: warm solar key from nucleus + cool deep-space fill + rim
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const solarPointLight = new THREE.PointLight(0xffedd5, 6.5, 45, 1.4);
    solarPointLight.position.set(0, 0, 0);
    scene.add(solarPointLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
    keyLight.position.set(12, 18, 14);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-14, -6, -12);
    scene.add(rimLight);

    // Subtle deep-space starfield backdrop
    const starGeo = createStarfieldGeometry(280);
    const starMat = new THREE.PointsMaterial({
      color: 0xcbd5e1,
      size: 0.16,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.65,
    });
    const stars = new THREE.Points(starGeo, starMat);
    stars.frustumCulled = false;
    scene.add(stars);

    // Shared geometries for nucleons, electrons, and cloud shells
    const nucleonGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const electronGeo = new THREE.SphereGeometry(0.22, 18, 18);
    const cloudShellGeo = new THREE.SphereGeometry(1, 24, 18);

    // Composite Nucleus Star Group
    const nucleusGroup = new THREE.Group();
    scene.add(nucleusGroup);

    const protonMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.35,
      clearcoat: 0.6,
    });
    const neutronMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      emissive: 0x334155,
      emissiveIntensity: 0.3,
      roughness: 0.45,
      metalness: 0.6,
    });
    const coronaGeo = new THREE.TorusGeometry(0.95, 0.03, 12, 48);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.45,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    coronaMesh.rotation.x = Math.PI / 2;

    const orreryGroup = new THREE.Group();
    scene.add(orreryGroup);

    let activeRings: OrbitRingRuntime[] = [];
    const disposableRingGeos: THREE.BufferGeometry[] = [];
    const disposableMats: THREE.Material[] = [];

    const clearOrrery = () => {
      for (const r of activeRings) {
        orreryGroup.remove(r.ringGroup);
      }
      activeRings = [];
      for (const g of disposableRingGeos) g.dispose();
      disposableRingGeos.length = 0;
      for (const m of disposableMats) m.dispose();
      disposableMats.length = 0;
    };

    const rebuildNucleus = (z: number, block: OrbitalBlock) => {
      while (nucleusGroup.children.length > 0) {
        nucleusGroup.remove(nucleusGroup.children[0]);
      }
      const blockColor = new THREE.Color(BLOCK_META[block].hex);
      protonMat.color.copy(blockColor).lerp(new THREE.Color(0xfbbf24), 0.45);
      protonMat.emissive.copy(blockColor).lerp(new THREE.Color(0xf59e0b), 0.4);
      coronaMat.color.copy(blockColor);
      solarPointLight.color.copy(blockColor).lerp(new THREE.Color(0xffffff), 0.55);

      const visualNucleons = Math.min(28, Math.max(1, Math.round(Math.sqrt(z) * 2.6)));
      const clusterRadius = visualNucleons === 1 ? 0 : 0.16 + Math.min(0.42, visualNucleons * 0.015);
      for (let i = 0; i < visualNucleons; i++) {
        const mesh = new THREE.Mesh(nucleonGeo, i % 2 === 0 ? protonMat : neutronMat);
        if (visualNucleons === 1) {
          mesh.position.set(0, 0, 0);
          mesh.scale.setScalar(1.35);
        } else {
          const y = 1 - (i / (visualNucleons - 1)) * 2;
          const rAtY = Math.sqrt(Math.max(0, 1 - y * y));
          const theta = i * 2.39996323;
          mesh.position.set(
            Math.cos(theta) * rAtY * clusterRadius,
            y * clusterRadius,
            Math.sin(theta) * rAtY * clusterRadius
          );
          mesh.scale.setScalar(0.82);
        }
        nucleusGroup.add(mesh);
      }
      coronaMesh.scale.setScalar(0.75 + clusterRadius * 0.85);
      nucleusGroup.add(coronaMesh);
    };

    const rebuildAtom = () => {
      clearOrrery();
      const { element: el, shells: currentShells } = stateRef.current;
      rebuildNucleus(el.z, el.block);

      const totalShells = Math.max(currentShells.length, 1);
      const minR = 2.4;
      const maxR = Math.min(10.5, 2.4 + (totalShells - 1) * 1.45);

      currentShells.forEach((shell: ShellSummary) => {
        const t = totalShells === 1 ? 0 : (shell.n - 1) / (totalShells - 1);
        const radius = totalShells === 1 ? 3.8 : minR + t * (maxR - minR);

        const ringGroup = new THREE.Group();
        const ringGeo = new THREE.TorusGeometry(radius, 0.025, 10, 96);
        disposableRingGeos.push(ringGeo);

        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x64748b,
          transparent: true,
          opacity: 0.45,
        });
        disposableMats.push(ringMat);

        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringGroup.add(ringMesh);

        const dominantBlock =
          shell.electronsByBlock[shell.electronsByBlock.length - 1]?.block ?? el.block;
        const cloudMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(BLOCK_META[dominantBlock].hex),
          transparent: true,
          opacity: 0.06,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        disposableMats.push(cloudMat);
        const cloudMesh = new THREE.Mesh(cloudShellGeo, cloudMat);
        cloudMesh.scale.set(radius, radius * 0.42, radius);
        cloudMesh.visible = false;
        ringGroup.add(cloudMesh);

        // Kepler-style inclination angles per principal shell
        const sign = shell.n % 2 === 0 ? 1 : -1;
        const baseTiltX = shell.n === 1 ? 0.08 : sign * (0.14 + (shell.n % 3) * 0.09);
        const baseTiltZ = shell.n === 1 ? 0 : -sign * (0.08 + (shell.n % 2) * 0.08);

        const electrons: OrbitRingRuntime['electrons'] = [];
        const dotCount = shell.dots.length;

        shell.dots.forEach((dot, idx) => {
          const mat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(BLOCK_META[dot.block].hex),
            emissive: new THREE.Color(BLOCK_META[dot.block].hex),
            emissiveIntensity: 0.42,
            roughness: 0.2,
            metalness: 0.35,
            clearcoat: 0.9,
          });
          disposableMats.push(mat);

          const eMesh = new THREE.Mesh(electronGeo, mat);
          const baseAngle = (idx / Math.max(dotCount, 1)) * Math.PI * 2;
          eMesh.position.set(Math.cos(baseAngle) * radius, 0, Math.sin(baseAngle) * radius);
          ringGroup.add(eMesh);

          electrons.push({
            mesh: eMesh,
            mat,
            baseAngle,
            block: dot.block,
          });
        });

        orreryGroup.add(ringGroup);

        // Keplerian speed decreases with principal shell n: ω ∝ 1 / n^1.15
        const angularSpeed = (shell.n % 2 === 0 ? -1 : 1) * (1.25 / Math.pow(shell.n, 1.15));

        activeRings.push({
          n: shell.n,
          ringGroup,
          ringMesh,
          ringMat,
          cloudMesh,
          cloudMat,
          radius,
          baseTiltX,
          baseTiltZ,
          angularSpeed,
          electrons,
        });
      });

      updateHighlightAndLayout();
    };

    const updateHighlightAndLayout = () => {
      const {
        focusedShellN: focusN,
        element: el,
        orbitLayout: layout,
        showClouds: cloudsVisible,
      } = stateRef.current;
      const blockHex = BLOCK_META[el.block].hex;

      for (const r of activeRings) {
        const isFocused = focusN === r.n;
        const isDimmed = focusN !== null && focusN !== r.n;
        const isOuter = r.n === el.period;

        if (isFocused) {
          r.ringMat.color.set(blockHex);
          r.ringMat.opacity = 0.95;
        } else if (isOuter) {
          r.ringMat.color.set(0x94a3b8);
          r.ringMat.opacity = isDimmed ? 0.15 : 0.65;
        } else {
          r.ringMat.color.set(0x475569);
          r.ringMat.opacity = isDimmed ? 0.12 : 0.4;
        }

        r.cloudMesh.visible = cloudsVisible;
        r.cloudMat.opacity = isFocused ? 0.14 : isDimmed ? 0.02 : 0.055;

        const targetTiltX = layout === 'tilted' ? r.baseTiltX : 0;
        const targetTiltZ = layout === 'tilted' ? r.baseTiltZ : 0;
        r.ringGroup.rotation.x = targetTiltX;
        r.ringGroup.rotation.z = targetTiltZ;

        for (const e of r.electrons) {
          e.mat.emissiveIntensity = isFocused ? 0.9 : isDimmed ? 0.1 : 0.42;
          e.mat.opacity = isDimmed ? 0.25 : 1;
          e.mat.transparent = isDimmed;
          e.mesh.scale.setScalar(isFocused ? 1.25 : isDimmed ? 0.72 : 1);
        }
      }
    };

    let camTransition = false;
    const setCameraPreset = (preset: CameraViewPreset) => {
      if (preset === 'angled') {
        _targetPos.set(0, 12.5, 22);
      } else if (preset === 'top') {
        _targetPos.set(0, 24, 0.1);
      } else if (preset === 'edge') {
        _targetPos.set(0, 1.8, 24);
      }
      _targetLook.set(0, 0, 0);
      camTransition = true;
    };

    controls.addEventListener('start', () => {
      camTransition = false;
    });

    sceneApiRef.current = { rebuildAtom, updateHighlightAndLayout, setCameraPreset };
    rebuildAtom();

    // Animation loop with software-WebGL pacing
    let frameId = 0;
    let simTime = 0;
    let lastTime = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    function tick() {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const { isPlaying: playing, speed: spd } = stateRef.current;
      if (playing && !reducedMotion) {
        simTime += dt * spd;
        nucleusGroup.rotation.y += dt * 0.35 * spd;
        coronaMesh.rotation.z += dt * 0.5 * spd;
      }

      for (const r of activeRings) {
        for (const e of r.electrons) {
          const angle = e.baseAngle + simTime * r.angularSpeed;
          e.mesh.position.set(
            Math.cos(angle) * r.radius,
            0,
            Math.sin(angle) * r.radius
          );
        }
      }

      if (camTransition) {
        const camAlpha = 1 - Math.exp(-6 * dt);
        camera.position.lerp(_targetPos, camAlpha);
        controls.target.lerp(_targetLook, camAlpha);
        if (camera.position.distanceToSquared(_targetPos) < 0.004) {
          camTransition = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    tick();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || (compact ? 360 : 460);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => onResize()) : null;
    resizeObserver?.observe(container);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };

    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      clearOrrery();
      controls.dispose();
      nucleonGeo.dispose();
      electronGeo.dispose();
      cloudShellGeo.dispose();
      protonMat.dispose();
      neutronMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneApiRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneApiRef.current?.rebuildAtom();
  }, [element]);

  useEffect(() => {
    sceneApiRef.current?.updateHighlightAndLayout();
  }, [focusedShellN, orbitLayout, showClouds]);

  return (
    <div
      className={`relative w-full ${
        compact ? 'h-[360px]' : 'h-[460px]'
      } rounded-lg overflow-hidden border border-slate-800 bg-[#060913]`}
    >
      {/* Isolated WebGL mount container */}
      <div ref={mountRef} className="w-full h-full" />

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-slate-100 text-xs">
          {isAr
            ? 'تم فقدان سياق WebGL — جارٍ استعادة النموذج الشمسي ثلاثي الأبعاد...'
            : 'WebGL context lost — restoring 3D Solar-System Orrery...'}
        </div>
      )}

      {/* Minimal Top-Left Readout (solid rgba surface, no backdrop-blur over WebGL) */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none px-3 py-2 rounded-md border border-slate-800 bg-[#0B101E]/95 text-slate-100">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="font-mono text-amber-400">{element.z}p⁺</span>
          <span>
            {getElementName(element)} ({element.symbol})
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono" style={{ color: BLOCK_META[element.block].hex }}>
            {element.quantumAddress}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {isAr ? (
            <>
              الأغلفة (<span className="font-mono">{shells.map((s) => s.totalElectrons).join(' · ')}</span>) · اسحب للتدوير · مرّر للتكبير
            </>
          ) : (
            <span className="font-mono">
              Shells ({shells.map((s) => s.totalElectrons).join(' · ')}) · Drag to orbit · Scroll to zoom
            </span>
          )}
        </div>
      </div>

      {/* Shell Focus Quick Selector (Top-Right) */}
      <div dir="ltr" className="absolute top-3 right-3 z-10 flex flex-wrap items-center gap-1 max-w-[240px] justify-end">
        <button
          type="button"
          onClick={() => onFocusShell(null)}
          className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
            focusedShellN === null
              ? 'border-slate-100 bg-slate-100 text-slate-900 font-semibold'
              : 'border-slate-700 bg-[#0B101E]/95 text-slate-300 hover:border-slate-500'
          }`}
        >
          {isAr ? 'الكل' : 'All'}
        </button>
        {shells.map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => onFocusShell(focusedShellN === s.n ? null : s.n)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
              focusedShellN === s.n
                ? 'border-blue-500 bg-blue-600 text-white font-semibold'
                : 'border-slate-700 bg-[#0B101E]/95 text-slate-300 hover:border-slate-500'
            }`}
          >
            n={s.n}
          </button>
        ))}
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 transition-transform duration-200 ${
          dockOpen ? 'translate-y-0' : 'translate-y-[calc(100%-24px)]'
        }`}
      >
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setDockOpen((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-t border border-b-0 border-slate-700 bg-[#0B101E]/95 text-[10px] font-medium text-slate-300 cursor-pointer whitespace-nowrap"
          >
            {dockOpen ? (
              <>
                <ChevronDown className="w-3 h-3" aria-hidden="true" />
                <span>{isAr ? 'إخفاء أزرار التحكم' : 'Hide Orrery Controls'}</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3 h-3" aria-hidden="true" />
                <span>{isAr ? 'إظهار أزرار التحكم' : 'Show Orrery Controls'}</span>
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-[#0B101E]/95 text-slate-100">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 text-slate-900 hover:bg-white cursor-pointer whitespace-nowrap"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3" aria-hidden="true" />
                  <span>{isAr ? 'إيقاف' : 'Pause'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" aria-hidden="true" />
                  <span>{isAr ? 'مدار' : 'Orbit'}</span>
                </>
              )}
            </button>

            <div dir="ltr" className="flex items-center rounded border border-slate-700 overflow-hidden text-[10px] font-mono">
              {([0.5, 1, 2] as const).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpeed(sp)}
                  className={`px-1.5 py-1 cursor-pointer ${
                    speed === sp
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {sp}×
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setOrbitLayout((l) => (l === 'tilted' ? 'ecliptic' : 'tilted'))
              }
              className="px-2 py-1 text-[11px] font-medium rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 whitespace-nowrap cursor-pointer"
            >
              {orbitLayout === 'tilted'
                ? isAr
                  ? 'مستويات مائلة 3D'
                  : '3D Tilted Planes'
                : isAr
                  ? 'مسطح مداري'
                  : 'Flat Ecliptic'}
            </button>

            <button
              type="button"
              onClick={() => setShowClouds((c) => !c)}
              aria-pressed={showClouds}
              className={`px-2 py-1 text-[11px] font-medium rounded border whitespace-nowrap cursor-pointer ${
                showClouds
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isAr ? 'السحب الإلكترونية' : 'Electron Clouds'}
            </button>

            <button
              type="button"
              onClick={() => sceneApiRef.current?.setCameraPreset('angled')}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-slate-800 text-slate-200 hover:bg-slate-700 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>{isAr ? 'منظور مائل' : 'Angled'}</span>
            </button>

            <button
              type="button"
              onClick={() => sceneApiRef.current?.setCameraPreset('top')}
              className="px-2 py-1 text-[11px] font-medium rounded bg-slate-800 text-slate-200 hover:bg-slate-700 whitespace-nowrap cursor-pointer"
            >
              {isAr ? 'من الأعلى' : 'Ecliptic Top'}
            </button>

            <button
              type="button"
              onClick={() => sceneApiRef.current?.setCameraPreset('edge')}
              className="px-2 py-1 text-[11px] font-medium rounded bg-slate-800 text-slate-200 hover:bg-slate-700 whitespace-nowrap cursor-pointer"
            >
              {isAr ? 'أفقي' : 'Horizon'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
