"""Extract original car palette-index layers for runtime cockpit drawing.
Usage: python extract_instrument_panel.py ORIGINAL_FOLDER OUTPUT_JSON [CAR_ID]
"""
from pathlib import Path
import sys,json,struct,hashlib
from extract import resources,unpack,shape_pixels
source=Path(sys.argv[1]);target=Path(sys.argv[2]);car=sys.argv[3] if len(sys.argv)>3 else 'COUN';raw=(source/f'STDA{car}.PVS').read_bytes();res=resources(unpack(raw));palette_raw=(source/'SDMAIN.PVS').read_bytes()
def layer(name,frames=res):
 b=frames[name];w,h=struct.unpack_from('<HH',b);x,y=struct.unpack_from('<hh',b,8)
 assert len(b)==16+w*h
 anchorX,anchorY=struct.unpack_from('<hh',b,4)
 return dict(x=x,y=y,width=w,height=h,anchorX=anchorX,anchorY=anchorY,pixels=list(shape_pixels(b)))
data=dict(source=f'STDA{car}.PVS',sha256=hashlib.sha256(raw).hexdigest(),paletteSource='SDMAIN.PVS',paletteSHA256=hashlib.sha256(palette_raw).hexdigest(),palette=[min(255,v*4) for v in resources(unpack(palette_raw))['!pal'][16:]],layers={n:layer(n) for n in ['ins2','inm1','ins1','inm3','ins3']})
gear_raw=(source/f'STDB{car}.PVS').read_bytes();gear_res=resources(unpack(gear_raw))
data['gear']=dict(source=f'STDB{car}.PVS',sha256=hashlib.sha256(gear_raw).hexdigest(),base=layer('gbox'),mask=layer('gnab',gear_res),art=layer('gnob',gear_res))
car_raw=(source/f'CAR{car}.RES').read_bytes();simd=resources(car_raw)['simd']
data['marker']=dict(source=f'CAR{car}.RES',sha256=hashlib.sha256(car_raw).hexdigest(),points=[list(simd[i:i+2]) for i in range(234,296,2)],mask=layer('dota',gear_res),art=layer('dot ',gear_res))
if 'dast' in res:data['extension']=dict(mask=layer('dasm'),art=layer('dast'))
if 'dig0' in gear_res:data['digits']=[layer('dig'+str(i),gear_res) for i in range(10)]
target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(data,separators=(',',':')))
print(f'Extracted {car} original instrument layers and palette')
