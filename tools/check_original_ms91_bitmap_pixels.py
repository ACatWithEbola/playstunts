"""Original raw bitmap dispatcher and real kernels write isolated software planes."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('output',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--clipped',action='store_true');p.add_argument('--compressed',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.modern.read_bytes();rows=[]
positions=[(-9,2),(-1,2),(0,-2),(7,2),(55,2),(63,2),(70,2),(1,30),(1,40)] if a.clipped else [(x,2) for x in [0,1,7,8]]
for width,height,(x,y),encoding in itertools.product([1,2,3],[1,4,8],positions,['repeat','literal','mixed'] if a.compressed else ['raw']):
 bitmap=bytearray(16+width*height*4);struct.pack_into('<6H',bitmap,0,width,height,0,0,x&65535,y&65535);bitmap[12:16]=bytes([1,2,4,8])
 for n in range(len(bitmap)-16):bitmap[16+n]=(n*37+0x43)&255
 if a.compressed:
  header=bitmap[:16];stream=bytearray()
  for plane in range(4):
   values=bitmap[16+plane*width*height:16+(plane+1)*width*height]
   if encoding=='repeat':stream+=bytes([len(values),values[0],0])
   elif encoding=='literal':stream+=bytes([256-len(values)])+values+b'\0'
   else:
    stream+=bytes([1,values[0]])
    if len(values)>1:stream+=bytes([256-(len(values)-1)])+values[1:]
    stream+=b'\0'
  bitmap=header+stream
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x70000,bytes(bitmap))
 for n,segment in enumerate([0x9000,0x9200,0x9400,0x9600]):m.mem_write(0x20e50+0x929c+n*2,struct.pack('<H',segment));m.mem_write(segment*16,b'\xa5'*256)
 for at,value in [(0x92a4,0xb000),(0x92ae,8),(0x92a6,0),(0x92a8,8),(0x92aa,0),(0x92ac,32)]:m.mem_write(0x20e50+at,struct.pack('<H',value))
 for n in range(32):m.mem_write(0x20e50+0xb000+n*2,struct.pack('<H',n*8))
 m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,0,0x7000,x&65535,y&65535))
 for reg,value in [(UC_X86_REG_CS,0x20e5),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
 entry=(0x7a96 if a.clipped else 0x7e0a) if a.compressed else (0x63d5 if a.clipped else 0x6407)
 m.emu_start(0x20e50+entry,0x1000,count=100000)
 assert m.reg_read(UC_X86_REG_SP)==0xf004,(width,height,x,hex(m.reg_read(UC_X86_REG_IP)))
 assert bytes(m.mem_read(0x70000,len(bitmap)))==bytes(bitmap)
 rows.append({'width':width,'height':height,'x':x,'y':y,'clipped':a.clipped,'compressed':a.compressed,'encoding':encoding,'bitmap':bytes(bitmap).hex(),
  'planes':[bytes(m.mem_read(segment*16,256)).hex() for segment in [0x9000,0x9200,0x9400,0x9600]]})
assert a.modern.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'originalRawBitmapCases':len(rows),'realDispatcherAndKernelsExecuted':True,'bitmapSourcesUnchanged':True,'noHardwareAudioOrFileServices':True}))
