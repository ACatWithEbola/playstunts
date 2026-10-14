"""Branch-closed complete result routine inventory, including post-return blocks."""
import argparse,difflib,hashlib,json,re,sys,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--legacy-display',type=Path)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);bodies=[];scopes=[]
for path,start,end in [(a.legacy,0x58d4,0x6c0e),(a.modern,0x58d2,0x6c29)]:
 image=path.read_bytes();assert image[start:start+9]==bytes.fromhex('558bec81ec9e005756');assert image[end:end+3]==bytes.fromhex('558bec')
 ops=list(d.disasm(image[start:end],start));assert sum(op.size for op in ops)==end-start
 bounds={op.address for op in ops}
 for op in ops:
  if op.mnemonic.startswith(('j','loop')):assert int(op.op_str,16) in bounds
 bodies.append(ops);scopes.append({'start':hex(start),'end':hex(end),'bytes':end-start,'instructions':len(ops),'sha256':hashlib.sha256(image[start:end]).hexdigest(),'returnPaths':sum(op.mnemonic=='retf' for op in ops)})
key=lambda op:(op.mnemonic,re.sub(r'0x[0-9a-f]+','ADDR',op.op_str))
groups=[];operands={};mapping={};pairs=[]
for tag,x,y,z,w in difflib.SequenceMatcher(None,list(map(key,bodies[0])),list(map(key,bodies[1])),autojunk=False).get_opcodes():
 if tag=='equal':
  for old,new in zip(bodies[0][x:y],bodies[1][z:w]):pairs.append((old,new));mapping[old.address]=new.address
 else:groups.append({'tag':tag,'legacy':[(hex(op.address),op.mnemonic,op.op_str) for op in bodies[0][x:y]],'modern':[(hex(op.address),op.mnemonic,op.op_str) for op in bodies[1][z:w]]})
branches=[]
for old,new in pairs:
 if old.mnemonic.startswith(('j','loop')):branches.append({'legacy':hex(old.address),'modern':hex(new.address),'mapped':mapping.get(int(old.op_str,16))==int(new.op_str,16),'targets':[old.op_str,new.op_str]})
 elif old.op_str!=new.op_str:
  row=operands.setdefault((old.mnemonic,old.op_str,new.op_str),{'instruction':old.mnemonic,'legacy':old.op_str,'modern':new.op_str,'sites':[]});row['sites'].append([hex(old.address),hex(new.address)])
structural_groups={
 ('0x61e2',''):'portrait signed halving: legacy truncation versus modern floor;131072 original arithmetic cases',
 ('','0x6285'):'padding only',
 ('0x67a5','0x67a1'):'first button text inset now table edge+1 instead of5;default edge table4 verified',
 ('0x67d4','0x67d1'):'second button text inset now table edge+1 instead of85;default edge84 verified',
 ('0x67ff',''):'removed padding',
 ('0x6837','0x6835'):'third button text inset now table edge+1 instead of165;default edge164 verified',
 ('0x6866','0x6866'):'fourth button text inset now table edge+1 instead of245;default edge244 verified',
 ('0x6be5','0x6be7'):'left-edge result-menu wrap to3;168 original input-block cases',
 ('0x6bf5','0x6bf5'):'left decrement versus wrap branch reorganization;168 original cases including signed-byte edges',
 ('0x6c01','0x6c03'):'right-edge branch to versioned wrap block;168 original cases',
 ('','0x6c0c'):'right wrap to first available selection0/1;168 original cases',
}
assert len(groups)==len(structural_groups)
for group in groups:
 pair=(group['legacy'][0][0] if group['legacy'] else '',group['modern'][0][0] if group['modern'] else '')
 assert pair in structural_groups,group
 group['classification']=structural_groups[pair]
exceptions=[row for row in branches if not row['mapped']]
assert [(row['legacy'],row['modern'],row['targets']) for row in exceptions]==[('0x6be3','0x6be5',['0x6be8','0x6bf7']),('0x6bfa','0x6bfb',['0x6be8','0x68e2'])]
for row in exceptions:row['classification']='result-menu wrap/decrement rearrangement;direct original input-block oracle168 cases'
saved_stats=0;resource_strings=0;context_fields=0;result_tables=0;identical_helpers=0;runtime_helpers=0
runtime_helper_evidence={
 ('0x198d, 0x2322','0x198d, 0x23a0'):'complete MS91 time formatter4052 original cases and12156 retained words;compare_original_ms91_result_time.ts',
 ('0x198d, 0x214a','0x198d, 0x21c8'):'complete numeric field converter2000 original padding/truncation cases;check_original_ms91_time_fields.py',
}
rng_rows=[]
for path,base,start,field in [(a.legacy,0xbb80,0xbb,0x9f5c),(a.modern,0xc1e0,0xbf,0xa64e)]:
 data=path.read_bytes();ops=list(d.disasm(data[base+start:base+start+78],start))
 assert sum(op.size for op in ops)==78 and ops[-1].mnemonic=='retf'
 anchors={op.address:index for index,op in enumerate(ops)};normalized=[]
 for op in ops:
  assert op.mnemonic not in ('call','lcall','int')
  operand=op.op_str
  if op.mnemonic.startswith('j'):operand='instruction:'+str(anchors[int(operand,16)])
  elif 'ptr [' in operand:
   match=re.search(r'0x[0-9a-f]+',operand);assert match
   value=int(match[0],16);assert field<=value<field+6
   operand=operand[:match.start()]+'RNG'+str(value-field)+operand[match.end():]
  normalized.append((op.mnemonic,operand))
 rng_rows.append(normalized)
