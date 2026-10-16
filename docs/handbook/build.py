from pathlib import Path
import json,re,html,hashlib,ast,textwrap,math,datetime,collections
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate,PageTemplate,Frame,Paragraph,Spacer,PageBreak,LongTable,Table,TableStyle,KeepTogether,Flowable
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing,Rect,String,Line,PolyLine,Circle

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/pdf'; TMP=ROOT/'tmp/pdfs/handbook'; HERE=ROOT/'docs/handbook'
OUT.mkdir(parents=True,exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
index=json.loads((HERE/'code-index.json').read_text())
files=[f for f in index['files'] if '/assets/public/' not in f['path']]
sourcefiles=[f for f in files if f['path'].startswith('src/')]
SNAPSHOT=index.get('snapshot','2026-10-16; see coverage.json for extraction fingerprints')
fontdir=Path('/System/Library/Fonts/Supplemental')
for nm,filename in [('Body','Arial Unicode.ttf'),('BodyBold','Arial Bold.ttf'),('Mono','Courier New.ttf')]:
    pdfmetrics.registerFont(TTFont(nm,str(fontdir/filename)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='Body',boldItalic='BodyBold')
INK=colors.HexColor('#242b32');BLUE=colors.HexColor('#27799c');ORANGE=colors.HexColor('#dc7c39');PAPER=colors.HexColor('#f8f5eb');GRAY=colors.HexColor('#627177')
styles={
 'body':ParagraphStyle('body',fontName='Body',fontSize=9.6,leading=14,spaceAfter=7,textColor=INK,splitLongWords=True),
 'small':ParagraphStyle('small',fontName='Body',fontSize=8.1,leading=11.2,spaceAfter=4,textColor=INK,splitLongWords=True),
 'tiny':ParagraphStyle('tiny',fontName='Body',fontSize=7.3,leading=10,spaceAfter=3,textColor=INK,splitLongWords=True),
 'h1':ParagraphStyle('h1',fontName='BodyBold',fontSize=22,leading=27,spaceAfter=16,textColor=BLUE,keepWithNext=True),
 'h2':ParagraphStyle('h2',fontName='BodyBold',fontSize=14.5,leading=19,spaceBefore=12,spaceAfter=9,textColor=INK,keepWithNext=True),
 'h3':ParagraphStyle('h3',fontName='BodyBold',fontSize=11,leading=15,spaceBefore=10,spaceAfter=6,textColor=BLUE,keepWithNext=True),
 'code':ParagraphStyle('code',fontName='Mono',fontSize=7.3,leading=10,spaceAfter=4,textColor=INK,splitLongWords=True),
 'block':ParagraphStyle('block',fontName='BodyBold',fontSize=9.3,leading=12.5,spaceBefore=8,spaceAfter=4,textColor=BLUE,keepWithNext=True),
}
# Keep unsupported emoji/codepoints visible as explicit U+ notation rather than tofu.
cm=pdfmetrics.getFont('Body').face.charToGlyph
repl={'\u2014':' - ','\u2013':'-','\u2011':'-','\u00a0':' ','\u2192':' -> ','\u2190':' <- ','\u2265':'>=','\u2264':'<=','\u00d7':'x','\u2212':'-','\u2019':"'",'\u2018':"'",'\u201c':'"','\u201d':'"'}
def safe(s):
 s=str(s)
 for a,b in repl.items():s=s.replace(a,b)
 return ''.join(c if ord(c) in cm or c in '\n\t' else '[U+%04X]'%ord(c) for c in s)
def esc(s):return html.escape(safe(s),quote=False)
def inline(s):
 s=esc(s)
 return re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',s)
def para(s,sty='body'):return Paragraph(inline(s),styles[sty])
def clip(s,n=350):
 s=re.sub(r'\s+',' ',str(s)).strip()
 return s if len(s)<=n else s[:n]+' ... [continued in source reference]'
def code(s):return Paragraph(esc(s).replace('\n','<br/>').replace('  ','&nbsp; '),styles['code'])

class Handbook(BaseDocTemplate):
 def __init__(self,*args,**kw):
  super().__init__(*args,**kw);self.bookmarks={};self.chapter='Pocket Rivals';self.toc_counter=0
 def beforeDocument(self):
  self._outline_last=-1
 def afterFlowable(self,f):
  if hasattr(f,'heading_level'):
   title=f.getPlainText();key=f.anchor
   self.canv.bookmarkPage(key);self.bookmarks[key]=self.page
   outline=min(f.outline_level,self._outline_last+1)
   self.canv.addOutlineEntry(title,key,level=outline,closed=True);self._outline_last=outline
   if f.heading_level<=1 and title!='Contents':self.notify('TOCEntry',(f.heading_level,title,self.page,key))
   if f.heading_level==0:self.chapter=title

def page(c,doc):
 w,h=doc.pagesize
 c.saveState()
 if doc.page>1:
  c.setStrokeColor(colors.HexColor('#d7e2e3'));c.line(44,h-35,w-44,h-35)
  c.setFont('Body',7.4);c.setFillColor(GRAY);c.drawString(44,h-26,'POCKET RIVALS / SOURCE HANDBOOK')
  c.drawRightString(w-44,h-26,'16 OCTOBER 2026')
  c.line(44,35,w-44,35);c.drawString(44,23,'Source paths are relative to pocket-rivals. Search named symbols after edits.')
  c.drawRightString(w-44,23,str(doc.page))
 c.restoreState()

story=[];markdown=[];anchors={};headingno=0

def heading(title,level=0,breakpage=False,outline=None):
 global headingno
 if breakpage and story:
  while story and isinstance(story[-1],Spacer):story.pop()
  story.append(PageBreak())
 headingno+=1;key='h'+str(headingno)
 p=para(title,'h1' if level==0 else 'h2' if level==1 else 'h3')
 p.heading_level=level;p.anchor=key;p.outline_level=outline if outline is not None else min(level,2)
 story.append(p);markdown.append('#'*(min(level+1,4))+' '+title+'\n')
 return key

def add(s,sty='body'):
 story.append(para(s,sty));markdown.append(s+'\n')

def table(rows,widths=None):
 if not rows:return
 data=[[para(c,'small') for c in row] for row in rows]
 t=LongTable(data,colWidths=widths or [507/len(rows[0])]*len(rows[0]),repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),('TEXTCOLOR',(0,0),(-1,0),colors.white),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LINEBELOW',(0,0),(-1,0),0.6,BLUE),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#f0f6f7'),colors.white]),('LINEBELOW',(0,1),(-1,-1),0.2,colors.HexColor('#d7e2e3'))]))
 for p in data[0]:p.style=ParagraphStyle('th',parent=styles['small'],fontName='BodyBold',textColor=colors.white)
 story.extend([t,Spacer(1,9)])
 for i,row in enumerate(rows):
  markdown.append('| '+' | '.join(str(c).replace('|',' / ').replace('\n',' ') for c in row)+' |\n')
  if i==0:markdown.append('| '+' | '.join('---' for c in row)+' |\n')

