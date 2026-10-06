/** Display-only filtering: proof bytes and canonical score identity stay intact.
 * Avoid innocent substrings such as Scunthorpe, Dickinson and assistant. */
export function publicScoreName(value:string){
 const normalized=value.toLowerCase().replace(/[013457@$!]/g,c=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i'}[c]!));
 const compact=normalized.replace(/[^a-z]/g,'');
 const severe=['fuck','motherfucker','nigger','faggot','bullshit','shithead','asshole'];
 if(severe.some(word=>compact.includes(word))||/(^|[^a-z])(shit|cunt|bitch|asshole|wanker|bastard|faen|jævla|kuk)([^a-z]|$)/i.test(normalized))return '••••';
 return value.trim()||'Anonymous';
}