assert rng_rows[0]==rng_rows[1],'Random-selection helper changed outside explicit six-byte state relocation'
runtime_helper_evidence[('0xbb8, 0xbb','0xc1e, 0xbf')]='complete78-byte RNG helper compared under six-byte state/branch relocations, no transitive calls'
font_rows=[]
for path,base,start,field in [(a.legacy,0x209e0,0x3c99,0x4dd2),(a.modern,0x20e50,0x3e1f,0x4eb0)]:
 data=path.read_bytes();ops=list(d.disasm(data[base+start:base+start+67],start))
 assert sum(op.size for op in ops)==67 and ops[-1].mnemonic=='retf'
 anchors={op.address:index for index,op in enumerate(ops)};normalized=[]
 for op in ops:
  assert op.mnemonic not in ('call','lcall','int')
  operand=op.op_str
  if op.mnemonic.startswith('j'):operand='instruction:'+str(anchors[int(operand,16)])
  elif op.mnemonic=='mov' and operand.startswith('es, word ptr ['):
   assert operand==f'es, word ptr [{hex(field)}]';operand='es, selected-font-segment'
  normalized.append((op.mnemonic,operand))
 font_rows.append(normalized)
assert font_rows[0]==font_rows[1],'Font measurement helper changed outside retained-font/branch relocations'
runtime_helper_evidence[('0x209e, 0x3c99','0x20e5, 0x3e1f')]='complete67-byte font measurement body, selected-font field and branches explicitly relocated; no transitive calls'
for old_start,new_start,size,fields,label in [
 (0x21dc,0x225a,19,{0xa32c:0xaa20,0xa316:0xaa0a,0x9008:0x96fe},'three retained input/flash words reset'),
 (0x18fa,0x19fa,83,{0x132:0x190,0xa77c:0xae70,0xa7de:0xaed2},'selected input-state counter read'),
]:
 normalized=[]
 for index,(path,start) in enumerate([(a.legacy,old_start),(a.modern,new_start)]):
  image=path.read_bytes();ops=list(d.disasm(image[0x198d0+start:0x198d0+start+size],start))
  assert sum(op.size for op in ops)==size and ops[-1].mnemonic=='retf'
  anchors={op.address:i for i,op in enumerate(ops)};rows=[]
  for op in ops:
   assert op.mnemonic not in ('call','lcall','int')
   operand=op.op_str
   if op.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)])
   elif index==0:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
   rows.append((op.mnemonic,operand))
  normalized.append(rows)
 assert normalized[0]==normalized[1],label
 runtime_helper_evidence[(f'0x198d, {hex(old_start)}',f'0x198d, {hex(new_start)}')]=f'complete{size}-byte {label}; explicit field/branch relocations, no transitive calls'
helper_bodies={}
copy_rows=[]
for path,start,reload in [(a.legacy,0x1540,0x1564),(a.modern,0x1640,0x1664)]:
 image=path.read_bytes();ops=list(d.disasm(image[0x198d0+start:0x198d0+start+56],start))
 assert sum(op.size for op in ops)==56 and ops[-1].mnemonic=='retf'
 anchors={op.address:index for index,op in enumerate(ops)};normalized=[]
 for op in ops:
  assert op.mnemonic not in ('call','lcall','int')
  operand=op.op_str;mnemonic=op.mnemonic
  if op.address==reload:
   assert (mnemonic,operand)==(('les','bx, ptr [bp - 4]') if start==0x1540 else ('mov','bx, word ptr [bp - 4]'))
   mnemonic='reuse-source-offset';operand='source segment unchanged since LES SI'
  elif mnemonic.startswith('j'):operand='instruction:'+str(anchors[int(operand,16)])
  normalized.append((mnemonic,operand))
 copy_rows.append(normalized)
