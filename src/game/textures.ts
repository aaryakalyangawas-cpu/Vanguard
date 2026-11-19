import * as THREE from 'three';

function makeCanvas(size = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export interface FloorTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export function createArenaFloorTextures(maxAnisotropy: number): FloorTextureSet {
  const [albedoCanvas, aCtx] = makeCanvas(512);
  const [bumpCanvas, bCtx] = makeCanvas(512);
  const [roughCanvas, rCtx] = makeCanvas(512);

  // Base weathered concrete / tarmac
  aCtx.fillStyle = '#29303b';
  aCtx.fillRect(0, 0, 512, 512);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);
  rCtx.fillStyle = '#d4d4d4'; // ~0.83 roughness
  rCtx.fillRect(0, 0, 512, 512);

  // Aggregate stone & micro surface variation
  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 1 + Math.random() * 2.5;
    const bright = Math.random() > 0.48;
    aCtx.fillStyle = bright ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.11)';
    aCtx.fillRect(x, y, w, w);

    bCtx.fillStyle = bright ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.18)';
    bCtx.fillRect(x, y, w, w);
  }

  // Subtle damp/worn specular patches
  for (let i = 0; i < 16; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const rad = 28 + Math.random() * 65;
    const grad = rCtx.createRadialGradient(px, py, 2, px, py, rad);
    grad.addColorStop(0, 'rgba(90,90,90,0.5)');
    grad.addColorStop(1, 'rgba(212,212,212,0)');
    rCtx.fillStyle = grad;
    rCtx.beginPath();
    rCtx.arc(px, py, rad, 0, Math.PI * 2);
    rCtx.fill();
  }

  // Concrete slab expansion joints (deep recessed seams)
  aCtx.strokeStyle = '#141820';
  aCtx.lineWidth = 5;
  aCtx.strokeRect(2, 2, 508, 508);

  bCtx.strokeStyle = '#181818';
  bCtx.lineWidth = 6;
  bCtx.strokeRect(2, 2, 508, 508);

  // Inner quadrant seams
  aCtx.strokeStyle = 'rgba(15, 20, 28, 0.72)';
  aCtx.lineWidth = 2;
  bCtx.strokeStyle = '#3c3c3c';
  bCtx.lineWidth = 3;
  for (let g = 128; g < 512; g += 128) {
    aCtx.beginPath();
    aCtx.moveTo(g, 0);
    aCtx.lineTo(g, 512);
    aCtx.moveTo(0, g);
    aCtx.lineTo(512, g);
    aCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(g, 0);
    bCtx.lineTo(g, 512);
    bCtx.moveTo(0, g);
    bCtx.lineTo(512, g);
    bCtx.stroke();
  }

  // Subtle industrial floor stencil lines
  aCtx.strokeStyle = 'rgba(245, 158, 11, 0.14)';
  aCtx.lineWidth = 2;
  aCtx.strokeRect(120, 120, 16, 16);
  aCtx.beginPath();
  aCtx.moveTo(244, 256);
  aCtx.lineTo(268, 256);
  aCtx.moveTo(256, 244);
  aCtx.lineTo(256, 268);
  aCtx.stroke();

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(20, 20);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(20, 20);
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(20, 20);
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, bumpMap, roughnessMap };
}

