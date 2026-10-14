"""Complete type-1 decoder and both near-helper tails."""
import argparse,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);rows=[]
for index,(path,base,start) in enumerate([(a.legacy,0x209e0,0x213c),(a.modern,0x20e50,0x213e)]):
 image=path.read_bytes();ops=list(d.disasm(image[base+start:base+start+535],start));assert sum(i.size for i in ops)==535 and ops[-1].mnemonic=='jmp'
 assert image[base+start+535:base+start+538]==bytes.fromhex('558bec')
 anchors={i.address:n for n,i in enumerate(ops)};row=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic.startswith(('j','loop')) or i.mnemonic=='call':
   assert int(operand,16) in anchors;operand='instruction:'+str(anchors[int(operand,16)])
  elif i.mnemonic=='lcall':
   assert operand==('0x209e, 0x276d' if index==0 else '0x20e5, 0x27b1');operand='verified-backward-paragraph-mover'
  else:assert i.mnemonic not in ('int','ljmp')
  row.append((i.mnemonic,operand))
 rows.append(row)
assert rows[0]==rows[1]
print(json.dumps({'type1DecoderBytes':535,'pairedInstructions':len(rows[0]),'twoNearHelpersIncluded':True,'allBranchesClosed':True,'completeBodyMatches':True,'executionNotInferred':True,'pass':True}))