assert copy_rows[0]==copy_rows[1],'Resource copy changed beyond retained ES reload optimization'
runtime_helper_evidence[('0x198d, 0x1540','0x198d, 0x1640')]='complete56-byte resource copy; ES reuse equivalent for result text destination buffers disjoint from stack segment locals'
for old_start,new_start,size in [(0x169a,0x16a2,63),(0x16da,0x16e2,50),(0x1738,0x1740,27),(0x1d5a,0x1d62,97)]:
 old_bytes=a.legacy.read_bytes()[0x1ec10+old_start:0x1ec10+old_start+size]
 new_bytes=a.modern.read_bytes()[0x1f070+new_start:0x1f070+new_start+size]
 assert old_bytes==new_bytes
 ops=list(d.disasm(old_bytes,old_start));assert sum(op.size for op in ops)==size and ops[-1].mnemonic=='retf'
 bounds={op.address for op in ops}
 for op in ops:
  assert op.mnemonic not in ('call','lcall','int')
  if op.mnemonic.startswith(('j','loop')):assert int(op.op_str,16) in bounds
 helper_bodies[(f'0x1ec1, {hex(old_start)}',f'0x1f07, {hex(new_start)}')]=size
path_rows=[]
for index,(path,start,separator) in enumerate([(a.legacy,0x102e,0x337b),(a.modern,0x110c,0x3450)]):
 image=path.read_bytes();ops=list(d.disasm(image[0x198d0+start:0x198d0+start+119],start))
 assert sum(op.size for op in ops)==119 and ops[-1].mnemonic=='retf'
 data_base=0x2d1a0 if index==0 else 0x32a90
 assert image[data_base+separator:data_base+separator+2]==b'\\\0'
 anchors={op.address:i for i,op in enumerate(ops)};rows=[]
 calls={'0x1ec1, 0x16da':'copy','0x1ec1, 0x1738':'length','0x1ec1, 0x169a':'append'} if index==0 else {'0x1f07, 0x16e2':'copy','0x1f07, 0x1740':'length','0x1f07, 0x16a2':'append'}
 for op in ops:
  operand=op.op_str
  if op.mnemonic=='lcall':assert operand in calls;operand=calls[operand]
  elif op.mnemonic.startswith('j'):operand='instruction:'+str(anchors[int(operand,16)])
  elif operand==f'ax, {hex(separator)}':operand='ax, byte-identical DOS separator'
  else:assert op.mnemonic not in ('call','int')
  rows.append((op.mnemonic,operand))
 path_rows.append(rows)
assert path_rows[0]==path_rows[1],'Filename construction differs beyond explicitly verified calls/separator'
runtime_helper_evidence[('0x198d, 0x102e','0x198d, 0x110c')]='complete119-byte filename builder, branches and separator mapped; allthree transitive string primitives byte-identical and branch-closed'
if a.legacy_display:
 display=a.legacy_display.read_bytes();modern=a.modern.read_bytes()
 for site,old_target,new_start,size,fields,canonical_old,label in [
  (0x6261,'0x209e, 0x9130',0x92b8,29,{0x4dd2:0x4eb0},'0x209e, 0x5f60','selected-font EGA four-bit colour setter'),
  (0x657f,'0x209e, 0xa852',0xa9d6,30,{0x9112:0x929a},'0x209e, 0x6f4a','EGA clip-window retained-state reader'),
  (0x65be,'0x209e, 0x4f23',0x50ab,53,{0x912c:0x92b4,0x911e:0x92a6,0x912e:0x92b6,0x9120:0x92a8,0x9122:0x92aa,0x9124:0x92ac},'0x209e, 0x46d3','EGA clip-window setter including byte-unit coordinate shifts'),
  (0x6672,'0x209e, 0x4f8c',0x5114,352,
   {**{at:at+0x188 for at in (0x9114,0x911c,0x911e,0x9120,0x9122,0x9124,0x9126)},0x6eec:0x6d64},
   '0x209e, 0x4714','EGA retained-window block helper'),
 ]:
  caller=list(d.disasm(display[site:site+5],site));assert len(caller)==1 and (caller[0].mnemonic,caller[0].op_str)==('lcall',old_target)
  old_start=int(old_target.split(',')[1],16);results=[]
  for index,(image,base,start) in enumerate([(display,0x209e0,old_start),(modern,0x20e50,new_start)]):
   ops=list(d.disasm(image[base+start:base+start+size],start));assert sum(op.size for op in ops)==size
   # This block helper has an out-of-line tail jumping back to its RETF.
   # Require branch closure below, not a RETF as the final physical opcode.
   assert any(op.mnemonic=='retf' for op in ops)
   assert ops[-1].mnemonic==('jmp' if size==352 else 'retf')
   anchors={op.address:i for i,op in enumerate(ops)};rows=[]
   for op in ops:
    assert op.mnemonic not in ('call','lcall','int');operand=op.op_str
    if op.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)])
    elif index==0:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
    rows.append((op.mnemonic,operand))
   results.append(rows)
  assert results[0]==results[1],label
  runtime_helper_evidence[(canonical_old,f'0x20e5, {hex(new_start)}')]=f'complete{size}-byte like-for-like {label};explicit field/branch relocations,no calls;MCGA/EGA driver differences kept separate'
