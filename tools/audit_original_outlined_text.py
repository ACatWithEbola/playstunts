"""Symbolic word arithmetic for both complete straight-line outline wrappers."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
def literal(n):return ((),n&65535)
def symbol(n):return (((n,1),),0)
def add(x,y):
 terms=dict(x[0])
 for k,v in y[0]:terms[k]=(terms.get(k,0)+v)&65535
 return (tuple(sorted((k,v) for k,v in terms.items() if v)),(x[1]+y[1])&65535)
fields={0x6d6c:0x6f66,0x6d6e:0x6f68,0x6d70:0x6f6a,0x6d72:0x6f6c,0xa460:0xa6f6}
calls=[{'0x209e, 0x3c99':'measure','0x209e, 0x9130':'colour','0x209e, 0x5de6':'draw'},
 {'0x20e5, 0x3e1f':'measure','0x20e5, 0x92b8':'colour','0x20e5, 0x5f6e':'draw'}]
outputs=[];sizes=[]
for index,(path,start,size) in enumerate([(a.legacy,0x1a72,180),(a.modern,0x1b72,172)]):
 image=path.read_bytes();ops=list(d.disasm(image[0x198d0+start:0x198d0+start+size],start));assert sum(i.size for i in ops)==size and ops[-1].mnemonic=='retf'
 regs={k:symbol('initial-'+k) for k in ['ax','bx','cx','dx','si','di','bp','sp']};memory={0xa6f6:symbol('height')};stack=[];events=[]
 args={6:symbol('text'),8:symbol('x'),10:symbol('y'),12:symbol('foreground'),14:symbol('outline')}
 def address(operand):
  inner=operand.removeprefix('word ptr [').removesuffix(']')
  if inner.startswith('bp + '):return ('argument',int(inner[5:],0))
  at=int(inner,0);return ('memory',fields.get(at,at) if not index else at)
 def read(operand):
  if operand in regs:return regs[operand]
  if operand.startswith('word ptr ['):
   kind,at=address(operand);return args[at] if kind=='argument' else memory[at]
  at=int(operand,0);return literal(fields.get(at,at) if not index else at)
 def write(operand,value):
  if operand in regs:regs[operand]=value
  else:
   kind,at=address(operand);assert kind=='memory';memory[at]=value
 for i in ops:
  operand=i.op_str
  if i.mnemonic=='mov':left,right=operand.split(', ',1);write(left,read(right))
  elif i.mnemonic=='push':stack.append(read(operand))
  elif i.mnemonic=='pop':write(operand,stack.pop())
  elif i.mnemonic in ('inc','dec'):write(operand,add(read(operand),literal(1 if i.mnemonic=='inc' else -1)))
  elif i.mnemonic=='add':
   left,right=operand.split(', ',1)
   if left=='sp':
    amount=int(right,0);assert amount%2==0;del stack[-amount//2:]
   else:write(left,add(read(left),read(right)))
  elif i.mnemonic=='sub':
   left,right=operand.split(', ',1);assert left==right=='ax';regs['ax']=literal(0)
  elif i.mnemonic=='lcall':
   kind=calls[index][operand];count={'measure':1,'colour':2,'draw':3}[kind]
   events.append((kind,tuple(reversed(stack[-count:]))))
   regs['ax']=symbol('width') if kind=='measure' else symbol('unused-'+kind+'-return')
  else:assert i.mnemonic=='retf',i.mnemonic
 assert not stack
 assert regs['si']==symbol('initial-si') and regs['di']==symbol('initial-di') and regs['bp']==symbol('initial-bp')
 assert regs['ax']==literal(0x6f66)
 outputs.append((events,memory));sizes.append({'bytes':size,'instructions':len(ops)})
assert outputs[0]==outputs[1],'Symbolic calls or bounds differ'
print(json.dumps({'scopes':sizes,'completeStraightLineBodiesCompared':True,
 'allWordCoordinatesAndWidthsSymbolicallyMatch':True,'callOrderArgumentsAndBoundsMatch':True,
 'retainedRegistersMatch':True,'calleeExecutionOutsideSymbolicScope':True,'wholeItemAccepted':False}))
