"""Compare all three chassis audio wrappers; downstream audio acceptance separate."""
import argparse,hashlib,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path)
p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);old=a.legacy.read_bytes();new=a.modern.read_bytes();rows=[]
for label,old_start,new_start,size in [('crash-effect',0x74e,0x74c,68),('contact-effect',0x792,0x790,60),('alternate-contact-effect',0x7ce,0x7cc,60)]:
 versions=[];calls=[]
 for index,(image,start) in enumerate([(old,old_start),(new,new_start)]):
  ops=list(d.disasm(image[0x18fd0+start:0x18fd0+start+size],start))
  assert sum(i.size for i in ops)==size and ops[-1].mnemonic=='retf'
  normalized=[];targets=[]
  for i in ops:
   operand=i.op_str
   assert not i.mnemonic.startswith(('j','loop')) and i.mnemonic not in ('int','iret')
   if not index:operand=operand.replace('0x65f0','0x67ea').replace('0x2daf, 0x430','0x2e0e, 0x456').replace('0x3c7','0x3c5')
   if i.mnemonic in ('call','lcall'):targets.append(i.mnemonic+' '+operand)
   normalized.append((i.address-start,i.mnemonic,operand))
  versions.append(normalized);calls.append(targets)
 assert versions[0]==versions[1] and calls[0]==calls[1]
 assert calls[1]==(['lcall 0x2e0e, 0x456','call 0x3c5'] if label=='crash-effect' else ['lcall 0x2e0e, 0x456'])
 rows.append({'name':label,'modernTarget':'0x18fd, '+hex(new_start),'bytes':size,'instructions':len(versions[1]),'equivalentUnderExplicitRelocations':True,'downstreamCalls':calls[1]})
assert a.legacy.read_bytes()==old and a.modern.read_bytes()==new
lifecycles=[]
for index,(image,start) in enumerate([(old,0x3c7),(new,0x3c5)]):
 ops=list(d.disasm(image[0x18fd0+start:0x18fd0+start+54],start))
 assert sum(i.size for i in ops)==54 and ops[-1].mnemonic=='retf'
 bounds={i.address for i in ops};normalized=[]
 for i in ops:
  operand=i.op_str
  if not index:operand=operand.replace('0x65f0','0x67ea').replace('0x2daf, 0xf60','0x2e0e, 0x1092')
  if i.mnemonic.startswith(('j','loop')):
   target=int(i.op_str,16);assert target in bounds;operand='local:'+str(target-start)
  if i.mnemonic in ('call','lcall'):assert i.mnemonic=='lcall' and operand=='0x2e0e, 0x1092'
  normalized.append((i.address-start,i.mnemonic,operand))
 lifecycles.append(normalized)
assert lifecycles[0]==lifecycles[1]
allocator=list(d.disasm(new[0x2e0e0+0x456:0x2e0e0+0x586],0x456))
assert sum(i.size for i in allocator)==304
allocator_bounds={i.address for i in allocator};allocator_calls=[]
for i in allocator:
 if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in allocator_bounds
 if i.mnemonic in ('call','lcall'):allocator_calls.append(i.mnemonic+' '+i.op_str)
assert allocator_calls==['call 0x586','call 0xcf8']
assert sum(i.mnemonic=='retf' for i in allocator)==2
retained=[]
field_map={'0xa3b6':'0xa64c','0x88fa':'0x8b38','0x57fa':'0x5562','0x891e':'0x8b5c','0xa806':'0xaa9e','0x7b62':'0x7964'}
for index,(image,base,lo,hi) in enumerate([(old,0x2daf0,0x448,0x516),(new,0x2e0e0,0x480,0x54e)]):
 ops=list(d.disasm(image[base+lo:base+hi],lo));assert sum(i.size for i in ops)==206
 normalized=[]
 for i in ops:
  operand=i.op_str
  if not index:
   for before,after in field_map.items():operand=operand.replace(before,after)
   operand=operand.replace('[bp - 8]','[bp - 4]').replace('[bp - 0xc]','[bp - 6]')
   if operand in ('di, 0x48','si, 0x48','ax, 0x48'):operand=operand.replace('0x48','0x4c')
   if i.mnemonic=='call':assert operand=='0x562';operand='0x586'
  if i.mnemonic.startswith(('j','loop')):
   target=int(i.op_str,16)
   if target==(0x43f if not index else 0x465):operand='failure-return'
   else:assert lo<=target<=hi;operand='region:'+str(target-lo)
  normalized.append((i.address-lo,i.mnemonic,operand))
 retained.append(normalized)