# Designed cover.
story.extend([Spacer(1,78),para('POCKET RIVALS','h1'),Spacer(1,18),Paragraph('Understand every folder.<br/>Find the code to change.',ParagraphStyle('cover',fontName='BodyBold',fontSize=32,leading=40,textColor=INK)),Spacer(1,26),para('Complete project and modification handbook','h2'),para('Architecture / every game / trajectories / AI / variables / file and function atlas','body'),Spacer(1,30)])
table([['CURRENT COLLECTION','PRESERVED SOURCE','REFERENCE DEPTH'],['15 rivalry entries + 3 Arcade entries','4 future modules + legacy golf duel','Every maintained source file, named block, test and resource']], [169]*3)
story.extend([Spacer(1,50),para('Prepared for the project owner and friends','body'),para('16 October 2026 | Source-grounded local edition','small'),para('Includes searchable bookmarks, code locations, change guides and an editable companion source reference.','small'),PageBreak()])
heading('Contents',0)
toc=TableOfContents();toc.levelStyles=[ParagraphStyle('toc0',fontName='BodyBold',fontSize=9.2,leading=13,spaceBefore=6,textColor=BLUE),ParagraphStyle('toc1',fontName='Body',fontSize=8.3,leading=11.5,leftIndent=14,textColor=INK)]
story.extend([toc,PageBreak()])

# Parse deliberately simple editable Markdown.
lines=(HERE/'guide.md').read_text().splitlines();i=0;first=True
while i<len(lines):
 line=lines[i]
 if line.startswith('|'):
  rows=[]
  while i<len(lines) and lines[i].startswith('|'):
   parts=[p.strip() for p in lines[i].strip('|').split('|')]
   if not all(re.fullmatch(r'[:\- ]+',p) for p in parts):rows.append(parts)
   i+=1
  if rows and len(set(map(len,rows)))==1:table(rows)
  continue
 if line.startswith('# '):
  title=line[2:]
  if title=='Pocket Rivals':i+=1;continue
  heading(title,0,breakpage=not first);first=False
 elif line.startswith('## '):
  title=line[3:]
  if title!='Complete project and modification handbook':heading(title,1)
 elif line.startswith('### '):heading(line[4:],2)
 elif line.strip():
  if re.match(r'^\d+\. ',line):add(line)
  else:
   chunk=[line];i+=1
   while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||\d+\. )',lines[i]):chunk.append(lines[i]);i+=1
   add(' '.join(chunk));continue
 i+=1

# Readable static architecture and trajectory figures (native vector).
heading('12. Visual maps of execution and motion',0,True)
add('These are explanatory diagrams tied to the named source owners. Curves use the listed constants in free space; collisions and changing input alter the real path.')
d=Drawing(507,265)
boxes=[(0,190,'Menu / setup','metadata + options'),(175,190,'GameManager','run / navigation'),(350,190,'GameHost','context + foreground dt'),(350,70,'Selected module','input -> rules / physics'),(175,70,'View / renderer','draw authoritative state'),(0,70,'Result / persistence','duel or Arcade route')]
for x,y,a,b in boxes:
 d.add(Rect(x+2,y,153,58,rx=8,fillColor=PAPER,strokeColor=BLUE,strokeWidth=1))
 d.add(String(x+10,y+36,a,fontName='BodyBold',fontSize=10,fillColor=INK));d.add(String(x+10,y+17,b,fontName='Body',fontSize=8,fillColor=GRAY))
for x1,y1,x2,y2 in [(156,219,174,219),(331,219,349,219),(428,189,428,130),(349,99,331,99),(174,99,156,99)]:
 d.add(Line(x1,y1,x2,y2,strokeColor=ORANGE,strokeWidth=2))
d.add(String(8,20,'One Phaser instance and render loop. Workers return decisions; they do not run the UI.',fontName='Body',fontSize=9,fillColor=INK));story.append(d)
heading('Free-flight examples and what to change',1)
d=Drawing(507,210)
for x,ttl,v,g,maxt in [(0,'Bird flap: v=-195, g=650',-195,650,.65),(265,'Hammer: score 100, g=2200',-math.sqrt(2*2200*365),2200,1.16)]:
 w=220;h=130;xx=x+10;yy=42
 d.add(String(xx,190,ttl,fontName='BodyBold',fontSize=10,fillColor=INK))
 d.add(Line(xx,yy,xx+w,yy,strokeColor=GRAY));d.add(Line(xx,yy,xx,yy+h,strokeColor=GRAY))
 vals=[-(v*(maxt*i/100)+.5*g*(maxt*i/100)**2) for i in range(101)];maxh=max(vals)*1.05
 pts=[]
 for i,z in enumerate(vals):pts.extend([xx+w*i/100,yy+h*z/maxh])
 d.add(PolyLine(pts,strokeColor=ORANGE,strokeWidth=2));d.add(String(xx,18,'Time (seconds) ->     Vertical rise above launch',fontName='Body',fontSize=7.5,fillColor=GRAY))
story.append(d)
add('Birds: ArenaPhysics.GRAVITY/FLAP change legal motion and AI forecasts. Hammer: StrikePhysics changes feedback height after Rules has already assigned a timing score. The analytic curves above omit engine contacts and integration error.','small')
heading('Coordinate conversion for a golf drag',1)
table([['Stage','Source owner','Meaning'],['Screen point','InputManager / UltimateGolfGame','An owned touch or mouse gesture in the responsive canvas'],['World point','GolfView.unproject','Undo camera center, uniform scale and portrait rotation'],['Shot velocity','shotVector','(start-end)*3.125, magnitude limited to 650'],['Legal simulation','GolfPhysics.shoot / tick','Validate stopped state, consume one stroke, simulate at 240Hz'],['Display point','GolfView.project / GolfRenderer','Apply the matching transform to physics state']], [100,165,242])

