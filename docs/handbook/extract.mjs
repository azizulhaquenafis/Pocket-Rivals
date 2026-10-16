import ts from '../../node_modules/typescript/lib/typescript.js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = process.cwd();
const ignored = new Set(['node_modules','.git','dist','build','.gradle','.idea','test-results','output','tmp','handbook']);
const inventory=[];
function walk(dir) { for(const e of fs.readdirSync(dir,{withFileTypes:true})) { if(ignored.has(e.name)||e.name==='.DS_Store'||e.name==='local.properties') continue; const p=path.join(dir,e.name); if(e.isDirectory()) walk(p); else inventory.push(path.relative(root,p)); }}
walk(root);
const squash=s=>s.replace(/\s+/g,' ').trim();
const files=[];
for(const name of inventory.filter(x=>/\.(ts|mjs|java|py|css)$/.test(x))) {
 const source=fs.readFileSync(name,'utf8'); const sf=ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true,name.endsWith('.mjs')?ts.ScriptKind.JS:ts.ScriptKind.TS);
 const line=n=>sf.getLineAndCharacterOfPosition(n).line+1;
 const symbols=[],constants=[],imports=[],tests=[],fields=[],sections=[];
 const span=n=>({line:line(n.getStart(sf)),end:line(n.end)});
 function effects(node) {
  const calls=[],writes=[],guards=[],returns=[];
  function scan(n) {
   if(ts.isCallExpression(n)||ts.isNewExpression(n)) { const x=squash(n.expression.getText(sf)); if(!calls.includes(x))calls.push(x); }
   if(ts.isBinaryExpression(n)&&n.operatorToken.kind>=ts.SyntaxKind.FirstAssignment&&n.operatorToken.kind<=ts.SyntaxKind.LastAssignment) { const x=squash(n.left.getText(sf)); if(!writes.includes(x))writes.push(x); }
   if(ts.isIfStatement(n)) guards.push({line:line(n.getStart(sf)),test:squash(n.expression.getText(sf))});
   if(ts.isReturnStatement(n)&&n.expression)returns.push({line:line(n.getStart(sf)),value:squash(n.expression.getText(sf))});
   ts.forEachChild(n,scan);
  } scan(node); return {calls,writes,guards,returns};
 }
 function visit(n,parent='') {
  if(ts.isImportDeclaration(n)) imports.push(squash(n.getText(sf)));
  if(ts.isCallExpression(n)&&/^(test|it|describe)(\.|$)/.test(n.expression.getText(sf))&&n.arguments[0]&&ts.isStringLiteralLike(n.arguments[0]))tests.push({title:n.arguments[0].text,...span(n)});
  if(ts.isClassDeclaration(n)||ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)||ts.isEnumDeclaration(n)) {
   const nm=n.name?.getText(sf)||'default'; symbols.push({kind:ts.SyntaxKind[n.kind],name:nm,...span(n),signature:squash(n.getText(sf).split('{')[0]),source:ts.isClassDeclaration(n)?undefined:n.getText(sf)});
   ts.forEachChild(n,c=>visit(c,nm));return;
  }
  if(ts.isFunctionDeclaration(n)||ts.isMethodDeclaration(n)||ts.isConstructorDeclaration(n)||ts.isGetAccessorDeclaration(n)||ts.isSetAccessorDeclaration(n)||((ts.isVariableDeclaration(n)||ts.isPropertyDeclaration(n))&&n.initializer&&(ts.isArrowFunction(n.initializer)||ts.isFunctionExpression(n.initializer)))) {
   const fn=(ts.isVariableDeclaration(n)||ts.isPropertyDeclaration(n))?n.initializer:n; const nm=n.name?.getText(sf)||(ts.isConstructorDeclaration(n)?'constructor':'default');
   const body=fn.body; const sig=body?squash(source.slice(n.getStart(sf),body.getStart(sf))):squash(n.getText(sf));
   const outline=body&&ts.isBlock(body)?body.statements.map(s=>({kind:ts.SyntaxKind[s.kind],...span(s),head:squash(s.getText(sf).split('\n').slice(0,2).join(' ')).slice(0,200)})):[];
   symbols.push({kind:ts.SyntaxKind[n.kind],name:parent?parent+'.'+nm:nm,...span(n),signature:sig,source:n.getText(sf),outline,...(body?effects(body):{})});
   // Nested named functions are indexed, callbacks remain owned by this block.
   if(body)ts.forEachChild(body,c=>visit(c,parent?parent+'.'+nm:nm));return;
  }
  if(ts.isPropertyDeclaration(n)) {
   fields.push({name:parent+'.'+n.name.getText(sf),declaration:n.getText(sf),...span(n)});
   if(n.initializer)constants.push({name:parent+'.'+n.name.getText(sf),value:n.initializer.getText(sf),...span(n),kind:'field'});
  }
  if(ts.isVariableStatement(n)&&n.parent===sf)for(const d of n.declarationList.declarations)if(d.initializer&&!ts.isArrowFunction(d.initializer)&&!ts.isFunctionExpression(d.initializer))constants.push({name:d.name.getText(sf),value:d.initializer.getText(sf),...span(d),kind:'module'});
  ts.forEachChild(n,c=>visit(c,parent));
 } visit(sf);
 for(const n of sf.statements) if(!ts.isImportDeclaration(n)&&!ts.isClassDeclaration(n)&&!ts.isInterfaceDeclaration(n)&&!ts.isTypeAliasDeclaration(n)&&!ts.isFunctionDeclaration(n)&&!ts.isVariableStatement(n))sections.push({...span(n),source:n.getText(sf),...effects(n)});
 files.push({path:name,lines:source.split('\n').length,hash:crypto.createHash('sha256').update(source).digest('hex'),imports,symbols,constants,fields,sections,tests,source});
}
const snapshot=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',dateStyle:'long',timeStyle:'long',hour12:false}).format(new Date());
fs.writeFileSync('docs/handbook/code-index.json',JSON.stringify({date:'2026-10-16',snapshot,root,inventory,files},null,2));
console.log(JSON.stringify({inventory:inventory.length,codeFiles:files.length,srcFiles:files.filter(f=>f.path.startsWith('src/')).length,symbols:files.reduce((a,f)=>a+f.symbols.length,0),lines:files.reduce((a,f)=>a+f.lines,0)},null,2));
