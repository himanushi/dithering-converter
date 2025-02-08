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
  // 元画像の保持用
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  // ファイル情報、パレット、スケール指定の状態
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<'64' | '2'>('64');
  // スケールモード：'percent'（%指定）か 'pixel'（px指定）
  const [scaleMode, setScaleMode] = useState<ScaleMode>('percent');
  // percent 指定の場合の値（例: "100"）
  const [scalePercent, setScalePercent] = useState<string>("100");
  // pixel 指定の場合の幅・高さ（空の場合は元サイズを使用）
  const [targetWidth, setTargetWidth] = useState<string>("");
  const [targetHeight, setTargetHeight] = useState<string>("");

  // 4 つのアルゴリズムそれぞれの結果表示用 canvas の ref
  const canvasRefs = {
    floyd: useRef<HTMLCanvasElement>(null),
    ordered: useRef<HTMLCanvasElement>(null),
    atkinson: useRef<HTMLCanvasElement>(null),
    random: useRef<HTMLCanvasElement>(null),
  };

  // 64 色パレットと黒白パレット
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
  const palette2: RGB[] = [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 }
  ];

  const getPalette = (): RGB[] => {
    return selectedPalette === '64' ? fullPalette64 : palette2;
  };

  // 共通の「最も近い色を探す」関数
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

  // Floyd–Steinberg ダイザリング
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

  // Ordered Dithering（Bayer 行列利用）
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

  // Atkinson ダイザリング
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

  // Random ダイザリング
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

  // 画像読み込み（URL.createObjectURL 使用）
  const loadImageFile = (file: File) => {
    setImageFile(file);
    originalImageRef.current = null;
    const img = new Image();
    img.onload = function () {
      originalImageRef.current = img;
      // サイズ指定：scaleMode に応じて計算
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
      // ※必要に応じて URL.revokeObjectURL(img.src) を呼び出してください
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
    if (value === '64' || value === '2') {
      setSelectedPalette(value);
    }
  };

  // スケールモードの切り替え
  const handleScaleModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScaleMode(e.target.value as ScaleMode);
  };

  // % 指定用の入力変更
  const handleScalePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScalePercent(e.target.value);
  };

  // px 指定用の入力変更
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetWidth(e.target.value);
  };
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetHeight(e.target.value);
  };

  // 一括変換ボタン押下時：各アルゴリズムで指定サイズに合わせて再描画＆変換
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

  // 各 canvas ごとのダウンロード（ファイル名はアップロードファイル名と同じ）
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
      <h1>画像ダイザリング一括変換ツール</h1>
      <div>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>
      <div>
        <label>パレット選択: </label>
        <select value={selectedPalette} onChange={handlePaletteChange}>
          <option value="64">64色</option>
          <option value="2">2色 (黒白)</option>
        </select>
      </div>
      <div style={{ marginTop: '10px' }}>
        <p>サイズ指定モード：</p>
        <label>
          <input
            type="radio"
            name="scaleMode"
            value="percent"
            checked={scaleMode === 'percent'}
            onChange={handleScaleModeChange}
          />
          拡大縮小 (%)
        </label>
        <label style={{ marginLeft: '20px' }}>
          <input
            type="radio"
            name="scaleMode"
            value="pixel"
            checked={scaleMode === 'pixel'}
            onChange={handleScaleModeChange}
          />
          幅・高さ (px)
        </label>
      </div>
      {scaleMode === 'percent' ? (
        <div>
          <label>拡大縮小 (%): </label>
          <input type="number" value={scalePercent} onChange={handleScalePercentChange} placeholder="例: 100" />
        </div>
      ) : (
        <div>
          <label>幅 (px): </label>
          <input type="number" value={targetWidth} onChange={handleWidthChange} placeholder="例: 260" />
          <label style={{ marginLeft: '10px' }}>高さ (px): </label>
          <input type="number" value={targetHeight} onChange={handleHeightChange} placeholder="例: 260" />
        </div>
      )}
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleConvert}>一括変換</button>
      </div>
      {imageFile && (
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          {algorithms.map((alg) => (
            <div key={alg} style={{ textAlign: 'center' }}>
              <p>{alg}</p>
              <canvas ref={canvasRefs[alg]} style={{ border: '1px solid #ccc' }}></canvas>
              <div>
                <button onClick={() => handleDownload(alg)}>ダウンロード</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