# Responsibilities indexed by specific source file name, with contextual fallback.
PURPOSE={
'GameManager.ts':'Coordinates the one Phaser instance, screen navigation, run guards, native lifecycle, pause, quick-match saves and duel/Arcade result routes.',
'GameHost.ts':'Creates the selected module context/HUD, owns its InputManager, derives foreground dt and disposes the module on scene shutdown.',
'GameRegistry.ts':'Eagerly discovers lightweight game metadata, validates stable IDs, sorts cards and filters tournament eligibility.',
'GameLoader.ts':'Resolves a registered module path and lazily loads its factory or optional tutorial.',
'InputManager.ts':'Owns scene-local pointer/key subscriptions, per-player pointer identity, cancellation, pause and cleanup.',
'StorageManager.ts':'Validates shared settings/results and reads/writes JSON records with in-memory fallback.',
'ScoreManager.ts':'Records one overall duel result per begun round.',
'ArcadeScoreManager.ts':'Validates and stores separate per-game solo high scores.',
'TournamentManager.ts':'Owns serialized tournament phases, shuffled schedules, attempt tokens, checkpoints and exactly-once points.',
'ThemeManager.ts':'Defines the shared palette, logical canvas dimensions and default FIELD geometry.',
'AudioManager.ts':'Synthesizes bounded short Web Audio effects, respecting persisted mute/volume and lifecycle.',
'OfflineManager.ts':'Requests explicit CACHE_ALL work from the current service worker through a MessageChannel and handles timeout/failure.',
'Diagnostics.ts':'Collects development-only FPS/frame timing, loaded-module, scene/texture and AI computation metrics.',
'MainMenu.ts':'Renders metadata-driven collection sections and binds menu navigation.',
'GameSetup.ts':'Renders mode/difficulty/variant selection and starts tutorials or the chosen game.',
'Results.ts':'Formats explicit duel winner and score data into result markup.',
'Settings.ts':'Presents sound/volume/offline download controls and confirmed score reset.',
'TournamentScene.ts':'Presents tournament pool/setup, progress, champion and rematch UI.',
'MatchRandom.ts':'Provides isolated seeded identity, bounded decision jitter, deterministic rankings and replay support.',
'Modal.ts':'Owns overlay content, action binding, back handling, focus trapping and focus restoration.',
'TurnView.ts':'Rotates hot-seat module-owned content, blocks transition input and maps pointer coordinates back.',
'drawing.ts':'Creates reusable outlined shapes, labels and game symbols.',
'icons.ts':'Defines small inline SVG UI icons through a common SVG wrapper.',
'GameModule.ts':'Defines metadata, options, module lifecycle, host context, factory and tutorial contracts.',
'GameResult.ts':'Defines Player, Winner and explicit two-score duel result types.',
'AIController.ts':'Defines the three AI difficulty IDs and generic observation-to-action controller contract.',
'MiniGame.ts':'Compatibility re-export of the current shared module interfaces.',
'FixedStep.ts':'Advances a bounded 120Hz simulation and exposes remainder/fraction for presentation.',
'MotionController.ts':'Converts target positions into continuous speed/acceleration-limited damped motion.',
'FirstResponse.ts':'Arbitrates the first queued response per player with model-time tie tolerance.',
'MatchClock.ts':'Owns Pong/Hockey regulation, point target, sudden death, expiry winner and clock text.',
'WorkerTask.ts':'Runs one bounded worker request and terminates CPU work on cancellation/watchdog.',
'Impacts.ts':'Retains a fixed pool of short impact pulses for bounded feedback.',
'PongPhysics.ts':'Integrates ball/paddle movement, swept paddle hits, angle/spin response, walls and goals.',
'PongAI.ts':'Predicts reflected ball intercepts and legal offensive/defensive paddle targets.',
'PongState.ts':'Serializes and validates a Pong rally, score, clock and AI identity checkpoint.',
'AirHockeyPhysics.ts':'Simulates puck/mallet contacts, substeps, posts, pinches, speed cap and unreachable-state repairs.',
'AirHockeyAI.ts':'Selects legal interception and behind-puck attack targets through the shared motion controller.',
'HockeyState.ts':'Serializes and validates puck/mallet geometry, scores, match/possession clocks and AI seed.',
'PossessionClock.ts':'Counts continuous half-table possession with center hysteresis and a 15-second violation.',
'rink.ts':'Defines rounded rail/goal geometry, projection normals and puck reachability.',
'ConnectFourRules.ts':'Owns a 7x6 gravity board, 69 winning windows, legal drops, undo and history restore.',
'ConnectFourAI.ts':'Evaluates board windows and searches a private mutable/undo board under bounded alpha-beta budgets.',
'ClassicRules.ts':'Owns Classic Tic-Tac-Toe legal moves, winning lines, draws and history validation.',
'ClassicAI.ts':'Performs Classic minimax/alpha-beta and difficulty/personality-aware legal move selection.',
'UltimateRules.ts':'Owns 81-cell Ultimate routing, local/macro results, legal moves, cloning and replayed saves.',
'UltimateAI.ts':'Wraps a cancellable Ultimate search worker with seed and difficulty inputs.',
'UltimateSearch.ts':'Evaluates local/macro threats and runs bounded iterative deepening, move ordering and transposition search.',
'UltimateTutorial.ts':'Builds and advances the module-owned interactive Ultimate rules tutorial.',
'lines.ts':'Defines the eight winning triples shared only within the Tic-Tac-Toe module.',
'SwordMotion.ts':'Defines shared sword impact/recovery times and mirrored eased rest/windup/strike/return poses.',
'StrikePhysics.ts':'Simulates presentation-only hammer puck flight and damped bell-ring motion; does not award scores.',
'RunnerPhysics.ts':'Integrates cross-track gravity/momentum, wall gaps, swept platform landings and shared trap contact.',
'ObstacleGeometry.ts':'Defines timed trap bounds, convex outlines and SAT contact for the canonical runner footprint.',
'CourseStream.ts':'Generates and retires bounded seeded weighted endless-course motifs using map-specific trap families.',
'GravityView.ts':'Captures/interpolates runner presentation without changing legal physics.',
'BirdView.ts':'Interpolates bird positions/facing/wing motion, bounded trails and recovery tint.',
'Recovery.ts':'Owns the three-second individual bird recovery, curved return, tint and legal relaunch.',
'Stars.ts':'Defines star target/radius, bounded fair placement and swept bird-to-star pickup distance.',
'SpikeView.ts':'Interpolates player positions, facing and piston extension for drawing only.',
'SpikeControls.ts':'Maps keyboard/gamepad direction, dead zones, stable slots and neutral-after-pause behavior.',
'MapPreview.ts':'Creates a lightweight static SVG map preview for eager metadata.',
'WaterGuessRules.ts':'Owns integer percentage targets, one guess each, absolute-error scoring, idempotent resolution and sudden death.',
'WaterGuessAI.ts':'Estimates a one-logical-pixel tube level with difficulty-dependent bounded perceptual error.',
'WaterRenderer.ts':'Draws the tube/liquid and reveal presentation using shared tube geometry.',
'Geometry.ts':'Defines the common 310-unit visible tube height used by renderer and AI.',
'PerfectTimerRules.ts':'Owns centisecond targets/stops, error comparison, idempotent scoring and five-round/sudden-death progression.',
'PerfectTimerAI.ts':'Schedules an ordinary stop deadline in foreground elapsed milliseconds with calibrated clock error.',
'TimerClock.ts':'Banks/resumes a monotonic foreground timer so pause time is excluded.',
'TimerRenderer.ts':'Draws the stopwatch body/face/needle and timing feedback.',
'Question.ts':'Defines the math question schema, exact fraction helpers and correct-index-preserving answer shuffle.',
'Bank.ts':'Combines/deduplicates static and procedural questions and creates bounded topic-interleaved decks favoring unseen IDs.',
'Basic.ts':'Generates arithmetic categories using exact integer/rational answers and misconception distractors.',
'ProceduralUniversity.ts':'Generates university-level question families with unique IDs, answers, distractors and estimated timing.',
'History.ts':'Persists a bounded insertion-ordered recent-question Set with FIFO eviction and storage fallback.',
'MathUI.ts':'Owns the KaTeX DOM overlay, player-local topics/options, Blue rotation and dual-axis resize/font fitting.',
'SnakeRules.ts':'Owns grid movement, queued legal direction changes, tail-vacancy collision, food and speed progression.',
'ShooterWorld.ts':'Owns Star Patrol movement, swept projectile contacts, wave lifecycle, enemies, pickups, upgrades, damage and bounded pools.',
'Waves.ts':'Defines wave formation/enemy roles, hit points, movement-speed curve and telegraphed attack interval.',
'Powerups.ts':'Defines pickup kinds/names/colors/durations, deterministic wave rewards and restricted extra-life eligibility.',
'CarInput.ts':'Owns separate per-pointer car-button holds and explicit pause/disposal subscriptions.',
'GolfCollision.ts':'Defines active golf radius/speed cap, overlap tests and separating relative-velocity contact responses.',
'GolfDynamics.ts':'Advances difficulty-scaled movers, lasers, tides, piston, doors/planks, UFO and safe recovery geometry.',
'GolfInput.ts':'Maps pullback to shot velocity and defines the exact uniform responsive project/unproject camera transform.',
'GolfProgress.ts':'Validates and stores four casual course bests separately from competition.',
'GolfRenderer.ts':'Draws active course data, dynamics, ball/halo, rival and aim preview with retained masked Graphics.',
'GolfRules.ts':'Defines challenge speed/stroke/preview/scoring records and the authoritative limit/score formula.',
'UltimateGolfGame.ts':'Owns active golf mode selection, course/help screens, gestures, responsive camera/UI, updates, results and cleanup.',
'ShotPlanner.ts':'Simulates bounded shot/wait candidates against a real copied 240Hz world, refines comparable landings and returns a legal plan.',
'routes.ts':'Provides course navigation waypoints and seeded comparable route selection, not scripted shot velocities.',
'CourseArt.ts':'Renders a static course overview SVG from the actual course data without loading physics/AI.',
'ModeArt.ts':'Creates small original SVG illustrations for golf mode choices.',
'GolfUI.ts':'Owns responsive DOM controls, screen/HUD/help/rival/power states and available course bounds.',
'AIChallengeMode.ts':'Advances independent human/AI worlds concurrently and determines completion/failure/race outcomes.',
'LocalVersusMode.ts':'Owns seeded hot-seat handoff, timed attempts, course/tour progression and aggregate outcome.',
'CasualMode.ts':'Starts ordinary course challenges and banks casual course records.',
'CompetitionRules.ts':'Defines timeout/tolerance, attempt totals, completion/time/stroke comparison and deterministic competition seeds.',
'CompetitiveStats.ts':'Validates and persists separate golf competition win/draw counters.',
'GolfMatch.ts':'Retained legacy duel: alternating stopped shots, per-hole stroke cap, cumulative totals and stopped-state validation.',
'courses.ts':'Retained legacy five small golf course geometries; not the active Ultimate course set.',
}
MODULES={'pong':'Pong','air-hockey':'Air Hockey','tic-tac-toe':'Tic-Tac-Toe','connect-four':'Connect Four','dots-and-boxes':'Dots and Boxes','hammer-hit':'Hammer Hit','light-fingers':'Light Fingers','fruit-duel':'Fruit Duel','math-quiz':'Math Quiz','lumberjack':'Lumberjack','water-guess':'Water Guess','perfect-timer':'Perfect Timer','gravity-runner':'Gravity Runner','happy-birds':'Happy Birds','spike-attacks':'Spike Attacks','mini-golf':'Golf','snake':'Snake','space-shooter':'Star Patrol','flappy-jump':'Flappy Jump','car-duel':'Car Duel','archery-duel':'Archery Duel','chicken-jump':'Chicken Jump','tap-duel':'Tap Duel example'}
RULES={
'dots-and-boxes':'Builds size-dependent edges/boxes and owns legal edge capture, extra turns, score, history and hit geometry.',
'hammer-hit':'Owns sine-gauge timing, three integer strikes per player, legal cooldown and total-based winner.',
'light-fingers':'Owns visible-signal gating, false starts, first-response arbitration, cooldown and first-to-five.',
'fruit-duel':'Owns real-fruit/decoy reveal, captured-at-input judgment, shared recovery timing and first-to-ten.',
'math-quiz':'Arbitrates first answers, correct/wrong point assignment, question progression and first-to-ten.',
'lumberjack':'Owns shared seeded branches, safe chops, shrinking idle budget, round caps and cumulative totals.',
'gravity-runner':'Owns shared endless course lifecycle, age-dependent speed, legal flips, sole-survival points and first-to-five.',
'happy-birds':'Owns shared wall telegraphs, star-contact points, independent recovery and first-to-15 continuous race.',
'spike-attacks':'Owns seeded piston phases, legal targets, survival rounds and independent foreground deadline.',
'flappy-jump':'Owns running/jump/release basketball trajectories, swept hoop scoring and match termination.',
'car-duel':'Owns car spawn/round scoring, simultaneous-death/stall replays and match deadline.',
'archery-duel':'Owns seeded targets, three-tap crosshair locking, delayed exact-radius hit scoring and deadline.',
'chicken-jump':'Owns sliding blocks, legal launch, descending geometric landings, retries and stack race.',
}
def module_for(p):
 return next((MODULES[x] for x in Path(p).parts if x in MODULES),'application')
