import React from 'react';
import { RadarBlip } from '../game/types';

interface TacticalRadarProps {
  playerPos: { x: number; z: number; yaw: number };
  blips: RadarBlip[];
  halfSize?: number;
  uavActive?: boolean;
  compact?: boolean;
}

export const TacticalRadar: React.FC<TacticalRadarProps> = ({
  playerPos,
  blips,
  halfSize = 120,
  uavActive = false,
  compact = false,
}) => {
  const size = 144;
  const center = size / 2;
  const scale = (size / 2 - 10) / halfSize;

  const cos = Math.cos(playerPos.yaw);
  const sin = Math.sin(playerPos.yaw);

  const toRadar = (wx: number, wz: number) => {
    const dx = wx - playerPos.x;
    const dz = wz - playerPos.z;
    const rx = dx * cos - dz * sin;
    const ry = dx * sin + dz * cos;
    return {
      x: Math.max(8, Math.min(size - 8, center + rx * scale)),
      y: Math.max(8, Math.min(size - 8, center + ry * scale)),
    };
  };

  return (
    <div
      className={`${
        compact ? 'w-[88px] h-[88px] sm:w-[116px] sm:h-[116px]' : 'w-[116px] h-[116px] sm:w-[144px] sm:h-[144px]'
      } rounded-lg bg-[#0b0f17]/90 border overflow-hidden shadow-lg ${
        uavActive ? 'border-cyan-400/80' : 'border-slate-700/75'
      }`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="block w-full h-full">
        <circle
          cx={center}
          cy={center}
          r={28}
          fill="none"
          stroke={uavActive ? 'rgba(34,211,238,0.28)' : 'rgba(148,163,184,0.14)'}
          strokeWidth="1"
        />
        <circle
          cx={center}
          cy={center}
          r={56}
          fill="none"
          stroke={uavActive ? 'rgba(34,211,238,0.22)' : 'rgba(148,163,184,0.1)'}
          strokeWidth="1"
        />
        <path
          d={`M ${center} ${center} L ${center - 30} ${center - 54} A 62 62 0 0 1 ${center + 30} ${center - 54} Z`}
          fill="rgba(56, 189, 248, 0.09)"
        />

        {blips.map((b, idx) => {
          const pos = toRadar(b.x, b.z);
          if (b.team === 'airstrike') {
            return (
              <g key={`as-${idx}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={7}
                  fill="rgba(239,68,68,0.22)"
                  stroke="#ef4444"
                  strokeWidth="1.4"
                />
                <circle cx={pos.x} cy={pos.y} r={2} fill="#ef4444" />
              </g>
            );
          }
          if (b.team === 'arsenal') {
            return (
              <rect
                key={`ar-${idx}`}
                x={pos.x - 4}
                y={pos.y - 4}
                width={8}
                height={8}
                fill="#06b6d4"
                stroke="#0a0d12"
                strokeWidth="1.2"
                rx={1.5}
              />
            );
          }
          if (b.team === 'pickup_health') {
            return (
              <rect
                key={`h-${idx}`}
                x={pos.x - 2.3}
                y={pos.y - 2.3}
                width={4.6}
                height={4.6}
                fill="#10b981"
                rx={1}
              />
            );
          }
          if (b.team === 'pickup_ammo') {
            return (
              <rect
                key={`a-${idx}`}
                x={pos.x - 2.3}
                y={pos.y - 2.3}
                width={4.6}
                height={4.6}
                fill="#f59e0b"
                rx={1}
              />
            );
          }
          if (b.team === 'field_gun') {
            return (
              <polygon
                key={`fg-${idx}`}
                points={`${pos.x},${pos.y - 4.5} ${pos.x + 4},${pos.y + 3.5} ${pos.x - 4},${pos.y + 3.5}`}
                fill="#f59e0b"
                stroke="#0a0d12"
                strokeWidth="1"
              />
            );
          }
          if (b.team === 'turret') {
            return (
              <polygon
                key={`t-${idx}`}
                points={`${pos.x},${pos.y - 4} ${pos.x + 4},${pos.y} ${pos.x},${pos.y + 4} ${pos.x - 4},${pos.y}`}
                fill="#e2e8f0"
                stroke="#0a0d12"
                strokeWidth="1"
              />
            );
          }
          if (b.team === 'hangar') {
            return (
              <g key={`hg-${idx}`}>
                <rect
                  x={pos.x - 4.5}
                  y={pos.y - 4.5}
                  width={9}
                  height={9}
                  rx={1.5}
                  fill="#065f46"
                  stroke="#34d399"
                  strokeWidth="1.2"
                />
                <path
                  d={`M ${pos.x - 2.2} ${pos.y} L ${pos.x + 2.2} ${pos.y} M ${pos.x} ${pos.y - 2.2} L ${pos.x} ${pos.y + 2.2}`}
                  stroke="#fef08a"
                  strokeWidth="1.1"
                />
              </g>
            );
          }
          if (b.team === 'heli') {
            return (
              <g key={`hl-${idx}`}>
                <line
                  x1={pos.x - 4.5}
                  y1={pos.y - 4.5}
                  x2={pos.x + 4.5}
                  y2={pos.y + 4.5}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                <line
                  x1={pos.x + 4.5}
                  y1={pos.y - 4.5}
                  x2={pos.x - 4.5}
                  y2={pos.y + 4.5}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                <circle cx={pos.x} cy={pos.y} r={2.2} fill="#fbbf24" stroke="#0a0d12" strokeWidth="0.9" />
              </g>
            );
          }
          if (b.team === 'vehicle') {
            return (
              <rect
                key={`v-${idx}`}
                x={pos.x - 4.5}
                y={pos.y - 2.8}
                width={9}
                height={5.6}
                rx={1.5}
                fill="#38bdf8"
                stroke="#0a0d12"
                strokeWidth="1.1"
              />
            );
          }
          if (b.team === 'belt_box') {
            return (
              <rect
                key={`bb-${idx}`}
                x={pos.x - 1.6}
                y={pos.y - 1.6}
                width={3.2}
                height={3.2}
                fill="#eab308"
                opacity={0.78}
              />
            );
          }
          if (b.team === 'trench') {
            return (
              <rect
                key={`tr-${idx}`}
                x={pos.x - 3.6}
                y={pos.y - 1.4}
                width={7.2}
                height={2.8}
                fill="#a89070"
                stroke="#0a0d12"
                strokeWidth="0.7"
              />
            );
          }
          if (b.team === 'zombie') {
            return (
              <circle
                key={`z-${idx}`}
                cx={pos.x}
                cy={pos.y}
                r={3.4}
                fill="#84cc16"
                stroke="#dc2626"
                strokeWidth="1.2"
              />
            );
          }
          const isBlue = b.team === 'blue';
          return (
            <circle
              key={`c-${idx}`}
              cx={pos.x}
              cy={pos.y}
              r={3.3}
              fill={isBlue ? '#3b82f6' : '#ef4444'}
              stroke="#0a0d12"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={`${center},${center - 6} ${center - 4.5},${center + 4.5} ${center},${center + 2} ${center + 4.5},${center + 4.5}`}
          fill="#f8fafc"
        />
      </svg>
    </div>
  );
};
