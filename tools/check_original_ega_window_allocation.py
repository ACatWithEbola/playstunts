"""Execute complete EGA window allocation with real allocator and descriptor writes."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
editions=[];cases=0
for path,seg,entry,data_seg,firstfield,top in [(a.legacy,0x209e,0x98ca,0x3209,0x4b12,0x9a40),(a.modern,0x20e5,0x9a4e,0x32a9,0x4bc0,0x9bc4)]:
 image=path.read_bytes();edition=[]
 for width,height,mask in itertools.product([8,200,320],[1,8,100,200],[1,5,15]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);d=data_seg*16;offset=top+2;descriptor_bytes=(height+15)*2
  def put(at,value):m.mem_write(d+at,struct.pack('<H',value))
  for at,value in [(firstfield,0x1000),(firstfield+2,0x1000),(firstfield+4,0x1100),(firstfield+6,0x1100),(0x100c,0),(0x100e,0x7000),(0x1010,1),(0x110e,0xf000),(0x1110,0)]:put(at,value)
  m.mem_write(seg*16+top,struct.pack('<H',offset));m.mem_write(seg*16+offset,bytes([0x7d])*descriptor_bytes);m.mem_write(0x70000,bytes([0xa5])*40000)
  m.mem_write(d+0xf000,struct.pack('<5H',0x1000,0,width,height,mask))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,data_seg),(UC_X86_REG_SS,data_seg),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entry,0x1000,count=20000)
  assert m.reg_read(UC_X86_REG_SP)==0xf004 and (m.reg_read(UC_X86_REG_AX),m.reg_read(UC_X86_REG_DX))==(offset,seg)
  descriptor=bytearray(m.mem_read(seg*16+offset,descriptor_bytes));struct.pack_into('<H',descriptor,10,(struct.unpack_from('<H',descriptor,10)[0]-offset)&65535)
  pages=struct.unpack('<H',m.mem_read(d+0x101e,2))[0]
  edition.append({'width':width,'height':height,'mask':mask,'pages':pages,'bitmapHeader':bytes(m.mem_read(0x70000,16)).hex(),'descriptor':descriptor.hex()});cases+=1
 editions.append(edition);assert path.read_bytes()==image
assert editions[0]==editions[1]
with a.output.open('x') as out:json.dump(editions[0],out)
print(json.dumps({'originalEgaWindowCases':cases,'bothEditionsDescriptorsAndBitmapHeadersMatch':True,'realAllocatorExecuted':True,'pass':True}))
