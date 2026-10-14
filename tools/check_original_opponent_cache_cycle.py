"""Execute the original MS90 preparation twice; memory-only, no fixture writes."""
import argparse, json, struct, base64, sys
from pathlib import Path
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16, UC_HOOK_CODE
from unicorn.x86_const import *

p=argparse.ArgumentParser();p.add_argument('reconstruction');p.add_argument('--branch-tiles',nargs=2,type=int,default=[4,20]);p.add_argument('--memory-from-stdin',action='store_true');args=p.parse_args()
assert all(0<=tile<198 for tile in args.branch_tiles)
root=Path(args.reconstruction);d=0x2d1a0;c=0x209e0
image=(root/'work/contact-frame0.bin').read_bytes()
fixture=json.loads((root/'outputs/stunts-web/tests/race-resource-startup-original.json').read_text())
files={f.name.upper():f.read_bytes() for f in (root/'work/original').iterdir() if f.is_file()}
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000)
events=[];packed_name=None
def string(at):
    out=bytearray()
    for i in range(65536):
        value=u.mem_read(d+((at+i)&65535),1)[0]
        if not value:return out.decode('ascii')
        out.append(value)
    raise RuntimeError('unterminated filename')
def hook(uc,a,n,x):
    global packed_name
    if a==0x209ee:raise RuntimeError('Original startup fatal')
    if a not in [0x21f8e,0x21ee0,0x21e3c,0x22a8a,0x1c316]:return
    if a==0x1c316:raise RuntimeError('Unexpected original retry')
    sp=uc.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<HH',uc.mem_read(d+sp,4));ax=dx=0
    name_at=struct.unpack('<H',uc.mem_read(d+sp+4,2))[0];name=string(name_at);data=files.get(name.upper())
    if a==0x21f8e:ax=int(data is not None)
    elif a==0x21ee0:packed_name=name if data else None;ax=(int.from_bytes(data[1:4],'little')+15)//16 if data else 0;events.append(name)
    elif a==0x21e3c:
        if packed_name!=name:events.append(name)
        packed_name=None;ax=(len(data)+15)//16 if data else 0
    else:
        assert data is not None
        off,seg=struct.unpack('<HH',uc.mem_read(d+sp+6,4));uc.mem_write(seg*16+off,data);ax=off;dx=seg
    for reg,val in [(UC_X86_REG_SP,sp+4),(UC_X86_REG_CS,cs),(UC_X86_REG_IP,ip),(UC_X86_REG_AX,ax),(UC_X86_REG_DX,dx)]:uc.reg_write(reg,val)
u.hook_add(UC_HOOK_CODE,hook)
def run_preparation(bp=0xeefe,count=20):
    u.mem_write(d+bp+2,struct.pack('<HH',0,0xf000))
    for reg,val in [(UC_X86_REG_CS,0x107a),(UC_X86_REG_SP,bp+2),(UC_X86_REG_BP,bp)]:u.reg_write(reg,val)
    u.emu_start(0x135be,0xf0000,count=5000000)
    assert u.reg_read(UC_X86_REG_CS)==0xf000,'Original preparation did not reach return'
    off,seg=struct.unpack('<HH',u.mem_read(d+0x7ff4,4))
    return list(struct.unpack('<'+str(count)+'H',u.mem_read(seg*16+off,count*2)))
if args.memory_from_stdin:
    request=json.load(sys.stdin);memory=base64.b64decode(request['memory']);assert len(memory)==0x100000
    u.mem_write(0,memory);u.mem_write(0,image[:d])
    for reg,val in [(UC_X86_REG_DS,d//16),(UC_X86_REG_SS,d//16)]:u.reg_write(reg,val)
    result=run_preparation(request['framePointer'],request['count'])
    print(json.dumps(dict(path=result,reads=events)));sys.exit(0)
for opponent in range(1,7):
    u.mem_write(0,image);u.mem_write(d,bytes.fromhex(fixture['initial']));u.mem_write(c+0x5d94,bytes.fromhex(fixture['graphics']));u.mem_write(0x40000,bytes([0x5a,0xa5])*0x30000)
    for reg,val in [(UC_X86_REG_DS,d//16),(UC_X86_REG_SS,d//16),(UC_X86_REG_SP,0xeee8),(UC_X86_REG_BP,0xeefe)]:u.reg_write(reg,val)
    u.reg_write(UC_X86_REG_CS,0x1696);u.emu_start(0x16966,0x1697f,count=1000000)
    u.reg_write(UC_X86_REG_CS,0x280);u.emu_start(0x28f6,0x2a63,count=1000000)
    for at,data in [(0x73d2,struct.pack('<4H',1,0,0,65535)),(0x7f9a,struct.pack('<4H',2,65535,65535,65535)),(0x8fee,bytes([0,*args.branch_tiles,40]))]:
        off,seg=struct.unpack('<HH',u.mem_read(d+at,4));u.mem_write(seg*16+off,data)
    u.mem_write(d+0x8fc8,bytes([opponent]));events=[];packed_name=None
    first=run_preparation();reads=len(events);second=run_preparation()
    print(json.dumps(dict(opponent=opponent,first=first,second=second,firstReads=reads,secondReads=len(events)-reads)))
