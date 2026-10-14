"""Read-only original MS91 signed plane-normal product oracle."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
p.add_argument('--distance',action='store_true')
p.add_argument('--game-resource',type=Path)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_AX
image=a.image.read_bytes();prefix=bytes.fromhex('558bec83ec045756b80020')
assert image[0xbdf4:0xbdf4+len(prefix)]==prefix
if a.distance:assert image[0xbd68:0xbd6e]==bytes.fromhex('558bec83ec10')
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
r=random.Random(19910225);rows=[];bank=None
if a.game_resource:
    assert a.distance,'Original plane bank requires distance mode'
    from extract import resources,unpack
    bank=resources(unpack(a.game_resource.read_bytes()))['plan']
    assert len(bank)%34==0
cases=2*(len(bank)//34) if bank else 1000
for case in range(cases):
    vector=[r.randrange(-32768,32768) for _ in range(3)]
    normal=[r.randrange(-8192,8193) for _ in range(3)]
    m.mem_write(0x60000,bytes(65536));m.mem_write(0x61000,struct.pack('<3h',*normal))
    plane_id=case%8;origin=[r.randrange(-512,513) for _ in range(3)];tile=[r.randrange(-30000,30001) for _ in range(3)]
    cached=bool(case%2)
    if bank:
        plane_id=case%(len(bank)//34);cached=case>=len(bank)//34
        record=bank[plane_id*34:(plane_id+1)*34]
        origin=list(struct.unpack_from('<3h',record,4));normal=list(struct.unpack_from('<3h',record,10))
    if a.distance:
        def word(offset,value):m.mem_write(0x60000+offset,struct.pack('<H',value&65535))
        word(0x9ace,65535);word(0xa1ca,0x1000);word(0xa1cc,0x6000)
        if cached:
            word(0x9ace,plane_id);word(0x9a6c,0x1000+plane_id*34);word(0x9a6e,0x6000)
        for offset,value in zip([0x96ec,0x96f8,0x9702],tile):word(offset,value)
        record=bytearray(34)
        struct.pack_into('<3h',record,4,*origin);struct.pack_into('<3h',record,10,*normal)
        m.mem_write(0x61000+plane_id*34,bytes(record))
        stack=struct.pack('<6H',0x1000,0,plane_id,*[n&65535 for n in vector])
    else:stack=struct.pack('<7H',0x1000,0,*[n&65535 for n in vector],0x1000,0x6000)
    m.mem_write(0x7f000,stack)
    for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x7000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
    m.emu_start(0xbd68 if a.distance else 0xbdf4,0x1000,count=10000)
    assert m.reg_read(UC_X86_REG_SP)==0xf004,'Routine did not return'
    rows.append({'vector':vector,'normal':normal,**({'planeId':plane_id,'origin':origin,'tile':tile,'cached':cached} if a.distance else {}),'result':(m.reg_read(UC_X86_REG_AX)+32768)%65536-32768})
with a.output.open('x') as f:json.dump(rows,f)
print('Generated '+str(cases)+' original MS91 plane '+('distance' if a.distance else 'normal')+' outputs')