if a.legacy_display:
 # The underlying font selector only stores the supplied segment. Its height
 # wrapper and all clip/measurement dependencies below have complete proofs.
 selector=[]
 for index,(image,base,start) in enumerate([(display,0x209e0,0x91a2),(modern,0x20e50,0x932a)]):
  ops=list(d.disasm(image[base+start:base+start+11],start));assert sum(i.size for i in ops)==11 and ops[-1].mnemonic=='retf'
  selector.append([(i.mnemonic,i.op_str.replace('0x4dd2','0x4eb0') if not index else i.op_str) for i in ops])
 assert selector[0]==selector[1]
 for old_start,new_start,size,fields,calls,label in [
  (0x19d4,0x1ad4,17,{0x9798:0x9a30,0x9796:0x9a2e},{'0x209e, 0xa852':'0x20e5, 0xa9d6'},'select result window'),
  (0x19a6,0x1aa6,17,{0x9a42:0x9bc6,0x209e:0x20e5},{'0x209e, 0xa852':'0x20e5, 0xa9d6'},'restore screen window'),
  (0x19e6,0x1ae6,28,{0x9798:0x9a30,0x9796:0x9a2e},{'0x209e, 0xa852':'0x20e5, 0xa9d6','0x209e, 0x4f8c':'0x20e5, 0x5114'},'select and clear result window'),
  (0x2070,0x20ee,26,{}, {'0x209e, 0x3c99':'0x20e5, 0x3e1f'},'centred text position'),
  (0x22f4,0x2372,29,{0xa460:0xa6f6},{'0x209e, 0x91a2':'0x20e5, 0x932a'},'select font and cache height'),
  (0x2312,0x2390,16,{0x9f38:0xa2,0x9f36:0xa0},{'0x22f4':'0x2372'},'restore normal font'),
 ]:
  normalized=[]
  for index,(image,start) in enumerate([(display,old_start),(modern,new_start)]):
   ops=list(d.disasm(image[0x198d0+start:0x198d0+start+size],start));assert sum(i.size for i in ops)==size and ops[-1].mnemonic=='retf'
   rows=[]
   for i in ops:
    operand=i.op_str
    assert not i.mnemonic.startswith(('j','loop')) and i.mnemonic!='int'
    if i.mnemonic in ('call','lcall'):
     if not index:assert operand in calls;operand=calls[operand]
    elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
    rows.append((i.mnemonic,operand))
   normalized.append(rows)
  assert normalized[0]==normalized[1],label
  runtime_helper_evidence[(f'0x198d, {hex(old_start)}',f'0x198d, {hex(new_start)}')]=f'complete{size}-byte {label}; all nested clip/block/measurement/font selectors have complete body proofs'
