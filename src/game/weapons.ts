import * as THREE from 'three';
import { createWeaponDetailTextures } from './textures';
import { WeaponCategory, WeaponId, WeaponSpec } from './types';

export const WEAPON_CATEGORIES: Array<{ id: WeaponCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All (50)' },
  { id: 'assault', label: 'Assault (10)' },
  { id: 'smg', label: 'SMGs (7)' },
  { id: 'lmg', label: 'LMGs (6)' },
  { id: 'shotgun', label: 'Shotguns (5)' },
  { id: 'dmr', label: 'Marksman (6)' },
  { id: 'sniper', label: 'Snipers (6)' },
  { id: 'pistol', label: 'Sidearms (5)' },
  { id: 'launcher', label: 'Launchers (5)' },
];

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  // ======================= ASSAULT RIFLES (10) =======================
  m4a1: {
    id: 'm4a1', category: 'assault', slotGroup: 0, chassis: 'ar_nato', optic: 'holo', guidance: 'none',
    magStyle: 'box', finishHex: 0x1e242d, furnitureHex: 0x7c6a52,
    name: 'M4A1 SOPMOD', shortName: 'M4A1', caliber: '5.56×45mm NATO', role: 'Assault Carbine',
    fireMode: 'AUTO', damage: 35, headshotMult: 1.8, pellets: 1, rpm: 720, magSize: 30, reserveMax: 180,
    reloadTime: 1.6, baseSpread: 0.0085, adsSpread: 0.0018, moveSpreadPenalty: 0.013, recoilPitch: 0.019, recoilYaw: 0.008,
    adsFov: 54, moveSpeedMult: 1.0, range: 260, muzzleVelocity: 335, gravityScale: 0.52, tracerColor: 0xfbbf24, accentHex: '#F59E0B',
  },
  ak74: {
    id: 'ak74', category: 'assault', slotGroup: 0, chassis: 'ar_ak', optic: 'reflex', guidance: 'none',
    magStyle: 'curved', finishHex: 0x1f2329, furnitureHex: 0x8a583a,
    name: 'AK-74M', shortName: 'AK-74M', caliber: '5.45×39mm', role: 'Heavy Assault',
    fireMode: 'AUTO', damage: 40, headshotMult: 1.85, pellets: 1, rpm: 620, magSize: 30, reserveMax: 180,
    reloadTime: 1.8, baseSpread: 0.011, adsSpread: 0.0024, moveSpreadPenalty: 0.015, recoilPitch: 0.026, recoilYaw: 0.012,
    adsFov: 55, moveSpeedMult: 0.98, range: 265, muzzleVelocity: 325, gravityScale: 0.55, tracerColor: 0xf97316, accentHex: '#F97316',
  },
  scar_l: {
    id: 'scar_l', category: 'assault', slotGroup: 0, chassis: 'ar_nato', optic: 'holo', guidance: 'none',
    magStyle: 'box', barrelScale: 1.08, finishHex: 0x8d795a, furnitureHex: 0x746246,
    name: 'FN SCAR-L CQC', shortName: 'SCAR-L', caliber: '5.56×45mm NATO', role: 'Modular Rifle',
    fireMode: 'AUTO', damage: 38, headshotMult: 1.85, pellets: 1, rpm: 640, magSize: 30, reserveMax: 180,
    reloadTime: 1.7, baseSpread: 0.008, adsSpread: 0.0016, moveSpreadPenalty: 0.012, recoilPitch: 0.018, recoilYaw: 0.007,
    adsFov: 52, moveSpeedMult: 0.99, range: 275, muzzleVelocity: 345, gravityScale: 0.5, tracerColor: 0xfde047, accentHex: '#FACC15',
  },
  hk416: {
    id: 'hk416', category: 'assault', slotGroup: 0, chassis: 'ar_nato', optic: 'holo', guidance: 'none',
    suppressed: true, magStyle: 'box', finishHex: 0x262b33, furnitureHex: 0x16191f,
    name: 'HK416A5 Spec-Ops', shortName: 'HK416', caliber: '5.56×45mm NATO', role: 'Suppressed Carbine',
    fireMode: 'AUTO', damage: 34, headshotMult: 1.8, pellets: 1, rpm: 780, magSize: 30, reserveMax: 180,
    reloadTime: 1.55, baseSpread: 0.0078, adsSpread: 0.0015, moveSpreadPenalty: 0.011, recoilPitch: 0.017, recoilYaw: 0.006,
    adsFov: 54, moveSpeedMult: 1.01, range: 250, muzzleVelocity: 315, gravityScale: 0.54, tracerColor: 0x38bdf8, accentHex: '#38BDF8',
  },
  aug_a3: {
    id: 'aug_a3', category: 'assault', slotGroup: 0, chassis: 'bullpup', optic: 'acog', guidance: 'none',
    magStyle: 'box', barrelScale: 1.1, finishHex: 0x3f4e37, furnitureHex: 0x313d2b,
    name: 'Steyr AUG A3', shortName: 'AUG A3', caliber: '5.56×45mm NATO', role: 'Bullpup Assault',
    fireMode: 'AUTO', damage: 37, headshotMult: 1.8, pellets: 1, rpm: 690, magSize: 30, reserveMax: 180,
    reloadTime: 1.85, baseSpread: 0.009, adsSpread: 0.0015, moveSpreadPenalty: 0.01, recoilPitch: 0.019, recoilYaw: 0.008,
    adsFov: 46, moveSpeedMult: 1.0, range: 280, muzzleVelocity: 350, gravityScale: 0.48, tracerColor: 0x4ade80, accentHex: '#4ADE80',
  },
  famas_f1: {
    id: 'famas_f1', category: 'assault', slotGroup: 0, chassis: 'bullpup', optic: 'reflex', guidance: 'none',
    magStyle: 'box', barrelScale: 0.95, finishHex: 0x1a1e25, furnitureHex: 0x15181e,
    name: 'FAMAS Valorisé', shortName: 'FAMAS', caliber: '5.56×45mm', role: 'High-ROF Bullpup',
    fireMode: 'AUTO', damage: 31, headshotMult: 1.75, pellets: 1, rpm: 940, magSize: 25, reserveMax: 175,
    reloadTime: 1.75, baseSpread: 0.011, adsSpread: 0.0026, moveSpreadPenalty: 0.012, recoilPitch: 0.016, recoilYaw: 0.01,
    adsFov: 56, moveSpeedMult: 1.02, range: 240, muzzleVelocity: 325, gravityScale: 0.54, tracerColor: 0x60a5fa, accentHex: '#60A5FA',
  },
  galil_ace: {
    id: 'galil_ace', category: 'assault', slotGroup: 0, chassis: 'ar_ak', optic: 'holo', guidance: 'none',
    magStyle: 'curved', barrelScale: 1.04, finishHex: 0x2a2f38, furnitureHex: 0x22262d,
    name: 'IWI Galil ACE-32', shortName: 'Galil ACE', caliber: '7.62×39mm', role: 'Heavy Carbine',
    fireMode: 'AUTO', damage: 45, headshotMult: 1.85, pellets: 1, rpm: 610, magSize: 30, reserveMax: 150,
    reloadTime: 1.85, baseSpread: 0.01, adsSpread: 0.0021, moveSpreadPenalty: 0.014, recoilPitch: 0.025, recoilYaw: 0.01,
    adsFov: 54, moveSpeedMult: 0.97, range: 265, muzzleVelocity: 315, gravityScale: 0.58, tracerColor: 0xfb923c, accentHex: '#FB923C',
  },
  akm: {
    id: 'akm', category: 'assault', slotGroup: 0, chassis: 'ar_ak', optic: 'iron', guidance: 'none',
    magStyle: 'curved', barrelScale: 1.08, finishHex: 0x25282e, furnitureHex: 0x824c2e,
    name: 'AKM Modernized', shortName: 'AKM', caliber: '7.62×39mm', role: 'Hard-Hitting Assault',
    fireMode: 'AUTO', damage: 48, headshotMult: 1.9, pellets: 1, rpm: 560, magSize: 30, reserveMax: 150,
    reloadTime: 1.95, baseSpread: 0.013, adsSpread: 0.003, moveSpreadPenalty: 0.016, recoilPitch: 0.032, recoilYaw: 0.014,
    adsFov: 56, moveSpeedMult: 0.96, range: 255, muzzleVelocity: 295, gravityScale: 0.62, tracerColor: 0xef4444, accentHex: '#EF4444',
  },
  g36c: {
    id: 'g36c', category: 'assault', slotGroup: 0, chassis: 'ar_nato', optic: 'reflex', guidance: 'none',
    magStyle: 'box', barrelScale: 0.9, finishHex: 0x282d36, furnitureHex: 0x1a1e24,
    name: 'HK G36C Compact', shortName: 'G36C', caliber: '5.56×45mm', role: 'Tactical Carbine',
    fireMode: 'AUTO', damage: 34, headshotMult: 1.8, pellets: 1, rpm: 750, magSize: 30, reserveMax: 180,
    reloadTime: 1.5, baseSpread: 0.009, adsSpread: 0.002, moveSpreadPenalty: 0.011, recoilPitch: 0.017, recoilYaw: 0.008,
    adsFov: 56, moveSpeedMult: 1.03, range: 245, muzzleVelocity: 320, gravityScale: 0.54, tracerColor: 0x38bdf8, accentHex: '#38BDF8',
  },
  sig_mcx: {
    id: 'sig_mcx', category: 'assault', slotGroup: 0, chassis: 'ar_nato', optic: 'holo', guidance: 'none',
    suppressed: true, magStyle: 'box', barrelScale: 0.94, finishHex: 0x5c5346, furnitureHex: 0x23262c,
    name: 'SIG MCX Rattler', shortName: 'SIG MCX', caliber: '.300 Blackout', role: 'Stealth Assault',
    fireMode: 'AUTO', damage: 42, headshotMult: 1.85, pellets: 1, rpm: 700, magSize: 30, reserveMax: 150,
    reloadTime: 1.6, baseSpread: 0.009, adsSpread: 0.0018, moveSpreadPenalty: 0.011, recoilPitch: 0.02, recoilYaw: 0.008,
    adsFov: 54, moveSpeedMult: 1.02, range: 230, muzzleVelocity: 275, gravityScale: 0.64, tracerColor: 0xa855f7, accentHex: '#A855F7',
  },

  // ======================= SMGs & PDWs (7) =======================
  mp5: {
    id: 'mp5', category: 'smg', slotGroup: 0, chassis: 'smg_mp5', optic: 'reflex', guidance: 'none',
    suppressed: true, magStyle: 'curved', finishHex: 0x1b2028, furnitureHex: 0x14171c,
    name: 'MP5A3 SD Tactical', shortName: 'MP5A3', caliber: '9×19mm Parabellum', role: 'Suppressed SMG',
    fireMode: 'AUTO', damage: 28, headshotMult: 1.7, pellets: 1, rpm: 860, magSize: 30, reserveMax: 180,
    reloadTime: 1.35, baseSpread: 0.012, adsSpread: 0.0032, moveSpreadPenalty: 0.007, recoilPitch: 0.011, recoilYaw: 0.008,
    adsFov: 58, moveSpeedMult: 1.1, range: 165, muzzleVelocity: 255, gravityScale: 0.72, tracerColor: 0x38bdf8, accentHex: '#38BDF8',
  },
  p90: {
    id: 'p90', category: 'smg', slotGroup: 0, chassis: 'smg_pdw', optic: 'reflex', guidance: 'none',
    magStyle: 'none', finishHex: 0x2a2f37, furnitureHex: 0x191d23,
    name: 'FN P90 TR', shortName: 'P90 TR', caliber: '5.7×28mm SS190', role: '50-Rd Bullpup PDW',
    fireMode: 'AUTO', damage: 26, headshotMult: 1.75, pellets: 1, rpm: 920, magSize: 50, reserveMax: 250,
    reloadTime: 1.75, baseSpread: 0.011, adsSpread: 0.0028, moveSpreadPenalty: 0.006, recoilPitch: 0.01, recoilYaw: 0.007,
    adsFov: 58, moveSpeedMult: 1.11, range: 195, muzzleVelocity: 295, gravityScale: 0.62, tracerColor: 0x22d3ee, accentHex: '#22D3EE',
  },
  ump45: {
    id: 'ump45', category: 'smg', slotGroup: 0, chassis: 'smg_mp5', optic: 'holo', guidance: 'none',
    magStyle: 'box', finishHex: 0x1e2229, furnitureHex: 0x14171c,
    name: 'HK UMP-45', shortName: 'UMP-45', caliber: '.45 ACP', role: 'Heavy Submachine Gun',
    fireMode: 'AUTO', damage: 37, headshotMult: 1.75, pellets: 1, rpm: 600, magSize: 25, reserveMax: 150,
    reloadTime: 1.45, baseSpread: 0.012, adsSpread: 0.003, moveSpreadPenalty: 0.008, recoilPitch: 0.016, recoilYaw: 0.009,
    adsFov: 58, moveSpeedMult: 1.08, range: 165, muzzleVelocity: 245, gravityScale: 0.78, tracerColor: 0xfbbf24, accentHex: '#FBBF24',
  },
  vector45: {
    id: 'vector45', category: 'smg', slotGroup: 0, chassis: 'smg_pdw', optic: 'holo', guidance: 'none',
    magStyle: 'box', finishHex: 0x6f624f, furnitureHex: 0x1b1f25,
    name: 'KRISS Vector Gen II', shortName: 'Vector .45', caliber: '.45 ACP', role: 'Ultra-ROF CQB',
    fireMode: 'AUTO', damage: 25, headshotMult: 1.7, pellets: 1, rpm: 1120, magSize: 33, reserveMax: 198,
    reloadTime: 1.45, baseSpread: 0.013, adsSpread: 0.0036, moveSpreadPenalty: 0.007, recoilPitch: 0.009, recoilYaw: 0.008,
    adsFov: 58, moveSpeedMult: 1.1, range: 150, muzzleVelocity: 245, gravityScale: 0.78, tracerColor: 0xf43f5e, accentHex: '#F43F5E',
  },
  mp7: {
    id: 'mp7', category: 'smg', slotGroup: 0, chassis: 'smg_pdw', optic: 'reflex', guidance: 'none',
    suppressed: true, magStyle: 'pistol', finishHex: 0x202630, furnitureHex: 0x15181e,
    name: 'HK MP7A2 Armor-Piercer', shortName: 'MP7A2', caliber: '4.6×30mm', role: 'Compact AP PDW',
    fireMode: 'AUTO', damage: 28, headshotMult: 1.8, pellets: 1, rpm: 950, magSize: 40, reserveMax: 200,
    reloadTime: 1.4, baseSpread: 0.011, adsSpread: 0.0026, moveSpreadPenalty: 0.006, recoilPitch: 0.01, recoilYaw: 0.007,
    adsFov: 58, moveSpeedMult: 1.12, range: 190, muzzleVelocity: 300, gravityScale: 0.6, tracerColor: 0x34d399, accentHex: '#34D399',
  },
  pp19_bizon: {
    id: 'pp19_bizon', category: 'smg', slotGroup: 0, chassis: 'ar_ak', optic: 'iron', guidance: 'none',
    magStyle: 'drum', barrelScale: 0.72, finishHex: 0x23272e, furnitureHex: 0x181b20,
    name: 'PP-19 Bizon-2', shortName: 'PP-19 Bizon', caliber: '9×18mm Makarov', role: 'Helical 64-Rd SMG',
    fireMode: 'AUTO', damage: 25, headshotMult: 1.65, pellets: 1, rpm: 740, magSize: 64, reserveMax: 256,
    reloadTime: 1.9, baseSpread: 0.014, adsSpread: 0.0038, moveSpreadPenalty: 0.008, recoilPitch: 0.012, recoilYaw: 0.01,
    adsFov: 58, moveSpeedMult: 1.07, range: 155, muzzleVelocity: 240, gravityScale: 0.78, tracerColor: 0xf97316, accentHex: '#F97316',
  },
  thompson_m1: {
    id: 'thompson_m1', category: 'smg', slotGroup: 0, chassis: 'smg_mp5', optic: 'iron', guidance: 'none',
    magStyle: 'drum', finishHex: 0x262b33, furnitureHex: 0x7c492c,
    name: 'M1928A1 Thompson', shortName: 'Tommy Gun', caliber: '.45 ACP', role: 'Drum Submachine Gun',
    fireMode: 'AUTO', damage: 35, headshotMult: 1.75, pellets: 1, rpm: 700, magSize: 50, reserveMax: 200,
    reloadTime: 2.0, baseSpread: 0.015, adsSpread: 0.004, moveSpreadPenalty: 0.009, recoilPitch: 0.017, recoilYaw: 0.011,
    adsFov: 58, moveSpeedMult: 1.03, range: 160, muzzleVelocity: 245, gravityScale: 0.78, tracerColor: 0xf59e0b, accentHex: '#F59E0B',
  },

  // ======================= LMGs (6) =======================
  m249_saw: {
    id: 'm249_saw', category: 'lmg', slotGroup: 0, chassis: 'lmg_belt', optic: 'holo', guidance: 'none',
    magStyle: 'drum', finishHex: 0x232933, furnitureHex: 0x3b4833,
    name: 'M249 SAW Para', shortName: 'M249 SAW', caliber: '5.56×45mm Belt', role: 'Squad Automatic',
    fireMode: 'AUTO', damage: 35, headshotMult: 1.75, pellets: 1, rpm: 780, magSize: 100, reserveMax: 300,
    reloadTime: 3.1, baseSpread: 0.015, adsSpread: 0.0036, moveSpreadPenalty: 0.02, recoilPitch: 0.02, recoilYaw: 0.011,
    adsFov: 55, moveSpeedMult: 0.87, range: 270, muzzleVelocity: 335, gravityScale: 0.52, tracerColor: 0xfbbf24, accentHex: '#F59E0B',
  },
  pkm: {
    id: 'pkm', category: 'lmg', slotGroup: 0, chassis: 'lmg_belt', optic: 'iron', guidance: 'none',
    magStyle: 'drum', barrelScale: 1.18, finishHex: 0x1d2128, furnitureHex: 0x7b492c,
    name: 'PKM Pecheneg', shortName: 'PKM', caliber: '7.62×54mmR', role: 'Heavy General MG',
    fireMode: 'AUTO', damage: 48, headshotMult: 1.8, pellets: 1, rpm: 640, magSize: 100, reserveMax: 200,
    reloadTime: 3.4, baseSpread: 0.016, adsSpread: 0.0038, moveSpreadPenalty: 0.024, recoilPitch: 0.028, recoilYaw: 0.014,
    adsFov: 54, moveSpeedMult: 0.84, range: 295, muzzleVelocity: 350, gravityScale: 0.48, tracerColor: 0xf97316, accentHex: '#F97316',
  },
  mk48: {
    id: 'mk48', category: 'lmg', slotGroup: 0, chassis: 'lmg_belt', optic: 'acog', guidance: 'none',
    magStyle: 'drum', barrelScale: 1.12, finishHex: 0x6f5f49, furnitureHex: 0x20242c,
    name: 'Mk48 Mod 1', shortName: 'Mk48', caliber: '7.62×51mm NATO', role: 'Heavy SOCOM LMG',
    fireMode: 'AUTO', damage: 46, headshotMult: 1.8, pellets: 1, rpm: 690, magSize: 80, reserveMax: 240,
    reloadTime: 3.2, baseSpread: 0.014, adsSpread: 0.0032, moveSpreadPenalty: 0.022, recoilPitch: 0.024, recoilYaw: 0.012,
    adsFov: 46, moveSpeedMult: 0.86, range: 285, muzzleVelocity: 345, gravityScale: 0.5, tracerColor: 0xfacc15, accentHex: '#FACC15',
  },
  rpk74: {
    id: 'rpk74', category: 'lmg', slotGroup: 0, chassis: 'ar_ak', optic: 'reflex', guidance: 'none',
    magStyle: 'drum', barrelScale: 1.24, finishHex: 0x23272f, furnitureHex: 0x865236,
    name: 'RPK-74M Support', shortName: 'RPK-74', caliber: '5.45×39mm', role: 'Drum Support Rifle',
    fireMode: 'AUTO', damage: 40, headshotMult: 1.8, pellets: 1, rpm: 630, magSize: 75, reserveMax: 225,
    reloadTime: 2.35, baseSpread: 0.011, adsSpread: 0.0025, moveSpreadPenalty: 0.016, recoilPitch: 0.022, recoilYaw: 0.011,
    adsFov: 54, moveSpeedMult: 0.92, range: 270, muzzleVelocity: 330, gravityScale: 0.52, tracerColor: 0xfb923c, accentHex: '#FB923C',
  },
  mg42: {
    id: 'mg42', category: 'lmg', slotGroup: 0, chassis: 'lmg_belt', optic: 'iron', guidance: 'none',
    magStyle: 'drum', barrelScale: 1.15, finishHex: 0x1a1e24, furnitureHex: 0x4b3222,
    name: 'MG42 Buzzsaw', shortName: 'MG42', caliber: '7.92×57mm', role: '1200 RPM Suppressor',
    fireMode: 'AUTO', damage: 34, headshotMult: 1.7, pellets: 1, rpm: 1150, magSize: 100, reserveMax: 300,
    reloadTime: 3.3, baseSpread: 0.018, adsSpread: 0.0044, moveSpreadPenalty: 0.025, recoilPitch: 0.019, recoilYaw: 0.014,
    adsFov: 56, moveSpeedMult: 0.84, range: 260, muzzleVelocity: 335, gravityScale: 0.52, tracerColor: 0xef4444, accentHex: '#EF4444',
  },
  negev: {
    id: 'negev', category: 'lmg', slotGroup: 0, chassis: 'lmg_belt', optic: 'holo', guidance: 'none',
    magStyle: 'drum', finishHex: 0x2c333f, furnitureHex: 0x1b1f27,
    name: 'IWI Negev NG7', shortName: 'Negev NG7', caliber: '7.62×51mm', role: 'Precision Heavy LMG',
    fireMode: 'AUTO', damage: 41, headshotMult: 1.8, pellets: 1, rpm: 820, magSize: 120, reserveMax: 240,
    reloadTime: 3.5, baseSpread: 0.014, adsSpread: 0.0033, moveSpreadPenalty: 0.022, recoilPitch: 0.02, recoilYaw: 0.011,
    adsFov: 54, moveSpeedMult: 0.85, range: 280, muzzleVelocity: 340, gravityScale: 0.5, tracerColor: 0x38bdf8, accentHex: '#38BDF8',
  },

  // ======================= SHOTGUNS (5) =======================
  m870: {
    id: 'm870', category: 'shotgun', slotGroup: 0, chassis: 'shotgun_pump', optic: 'iron', guidance: 'none',
    magStyle: 'none', finishHex: 0x1e242d, furnitureHex: 0x16191f,
    name: 'M870 MCS Breacher', shortName: 'M870', caliber: '12-Gauge 00 Buck', role: 'Pump Shotgun',
    fireMode: 'PUMP', damage: 26, headshotMult: 1.55, pellets: 8, rpm: 78, magSize: 6, reserveMax: 36,
    reloadTime: 2.05, baseSpread: 0.058, adsSpread: 0.036, moveSpreadPenalty: 0.013, recoilPitch: 0.072, recoilYaw: 0.022,
    adsFov: 60, moveSpeedMult: 1.02, range: 72, muzzleVelocity: 225, gravityScale: 0.85, tracerColor: 0xfb923c, accentHex: '#FB923C',
  },
  benelli_m4: {
    id: 'benelli_m4', category: 'shotgun', slotGroup: 0, chassis: 'shotgun_auto', optic: 'reflex', guidance: 'none',
    magStyle: 'none', finishHex: 0x2c333e, furnitureHex: 0x191d24,
    name: 'Benelli M4 Super 90', shortName: 'M1014', caliber: '12-Gauge Tactical', role: 'Semi-Auto Shotgun',
    fireMode: 'SEMI', damage: 24, headshotMult: 1.55, pellets: 8, rpm: 210, magSize: 7, reserveMax: 42,
    reloadTime: 2.2, baseSpread: 0.06, adsSpread: 0.038, moveSpreadPenalty: 0.013, recoilPitch: 0.056, recoilYaw: 0.018,
    adsFov: 58, moveSpeedMult: 1.01, range: 68, muzzleVelocity: 225, gravityScale: 0.85, tracerColor: 0xfbbf24, accentHex: '#FBBF24',
  },
  spas12: {
    id: 'spas12', category: 'shotgun', slotGroup: 0, chassis: 'shotgun_pump', optic: 'iron', guidance: 'none',
    magStyle: 'none', barrelScale: 1.06, finishHex: 0x171a20, furnitureHex: 0x2d323b,
    name: 'Franchi SPAS-12', shortName: 'SPAS-12', caliber: '12-Gauge Magnum', role: 'Combat Shotgun',
    fireMode: 'SEMI', damage: 28, headshotMult: 1.55, pellets: 8, rpm: 165, magSize: 8, reserveMax: 40,
    reloadTime: 2.35, baseSpread: 0.055, adsSpread: 0.034, moveSpreadPenalty: 0.014, recoilPitch: 0.065, recoilYaw: 0.02,
    adsFov: 60, moveSpeedMult: 0.99, range: 75, muzzleVelocity: 235, gravityScale: 0.85, tracerColor: 0xef4444, accentHex: '#EF4444',
  },
  aa12: {
    id: 'aa12', category: 'shotgun', slotGroup: 0, chassis: 'shotgun_auto', optic: 'holo', guidance: 'none',
    magStyle: 'drum', finishHex: 0x262c35, furnitureHex: 0x14181e,
    name: 'AA-12 Atchisson Auto', shortName: 'AA-12', caliber: '12-Gauge Drum', role: 'Full-Auto Shotgun',
    fireMode: 'AUTO', damage: 19, headshotMult: 1.5, pellets: 7, rpm: 300, magSize: 20, reserveMax: 80,
    reloadTime: 2.45, baseSpread: 0.068, adsSpread: 0.046, moveSpreadPenalty: 0.014, recoilPitch: 0.036, recoilYaw: 0.016,
    adsFov: 60, moveSpeedMult: 0.94, range: 64, muzzleVelocity: 215, gravityScale: 0.9, tracerColor: 0xf97316, accentHex: '#F97316',
  },
  saiga12: {
    id: 'saiga12', category: 'shotgun', slotGroup: 0, chassis: 'ar_ak', optic: 'reflex', guidance: 'none',
    magStyle: 'box', barrelScale: 0.96, finishHex: 0x1f242c, furnitureHex: 0x16191f,
    name: 'Saiga-12K Tactical', shortName: 'Saiga-12K', caliber: '12-Gauge Box Mag', role: 'Mag-Fed Combat Shotgun',
    fireMode: 'SEMI', damage: 23, headshotMult: 1.55, pellets: 8, rpm: 240, magSize: 10, reserveMax: 50,
    reloadTime: 2.0, baseSpread: 0.064, adsSpread: 0.041, moveSpreadPenalty: 0.013, recoilPitch: 0.054, recoilYaw: 0.018,
    adsFov: 58, moveSpeedMult: 0.99, range: 66, muzzleVelocity: 220, gravityScale: 0.85, tracerColor: 0xf59e0b, accentHex: '#F59E0B',
  },

  // ======================= DMRs & BATTLE RIFLES (6) =======================
  mk14: {
    id: 'mk14', category: 'dmr', slotGroup: 0, chassis: 'dmr', optic: 'acog', guidance: 'none',
    magStyle: 'box', finishHex: 0x7c6a52, furnitureHex: 0x262b33,
    name: 'MK14 EBR', shortName: 'MK14 EBR', caliber: '7.62×51mm NATO', role: 'Marksman Rifle',
    fireMode: 'SEMI', damage: 72, headshotMult: 1.9, pellets: 1, rpm: 240, magSize: 12, reserveMax: 72,
    reloadTime: 2.05, baseSpread: 0.014, adsSpread: 0.0008, moveSpreadPenalty: 0.02, recoilPitch: 0.048, recoilYaw: 0.013,
    adsFov: 40, moveSpeedMult: 0.94, range: 320, muzzleVelocity: 365, gravityScale: 0.44, tracerColor: 0xfacc15, accentHex: '#FACC15',
  },
  scar_h: {
    id: 'scar_h', category: 'dmr', slotGroup: 0, chassis: 'dmr', optic: 'acog', guidance: 'none',
    magStyle: 'box', finishHex: 0x927c5b, furnitureHex: 0x766246,
    name: 'FN SCAR-H TPR', shortName: 'SCAR-H', caliber: '7.62×51mm NATO', role: 'Heavy Battle Rifle',
    fireMode: 'AUTO', damage: 62, headshotMult: 1.85, pellets: 1, rpm: 480, magSize: 20, reserveMax: 120,
    reloadTime: 1.95, baseSpread: 0.013, adsSpread: 0.0012, moveSpreadPenalty: 0.018, recoilPitch: 0.034, recoilYaw: 0.012,
    adsFov: 44, moveSpeedMult: 0.95, range: 300, muzzleVelocity: 355, gravityScale: 0.46, tracerColor: 0xfbbf24, accentHex: '#FBBF24',
  },
  svd_dragunov: {
    id: 'svd_dragunov', category: 'dmr', slotGroup: 0, chassis: 'dmr', optic: 'sniper', guidance: 'none',
    magStyle: 'box', barrelScale: 1.18, finishHex: 0x20252d, furnitureHex: 0x7d4c31,
    name: 'SVD Dragunov', shortName: 'Dragunov', caliber: '7.62×54mmR', role: 'Semi-Auto Sniper DMR',
    fireMode: 'SEMI', damage: 78, headshotMult: 1.95, pellets: 1, rpm: 195, magSize: 10, reserveMax: 60,
    reloadTime: 2.15, baseSpread: 0.017, adsSpread: 0.0006, moveSpreadPenalty: 0.022, recoilPitch: 0.056, recoilYaw: 0.014,
    adsFov: 32, moveSpeedMult: 0.93, range: 340, muzzleVelocity: 380, gravityScale: 0.4, tracerColor: 0xf97316, accentHex: '#F97316',
  },
  sr25: {
    id: 'sr25', category: 'dmr', slotGroup: 0, chassis: 'dmr', optic: 'acog', guidance: 'none',
    suppressed: true, magStyle: 'box', barrelScale: 1.06, finishHex: 0x1e242d, furnitureHex: 0x14171c,
    name: 'KAC SR-25 Match', shortName: 'SR-25', caliber: '7.62×51mm Match', role: 'Suppressed DMR',
    fireMode: 'SEMI', damage: 70, headshotMult: 1.9, pellets: 1, rpm: 255, magSize: 15, reserveMax: 75,
    reloadTime: 1.95, baseSpread: 0.013, adsSpread: 0.0007, moveSpreadPenalty: 0.019, recoilPitch: 0.042, recoilYaw: 0.01,
    adsFov: 38, moveSpeedMult: 0.95, range: 320, muzzleVelocity: 365, gravityScale: 0.43, tracerColor: 0x38bdf8, accentHex: '#38BDF8',
  },
  fal_osw: {
    id: 'fal_osw', category: 'dmr', slotGroup: 0, chassis: 'dmr', optic: 'holo', guidance: 'none',
    magStyle: 'box', barrelScale: 0.96, finishHex: 0x262b34, furnitureHex: 0x171a20,
    name: 'DSA FAL OSW', shortName: 'FAL OSW', caliber: '7.62×51mm NATO', role: 'Assault Battle Rifle',
    fireMode: 'SEMI', damage: 66, headshotMult: 1.88, pellets: 1, rpm: 320, magSize: 20, reserveMax: 100,
    reloadTime: 2.0, baseSpread: 0.014, adsSpread: 0.0014, moveSpreadPenalty: 0.018, recoilPitch: 0.04, recoilYaw: 0.013,
    adsFov: 48, moveSpeedMult: 0.96, range: 295, muzzleVelocity: 350, gravityScale: 0.48, tracerColor: 0xf59e0b, accentHex: '#F59E0B',
  },
  vss_vintorez: {
    id: 'vss_vintorez', category: 'dmr', slotGroup: 0, chassis: 'ar_ak', optic: 'acog', guidance: 'none',
    suppressed: true, magStyle: 'box', barrelScale: 1.05, finishHex: 0x1f252e, furnitureHex: 0x6f4329,
    name: 'VSS Vintorez', shortName: 'Vintorez', caliber: '9×39mm Subsonic', role: 'Integrally Suppressed DMR',
    fireMode: 'AUTO', damage: 54, headshotMult: 1.88, pellets: 1, rpm: 620, magSize: 20, reserveMax: 120,
    reloadTime: 1.8, baseSpread: 0.01, adsSpread: 0.0012, moveSpreadPenalty: 0.013, recoilPitch: 0.022, recoilYaw: 0.009,
    adsFov: 42, moveSpeedMult: 0.98, range: 250, muzzleVelocity: 280, gravityScale: 0.6, tracerColor: 0xa855f7, accentHex: '#A855F7',
  },

  // ======================= SNIPER RIFLES (6) =======================
  m24: {
    id: 'm24', category: 'sniper', slotGroup: 0, chassis: 'sniper_bolt', optic: 'sniper', guidance: 'none',
    magStyle: 'none', finishHex: 0x1f242c, furnitureHex: 0x3b4833,
    name: 'M24 SWS', shortName: 'M24 SWS', caliber: '7.62×51mm Match', role: 'Bolt-Action Sniper',
    fireMode: 'BOLT', damage: 112, headshotMult: 2.0, pellets: 1, rpm: 52, magSize: 5, reserveMax: 35,
    reloadTime: 2.3, baseSpread: 0.028, adsSpread: 0.00025, moveSpreadPenalty: 0.03, recoilPitch: 0.088, recoilYaw: 0.014,
    adsFov: 26, moveSpeedMult: 0.91, range: 360, muzzleVelocity: 395, gravityScale: 0.36, tracerColor: 0x93c5fd, accentHex: '#60A5FA',
  },
  awm: {
    id: 'awm', category: 'sniper', slotGroup: 0, chassis: 'sniper_bolt', optic: 'sniper', guidance: 'none',
    magStyle: 'box', barrelScale: 1.08, finishHex: 0x20252d, furnitureHex: 0x4b5c3d,
    name: 'L115A3 AWM Magnum', shortName: 'AWM .338', caliber: '.338 Lapua Magnum', role: 'Long-Range Sniper',
    fireMode: 'BOLT', damage: 132, headshotMult: 2.0, pellets: 1, rpm: 46, magSize: 5, reserveMax: 30,
    reloadTime: 2.5, baseSpread: 0.032, adsSpread: 0.00018, moveSpreadPenalty: 0.032, recoilPitch: 0.1, recoilYaw: 0.016,
    adsFov: 22, moveSpeedMult: 0.89, range: 390, muzzleVelocity: 425, gravityScale: 0.32, tracerColor: 0x4ade80, accentHex: '#4ADE80',
  },
  m82_barrett: {
    id: 'm82_barrett', category: 'sniper', slotGroup: 0, chassis: 'sniper_heavy', optic: 'sniper', guidance: 'none',
    magStyle: 'box', barrelScale: 1.25, finishHex: 0x242a34, furnitureHex: 0x16191f,
    name: 'M82A1 Barrett .50', shortName: 'M82A1 .50', caliber: '.50 BMG Anti-Materiel', role: 'Semi-Auto Anti-Armor',
    fireMode: 'SEMI', damage: 145, headshotMult: 2.0, pellets: 1, rpm: 110, magSize: 10, reserveMax: 30,
    reloadTime: 2.95, baseSpread: 0.038, adsSpread: 0.0004, moveSpreadPenalty: 0.04, recoilPitch: 0.13, recoilYaw: 0.025,
    adsFov: 24, moveSpeedMult: 0.82, range: 420, muzzleVelocity: 440, gravityScale: 0.28, tracerColor: 0xfacc15, accentHex: '#FACC15',
  },
  cheytac_m200: {
    id: 'cheytac_m200', category: 'sniper', slotGroup: 0, chassis: 'sniper_heavy', optic: 'sniper', guidance: 'none',
    magStyle: 'box', barrelScale: 1.18, finishHex: 0x6f624e, furnitureHex: 0x20242c,
    name: 'CheyTac M200 Intervention', shortName: 'M200', caliber: '.408 CheyTac', role: 'Extreme Precision',
    fireMode: 'BOLT', damage: 140, headshotMult: 2.0, pellets: 1, rpm: 44, magSize: 7, reserveMax: 28,
    reloadTime: 2.65, baseSpread: 0.032, adsSpread: 0.00012, moveSpreadPenalty: 0.035, recoilPitch: 0.11, recoilYaw: 0.015,
    adsFov: 20, moveSpeedMult: 0.85, range: 430, muzzleVelocity: 445, gravityScale: 0.26, tracerColor: 0x38bdf8, accentHex: '#38BDF8',
  },
  kar98k: {
    id: 'kar98k', category: 'sniper', slotGroup: 0, chassis: 'sniper_bolt', optic: 'sniper', guidance: 'none',
    magStyle: 'none', barrelScale: 0.94, finishHex: 0x242830, furnitureHex: 0x7b4a2d,
    name: 'Kar98k Marksman', shortName: 'Kar98k', caliber: '7.92×57mm Mauser', role: 'Quick-Bolt Sniper',
    fireMode: 'BOLT', damage: 105, headshotMult: 1.95, pellets: 1, rpm: 64, magSize: 5, reserveMax: 40,
    reloadTime: 2.15, baseSpread: 0.025, adsSpread: 0.00035, moveSpreadPenalty: 0.028, recoilPitch: 0.08, recoilYaw: 0.013,
    adsFov: 30, moveSpeedMult: 0.96, range: 350, muzzleVelocity: 380, gravityScale: 0.38, tracerColor: 0xfbbf24, accentHex: '#FBBF24',
  },
  dsr50: {
    id: 'dsr50', category: 'sniper', slotGroup: 0, chassis: 'sniper_heavy', optic: 'sniper', guidance: 'none',
    suppressed: true, magStyle: 'box', barrelScale: 1.0, finishHex: 0x1a1f26, furnitureHex: 0x2b313c,
    name: 'DSR-50 Bullpup Sniper', shortName: 'DSR-50', caliber: '.50 BMG Suppressed', role: 'Heavy Stealth Sniper',
    fireMode: 'BOLT', damage: 148, headshotMult: 2.0, pellets: 1, rpm: 48, magSize: 3, reserveMax: 24,
    reloadTime: 2.55, baseSpread: 0.032, adsSpread: 0.00025, moveSpreadPenalty: 0.035, recoilPitch: 0.115, recoilYaw: 0.018,
    adsFov: 23, moveSpeedMult: 0.87, range: 400, muzzleVelocity: 425, gravityScale: 0.32, tracerColor: 0xa855f7, accentHex: '#A855F7',
  },

  // ======================= SIDEARMS & MACHINE PISTOLS (5) =======================
  m9_beretta: {
    id: 'm9_beretta', category: 'pistol', slotGroup: 1, chassis: 'pistol', optic: 'iron', guidance: 'none',
    magStyle: 'pistol', finishHex: 0x202630, furnitureHex: 0x15181e,
    name: 'Beretta M9A3', shortName: 'M9A3', caliber: '9×19mm NATO', role: 'Tactical Sidearm',
    fireMode: 'SEMI', damage: 34, headshotMult: 1.8, pellets: 1, rpm: 420, magSize: 15, reserveMax: 90,
    reloadTime: 1.2, baseSpread: 0.01, adsSpread: 0.0022, moveSpreadPenalty: 0.007, recoilPitch: 0.022, recoilYaw: 0.008,
    adsFov: 62, moveSpeedMult: 1.14, range: 135, muzzleVelocity: 245, gravityScale: 0.72, tracerColor: 0xfbbf24, accentHex: '#FBBF24',
  },
  glock19: {
    id: 'glock19', category: 'pistol', slotGroup: 1, chassis: 'pistol', optic: 'reflex', guidance: 'none',
    magStyle: 'pistol', finishHex: 0x171b22, furnitureHex: 0x12151a,
    name: 'Glock 18C Auto', shortName: 'G18C', caliber: '9×19mm Parabellum', role: 'Machine Pistol',
    fireMode: 'AUTO', damage: 26, headshotMult: 1.7, pellets: 1, rpm: 1050, magSize: 20, reserveMax: 120,
    reloadTime: 1.25, baseSpread: 0.016, adsSpread: 0.0048, moveSpreadPenalty: 0.008, recoilPitch: 0.015, recoilYaw: 0.01,
    adsFov: 63, moveSpeedMult: 1.14, range: 115, muzzleVelocity: 235, gravityScale: 0.75, tracerColor: 0x38bdf8, accentHex: '#38BDF8',
  },
  deagle50: {
    id: 'deagle50', category: 'pistol', slotGroup: 1, chassis: 'pistol', optic: 'iron', guidance: 'none',
    magStyle: 'pistol', barrelScale: 1.22, finishHex: 0x94a3b8, furnitureHex: 0x1a1d24,
    name: 'Desert Eagle .50 AE', shortName: 'Deagle .50', caliber: '.50 Action Express', role: 'Magnum Handcannon',
    fireMode: 'SEMI', damage: 72, headshotMult: 1.95, pellets: 1, rpm: 190, magSize: 7, reserveMax: 42,
    reloadTime: 1.5, baseSpread: 0.014, adsSpread: 0.002, moveSpreadPenalty: 0.011, recoilPitch: 0.068, recoilYaw: 0.018,
    adsFov: 60, moveSpeedMult: 1.1, range: 185, muzzleVelocity: 290, gravityScale: 0.62, tracerColor: 0xfacc15, accentHex: '#FACC15',
  },
  usp45: {
    id: 'usp45', category: 'pistol', slotGroup: 1, chassis: 'pistol', optic: 'iron', guidance: 'none',
    suppressed: true, magStyle: 'pistol', finishHex: 0x222832, furnitureHex: 0x15181e,
    name: 'HK USP .45 Tactical', shortName: 'USP .45', caliber: '.45 ACP Subsonic', role: 'Suppressed Pistol',
    fireMode: 'SEMI', damage: 43, headshotMult: 1.85, pellets: 1, rpm: 360, magSize: 12, reserveMax: 72,
    reloadTime: 1.25, baseSpread: 0.009, adsSpread: 0.0016, moveSpreadPenalty: 0.006, recoilPitch: 0.024, recoilYaw: 0.007,
    adsFov: 62, moveSpeedMult: 1.13, range: 145, muzzleVelocity: 240, gravityScale: 0.74, tracerColor: 0x34d399, accentHex: '#34D399',
  },
  tec9_auto: {
    id: 'tec9_auto', category: 'pistol', slotGroup: 1, chassis: 'pistol', optic: 'iron', guidance: 'none',
    magStyle: 'box', barrelScale: 1.16, finishHex: 0x2b323d, furnitureHex: 0x161920,
    name: 'TEC-9 Auto Carbine', shortName: 'TEC-9', caliber: '9×19mm Extended', role: 'Extended Machine Pistol',
    fireMode: 'AUTO', damage: 27, headshotMult: 1.7, pellets: 1, rpm: 820, magSize: 32, reserveMax: 128,
    reloadTime: 1.45, baseSpread: 0.015, adsSpread: 0.0044, moveSpreadPenalty: 0.008, recoilPitch: 0.014, recoilYaw: 0.011,
    adsFov: 62, moveSpeedMult: 1.12, range: 120, muzzleVelocity: 235, gravityScale: 0.75, tracerColor: 0xf97316, accentHex: '#F97316',
  },

  // ======================= LAUNCHERS & GUIDED MISSILES (5) =======================
  rpg7: {
    id: 'rpg7', category: 'launcher', slotGroup: 2, chassis: 'launcher_rpg', optic: 'pgo', guidance: 'none',
    magStyle: 'none', finishHex: 0x3b4833, furnitureHex: 0x8a583a,
    name: 'RPG-7V2 Launcher', shortName: 'RPG-7', caliber: '85mm PG-7V HEAT', role: 'Unguided Rocket',
    fireMode: 'ROCKET', damage: 170, headshotMult: 1.0, pellets: 1, rpm: 32, magSize: 1, reserveMax: 4,
    reloadTime: 2.35, baseSpread: 0.01, adsSpread: 0.0025, moveSpreadPenalty: 0.018, recoilPitch: 0.1, recoilYaw: 0.02,
    adsFov: 44, moveSpeedMult: 0.88, range: 220, muzzleVelocity: 54, gravityScale: 0.22, tracerColor: 0xff6b2b, accentHex: '#EF4444',
    blastRadius: 7.2,
  },
  at4_cs: {
    id: 'at4_cs', category: 'launcher', slotGroup: 2, chassis: 'launcher_rpg', optic: 'iron', guidance: 'none',
    magStyle: 'none', finishHex: 0x36442f, furnitureHex: 0xf59e0b,
    name: 'M136 AT4 High-Velocity', shortName: 'AT4-CS', caliber: '84mm High-Explosive', role: 'High-Speed Anti-Armor',
    fireMode: 'ROCKET', damage: 185, headshotMult: 1.0, pellets: 1, rpm: 34, magSize: 1, reserveMax: 3,
    reloadTime: 2.4, baseSpread: 0.007, adsSpread: 0.0018, moveSpreadPenalty: 0.016, recoilPitch: 0.095, recoilYaw: 0.015,
    adsFov: 48, moveSpeedMult: 0.89, range: 240, muzzleVelocity: 76, gravityScale: 0.12, tracerColor: 0xfbbf24, accentHex: '#F59E0B',
    blastRadius: 6.8,
  },
  fgm148_javelin: {
    id: 'fgm148_javelin', category: 'launcher', slotGroup: 2, chassis: 'launcher_guided', optic: 'thermal_lock', guidance: 'lock_on',
    magStyle: 'none', finishHex: 0x3f4c36, furnitureHex: 0x1e242c,
    name: 'FGM-148 Javelin ATGM', shortName: 'Javelin', caliber: '127mm Top-Attack IR', role: 'Lock-On Guided Missile',
    fireMode: 'GUIDED', damage: 265, headshotMult: 1.0, pellets: 1, rpm: 28, magSize: 1, reserveMax: 3,
    reloadTime: 2.75, baseSpread: 0.004, adsSpread: 0.001, moveSpreadPenalty: 0.012, recoilPitch: 0.085, recoilYaw: 0.01,
    adsFov: 36, moveSpeedMult: 0.84, range: 320, muzzleVelocity: 58, gravityScale: 0.0, tracerColor: 0x38bdf8, accentHex: '#38BDF8',
    blastRadius: 8.2,
  },
  bgm71_sraw: {
    id: 'bgm71_sraw', category: 'launcher', slotGroup: 2, chassis: 'launcher_guided', optic: 'thermal_lock', guidance: 'laser_guided',
    magStyle: 'none', finishHex: 0x4b533b, furnitureHex: 0x7c6a52,
    name: 'Predator SRAW-II', shortName: 'SRAW', caliber: '140mm SACLOS Laser', role: 'Laser-Steered Missile',
    fireMode: 'GUIDED', damage: 225, headshotMult: 1.0, pellets: 1, rpm: 32, magSize: 1, reserveMax: 4,
    reloadTime: 2.45, baseSpread: 0.004, adsSpread: 0.001, moveSpreadPenalty: 0.012, recoilPitch: 0.08, recoilYaw: 0.01,
    adsFov: 40, moveSpeedMult: 0.86, range: 300, muzzleVelocity: 62, gravityScale: 0.0, tracerColor: 0x22d3ee, accentHex: '#22D3EE',
    blastRadius: 7.5,
  },
  fim92_stinger: {
    id: 'fim92_stinger', category: 'launcher', slotGroup: 2, chassis: 'launcher_guided', optic: 'thermal_lock', guidance: 'lock_on',
    magStyle: 'none', finishHex: 0x2f3c2b, furnitureHex: 0x232830,
    name: 'FIM-92 Stinger Seeker', shortName: 'Stinger', caliber: '70mm Dual-IR Seeker', role: 'Fast Lock-On Missile',
    fireMode: 'GUIDED', damage: 195, headshotMult: 1.0, pellets: 1, rpm: 38, magSize: 1, reserveMax: 4,
    reloadTime: 2.15, baseSpread: 0.005, adsSpread: 0.001, moveSpreadPenalty: 0.012, recoilPitch: 0.075, recoilYaw: 0.01,
    adsFov: 42, moveSpeedMult: 0.88, range: 310, muzzleVelocity: 82, gravityScale: 0.0, tracerColor: 0x34d399, accentHex: '#34D399',
    blastRadius: 6.8,
  },
};

