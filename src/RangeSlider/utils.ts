export function killEvent(event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) {
  event.stopPropagation();
  if (event.type !== 'touchmove') {
    event.preventDefault();
  }
}

// export function getHandleFor(event: Event) {
//   return Number(event.currentTarget.getAttribute('data-handle-key'));
// }

export function getPosition(value: number, min: number, max: number) {
  return (value - min) / (max - min) * 100;
}

export function getValue(pos: number, min: number, max: number) {
  const decimal = pos / 100;

  if (pos === 0) {
    return min;
  } else if (pos === 100) {
    return max;
  }

  return Math.round((max - min) * decimal + min);
}

export function addEventListeners(eventMap: [string, EventListenerOrEventListenerObject][]) {
  eventMap.forEach(node => document.addEventListener(node[0], node[1], false));
}

export function removeEventListeners(eventMap: [string, EventListenerOrEventListenerObject][]) {
  eventMap.forEach(node => document.removeEventListener(node[0], node[1], false));
}
