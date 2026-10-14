"""Run the modern initializer's four-byte copy, including offset wrapping.

No music hardware, file services, or live storage is involved.
"""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.modern.read_bytes();base=0x2e0e0;start=0x1464;size=71
ops=list(Cs(CS_ARCH_X86,CS_MODE_16).disasm(image[base+start:base+start+size],start))
assert sum(i.size for i in ops)==size and ops[-1].mnemonic=='retf'
assert not any(i.mnemonic.startswith(('j','loop','call','lcall','int')) for i in ops)
cases=0
for source,destination,value in itertools.product([0,1,65532,65533,65534,65535],[0,1,65532,65533,65534,65535],[0,1,0x89abcdef,0xffffffff]):
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 payload=struct.pack('<I',value)
 for index,byte in enumerate(payload):m.mem_write(0x70000+((source+index)&65535),bytes([byte]))
 m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,destination,0x8000,source,0x7000))
 for reg,val in [(UC_X86_REG_CS,0x2e0e),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0x1234)]:m.reg_write(reg,val)
 m.emu_start(base+start,0x1000,count=1000)
 assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000
 actual=bytes(m.mem_read(0x80000+((destination+i)&65535),1)[0] for i in range(4))
 assert actual==payload
 assert m.reg_read(UC_X86_REG_BP)==0x1234 and m.reg_read(UC_X86_REG_SP)==0xf004
 cases+=1
assert a.modern.read_bytes()==image
print(json.dumps({'originalCases':cases,'completeBodyBytes':size,'instructions':len(ops),'fourByteCopyAndOffsetWrapVerified':True,'sourceBinaryUnchanged':True,'noAudioOrFiles':True,'pass':True}))