assert retained[0]==retained[1]
startup=[]
for index,(image,base,lo,hi) in enumerate([(old,0x2daf0,0x52e,0x562),(new,0x2e0e0,0x551,0x586)]):
 ops=list(d.disasm(image[base+lo:base+hi],lo));assert sum(i.size for i in ops)==hi-lo
 normalized=[]
 for i in ops:
  if i.mnemonic=='nop':continue
  mnemonic,operand=i.mnemonic,i.op_str
  assert not mnemonic.startswith(('j','loop'))
  if not index:
   operand=operand.replace('[bp - 6]','[bp - 2]')
   if mnemonic=='call':assert operand=='0xbfe';operand='0xcf8'
  if mnemonic=='cwde':assert not index;mnemonic,operand='extend-count','signed-byte'
  elif mnemonic=='sub' and operand=='ah, ah' and i.address==0x555:assert index;mnemonic,operand='extend-count','unsigned-byte'
  normalized.append((mnemonic,operand))
 startup.append(normalized)
assert startup[0][1]==('extend-count','signed-byte') and startup[1][1]==('extend-count','unsigned-byte')
startup[0][1]=startup[1][1]
assert startup[0]==startup[1]
# Exact relocated validation gates: modern rejects invalid resources before
# voice selection; legacy validates only after selecting/stopping a victim.
old_guard=list(d.disasm(old[0x2daf0+0x516:0x2daf0+0x52e],0x516))
new_guard=list(d.disasm(new[0x2e0e0+0x46e:0x2e0e0+0x480],0x46e))
assert [(i.mnemonic,i.op_str) for i in old_guard]==[
 ('mov','ax, word ptr [bp + 6]'),('or','ax, word ptr [bp + 8]'),('jne','0x521'),('jmp','0x43f'),
 ('les','bx, ptr [bp + 6]'),('cmp','byte ptr es:[bx + 5], 1'),('je','0x52e'),('jmp','0x43f')]
assert [(i.mnemonic,i.op_str) for i in new_guard]==[
 ('mov','ax, word ptr [bp + 6]'),('or','ax, word ptr [bp + 8]'),('je','0x465'),
 ('les','bx, ptr [bp + 6]'),('cmp','byte ptr es:[bx + 5], 1'),('jne','0x465')]
prologues=[]
for index,(image,base,lo,hi) in enumerate([(old,0x2daf0,0x430,0x448),(new,0x2e0e0,0x456,0x46e)]):
 ops=list(d.disasm(image[base+lo:base+hi],lo));assert sum(i.size for i in ops)==24
 normalized=[]
 for i in ops:
  operand=i.op_str
  if not index:operand=operand.replace('sp, 0xe','sp, 8').replace('0x4e05','0x4ee3')
  if i.mnemonic.startswith('j'):operand=str(int(i.op_str,16)-lo)
  normalized.append((i.mnemonic,operand))
 prologues.append(normalized)
assert prologues[0]==prologues[1]
assert 24+206+24+52==0x562-0x430
assert new[0x2e0e0+0x54e:0x2e0e0+0x551]==bytes.fromhex('c45e06') # Reload validated resource after slot-selection calls.
assert 24+18+206+3+53==0x586-0x456
stops=[]
for index,(image,base,start) in enumerate([(old,0x2daf0,0xf60),(new,0x2e0e0,0x1092)]):
 ops=list(d.disasm(image[base+start:base+start+34],start))
 assert sum(i.size for i in ops)==34 and ops[-1].mnemonic=='retf'
 normalized=[]
 for i in ops:
  assert i.mnemonic not in ('call','lcall','int') and not i.mnemonic.startswith(('j','loop'))
  operand=i.op_str.replace('0xa492','0xa72a') if not index else i.op_str
  normalized.append((i.address-start,i.mnemonic,operand))
 stops.append(normalized)
assert stops[0]==stops[1]
slot_stops=[]
for index,(image,base,start) in enumerate([(old,0x2daf0,0x562),(new,0x2e0e0,0x586)]):
 ops=list(d.disasm(image[base+start:base+start+76],start))
 assert sum(i.size for i in ops)==76 and ops[-1].mnemonic=='retf'
 normalized=[]
 for i in ops:
  operand=i.op_str
  if not index:
   for before,after in [('ax, 0x48','ax, 0x4c'),('0x7b84','0x7986'),('0x7b86','0x7988'),('0xa3b6','0xa64c'),('0x2edd, 0x12f4','0x2f65, 0x1332'),('0xbfe','0xcf8')]:operand=operand.replace(before,after)
  if i.mnemonic.startswith(('j','loop')):
   assert int(i.op_str,16)==start+74;operand='common-return'
  if i.mnemonic in ('call','lcall'):assert operand in ('0x2f65, 0x1332','0xcf8')
  normalized.append((i.address-start,i.mnemonic,operand))
 slot_stops.append(normalized)
