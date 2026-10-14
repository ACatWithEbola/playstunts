"""Original MS90 update loop on explicitly supplied prepared retained memory."""
import argparse,sys,json,base64,struct
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
run=json.load(sys.stdin);live=base64.b64decode(run['memory']);image=a.image.read_bytes();d=0x2d1a0
assert image[0x9640:0x9648]==bytes.fromhex('558bec83ec045756')
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
u.mem_write(d,live[d:d+65536]);u.mem_write(0x40000,live[0x40000:0xa0000])
def driver(u,address,size,user):
 if address not in (0x1931e,0x19397,0x197da,0x19835,0x19890,0x29e86,0x1979e,0x19762,0x1971e):return
 sp=u.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<HH',bytes(u.mem_read(d+sp,4)))
 for reg,value in [(UC_X86_REG_SP,sp+4),(UC_X86_REG_CS,cs),(UC_X86_REG_IP,ip)]:u.reg_write(reg,value)
u.hook_add(UC_HOOK_CODE,driver)
first_finish=None
for frame,control in enumerate(run['inputs']):
 count=struct.unpack('<H',bytes(u.mem_read(d+0x8c26,2)))[0]
 off,seg=struct.unpack('<HH',bytes(u.mem_read(d+0x9c40,4)))
 u.mem_write(seg*16+off+count,bytes([control]));u.mem_write(d+0xeee2,struct.pack('<HH',0,0xf000))
 for reg,value in [(UC_X86_REG_CS,0x280),(UC_X86_REG_DS,d//16),(UC_X86_REG_ES,d//16),(UC_X86_REG_SS,d//16),(UC_X86_REG_SP,0xeee2),(UC_X86_REG_SI,0)]:u.reg_write(reg,value)
 u.emu_start(0x9640,0xf0000,count=1000000);assert u.reg_read(UC_X86_REG_CS)==0xf000
 actual=bytes(u.mem_read(d+0x8c38,184));expected=bytes.fromhex(run['cars'][frame])
 assert actual==expected,('Legacy car mismatch',frame+1,[(i,x,expected[i]) for i,x in enumerate(actual) if x!=expected[i]][:12])
 if first_finish is None and actual[0xb1]==3:first_finish=frame+1
if 'statistics' in run:
 assert bytes(u.mem_read(d+0x899a,22)).hex()==run['statistics'],'Original retained finish statistics differ'
assert a.image.read_bytes()==image
print(json.dumps(dict(frames=len(run['inputs']),firstFinishFrame=first_finish,originalMS90=True,sourceUnchanged=True,passVerified=True)))
