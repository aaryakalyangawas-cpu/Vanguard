import React from 'react';
import { RadarBlip } from '../game/types';

interface TacticalRadarProps {
  playerPos: { x: number; z: number; yaw: number };
  blips: RadarBlip[];
  halfSize?: number;
}

export const TacticalRadar: React.FC<TacticalRadarProps> = ({
  playerPos,
  blips,
  halfSize = 40,
}) => {
  const size = 136;
  const center = size / 2;
  const scale = (size / 2 - 10) / halfSize;

  // Rotate world coordinates into player-relative radar space (player always faces up)
  const cos = Math.cos(playerPos.yaw);
  const sin = Math.sin(playerPos.yaw);

  const toRadar = (wx: number, wz: number) => {
    const dx = wx - playerPos.x;
    const dz = wz - playerPos.z;
    // Camera looks toward (-sin(yaw), -cos(yaw))
    const rx = dx * cos - dz * sin;
    const ry = dx * sin + dz * cos;
    return {
      x: Math.max(8, Math.min(size - 8, center + rx * scale)),
      y: Math.max(8, Math.min(size - 8, center + ry * scale)),
    };
  };

  return (
    <div className="w-[136px] h-[136px] rounded-lg bg-[#0b0f17]/88 border border-slate-700/70 overflow-hidden shadow-lg">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        {/* Subtle range rings */}
        <circle cx={center} cy={center} r={28} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="1" />
        <circle cx={center} cy={center} r={54} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
        {/* Field of view cone */}
        <path
          d={`M ${center} ${center} L ${center - 30} ${center - 52} A 60 60 0 0 1 ${center + 30} ${center - 52} Z`}
          fill="rgba(56, 189, 248, 0.09)"
        />

        {/* Pickups & Combatant Blips */}
        {blips.map((b, idx) => {
          const pos = toRadar(b.x, b.z);
          if (b.team === 'pickup_health') {
            return (
              <rect
                key={`h-${idx}`}
                x={pos.x - 2.5}
                y={pos.y - 2.5}
                width={5}
                height={5}
                fill="#10b981"
                rx={1}
              />
            );
          }
          if (b.team === 'pickup_ammo') {
            return (
              <rect
                key={`a-${idx}`}
                x={pos.x - 2.5}
                y={pos.y - 2.5}
                width={5}
                height={5}
                fill="#f59e0b"
                rx={1}
              />
            );
          }
          const isBlue = b.team === 'blue';
          return (
            <circle
              key={`c-${idx}`}
              cx={pos.x}
              cy={pos.y}
              r={3.5}
              fill={isBlue ? '#3b82f6' : '#ef4444'}
              stroke="#0a0d12"
              strokeWidth="1"
            />
          );
        })}

        {/* Player marker at center */}
        <polygon
          points={`${center},${center - 6} ${center - 4.5},${center + 4.5} ${center},${center + 2} ${center + 4.5},${center + 4.5}`}
          fill="#f8fafc"
        />
      </svg>
    </div>
  );
};