export function createConcreteWallTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const [canvas, ctx] = makeCanvas(512);
  const [bumpCanvas, bCtx] = makeCanvas(512);

  ctx.fillStyle = '#475161';
  ctx.fillRect(0, 0, 512, 512);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);

  // Poured concrete formwork panels & tie-rod holes
  for (let y = 0; y < 512; y += 64) {
    ctx.fillStyle = y % 128 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.045)';
    ctx.fillRect(0, y, 512, 64);
    ctx.fillStyle = 'rgba(15,23,42,0.45)';
    ctx.fillRect(0, y, 512, 2.5);
    bCtx.fillStyle = '#303030';
    bCtx.fillRect(0, y, 512, 3);

    // Formwork tie holes
    for (let x = 64; x < 512; x += 128) {
      ctx.fillStyle = '#1f2630';
      ctx.beginPath();
      ctx.arc(x, y + 32, 4, 0, Math.PI * 2);
      ctx.fill();
      bCtx.fillStyle = '#101010';
      bCtx.beginPath();
      bCtx.arc(x, y + 32, 4.5, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  // Weathering streaks & grit
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 2, 3);
    bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    bCtx.fillRect(x, y, 2, 2);
  }

  // Lower protective industrial plinth + hazard chevron strip
  ctx.fillStyle = '#1e2430';
  ctx.fillRect(0, 424, 512, 88);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 432, 512, 22);
  ctx.clip();
  ctx.fillStyle = '#d97706';
  for (let x = -512; x < 1024; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 432);
    ctx.lineTo(x + 24, 432);
    ctx.lineTo(x + 48, 454);
    ctx.lineTo(x + 24, 454);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createContainerTextures(
  baseHex: string,
  stripeHex: string,
  maxAnisotropy: number
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const [canvas, ctx] = makeCanvas(512);
  const [bumpCanvas, bCtx] = makeCanvas(512);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);

  // Corrugated steel ribs with strong depth normal shading
  for (let x = 0; x < 512; x += 24) {
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.fillRect(x, 0, 10, 512);
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    ctx.fillRect(x + 10, 0, 8, 512);

    bCtx.fillStyle = '#282828';
    bCtx.fillRect(x, 0, 10, 512);
    bCtx.fillStyle = '#d8d8d8';
    bCtx.fillRect(x + 10, 0, 8, 512);
  }

  // Scratches & edge wear
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 10 + Math.random() * 20, 1);
  }

  // Heavy top & bottom frame rails
  ctx.fillStyle = 'rgba(15,23,42,0.58)';
  ctx.fillRect(0, 0, 512, 28);
  ctx.fillRect(0, 484, 512, 28);
  bCtx.fillStyle = '#f0f0f0';
  bCtx.fillRect(0, 0, 512, 28);
  bCtx.fillRect(0, 484, 512, 28);

  // Tactical stripe + stencil block
  ctx.fillStyle = stripeHex;
  ctx.fillRect(0, 236, 512, 22);
  ctx.fillStyle = 'rgba(248,250,252,0.5)';
  ctx.fillRect(36, 70, 86, 26);
  ctx.fillRect(36, 104, 52, 8);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createSteelDeckTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const [canvas, ctx] = makeCanvas(256);
  const [bumpCanvas, bCtx] = makeCanvas(256);

  ctx.fillStyle = '#333d4b';
  ctx.fillRect(0, 0, 256, 256);
  bCtx.fillStyle = '#707070';
  bCtx.fillRect(0, 0, 256, 256);

  // Diamond-plate industrial deck treads
  for (let y = 8; y < 256; y += 20) {
    for (let x = 8; x < 256; x += 20) {
      const rot = ((x + y) % 40 === 0 ? 1 : -1) * (Math.PI / 4);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(-5, -1.5, 10, 3);
      ctx.restore();

      bCtx.save();
      bCtx.translate(x, y);
      bCtx.rotate(rot);
      bCtx.fillStyle = '#e5e5e5';
      bCtx.fillRect(-5, -1.5, 10, 3);
      bCtx.restore();
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(6, 6);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 6);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createDesertFloorTextures(maxAnisotropy: number): FloorTextureSet {
  const [albedoCanvas, aCtx] = makeCanvas(512);
  const [bumpCanvas, bCtx] = makeCanvas(512);
  const [roughCanvas, rCtx] = makeCanvas(512);

  aCtx.fillStyle = '#a37e58';
  aCtx.fillRect(0, 0, 512, 512);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);
  rCtx.fillStyle = '#e5e5e5';
  rCtx.fillRect(0, 0, 512, 512);

  // Wind-swept sand ripples
  for (let y = 0; y < 512; y += 16) {
    aCtx.fillStyle = y % 32 === 0 ? 'rgba(255,235,205,0.08)' : 'rgba(70,45,25,0.07)';
    aCtx.fillRect(0, y, 512, 8);
    bCtx.fillStyle = y % 32 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)';
    bCtx.fillRect(0, y, 512, 8);
  }

  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 1 + Math.random() * 2.5;
    aCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,240,210,0.09)' : 'rgba(65,42,20,0.1)';
    aCtx.fillRect(x, y, w, w);
    bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
    bCtx.fillRect(x, y, w, w);
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(18, 18);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(18, 18);
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(18, 18);
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, bumpMap, roughnessMap };
}