export const WEAPON_ORDER: WeaponId[] = Object.keys(WEAPONS) as WeaponId[];

export interface ViewmodelHandle {
  root: THREE.Group;
  muzzleFlash: THREE.Group;
  muzzlePoint: THREE.Object3D;
  ejectionPort: THREE.Object3D;
  boltCarrier?: THREE.Mesh;
  pumpSlide?: THREE.Mesh;
  warheadGroup?: THREE.Group;
}

let sharedWeaponTex: ReturnType<typeof createWeaponDetailTextures> | null = null;
let sharedMaterials: {
  polymerMat: THREE.MeshStandardMaterial;
  brushedSteel: THREE.MeshStandardMaterial;
  chromeBoltMat: THREE.MeshStandardMaterial;
  opticGlass: THREE.MeshStandardMaterial;
  tritiumMat: THREE.MeshStandardMaterial;
  redDotMat: THREE.MeshStandardMaterial;
  sleeveMat: THREE.MeshStandardMaterial;
  gloveMat: THREE.MeshStandardMaterial;
  knuckleMat: THREE.MeshStandardMaterial;
} | null = null;

function ensureSharedResources() {
  if (!sharedWeaponTex) {
    sharedWeaponTex = createWeaponDetailTextures();
  }
  if (!sharedMaterials) {
    sharedMaterials = {
      polymerMat: new THREE.MeshStandardMaterial({ color: 0x14171c, metalness: 0.12, roughness: 0.78 }),
      brushedSteel: new THREE.MeshStandardMaterial({
        color: 0x454f5e,
        metalness: 0.9,
        roughness: 0.22,
        bumpMap: sharedWeaponTex.brushedBump,
        bumpScale: 0.005,
      }),
      chromeBoltMat: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.16 }),
      opticGlass: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.08,
        roughness: 0.05,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      }),
      tritiumMat: new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 1.1,
        roughness: 0.2,
      }),
      redDotMat: new THREE.MeshStandardMaterial({
        color: 0xff3b3b,
        emissive: 0xef4444,
        emissiveIntensity: 1.8,
        roughness: 0.15,
      }),
      sleeveMat: new THREE.MeshStandardMaterial({ color: 0x2a313b, metalness: 0.06, roughness: 0.88 }),
      gloveMat: new THREE.MeshStandardMaterial({ color: 0x15181e, metalness: 0.14, roughness: 0.72 }),
      knuckleMat: new THREE.MeshStandardMaterial({ color: 0x262b34, metalness: 0.35, roughness: 0.45 }),
    };
  }
  return { tex: sharedWeaponTex, mats: sharedMaterials };
}