if a.legacy_display:
 runtime_helper_evidence[('0x198d, 0x1a72','0x198d, 0x1b72')]='complete180/172-byte straight-line wrappers symbolically compared by audit_original_outlined_text.py;64 original request/bounds cases; nested EGA text body and colour/measurement bodies compared separately, hardware execution scope not inferred'
 for script,key in [('audit_original_bitmap_dispatch.py','codeAndEmbeddedTablesMatch'),('audit_original_rectangle_fill.py','completeCodeBodiesMatch')]:
  proof=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name(script)),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True));assert proof[key]
 kernels=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_bitmap_kernels.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert kernels['completeKernelBodiesMatched']==7 and kernels['pendingBodies']==0 and kernels['rectangleFillDependencyBodyCompared']
 for canonical_old,new in [('0x209e, 0x5010','0x20e5, 0x63d5'),('0x209e, 0x502e','0x20e5, 0x6407')]:
  runtime_helper_evidence[(canonical_old,new)]='complete like-for-like EGA raw-bitmap dispatcher/table/kernel/rectangle bodies checked;36 unclipped and81 clipped original software-plane pixel cases; no hardware-pixel claim'
 runtime_helper_evidence[('0x209e, 0x5236','0x20e5, 0x7dec')]='complete like-for-like EGA positioned compressed decoder, shared627-byte body and rectangle dependency compared;108 ordinary/243 clipped original software-plane cases; hardware and other operation variants not inferred'
 counter_rows=[]
 for index,(image,base,start) in enumerate([(display,0x209e0,0x3bf0),(modern,0x20e50,0x3d76)]):
  ops=list(d.disasm(image[base+start:base+start+29],start));assert len(ops)==11 and sum(i.size for i in ops)==29 and ops[-1].mnemonic=='retf'
  fields={0x4dcc:0x4eaa,0x4dce:0x4eac,0x407a:0x4128,0x407c:0x412a};rows=[]
  for i in ops:
   assert i.mnemonic not in ('call','lcall','int') and not i.mnemonic.startswith('j')
   operand=i.op_str if index else re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),i.op_str)
   rows.append((i.mnemonic,operand))
  counter_rows.append(rows)
 assert counter_rows[0]==counter_rows[1]
 for image,start,target in [(display,0x2b5e,'0x209e, 0x3bf0'),(modern,0x2df2,'0x20e5, 0x3d76')]:
  assert [(i.mnemonic,i.op_str) for i in d.disasm(image[0x198d0+start:0x198d0+start+6],start)]==[('lcall',target),('retf','')]
 runtime_helper_evidence[('0x198d, 0x2b5e','0x198d, 0x2df2')]='complete6-byte counter wrapper and29-byte nested unsigned counter delta body;288 actual original carry/wrap cases'
 cache_release=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_cache_release.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert cache_release['pass'] and [r['bytes'] for r in cache_release['routines']]==[19,169,83,59,80,181,109,274,72,32,144]
 runtime_helper_evidence[('0x209e, 0x3900','0x20e5, 0x3a86')]='complete80-byte bitmap allocation release including out-of-order fatal tail and matching message; nested discard body compared; fatal UI not inferred'
 runtime_helper_evidence[('0x209e, 0x2bd9','0x20e5, 0x2c1d')]='complete59-byte resource discard with shared verified missing-resource fatal tail; fatal UI remains separate'
 runtime_helper_evidence[('0x198d, 0x14e2','0x198d, 0x15e2')]='complete cache-release wrapper169-byte allocator and83-byte backward mover compared;12 original executions and6 native fixture cases; fatal UI excluded'
 lookup=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_result_resource_lookup.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert lookup['missingResourceMessagesMatched']==2 and all(r['completeBodyMatches'] for r in lookup['helpers'])
 for pair in [('0x198d, 0x150c','0x198d, 0x160c'),('0x209e, 0x2535','0x20e5, 0x2579'),('0x198d, 0x14f6','0x198d, 0x15f6')]:
  runtime_helper_evidence[pair]='complete221-byte resource lookup,51-byte localized identifier and22-byte explicit pointer wrapper compared;24 original modern lookup cases; fatal presentation remains separate'
 cursor=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('check_original_prompt_reset_state.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries),'--static-only'],text=True))
 assert cursor['completeHelperBodiesCompared']==5 and cursor['staticOnly'] and cursor['actualSaveRestoreCalls']==0
 text_dependencies=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_ega_text_dependencies.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert any(r['helper']=='drawing page restore' and r['completeBodyMatches'] for r in text_dependencies['helpers'])
 runtime_helper_evidence[('0x198d, 0x1820','0x198d, 0x1920')]='complete17-byte cursor cleanup and60-byte nested restore wrapper;32/28-byte state copies,33-byte page restore and raw bitmap dependencies compared separately; no hardware acceptance inferred'
 cursor_bitmaps=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_cursor_bitmap_entries.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert cursor_bitmaps['pass'] and cursor_bitmaps['backgroundCaptureCompleteBodyMatches'] and sum(len(r['kernels']) for r in cursor_bitmaps['helpers'])==32
 input_poll=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_result_input_poll.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert input_poll['pass'] and len(input_poll['helpers'])==7
 mouse_service=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('check_original_menu_mouse_service.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries),'--static-only'],text=True))
 assert mouse_service['bothBodiesMatch'] and mouse_service['staticOnly'] and mouse_service['actualWrapperCases']==0
 for pair in [('0x198d, 0x122e','0x198d, 0x132e'),('0x198d, 0x194e','0x198d, 0x1a4e')]:
  runtime_helper_evidence[pair]='complete UI poll/release bodies and input-service/cursor dependencies compared;512 original/native poll cases and384 mouse-wrapper cases; DOS hardware and custom callback execution remain explicit host-adaptation boundaries'
 runtime_helper_evidence[('0x198d, 0x1808','0x198d, 0x1908')]='complete24-byte cursor enable and139-byte cursor show wrapper; background311-byte capture,32 AND/OR kernels and drawing-state dependencies compared; hardware pixels not inferred'
 seed=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_result_misc_wrappers.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert seed['seedDependenciesCompared'] and seed['pass']
 dialog_capture=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_dialog_capture.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 dialog=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_full_dialog.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert dialog_capture['differenceClassificationComplete'] and dialog_capture['remainingGroups']==0
 assert dialog['remainingStructuralGroups']==dialog['remainingOperandCandidates']==dialog['remainingBranchCorrespondences']==0
 runtime_helper_evidence[('0x198d, 0x1e0','0x198d, 0x1e4')]='complete1907/2163-byte dialog bodies:37 structural groups,23 operand candidates and every branch correspondence classified;277/284-byte capture owner and192-byte restore bodies compared; original guard/layout/input/color corpora and36 native allocator-backed interactions across both engines/three displays pass; browser events/hardware timing, malformed aliasing and explicit host full-screen backdrop adaptation remain separately scoped'
 assert any(r['helper']=='results music resource initialization wrapper' and r['bytes']==91 and r['completeBodyMatches'] for r in seed['helpers'])
 runtime_helper_evidence[('0x198d, 0x2266','0x198d, 0x22e4')]='complete91-byte results music wrapper compared;32 whole original/native resource initializations and32 original startup cases/200 native music timers verified for supplied scores; signed count changes classified and absent from bundled content; reset/driver output, callbacks and browser playback remain explicit sound-category acceptance boundaries, not inferred here'
 plane_display=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_plane_display.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert plane_display['pass'] and plane_display['indirectKernelPointersMatched']==16
 assert any(r['helper']=='sprite input forwarding wrapper' and r['completeBodyMatches'] for r in seed['helpers'])
 runtime_helper_evidence[('0x198d, 0x208a','0x198d, 0x2108')]='complete137-byte sprite wrapper,15-byte verified input forwarder and492-byte patterned plane display with indirect kernels/tables compared; raw bitmap/cursor/counter dependencies linked separately, hardware pixel execution not inferred'
 assert all(any(r['helper']==label and r['completeBodyMatches'] for r in seed['helpers']) for label in ['timed selection outline wrapper','selection outline four rectangle dispatches'])
 runtime_helper_evidence[('0x198d, 0x21f0','0x198d, 0x226e')]='complete118-byte timed outline and137-byte four-rectangle dispatcher compared; nested counter/cursor/rectangle bodies verified separately; browser timing and pixel execution not inferred'
 disk_prompt=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_disk_prompt.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert disk_prompt['pass'] and disk_prompt['fourResourceAndProbeStringsMatch'] and disk_prompt['colourChange']==[0x4444,0x1111]
 runtime_helper_evidence[('0x198d, 0x2ad4','0x198d, 0x2d6c')]='complete89/85-byte disk prompt with explicit SI reuse and4444-to1111 color change; four resource/probe tables match,32 original retry cases pass; browser progress/track-disk prompt is a separate adapter'
 assert any(r['helper']=='EGA results window allocation including fatal tail' and r['completeBodyMatches'] for r in seed['helpers'])
 runtime_helper_evidence[('0x209e, 0x6060','0x20e5, 0x9a4e')]='complete374-byte like-for-like EGA window allocator including fatal tail; old EGA98ca target verified from actual result calls; MCGA/EGA layout differences kept separate, execution acceptance not inferred'
 border=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_border_wrapper.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert border['allWordCoordinatesAndColorsMatch'] and border['allTwelveLineArgumentsAndOrderMatch']
 assert any(r['helper']=='line service clipping and raster dispatch wrapper' and r['completeBodyMatches'] for r in seed['helpers'])
 runtime_helper_evidence[('0x198d, 0x1bd8','0x198d, 0x1cd0')]='complete366/330-byte border wrappers symbolically equivalent for all word arguments;62-byte line dispatch wrapper compared; clipping/raster pixel execution remains separate'
 labelled_prefix=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_border_wrapper.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries),'--labelled-prefix'],text=True))
 labelled_tail=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_labelled_button_tail.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert labelled_prefix['labelledPrefix'] and labelled_prefix['allWordCoordinatesAndColorsMatch'] and labelled_tail['completeBodyMatches']
 runtime_helper_evidence[('0x198d, 0x1d46','0x198d, 0x1e1a')]='complete638/602-byte labelled button: symbolic394/358-byte border prefix and identical244-byte text tail;160 original request cases and80 native comparisons; nested pixel execution remains separate'
 for script,key in [('audit_original_packed_loader.py','completeCodeAndTableCompared'),('audit_original_vle_decoder.py','completeBodyMatches'),('audit_original_rle_decoder.py','completeBodyMatches'),('audit_original_raw_result_read.py','DOSRequestsAndBranchesEquivalent')]:
  proof=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name(script)),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True));assert proof[key]
 runtime_helper_evidence[('0x198d, 0x145c','0x198d, 0x155c')]='complete RES/PRE fallback and raw/packed loader/allocator/decoder bodies compared;18 original fallback cases and110 shipped whole-loader executions; all55 native allocation hashes match, DOS/prompt adaptation remains explicit'
 resource_dispatch=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_resource_dispatch.py')),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
 assert resource_dispatch['pass'] and resource_dispatch['pairedInstructions']==61 and resource_dispatch['dispatchTableEntries']==9
 assert any(r['helper']=='sound filename fallback seven loader attempts' and r['completeBodyMatches'] for r in seed['helpers'])
 runtime_helper_evidence[('0x198d, 0x2428','0x198d, 0x24b2')]='complete resource dispatch code/table and explicit18-byte filename diagnostic addition;36 original/18 native dispatch cases,72 sound routing and64 fallback cases,110 whole packed-file loads and72 whole bitmap loads with36 native full-bank matches across packed/planar/indexed supplied PVS banks; DOS retry/fatal presentation and absent historical formats remain explicit adapters, full dialog acceptance separate'
 runtime_helper_evidence[('0x198d, 0x23ec','0x198d, 0x2476')]='complete60-byte seed wrapper and both RNGs,10-byte counter reader and52-byte multiply including post-return path compared; actual host timer behavior separate'
 assert any(r['helper']=='music fade including both driver branches' and r['completeBodyMatches'] for r in seed['helpers'])
 runtime_helper_evidence[('0x198d, 0x22c2','0x198d, 0x2340')]='complete50-byte cleanup,251-byte music fade and resource release bodies compared;20 actual original fade sequences and1536 native fade fixtures; audio/timer callbacks are explicit adapter boundaries'
 for script,key,pair,note in [
  ('audit_original_ega_text_draw.py','completeBodyCompared',('0x209e, 0x4b96','0x20e5, 0x5f6e'),'complete760-byte like-for-like EGA text body; fixed/proportional original software-plane pixel fixtures previously verified; BIOS and fatal presentation remain separate'),
  ('audit_original_high_score_loader.py','completeLoaderBodyCompared',('0x3d5c','0x3d64'),'complete262/260-byte high-score loader body; retained ES optimization classified; DOS services and browser adaptation remain separately scoped'),
  ('audit_original_high_score_table.py','completeBodyCompared',('0x3e62','0x3e68'),'complete581-byte score-table body and20Hz row cadence prefix; nested drawing dependencies not accepted by this body comparison'),
  ('audit_original_high_score_entry.py','completeEntryBodyCompared',('0x41de','0x41e8'),'complete398/408-byte score entry body;10Hz doubling is sole structural addition and implemented;141-byte save body compared; nested dialog services remain separately scoped'),
 ]:
  proof=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name(script)),str(a.legacy_display),str(a.modern),'--libraries',str(a.libraries)],text=True))
  assert proof[key]
  runtime_helper_evidence[pair]=note
