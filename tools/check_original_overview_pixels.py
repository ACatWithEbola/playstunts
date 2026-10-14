"""Independent full legacy overview execution; resource I/O intercepted only."""
import argparse,hashlib,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('snapshot',type=Path);p.add_argument('game',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
b=a.snapshot.read_bytes();d=0x2d1a0;c=0x209e0;rows=[]
assets=json.loads((a.game/'assets.json').read_text());panoramas=json.loads((a.game/'menu-panorama-art.json').read_text());ground=json.loads((a.game/'overview-ground-models.json').read_text())['resources']
for track in assets['tracks']:
 u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,b);u.mem_write(0x90000,bytes(65536));u.mem_write(d+0x130,b'\0')
 def word(offset,value):u.mem_write(d+offset,struct.pack('<H',value&65535))
 for index,name in enumerate(['hig1','hig2','hig3']):
  data=bytes(ground[name]);address=0xa0000+index*256;descriptor=0x7c40+index*22;u.mem_write(address,data)
  vertices,primitives,flags=data[:3]
  for offset,value in [(0,vertices),(6,primitives),(2,4),(4,address>>4),(14,vertices*6+4),(16,address>>4),(18,primitives*4+vertices*6+4),(20,address>>4),(10,primitives*8+vertices*6+4),(12,address>>4)]:word(descriptor+offset,value)
  u.mem_write(d+descriptor+8,bytes([flags]))
 pointers=[];address=0xb0000
 for name in ['scen','sce2','sce3','sce4']:
  data=bytes(panoramas[track['raw'][900]&3]['resources'][name]);u.mem_write(address,data);pointers.extend([address&15,address>>4]);address=(address+len(data)+15)&~15
 def resource(machine,address,size,user):
  if address not in [0x25690,0x285e6]:return
  sp=machine.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<2H',bytes(machine.mem_read(d+sp,4)))
  if address==0x285e6:machine.mem_write(d+0xa390,struct.pack('<8H',*pointers))
  machine.reg_write(UC_X86_REG_AX,0);machine.reg_write(UC_X86_REG_DX,0);machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
 u.hook_add(UC_HOOK_CODE,resource)
 for field,data in [(0x9356,track['raw'][:900]),(0x9ad0,track['raw'][901:1801])]:
  off,seg=struct.unpack_from('<2H',b,d+field);u.mem_write(seg*16+off,bytes(data))
 for offset,value in [(0x5d96,0x9000),(0x5d9e,0x6376),(0x5da0,0),(0x5da2,320),(0x5dae,0),(0x5db0,320),(0x5da4,0),(0x5da6,200),(0x5da8,320)]:u.mem_write(c+offset,struct.pack('<H',value))
 u.mem_write(c+0x6376,struct.pack('<256H',*[(i*320)&65535 for i in range(256)]));word(0x558c,0);word(0x558e,0x8000);word(0x4b84,0);word(0x4b86,0)
 def call(address,segment,args):
  u.mem_write(d+0xf000,struct.pack('<'+'H'*(len(args)+2),0,0xf000,*args))
  for reg,value in [(UC_X86_REG_DS,d>>4),(UC_X86_REG_SS,d>>4),(UC_X86_REG_CS,segment),(UC_X86_REG_SP,0xf000)]:u.reg_write(reg,value)
  u.emu_start(address,0xf0000,count=100000000);assert u.reg_read(UC_X86_REG_CS)==0xf000
 call(0xf3ae,0xbcd,[track['raw'][900]]);call(0x24129,0x209e,[40,40,320,200]);call(0xe7dc,0xbcd,[])
 rows.append({'track':track['name'],'sha256':hashlib.sha256(bytes(u.mem_read(0x90000,65536))).hexdigest()})
assert a.snapshot.read_bytes()==b
print(json.dumps({'rows':rows,'sourceUnchanged':True,'resourceIoIntercepted':True}))
