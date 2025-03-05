# Image Dithering Batch Converter

A React-based web application that allows users to apply various dithering algorithms to images with different color palettes and sizing options.

## Features

- **Multiple Dithering Algorithms:**
  - Floyd-Steinberg: Error diffusion dithering with classic 16-part error distribution
  - Ordered: Uses Bayer matrix for pattern-based dithering
  - Atkinson: Error diffusion dithering with 8-part error distribution
  - Random: Adds random noise before color quantization

- **Color Palette Options:**
  - 64 Colors: Full RGB color palette (4×4×4 cube)
  - 16 Colors: Standard 16-color palette
  - 8 Colors: Basic RGB color palette
  - 2 Colors: Black and white

- **Image Size Controls:**
  - Scale by percentage
  - Set exact pixel dimensions
  - Auto-scaling calculator based on target dimensions

- **User Interface:**
  - Drag and drop image upload
  - File picker support
  - Side-by-side algorithm comparison
  - Individual result download options

## How to Use

1. **Upload an Image:**
   - Drag and drop an image onto the application
   - Or click the file input to select an image

2. **Select Color Palette:**
   - Choose from 64, 16, 8, or 2 colors
   - Each palette offers different color quantization options

3. **Set Output Size:**
   - Percentage Mode:
     - Enter original dimensions
     - Enter target dimensions
     - The scale percentage will be automatically calculated
   - Pixel Mode:
     - Directly specify width and height in pixels

4. **Convert and Download:**
   - Click "Convert All" to process the image
   - View all four dithering results simultaneously
   - Use individual download buttons to save results as PNG

## Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Development

This project is built with:
- React
- TypeScript
- Vite

The core dithering algorithms are implemented in pure JavaScript/TypeScript with no external image processing dependencies.