def purpose(p):
 name=Path(p).name;mod=module_for(p)
 if name=='main.ts':return 'Loads local fonts/CSS, creates GameManager, exposes development-only snapshots/HMR disposal and registers the production web service worker.'
 if name=='config.ts':return f'Eager lightweight metadata for {mod}: stable ID, card/help text, colors, preview, supported modes, order, variants and tournament eligibility. It must not import the game implementation.'
 if name=='index.ts':
  if '/courses/' in p:return 'Exports the ordered active course data and shared course geometry types.'
  if '/tic-tac-toe/' in p:return 'Lazily chooses the Classic or Ultimate factory and optional tutorial from the selected variant.'
  if p=='src/games/mini-golf/index.ts':return 'Active golf entry: lazily imports ultimate/UltimateGolfGame. Parent-root legacy golf files are not imported here.'
  if p.startswith('examples/'):return 'Complete small TapDuel class/factory demonstrating independent state, host inputs, scoring and disposal.'
  return f'Side-effect-free lazy factory for {mod}; implementation initializes only after host selection.'
 if name.endswith('.worker.ts'):return f'Worker message entry for {mod}. Restores/copies request state, runs the bounded local search and posts its result; cancellation is owned by WorkerTask/controller.'
 if name=='Rules.ts':return next((v for k,v in RULES.items() if k in Path(p).parts),'Owns local legal actions, progression and terminal results.')
 if name=='AI.ts':
  if 'dots-and-boxes' in p:return 'Orders captures/safe edges/chains and performs bounded extra-turn-aware alpha-beta/endgame search.'
  return f'Game-local {mod} observations, difficulty settings, seeded decision state and ordinary legal actions; it does not award scores directly.'
 if name=='GolfAI.ts':return 'Active worker-planning scheduler with seeded identity, delay/generation/cancel guards and ordinary world.shoot calls.' if '/ultimate/' in p else 'Retained legacy visibility-route and bounded candidate-shot simulation planner; not active in the current golf card.'
 if name=='GolfPhysics.ts':return 'Authoritative active 240Hz ball simulation: shot validation, surfaces/forces, hazards/recovery, collision, capture, terminal states, snapshots and previews.' if '/ultimate/' in p else 'Retained legacy travel-substepped golf simulation, friction, capture and copied-ball trajectory forecast.'
 if name=='Physics.ts' and '/car-duel/' in p:return 'Custom 120Hz car-body approximation: terrain normals, shared head/chassis shapes, acceleration/rotation caps, contacts and impulses.'
 if name=='Maps.ts':return 'Lightweight map definitions and preview data; canonical selected geometry is shared by rules, AI and rendering.'
 if '/courses/' in p and name in ['foundry.ts','shoreline.ts','horizon.ts','temple.ts']:return f'Active Ultimate Golf {name[:-3]} course data in original 1920x1080 units. Geometry, hazards, dynamics parameters, tee/cup and base stroke limit are defined here.'
 if name=='types.ts' and '/courses/' in p:return 'Typed course geometry/hazard/dynamics schemas plus p/r/outer coordinate constructors.'
 if name in PURPOSE:return PURPOSE[name]
 if name.endswith('Game.ts') or name in ['ClassicGame.ts','DotsGame.ts']:
  return f'{mod} lifecycle controller: creates scene-owned display/input, coordinates local rules/physics/AI, renders state, reports one terminal result and disposes resources.'
 if name.endswith('Art.ts'):return f'{mod} original procedural artwork and drawing helpers. Geometry here presents state; legal rules/collision stay in their authoritative model.'
 if name.endswith('.css'):return 'Presentation selectors and responsive layout rules; detailed selector/property blocks appear below.'
 if p=='scripts/verify-math-bank.py':return 'SymPy generator/verifier that intentionally overwrites the 100-question university.json bank and math-validation.json report. It is not a read-only checker.'
 if p=='scripts/offline-plugin.ts':return 'Vite build plugin emitting sw.js with content version, embedded shell/full file lists, shell installation, cache-all messaging and cache-first fetch.'
 if name=='bundle-report.mjs':return 'Reads build manifest/chunk graphs, verifies lazy registration and application-shell payload budgets, and writes docs/bundle-report.json.'
 if name=='check-module.mjs':return 'Copies the Tap Duel example into a disposable project copy and verifies folder-only discovery/build without changing the real collection.'
 if name.startswith('measure-'):return 'Browser/CDP performance sampling utility; requires a running server and records snapshot measurements in docs JSON reports.'
 if p.startswith('tests/'):return 'Test/fixture implementation. Test titles and source imports identify its behavioral contract; fixtures are not shipped gameplay.'
 if p.endswith('.java'):return 'Native Android wrapper or template test. Complete short native source is reproduced below.'
 if name.endswith('.config.ts'):return 'Build/test/native tool configuration. Complete top-level settings are reproduced below.'
 return 'Maintained implementation/configuration file. Use the source-grounded block map and complete companion listing for its exact control flow.'

