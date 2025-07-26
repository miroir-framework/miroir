// Test script to verify runtime icon path extraction
import { getMaterialIconPath } from './MaterialIconCanvasRenderer';

export function testIconExtraction() {
  console.log('Testing runtime icon path extraction...');
  
  const icons = ['Create', 'ContentCopy', 'Delete'] as const;
  
  icons.forEach(iconName => {
    const path = getMaterialIconPath(iconName);
    console.log(`${iconName} icon path:`, path);
    
    if (path) {
      console.log(`✅ ${iconName} extracted successfully (${path.length} chars)`);
    } else {
      console.error(`❌ Failed to extract ${iconName} icon path`);
    }
  });
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  testIconExtraction();
}
