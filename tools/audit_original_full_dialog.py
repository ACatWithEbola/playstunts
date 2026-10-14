"""Complete branch-closed dialog diff inventory; discovery is not acceptance."""
import argparse,difflib,hashlib,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);bodies=[];scopes=[]
for path,start,end in [(a.legacy,0x1e0,0x953),(a.modern,0x1e4,0xa57)]:
 image=path.read_bytes();chunk=image[0x198d0+start:0x198d0+end];ops=list(d.disasm(chunk,start));assert sum(i.size for i in ops)==len(chunk)
 assert image[0x198d0+end:0x198d0+end+3]==bytes.fromhex('558bec') or image[0x198d0+end:0x198d0+end+4]==bytes.fromhex('90558bec')
 bounds={i.address for i in ops}
 for i in ops:
  if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in bounds
 assert ops[-1].mnemonic=='jmp' and any(i.mnemonic=='retf' for i in ops)
 bodies.append(ops);scopes.append({'start':hex(start),'end':hex(end),'bytes':len(chunk),'instructions':len(ops),'sha256':hashlib.sha256(chunk).hexdigest()})
key=lambda i:(i.mnemonic,re.sub(r'0x[0-9a-f]+','ADDR',i.op_str))
groups=[];mapping={};pairs=[]
for tag,x,y,z,w in difflib.SequenceMatcher(None,list(map(key,bodies[0])),list(map(key,bodies[1])),autojunk=False).get_opcodes():
 if tag=='equal':
  for old,new in zip(bodies[0][x:y],bodies[1][z:w]):mapping[old.address]=new.address;pairs.append((old,new))
 else:groups.append({'id':len(groups)+1,'tag':tag,'legacy':[(hex(i.address),i.mnemonic,i.op_str) for i in bodies[0][x:y]],'modern':[(hex(i.address),i.mnemonic,i.op_str) for i in bodies[1][z:w]],'classification':None})
branches=[];operands={}
for old,new in pairs:
 if old.mnemonic.startswith(('j','loop')):branches.append({'legacy':hex(old.address),'modern':hex(new.address),'targets':[old.op_str,new.op_str],'mapped':mapping.get(int(old.op_str,16))==int(new.op_str,16)})
 elif old.op_str!=new.op_str:
  row=operands.setdefault((old.mnemonic,old.op_str,new.op_str),{'instruction':old.mnemonic,'legacy':old.op_str,'modern':new.op_str,'sites':[]});row['sites'].append([hex(old.address),hex(new.address)])
