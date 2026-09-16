type CompatibleAudioParam=Pick<AudioParam,'value'|'cancelScheduledValues'|'setValueAtTime'>&{
 cancelAndHoldAtTime?:AudioParam['cancelAndHoldAtTime'];
};

/** Hold an AudioParam at the interruption point. Firefox, Safari and older
 * Web Audio implementations may not expose cancelAndHoldAtTime, so preserve
 * the current value before scheduling the replacement automation. */
export function cancelAndHoldAudioParam(parameter:CompatibleAudioParam,at:number){
 const hold=parameter.cancelAndHoldAtTime;
 if(typeof hold==='function'){hold.call(parameter,at);return;}
 const value=parameter.value;
 parameter.cancelScheduledValues(at);
 parameter.setValueAtTime(value,at);
}