export function createSandstoneTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const [canvas, ctx] = makeCanvas(512);
  const [bumpCanvas, bCtx] = makeCanvas(512);

  ctx.fillStyle = '#b48d66';
  ctx.fillRect(0, 0, 512, 512);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);

  // Masonry blocks
  for (let row = 0; row < 8; row++) {
    const y = row * 64;
    const offset = (row % 2) * 64;
    ctx.fillStyle = 'rgba(60,38,20,0.28)';
    ctx.fillRect(0, y, 512, 3);
    bCtx.fillStyle = '#303030';
    bCtx.fillRect(0, y, 512, 4);
    for (let x = offset; x < 512; x += 128) {
      ctx.fillRect(x, y, 3, 64);
      bCtx.fillRect(x, y, 4, 64);
    }
  }

  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,245,225,0.05)' : 'rgba(60,35,15,0.06)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 2);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createBunkerFloorTextures(maxAnisotropy: number): FloorTextureSet {
  const [albedoCanvas, aCtx] = makeCanvas(512);
  const [bumpCanvas, bCtx] = makeCanvas(512);
  const [roughCanvas, rCtx] = makeCanvas(512);

  aCtx.fillStyle = '#1e2733';
  aCtx.fillRect(0, 0, 512, 512);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);
  rCtx.fillStyle = '#707070'; // Semi-polished epoxy concrete (~0.44 roughness)
  rCtx.fillRect(0, 0, 512, 512);

  aCtx.strokeStyle = '#0f172a';
  aCtx.lineWidth = 4;
  aCtx.strokeRect(2, 2, 508, 508);

  aCtx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
  aCtx.lineWidth = 2;
  for (let g = 128; g < 512; g += 128) {
    aCtx.beginPath();
    aCtx.moveTo(g, 0);
    aCtx.lineTo(g, 512);
    aCtx.moveTo(0, g);
    aCtx.lineTo(512, g);
    aCtx.stroke();

    bCtx.fillStyle = '#404040';
    bCtx.fillRect(g - 1, 0, 2, 512);
    bCtx.fillRect(0, g - 1, 512, 2);
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(16, 16);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(16, 16);
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(16, 16);
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, bumpMap, roughnessMap };
}

