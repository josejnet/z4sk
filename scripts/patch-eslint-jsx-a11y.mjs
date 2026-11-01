import { readFile, writeFile } from "node:fs/promises";

// eslint-plugin-jsx-a11y 6.x imports the CommonJS default exported by old
// minimatch releases. Minimatch 11 fixes the audit advisory and exports a
// named function instead. Keep the accessibility rules while using the fixed
// dependency until the plugin publishes native minimatch 11 compatibility.
const files = [
  "node_modules/eslint-plugin-jsx-a11y/lib/util/mayContainChildComponent.js",
  "node_modules/eslint-plugin-jsx-a11y/lib/util/mayHaveAccessibleLabel.js",
];

for (const file of files) {
  const original = await readFile(file, "utf8");
  const patched = original
    .replace(
      'var _minimatch = _interopRequireDefault(require("minimatch"));',
      'var _minimatchModule = require("minimatch");\nvar _minimatch = _minimatchModule.minimatch || _minimatchModule.default || _minimatchModule;',
    )
    .replaceAll('(0, _minimatch["default"])(', "_minimatch(");
  if (!patched.includes("_minimatchModule.minimatch") || patched.includes('_minimatch["default"]')) {
    throw new Error(`Could not apply the audited minimatch compatibility patch to ${file}.`);
  }
  if (patched !== original) await writeFile(file, patched);
}

