export function killEvent(event: Event) {
  event.stopPropagation();
  event.preventDefault();
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