function addPicatinnyRail(
  parent: THREE.Group,
  x: number,
  y: number,
  zStart: number,
  length: number,
  mat: THREE.Material
) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.008, length), mat);
  base.position.set(x, y, zStart);
  parent.add(base);
  const teethCount = Math.min(18, Math.floor(length / 0.024));
  const toothGeo = new THREE.BoxGeometry(0.028, 0.005, 0.009);
  for (let i = 0; i < teethCount; i++) {
    const t = new THREE.Mesh(toothGeo, mat);
    t.position.set(x, y + 0.005, zStart - length / 2 + 0.012 + i * 0.024);
    parent.add(t);
  }
}

function addFirstPersonHands(parent: THREE.Group, supportZ: number, supportY: number, gripZ: number) {
  const { mats } = ensureSharedResources();

  const rightHand = new THREE.Group();
  rightHand.position.set(0.01, -0.085, gripZ);
  const rPalm = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.068, 0.072), mats.gloveMat);
  const rKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.055), mats.knuckleMat);
  rKnuckle.position.set(0, 0.02, -0.015);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.068, 0.28), mats.sleeveMat);
  rArm.position.set(0.045, -0.05, 0.17);
  rArm.rotation.set(0.28, -0.18, 0);
  rightHand.add(rPalm, rKnuckle, rArm);
  parent.add(rightHand);

  const leftHand = new THREE.Group();
  leftHand.position.set(-0.018, supportY, supportZ);
  const lPalm = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.052, 0.085), mats.gloveMat);
  const lThumb = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.026, 0.055), mats.gloveMat);
  lThumb.position.set(-0.026, 0.028, -0.01);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.066, 0.32), mats.sleeveMat);
  lArm.position.set(-0.095, -0.075, 0.16);
  lArm.rotation.set(0.32, 0.42, 0.15);
  leftHand.add(lPalm, lThumb, lArm);
  parent.add(leftHand);
}

