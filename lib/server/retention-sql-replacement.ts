/** Fail closed when a retention template changes; never silently lose scope. */
export function replaceRetentionSQL(source:string,expected:string,replacement:string){
 const first=source.indexOf(expected);
 if(!expected||first<0||source.indexOf(expected,first+expected.length)>=0)throw Error('Retention SQL template changed; engine scoping requires review');
 return source.slice(0,first)+replacement+source.slice(first+expected.length);
}