METHOD={
'initialize':'Create owned state, graphics/DOM and input bindings from the host GameContext; this is the start of an active module instance.',
'update':'Advance foreground state for this component, coordinate delegated helpers and/or refresh presentation according to the source steps below.',
'step':'Advance the local simulation by dt, enforce contacts/transitions and update legal state.',
'tick':'Execute one authoritative discrete or fixed simulation step.',
'pause':'Freeze component activity and clear/cancel transient input or pending work as implemented below.',
'resume':'Re-enable the component with a fresh/clean timing or input state.',
'dispose':'Release owned resources, listeners, DOM/graphics or worker work.',
'snapshot':'Return diagnostic copies/observations for development and tests.',
'constructor':'Establish this component\'s fields and injected dependencies; active module resources normally begin in initialize.',
'draw':'Draw the current state and presentation effects; legal state is owned by rules/physics.',
'render':'Build or refresh visual/DOM output from current state.',
'save':'Create/persist the component checkpoint or record described by the returned expression.',
'restore':'Validate/replay saved state and fall back to a fresh legal instance when rejected.',
'reset':'Reset this component\'s transient state for a new round/attempt.',
'play':'Apply a requested legal move or start a selected application module, depending on the owner.',
'legal':'Enumerate/check legal actions under the current board and terminal state.',
'choose':'Choose a legal AI action from observations and difficulty/search policy.',
'search':'Explore a bounded game tree with the local turn/evaluation policy.',
'evaluate':'Score a board/candidate state for the surrounding AI search.',
'clone':'Create independent state for simulation/search without mutating the live instance.',
'present':'Mark the already-rendered question/object legally visible for input/AI.',
'presentSignal':'Make the gem claimable only after its signal has been drawn.',
'canTap':'Check the player\'s current action/cooldown eligibility.',
'advance':'Consume elapsed time using this helper\'s fixed-step/clock policy.',
'cancel':'Invalidate/cancel a gesture or asynchronous computation and clear pending state.',
'finish':'Resolve/report the owned terminal attempt/result using current guards.',
'position':'Calculate the current logical gauge position used for scoring.',
'speed':'Calculate the current legal movement speed from stage/age/score.',
'project':'Map source-world coordinates to the responsive screen with one uniform camera transform.',
'unproject':'Apply the exact inverse camera transform for legal world-space input.',
'shoot':'Validate and launch a normal shot through the authoritative physics API.',
'preview':'Simulate an isolated bounded ghost path; never mutate the live ball.',
'exportState':'Copy the ball/dynamics snapshot for isolated search simulations.',
'restoreSimulation':'Install a trusted simulation snapshot in a copied forecast world and reset catch-up/window state.',
'warningDuration':'Compute the visible warning interval from the current wave.',
'extensionSpeed':'Compute the bounded piston extension speed from the current wave.',
'advanceClock':'Advance the separate uncapped foreground match deadline and determine expiry result.',
}
OVERRIDE={
'PongWorld.step':'Move legally bounded paddles, integrate the ball, resolve swept paddle-plane/side contacts and detect goals.',
'PongWorld.goal':'Award one point, reset serve/cooldown and check the local point target while the controller retains its match clock.',
'HockeyWorld.step':'Interpolate mallets across three substeps, damp/move the puck, project contacts, score goals and inspect unreachable states.',
'HockeyWorld.checkUnplayable':'Repair only invalid/unreachable puck states after sustained detection; reachable stationary pucks remain legal.',
'GolfPhysics.tick':'Advance obstacle dynamics, surface/field forces, ball integration, hazards, contacts, safe recovery and win/loss in the stated order.',
'GravityMatch.speed':'Apply six eased +24 speed ramps from 120 toward264, with an 8s opening and20s stage spacing.',
'BirdsMatch.step':'Advance wall telegraphs, individual flight/recovery and physical shared-star collection, then check the15-star finish.',
'SpikeMatch.tick':'Advance warning/extension/hold/retraction/recovery, legal player motion, swept piston danger and survival points.',
'QuestionHistory.record':'Evict the oldest ID when at150 entries, add the current ID and persist the bounded recent set.',
'PerfectTimerMatch.recordStop':'Convert validated foreground milliseconds to one integer-centisecond stop per player.',
'WaterGuessMatch.resolveRound':'Compare two submitted integer errors and cache one score result so repeated resolution cannot score again.',
'PerfectTimerMatch.resolveRound':'Compare two stop errors and cache one score result so repeated resolution cannot score again.',
'ShooterWorld.drop':'Choose enemy/wave/random upgrade drops, apply restricted extra-life eligibility and reuse a bounded pickup slot.',
'ShooterWorld.collect':'Apply a collected weapon/timed power/shield/life upgrade, update its bounded duration and visible announcement.',
'ShooterWorld.attack':'Fire a role-dependent ordinary enemy pattern, including aimed/paired/boss projectiles.',
'planShot':'Forecast delay, evaluate bounded legal shot/wait simulations, refine the best landing and return a comparable seeded plan.',
'advanceRunner':'Integrate legal gravity momentum, wall support/gaps, runnable platform crossings and canonical trap collisions.',
'advanceBird':'Integrate auto-flight and flap gravity, collide with triangle hazards and reflect only safe side-wall contacts.',
'pickupDistance':'Return the shortest star distance to the bird\'s swept previous/current movement segment.',
'spawnStar':'Try up to64 seeded open-arena candidates and retain a clearance-respecting or farthest fallback star.',
'advanceRecovery':'Advance the eased curved return to a per-player home and re-enable legal flight at recovery completion.',
'strikeScore':'Convert the gauge distance from center into a rounded integer0..100 timing score.',
'needle':'Compute the sinusoidal gauge from elapsed clock and attempt-dependent frequency.',
'formation':'Create wave-specific rows/columns, enemy roles/hitpoints and the every-fourth-wave boss.',
'canDropLife':'Permit rare extra lives only on six-wave milestones, after90s since the last drop and below four lives.',
}

