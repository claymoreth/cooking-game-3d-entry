// Copper Ladle Kitchen 3D — mouse (raycast clicks) + keyboard.
// Maps raw input to kitchen actions; knows nothing about Three.js itself —
// the scene object passed in does the raycasting (scene.pick).
export function attachInput(canvas, scene, actions) {
  function ndcFromEvent(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((ev.clientY - rect.top) / rect.height) * 2 - 1),
      clientX: ev.clientX,
      clientY: ev.clientY,
    };
  }

  canvas.addEventListener('pointermove', (ev) => {
    const p = ndcFromEvent(ev);
    actions.onPointerMove(p.x, p.y, ev.clientX, ev.clientY);
  });

  canvas.addEventListener('pointerdown', (ev) => {
    actions.onGesture();
    const p = ndcFromEvent(ev);
    actions.onCanvasClick(p.x, p.y);
  });

  window.addEventListener('keydown', (ev) => {
    // Ignore repeats for action keys (holding Space should not serve twice).
    if (ev.repeat && ev.code !== 'KeyP' && ev.code !== 'KeyM') return;
    actions.onGesture();
    const key = ev.key;
    if (key >= '1' && key <= '6') {
      actions.onPickKey(key);
      return;
    }
    switch (key) {
      case ' ':
        ev.preventDefault();
        actions.onSpace();
        break;
      case 'Enter':
        actions.onEnter();
        break;
      case 'x':
      case 'X':
        actions.onTrash();
        break;
      case 'p':
      case 'P':
        actions.onPause();
        break;
      case 'm':
      case 'M':
        actions.onMute();
        break;
      case 'r':
      case 'R':
        actions.onRestart();
        break;
      default:
        break;
    }
  });
}
