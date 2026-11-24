import wave,array,random,math,subprocess,shutil
from pathlib import Path
p=Path(__file__).parent;sr=48000;data=array.array('h',[0])*(sr*39);rng=random.Random(81)
for start in [0,3,11,19,27,35]:
 prev=0.
 for i in range(int(sr*.22)):
  t=i/(sr*.22);noise=rng.uniform(-1,1);prev=.6*prev+.4*noise;v=prev*math.sin(math.pi*t)**2*.18;data[int(start*sr)+i]=int(v*32767)
with wave.open(str(p/'transition-sfx.wav'),'w')as f:f.setparams((1,2,sr,0,'NONE','not compressed'));f.writeframes(data.tobytes())
src=p/'pocket-rivals-promo-no-music.mp4';tmp=p/'final.mp4'
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(src),'-i',str(p/'transition-sfx.wav'),'-filter_complex','[0:a]volume=2[a];[a][1:a]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9[out]','-map','0:v','-map','[out]','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(tmp)],check=True);tmp.replace(src)
shutil.copyfile(src,p.parent/'play-store/pocket-rivals-promo.mp4')
