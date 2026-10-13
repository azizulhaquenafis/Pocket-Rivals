"""Generate 100 compact questions and independently evaluate each stated operation with SymPy.
Run in a development venv containing SymPy. No Python runtime ships with the game.
"""
from pathlib import Path
import json, hashlib
import sympy as s
x=s.symbols('x',real=True); n=s.symbols('n',integer=True,positive=True)
rows=[]; evidence=[]
def add(family,k,topic,question,expected,computed,explanation,seconds=12,difficulty='medium',options=None):
    expected=s.sympify(expected); computed=s.simplify(computed)
    assert s.simplify(expected-computed)==0,(family,k,expected,computed)
    opts=options or [expected,expected+1,expected-1]
    opts=[s.sympify(v) for v in opts]
    assert all(s.simplify(opts[i]-opts[j])!=0 for i in range(3) for j in range(i))
    correct=len(rows)%3;opts[0],opts[correct]=opts[correct],opts[0]
    uid=f'{family}-{k}'
    rows.append(dict(id=uid,topic=topic,difficulty=difficulty,questionLatex=question,optionsLatex=[s.latex(v) for v in opts],correctIndex=correct,explanationLatex=explanation,estimatedSeconds=seconds))
    evidence.append(dict(id=uid,computed=str(computed),expected=str(expected),distinctOptions=True,verified=True))
