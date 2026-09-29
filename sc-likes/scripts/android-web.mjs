// Builds the web app into android/app/src/main/assets and writes the app's config.
// Usage: node scripts/android-web.mjs [--with-keys]   (keys are OFF by default: an APK is easy to unpack)
import {execSync} from 'node:child_process';import fs from 'node:fs';
execSync('npx vite build --mode android',{stdio:'inherit'});
const src=fs.existsSync('credentials.txt')?fs.readFileSync('credentials.txt','utf8'):'';
const keep=process.argv.includes('--with-keys')?/^\s*(CLIENT_ID|CLIENT_SECRET|PROFILE_URL)\s*[=:]/i:/^\s*PROFILE_URL\s*[=:]/i;
fs.writeFileSync('android/app/src/main/assets/credentials.txt',src.split(/\r?\n/).filter(l=>keep.test(l)).join('\n')+'\n');
console.log('Android web assets ready.');
