import React from 'react';
import { getMaterialIconPath, renderMaterialIconToCanvas } from './MaterialIconCanvasRenderer';

export const IconExtractionDemo: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Test runtime extraction and rendering
    console.log('=== Runtime Icon Path Extraction Demo ===');
    
    const icons = ['Create', 'ContentCopy', 'Delete'] as const;
    
    icons.forEach((iconName, index) => {
      const path = getMaterialIconPath(iconName);
      console.log(`${iconName} icon path:`, path);
      
      if (path) {
        console.log(`✅ ${iconName} extracted successfully (${path.length} chars)`);
        
        // Render icon to canvas
        renderMaterialIconToCanvas(ctx, iconName, {
          x: 50 + (index * 100),
          y: 50,
          size: 32,
          color: '#333333'
        });
        
        // Add label
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(iconName, 50 + (index * 100), 90);
      } else {
        console.error(`❌ Failed to extract ${iconName} icon path`);
      }
    });

    console.log('=== End Demo ===');
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h3>Material Icon Runtime Extraction Demo</h3>
      <p>Icons extracted at runtime from Material Symbols components:</p>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={120} 
        style={{ 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          backgroundColor: '#f9f9f9'
        }} 
      />
      <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        Check the browser console to see the extracted SVG paths.
      </p>
    </div>
  );
};