def method_role(s,f):
 name=s['name'];last=name.split('.')[-1]
 if name in OVERRIDE:return OVERRIDE[name]
 if last in METHOD:return METHOD[last]
 if s['kind']=='GetAccessor':return 'Derived read-only view of existing state; the returned expression below defines its value.'
 if s['kind'] in ['InterfaceDeclaration','TypeAliasDeclaration','EnumDeclaration']:return 'Compile-time data contract/type; it describes shape and allowed values, not a runtime update.'
 if s['kind']=='ClassDeclaration':return 'Component state and methods are grouped under this class. Its fields and individual blocks are indexed below.'
 # Short exact implementation is clearer than invented semantic inference.
 if len(s.get('source',''))<240:return 'Small local helper. The exact implementation below defines its transformation/return behavior.'
 return 'Local implementation helper. The direct calls, writes, return expressions and branch conditions below identify its work without hiding delegated behavior.'

# Add file atlas (every maintained TS/MJS file; native/CSS handled appropriately).
heading('13. Complete source file and code-block atlas',0,True)
add('The section order mirrors the project. Each file header gives its source fingerprint and status. A short exact block is reproduced when useful; longer blocks have extracted calls, state writes, return/guard expressions and a direct-statement map. Full unabridged sources are in Pocket_Rivals_Source_Reference.md.','small')
code_entries=[]
def order(f):
 p=f['path'];roots=['src/main.ts','src/core/','src/scenes/','src/shared/','src/styles/','src/tournament/','src/games/','src/arcade/','src/future-games/','examples/','scripts/']
 return (next((i for i,r in enumerate(roots) if p.startswith(r)),99),p)
lastfolder=None
for f in sorted([f for f in files if not f['path'].startswith('tests/')],key=order):
 p=f['path'];folder=str(Path(p).parent)
 if folder!=lastfolder:
  heading(folder,1);lastfolder=folder
 key=heading(p,2);anchors[p]=key
 status='DEFERRED / unregistered' if p.startswith('src/future-games') else 'RETAINED LEGACY / inactive factory' if re.match(r'src/games/mini-golf/(GolfAI|GolfMatch|GolfPhysics|MiniGolfGame|ai.worker|courses)\.',p) else 'EXAMPLE / not shipped' if p.startswith('examples/') else 'ACTIVE SOURCE / tool or application'
 add(status+' | '+str(f['lines'])+' lines | SHA-256 '+f['hash'][:16]+'...','tiny');add(purpose(p),'small')
 markdown.append('Source fingerprint: '+f['hash']+'\n')
 deps=[]
 for im in f.get('imports',[]):
  m=re.search(r'from ["\']([^"\']+)["\']',im) or re.search(r'import ["\']([^"\']+)["\']',im)
  if m:deps.append(m.group(1))
 if deps:add('Imports: '+', '.join(deps),'tiny')
 if re.search(r'ultimate/courses/(foundry|shoreline|horizon|temple)\.ts$',p) or p.endswith('/Maps.ts') or p.endswith('/ai/routes.ts') or p=='src/games/mini-golf/courses.ts':
  story.append(para('Complete geometry / route parameter listing','block'))
  add('These exact coordinates and parameters define the data used by the module. Edit the data owner and verify dependent collision, rendering and AI routes together.','small')
  story.append(code('\n'.join(f'{i:3} | {line}' for i,line in enumerate(f['source'].splitlines(),1))))
 if p.endswith('.css'):
  # Selector and @rule block index, including nested responsive blocks.
  src=f['source'];rows=[['Lines','Selector or rule','Declarations']]
  for m in re.finditer(r'([^{}]+)\{([^{}]*)\}',src):
   sel=re.sub(r'/\*.*?\*/','',m.group(1),flags=re.S).strip()
   if not sel:continue
   a=src.count('\n',0,m.start(1))+1;b=src.count('\n',0,m.end())+1
   rows.append([f'{a}-{b}',clip(sel,200),clip(re.sub(r'/\*.*?\*/','',m.group(2),flags=re.S),450)])
  table(rows,[43,180,284]);code_entries.append(p);continue
 if p.endswith('.py'):
  src=f['source'];tree=ast.parse(src)
  for n in tree.body:
   if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef,ast.For,ast.Assert,ast.Assign,ast.Expr)):
    a=n.lineno;b=n.end_lineno;txt=ast.get_source_segment(src,n) or ''
    add(f'Lines {a}-{b}: '+clip(txt,500),'small')
  code_entries.append(p);continue
 if p.endswith('.java'):
  story.append(code(f['source']));code_entries.append(p);continue
 # State fields (all, including uninitialized injected dependencies).
 fields=f.get('fields',[])
 if fields:
  story.append(para('State, resources and initial values','block'))
  rows=[['Line','Field / declaration']]
  for c in fields:rows.append([str(c['line']),clip(c['declaration'],420)])
  table(rows,[42,465])
 constants=[c for c in f.get('constants',[]) if c['kind']=='module']
 if constants:
  story.append(para('Module constants and data','block'))
  for c in constants:
   val=c['value'];blob='<svg' in val or len(val)>1400
   add(f"L{c['line']}-{c['end']} {c['name']} = "+(f"Structured literal/expression ({len(val)} characters). See the complete source reference; do not treat generated SVG path coordinates as gameplay variables." if blob else clip(val,1300)),'tiny')
 # Every named block.
 for s in f.get('symbols',[]):
  label=s['name']+f"  [L{s['line']}-{s['end']}]"
  story.append(para(label,'block'));markdown.append('#### '+label+'\n');add(method_role(s,f),'small')
  if s['kind']=='ClassDeclaration':continue
  if s['kind'] in ['InterfaceDeclaration','TypeAliasDeclaration','EnumDeclaration']:
   story.append(code(clip(s.get('source',s['signature']),1800)));continue
  sig=s.get('signature','')
  if sig:add('Signature: '+clip(sig,450),'tiny')
  src=s.get('source','')
  if len(src)<=300 and '\n' not in src.strip():story.append(code(src));continue
  if s.get('writes'):add('Direct writes: '+', '.join(s['writes']),'tiny')
  calls=[x for x in s.get('calls',[]) if not x.startswith(('Math.','Number.','Array.','Object.','JSON.','String','parseInt','parseFloat'))]
  if calls:add('Calls / delegates: '+', '.join(calls),'tiny')
  for r in s.get('returns',[]):
   if r['value'] not in ['false','true','null','undefined','0','1']:add(f"Return at L{r['line']}: "+clip(r['value'],350),'tiny')
  guards=s.get('guards',[])
  if guards:
   add('Decision branches: '+'; '.join(f"L{g['line']}: {clip(g['test'],220)}" for g in guards),'tiny')
  if s['end']-s['line']>=32:
   outline=s.get('outline',[])
   if outline:
    add('Execution order (direct statements; nested callbacks stay within their owner):','tiny')
    for o in outline:add(f"L{o['line']}-{o['end']} {o['kind']}: "+o['head'],'tiny')
  elif not (s.get('calls') or s.get('writes') or guards):story.append(code(clip(src,700)))
 # Top-level handler/registration/module side effects and default exports.
 for sec in f.get('sections',[]):
  story.append(para(f"Top-level block L{sec['line']}-{sec['end']}",'block'))
  src=sec['source']
  if len(src)<=2000:story.append(code(src))
  else:
   add(clip(src,700),'tiny')
   if sec.get('calls'):add('Delegates: '+', '.join(sec['calls']),'tiny')
 code_entries.append(p)