export function createSoftGlowTexture(
  innerColor = 'rgba(255, 240, 200, 1)',
  midColor = 'rgba(255, 165, 60, 0.45)',
  outerColor = 'rgba(255, 120, 20, 0)'
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128);
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.32, midColor);
  grad.addColorStop(1, outerColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBulletHoleTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128);
  ctx.clearRect(0, 0, 128, 128);

  // Outer soot blast ring
  const scorch = ctx.createRadialGradient(64, 64, 8, 64, 64, 54);
  scorch.addColorStop(0, 'rgba(6, 8, 12, 0.96)');
  scorch.addColorStop(0.26, 'rgba(20, 22, 28, 0.78)');
  scorch.addColorStop(0.55, 'rgba(58, 62, 70, 0.34)');
  scorch.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = scorch;
  ctx.fillRect(0, 0, 128, 128);

  // Spalled concrete/metal rim
  ctx.strokeStyle = 'rgba(185, 192, 204, 0.42)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(64, 64, 15.5, 0, Math.PI * 2);
  ctx.stroke();

  // Inner dark cavity (slightly jagged)
  ctx.fillStyle = '#050608';
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = 11.5 + (i % 3 === 0 ? 2.4 : -1.2);
    const px = 64 + Math.cos(a) * r;
    const py = 64 + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Radial micro-fractures
  ctx.strokeStyle = 'rgba(12, 14, 18, 0.72)';
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.22;
    const endR = 26 + (i % 3) * 10;
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(a) * 11, 64 + Math.sin(a) * 11);
    ctx.lineTo(64 + Math.cos(a + 0.08) * (endR * 0.55), 64 + Math.sin(a + 0.08) * (endR * 0.55));
    ctx.lineTo(64 + Math.cos(a) * endR, 64 + Math.sin(a) * endR);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createExplosionCraterTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512);
  ctx.clearRect(0, 0, 512, 512);

  // Outer radial soot streaks
  for (let i = 0; i < 34; i++) {
    const angle = (i / 34) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
    const len = 155 + Math.random() * 88;
    const width = 0.05 + Math.random() * 0.09;
    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, len);
    grad.addColorStop(0, 'rgba(10, 10, 12, 0.88)');
    grad.addColorStop(0.55, 'rgba(26, 24, 22, 0.48)');
    grad.addColorStop(1, 'rgba(20, 20, 22, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.arc(256, 256, len, angle - width, angle + width);
    ctx.closePath();
    ctx.fill();
  }

  // Broad scorched blast halo
  const halo = ctx.createRadialGradient(256, 256, 36, 256, 256, 240);
  halo.addColorStop(0, 'rgba(8, 8, 10, 0.98)');
  halo.addColorStop(0.28, 'rgba(22, 20, 18, 0.92)');
  halo.addColorStop(0.52, 'rgba(56, 46, 36, 0.62)');
  halo.addColorStop(0.75, 'rgba(34, 30, 26, 0.24)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 512, 512);

  // Displaced rim gravel/dirt highlights
  for (let i = 0; i < 180; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 82 + Math.random() * 68;
    const px = 256 + Math.cos(a) * r;
    const py = 256 + Math.sin(a) * r;
    const sz = 2 + Math.random() * 5.5;
    ctx.fillStyle = Math.random() > 0.45 ? 'rgba(92, 78, 60, 0.55)' : 'rgba(14, 14, 16, 0.72)';
    ctx.fillRect(px, py, sz, sz);
  }

  // Deep recessed crater pit center
  const pit = ctx.createRadialGradient(256, 256, 6, 256, 256, 92);
  pit.addColorStop(0, 'rgba(4, 4, 6, 1)');
  pit.addColorStop(0.62, 'rgba(14, 13, 12, 0.96)');
  pit.addColorStop(1, 'rgba(28, 24, 20, 0)');
  ctx.fillStyle = pit;
  ctx.beginPath();
  ctx.arc(256, 256, 92, 0, Math.PI * 2);
  ctx.fill();

  // Radial ground cracks outward from crater rim
  ctx.strokeStyle = 'rgba(8, 8, 10, 0.85)';
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
    ctx.lineWidth = 2.2 + Math.random() * 2.5;
    ctx.beginPath();
    let r = 68;
    ctx.moveTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r);
    for (let step = 0; step < 4; step++) {
      r += 24 + Math.random() * 14;
      const jitter = (Math.random() - 0.5) * 0.14;
      ctx.lineTo(256 + Math.cos(a + jitter) * r, 256 + Math.sin(a + jitter) * r);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWallScorchTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256);
  ctx.clearRect(0, 0, 256, 256);

  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 122);
  grad.addColorStop(0, 'rgba(8, 8, 10, 0.94)');
  grad.addColorStop(0.35, 'rgba(24, 22, 20, 0.72)');
  grad.addColorStop(0.68, 'rgba(42, 38, 35, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(10, 12, 16, 0.82)';
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.15;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 14, 128 + Math.sin(a) * 14);
    ctx.lineTo(128 + Math.cos(a + 0.08) * 58, 128 + Math.sin(a + 0.08) * 58);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128);
  ctx.clearRect(0, 0, 128, 128);
  const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 62);
  grad.addColorStop(0, 'rgba(2, 4, 8, 0.78)');
  grad.addColorStop(0.55, 'rgba(2, 4, 8, 0.46)');
  grad.addColorStop(1, 'rgba(2, 4, 8, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createVehicleArmorTextures(maxAnisotropy: number): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const [bumpCanvas, bCtx] = makeCanvas(256);
  const [roughCanvas, rCtx] = makeCanvas(256);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);
  rCtx.fillStyle = '#9e9e9e'; // ~0.62 painted steel base
  rCtx.fillRect(0, 0, 256, 256);

  // Armor panel seams
  bCtx.strokeStyle = '#323232';
  bCtx.lineWidth = 3;
  bCtx.strokeRect(4, 4, 248, 248);
  bCtx.beginPath();
  bCtx.moveTo(128, 0);
  bCtx.lineTo(128, 256);
  bCtx.moveTo(0, 128);
  bCtx.lineTo(256, 128);
  bCtx.stroke();

  // Edge bare-metal wear (lower roughness along plate seams)
  rCtx.strokeStyle = '#585858';
  rCtx.lineWidth = 5;
  rCtx.strokeRect(4, 4, 248, 248);

  // Rivets along panel perimeters
  for (let i = 20; i < 244; i += 28) {
    for (const [rx, ry] of [
      [i, 16],
      [i, 116],
      [i, 140],
      [i, 240],
      [16, i],
      [240, i],
    ]) {
      bCtx.fillStyle = '#e5e5e5';
      bCtx.beginPath();
      bCtx.arc(rx, ry, 3, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  // Brushed grit & micro-scratches
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
    bCtx.fillRect(x, y, 4 + Math.random() * 8, 1);
    rCtx.fillStyle = Math.random() > 0.5 ? 'rgba(220,220,220,0.12)' : 'rgba(70,70,70,0.14)';
    rCtx.fillRect(x, y, 4 + Math.random() * 10, 1.5);
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 2);
  roughnessMap.anisotropy = maxAnisotropy;

  return { bumpMap, roughnessMap };
}

export function createRoadAsphaltTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const [canvas, ctx] = makeCanvas(256);
  const [bCanvas, bCtx] = makeCanvas(256);

  ctx.fillStyle = '#2c3340';
  ctx.fillRect(0, 0, 256, 256);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 3600; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.14)';
    ctx.fillRect(x, y, 2, 2);
    bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
    bCtx.fillRect(x, y, 2, 2);
  }

  // Worn tire tracks + faint dashed centerline
  ctx.fillStyle = 'rgba(15, 20, 28, 0.25)';
  ctx.fillRect(48, 0, 34, 256);
  ctx.fillRect(174, 0, 34, 256);

  ctx.fillStyle = 'rgba(241, 245, 249, 0.65)';
  ctx.fillRect(124, 18, 8, 92);
  ctx.fillRect(124, 146, 8, 92);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 36);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.ClampToEdgeWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(1, 36);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createSandbagTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const [canvas, ctx] = makeCanvas(256);
  const [bumpCanvas, bCtx] = makeCanvas(256);

  ctx.fillStyle = '#7c6e56';
  ctx.fillRect(0, 0, 256, 256);
  bCtx.fillStyle = '#707070';
  bCtx.fillRect(0, 0, 256, 256);

  // Stacked burlap sandbag rows
  for (let row = 0; row < 6; row++) {
    const y = row * 42;
    const off = (row % 2) * 42;
    for (let x = -42 + off; x < 256; x += 84) {
      ctx.fillStyle = row % 2 === 0 ? '#87785e' : '#776952';
      ctx.fillRect(x + 2, y + 3, 80, 36);
      ctx.strokeStyle = '#3f3628';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 3, 80, 36);

      bCtx.fillStyle = '#c8c8c8';
      bCtx.fillRect(x + 4, y + 5, 76, 32);
      bCtx.strokeStyle = '#202020';
      bCtx.lineWidth = 4;
      bCtx.strokeRect(x + 2, y + 3, 80, 36);
    }
  }

  // Burlap weave grit
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 1);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 1);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createWeaponDetailTextures(): {
  brushedBump: THREE.CanvasTexture;
  woodMap: THREE.CanvasTexture;
} {
  const [bCanvas, bCtx] = makeCanvas(128);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y++) {
    bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    bCtx.fillRect(0, y, 128, 1);
  }
  const brushedBump = new THREE.CanvasTexture(bCanvas);
  brushedBump.wrapS = brushedBump.wrapT = THREE.RepeatWrapping;

  const [wCanvas, wCtx] = makeCanvas(128);
  wCtx.fillStyle = '#6b3e24';
  wCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 3) {
    wCtx.fillStyle = y % 6 === 0 ? 'rgba(42,20,8,0.35)' : 'rgba(140,88,48,0.18)';
    wCtx.fillRect(0, y, 128, 2);
  }
  const woodMap = new THREE.CanvasTexture(wCanvas);
  woodMap.colorSpace = THREE.SRGBColorSpace;
  woodMap.wrapS = woodMap.wrapT = THREE.RepeatWrapping;

  return { brushedBump, woodMap };
}

