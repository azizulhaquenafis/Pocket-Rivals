import subprocess,math,wave,array
from pathlib import Path
p=Path(__file__).parent
run=lambda a:subprocess.run(['ffmpeg','-y','-loglevel','error']+a,check=True)
run(['-i',str(p/'pocket-rivals-promo.mp4'),'-t','20','-c','copy',str(p/'intro.mp4')])
run(['-ss','20','-i',str(p/'pocket-rivals-promo.mp4'),'-t','5','-c','copy',str(p/'end.mp4')])
for i in range(3):run(['-sseof','-3.5','-i',str(p/f'capture-{i}.webm'),'-vf','scale=720:1280,fps=30,fade=t=in:st=0:d=0.2,fade=t=out:st=3.2:d=0.3','-an','-c:v','libx264','-pix_fmt','yuv420p',str(p/f'game-{i}.mp4')])
(p/'sequence.txt').write_text("file 'intro.mp4'\n"+''.join(f"file 'game-{i}.mp4'\n" for i in range(3))+"file 'end.mp4'\n")
run(['-f','concat','-safe','0','-i',str(p/'sequence.txt'),'-c','copy',str(p/'silent.mp4')])
# Original soft arcade arpeggio; no third-party music or recordings.
sr=44100;notes=[60,64,67,72,67,64,62,67,59,62,67,71,67,62,64,67];samples=array.array('h')
for n in range(sr*36):
 t=n/sr;beat=t%.25;note=notes[int(t/.25)%len(notes)];f=440*2**((note-69)/12);env=min(1,beat/.012)*math.exp(-beat*15);fade=min(1,t/1.5,max(0,(35.5-t)/2));v=(math.sin(2*math.pi*f*t)+.22*math.sin(4*math.pi*f*t))*env*.11*fade;samples.append(int(v*32767))
with wave.open(str(p/'original-music.wav'),'w')as w:w.setparams((1,2,sr,0,'NONE','not compressed'));w.writeframes(samples.tobytes())
run(['-i',str(p/'silent.mp4'),'-i',str(p/'original-music.wav'),'-c:v','copy','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',str(p/'pocket-rivals-promo.mp4')])
for f in ['intro.mp4','end.mp4','silent.mp4','sequence.txt']+[f'game-{i}.mp4'for i in range(3)]: (p/f).unlink()
