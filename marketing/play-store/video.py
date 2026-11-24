import subprocess
from pathlib import Path
p=Path(__file__).parent
files=[f'illustration-{i}.png' for i in range(1,6)]
for i,file in enumerate(files):
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(p/file),'-vf',"scale=810:1440,zoompan=z='min(zoom+0.00035,1.06)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=150:s=720x1280:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=4.65:d=0.35",'-t','5','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',str(p/f'clip-{i}.mp4')],check=True)
(p/'sequence.txt').write_text(''.join(f"file 'clip-{i}.mp4'\n" for i in range(5)))
subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',str(p/'sequence.txt'),'-c','copy','-movflags','+faststart',str(p/'pocket-rivals-promo.mp4')],check=True)
for i in range(5):(p/f'clip-{i}.mp4').unlink()
(p/'sequence.txt').unlink()