classified={
 1:('','0x1ed','New null normal-font far-pointer guard returns -1 before services; cached row height is fontHeight+2; eight original guard cases and layout corpora verify paths'),
 2:('0x247','0x269','Measurement accumulates font-height+2 pixels per ] and adds a measured } group with four-pixel gap; original layout/content corpora verify native geometry'),
 3:('0x271','0x2d9','Equivalent NUL-loop test expressed as JE exit plus JMP body instead of JNE body; complete prefix execution covers terminated and unterminated lines'),
 4:('0x29d','0x308','Centered Y changes from 200-lineCount*10 to 200-contentHeight; bounded original centered/explicit layout corpora match native'),
 5:('0x2ce','0x32d','Bottom bound changes from Y+lineCount*10 to Y+contentHeight; original bounds and outline requests match native'),
 6:('0x2ff','0x354','Backdrop capture call relocated; complete277/284-byte helper classification identifies only depth==3 guard, equivalent availability failure branch and retained ES reuse; native owner uses explicit full-screen capture adaptation'),
 7:('0x309','0x35e','Backdrop failure jumps to the shared -1 epilogue instead of duplicating it; original guard cases verify AX/SP/SI/DI restoration'),
 8:('0x339','0x388','Outline bottom changes from Y+lineCount*10 to Y+contentHeight; original outline request comparisons cover supplied and larger menus'),
 9:('','0x3ac','Sequence-aligner insertion contains relocated outline plus added identical font-color setup; explicit call correspondence and complete drawing-request corpus verify outline and both color calls'),
 10:('0x36c','0x3c0','Stack cleanup now belongs to the added four-byte color arguments; retained background3426 explicitly reset0 before content, verified with incoming nonzero sentinel'),
 11:('0x3d6','0x430','Text row advance changes from fixed10 to cached fontHeight+2; original content comparisons at four heights match native'),
 12:('','0x456','New } content-line flush draws accumulated text and advances four pixels; subsequent @ field test relocated, captured text/field corpora match native'),
 13:('0x3fe','0x492','Field index*2 plus caller table pointer computed before measurement in retained SI; buffer terminator uses DI instead of SI; measured field positions match'),
 14:('0x415','0x4b5','Field X stores measured AX directly through retained SI instead of recomputing index and keeping width in CX; same effective table entry'),
 15:('0x438','0x4be','Field Y store uses retained table-entry SI+2 instead of BX+SI+2; same indexed field address and original captured field coordinates'),
 16:('','0x531','Choice index*2+BP computed once in retained DI before measurement; measurement helper preserves DI and original choice rectangles match'),
 17:('0x4ba','0x546','Choice top uses retained DI and temporary AX; bottom changes from top+10 to top+fontHeight+2; complete hit-area corpus verifies supplied larger menus'),
 18:('0x4fb','','Removed NOP padding, no state or control effect'),
 19:('0x501','0x581','Equivalent next-choice [ predicate uses inverted short branch plus long jump to parser exit; actual multi-choice content execution matches native'),
 20:('0x528','0x5ab','Choice ] row advance uses fontHeight+2 and new } group flush advances three pixels; original choice hit-area corpora verify both delimiter paths'),
 21:('0x557','0x60d','Equivalent choice-parser NUL exit rewritten JE exit plus JMP loop instead of JNE loop; whole content execution covers terminated choice groups'),
 22:('0x5cd','','Removed NOP padding, no state or control effect'),
 23:('','0x72d','Modern initial disabled-choice scan advances with wrap until an enabled entry; original startup-selection and native lifecycle tests verify this change'),
 24:('0x6be','','Removed NOP padding, no state or control effect'),
 25:('0x73b','0x825','Selected-choice foreground reads retained background3426 instead of fixed0; full dialog resets it0 and original choice color requests match native; external reentrant mutation not inferred'),
 26:('0x740','0x82b','Unselected-choice background reads retained3426 instead of fixed0 with NOP alignment; full setup zero reset and original color-request corpus verify supplied path'),
 27:('0x76f','','Removed NOP padding, no state or control effect'),
 28:('0x7e2','0x8ce','Disabled-choice background reads retained3426 instead of fixed0; full setup resets0 and disabled-choice color requests match native'),
 29:('','0x8d9','Added NOP padding, no state or control effect'),
 30:('0x8b2','0x9a0','Equivalent down-key predicate uses inverted short branch plus long jump; original input iteration corpus including ten choices verifies same key dispatch'),
 31:('','0x9b8','Modern up-key decrements nonzero selected index before common disabled-choice loop; original wrapping/navigation corpus verifies'),
 32:('0x8c8','0x9c6','Modern up-key wraps zero selection to count-1 instead of legacy clamp; versioned native path and original wrap/input corpora verify'),
 33:('0x903','0x9fd','Modern down-key increments below last index and branches to zero-wrap otherwise; original wrapped input corpus verifies signed-byte conditions'),
 34:('0x908','0xa05','Modern down-key wraps last index to zero instead of legacy clamp; existing versioned dialog input and original corpora verify'),
 35:('0x929','','Removed NOP padding, no state or control effect'),
 36:('0x93f','0xa3d','Equivalent up-direction repeat predicate uses inverted short branch plus JMP to the new wrap-aware loop; original disabled-choice input corpus verifies'),
 37:('0x944','0xa45','Equivalent second up-direction repeat predicate uses inverted short branch plus JMP to wrap-aware loop; original key/navigation corpus verifies'),
}
for group in groups:
 if group['id'] not in classified:continue
 old,new,note=classified[group['id']];assert (group['legacy'][0][0] if group['legacy'] else '')==old and (group['modern'][0][0] if group['modern'] else '')==new
 group['classification']=note
old_image,new_image=a.legacy.read_bytes(),a.modern.read_bytes()
old_ops={i.address:i for i in bodies[0]};new_ops={i.address:i for i in bodies[1]}
assert [(i.address,i.op_str) for i in bodies[1] if i.mnemonic=='mov' and i.op_str.startswith('word ptr [0x3426]')]==[(0x3c3,'word ptr [0x3426], 0')]
# The shape-only sequence matcher deliberately hides literals, so extra calls
# and delimiter handling can align with the wrong common instruction. Verify
# semantic counterparts explicitly rather than inventing a version difference.
assert (old_ops[0x367].mnemonic,old_ops[0x367].op_str)==('lcall','0x2cbd, 0xc')
assert (new_ops[0x3ac].mnemonic,new_ops[0x3ac].op_str)==('lcall','0x2d1d, 8')
assert (new_ops[0x3bb].mnemonic,new_ops[0x3bb].op_str)==('lcall','0x20e5, 0x92b8')
assert old_ops[0x3f2].op_str=='byte ptr es:[bx], 0x40' and new_ops[0x486].op_str=='byte ptr es:[bx], 0x40'
assert new_ops[0x450].op_str=='byte ptr es:[bx], 0x7d'
branch_notes={
 ('0x215','0x237'):('0x24e','0x274','Non-] measurement path now enters inserted } group measurement before ordinary characters; complete original layout corpora verify delimiter behavior'),
 ('0x3f6','0x454'):('0x44e','0x482','Alignment artifact: old @-test branch corresponds to modern48A, not inserted }-test branch454; explicit semantic sites and original editable-field corpus verify'),
 ('0x508','0x58b'):('0x530','0x5b6','Non-] choice path now enters inserted } three-pixel group handling; original complete choice rectangles verify changed destination'),
 ('0x735','0x81f'):('0x740','0x82c','Unselected choice skips inverse colors and enters retained-zero background path; original choice color request corpus verifies'),
 ('0x7dd','0x8c9'):('0x7e2','0x8ce','Disabled choice enters retained-zero background path rather than explicit AX-zero sequence; full setup resets background and original color corpus verifies'),
 ('0x8ee','0x9e8'):('0x8c8','0x9b8','Disabled-choice up repeat enters modern wrap-aware decrement rather than legacy clamp block; original wrapped/disabled navigation corpus verifies'),
 ('0x905','0xa03'):('0x707','0xa0b','Down-edge branch now reaches disabled-choice checking after modern wrap instead of legacy clamped redraw; versioned original input corpus verifies'),
}
for row in branches:
 if row['mapped']:continue
 key_pair=(row['legacy'],row['modern']);assert key_pair in branch_notes
 old_target,new_target,note=branch_notes[key_pair];assert row['targets']==[old_target,new_target]
 row['classification']=note
 if key_pair==('0x3f6','0x454'):
  assert old_ops[0x3f6].mnemonic==new_ops[0x48a].mnemonic=='jne' and new_ops[0x48a].op_str=='0x4d4'
  row['semanticCounterpart']=['0x3f6','0x48a'];row['semanticTargets']=['0x44e','0x4d4']