heading('14. Tests and fixtures: every file and declared check',0,True)
add('Test titles are source declarations, not a statement that the test passed in this edition. See the validation ledger for executed checks. Parameterized templates expand to multiple runtime cases; their literal titles are preserved.','small')
lastfolder=None
for f in sorted([f for f in files if f['path'].startswith('tests/')],key=lambda f:f['path']):
 p=f['path'];folder=str(Path(p).parent)
 if folder!=lastfolder:heading(folder,1);lastfolder=folder
 key=heading(p,2);anchors[p]=key
 add(f"{f['lines']} source lines. SHA-256 {f['hash'][:16]}...",'tiny')
 add(purpose(p),'small')
 deps=[]
 for im in f['imports']:
  m=re.search(r'from ["\']([^"\']+)["\']',im)
  if m:deps.append(m.group(1))
 if deps:add('Dependencies / tested owners: '+', '.join(deps),'tiny')
 for t in f['tests']:add(f"L{t['line']}-{t['end']}: "+t['title'],'small')
 for s in f['symbols']:
  add(f"Helper/type {s['name']} L{s['line']}-{s['end']}: "+clip(s.get('signature',''),220),'tiny')
 if not f['tests']:
  for c in f['constants']:add(f"L{c['line']}-{c['end']} {c['name']}: "+clip(c['value'],500),'tiny')
  for sec in f['sections']:add(f"L{sec['line']}-{sec['end']}: "+clip(sec['source'],500),'tiny')
 code_entries.append(p)

# All maintained non-code files, not only the public source root.
heading('15. Every folder, resource, data file and document',0,True)
add('The inventory below excludes installed dependencies, Git internals, build/cache directories, this handbook workspace and machine-local SDK configuration. Copied Android public assets are generated and listed as one regeneration group. Source/reference files introduced by this handbook are listed in its reproduction note.','small')
inv=[p for p in index['inventory'] if '/assets/public/' not in p and p not in code_entries]
DIR_PURPOSE={'docs':'Existing explanatory notes, reports, screenshot evidence and licenses.','android':'Native wrapper/build configuration and local resources.','public':'Static web icon.','src':'Module metadata instructions, preview art and game data.','examples':'Unshipped example metadata/art.','scripts':'Build/audit tooling.'}
byfolder=collections.defaultdict(list)
for p in inv:byfolder[str(Path(p).parent)].append(p)
for folder,paths in sorted(byfolder.items()):
 heading(folder,1)
 for p in sorted(paths):
  q=ROOT/p;name=q.name;desc='';details=''
  try:data=q.read_bytes()
  except OSError:continue
  if p.endswith('.md'):
   text=data.decode('utf8');heads=[re.sub(r'^#+\s*','',x) for x in text.splitlines() if x.startswith('#')]
   firstparas=[x.strip() for x in re.split(r'\n\s*\n',text) if x.strip() and not x.lstrip().startswith(('#','|','```','-','*'))]
   desc=('Maintenance constraints for this folder; read before editing. ' if name=='AGENTS.md' else 'Existing project document. ')+(clip(firstparas[0],320) if firstparas else '')
   details='Sections: '+', '.join(heads[:20])
  elif p.endswith('.png'):
   from PIL import Image
   try:
    with Image.open(q) as im:desc=f'Historical screenshot or native raster resource; {im.width}x{im.height} pixels. '
   except Exception:desc='Raster evidence/resource. '
   desc+= 'Generated review evidence; runtime art is in source.' if p.startswith('docs/') else 'Density-specific launcher icon resource.'
  elif p.endswith('.svg'):desc='Original static vector preview/icon. Menu art is independent from live physics/rendering.'
  elif p.endswith('.json'):
   if name=='package-lock.json':desc='Resolved dependency graph for reproducible npm ci; generated by package management.'
   else:
    try:
     obj=json.loads(data);desc=f'JSON {"array of "+str(len(obj))+" entries" if isinstance(obj,list) else "object with keys: "+", ".join(list(obj)[:18])}.'
     if p.endswith('university.json'):desc+=' Static 100-question bank: edit schema/correct answers carefully; verify-math-bank.py overwrites it.'
    except Exception:desc='JSON configuration/report.'
  elif p.endswith('.xml'):desc='Native Android resource or manifest. '+('Defines app/activity/orientation/theme and launcher intent.' if name=='AndroidManifest.xml' else 'Resource references connect native branding, layout, provider paths or themes.')
  elif p.endswith('.gradle'):desc='Gradle project/plugin/dependency/signing configuration. Capacitor-named files are generated connection glue; regenerate through cap sync when appropriate.'
  elif 'LICENSE' in p or 'licenses/' in p:desc='Third-party license text copied for distribution notices; preserve attribution and terms.'
  elif p.endswith('.jar'):desc='Binary pinned Gradle wrapper launcher; no gameplay logic to edit.'
  elif name in ['gradlew','gradlew.bat']:desc='Gradle wrapper launch script for Unix/Windows; selects the pinned wrapper runtime.'
  elif p.endswith('.properties'):desc='Gradle or tool properties; wrapper properties pin the Gradle download/distribution.'
  elif name.endswith('gitignore'):desc='Rules excluding generated/local files from Git.'
  elif name=='index.html':desc='Application document with menu, game-stage and overlay roots plus module startup.'
  elif name=='.gitkeep':desc='Empty marker retaining a native resource/source directory.'
  else:desc='Project configuration or resource; complete textual content is in the companion source reference where applicable.'
  add(p,'block');add(desc,'small')
  if details:add(details,'tiny')
  if p in ['package.json','tsconfig.json','vercel.json','.prettierrc.json','index.html']:
   story.append(code(data.decode('utf8')))
  elif p.endswith('university.json'):
   obj=json.loads(data);table([['Topic','Static questions']]+[[topic,str(sum(x.get('topic')==topic for x in obj))] for topic in sorted({x.get('topic','') for x in obj})],[350,157])
   add('Example data shape (one current entry):','tiny');story.append(code(json.dumps(obj[0],indent=2)))
  elif p.endswith('.gradle') or p.endswith('gradle-wrapper.properties') or p.endswith('AndroidManifest.xml') or p.endswith('variables.gradle'):
   # Readable full configuration reinforces the native change map without binary internals.
   text=data.decode('utf8')
   if len(text)<6500:story.append(code(text))

