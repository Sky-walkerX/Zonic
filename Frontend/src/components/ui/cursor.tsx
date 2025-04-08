// CustomCursor.tsx
import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const bigBallRef = useRef<HTMLDivElement>(null); // No initial value needed here, defaults to null
  const smallBallRef = useRef<HTMLDivElement>(null); // No initial value needed here, defaults to null
  const hoverablesRef = useRef<NodeListOf<Element> | null>(null); // Explicitly type with null as initial value

  useEffect(() => {
    const bigBall = bigBallRef.current;
    const smallBall = smallBallRef.current;
    hoverablesRef.current = document.querySelectorAll('.hoverable');

    const onMouseMove = (e: MouseEvent) => {
      if (bigBall && smallBall) {
        const easeFactor = 0.4;
        const targetXBig = e.pageX - 15;
        const targetYBig = e.pageY - 15;
        const targetXSmall = e.pageX - 5;
        const targetYSmall = e.pageY - 7;

        if (bigBall.style.transform) {
          const currentTransform = bigBall.style.transform.match(/translate\(([^,]+),([^)]+)\)/) || [0, '0px', '0px'];
          const currentX = parseFloat(currentTransform[1]) || 0;
          const currentY = parseFloat(currentTransform[2]) || 0;

          bigBall.style.transform = `translate(${currentX + (targetXBig - currentX) * easeFactor}px, ${currentY + (targetYBig - currentY) * easeFactor}px)`;
        } else {
          bigBall.style.transform = `translate(${targetXBig}px, ${targetYBig}px)`;
        }

        if (smallBall.style.transform) {
          const currentTransform = smallBall.style.transform.match(/translate\(([^,]+),([^)]+)\)/) || [0, '0px', '0px'];
          const currentX = parseFloat(currentTransform[1]) || 0;
          const currentY = parseFloat(currentTransform[2]) || 0;

          smallBall.style.transform = `translate(${currentX + (targetXSmall - currentX) * 0.1}px, ${currentY + (targetYSmall - currentY) * 0.1}px)`;
        } else {
          smallBall.style.transform = `translate(${targetXSmall}px, ${targetYSmall}px)`;
        }
      }
    };

    const onMouseHover = () => {
      if (bigBall) {
        bigBall.style.transform = 'scale(4)';
      }
    };

    const onMouseHoverOut = () => {
      if (bigBall) {
        bigBall.style.transform = 'scale(1)';
      }
    };

    document.body.addEventListener('mousemove', onMouseMove);

    if (hoverablesRef.current) {
      hoverablesRef.current.forEach((hoverable) => {
        hoverable.addEventListener('mouseenter', onMouseHover);
        hoverable.addEventListener('mouseleave', onMouseHoverOut);
      });
    }

    // Cleanup
    return () => {
      document.body.removeEventListener('mousemove', onMouseMove);
      if (hoverablesRef.current) {
        hoverablesRef.current.forEach((hoverable) => {
          hoverable.removeEventListener('mouseenter', onMouseHover);
          hoverable.removeEventListener('mouseleave', onMouseHoverOut);
        });
      }
    };
  }, []);

  return (
    <div className="cursor pointer-events-none">
      <div ref={bigBallRef} className="cursor__ball cursor__ball--big">
        <svg height="30" width="30" className="fill-white">
          <circle cx="15" cy="15" r="12" strokeWidth="0" />
        </svg>
      </div>
      <div ref={smallBallRef} className="cursor__ball cursor__ball--small">
        <svg height="10" width="10" className="fill-white">
          <circle cx="5" cy="5" r="4" strokeWidth="0" />
        </svg>
      </div>
    </div>
  );
};

export default CustomCursor;