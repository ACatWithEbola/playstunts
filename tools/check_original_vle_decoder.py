"""Execute original type-2 decoder on deterministic partial lookup tables."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--plain-only',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0
for path,seg,entry in [(a.legacy,0x209e,0x41d2),(a.modern,0x20e5,0x4358)]:
 image=path.read_bytes()
 for size,additive in itertools.product([1,7,8,9,255,1024],[False] if a.plain_only else [False,True]):
  symbols=[int(i%3==1) for i in range(size)];bits=[bit for symbol in symbols for bit in ([1,0] if symbol else [0])];stream=bytearray((len(bits)+7)//8)
  for i,bit in enumerate(bits):stream[i//8]|=bit<<(7-i%8)
  packed=bytes([2,size&255,(size>>8)&255,size>>16,2|int(additive)*128,1,1,0x11,0xf0])+stream+bytes(16)
  expected=bytearray();previous=0
  for bit in symbols:
   value=0xf0 if bit else 0x11;previous=(previous+value)&255 if additive else value;expected.append(previous)
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x70000,packed);m.mem_write(0x80000,bytes([0xa5])*(size+16))
  m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,0,0x7000,0,0x8000))
  trace=[]
  def trace_additive(uc,address,length,user):
   if additive and size==7 and address==seg*16+entry+(0x4516-0x4358):trace.append([uc.reg_read(UC_X86_REG_AL),uc.reg_read(UC_X86_REG_CH),uc.reg_read(UC_X86_REG_DX)])
  m.hook_add(UC_HOOK_CODE,trace_additive)
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0xaaaa),(UC_X86_REG_DI,0xbbbb)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entry,0x1000,count=300000)
  assert bytes(m.mem_read(0x80000,size))==expected,(size,additive,bytes(m.mem_read(0x80000,min(size,8))).hex(),expected[:8].hex(),trace)
  assert bytes(m.mem_read(0x80000+size,16))==bytes([0xa5])*16
  assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_DS)==0x6000
  assert m.reg_read(UC_X86_REG_SI)==0xaaaa and m.reg_read(UC_X86_REG_DI)==0xbbbb;cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalVleCases':cases,'bothEditions':True,'additiveVerified':not a.plain_only,'decodedBytesAndOutputTailMatch':True,'sourcesUnchanged':True,'pass':True}))