export function createWallCrackTextures(): {
  stage1: THREE.CanvasTexture;
  stage2: THREE.CanvasTexture;
  hazardStripe: THREE.CanvasTexture;
} {
  // Stage 1: Initial hairline + branching concrete fractures
  const [c1, ctx1] = makeCanvas(512);
  ctx1.clearRect(0, 0, 512, 512);
  ctx1.strokeStyle = 'rgba(15, 18, 24, 0.86)';
  ctx1.lineCap = 'round';
  ctx1.lineJoin = 'round';

  const drawFractureBranch = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    angle: number,
    len: number,
    width: number,
    depth: number
  ) => {
    if (depth <= 0 || len < 14) return;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    let cx = x0;
    let cy = y0;
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      const jitter = (Math.random() - 0.5) * 0.6;
      cx += Math.cos(angle + jitter) * (len / steps);
      cy += Math.sin(angle + jitter) * (len / steps);
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    if (depth > 1) {
      drawFractureBranch(ctx, cx, cy, angle + 0.48 + Math.random() * 0.25, len * 0.62, width * 0.65, depth - 1);
      if (Math.random() > 0.3) {
        drawFractureBranch(ctx, cx, cy, angle - 0.52 - Math.random() * 0.25, len * 0.55, width * 0.6, depth - 1);
      }
    }
  };

  drawFractureBranch(ctx1, 140, 220, 0.35, 160, 4.5, 4);
  drawFractureBranch(ctx1, 360, 140, 2.45, 150, 4.0, 4);
  drawFractureBranch(ctx1, 250, 390, -1.25, 145, 4.0, 3);

  const stage1 = new THREE.CanvasTexture(c1);
  stage1.colorSpace = THREE.SRGBColorSpace;

  // Stage 2: Severe structural failure — wide dark fissures, concrete spalling craters, exposed steel rebar
  const [c2, ctx2] = makeCanvas(512);
  ctx2.clearRect(0, 0, 512, 512);

  // Dust & scorch halos
  for (let i = 0; i < 6; i++) {
    const px = 70 + (i % 3) * 185 + Math.random() * 40;
    const py = 110 + Math.floor(i / 3) * 240 + Math.random() * 50;
    const g = ctx2.createRadialGradient(px, py, 6, px, py, 74);
    g.addColorStop(0, 'rgba(12, 14, 18, 0.85)');
    g.addColorStop(0.55, 'rgba(30, 34, 42, 0.45)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx2.fillStyle = g;
    ctx2.beginPath();
    ctx2.arc(px, py, 74, 0, Math.PI * 2);
    ctx2.fill();
  }

  // Deep crevices
  ctx2.strokeStyle = 'rgba(8, 10, 14, 0.96)';
  ctx2.lineCap = 'round';
  ctx2.lineJoin = 'round';
  drawFractureBranch(ctx2, 95, 165, 0.25, 220, 10, 4);
  drawFractureBranch(ctx2, 415, 125, 2.35, 210, 9.5, 4);
  drawFractureBranch(ctx2, 260, 445, -1.45, 220, 10.5, 4);
  drawFractureBranch(ctx2, 65, 355, -0.3, 185, 8.5, 3);

  // Exposed rusted steel rebar grid inside blown-out holes
  ctx2.strokeStyle = '#6b442a';
  ctx2.lineWidth = 4;
  for (const bx of [150, 290]) {
    ctx2.beginPath();
    ctx2.moveTo(bx, 180);
    ctx2.lineTo(bx + 4, 285);
    ctx2.moveTo(bx - 28, 220);
    ctx2.lineTo(bx + 36, 222);
    ctx2.stroke();
  }

  const stage2 = new THREE.CanvasTexture(c2);
  stage2.colorSpace = THREE.SRGBColorSpace;

  // Hazmat yellow/black chevron warning stripe for explosive fuel drums
  const [hc, hCtx] = makeCanvas(256);
  hCtx.fillStyle = '#eab308';
  hCtx.fillRect(0, 0, 256, 256);
  hCtx.fillStyle = '#111827';
  for (let x = -256; x < 512; x += 48) {
    hCtx.beginPath();
    hCtx.moveTo(x, 0);
    hCtx.lineTo(x + 24, 0);
    hCtx.lineTo(x + 88, 256);
    hCtx.lineTo(x + 64, 256);
    hCtx.closePath();
    hCtx.fill();
  }
  const hazardStripe = new THREE.CanvasTexture(hc);
  hazardStripe.colorSpace = THREE.SRGBColorSpace;
  hazardStripe.wrapS = THREE.RepeatWrapping;

  return { stage1, stage2, hazardStripe };
}

