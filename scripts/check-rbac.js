const fs = require('fs');
const path = require('path');

const ACTIONS_DIR = path.resolve(__dirname, '..', 'src', 'app', 'actions');
const TARGET_TABLES = ['cursos', 'lecciones', 'organizaciones', 'usuarios'];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const findings = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const t of TARGET_TABLES) {
      if (line.includes(`insert(${t}`) || line.includes(`update(${t}`) || line.includes(`delete(${t}`)) {
        // find enclosing function name (simple heuristic)
        let funcName = 'unknown';
        for (let j = i; j >= 0; j--) {
          const m = lines[j].match(/export async function ([a-zA-Z0-9_]+)/);
          if (m) { funcName = m[1]; break; }
        }

        // check if file references requireRole
        const hasRequireRole = /requireRole\(/.test(content);

        // support suppression via comment: file-level `// rbac:allow` or function-level `// rbac:allow:funcName`
        const fileAllow = /rbac:allow/i.test(content);
        const funcAllow = new RegExp(`rbac:allow[:(]?${funcName}[)\s]*`, 'i').test(content);
        const suppressed = fileAllow || funcAllow;

        findings.push({ file: filePath, line: i + 1, table: t, func: funcName, hasRequireRole, suppressed });
      }
    }
  }
  return findings;
}

function main() {
  if (!fs.existsSync(ACTIONS_DIR)) {
    console.error('Actions dir not found:', ACTIONS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(ACTIONS_DIR).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js'));
  let total = 0;
  let issues = 0;
  for (const f of files) {
    const fp = path.join(ACTIONS_DIR, f);
    const res = scanFile(fp);
    res.forEach(r => {
      total++;
      if (r.suppressed) {
        console.log(`SUPP ${path.relative(process.cwd(), r.file)}:${r.line} -> function ${r.func} mutates ${r.table} (suppressed by rbac:allow)`);
        return;
      }
      if (!r.hasRequireRole) issues++;
      console.log(`${r.hasRequireRole ? 'OK ' : 'WARN'} ${path.relative(process.cwd(), r.file)}:${r.line} -> function ${r.func} mutates ${r.table} (requireRole: ${r.hasRequireRole})`);
    });
  }

  console.log('Scan complete. Findings:', total, 'issues:', issues);
  if (issues > 0) process.exit(2);
}

main();
