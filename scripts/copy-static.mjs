import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const required = ['app/index.html', 'kiyaku.html', 'poricy.html', 'service-config.json', 'bustimelist/config.json'];
mkdirSync(dist, { recursive: true });
for (const file of ['kiyaku.html', 'poricy.html']) cpSync(join(root, file), join(dist, file));
cpSync(join(root, 'service-config.json'), join(dist, 'service-config.json'));
cpSync(join(root, 'bustimelist'), join(dist, 'bustimelist'), { recursive: true });
for (const file of required) {
  if (!existsSync(join(dist, file))) throw new Error(`buildに必要なファイルがありません: ${file}`);
}
console.log(`静的ファイルを ${dist} に収録しました。`);
