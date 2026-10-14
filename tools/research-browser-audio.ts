/** Archived local sample measurement; not imported by the shipped app. */
export function browserTestAudioDiagnostics(location:Pick<Location,'hostname'|'search'>){
 return ['localhost','127.0.0.1','[::1]','::1'].includes(location.hostname)&&new URLSearchParams(location.search).get('preview-audio')==='observe';
}
