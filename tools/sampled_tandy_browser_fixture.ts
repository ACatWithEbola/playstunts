import {fixtureData} from './global-score-fixture.ts';
/** Disposable custom sound bank, delivered through the normal catalog before
 * runtime caches resolved instruments. Original files/base remain untouched. */
export function sampledTandyBrowserFixture(differential=false,sampleLength=6,unmodulatedVolume=false){
 if(!Number.isInteger(sampleLength)||sampleLength<1||sampleLength>4000)throw Error('Invalid disposable sample length');
 const base=fixtureData.base.slice(),view=new DataView(base.buffer);
 base[0x10104]=differential?6:0;view.setUint16(0x10108,sampleLength,true);base.fill(128,0x10132,0x10132+sampleLength);base.set([128,55,134,217,44,128].slice(0,sampleLength),0x10132);
 return {...fixtureData,base,catalog:{exists:fixtureData.catalog.exists,async read(name:string){
  const bytes=await fixtureData.catalog.read(name);if(!bytes)return null;
  if(name.replaceAll('/','\\').split('\\').pop()!.toUpperCase()!=='TDENG1.VCE')return bytes;
  const bank=bytes.slice(),v=new DataView(bank.buffer),count=v.getUint16(4,true),body=6+count*8;
  let index=-1;for(let i=0;i<count;i++)if(String.fromCharCode(...bank.slice(6+i*4,10+i*4))==='CRAS')index=i;
  if(index<0)throw Error('Missing CRAS fixture instrument');
  const at=body+v.getUint32(6+count*4+index*4,true);
  bank[at+10]=1;bank[at+5]=differential?6:0;
  if(unmodulatedVolume){bank[at+0x19]=0;v.setUint16(at+36,1,true);}
  v.setUint16(at+6,0x100,true);v.setUint16(at+8,0x1000,true);v.setUint16(at+12,1,true);
  return bank;
 }}};
}
