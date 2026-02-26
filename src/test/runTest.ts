import * as path from 'path';
import Mocha from 'mocha';

if (typeof (globalThis as any).File === 'undefined') {
  (globalThis as any).File = class FilePolyfill {};
}

async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'bdd', color: true });
  const testsRoot = __dirname;
  mocha.addFile(path.join(testsRoot, 'txtParser.test.js'));
  mocha.addFile(path.join(testsRoot, 'onlineParser.test.js'));

  await new Promise<void>((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
