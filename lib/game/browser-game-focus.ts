/** Automatic game transitions must not take the keyboard from an open Setup.
 * A direct click on the game still focuses it through the pointer adapter. */
export function focusBrowserGameCanvas(canvas:HTMLCanvasElement){
 const focused=canvas.ownerDocument?.activeElement;
 if(focused?.closest('.native-setup-panel[data-running="true"]'))return false;
 canvas.focus({preventScroll:true});return true;
}
