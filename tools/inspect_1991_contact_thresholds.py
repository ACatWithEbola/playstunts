"""Locate contact-threshold instructions in original images, read-only.

Instruction candidates require surrounding routine inspection; counts alone do
not prove behavior or equivalence.
"""
import argparse,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('images',type=Path,nargs='+');p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
decoder=Cs(CS_ARCH_X86,CS_MODE_16)
for path in a.images:
 image=path.read_bytes();print(path)
 for label,immediate in [('landing crash',23275),('landing sound',250),('corkscrew width',150),('corkscrew height',265)]:
  matches=[]
  for offset in range(len(image)-6):
   if image[offset]!=0x81:continue
   ins=next(decoder.disasm(image[offset:offset+8],offset,count=1),None)
   if ins and ins.mnemonic=='cmp' and ins.op_str.endswith(', '+hex(immediate)):
    matches.append((hex(offset),ins.op_str,ins.bytes.hex()))
  print(label,matches)
