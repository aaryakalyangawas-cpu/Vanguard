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
  const [canvas, ctx] = makeCanvas(64);
  ctx.clearRect(0, 0, 64, 64);

  const scorch = ctx.createRadialGradient(32, 32, 3, 32, 32, 26);
  scorch.addColorStop(0, 'rgba(10, 12, 16, 0.95)');
  scorch.addColorStop(0.32, 'rgba(22, 25, 32, 0.72)');
  scorch.addColorStop(0.65, 'rgba(40, 44, 52, 0.28)');
  scorch.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = scorch;
  ctx.fillRect(0, 0, 64, 64);

  // Inner dark crater
  ctx.fillStyle = '#06070a';
  ctx.beginPath();
  ctx.arc(32, 32, 7.5, 0, Math.PI * 2);
  ctx.fill();

  // Radial micro-cracks
  ctx.strokeStyle = 'rgba(15, 18, 24, 0.65)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.moveTo(32 + Math.cos(a) * 6, 32 + Math.sin(a) * 6);
    ctx.lineTo(32 + Math.cos(a) * (15 + (i % 2) * 5), 32 + Math.sin(a) * (15 + (i % 2) * 5));
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
