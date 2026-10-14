"""Real original transparent EGA font code writes isolated software planes."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('output',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--opaque',action='store_true');p.add_argument('--proportional',action='store_true');p.add_argument('--positive-width',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.modern.read_bytes();rows=[]
for height,x,foreground,background,text,width in itertools.product([6,8],[0,1,7,8],[0,4,15],[0,1,15] if a.opaque else [1],['AB','A\nB'],([1,7,8,13,16] if a.positive_width else [0,1,7,8,13,16]) if a.proportional else [13]):
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 font=bytearray(4096)
 for at,value in [(0,foreground),(2,background),(4,0),(12,2),(14,height),(16,13),(18,10),(22+65*2,512),(22+66*2,544)]:struct.pack_into('<H',font,at,value)
 for n in range(16):font[512+n]=(0x81+n*7)&255;font[544+n]=(0x42+n*11)&255
 if a.proportional:
  font[20]=1;font[512]=width;font[544]=width
  for n in range(16):font[513+n]=(0x81+n*7)&255;font[545+n]=(0x42+n*11)&255
 m.mem_write(0x70000,bytes(font));m.mem_write(0x64eb0,struct.pack('<H',0x7000));m.mem_write(0x65000,text.encode()+b'\0')
 for n,segment in enumerate([0x9000,0x9200,0x9400,0x9600]):
  m.mem_write(0x20e50+0x929c+n*2,struct.pack('<H',segment));m.mem_write(segment*16,b'\xa5'*256)
 m.mem_write(0x20e50+0x92a4,struct.pack('<H',0xb000));m.mem_write(0x20e50+0x92ae,struct.pack('<H',8))
 for n in range(32):m.mem_write(0x20e50+0xb000+n*2,struct.pack('<H',n*8))
 m.mem_write(0x6f000,struct.pack('<5H',0x1000,0,0x5000,x,2))
 for reg,value in [(UC_X86_REG_CS,0x20e5),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
 m.emu_start(0x20e50+(0x806d if a.opaque else 0x5f6e),0x1000,count=50000)
 assert m.reg_read(UC_X86_REG_SP)==0xf004,{'height':height,'x':x,'foreground':foreground,'background':background,'text':text,'width':width,'opaque':a.opaque,'ip':hex(m.reg_read(UC_X86_REG_IP)),'instructionLimit':50000}
 rows.append({'height':height,'x':x,'foreground':foreground,'background':background,'opaque':a.opaque,'proportional':a.proportional,'positiveWidthOnly':a.positive_width,'width':width,'text':text,'font':bytes(font).hex(),
  'planes':[bytes(m.mem_read(segment*16,256)).hex() for segment in [0x9000,0x9200,0x9400,0x9600]],
  'cursor':list(struct.unpack('<2H',m.mem_read(0x70008,4)))})
assert a.modern.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'originalSoftwareFontCases':len(rows),'realGlyphCodeExecuted':True,'noHardwareAudioOrFileServices':True}))
