export function getDraggableStyle(
  style: any,
  snapshot: { isDragging: boolean; isDropAnimating: boolean }
) {
  if (!style) return style;
  if (snapshot.isDropAnimating) {
    return { ...style, transitionDuration: "0.001s" };
  }
  if (snapshot.isDragging) {
    return { ...style, willChange: "transform" };
  }
  return style;
}
