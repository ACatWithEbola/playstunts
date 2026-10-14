"""Read-only MS91 suspension oracle; isolated synthetic states, not full races."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
p.add_argument('--engine',choices=['ms-1990','ms-1991'],default='ms-1991')
p.add_argument('--seed',type=int,default=19910225)
p.add_argument('--full-range',action='store_true',help='Exercise signed-word arithmetic boundaries, not just ordinary suspension values')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_AX
image=a.image.read_bytes()
entry,cs=(0xab00,0) if a.engine=='ms-1991' else (0x18e12,0x1000)
prefix=bytes.fromhex('558bec83ec06568b760ad1e60376068b' if a.engine=='ms-1991' else '558bec83ec0657568b760ad1e6037606')
assert image[entry:entry+len(prefix)]==prefix
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
r=random.Random(a.seed);rows=[]
for case in range(1000):
    wheel=case%4
    rc2=r.randrange(-384,385);rc4=r.randrange(-384,385);rc5=r.randrange(-384,385);distance=r.randrange(-600,601)
    if a.full_range:
        edges=[-32768,-32767,-16384,-1,0,1,16383,32766,32767]
        def sample():return r.choice(edges) if case<500 else r.randrange(-32768,32768)
        rc2,rc4,rc5,distance=[sample() for _ in range(4)]
    m.mem_write(0x60000,bytes(65536));state=bytearray(0xd2)
    for offset,value in [(0x54,rc2),(0x64,rc4),(0x6c,rc5)]:struct.pack_into('<h',state,offset+wheel*2,value)
    m.mem_write(0x61000,bytes(state));m.mem_write(0x7f000,struct.pack('<5H',0x1000,0,0x1000,distance&65535,wheel))
    for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x7000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
    m.emu_start(entry,0x1000,count=1000)
    assert m.reg_read(UC_X86_REG_SP)==0xf004,'Routine did not return'
    after=bytes(m.mem_read(0x61000,0xd2))
    signed=lambda value:(value+32768)%65536-32768
    allowed={offset+wheel*2+byte for offset in [0x54,0x64,0x6c] for byte in [0,1]}
    assert all(before==current or offset in allowed for offset,(before,current) in enumerate(zip(state,after)))
    rows.append({'wheel':wheel,'before':{'rc2':rc2,'rc4':rc4,'rc5':rc5},'distance':distance,'after':{'rc2':struct.unpack_from('<h',after,0x54+wheel*2)[0],'rc4':struct.unpack_from('<h',after,0x64+wheel*2)[0],'rc5':struct.unpack_from('<h',after,0x6c+wheel*2)[0],'height':signed(m.reg_read(UC_X86_REG_AX))}})
assert a.image.read_bytes()==image
with a.output.open('x') as f:json.dump(rows,f)
print('Generated 1000 original '+a.engine+' suspension outputs')