# Additional exact-body proofs are deliberately bounded: the first return must
# close every branch; no indirect jump, interrupt or transitive call is allowed.
for row in operands.values():
 if row['instruction']!='lcall':continue
 pair=(row['legacy'],row['modern'])
 if pair in helper_bodies:continue
 captured=[]
 for path,target in [(a.legacy,pair[0]),(a.modern,pair[1])]:
  segment,start=[int(value.strip(),16) for value in target.split(',')]
  data=path.read_bytes();base=segment*16;ops=[]
  for op in d.disasm(data[base+start:base+start+2048],start):
   ops.append(op)
   if op.mnemonic in ('ret','retf'):break
  if not ops or ops[-1].mnemonic!='retf':captured=[];break
  bounds={op.address for op in ops};safe=True
  for op in ops:
   if op.mnemonic in ('call','lcall','int','iret'):safe=False
   if op.mnemonic.startswith(('j','loop')):
    try:safe=safe and int(op.op_str,16) in bounds
    except ValueError:safe=False
  if not safe:captured=[];break
  size=ops[-1].address+ops[-1].size-start
  assert sum(op.size for op in ops)==size
  captured.append(data[base+start:base+start+size])
 if len(captured)==2 and captured[0]==captured[1]:helper_bodies[pair]=len(captured[0])
