/** Source44e5..4604. Caller enumerates at most32 CARxxxx resources. */
export function originalCarMenuList(input:ReadonlyArray<string>,current:string){
 const names=input.slice(0,32).map(name=>name.slice(0,4));
 for(let i=0;i<names.length-1;i++)for(let j=i+1;j<names.length;j++)if(names[i]>names[j])[names[i],names[j]]=[names[j],names[i]];
 const selected=names.indexOf(current.slice(0,4));return {names,selected:selected<0?0:selected};
}
