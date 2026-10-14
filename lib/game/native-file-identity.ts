/** DOS identity only; never rewrite a retained persistence key. */
export function nativeStoredFileIdentity(key:string){return key.toUpperCase().replace(/\\+/g,'\\');}