result_fields={
 0x141:(0x19f,'mutable opponent resource-name digit;allocated evaluation resource loader'),
 0xa9f4:(0xb0e6,'retained result/evaluation text buffer'),
 0x937a:(0x9a70,'constructed high-score filename buffer'),
 0x8fcf:(0x96bd,'selected track filename;buildOriginalFilePath'),
 0x98:(0xa4,'current data directory;buildOriginalFilePath argument,not changed integer constant'),
 0x9300:(0x9c,'retained normal-font far pointer offset'),0x9302:(0x9e,'retained normal-font far pointer segment'),
 0x563:(0x5c1,'mutable op01 sprite-name frame digit;both surrounding name strings compared'),
 0x4eb8:(0x50a8,'selected-driver button fill pattern'),0x4eb6:(0x50a6,'selected-driver button shade pattern'),0x4eb4:(0x50a4,'selected-driver button highlight pattern'),
 0x4e8a:(0x507a,'selected-driver font/frame pattern'),0x4ec2:(0x50b2,'selected-driver highlighted text pattern'),0x4e92:(0x5082,'selected-driver portrait frame pattern'),
 0x4e90:(0x5080,'selected-driver early flashing outline pattern'),0x4e8e:(0x507e,'selected-driver late flashing outline pattern'),
 0x560c:(0x4f1a,'negative displacement to retained text buffer DSA9F4/B0E6'),
 0x8fc8:(0x96b6,'opponent selection;result memory reader'),
 0x933a:(0x9a2e,'allocated result surface offset;enterAllocatedResultsResources'),
 0x933c:(0x9a30,'allocated result surface segment;enterAllocatedResultsResources'),
 0xaa46:(0xb13a,'alternate result window flag;enterAllocatedResultsResources'),
 0x8018:(0x8672,'saved race flags;result memory/outcome and score eligibility'),
 0xa034:(0xa728,'elapsed recording adjustment;result average speed/time'),
 0x53f4:(0x5a50,'previous evaluation choice0'),0x53f6:(0x5a52,'previous evaluation choice1'),0x53f8:(0x5a54,'previous evaluation choice2'),
 0x53fa:(0x5a56,'current evaluation choice0'),0x53fc:(0x5a58,'current evaluation choice1'),0x53fe:(0x5a5a,'current evaluation choice2'),
 0x90fa:(0x97f0,'display bitmap byte-width units;portrait display geometry'),
 0x9336:(0x9a2a,'allocated small font offset'),0x9338:(0x9a2c,'allocated small font segment'),
 0x9356:(0x9a4a,'analyzed track tile allocation far pointer'),
 0x92fc:(0x99f2,'allocated high-score records far pointer'),
}
old_data=a.legacy.read_bytes()[0x2d1a0:0x2d1a0+65536]
new_data=a.modern.read_bytes()[0x32a90:0x32a90+65536]
assert old_data[0x518:0x548]==new_data[0x576:0x5a6],'Evaluation permutation/button hit-area tables changed'
def text_at(data,at):
 end=data.find(b'\0',at,min(at+80,len(data)))
 if end<0:return None
 value=data[at:end]
 return value if len(value)>=2 and all(32<=n<127 for n in value) else None
