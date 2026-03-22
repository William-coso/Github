import React, { useEffect, useRef } from 'react';

interface Props {
  patternData: ImageData | null;
  beadSize?: number;
}

export function PatternCanvas({ patternData, beadSize = 16 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!patternData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = patternData.width;
    const rows = patternData.height;

    canvas.width = cols * beadSize;
    canvas.height = rows * beadSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pixels = patternData.data;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a === 0) continue; // Skip transparent

        const cx = x * beadSize + beadSize / 2;
        const cy = y * beadSize + beadSize / 2;
        const radius = beadSize / 2 - 0.5;

        // Draw bead outer circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();

        // Draw bead highlight/shadow for 3D effect
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,0,0,0.15)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw bead hole
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; // Hole color
        ctx.fill();
        ctx.strokeStyle = `rgba(0,0,0,0.1)`;
        ctx.stroke();
      }
    }
  }, [patternData, beadSize]);

  if (!patternData) return null;

  return (
    <div className="overflow-auto max-h-[600px] w-full border border-gray-200 rounded-xl bg-white flex items-center justify-center p-6 shadow-inner custom-scrollbar">
      <canvas 
        ref={canvasRef} 
        className="shadow-sm" 
        style={{ 
          imageRendering: 'pixelated',
          background: 'repeating-conic-gradient(#f1f5f9 0% 25%, transparent 0% 50%) 50% / 20px 20px'
        }} 
      />
    </div>
  );
}