for k in range(2,6):
    add('log-chain',k,'Derivatives',rf'\left.\frac{{d}}{{dx}}\ln(1+{k}x)\right|_{{x=0}}',k,s.diff(s.log(1+k*x),x).subs(x,0),rf'\frac{{{k}}}{{1+{k}x}}\bigg|_{{0}}={k}')
    add('power-at-one',k,'Derivatives',rf'\left.\frac{{d}}{{dx}}x^{{{k}}}\right|_{{x=1}}',k,s.diff(x**k,x).subs(x,1),rf'{k}x^{{{k-1}}}\big|_1={k}',8,'easy')
    add('exp-curvature',k,'Derivatives',rf'\left.\frac{{d^2}}{{dx^2}}e^{{{k}x}}\right|_{{x=0}}',k*k,s.diff(s.exp(k*x),x,2).subs(x,0),rf'{k}^2e^{{{k}x}}\big|_0={k*k}')
    add('sine-chain',k,'Derivatives',rf'\left.\frac{{d}}{{dx}}\sin({k}x)\right|_{{x=0}}',k,s.diff(s.sin(k*x),x).subs(x,0),rf'{k}\cos(0)={k}',8,'easy')
    add('product-log',k,'Derivatives',rf'\left.\frac{{d}}{{dx}}(x^{{{k}}}\ln x)\right|_{{x=1}}',1,s.diff(x**k*s.log(x),x).subs(x,1),r'\ln1=0,\quad x^{k-1}|_1=1',16)
    add('cosine-limit',k,'Limits',rf'\lim_{{x\to0}}\frac{{1-\cos({k}x)}}{{x^2}}',s.Rational(k*k,2),s.limit((1-s.cos(k*x))/x**2,x,0),rf'1-\cos({k}x)\sim\frac{{{k*k}x^2}}{{2}}',20,'hard')
    add('exp-sine-limit',k,'Limits',rf'\lim_{{x\to0}}\frac{{e^{{{k}x}}-1}}{{\sin x}}',k,s.limit((s.exp(k*x)-1)/s.sin(x),x,0),rf'e^{{{k}x}}-1\sim{k}x,\quad\sin x\sim x',15)
    add('root-limit',k,'Limits',rf'\lim_{{x\to0}}\frac{{\sqrt{{1+{k}x}}-1}}{{x}}',s.Rational(k,2),s.limit((s.sqrt(1+k*x)-1)/x,x,0),rf'\frac{{{k}}}{{\sqrt{{1+{k}x}}+1}}\to\frac{{{k}}}{{2}}',16)
    add('exponential-limit',k,'Limits',rf'\lim_{{x\to0}}(1+{k}x)^{{1/x}}',s.exp(k),s.exp(s.limit(s.log(1+k*x)/x,x,0)),rf'\ln L=\lim_{{x\to0}}\frac{{\ln(1+{k}x)}}{{x}}={k}',20,'hard',options=[s.exp(k),s.exp(k-1),s.exp(k+1)])
    add('odd-integral',k,'Integrals',rf'\int_{{-{k}}}^{{{k}}}\frac{{x^3}}{{1+x^2}}\,dx',0,s.integrate(x**3/(1+x*x),(x,-k,k)),r'\text{Odd function on a symmetric interval: }0',10,'easy')
    add('sine-square',k,'Integrals',rf'\int_0^\pi\sin^2({k}x)\,dx',s.pi/2,s.integrate(s.sin(k*x)**2,(x,0,s.pi)),r'\sin^2 u=\frac{1-\cos2u}{2}',18,options=[s.pi/2,s.pi,2*s.pi])
    add('power-integral',k,'Integrals',rf'\int_0^1{k}x^{{{k-1}}}\,dx',1,s.integrate(k*x**(k-1),(x,0,1)),rf'[x^{{{k}}}]_0^1=1',8,'easy')
    add('exp-integral',k,'Integrals',rf'\int_0^{{\ln {k}}}e^x\,dx',k-1,s.integrate(s.exp(x),(x,0,s.log(k))),rf'e^{{\ln {k}}}-e^0={k}-1',12)
    # These algebra questions specify real domains and have domain-independent answers.
    add('reciprocal-square',k,'Algebra',rf'\begin{{gathered}}x\in\mathbb R\setminus\{{0\}},\ x+\frac1x={k}\\x^2+\frac1{{x^2}}=?\end{{gathered}}',k*k-2,s.simplify(s.solve(x*x-k*x+1,x)[0]**2+1/s.solve(x*x-k*x+1,x)[0]**2),rf'(x+1/x)^2-2={k*k-2}',18)
    roots=s.solve(x*x-k*x+1,x)
    add('vieta-square',k,'Algebra',rf'\begin{{gathered}}\alpha,\beta:\ x^2-{k}x+1=0\\\alpha^2+\beta^2=?\end{{gathered}}',k*k-2,sum(r*r*m for r,m in s.roots(x*x-k*x+1).items()),rf'(\alpha+\beta)^2-2\alpha\beta={k}^2-2',18)
    add('geometric-series',k,'Algebra',rf'\sum_{{n=1}}^\infty\left(\frac1{{{k}}}\right)^n',s.Rational(1,k-1),s.summation(s.Rational(1,k)**n,(n,1,s.oo)),rf'\frac{{1/{k}}}{{1-1/{k}}}=\frac1{{{k-1}}}',15)
    add('log-power',k,'Algebra',rf'\log_{{{k}}}\left({k}^{{{k+1}}}\right)',k+1,s.log(k**(k+1))/s.log(k),rf'\log_a(a^m)=m={k+1}',8,'easy')
    mat=s.Matrix([[k,1],[k+1,1]])
    add('det-difference',k,'Matrices',rf'\det\begin{{pmatrix}}{k}&1\\{k+1}&1\end{{pmatrix}}',-1,mat.det(),rf'{k}-({k+1})=-1',10,'easy')
    add('det-scalar',k,'Matrices',rf'\begin{{gathered}}A\in\mathbb R^{{2\times2}},\ \det A={k}\\\det(2A)=?\end{{gathered}}',4*k,(2*s.Matrix([[k,0],[0,1]])).det(),rf'\det(2A)=2^2\det A={4*k}',20,'hard')
    add('det-triangle',k,'Matrices',rf'\det\begin{{pmatrix}}{k}&2\\0&{k+1}\end{{pmatrix}}',k*(k+1),s.Matrix([[k,2],[0,k+1]]).det(),rf'{k}\cdot{k+1}-0={k*(k+1)}',10,'easy')
    add('i-cycle',k,'Complex numbers',rf'i^2=-1.\quad i^{{{4*k+2}}}=?',-1,s.I**(4*k+2),r'i^{4m+2}=i^2=-1',10,'easy')
    add('modulus-square',k,'Complex numbers',rf'i^2=-1.\quad|{k}+{k}i|^2=?',2*k*k,s.Abs(k+k*s.I)**2,rf'{k}^2+{k}^2={2*k*k}',12)
    j=k-1
    add('complex-real',k,'Complex numbers',rf'i^2=-1.\quad\operatorname{{Re}}(1+i)^{{{2*j}}}=?',s.re((2*s.I)**j),s.re(s.expand((1+s.I)**(2*j))),rf'(1+i)^2=2i,\quad\operatorname{{Re}}(2i)^{{{j}}}={s.latex(s.re((2*s.I)**j))}',22,'hard')
    add('coin-one-head',k,'Probability',rf'\begin{{gathered}}\text{{{k} fair independent coin flips}}\\P(\text{{exactly 1 head}})=?\end{{gathered}}',s.Rational(k,2**k),s.binomial(k,1)*s.Rational(1,2)**k,rf'\binom{{{k}}}1/2^{{{k}}}={s.latex(s.Rational(k,2**k))}',15,options=[s.Rational(k,2**k),s.Rational(k+1,2**k),s.Rational(k-1,2**k)])
    q=k+2
    add('choose-pair',k,'Probability',rf'\binom{{{q}}}2',q*(q-1)//2,s.binomial(q,2),rf'\frac{{{q}\cdot{q-1}}}2={q*(q-1)//2}',10,'easy')
assert len(rows)==100 and len({r['id'] for r in rows})==100 and len({r['questionLatex'] for r in rows})==100
root=Path(__file__).resolve().parents[1]
out=root/'src/games/math-quiz/questions/university.json'
out.write_text(json.dumps(rows,indent=2)+'\n')
report=dict(count=len(rows),engine='SymPy '+s.__version__,method='Symbolic derivatives, limits, integrals, matrix determinants, exact identities and combinatorial formulas; all distractors checked pairwise.',independentHumanReview=False,mentalTime='Editorial estimates; not measured with students.',sha256=hashlib.sha256(out.read_bytes()).hexdigest(),results=evidence)
(root/'docs/math-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print('Verified 100 answer keys, 300 pairwise option distinctions, and 100 unique IDs/statements.')
