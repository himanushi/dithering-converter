import React, { useRef, useState, useEffect } from 'react';
import './App.css';

type RGB = {
  r: number;
  g: number;
  b: number;
};

type DitherAlgorithm = 'floyd' | 'ordered' | 'atkinson' | 'random';

function App() {
  // 元画像の保持用
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  // ファイル情報、パレット、スケールの状態
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<'64' | '2'>('64');
  const [scale, setScale] = useState<string>("100");

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

  // 画像読み込み（URL.createObjectURL を利用）
  const loadImageFile = (file: File) => {
    setImageFile(file);
    // 初回描画用に各 canvas に元画像を描画
    originalImageRef.current = null;
    const img = new Image();
    img.onload = function () {
      originalImageRef.current = img;
      const scaleFactor = Number(scale) / 100;
      algorithms.forEach((alg) => {
        const canvas = canvasRefs[alg].current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = Math.floor(img.width * scaleFactor);
            canvas.height = Math.floor(img.height * scaleFactor);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        }
      });
      // ※URL.revokeObjectURL は画像の読み込みが完了した後に呼び出すと画像が無効になる場合があるため、今回はコメントアウトしています
      // URL.revokeObjectURL(img.src);
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

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(e.target.value);
  };

  // 一括変換ボタン押下時：各アルゴリズムごとに再描画して変換を実施
  const handleConvert = () => {
    if (!originalImageRef.current) return;
    const palette = getPalette();
    const scaleFactor = Number(scale) / 100;
    algorithms.forEach((alg) => {
      const canvas = canvasRefs[alg].current;
      if (canvas && originalImageRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = Math.floor(originalImageRef.current.width * scaleFactor);
          canvas.height = Math.floor(originalImageRef.current.height * scaleFactor);
          ctx.drawImage(originalImageRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const ditheredImageData = ditherFunctions[alg](imageData, palette);
          ctx.putImageData(ditheredImageData, 0, 0);
        }
      }
    });
  };

  // 各 canvas ごとのダウンロード処理
  const handleDownload = (alg: DitherAlgorithm) => {
    const canvas = canvasRefs[alg].current;
    if (!canvas) return;
    const link = document.createElement('a');
    const fileName =
      imageFile && imageFile.name
        ? imageFile.name.replace(/\.[^/.]+$/, '') + `_${alg}.png`
        : `converted_${alg}.png`;
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
      <div>
        <label>拡大縮小 (%): </label>
        <input type="number" value={scale} onChange={handleScaleChange} />
      </div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleConvert}>一括変換</button>
      </div>
      {/* 画像が読み込まれたら各 canvas を常に表示 */}
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
