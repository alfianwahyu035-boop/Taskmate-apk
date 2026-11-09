import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
// Hanya file web publik yang boleh masuk APK. File jadwal/PIC rahasia jangan ditambahkan ke daftar ini.
const assets = [
  'index.html','app.js','styles.css','config.js','excel-import.js',
  'roster-data.js','sw.js','manifest.webmanifest',
  'Template_Import_TaskMate_Jadwal_Rak.xlsx',
  'icons/icon-192.png','icons/icon-512.png'
];
await rm(out, { recursive: true, force: true });
for (const name of assets) {
  const source = join(root, name), target = join(out, name);
  await mkdir(dirname(target), {recursive: true});
  await copyFile(source, target);
}
// Flag native hanya dipasang pada bundle APK; website GitHub Pages tetap memakai service worker.
const indexPath = join(out, 'index.html');
let html = await readFile(indexPath,'utf8');
if (!html.includes('<head>') || !html.includes('<script src="config.js"></script>')) {
  throw Error('index.html tidak dikenali: pembungkus Android tidak bisa disiapkan.');
}
html = html.replace('<script src="config.js"></script>',
  '<script>window.TASKMATE_NATIVE_APP=true;document.documentElement.classList.add("taskmate-native");</script>\n <script src="config.js"></script>');
await writeFile(indexPath, html, 'utf8');
const appPath = join(out, 'app.js');
let app = await readFile(appPath, 'utf8');
const sw = "if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});";
if (!app.includes(sw)) throw Error('Registrasi service worker berubah; tinjau app.js sebelum build APK.');
app = app.replace(sw,"if(!window.TASKMATE_NATIVE_APP && 'serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});");
const push = 'async function enableShiftPush(){';
if (!app.includes(push)) throw Error('Kode Web Push berubah; tinjau app.js sebelum build APK.');
app=app.replace(push, push+"\n if(window.TASKMATE_NATIVE_APP){notify('Push di APK butuh integrasi native (FCM). Untuk sementara gunakan pengingat saat aplikasi terbuka.',true);return}\n");
await writeFile(appPath,app,'utf8');
const cssPath = join(out,'styles.css');
await writeFile(cssPath,(await readFile(cssPath,'utf8')) + '\n/* Layout native: sisakan ruang aman di atas, terutama Android edge-to-edge. */\n@media(max-width:760px){html.taskmate-native .main{padding-top:max(16px,env(safe-area-inset-top))} html.taskmate-native .tmcam-top{padding-top:max(10px,env(safe-area-inset-top))}}\n','utf8');
console.log('Web bundle APK siap di www/: file publik saja, tanpa jadwal privat.');