assert slot_stops[0]==slot_stops[1]
deeper=[]
for name,base,lo,hi,allowed_calls in [
 ('playback-initializer',0x2e0e0,0xcf8,0xdfc,['call 0x1436','call 0x1436']),
 ('voice-stop',0x2f650,0x1332,0x149e,['lcall [bp - 0x10]','lcall [bp - 0x16]'])]:
 ops=list(d.disasm(new[base+lo:base+hi],lo));assert sum(i.size for i in ops)==hi-lo
 bounds={i.address for i in ops};calls=[]
 for i in ops:
  if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in bounds
  if i.mnemonic in ('call','lcall'):calls.append(i.mnemonic+' '+i.op_str)
 assert calls==allowed_calls and sum(i.mnemonic=='retf' for i in ops)==1
 deeper.append({'name':name,'bytes':hi-lo,'instructions':len(ops),'branchesInternal':True,'completeThroughNextFunction':True,'calls':calls,'legacyComparisonPending':True})
pointer_load=list(d.disasm(new[0x2e0e0+0x1436:0x2e0e0+0x1450],0x1436))
voice_stop_versions=[]
voice_fields={'0x3209':'0x32a9','0x4e06':'0x4ee4','0xa440':'0xa6d6','0xa492':'0xa72a','0xa493':'0xa72b','0xa4a2':'0xa73a','0xa494':'0xa72c','0x4ddc':'0x4eba','0x4dde':'0x4ebc','0x84c1':'0x86bf','0x848f':'0x868d'}
for index,(image,base,start) in enumerate([(old,0x2edd0,0x12f4),(new,0x2f650,0x1332)]):
 ops=list(d.disasm(image[base+start:base+start+364],start))
 assert sum(i.size for i in ops)==364 and len(ops)==132
 bounds={i.address for i in ops};normalized=[]
 for i in ops:
  operand=i.op_str
  if not index:
   for before,after in voice_fields.items():operand=operand.replace(before,after)
   if operand in ('ax, 0x48','si, 0x48','word ptr [bp - 0x12], 0x48'):operand=operand.replace('0x48','0x4c')
  if i.mnemonic.startswith(('j','loop')):
   target=int(i.op_str,16);assert target in bounds;operand='local:'+str(target-start)
  if i.mnemonic in ('call','lcall'):assert i.mnemonic=='lcall' and operand in ('[bp - 0x10]','[bp - 0x16]')
  normalized.append((i.address-start,i.mnemonic,operand))
 voice_stop_versions.append(normalized)
assert voice_stop_versions[0]==voice_stop_versions[1]
next(row for row in deeper if row['name']=='voice-stop').update(legacyComparisonPending=False,equivalentUnderExplicitFieldsAndStride=True,driverExportOffset=30)
timer_initialization=[]
for index,(image,base,lo,hi) in enumerate([(old,0x2daf0,0xc4f,0xca3),(new,0x2e0e0,0xd2b,0xd89)]):
 ops=list(d.disasm(image[base+lo:base+hi],lo));assert sum(i.size for i in ops)==hi-lo
 normalized=[]
 for i in ops:
  if index and 0xd38<=i.address<0xd42:continue # Newly per-slot note/marker clearing, audited below.
  operand=i.op_str
  if not index and operand=='ax, cx':operand='ax, di'
  assert i.mnemonic not in ('call','lcall') and not i.mnemonic.startswith(('j','loop'))
  normalized.append((i.mnemonic,operand))
 timer_initialization.append(normalized)
assert timer_initialization[0]==timer_initialization[1]
assert [(i.mnemonic,i.op_str) for i in d.disasm(new[0x2e0e0+0xd38:0x2e0e0+0xd42],0xd38)]==[('mov','byte ptr [di - 0x65f2], 0'),('mov','byte ptr [di - 0x682a], 0')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(new[0x2e0e0+0xd23:0x2e0e0+0xd2b],0xd23)]==[('sub','ax, ax'),('mov','word ptr [si + 0x4a], ax'),('mov','word ptr [si + 0x48], ax')]
assert sum(i.size for i in pointer_load)==26
assert [(i.mnemonic,i.op_str) for i in pointer_load]==[
 ('push','bp'),('mov','bp, sp'),('sub','sp, 4'),('les','bx, ptr [bp + 6]'),
 ('mov','ax, word ptr es:[bx]'),('mov','dx, word ptr es:[bx + 2]'),
 ('mov','word ptr [bp - 4], ax'),('mov','word ptr [bp - 2], dx'),
 ('mov','sp, bp'),('pop','bp'),('retf','')]
