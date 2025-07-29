# Icon Files

This directory should contain the application icons:

- `icon.png` - For Linux (512x512 pixels recommended)
- `icon.ico` - For Windows (256x256 pixels recommended)
- `icon.icns` - For macOS (512x512 pixels recommended)

You can create these icons from your application logo or use a default Electron icon as a placeholder.

To generate the required icon formats, you can use tools like:
- [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
- [png2icons](https://www.npmjs.com/package/png2icons)
- Online converters

Example to generate all formats from a PNG:
```bash
npm install -g electron-icon-builder
electron-icon-builder --input=icon.png --output=./
```
