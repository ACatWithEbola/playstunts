import assert from 'node:assert/strict';
import {renderHarmonicBass} from './render_harmonic_bass.mjs';
const coefficients=Array.from({length:17},()=>[0,0]);coefficients[1]=[.1,-.1];
const note={pitch:69,velocity:127,startFrame:100,releaseFrame:500,windowTruncated:false};
const result=renderHarmonicBass([note],coefficients,32000,48000,2000);
assert.equal(result.events[0].outputStartFrame,150);assert.equal(result.events[0].outputReleaseFrame,750);assert.equal(result.events[0].frequencyHz,440);
assert.ok(result.pcm.slice(0,300).every(v=>v===0));
for(let i=0;i<2000;i++)assert.ok(result.pcm[i*2]===-result.pcm[i*2+1]);
assert.ok(result.pcm.some(v=>Math.abs(v)>.01));assert.equal(result.envelopesVerified,false);
assert.throws(()=>renderHarmonicBass([note],coefficients,0,48000,2000),/layout/);
assert.throws(()=>renderHarmonicBass([{...note,releaseFrame:99}],coefficients,32000,48000,2000),/span/);
assert.throws(()=>renderHarmonicBass([{...note,pitch:NaN}],coefficients,32000,48000,2000),/span/);
assert.throws(()=>renderHarmonicBass([{...note,retriggerAbortFrame:501}],coefficients,32000,48000,2000),/retrigger/);
console.log('Harmonic audition preserves explicit frame mapping/pitch and stereo phase; provisional envelopes not certified');
const envelope=[{seconds:0,gain:0},{seconds:.01,gain:.4},{seconds:.02,gain:1},{seconds:.04,gain:.5}];
const shaped=renderHarmonicBass([bentEnvelopeNote()],coefficients,48000,48000,4000,[],'reject',envelope);
function bentEnvelopeNote(){return {pitch:57,velocity:127,startFrame:200,releaseFrame:3000,windowTruncated:false};}
const nominal=renderHarmonicBass([bentEnvelopeNote()],coefficients,48000,48000,4000);
assert.deepEqual(shaped.events,nominal.events,'Source envelope cannot move note timing, release or frequency');
for(const [offset,gain] of [[480,.4],[720,.7],[960,1],[1440,.75],[1920,.5],[2400,.5]]){
 const at=200+offset;
 assert.ok(Math.abs(shaped.pcm[at*2]-nominal.pcm[at*2]*gain)<1e-7);
}
assert.ok(shaped.pcm.slice(0,400).every(value=>value===0));
assert.ok(shaped.pcm.slice((3000+960)*2).every(value=>value===0));
envelope[1].gain=1;assert.equal(shaped.sourceEnvelope[1].gain,.4,'Profile provenance is copied');
for(const invalid of [[{seconds:0,gain:0}],[{seconds:.1,gain:0},{seconds:.2,gain:1}],[{seconds:0,gain:0},{seconds:0,gain:1}],[{seconds:0,gain:0},{seconds:.1,gain:NaN}],[{seconds:0,gain:0},{seconds:.7,gain:1}]])assert.throws(()=>renderHarmonicBass([note],coefficients,32000,48000,2000,[],'reject',invalid),/source envelope/);
console.log('Optional source envelope interpolates/holds without changing pitch or original trigger/release frames; malformed profiles rejected');
assert.deepEqual(renderHarmonicBass([note],coefficients,32000,48000,2000,[]).pcm,result.pcm,'Empty bend timeline preserves existing prototype bit-for-bit');
const bentNote={pitch:57,velocity:127,startFrame:0,releaseFrame:900,windowTruncated:false};
const bendFrame=500,units=683,bent=renderHarmonicBass([bentNote],coefficients,48000,48000,2000,[{frame:bendFrame,units}]);
for(const at of [499,500,501,700]){
 const phase=2*Math.PI*220*(Math.min(at,bendFrame)+Math.max(0,at-bendFrame)*2**(units/4096))/48000;
 assert.ok(Math.abs(bent.pcm[at*2]-.1*Math.sin(phase))<1e-7,'Bend preserves accumulated phase at '+at);
}
for(const bends of [[{frame:-1,units:0}],[{frame:1,units:NaN}],[{frame:2,units:0},{frame:1,units:0}]])assert.throws(()=>renderHarmonicBass([note],coefficients,32000,48000,2000,bends),/pitch bend/);
console.log('Explicit integer pitch-bend timeline preserves phase continuity and rejects malformed events; timbre/envelopes unverified');
const richer=Array.from({length:33},()=>[0,0]);richer[31]=[.1,-.1];
const extended=renderHarmonicBass([bentNote],richer,48000,48000,2000);
assert.ok(Math.abs(extended.pcm[1000]-.1*Math.sin(2*Math.PI*220*16*500/48000))<1e-7,'Higher template harmonics must be rendered, not silently dropped');
assert.throws(()=>renderHarmonicBass([bentNote],richer.slice(1),48000,48000,2000),/template/);
assert.throws(()=>renderHarmonicBass([{...bentNote,pitch:100}],richer,48000,48000,2000),/Nyquist/);
const startup={...bentNote,pitch:123};
const limited=renderHarmonicBass([startup],richer,48000,48000,2000,[],'truncate');
assert.equal(limited.events.length,1,'High note must not be dropped');
assert.equal(limited.events[0].usedHarmonics,2);
assert.equal(limited.events[0].omittedUpperHarmonics,(richer.length-1)/2-2);
const lower=richer.slice(0,5);
assert.deepEqual(limited.pcm,renderHarmonicBass([startup],lower,48000,48000,2000).pcm,'Explicit band limit matches only the legal partials');
assert.throws(()=>renderHarmonicBass([startup],richer,48000,48000,2000,[],'skip'),/policy/);
const decayingNote={...bentNote,amplitudeModel:{decaySeconds:.01,sustainGain:.25}};
const decaying=renderHarmonicBass([decayingNote],coefficients,48000,48000,2000);
const unchanged=renderHarmonicBass([bentNote],coefficients,48000,48000,2000);
for(const frame of [500,1000,1500])for(const ch of [0,1]){
 const gain=Math.max(.25,Math.exp(-(frame-bentNote.startFrame)/48000/.01));
 assert.ok(Math.abs(decaying.pcm[frame*2+ch]-unchanged.pcm[frame*2+ch]*gain)<1e-8);
}
assert.throws(()=>renderHarmonicBass([{...bentNote,amplitudeModel:{decaySeconds:0,sustainGain:1}}],coefficients,48000,48000,2000),/amplitude/);