initializer_regions=[
 ('setup',0xbfe,0xc4f,0xcf8,0xd2b,'d9551a753e5cc3759a492a7c89df191dfe8134632e0a3cc87de78fda3be85806','c9e288e376c764c0329acad54ed7f30ddad8c8ad7485169c8c07d5b234dfb12a','legacy bulk note/marker clearing and register cursor; modern per-slot loop, saved cursor and extra word clearing'),
 ('fields',0xc4f,0xca3,0xd2b,0xd89,'46f184d16d266f6cb91dd7040e4869cef72733664447e39fd870fc6baef47a56','e3ff6a587a11d08667ac40d2efccf37187f589026b542d6336abfb10243d91dc','24 retained field operations compared; modern per-slot note/marker clearing'),
 ('pointer',0xca3,0xce8,0xd89,0xdda,'3fe0e28b6ecb5cf5027ea71a5b74e73cb59545ee214c01aec87e7b0b2f7755c6','872528436489942c2f2cfc4a65024eb450fe3a0dca12a5c541bbe12dbcd1c646','legacy inline far load with ADD/ADC; modern two verified plain-load calls with offset-only ADD; same pointer field destinations'),
 ('loop-exit',0xce8,0xd0a,0xdda,0xdfc,'c4ae733744facfdfd730176701c8b9b738348bcc04d75381eeb19b7dc063423d','8cdc6211700ec012d9a49078cf4e29864427fe4b072fbf3163fbde7576870d69','both clear null resource pointer, inclusive owner range; cursor stride72 to76, cursor/local register allocation changes, common return and legacy padding'),
]
for name,olo,ohi,nlo,nhi,old_hash,new_hash,classification in initializer_regions:
 assert hashlib.sha256(old[0x2daf0+olo:0x2daf0+ohi]).hexdigest()==old_hash
 assert hashlib.sha256(new[0x2e0e0+nlo:0x2e0e0+nhi]).hexdigest()==new_hash
 for image,base,lo,hi in [(old,0x2daf0,olo,ohi),(new,0x2e0e0,nlo,nhi)]:
  assert sum(i.size for i in d.disasm(image[base+lo:base+hi],lo))==hi-lo
assert sum(row[2]-row[1] for row in initializer_regions)==268
assert sum(row[4]-row[3] for row in initializer_regions)==260
assert all(initializer_regions[i][2]==initializer_regions[i+1][1] and initializer_regions[i][4]==initializer_regions[i+1][3] for i in range(3))
next(row for row in deeper if row['name']=='playback-initializer').update(legacyComparisonPending=False,differenceClassificationComplete=True,classificationIsNotFullRaceAcceptance=True)
print(json.dumps({'wrappers':rows,'comparedBytesPerVersion':188,
 'crashLifecycle':{'bytes':54,'instructions':len(lifecycles[1]),'equivalentUnderExplicitRelocations':True,'stopTarget':'0x2e0e, 0x1092'},
 'effectAllocatorScope':{'bytes':304,'instructions':len(allocator),'branchesInternal':True,'returnPaths':2,'downstreamCalls':allocator_calls,'retainedSelectionRegionBytes':206,'retainedSelectionRegionEquivalentUnderExplicitFieldsLocalsAndStride':True,'legacyComparisonPending':False,'completeBytePartitionCompared':True,'changes':['timer stride72 to76','header validation moved before slot selection and victim stop','instrument count now unsigned rather than signed byte'],'downstreamPlaybackAcceptanceSeparate':True},
 'engineVoiceStopScope':{'bytes':34,'instructions':len(stops[1]),'equivalentUnderExplicitRelocation':True,'remainingDuration':1,'transitiveCalls':0},
 'slotStopScope':{'bytes':76,'instructions':len(slot_stops[1]),'equivalentUnderExplicitFieldsStrideAndCallRelocations':True,'voiceRange':[16,23]},
 'deeperAudioScopes':deeper,
 'pointerLoadScope':{'bytes':26,'instructions':len(pointer_load),'plainFarPointerLoad':True,'normalizesPointer':False,'transitiveCalls':0},
 'sharedTimerInitialization':{'retainedOperations':len(timer_initialization[1]),'retainedFieldsEquivalent':True,'modernAdditionalClears':['per-slot last note','per-slot marker','timer extra words48/4A'],'completeInitializerClassification':True,'regions':[{'name':r[0],'classification':r[7]} for r in initializer_regions],'fullSemanticEquivalenceClaimed':False},
 'unclosedDownstreamAudioTargets':['0x2f65, 0x1332','0x2e0e, 0xcf8'],
 'scope':'request wrappers only; allocation, playback and lifecycle require sound category evidence','sourceUnchanged':True},indent=2))
