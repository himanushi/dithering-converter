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
  // 拡大縮小率を文字列として管理（初期値 "100"）
  const [scale, setScale] = useState<string>("100");

  // 64色パレット（RGB 値は 0～255）
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

  // Ordered Dithering を実現するための変換処理
  // 4x4 の Bayer 行列を利用し、各ピクセルに位置依存の閾値オフセットを適用してパレット内の最も近い色を選択
  const orderedDitherImage = (imageData: ImageData, palette: RGB[]): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // 4x4 の Bayer 行列（値は 0～15）
    const bayerMatrix = [
      [0,  8,  2, 10],
      [12, 4, 14, 6],
      [3, 11, 1,  9],
      [15, 7, 13, 5]
    ];
    
    // この factor 値は閾値の影響度を調整します（適宜調整してください）
    const factor = 50;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const oldR = data[idx];
        const oldG = data[idx + 1];
        const oldB = data[idx + 2];
        
        // Bayer 行列の値を正規化し、[-0.5, 0.5) の範囲に変換
        const threshold = ((bayerMatrix[y % 4][x % 4] + 0.5) / 16) - 0.5;
        
        // 各チャンネルに閾値オフセットを適用
        const adjustedR = Math.min(255, Math.max(0, oldR + threshold * factor));
        const adjustedG = Math.min(255, Math.max(0, oldG + threshold * factor));
        const adjustedB = Math.min(255, Math.max(0, oldB + threshold * factor));
        
        // 調整後の色に対してパレット内の最も近い色を選択
        const nearest = findNearestColor(adjustedR, adjustedG, adjustedB, palette);
        data[idx]     = nearest.r;
        data[idx + 1] = nearest.g;
        data[idx + 2] = nearest.b;
        // アルファ値はそのまま
      }
    }
    return imageData;
  };

  // 画像ファイルの読み込み処理を共通化
  const loadImageFile = (file: File) => {
    setImageFile(file);
    setConverted(false);
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        originalImageRef.current = img;
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const scaleFactor = Number(scale) / 100;
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
    reader.readAsDataURL(file);
  };

  // input の onChange イベント
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadImageFile(e.target.files[0]);
    }
  };

  // ドラッグ＆ドロップでファイルを受け取る
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadImageFile(e.dataTransfer.files[0]);
    }
  };

  // パレット選択変更
  const handlePaletteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '64' || value === '2') {
      setSelectedPalette(value);
    }
  };

  // 拡大縮小入力（文字列）の変更
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(e.target.value);
  };

  // 変換ボタン押下時の処理
  // 元画像を scale (%) に合わせたサイズで再描画し、Ordered Dithering によるダイザリング処理を実施
  const handleConvert = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scaleFactor = Number(scale) / 100;
    const newWidth = Math.floor(originalImageRef.current.width * scaleFactor);
    const newHeight = Math.floor(originalImageRef.current.height * scaleFactor);
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(originalImageRef.current, 0, 0, newWidth, newHeight);
    const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
    const palette = getPalette();
    const convertedImageData = orderedDitherImage(imageData, palette);
    ctx.putImageData(convertedImageData, 0, 0);
    setConverted(true);
  };

  // ダウンロードボタン押下時の処理（アップロードしたファイル名を基に PNG ファイル名を設定）
  const handleDownload = () => {
    const canvas = canvasRef.current;
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
