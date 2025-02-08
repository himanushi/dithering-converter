import React, { useRef, useState } from 'react';
import './App.css';

type RGB = {
  r: number;
  g: number;
  b: number;
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // アップロードされた元画像を保持するための ref
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<'64' | '2'>('64');
  const [converted, setConverted] = useState(false);
  // 拡大縮小率（%）：初期は100%（そのままのサイズ）
  const [scale, setScale] = useState(100);

  // 64色パレット（各値は 0～255）
  const palette64: RGB[] = [
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

  // 黒白パレット
  const palette2: RGB[] = [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 }
  ];

  // 選択されたパレットを返す
  const getPalette = (): RGB[] => {
    return selectedPalette === '64' ? palette64 : palette2;
  };

  // 指定した色に対して、パレット内で最も近い色を返す
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

  // Floyd–Steinberg ダイザリングアルゴリズムによる画像変換
  const ditherImage = (imageData: ImageData, palette: RGB[]): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    // 誤差伝搬用に float 型の作業用配列を作成
    const floatData = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      floatData[i] = data[i];
    }
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const oldR = floatData[index];
        const oldG = floatData[index + 1];
        const oldB = floatData[index + 2];

        // 現在のピクセルの色に対し、パレット内で最も近い色を決定
        const nearest = findNearestColor(oldR, oldG, oldB, palette);
        const newR = nearest.r;
        const newG = nearest.g;
        const newB = nearest.b;

        // 新しい色をセット
        floatData[index] = newR;
        floatData[index + 1] = newG;
        floatData[index + 2] = newB;

        // 誤差計算
        const errR = oldR - newR;
        const errG = oldG - newG;
        const errB = oldB - newB;

        // Floyd–Steinberg の係数に従い誤差を伝搬
        if (x + 1 < width) {
          const idx = (y * width + (x + 1)) * 4;
          floatData[idx]     += errR * 7 / 16;
          floatData[idx + 1] += errG * 7 / 16;
          floatData[idx + 2] += errB * 7 / 16;
        }
        if (x - 1 >= 0 && y + 1 < height) {
          const idx = ((y + 1) * width + (x - 1)) * 4;
          floatData[idx]     += errR * 3 / 16;
          floatData[idx + 1] += errG * 3 / 16;
          floatData[idx + 2] += errB * 3 / 16;
        }
        if (y + 1 < height) {
          const idx = ((y + 1) * width + x) * 4;
          floatData[idx]     += errR * 5 / 16;
          floatData[idx + 1] += errG * 5 / 16;
          floatData[idx + 2] += errB * 5 / 16;
        }
        if (x + 1 < width && y + 1 < height) {
          const idx = ((y + 1) * width + (x + 1)) * 4;
          floatData[idx]     += errR * 1 / 16;
          floatData[idx + 1] += errG * 1 / 16;
          floatData[idx + 2] += errB * 1 / 16;
        }
      }
    }
    
    // 結果を元の imageData に反映（0～255 の範囲にクランプ）
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.max(0, Math.min(255, floatData[i]));
    }
    return imageData;
  };

  // ファイル入力変更時：画像を読み込み、元画像を保持するとともに初期描画
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setConverted(false);
      const reader = new FileReader();
      reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
          originalImageRef.current = img;
          // 初回は現在の scale (%) に合わせて描画
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const scaleFactor = scale / 100;
              canvas.width = Math.floor(img.width * scaleFactor);
              canvas.height = Math.floor(img.height * scaleFactor);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
          }
        };
        if (event.target && event.target.result) {
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // パレット選択変更時の処理
  const handlePaletteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '64' || value === '2') {
      setSelectedPalette(value);
    }
  };

  // 拡大縮小率入力変更時の処理
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(Number(e.target.value));
  };

  // 変換ボタン押下時：元画像から scale (%) に合わせたサイズで再描画し、ダイザリング処理
  const handleConvert = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scaleFactor = scale / 100;
    const newWidth = Math.floor(originalImageRef.current.width * scaleFactor);
    const newHeight = Math.floor(originalImageRef.current.height * scaleFactor);
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(originalImageRef.current, 0, 0, newWidth, newHeight);
    const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
    const palette = getPalette();
    const convertedImageData = ditherImage(imageData, palette);
    ctx.putImageData(convertedImageData, 0, 0);
    setConverted(true);
  };

  // ダウンロードボタン押下時：Canvas の内容を PNG として出力。ファイル名は入力ファイル名を使用
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    const downloadFileName = imageFile ? imageFile.name : 'converted.png';
    link.download = downloadFileName;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="App">
      <h1>画像ダイザリング変換ツール</h1>
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
      <div>
        <button onClick={handleConvert}>変換</button>
      </div>
      <div>
        <canvas ref={canvasRef} style={{ border: '1px solid #ccc', marginTop: '10px' }}></canvas>
      </div>
      {converted && (
        <div>
          <button onClick={handleDownload}>ダウンロード</button>
        </div>
      )}
    </div>
  );
}

export default App;
