import React, { useEffect, useState } from "react";
import { useQueue } from "react-use";

interface Props {
  children: JSX.Element;
}

export const DeckSmoothScroller = ({ children }: Props) => {
  const [offset, setOffset] = useState(0);
  const [startTouchX, setStartTouchX] = useState<number | undefined>(undefined);

  const queue = useQueue<number | undefined>();
  let wheelTimeout: any;

  useEffect(() => {
    if (typeof queue.first === "number") {
      const addColumnRect = document
        .querySelector(".add-new-column-button")
        ?.getBoundingClientRect();

      if (addColumnRect) {
        const addColumnOffset = addColumnRect.x + addColumnRect.width;
        const isAddColumnOutOfView = addColumnOffset > window.innerWidth;

        const isAbleToScrollLeft = queue.first > offset && queue.first <= 0;
        const isAbleToScrollRight = queue.first <= offset && isAddColumnOutOfView;

        if (isAbleToScrollLeft || isAbleToScrollRight) {
          setOffset(queue.first);
        }
      }
    }
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => queue.remove(), 400);
  }, [queue.first]);

  const getColumnWidth = () => {
    const anyDeckColumn = document.querySelector(".deck");
    if (anyDeckColumn) {
      return anyDeckColumn.clientWidth + 2; // 2 is border
    }
    return 0;
  };

  return (
    <div
      className="deck-smooth-scroller"
      style={{ transform: `translateX(${offset}px)` }}
      onWheel={({ deltaX }) => {
        if (queue.size > 0) {
          return;
        }
        queue.add(offset + getColumnWidth() * Math.sign(-deltaX));
      }}
      onTouchStart={({ touches }) => {
        setStartTouchX(touches.item(0).pageX);
      }}
      onTouchMove={({ touches }) => {
        if (typeof startTouchX === "number") {
          if (queue.size > 0) {
            return;
          }

          const deltaX = startTouchX - touches.item(0).pageX;
          queue.add(offset + getColumnWidth() * Math.sign(-deltaX));
        }
      }}
    >
      {children}
    </div>
  );
};
