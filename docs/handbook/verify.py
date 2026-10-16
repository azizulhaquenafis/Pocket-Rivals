"""Validate coverage, captured-source fingerprints and PDF text/layout bounds."""
from pathlib import Path
import hashlib,json
from pypdf import PdfReader
import pdfplumber
root=Path(__file__).resolve().parents[2]
out=root/'output/pdf';tmp=root/'tmp/pdfs/handbook'
idx=json.loads((root/'docs/handbook/code-index.json').read_text())
cov=json.loads((out/'coverage.json').read_text())
r=PdfReader(out/'Pocket_Rivals_Complete_Handbook.pdf')
assert not cov['missingCodeFiles']
changed=[f['path'] for f in idx['files'] if '/assets/public/' not in f['path'] and hashlib.sha256((root/f['path']).read_bytes()).hexdigest()!=f['hash']]
issues=[];sparse=[];blank=[]
with pdfplumber.open(out/'Pocket_Rivals_Complete_Handbook.pdf') as pdf:
 for i,p in enumerate(pdf.pages):
  chars=p.chars
  for c in chars:
   if c['text'].strip() and (c['x0']<42 or c['x1']>554 or c['top']<18 or c['bottom']>831):
    issues.append({'page':i+1,'char':c['text'],'x0':c['x0'],'x1':c['x1'],'top':c['top'],'bottom':c['bottom']})
  body=[c for c in chars if c['text'].strip() and c['top']>=45 and c['bottom']<=796]
  if not body:blank.append(i+1)
  if len(chars)<400:sparse.append(i+1)
  p.close()
texts=[p.extract_text() or '' for p in r.pages]
report={'pages':len(r.pages),'missingCodeFiles':cov['missingCodeFiles'],'codeChangedSinceSnapshot':changed,'outOfBoundsCharacters':issues,'sparsePages':sparse,'emptyPages':blank,'replacementCharacters':sum(t.count('\ufffd') for t in texts),'pdfSha256':hashlib.sha256((out/'Pocket_Rivals_Complete_Handbook.pdf').read_bytes()).hexdigest()}
(out/'verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
assert not issues and not report['emptyPages'] and not report['replacementCharacters']
