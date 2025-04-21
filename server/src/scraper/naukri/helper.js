import fs from 'fs';
import path from 'path';

export const isBotTrained = () => {
  const cacheDir = path.resolve('cache');
  const pdfFile = fs.readdirSync(cacheDir).find(f => f.toLowerCase().endsWith('.pdf'));

  if (!pdfFile) {
    return false;
  } else {
    return true;
  }
};