for row in operands.values():
 if row['instruction'] in ('call','lcall'):
  pair=(row['legacy'],row['modern'])
  if pair in helper_bodies:
   row['classification']='complete byte-identical branch-closed helper with no transitive calls'
   row['comparedBytes']=helper_bodies[pair];identical_helpers+=1
  elif pair in runtime_helper_evidence:
   row['classification']='runtime evidence linked: '+runtime_helper_evidence[pair];runtime_helpers+=1
  continue
 fields=list(re.finditer(r'0x[0-9a-f]+',row['legacy']))
 if row['legacy']=='byte ptr [0x563], 0x31':
  assert row['modern']=='byte ptr [0x5c1], 0x31'
  row['classification']='reset mutable op01 frame digit to ASCII1;name relocation only';context_fields+=1
 elif len(fields)==1 and 0x899a<=int(fields[0][0],16)<=0x89ae:
  translated=re.sub(r'0x[0-9a-f]+',lambda m:hex(int(m[0],16)+0x6ba),row['legacy'])
  assert translated==row['modern']
  row['classification']='saved11-word race statistics relocation; fresh1000/2000 original event corpus and result memory reader'
  saved_stats+=1
 elif len(fields)==1 and int(fields[0][0],16) in result_fields:
  target,label=result_fields[int(fields[0][0],16)]
  assert re.sub(r'0x[0-9a-f]+',lambda m:hex(target),row['legacy'])==row['modern']
  row['classification']='explicit result context: '+label;context_fields+=1
 elif len(fields)==1 and 0x518<=int(fields[0][0],16)<=0x546:
  assert re.sub(r'0x[0-9a-f]+',lambda m:hex(int(m[0],16)+0x5e),row['legacy'])==row['modern']
  row['classification']='byte-identical evaluation permutation/button hit-area table relocation;48-byte bank compared'
  result_tables+=1
 elif len(fields)==1 and row['instruction'] not in ('call','lcall'):
  at=int(fields[0][0],16);matches=list(re.finditer(r'0x[0-9a-f]+',row['modern']))
  if len(matches)==1 and 0x13e<=at<=0x563:
   target=int(matches[0][0],16);value=text_at(old_data,at)
   if target==at+0x5e and value is not None and value==text_at(new_data,target):
    row['classification']='byte-identical relocated resource/text identifier'
    row['verifiedText']=value.decode('ascii');resource_strings+=1
print(json.dumps({'scopes':scopes,'completeBranchClosedBodies':True,'groups':groups,'operandCandidates':list(operands.values()),'savedStatisticsOperandsClassified':saved_stats,'resourceStringsCompared':resource_strings,'resultContextFieldsClassified':context_fields,'resultTableReferencesClassified':result_tables,'byteIdenticalHelpersVerified':identical_helpers,'runtimeHelperEvidenceLinked':runtime_helpers,'remainingOperandCandidates':len(operands)-saved_stats-resource_strings-context_fields-result_tables-identical_helpers-runtime_helpers,'branches':branches,'wholeItemAccepted':False}))
