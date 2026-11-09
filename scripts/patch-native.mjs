import {readFile,writeFile,copyFile,mkdir,stat} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dest=join(root,'android/app/src/main');
const manifest=join(dest,'AndroidManifest.xml');
let xml=await readFile(manifest,'utf8');
for (const permission of ['android.permission.INTERNET','android.permission.CAMERA']) {
 if (!xml.includes(`android:name="${permission}"`)) {
   xml=xml.replace(/(<manifest\b[^>]*>)/,`$1\n    <uses-permission android:name="${permission}" />`);
 }
}
if (!xml.includes('android.hardware.camera')) {
 xml=xml.replace(/(<manifest\b[^>]*>)/,'$1\n    <uses-feature android:name="android.hardware.camera" android:required="false" />');
}
await writeFile(manifest,xml,'utf8');
const source=join(root,'android-icons');
let total=0;
for (const density of ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']) {
 const folder=`mipmap-${density}`;
 for (const asset of ['ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png']) {
  const src=join(source,folder,asset),out=join(dest,'res',folder,asset);
  await mkdir(dirname(out),{recursive:true});
  await copyFile(src,out); total++;
 }
}
console.log(`Izin INTERNET + CAMERA aktif; ${total} ikon Android dipasang.`);
