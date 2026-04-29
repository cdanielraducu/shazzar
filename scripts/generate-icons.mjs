import {Jimp} from 'jimp';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = '/Users/daniel_raducu/Downloads/assets/app-icon-1024.png';

// iOS: size * scale = actual px
const iosIcons = [
  {size: 20, scale: 2}, // 40px
  {size: 20, scale: 3}, // 60px
  {size: 29, scale: 2}, // 58px
  {size: 29, scale: 3}, // 87px
  {size: 40, scale: 2}, // 80px
  {size: 40, scale: 3}, // 120px
  {size: 60, scale: 2}, // 120px
  {size: 60, scale: 3}, // 180px
  {size: 1024, scale: 1}, // 1024px App Store
];

const androidIcons = [
  {density: 'mdpi',    px: 48},
  {density: 'hdpi',    px: 72},
  {density: 'xhdpi',   px: 96},
  {density: 'xxhdpi',  px: 144},
  {density: 'xxxhdpi', px: 192},
];

async function run() {
  const img = await Jimp.read(src);

  // iOS
  const iosDir = path.join(root, 'ios/shazzar/Images.xcassets/AppIcon.appiconset');
  const contentsImages = [];

  for (const {size, scale} of iosIcons) {
    const px = size * scale;
    const filename = size === 1024
      ? 'Icon-1024.png'
      : `Icon-${size}@${scale}x.png`;
    const filePath = path.join(iosDir, filename);

    await img.clone().resize({w: px, h: px}).write(filePath);

    if (size === 1024) {
      contentsImages.push({idiom: 'ios-marketing', scale: '1x', size: '1024x1024', filename});
    } else {
      const idiom = 'iphone';
      contentsImages.push({idiom, scale: `${scale}x`, size: `${size}x${size}`, filename});
    }
    console.log(`iOS  ${filename} (${px}px)`);
  }

  // Deduplicate by filename (60@2x and 60@2x both = 120px, kept once)
  const seen = new Set();
  const uniqueImages = contentsImages.filter(entry => {
    if (seen.has(entry.filename)) return false;
    seen.add(entry.filename);
    return true;
  });

  // Rewrite Contents.json
  const contents = {
    images: uniqueImages,
    info: {author: 'xcode', version: 1},
  };
  import('fs').then(({writeFileSync}) => {
    writeFileSync(
      path.join(iosDir, 'Contents.json'),
      JSON.stringify(contents, null, 2) + '\n',
    );
  });

  // Android
  for (const {density, px} of androidIcons) {
    const dir = path.join(root, `android/app/src/main/res/mipmap-${density}`);
    await img.clone().resize({w: px, h: px}).write(path.join(dir, 'ic_launcher.png'));
    await img.clone().resize({w: px, h: px}).write(path.join(dir, 'ic_launcher_round.png'));
    console.log(`Android ${density} (${px}px)`);
  }

  console.log('\nDone.');
}

run().catch(e => { console.error(e); process.exit(1); });
