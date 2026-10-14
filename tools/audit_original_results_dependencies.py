"""Bounded result helper inventory; body discovery alone is not acceptance."""
import argparse,json,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--legacy-display',type=Path)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
command=[sys.executable,str(Path(__file__).with_name('audit_original_results_inventory.py')),str(a.legacy),str(a.modern),'--libraries',str(a.libraries)]
if a.legacy_display:command+=['--legacy-display',str(a.legacy_display)]
inventory=json.loads(subprocess.check_output(command,text=True))
def discover(path,target,far):
 values=[int(value.strip(),16) for value in target.split(',')];base=values[0]*16 if far else 0;start=values[-1]
 image=path.read_bytes();ops=[];targets=set();indirect=False
 for op in d.disasm(image[base+start:base+start+8192],start):
  ops.append(op)
  if op.mnemonic.startswith(('j','loop')):
   try:targets.add(int(op.op_str,16))
   except ValueError:indirect=True
  if op.mnemonic=='retf' and not indirect:
   bounds={item.address for item in ops}
   if targets<=bounds:break
  # Out-of-line blocks can follow every RETF and jump back to a shared
  # epilogue. Stop at a verified next prologue, not the next function's RETF.
  if op.mnemonic=='jmp' and not indirect and any(item.mnemonic=='retf' for item in ops):
   bounds={item.address for item in ops};next_at=op.address+op.size
   next_prologue=image[base+next_at:base+next_at+3]==bytes.fromhex('558bec')
   padded_prologue=image[base+next_at:base+next_at+4]==bytes.fromhex('90558bec')
   if targets<=bounds and (next_prologue or padded_prologue):break
 else:return {'status':'boundary unresolved','start':hex(start),'decodedInstructions':len(ops)}
 calls=[{'at':hex(op.address),'instruction':op.mnemonic,'target':op.op_str} for op in ops if op.mnemonic in ('call','lcall','int')]
 return {'status':'branch-closed return candidate','start':hex(start),'bytes':ops[-1].address+ops[-1].size-start,'instructions':len(ops),'returnKind':ops[-1].mnemonic,'calls':calls,'callsNeedClassification':bool(calls),'wholeBodyEquivalent':False}
rows=[]
for row in inventory['operandCandidates']:
 if row['instruction'] not in ('call','lcall') or 'classification' in row:continue
 legacy_path=a.legacy;legacy_target=row['legacy']
 if a.legacy_display:
  legacy_path=a.legacy_display;site=int(row['sites'][0][0],16);image=legacy_path.read_bytes()
  caller=next(d.disasm(image[site:site+5],site));assert caller.mnemonic==row['instruction'],('Like-for-like caller misaligned',hex(site))
  legacy_target=caller.op_str
 if row['instruction']=='call':
  # Compiler emits PUSH CS + near CALL to invoke a far-return routine.
  # Confirm both actual callers; do not mistake this for a RET ABI.
  for path,site in [(legacy_path,int(row['sites'][0][0],16)),(a.modern,int(row['sites'][0][1],16))]:
   assert path.read_bytes()[site-1]==0x0e,('Near-to-far caller must push CS',hex(site))
 rows.append({'canonicalLegacyTarget':row['legacy'],'legacyTarget':legacy_target,'modernTarget':row['modern'],'legacy':discover(legacy_path,legacy_target,row['instruction']=='lcall'),'modern':discover(a.modern,row['modern'],row['instruction']=='lcall')})
print(json.dumps({'pendingHelperReferences':len(rows),'likeForLikeDisplayReferences':bool(a.legacy_display),'helpers':rows,'wholeItemAccepted':False}))
