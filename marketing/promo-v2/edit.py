from pathlib import Path
import subprocess,json
p=Path(__file__).parent
run=lambda args:subprocess.run(['ffmpeg','-y','-loglevel','error']+args,check=True)
for id in ['intro','outro']:
 run(['-loop','1','-i',str(p/f'{id}.png'),'-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-vf',"zoompan=z='min(zoom+0.0004,1.04)':d=90:s=1920x1080:fps=30,fade=t=in:st=0:d=0.25,fade=t=out:st=2.75:d=0.25",'-t','3','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','2',str(p/f'{id}-edit.mp4')])
for id in ['pong','tower','pour','glider']:
 # Retain the real canvas and its synchronized live AudioContext stream.
 run(['-loop','1','-i',str(p/f'{id}.png'),'-i',str(p/f'{id}.webm'),'-filter_complex',"[1:v]scale=520:940,setsar=1[game];[0:v][game]overlay=x='1120+90*exp(-t*8)':y=70:shortest=1,fps=30,fade=t=in:st=0:d=0.18,fade=t=out:st=7.75:d=0.25[v];[1:a]aresample=48000,afade=t=in:st=0:d=0.1,afade=t=out:st=7.75:d=0.25[a]",'-map','[v]','-map','[a]','-t','8','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','2',str(p/f'{id}-edit.mp4')])
(p/'sequence.txt').write_text(''.join(f"file '{id}-edit.mp4'\n"for id in ['intro','pong','tower','pour','glider','outro']))
run(['-f','concat','-safe','0','-i',str(p/'sequence.txt'),'-c','copy','-movflags','+faststart',str(p/'pocket-rivals-promo-no-music.mp4')])
