"""Read-only 16-bit routine inspection using existing reconstruction libraries."""
import argparse,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('offset',type=lambda s:int(s,0));p.add_argument('--length',type=int,default=768);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args()
sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
code=a.image.read_bytes()[a.offset:a.offset+a.length]
for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(code,a.offset):
 print(f'{ins.address:06x} {ins.bytes.hex():18} {ins.mnemonic:8} {ins.op_str}')
