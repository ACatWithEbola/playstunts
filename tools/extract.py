"""Read-only Stunts asset importer. Formats checked against 4d-stunts/restunts.
All offsets and car physics values retain original integer units.
"""
from pathlib import Path
import struct, json, hashlib, argparse

def u24(b): return int.from_bytes(b,'little')

def unpack(b):
    passes=(b[0]&127) if b[0]&128 else 1
    final=u24(b[1:4])
    if b[0]&128: b=b[4:]
    for _ in range(passes):
        typ=b[0]; size=u24(b[1:4]); out=bytearray()
        if not 0<size<4_000_000: raise ValueError('Invalid output size')
        if typ==2:
            n=b[4]&127; additive=b[4]&128
            counts=b[5:5+n]; pos=5+n; count=sum(counts)
            alphabet=b[pos:pos+count]; stream=b[pos+count:]
            table={}; code=0; k=0
            for width, num in enumerate(counts,1):
                for j in range(num): table[(width,code+j)]=alphabet[k+j]
                k+=num; code=(code+num)<<1
            bit=0; acc=0
            while len(out)<size:
                code=0
                for width in range(1,n+1):
                    code=(code<<1)|((stream[bit//8]>>(7-bit%8))&1);bit+=1
                    if (width,code) in table:
                        v=table[width,code];acc=((acc+v)&255) if additive else v
                        out.append(acc);break
                else: raise ValueError('Invalid VLE code')
        elif typ==1:
            srclen=u24(b[4:7]); flags=b[8]; esc=b[9:9+(flags&127)]; src=b[9+len(esc):]
            if not flags&128:
                seq=bytearray(); i=0
                while i<srclen:
                    c=src[i];i+=1
                    if c==esc[1]:
                        end=src.index(c,i);seq.extend(src[i:end]*src[end+1]);i=end+2
                    else: seq.append(c)
                src=seq
            lookup={v:i+1 for i,v in enumerate(esc)};i=0
            while len(out)<size:
                c=src[i];i+=1; e=lookup.get(c,0)
                if not e: out.append(c);continue
                if e==1: rep=src[i];i+=1
                elif e==3: rep=int.from_bytes(src[i:i+2],'little');i+=2
                else: rep=e-1
                c=src[i];i+=1;out.extend(bytes([c])*rep)
        else: raise ValueError(f'Unsupported compression {typ}')
        if len(out)!=size: raise ValueError('Output size mismatch')
        b=bytes(out)
    if len(b)!=final: raise ValueError('Final size mismatch')
    return b

def resources(b):
    size,n=struct.unpack_from('<IH',b);base=6+8*n
    if size!=len(b) or base>size:raise ValueError('Invalid resource header')
    ids=[b[6+i*4:10+i*4].decode('ascii') for i in range(n)]
    offsets=list(struct.unpack_from('<'+'I'*n,b,6+4*n))
    if any(o>size-base for o in offsets):raise ValueError('Invalid resource offset')
    result={}
    for name,o in zip(ids,offsets):
        end=min([x for x in offsets if x>o]+[size-base]);result[name]=b[base+o:base+end]
    return result

def shape_pixels(frame):
    """Original 0x24918 resource-loader pixel rearrangement; retains header."""
    width,height=struct.unpack_from('<HH',frame)
    pixels=frame[16:]
    if len(pixels)!=width*height: raise ValueError('Invalid bitmap size')
    mode=frame[14]>>4
    if frame[15]&240 or mode==0: return pixels
    if mode>3: raise ValueError('Original loader rejects bitmap rearrangement')
    output=bytearray(width*height)
    for y in range(height):
        for x in range(width):
            if mode==1: source=x*height+y
            elif mode==2: source=x*height+(y//2 if y%2==0 else (y+height)//2)
            else: source=(x*((height+1)//2)+y//2 if y%2==0 else width*((height+1)//2)+x*(height//2)+y//2)
            output[y*width+x]=pixels[source]
    return bytes(output)

def shape(b):
    nv,np,paints,_=b[:4];pos=4
    vertices=[list(struct.unpack_from('<hhh',b,pos+6*i)) for i in range(nv)]
    pos+=6*nv+8*np; primitives=[]
    for _ in range(np):
        typ,flags=b[pos:pos+2];pos+=2
        mats=list(b[pos:pos+paints]);pos+=paints
        n=2 if typ==11 else 6 if typ==12 else typ if 1<=typ<=10 else 0
        ids=list(b[pos:pos+n]);pos+=n
        if len(ids)!=n or any(i>=nv for i in ids):raise ValueError('Invalid primitive')
        primitives.append(dict(type=typ,flags=flags,materials=mats,indices=ids))
    if pos>len(b):raise ValueError('Truncated shape')
    return dict(vertices=vertices,primitives=primitives,paintCount=paints)

def extract(root,out):
    out.mkdir(parents=True,exist_ok=True); decoded=out/'decoded';decoded.mkdir(exist_ok=True)
    cars=[];tracks=[];shapes={};texts={};manifest=[]
    for f in sorted(root.iterdir()):
        if not f.is_file() or f.name.startswith('.'):continue
        b=f.read_bytes();ext=f.suffix.upper()
        manifest.append(dict(name=f.name,bytes=len(b),sha256=hashlib.sha256(b).hexdigest()))
        if ext in ['.PRE','.PVS','.PES','.P3S','.CMN','.COD','.DIF']:
            b=unpack(b);(decoded/f.name).write_bytes(b)
        if ext=='.RES' or ext=='.PRE':
            r=resources(b)
            if f.name.upper().startswith('CAR'):
                s=r['simd'];words=struct.unpack_from('<6H',s,2)
                cars.append(dict(id=f.stem[3:].upper(),name=r['gnam'].decode('cp437').rstrip('\0'),description=r['edes'].decode('cp437').rstrip('\0').replace(']', '\n'),gears=s[0],mass=words[0],braking=words[1],idleRPM=words[2],downshiftRPM=words[3],upshiftRPM=words[4],maxRPM=words[5],gearRatios=list(struct.unpack_from('<7H',s,14)),gearKnobPoints=[list(struct.unpack_from('<hh',s,28+i*4)) for i in range(7)],aeroResistance=struct.unpack_from('<H',s,56)[0],idleTorque=s[58],torqueCurve=list(s[59:163]),grip=struct.unpack_from('<H',s,164)[0],surfaceGrip=list(struct.unpack_from('<6H',s,180)),rawSimulation=s.hex()))
            texts[f.name]={k:v.decode('cp437').rstrip('\0') for k,v in r.items() if k.startswith('e')}
        if ext=='.P3S':shapes[f.stem]={k:shape(v) for k,v in resources(b).items()}
        if ext=='.TRK':
            if len(b)!=1802:raise ValueError('Unexpected track length')
            tracks.append(dict(name=f.stem,raw=list(b),sha256=hashlib.sha256(b).hexdigest()))
    data=dict(cars=cars,tracks=tracks,shapes=shapes,texts=texts,manifest=manifest)
    (out/'assets.json').write_text(json.dumps(data,separators=(',',':')))
    print(f'Extracted {len(cars)} cars, {len(tracks)} tracks, {sum(len(v) for v in shapes.values())} shapes')
    return data
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('input',type=Path);p.add_argument('output',type=Path);a=p.parse_args();extract(a.input,a.output)