export function buildWeaponViewmodel(weaponId: WeaponId): ViewmodelHandle {
  const spec = WEAPONS[weaponId];
  const { tex, mats } = ensureSharedResources();
  const root = new THREE.Group();

  const finishMat = new THREE.MeshStandardMaterial({
    color: spec.finishHex ?? 0x1e242d,
    metalness: 0.84,
    roughness: 0.28,
    bumpMap: tex.brushedBump,
    bumpScale: 0.004,
  });

  const isWood = (spec.furnitureHex ?? 0) > 0x654020 && (spec.furnitureHex ?? 0) < 0x956545;
  const furnitureMat = new THREE.MeshStandardMaterial({
    map: isWood ? tex.woodMap : undefined,
    color: spec.furnitureHex ?? 0x3b4833,
    metalness: isWood ? 0.06 : 0.24,
    roughness: isWood ? 0.65 : 0.62,
  });

  const addPart = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    rx = 0,
    ry = 0,
    rz = 0
  ) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  };

  const addOptic = (yTop: number, zCenter: number) => {
    if (spec.optic === 'holo') {
      // Open-window Holographic Hood (base + left/right side walls + thin top arch, zero center obstruction)
      addPart(new THREE.BoxGeometry(0.052, 0.01, 0.084), finishMat, 0, yTop + 0.005, zCenter);
      addPart(new THREE.BoxGeometry(0.006, 0.036, 0.076), finishMat, -0.023, yTop + 0.025, zCenter);
      addPart(new THREE.BoxGeometry(0.006, 0.036, 0.076), finishMat, 0.023, yTop + 0.025, zCenter);
      addPart(new THREE.BoxGeometry(0.052, 0.005, 0.076), finishMat, 0, yTop + 0.044, zCenter);
      addPart(new THREE.BoxGeometry(0.04, 0.032, 0.003), mats.opticGlass, 0, yTop + 0.025, zCenter);
      addPart(new THREE.BoxGeometry(0.003, 0.003, 0.003), mats.redDotMat, 0, yTop + 0.025, zCenter);
    } else if (spec.optic === 'reflex') {
      // Open-frame Reflex Red-Dot Sight (low base + slim outer U-frame + clear lens)
      addPart(new THREE.BoxGeometry(0.04, 0.009, 0.062), finishMat, 0, yTop + 0.004, zCenter);
      addPart(new THREE.BoxGeometry(0.005, 0.028, 0.016), finishMat, -0.018, yTop + 0.02, zCenter - 0.015);
      addPart(new THREE.BoxGeometry(0.005, 0.028, 0.016), finishMat, 0.018, yTop + 0.02, zCenter - 0.015);
      addPart(new THREE.BoxGeometry(0.041, 0.004, 0.016), finishMat, 0, yTop + 0.035, zCenter - 0.015);
      addPart(new THREE.BoxGeometry(0.031, 0.024, 0.003), mats.opticGlass, 0, yTop + 0.021, zCenter - 0.015);
      addPart(new THREE.BoxGeometry(0.003, 0.003, 0.003), mats.redDotMat, 0, yTop + 0.021, zCenter - 0.015);
    } else if (spec.optic === 'acog') {
      addPart(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 12), finishMat, 0, yTop + 0.032, zCenter - 0.02, Math.PI / 2);
      addPart(new THREE.CylinderGeometry(0.026, 0.021, 0.055, 12), finishMat, 0, yTop + 0.032, zCenter - 0.12, Math.PI / 2);
      addPart(new THREE.CylinderGeometry(0.022, 0.022, 0.01, 12), mats.opticGlass, 0, yTop + 0.032, zCenter + 0.07, Math.PI / 2);
    } else if (spec.optic === 'sniper') {
      addPart(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 14), finishMat, 0, yTop + 0.034, zCenter - 0.04, Math.PI / 2);
      addPart(new THREE.CylinderGeometry(0.032, 0.023, 0.085, 14), finishMat, 0, yTop + 0.034, zCenter - 0.2, Math.PI / 2);
      addPart(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 14), mats.opticGlass, 0, yTop + 0.034, zCenter + 0.1, Math.PI / 2);
    } else {
      // Open U-notch rear iron ears + low-profile glowing front tritium post
      addPart(new THREE.BoxGeometry(0.006, 0.014, 0.018), finishMat, -0.011, yTop + 0.009, zCenter + 0.05);
      addPart(new THREE.BoxGeometry(0.006, 0.014, 0.018), finishMat, 0.011, yTop + 0.009, zCenter + 0.05);
      addPart(new THREE.BoxGeometry(0.004, 0.012, 0.008), mats.redDotMat, 0, yTop + 0.009, zCenter - 0.36);
    }
  };

  const addMagazine = (zPos: number, yPos: number) => {
    if (spec.magStyle === 'drum') {
      addPart(new THREE.CylinderGeometry(0.068, 0.068, 0.06, 14), mats.polymerMat, 0, yPos - 0.05, zPos, Math.PI / 2);
    } else if (spec.magStyle === 'curved') {
      addPart(new THREE.BoxGeometry(0.036, 0.145, 0.068), furnitureMat, 0, yPos - 0.095, zPos - 0.02, 0.28);
    } else if (spec.magStyle === 'pistol') {
      addPart(new THREE.BoxGeometry(0.03, 0.11, 0.042), mats.brushedSteel, 0, yPos - 0.07, zPos + 0.02, -0.25);
    } else if (spec.magStyle === 'box') {
      addPart(new THREE.BoxGeometry(0.036, 0.125, 0.07), mats.brushedSteel, 0, yPos - 0.088, zPos, 0.12);
    }
  };

  const bScale = spec.barrelScale ?? 1.0;
  let muzzleZ = -0.72;
  let ejPos = new THREE.Vector3(0.036, 0.02, -0.05);
  let boltCarrier: THREE.Mesh | undefined;
  let pumpSlide: THREE.Mesh | undefined;
  let warheadGroup: THREE.Group | undefined;

  if (spec.chassis === 'pistol') {
    const slideLen = 0.24 * bScale;
    addPart(new THREE.BoxGeometry(0.038, 0.04, slideLen), finishMat, 0, 0.032, -0.14);
    addPart(new THREE.BoxGeometry(0.034, 0.024, slideLen * 0.92), mats.polymerMat, 0, 0.002, -0.13);
    boltCarrier = addPart(new THREE.BoxGeometry(0.01, 0.018, 0.055), mats.chromeBoltMat, 0.016, 0.034, -0.14);
    addPart(new THREE.BoxGeometry(0.034, 0.11, 0.044), furnitureMat, 0, -0.058, -0.04, -0.26);
    if (spec.suppressed) {
      addPart(new THREE.CylinderGeometry(0.019, 0.019, 0.19, 12), mats.polymerMat, 0, 0.028, -0.14 - slideLen / 2 - 0.09, Math.PI / 2);
      muzzleZ = -0.14 - slideLen / 2 - 0.19;
    } else {
      addPart(new THREE.CylinderGeometry(0.011, 0.011, 0.05, 10), mats.brushedSteel, 0, 0.028, -0.14 - slideLen / 2 - 0.02, Math.PI / 2);
      muzzleZ = -0.14 - slideLen / 2 - 0.05;
    }
    if (spec.optic === 'reflex') {
      addPart(new THREE.BoxGeometry(0.032, 0.006, 0.042), finishMat, 0, 0.055, -0.1);
      addPart(new THREE.BoxGeometry(0.004, 0.02, 0.012), finishMat, -0.014, 0.066, -0.11);
      addPart(new THREE.BoxGeometry(0.004, 0.02, 0.012), finishMat, 0.014, 0.066, -0.11);
      addPart(new THREE.BoxGeometry(0.032, 0.003, 0.012), finishMat, 0, 0.076, -0.11);
      addPart(new THREE.BoxGeometry(0.024, 0.017, 0.003), mats.opticGlass, 0, 0.066, -0.11);
      addPart(new THREE.BoxGeometry(0.003, 0.003, 0.003), mats.redDotMat, 0, 0.066, -0.11);
    } else {
      addPart(new THREE.BoxGeometry(0.005, 0.009, 0.01), finishMat, -0.008, 0.055, -0.04);
      addPart(new THREE.BoxGeometry(0.005, 0.009, 0.01), finishMat, 0.008, 0.055, -0.04);
      addPart(new THREE.BoxGeometry(0.004, 0.009, 0.008), mats.redDotMat, 0, 0.055, -0.14 - slideLen / 2 + 0.02);
    }
    addMagazine(-0.04, -0.05);
    addFirstPersonHands(root, -0.05, -0.06, -0.04);
    ejPos = new THREE.Vector3(0.024, 0.035, -0.12);
  } else if (spec.chassis === 'launcher_rpg' || spec.chassis === 'launcher_guided') {
    const isGuided = spec.chassis === 'launcher_guided';
    const tubeR = isGuided ? 0.052 : 0.033;
    addPart(new THREE.CylinderGeometry(tubeR, tubeR, 0.9, 14), finishMat, 0, 0.022, -0.08, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(tubeR + 0.008, tubeR + 0.002, 0.075, 14), mats.brushedSteel, 0, 0.022, -0.54, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(tubeR + 0.007, tubeR + 0.007, 0.34, 14), furnitureMat, 0, 0.022, 0.08, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(tubeR, tubeR + 0.024, 0.16, 14), finishMat, 0, 0.022, 0.42, Math.PI / 2);
    addPart(new THREE.BoxGeometry(0.038, 0.105, 0.048), mats.polymerMat, 0, -0.065, -0.22, -0.25);
    addPart(new THREE.BoxGeometry(0.036, 0.095, 0.044), mats.polymerMat, 0, -0.062, -0.02, -0.18);

    if (isGuided) {
      // CLU Thermal Command Launch Unit box
      addPart(new THREE.BoxGeometry(0.095, 0.088, 0.18), furnitureMat, -0.078, 0.045, -0.18);
      addPart(new THREE.CylinderGeometry(0.026, 0.026, 0.04, 12), mats.opticGlass, -0.078, 0.055, -0.275, Math.PI / 2);
      addPart(new THREE.BoxGeometry(0.015, 0.015, 0.01), mats.tritiumMat, -0.078, 0.095, -0.18);
    } else {
      addPart(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 12), finishMat, -0.048, 0.065, -0.14, Math.PI / 2);
      addPart(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 12), mats.opticGlass, -0.048, 0.065, -0.06, Math.PI / 2);
    }

    warheadGroup = new THREE.Group();
    warheadGroup.position.set(0, 0.022, -0.56);
    const coneFront = new THREE.Mesh(new THREE.CylinderGeometry(0.018, isGuided ? 0.044 : 0.052, 0.13, 14), finishMat);
    coneFront.rotation.x = Math.PI / 2;
    coneFront.position.z = -0.12;
    const coneTip = new THREE.Mesh(new THREE.ConeGeometry(isGuided ? 0.044 : 0.052, 0.14, 14), isGuided ? mats.opticGlass : finishMat);
    coneTip.rotation.x = -Math.PI / 2;
    coneTip.position.z = -0.255;
    warheadGroup.add(coneFront, coneTip);
    root.add(warheadGroup);

    addFirstPersonHands(root, -0.02, -0.045, -0.21);
    muzzleZ = -0.9;
  } else if (spec.chassis === 'shotgun_pump' || spec.chassis === 'shotgun_auto') {
    const barrelLen = 0.56 * bScale;
    addPart(new THREE.BoxGeometry(0.058, 0.072, 0.28), finishMat, 0, 0.004, -0.02);
    boltCarrier = addPart(new THREE.BoxGeometry(0.014, 0.028, 0.075), mats.chromeBoltMat, 0.026, 0.01, -0.04);
    addPart(new THREE.CylinderGeometry(0.016, 0.017, barrelLen, 12), mats.brushedSteel, 0, 0.032, -0.16 - barrelLen / 2, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.015, 0.015, barrelLen * 0.85, 12), finishMat, 0, -0.004, -0.16 - barrelLen * 0.42, Math.PI / 2);
    pumpSlide = addPart(new THREE.CylinderGeometry(0.028, 0.028, 0.18, 10), furnitureMat, 0, -0.008, -0.34, Math.PI / 2);
    addMagazine(-0.14, 0.0);
    addOptic(0.04, -0.04);
    addPart(new THREE.BoxGeometry(0.044, 0.11, 0.05), mats.polymerMat, 0, -0.075, 0.1, -0.34);
    addPart(new THREE.BoxGeometry(0.05, 0.088, 0.22), furnitureMat, 0, -0.022, 0.23, 0.08);
    addFirstPersonHands(root, -0.34, -0.045, 0.09);
    muzzleZ = -0.18 - barrelLen;
  } else if (spec.chassis === 'sniper_bolt' || spec.chassis === 'sniper_heavy') {
    const isHeavy = spec.chassis === 'sniper_heavy';
    const barrelLen = (isHeavy ? 0.72 : 0.62) * bScale;
    addPart(new THREE.BoxGeometry(isHeavy ? 0.068 : 0.056, 0.072, 0.52), furnitureMat, 0, -0.006, -0.06);
    addPart(new THREE.BoxGeometry(0.052, 0.084, 0.26), furnitureMat, 0, -0.018, 0.24);
    addPart(new THREE.CylinderGeometry(0.026, 0.026, 0.26, 14), finishMat, 0, 0.028, -0.05, Math.PI / 2);
    boltCarrier = addPart(new THREE.CylinderGeometry(0.01, 0.01, 0.07, 8), mats.brushedSteel, 0.028, 0.028, -0.02, 0, 0, Math.PI / 2);
    addPicatinnyRail(root, 0, 0.058, -0.06, 0.24, finishMat);
    addPart(new THREE.CylinderGeometry(isHeavy ? 0.02 : 0.016, isHeavy ? 0.024 : 0.02, barrelLen, 14), mats.brushedSteel, 0, 0.028, -0.18 - barrelLen / 2, Math.PI / 2);
    if (spec.suppressed) {
      addPart(new THREE.CylinderGeometry(0.026, 0.026, 0.22, 14), mats.polymerMat, 0, 0.028, -0.18 - barrelLen - 0.1, Math.PI / 2);
      muzzleZ = -0.18 - barrelLen - 0.22;
    } else {
      addPart(new THREE.BoxGeometry(0.046, 0.034, 0.085), finishMat, 0, 0.028, -0.18 - barrelLen - 0.03);
      muzzleZ = -0.18 - barrelLen - 0.08;
    }
    // Folded bipod legs
    addPart(new THREE.CylinderGeometry(0.009, 0.009, 0.18, 8), finishMat, -0.024, -0.04, -0.45, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.009, 0.009, 0.18, 8), finishMat, 0.024, -0.04, -0.45, Math.PI / 2);
    addMagazine(-0.12, -0.01);
    addOptic(0.062, -0.06);
    addFirstPersonHands(root, -0.29, -0.045, 0.08);
    ejPos = new THREE.Vector3(0.036, 0.03, -0.03);
  } else if (spec.chassis === 'lmg_belt') {
    const barrelLen = 0.44 * bScale;
    addPart(new THREE.BoxGeometry(0.072, 0.082, 0.36), finishMat, 0, 0.01, -0.06);
    boltCarrier = addPart(new THREE.BoxGeometry(0.016, 0.024, 0.085), mats.chromeBoltMat, 0.034, 0.02, -0.05);
    addPart(new THREE.BoxGeometry(0.068, 0.066, 0.28), furnitureMat, 0, 0.008, -0.34);
    addPicatinnyRail(root, 0, 0.054, -0.12, 0.32, finishMat);
    addPart(new THREE.CylinderGeometry(0.018, 0.02, barrelLen, 12), mats.brushedSteel, 0, 0.02, -0.36 - barrelLen / 2, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.024, 0.018, 0.08, 10), finishMat, 0, 0.02, -0.36 - barrelLen - 0.03, Math.PI / 2);
    addMagazine(-0.13, -0.01);
    addOptic(0.056, -0.05);
    addPart(new THREE.BoxGeometry(0.044, 0.11, 0.05), mats.polymerMat, 0, -0.08, 0.08, -0.3);
    addPart(new THREE.BoxGeometry(0.056, 0.095, 0.2), furnitureMat, 0, -0.01, 0.22);
    addFirstPersonHands(root, -0.33, -0.05, 0.07);
    muzzleZ = -0.36 - barrelLen - 0.08;
  } else if (spec.chassis === 'smg_mp5' || spec.chassis === 'smg_pdw') {
    const isPdw = spec.chassis === 'smg_pdw';
    const barrelLen = (isPdw ? 0.2 : 0.24) * bScale;
    addPart(new THREE.BoxGeometry(0.05, 0.062, 0.3), finishMat, 0, 0.012, -0.08);
    boltCarrier = addPart(new THREE.BoxGeometry(0.012, 0.018, 0.065), mats.chromeBoltMat, 0.024, 0.022, -0.07);
    addPart(new THREE.BoxGeometry(0.048, 0.052, 0.18), furnitureMat, 0, 0.004, -0.28);
    addPicatinnyRail(root, 0, 0.046, -0.14, 0.32, finishMat);
    if (spec.suppressed) {
      addPart(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 14), mats.polymerMat, 0, 0.02, -0.36 - 0.1, Math.PI / 2);
      muzzleZ = -0.58;
    } else {
      addPart(new THREE.CylinderGeometry(0.012, 0.013, barrelLen, 12), mats.brushedSteel, 0, 0.02, -0.36 - barrelLen / 2, Math.PI / 2);
      muzzleZ = -0.36 - barrelLen;
    }
    addMagazine(-0.15, 0.0);
    addOptic(0.048, -0.07);
    addPart(new THREE.BoxGeometry(0.04, 0.105, 0.046), mats.polymerMat, 0, -0.075, 0.04, -0.28);
    addPart(new THREE.BoxGeometry(0.044, 0.072, 0.14), furnitureMat, 0, 0, 0.15);
    addFirstPersonHands(root, -0.29, -0.045, 0.04);
  } else {
    // ar_nato, ar_ak, bullpup, dmr
    const isAk = spec.chassis === 'ar_ak';
    const isBullpup = spec.chassis === 'bullpup';
    const isDmr = spec.chassis === 'dmr';
    const barrelLen = (isDmr ? 0.44 : 0.34) * bScale;
    const recZ = isBullpup ? 0.04 : -0.06;

    addPart(new THREE.BoxGeometry(0.056, 0.068, 0.3), finishMat, 0, 0.01, recZ);
    boltCarrier = addPart(new THREE.BoxGeometry(0.015, 0.022, 0.08), mats.chromeBoltMat, 0.027, 0.02, recZ);
    addPart(new THREE.BoxGeometry(0.054, 0.058, 0.25), isAk ? furnitureMat : mats.polymerMat, 0, 0.012, -0.32);
    addPicatinnyRail(root, 0, 0.048, -0.18, 0.44, finishMat);
    addPart(new THREE.CylinderGeometry(0.013, 0.014, barrelLen, 12), mats.brushedSteel, 0, 0.016, -0.44 - barrelLen / 2, Math.PI / 2);

    if (spec.suppressed) {
      addPart(new THREE.CylinderGeometry(0.021, 0.021, 0.2, 12), mats.polymerMat, 0, 0.016, -0.44 - barrelLen - 0.09, Math.PI / 2);
      muzzleZ = -0.44 - barrelLen - 0.2;
    } else {
      addPart(new THREE.CylinderGeometry(0.018, 0.016, 0.07, 10), finishMat, 0, 0.016, -0.44 - barrelLen - 0.03, Math.PI / 2);
      muzzleZ = -0.44 - barrelLen - 0.07;
    }

    addMagazine(isBullpup ? 0.14 : -0.12, -0.01);
    addOptic(0.052, -0.05);
    addPart(new THREE.BoxGeometry(0.04, 0.11, 0.048), mats.polymerMat, 0, -0.08, 0.06, -0.32);
    addPart(new THREE.BoxGeometry(0.05, 0.088, 0.18), furnitureMat, 0, -0.01, 0.22);
    addFirstPersonHands(root, -0.31, -0.05, 0.06);
  }

  const muzzleFlash = new THREE.Group();
  muzzleFlash.position.set(0, 0.022, muzzleZ);
  const flashMat = new THREE.MeshBasicMaterial({
    color: spec.tracerColor,
    transparent: true,
    opacity: spec.suppressed ? 0.35 : 0.92,
    depthWrite: false,
  });
  const s = spec.suppressed ? 0.45 : 1.0;
  const flashCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.058 * s, 0), flashMat);
  const flashCross1 = new THREE.Mesh(new THREE.PlaneGeometry(0.26 * s, 0.06 * s), flashMat);
  const flashCross2 = new THREE.Mesh(new THREE.PlaneGeometry(0.06 * s, 0.26 * s), flashMat);
  muzzleFlash.add(flashCore, flashCross1, flashCross2);
  muzzleFlash.visible = false;
  root.add(muzzleFlash);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.022, muzzleZ);
  root.add(muzzlePoint);

  const ejectionPort = new THREE.Object3D();
  ejectionPort.position.copy(ejPos);
  root.add(ejectionPort);

  return { root, muzzleFlash, muzzlePoint, ejectionPort, boltCarrier, pumpSlide, warheadGroup };
}