export function createIslandFloorTextures(maxAnisotropy: number): FloorTextureSet {
  const [albedoCanvas, aCtx] = makeCanvas(512);
  const [bumpCanvas, bCtx] = makeCanvas(512);
  const [roughCanvas, rCtx] = makeCanvas(512);

  // Tropical island rich olive-emerald turf & volcanic soil
  aCtx.fillStyle = '#3b5332';
  aCtx.fillRect(0, 0, 512, 512);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);
  rCtx.fillStyle = '#dcdcdc';
  rCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 24; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const rad = 28 + Math.random() * 68;
    const grad = aCtx.createRadialGradient(px, py, 2, px, py, rad);
    grad.addColorStop(0, i % 2 === 0 ? 'rgba(84, 108, 60, 0.36)' : 'rgba(116, 104, 72, 0.3)');
    grad.addColorStop(1, 'rgba(59, 83, 50, 0)');
    aCtx.fillStyle = grad;
    aCtx.beginPath();
    aCtx.arc(px, py, rad, 0, Math.PI * 2);
    aCtx.fill();
  }

  for (let i = 0; i < 7200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 1 + Math.random() * 2.4;
    const bright = Math.random() > 0.48;
    aCtx.fillStyle = bright ? 'rgba(190, 215, 130, 0.06)' : 'rgba(18, 28, 16, 0.14)';
    aCtx.fillRect(x, y, w, w);
    bCtx.fillStyle = bright ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
    bCtx.fillRect(x, y, w, w);
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(44, 44);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(44, 44);
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(44, 44);
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, bumpMap, roughnessMap };
}

