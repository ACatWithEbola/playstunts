"""Memory-only bounded original MS91 rectangle steps; JSON goes to stdout."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('libraries',type=Path);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.image.read_bytes()
for at in [0xc359,0xc487,0xc552]:assert image[at:at+5]==bytes.fromhex('833e909600')
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
r=random.Random(19910225);rows=[]
def fields(data):
    return dict(active=struct.unpack_from('<H',data,0x9690)[0],identity=struct.unpack_from('<H',data,0xb0da)[0],retainedIdentity=struct.unpack_from('<H',data,0x970a)[0],graphics=data[0x192],count=data[0xae6a],marks=data[0xa224:0xa233].hex(),empty=data[0x339a:0x33a2].hex(),working=data[0x9710:0x9788].hex(),current=data[0xa250:0xa2c8].hex(),retained=data[0xa65e:0xa6d6].hex())
for operation,start,end in [('initialize',0xc552,0xc58b),('commit',0xc487,0xc4b4),('prepare',0xc359,0xc3b4)]:
    for index in range(100):
        before=bytearray(r.randbytes(65536));struct.pack_into('<H',before,0x9690,[0,1,2,65535][index%4]);before[0x192]=index%5
        if index%3==0:before[0xa686:0xa68e]=before[0xa278:0xa280]
        if index%5==0:before[0x970a:0x970c]=before[0xb0da:0xb0dc]
        u.mem_write(0x60000,bytes(before));expected_end=0xc454 if operation=='prepare' and index%4==0 else end
        for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_ES,0x7000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_SI,0x1234),(UC_X86_REG_DI,0x5678)]:u.reg_write(reg,value)
        u.emu_start(start,expected_end,count=10000);assert u.reg_read(UC_X86_REG_IP)==expected_end,'Original bounded block did not reach exit'
        after=bytes(u.mem_read(0x60000,65536));changed=[i for i,(x,y) in enumerate(zip(before,after)) if x!=y]
        allowed=lambda i:0xdffa<=i<0xe000 or (operation=='initialize' and (i==0xeede or 0xefc2<=i<0xefc4 or 0x9710<=i<0x9788)) or (operation=='commit' and (0x970a<=i<0x970c or 0xa65e<=i<0xa6d6)) or (operation=='prepare' and (0xa224<=i<0xa233 or i==0xae6a or 0x970a<=i<0x970c))
        assert all(allowed(i) for i in changed),'Unexpected original persistent write'
        rows.append(dict(operation=operation,before=fields(before),after=fields(after),flags=after[0xeede] if operation=='initialize' else None))
print(json.dumps(rows))