heading('Generated and local directories',1)
table([['Directory/group','Purpose and regeneration'],['dist/','Vite output: hashed JS/CSS, worker chunks, fonts, .vite/manifest.json, icon, HTML and sw.js. Run npm run build.'],['android/app/src/main/assets/public/','Capacitor copy of a web build, including manifest/chunks/fonts/sw and Cordova compatibility stubs. Run npm run android:sync; this copy can lag src.'],['node_modules/','Installed dependency internals, font/KaTeX/Phaser assets, caches and package binaries. Recreate with npm ci.'],['android/.gradle, android/**/build','Gradle caches and compiled APK/AAB/intermediates; regenerate with the appropriate Gradle task.'],['test-results/, playwright-report/','Generated browser artifacts and reports; regenerated by Playwright.'],['tmp/pdfs/handbook/','Render/QC previews and execution logs for this edition.'],['output/pdf/','Final PDF, editable combined handbook, complete textual source reference and coverage ledger.'],['../.git and ../tmp','Parent repository metadata and unrelated exam-grading scans; not game source.']], [180,327])

heading('16. Snapshot, coverage and validation ledger',0,True)
source_symbols=sum(len(f['symbols']) for f in sourcefiles if f['path'].endswith('.ts'))
table([['Coverage item','Count / interpretation'],['Maintained code files in this edition',str(len(files))+' (source, tools, configurations, tests; generated native copies excluded)'],['Files under src/',str(len(sourcefiles))+' parsed code/CSS files'],['Named TypeScript blocks under src/',str(source_symbols)+' classes/types/functions/methods/getters (anonymous callbacks belong to their containing block)'],['Inventory entries',str(len(index['inventory']))+' including generated Android public-copy entries, excluding dependency/build/cache internals'],['Code file atlas + test entries',str(len(set(code_entries)))+'; coverage.json checks every parsed maintained file is represented'],['Source hashes','Full SHA-256 per code file in code-index.json and coverage.json'],['Snapshot time',SNAPSHOT]], [190,317])
add('Source is editable and other work may proceed concurrently. The PDF and companion source reference describe the exact extracted sources identified by their hashes. A later successful build or an older QA note does not validate different source bytes.','small')
validation_path=HERE/'validation.json'
validation=json.loads(validation_path.read_text()) if validation_path.exists() else {}
for title,desc in validation.items():add(title+': '+desc,'small')
add('Existing docs/QA.md and earlier JSON measurements are historical records. Their older module counts, course camera descriptions and feature claims may differ from the current source. The active module path, current source expressions and this edition\'s validation ledger take precedence for understanding this snapshot.','small')
heading('Rebuilding the documentation',1)
add('From the project root, run node docs/handbook/extract.mjs to refresh the source index, review/update docs/handbook/guide.md and validation.json, then run the bundled Python interpreter with docs/handbook/build.py. The PDF skill\'s operation marker is a session authoring step and is not part of application code. Re-render and inspect the PDF after content changes.','small')
add('Files introduced for this document: guide.md (authored explanations), extract.mjs (read-only source index extraction), code-index.json (captured source, symbol/data/effect maps), build.py (document and companion generator), validation.json (honest executed-check ledger), and optional verify.py (artifact coverage/layout checks). These live under docs/handbook; final deliverables live under output/pdf.','small')

# Save complete source reference from the captured code strings; non-code textual files are included too.
byname={f['path']:f for f in files}
source_ref=['# Pocket Rivals - complete maintained textual source reference\n', 'Snapshot: '+SNAPSHOT+'\n','Paths are relative to pocket-rivals. The code listings are numbered for this edition. Generated Android copied bundles, dependencies, binary assets, caches and handbook generated sources are excluded. Original source text is preserved after the line-number prefix.\n']
for p in sorted([p for p in index['inventory'] if '/assets/public/' not in p and not p.endswith(('.png','.jpg','.jar','.woff','.woff2'))]):
 q=ROOT/p
 try:src=byname[p]['source'] if p in byname else q.read_text('utf8')
 except (UnicodeError,OSError):continue
 digest=hashlib.sha256(src.encode()).hexdigest()
 source_ref+=['\n## '+p+'\n','SHA-256: '+digest+'\n','~~~text\n']
 source_ref += [f'{i:5} | {line}\n' for i,line in enumerate(src.splitlines(),1)]
 source_ref+=['~~~\n']
(OUT/'Pocket_Rivals_Source_Reference.md').write_text(''.join(source_ref))
(OUT/'Pocket_Rivals_Complete_Handbook.md').write_text('\n'.join(markdown))
coverage={'snapshot':SNAPSHOT,'root':str(ROOT),'codeFiles':len(files),'sourceFiles':len(sourcefiles),'sourceSymbols':source_symbols,'mappedCodeFiles':len(set(code_entries)),'missingCodeFiles':sorted(set(f['path'] for f in files)-set(code_entries)),'files':[{'path':f['path'],'lines':f['lines'],'sha256':f['hash'],'blocks':len(f['symbols'])} for f in files],'validation':validation}
(OUT/'coverage.json').write_text(json.dumps(coverage,indent=2))
assert not coverage['missingCodeFiles'],coverage['missingCodeFiles']
PDF=OUT/'Pocket_Rivals_Complete_Handbook.pdf'
doc=Handbook(str(PDF),pagesize=(595.28,841.89),leftMargin=44,rightMargin=44,topMargin=50,bottomMargin=48,title='Pocket Rivals - Complete Project and Modification Handbook',author='Pocket Rivals project documentation')
doc.addPageTemplates(PageTemplate(id='normal',frames=[Frame(44,48,507.28,743.89,id='body',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=page))
doc.multiBuild(story)
print(json.dumps({'pdf':str(PDF),'pages':doc.page,'mappedCodeFiles':len(code_entries),'missing':coverage['missingCodeFiles']},indent=2))