export function createOceanTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const [canvas, ctx] = makeCanvas(512);
  const [bumpCanvas, bCtx] = makeCanvas(512);

  const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
  baseGrad.addColorStop(0, '#083b5c');
  baseGrad.addColorStop(0.5, '#0c4e74');
  baseGrad.addColorStop(1, '#083b5c');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);

  // Layered directional ocean swells + subtle whitecap glints
  for (let i = 0; i < 620; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 22 + Math.random() * 54;
    const isCrest = Math.random() > 0.42;
    ctx.fillStyle = isCrest
      ? Math.random() > 0.85
        ? 'rgba(186, 230, 253, 0.22)'
        : 'rgba(56, 189, 248, 0.16)'
      : 'rgba(5, 34, 54, 0.28)';
    ctx.fillRect(x, y, len, isCrest ? 2.5 : 4.5);

    bCtx.fillStyle = isCrest ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.26)';
    bCtx.fillRect(x, y, len, 4);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(64, 64);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(64, 64);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createTrenchEarthTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const [canvas, ctx] = makeCanvas(256);
  const [bumpCanvas, bCtx] = makeCanvas(256);

  ctx.fillStyle = '#382c21';
  ctx.fillRect(0, 0, 256, 256);
  bCtx.fillStyle = '#7c7c7c';
  bCtx.fillRect(0, 0, 256, 256);

  // Shovel-turned soil clods and gravel grit
  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = 1.5 + Math.random() * 4;
    const light = Math.random() > 0.52;
    ctx.fillStyle = light ? 'rgba(98, 76, 54, 0.32)' : 'rgba(22, 16, 11, 0.38)';
    ctx.fillRect(x, y, w, w);
    bCtx.fillStyle = light ? 'rgba(225, 225, 225, 0.28)' : 'rgba(24, 24, 24, 0.3)';
    bCtx.fillRect(x, y, w, w);
  }

  // Subtle spade scrape streaks
  ctx.strokeStyle = 'rgba(20, 14, 10, 0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const y = i * 14 + Math.random() * 6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y + (Math.random() - 0.5) * 10);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createHelipadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512);

  // Dark weathered concrete apron
  ctx.fillStyle = '#252b34';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, y, 2.5, 2.5);
  }

  // Outer perimeter amber aiming ring & segmented hash marks
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(256, 256, 214, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(248, 250, 252, 0.88)';
  ctx.lineWidth = 8;
  ctx.setLineDash([28, 18]);
  ctx.beginPath();
  ctx.arc(256, 256, 174, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crisp aviation 'H' in center
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(174, 152, 34, 208);
  ctx.fillRect(304, 152, 34, 208);
  ctx.fillRect(174, 238, 164, 36);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHangarSignTexture(team: 'blue' | 'red'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);

  const accent = team === 'blue' ? '#38bdf8' : '#f87171';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(18, 18, 476, 10);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HEAVY ORDNANCE HANGAR', 256, 68);

  ctx.fillStyle = accent;
  ctx.font = 'bold 21px monospace';
  ctx.fillText('REARM · REPAIR · RESUPPLY [E / R]', 256, 103);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
