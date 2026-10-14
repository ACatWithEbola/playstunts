"""Bounded disassembly of verified reference BIOS; no ROM copied into app."""
import argparse, hashlib, sys
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('bios',type=Path)
p.add_argument('--libraries',type=Path,required=True)
p.add_argument('--offset',type=lambda value:int(value,0),required=True)
p.add_argument('--bytes',type=int,default=256)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
source=a.bios.read_bytes()
assert hashlib.sha256(source).hexdigest()=='a3a79791ed4ca85c4206412a2138ca8587e616dad2282a22812ccd6eac6c3c71'
assert 0<=a.offset<len(source) and 0<a.bytes<=2048
for instruction in Cs(CS_ARCH_X86,CS_MODE_16).disasm(source[a.offset:a.offset+a.bytes],a.offset):
 print(f'{instruction.address:04x}: {instruction.mnemonic} {instruction.op_str}')
