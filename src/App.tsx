import React, { useRef, useState, useEffect } from 'react';
import './App.css';

type RGB = {
  r: number;
  g: number;
  b: number;
};

type DitherAlgorithm = 'floyd' | 'ordered' | 'atkinson' | 'random';
type ScaleMode = 'percent' | 'pixel';

function App() {
  // Reference for storing the original image
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  // State for file info, palette, and scale settings
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<'64' | '16' | '8' | '2'>('64');
  // Scale mode: 'percent' (percentage) or 'pixel' (px)
  const [scaleMode, setScaleMode] = useState<ScaleMode>('percent');
  // Value for percent specification (e.g., "100")
  const [scalePercent, setScalePercent] = useState<string>("100");
  // Width and height for pixel specification (empty to use original size)
  const [targetWidth, setTargetWidth] = useState<string>("");
  const [targetHeight, setTargetHeight] = useState<string>("");
  // Original size inputs
  const [originalWidth, setOriginalWidth] = useState<string>("");
  const [originalHeight, setOriginalHeight] = useState<string>("");
  // Target size inputs
  const [desiredWidth, setDesiredWidth] = useState<string>("");
  const [desiredHeight, setDesiredHeight] = useState<string>("");

  // Canvas refs for displaying results of 4 algorithms
  const canvasRefs = {
    floyd: useRef<HTMLCanvasElement>(null),
    ordered: useRef<HTMLCanvasElement>(null),
    atkinson: useRef<HTMLCanvasElement>(null),
    random: useRef<HTMLCanvasElement>(null),
  };

  // 64-color palette and black & white palette
  const fullPalette64: RGB[] = [
    { r: 0,   g: 0,   b: 0 },   { r: 0,   g: 0,   b: 85 },  { r: 0,   g: 0,   b: 170 }, { r: 0,   g: 0,   b: 255 },
    { r: 0,   g: 85,  b: 0 },   { r: 0,   g: 85,  b: 85 },  { r: 0,   g: 85,  b: 170 }, { r: 0,   g: 85,  b: 255 },
    { r: 0,   g: 170, b: 0 },   { r: 0,   g: 170, b: 85 },  { r: 0,   g: 170, b: 170 }, { r: 0,   g: 170, b: 255 },
    { r: 0,   g: 255, b: 0 },   { r: 0,   g: 255, b: 85 },  { r: 0,   g: 255, b: 170 }, { r: 0,   g: 255, b: 255 },
    { r: 85,  g: 0,   b: 0 },   { r: 85,  g: 0,   b: 85 },  { r: 85,  g: 0,   b: 170 }, { r: 85,  g: 0,   b: 255 },
    { r: 85,  g: 85,  b: 0 },   { r: 85,  g: 85,  b: 85 },  { r: 85,  g: 85,  b: 170 }, { r: 85,  g: 85,  b: 255 },
    { r: 85,  g: 170, b: 0 },   { r: 85,  g: 170, b: 85 },  { r: 85,  g: 170, b: 170 }, { r: 85,  g: 170, b: 255 },
    { r: 85,  g: 255, b: 0 },   { r: 85,  g: 255, b: 85 },  { r: 85,  g: 255, b: 170 }, { r: 85,  g: 255, b: 255 },
    { r: 170, g: 0,   b: 0 },   { r: 170, g: 0,   b: 85 },  { r: 170, g: 0,   b: 170 }, { r: 170, g: 0,   b: 255 },
    { r: 170, g: 85,  b: 0 },   { r: 170, g: 85,  b: 85 },  { r: 170, g: 85,  b: 170 }, { r: 170, g: 85,  b: 255 },
    { r: 170, g: 170, b: 0 },   { r: 170, g: 170, b: 85 },  { r: 170, g: 170, b: 170 }, { r: 170, g: 170, b: 255 },
    { r: 170, g: 255, b: 0 },   { r: 170, g: 255, b: 85 },  { r: 170, g: 255, b: 170 }, { r: 170, g: 255, b: 255 },
    { r: 255, g: 0,   b: 0 },   { r: 255, g: 0,   b: 85 },  { r: 255, g: 0,   b: 170 }, { r: 255, g: 0,   b: 255 },
    { r: 255, g: 85,  b: 0 },   { r: 255, g: 85,  b: 85 },  { r: 255, g: 85,  b: 170 }, { r: 255, g: 85,  b: 255 },
    { r: 255, g: 170, b: 0 },   { r: 255, g: 170, b: 85 },  { r: 255, g: 170, b: 170 }, { r: 255, g: 170, b: 255 },
    { r: 255, g: 255, b: 0 },   { r: 255, g: 255, b: 85 },  { r: 255, g: 255, b: 170 }, { r: 255, g: 255, b: 255 },
  ];

  // 16-color palette (as specified)
  const palette16: RGB[] = [
    { r: 0,   g: 0,   b: 0 },   // 0x000000
    { r: 0,   g: 0,   b: 255 }, // 0x0000ff
    { r: 0,   g: 170, b: 0 },   // 0x00aa00
    { r: 0,   g: 170, b: 255 }, // 0x00aaff
    { r: 0,   g: 255, b: 0 },   // 0x00ff00
    { r: 85,  g: 0,   b: 170 }, // 0x5500aa
    { r: 85,  g: 85,  b: 85 },  // 0x555555
    { r: 170, g: 0,   b: 0 },   // 0xaa0000
    { r: 170, g: 170, b: 170 }, // 0xaaaaaa
    { r: 255, g: 0,   b: 0 },   // 0xff0000
    { r: 255, g: 0,   b: 255 }, // 0xff00ff
    { r: 255, g: 85,  b: 0 },   // 0xff5500
    { r: 255, g: 170, b: 0 },   // 0xffaa00
    { r: 255, g: 255, b: 255 }, // 0xffffff
  ];

  // 8-color palette (as specified)
  const palette8: RGB[] = [
    { r: 0,   g: 0,   b: 0 },   // 0x000000
    { r: 0,   g: 0,   b: 255 }, // 0x0000ff
    { r: 0,   g: 255, b: 0 },   // 0x00ff00
    { r: 0,   g: 255, b: 255 }, // 0x00ffff
    { r: 255, g: 0,   b: 0 },   // 0xff0000
    { r: 255, g: 0,   b: 255 }, // 0xff00ff
    { r: 255, g: 255, b: 0 },   // 0xffff00
    { r: 255, g: 255, b: 255 }, // 0xffffff
  ];

  const palette2: RGB[] = [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 }
  ];

  const getPalette = (): RGB[] => {
    switch (selectedPalette) {
      case '64':
        return fullPalette64;
      case '16':
        return palette16;
      case '8':
        return palette8;
      case '2':
        return palette2;
      default:
        return fullPalette64;
    }
  };

  // Common function for finding the nearest color
  const findNearestColor = (r: number, g: number, b: number, palette: RGB[]): RGB => {
    let minDiff = Infinity;
    let nearest = palette[0];
    for (const color of palette) {
      const diff = Math.pow(r - color.r, 2) + Math.pow(g - color.g, 2) + Math.pow(b - color.b, 2);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = color;
      }
    }
    return nearest;
  };

  // Floyd–Steinberg dithering
  const floydSteinbergDitherImage = (imageData: ImageData, palette: RGB[]): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const floatData = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      floatData[i] = data[i];
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const oldR = floatData[idx];
        const oldG = floatData[idx + 1];
        const oldB = floatData[idx + 2];
        const nearest = findNearestColor(oldR, oldG, oldB, palette);
        const newR = nearest.r;
        const newG = nearest.g;
        const newB = nearest.b;
        floatData[idx] = newR;
        floatData[idx + 1] = newG;
        floatData[idx + 2] = newB;
        const errR = oldR - newR;
        const errG = oldG - newG;
        const errB = oldB - newB;
        if (x + 1 < width) {
          const i1 = (y * width + (x + 1)) * 4;
          floatData[i1] += errR * 7 / 16;
          floatData[i1 + 1] += errG * 7 / 16;
          floatData[i1 + 2] += errB * 7 / 16;
        }
        if (x - 1 >= 0 && y + 1 < height) {
          const i1 = ((y + 1) * width + (x - 1)) * 4;
          floatData[i1] += errR * 3 / 16;
          floatData[i1 + 1] += errG * 3 / 16;
          floatData[i1 + 2] += errB * 3 / 16;
        }
        if (y + 1 < height) {
          const i1 = ((y + 1) * width + x) * 4;
          floatData[i1] += errR * 5 / 16;
          floatData[i1 + 1] += errG * 5 / 16;
          floatData[i1 + 2] += errB * 5 / 16;
        }
        if (x + 1 < width && y + 1 < height) {
          const i1 = ((y + 1) * width + (x + 1)) * 4;
          floatData[i1] += errR * 1 / 16;
          floatData[i1 + 1] += errG * 1 / 16;
          floatData[i1 + 2] += errB * 1 / 16;
        }
      }
    }
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.max(0, Math.min(255, floatData[i]));
    }
    return imageData;
  };

  // Ordered Dithering (using Bayer matrix)
  const orderedDitherImage = (imageData: ImageData, palette: RGB[]): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const bayerMatrix = [
      [0,  8,  2, 10],
      [12, 4, 14, 6],
      [3, 11, 1,  9],
      [15, 7, 13, 5]
    ];
    const factor = 50;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const oldR = data[idx];
        const oldG = data[idx + 1];
        const oldB = data[idx + 2];
        const threshold = ((bayerMatrix[y % 4][x % 4] + 0.5) / 16) - 0.5;
        const adjustedR = Math.min(255, Math.max(0, oldR + threshold * factor));
        const adjustedG = Math.min(255, Math.max(0, oldG + threshold * factor));
        const adjustedB = Math.min(255, Math.max(0, oldB + threshold * factor));
        const nearest = findNearestColor(adjustedR, adjustedG, adjustedB, palette);
        data[idx] = nearest.r;
        data[idx + 1] = nearest.g;
        data[idx + 2] = nearest.b;
      }
    }
    return imageData;
  };

  // Atkinson dithering
  const atkinsonDitherImage = (imageData: ImageData, palette: RGB[]): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const floatData = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      floatData[i] = data[i];
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const oldR = floatData[idx];
        const oldG = floatData[idx + 1];
        const oldB = floatData[idx + 2];
        const nearest = findNearestColor(oldR, oldG, oldB, palette);
        const newR = nearest.r;
        const newG = nearest.g;
        const newB = nearest.b;
        floatData[idx] = newR;
        floatData[idx + 1] = newG;
        floatData[idx + 2] = newB;
        const errR = oldR - newR;
        const errG = oldG - newG;
        const errB = oldB - newB;
        const factor = 1 / 8;
        if (x + 1 < width) {
          const i1 = (y * width + (x + 1)) * 4;
          floatData[i1] += errR * factor;
          floatData[i1 + 1] += errG * factor;
          floatData[i1 + 2] += errB * factor;
        }
        if (x + 2 < width) {
          const i1 = (y * width + (x + 2)) * 4;
          floatData[i1] += errR * factor;
          floatData[i1 + 1] += errG * factor;
          floatData[i1 + 2] += errB * factor;
        }
        if (x - 1 >= 0 && y + 1 < height) {
          const i1 = ((y + 1) * width + (x - 1)) * 4;
          floatData[i1] += errR * factor;
          floatData[i1 + 1] += errG * factor;
          floatData[i1 + 2] += errB * factor;
        }
        if (y + 1 < height) {
          const i1 = ((y + 1) * width + x) * 4;
          floatData[i1] += errR * factor;
          floatData[i1 + 1] += errG * factor;
          floatData[i1 + 2] += errB * factor;
        }
        if (x + 1 < width && y + 1 < height) {
          const i1 = ((y + 1) * width + (x + 1)) * 4;
          floatData[i1] += errR * factor;
          floatData[i1 + 1] += errG * factor;
          floatData[i1 + 2] += errB * factor;
        }
        if (y + 2 < height) {
          const i1 = ((y + 2) * width + x) * 4;
          floatData[i1] += errR * factor;
          floatData[i1 + 1] += errG * factor;
          floatData[i1 + 2] += errB * factor;
        }
      }
    }
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.max(0, Math.min(255, floatData[i]));
    }
    return imageData;
  };

  // Random dithering
  const randomDitherImage = (imageData: ImageData, palette: RGB[]): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const noiseLevel = 32;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const noise = (Math.random() - 0.5) * noiseLevel;
        const newR = data[idx] + noise;
        const newG = data[idx + 1] + noise;
        const newB = data[idx + 2] + noise;
        const nearest = findNearestColor(newR, newG, newB, palette);
        data[idx] = nearest.r;
        data[idx + 1] = nearest.g;
        data[idx + 2] = nearest.b;
      }
    }
    return imageData;
  };

  const ditherFunctions: { [key in DitherAlgorithm]: (imageData: ImageData, palette: RGB[]) => ImageData } = {
    floyd: floydSteinbergDitherImage,
    ordered: orderedDitherImage,
    atkinson: atkinsonDitherImage,
    random: randomDitherImage,
  };

  const algorithms: DitherAlgorithm[] = ['floyd', 'ordered', 'atkinson', 'random'];

  // Calculate scale percentage based on original and desired sizes
  const calculateScale = (origW: string, origH: string, desiredW: string, desiredH: string): string => {
    if (!origW || !origH || !desiredW || !desiredH) return "100";
    const oW = parseFloat(origW);
    const oH = parseFloat(origH);
    const dW = parseFloat(desiredW);
    const dH = parseFloat(desiredH);
    if (isNaN(oW) || isNaN(oH) || isNaN(dW) || isNaN(dH)) return "100";
    const scaleW = (dW / oW) * 100;
    const scaleH = (dH / oH) * 100;
    return Math.min(scaleW, scaleH).toFixed(2);
  };

  // Handle size input changes
  const handleOriginalWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOriginalWidth(e.target.value);
    const newScale = calculateScale(e.target.value, originalHeight, desiredWidth, desiredHeight);
    setScalePercent(newScale);
  };

  const handleOriginalHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOriginalHeight(e.target.value);
    const newScale = calculateScale(originalWidth, e.target.value, desiredWidth, desiredHeight);
    setScalePercent(newScale);
  };

  const handleDesiredWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDesiredWidth(e.target.value);
    const newScale = calculateScale(originalWidth, originalHeight, e.target.value, desiredHeight);
    setScalePercent(newScale);
  };

  const handleDesiredHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDesiredHeight(e.target.value);
    const newScale = calculateScale(originalWidth, originalHeight, desiredWidth, e.target.value);
    setScalePercent(newScale);
  };

  // Image loading (using URL.createObjectURL)
  const loadImageFile = (file: File) => {
    setImageFile(file);
    originalImageRef.current = null;
    const img = new Image();
    img.onload = function () {
      originalImageRef.current = img;
      // Set original size
      setOriginalWidth(img.width.toString());
      setOriginalHeight(img.height.toString());
      // Calculate size based on scaleMode
      let w: number, h: number;
      if (scaleMode === 'percent') {
        w = img.width * (Number(scalePercent) / 100);
        h = img.height * (Number(scalePercent) / 100);
      } else {
        w = targetWidth ? Number(targetWidth) : img.width;
        h = targetHeight ? Number(targetHeight) : img.height;
      }
      algorithms.forEach((alg) => {
        const canvas = canvasRefs[alg].current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
          }
        }
      });
      // Call URL.revokeObjectURL(img.src) when needed
    };
    img.src = URL.createObjectURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadImageFile(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); };
    const handleDropDocument = (e: DragEvent) => { e.preventDefault(); };
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDropDocument);
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDropDocument);
    };
  }, []);

  const handlePaletteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '64' || value === '16' || value === '8' || value === '2') {
      setSelectedPalette(value);
    }
  };

  // Switch scale mode
  const handleScaleModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScaleMode(e.target.value as ScaleMode);
  };

  // Input change for percentage specification
  const handleScalePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScalePercent(e.target.value);
  };

  // Input change for pixel specification
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetWidth(e.target.value);
  };
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetHeight(e.target.value);
  };

  // When Convert All button is clicked: Redraw and convert with each algorithm at the specified size
  const handleConvert = () => {
    if (!originalImageRef.current) return;
    const palette = getPalette();
    let w: number, h: number;
    const img = originalImageRef.current;
    if (scaleMode === 'percent') {
      w = img.width * (Number(scalePercent) / 100);
      h = img.height * (Number(scalePercent) / 100);
    } else {
      w = targetWidth ? Number(targetWidth) : img.width;
      h = targetHeight ? Number(targetHeight) : img.height;
    }
    algorithms.forEach((alg) => {
      const canvas = canvasRefs[alg].current;
      if (canvas && img) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const ditheredImageData = ditherFunctions[alg](imageData, palette);
          ctx.putImageData(ditheredImageData, 0, 0);
        }
      }
    });
  };

  // Download for each canvas (filename matches the uploaded file name)
  const handleDownload = (alg: DitherAlgorithm) => {
    const canvas = canvasRefs[alg].current;
    if (!canvas) return;
    const link = document.createElement('a');
    const fileName =
      imageFile && imageFile.name
        ? imageFile.name.replace(/\.[^/.]+$/, '') + '.png'
        : 'converted.png';
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      className="App"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ minHeight: '100vh', padding: '20px' }}
    >
      <h1>Image Dithering Batch Converter</h1>
      <div>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>
      <div>
        <label>Palette Selection: </label>
        <select value={selectedPalette} onChange={handlePaletteChange}>
          <option value="64">64 Colors</option>
          <option value="16">16 Colors</option>
          <option value="8">8 Colors</option>
          <option value="2">2 Colors (Black & White)</option>
        </select>
      </div>
      <div style={{ marginTop: '10px' }}>
        <p>Size Specification Mode:</p>
        <label>
          <input
            type="radio"
            name="scaleMode"
            value="percent"
            checked={scaleMode === 'percent'}
            onChange={handleScaleModeChange}
          />
          Scale (%)
        </label>
        <label style={{ marginLeft: '20px' }}>
          <input
            type="radio"
            name="scaleMode"
            value="pixel"
            checked={scaleMode === 'pixel'}
            onChange={handleScaleModeChange}
          />
          Width & Height (px)
        </label>
      </div>
      {scaleMode === 'percent' ? (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <label>Original Size: </label>
            <input
              type="number"
              value={originalWidth}
              onChange={handleOriginalWidthChange}
              placeholder="Width"
              style={{ width: '80px', marginRight: '10px' }}
            />
            <span>x</span>
            <input
              type="number"
              value={originalHeight}
              onChange={handleOriginalHeightChange}
              placeholder="Height"
              style={{ width: '80px', marginLeft: '10px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Target Size: </label>
            <input
              type="number"
              value={desiredWidth}
              onChange={handleDesiredWidthChange}
              placeholder="Width"
              style={{ width: '80px', marginRight: '10px' }}
            />
            <span>x</span>
            <input
              type="number"
              value={desiredHeight}
              onChange={handleDesiredHeightChange}
              placeholder="Height"
              style={{ width: '80px', marginLeft: '10px' }}
            />
          </div>
          <div>
            <label>Scale (%): </label>
            <input
              type="number"
              value={scalePercent}
              onChange={handleScalePercentChange}
              placeholder="e.g. 100"
              readOnly
            />
          </div>
        </div>
      ) : (
        <div>
          <label>Width (px): </label>
          <input type="number" value={targetWidth} onChange={handleWidthChange} placeholder="e.g. 260" />
          <label style={{ marginLeft: '10px' }}>Height (px): </label>
          <input type="number" value={targetHeight} onChange={handleHeightChange} placeholder="e.g. 260" />
        </div>
      )}
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleConvert}>Convert All</button>
      </div>
      {imageFile && (
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          {algorithms.map((alg) => (
            <div key={alg} style={{ textAlign: 'center' }}>
              <p>{alg}</p>
              <canvas ref={canvasRefs[alg]} style={{ border: '1px solid #ccc' }}></canvas>
              <div>
                <button onClick={() => handleDownload(alg)}>Download</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
