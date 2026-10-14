"""Symbolically compare every line argument in complete three-pixel borders."""
import argparse,re,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--labelled-prefix',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
def literal(n):return ((),n&65535)
def symbol(n):return (((n,1),),0)
def add(x,y):
 terms=dict(x[0])
 for k,v in y[0]:terms[k]=(terms.get(k,0)+v)&65535
 return (tuple(sorted((k,v) for k,v in terms.items() if v)),(x[1]+y[1])&65535)
outputs=[];scopes=[]
configs=[(a.legacy,0x1d46,394),(a.modern,0x1e1a,358)] if a.labelled_prefix else [(a.legacy,0x1bd8,366),(a.modern,0x1cd0,330)]
for index,(path,start,size) in enumerate(configs):
 image=path.read_bytes();ops=list(d.disasm(image[0x198d0+start:0x198d0+start+size],start));assert sum(i.size for i in ops)==size
 if not a.labelled_prefix:assert ops[-1].mnemonic=='retf'
 regs={k:symbol('initial-'+k) for k in ['ax','bx','cx','dx','si','di','bp','sp']};locals={};stack=[];events=[]
 def read(operand):
  if operand in regs:return regs[operand]
  match=re.fullmatch(r'word ptr \[bp ([+-]) (0x[0-9a-f]+|[0-9]+)\]',operand)
  if match:
   at=int(match[2],0);return symbol('arg-'+str(at)) if match[1]=='+' else locals[at]
  return literal(int(operand,0))
 def write(operand,value):
  if operand in regs:regs[operand]=value;return
  match=re.fullmatch(r'word ptr \[bp - (0x[0-9a-f]+|[0-9]+)\]',operand);assert match;locals[int(match[1],0)]=value
 for i in ops:
  operand=i.op_str
  if i.mnemonic=='mov':left,right=operand.split(', ',1);write(left,read(right))
  elif i.mnemonic=='push':stack.append(read(operand))
  elif i.mnemonic=='pop':write(operand,stack.pop())
  elif i.mnemonic in ('inc','dec'):write(operand,add(read(operand),literal(1 if i.mnemonic=='inc' else -1)))
  elif i.mnemonic=='lea':
   left,right=operand.split(', ',1);match=re.fullmatch(r'\[(si|di) - (0x[0-9a-f]+|[0-9]+)\]',right);assert match;write(left,add(regs[match[1]],literal(-int(match[2],0))))
  elif i.mnemonic=='add':
   left,right=operand.split(', ',1)
   if left=='sp':count=int(right,0)//2;assert count==5;del stack[-count:]
   else:write(left,add(read(left),read(right)))
  elif i.mnemonic=='sub':assert operand.startswith('sp, ')
  elif i.mnemonic=='or':
   assert a.labelled_prefix and operand=='ax, word ptr [bp + 8]' and regs['ax']==symbol('arg-6')
   events.append(('label-present-guard',(regs['ax'],read('word ptr [bp + 8]'))))
  elif i.mnemonic in ('jne','jmp'):
   assert a.labelled_prefix and int(operand,16)==start+size+(0 if i.mnemonic=='jne' else 238)
  elif i.mnemonic=='lcall':
   kind='line' if operand==('0x209e, 0x13b8' if index==0 else '0x20e5, 0x13ba') else 'fill'
   if kind=='fill':assert a.labelled_prefix and operand==('0x209e, 0x5908' if index==0 else '0x20e5, 0x5a90')
   events.append((kind,tuple(reversed(stack[-5:]))));regs['ax']=symbol('draw-return-'+str(len(events)))
  else:assert i.mnemonic=='retf',i.mnemonic
 assert len(stack)==(3 if a.labelled_prefix else 0) and len(events)==(14 if a.labelled_prefix else 12)
 if not a.labelled_prefix:
  for reg in ['si','di','bp']:assert regs[reg]==symbol('initial-'+reg)
 outputs.append(events);scopes.append({'bytes':size,'instructions':len(ops)})
assert outputs[0]==outputs[1]
print(json.dumps({'scopes':scopes,'labelledPrefix':a.labelled_prefix,'allWordCoordinatesAndColorsMatch':True,'allTwelveLineArgumentsAndOrderMatch':True,'calleeExecutionNotInferred':True,'pass':True}))