assert old_image[0x32090+0x37a1:0x32090+0x38a1]==new_image[0x32a90+0x384f:0x32a90+0x394f]
for old,new in [(0x4e8a,0x507a),(0x4ec0,0x50b0)]:assert old_image[0x32090+old:0x32090+old+2]==new_image[0x32a90+new:0x32a90+new+2]
calls={('call',old,new) for old,new in [('0x1820','0x1920'),('0x1808','0x1908'),('0x2b5e','0x2df2'),('0x122e','0x132e'),('0x194e','0x1a4e')]}
calls|={('lcall',old,new) for old,new in [('0x209e, 0x3c99','0x20e5, 0x3e1f'),('0x209e, 0xa870','0x20e5, 0xa9f4'),('0x209e, 0x4f23','0x20e5, 0x50ab'),('0x209e, 0x4f8c','0x20e5, 0x5114'),('0x209e, 0x9130','0x20e5, 0x92b8'),('0x209e, 0x7ee5','0x20e5, 0x806d')]}
calls|={('call','0x120','0x124'),('call','0x18fa','0x19fa'),('lcall','0x209e, 0xf8','0x20e5, 0xfa')}
for row in operands.values():
 pair=(row['instruction'],row['legacy'],row['modern'])
 if pair==('lcall','0x2cbd, 0xc','0x20e5, 0x92b8'):
  row['classification']='Alignment artifact: old367 outline matches modern3AC outline, not modern3BB added color setter; verified explicit target instructions and original drawing-request captures'
  row['semanticCounterpart']=['0x367','0x3ac']
 elif pair==('cmp','byte ptr es:[bx], 0x40','byte ptr es:[bx], 0x7d'):
  row['classification']='Alignment artifact: old3F2 @ test matches modern486 @ test; modern450 is the inserted } delimiter test, verified by full content/field captures'
  row['semanticCounterpart']=['0x3f2','0x486']
 elif pair in calls:row['classification']='Relocated shared cursor/counter/input/measurement/drawing service; complete helper proofs linked by results inventory, hardware acceptance separate'
 elif row['instruction'] in ('cmp','mov') and row['legacy'].startswith('byte ptr [bp - 0x1d6]') and row['modern'].startswith('byte ptr [bp - 0x1d8]'):row['classification']='Current-character scratch shifts two bytes for the new cached row-height local; layout/content execution verifies all three parser uses'
 elif pair==('sub','sp, 0x1d6','sp, 0x1d8'):row['classification']='Two-byte stack-frame growth for cached fontHeight+2 row-height word; original early-return and layout executions preserve caller state'
 elif pair==('test','byte ptr [bx + 0x37a1], 1','byte ptr [bx + 0x384f], 1'):row['classification']='Byte-identical256-byte character-classification table relocation; original shortcut/input corpus verifies behavior'
 elif pair in [('push','word ptr [0x4e8a]','word ptr [0x507a]'),('push','word ptr [0x4ec0]','word ptr [0x50b0]')]:row['classification']='Retained text/disabled color field relocation; original default words equal and actual color-request corpora verify modern service values'
print(json.dumps({'scopes':scopes,'structuralGroups':groups,'pairedBranches':branches,'operandCandidates':list(operands.values()),'remainingStructuralGroups':sum(g['classification'] is None for g in groups),'remainingOperandCandidates':sum('classification' not in r for r in operands.values()),'remainingBranchCorrespondences':sum(not r['mapped'] and 'classification' not in r for r in branches),'wholeDialogAccepted':False}))
