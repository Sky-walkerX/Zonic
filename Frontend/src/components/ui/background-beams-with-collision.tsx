"use client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import React, { useRef, useState, useEffect, RefObject } from "react"; // Import RefObject for clarity

export const BackgroundBeamsWithCollision = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  // Refs created here are type RefObject<HTMLDivElement | null>
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const beams = [
    // ... (your beam data remains the same)
    { initialX: 10, translateX: 10, duration: 7, repeatDelay: 3, delay: 2 },
    { initialX: 600, translateX: 600, duration: 3, repeatDelay: 3, delay: 4 },
    { initialX: 100, translateX: 100, duration: 7, repeatDelay: 7, className: "h-6" },
    { initialX: 400, translateX: 400, duration: 5, repeatDelay: 14, delay: 4 },
    { initialX: 800, translateX: 800, duration: 11, repeatDelay: 2, className: "h-20" },
    { initialX: 1000, translateX: 1000, duration: 4, repeatDelay: 2, className: "h-12" },
    { initialX: 1200, translateX: 1200, duration: 6, repeatDelay: 4, delay: 2, className: "h-6" },
  ];

  return (
    <div
      ref={parentRef} // parentRef attached here
      className={cn(
        "h-96 md:h-[40rem] bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-950 dark:to-neutral-800 relative flex items-center w-full justify-center overflow-hidden",
        className
      )}
    >
      {/* FIX 2: Use index for key and apply type assertions for refs */}
      {beams.map((beam, index) => (
        <CollisionMechanism
          key={`beam-${index}`} // Use index for a guaranteed unique key
          beamOptions={beam}
          // Use type assertion 'as' to satisfy CollisionMechanism's prop types
          containerRef={containerRef as RefObject<HTMLDivElement>}
          parentRef={parentRef as RefObject<HTMLDivElement>}
        />
      ))}

      {children}

      {/* The collision target container */}
      <div
        ref={containerRef} // containerRef attached here
        className="absolute bottom-0 bg-neutral-100 dark:bg-neutral-800/50 w-full h-10 inset-x-0 pointer-events-none" // Added dark mode bg & some height for visibility
        style={{
          boxShadow:
            "0 -4px 12px rgba(34, 42, 53, 0.1), 0 -1px 1px rgba(0, 0, 0, 0.05)", // Simplified shadow for example
        }}
      ></div>
    </div>
  );
};


// ===========================================
// CollisionMechanism and Explosion components
// remain the same as you provided.
// ===========================================

const CollisionMechanism = React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement>; // Expects non-nullable
    parentRef: React.RefObject<HTMLDivElement>;   // Expects non-nullable
    beamOptions?: {
      initialX?: number;
      translateX?: number;
      initialY?: number;
      translateY?: number;
      rotate?: number;
      className?: string;
      duration?: number;
      delay?: number;
      repeatDelay?: number;
    };
  }
>(({ parentRef, containerRef, beamOptions = {} }, ref) => { // ref param from forwardRef is unused here, but okay
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = useState<{
    detected: boolean;
    coordinates: { x: number; y: number } | null;
  }>({
    detected: false,
    coordinates: null,
  });
  const [beamKey, setBeamKey] = useState(0); // Used to reset animation
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false); // Prevent multi-detect per cycle

  useEffect(() => {
    const checkCollision = () => {
      // Null checks are important, even if types imply non-null at compile time
      if (
        beamRef.current &&
        containerRef.current &&
        parentRef.current &&
        !cycleCollisionDetected // Only detect once per animation cycle
      ) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        // Check if the bottom of the beam hits the top of the container
        if (beamRect.bottom >= containerRect.top && beamRect.top < containerRect.bottom) { // Added check to ensure beam is somewhat overlapping
          // Calculate collision point relative to the parent container
          const relativeX =
            beamRect.left - parentRect.left + beamRect.width / 2; // Center of beam horizontally
          const relativeY = beamRect.bottom - parentRect.top; // Bottom edge of beam vertically

          setCollision({
            detected: true,
            coordinates: {
              x: relativeX,
              y: relativeY,
            },
          });
          setCycleCollisionDetected(true); // Mark collision detected for this cycle
        }
      }
    };

    // Check frequently during animation
    const animationInterval = setInterval(checkCollision, 50); // Check every 50ms

    // Cleanup interval on unmount or when dependencies change
    return () => clearInterval(animationInterval);
    // containerRef/parentRef refs don't change, cycleCollisionDetected triggers re-evaluation if needed
  }, [cycleCollisionDetected, containerRef, parentRef]);

  useEffect(() => {
    // Handle post-collision effects
    if (collision.detected && collision.coordinates) {
      // Delay before hiding explosion and allowing new collision detection
      const hideTimeout = setTimeout(() => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false); // Allow detection again
      }, 1800); // Slightly shorter than explosion animation

      // Delay before resetting the beam animation (forces remount via key change)
      const resetTimeout = setTimeout(() => {
        setBeamKey((prevKey) => prevKey + 1); // Change key to restart animation fully
      }, 2000); // After explosion fades

      return () => { // Cleanup timeouts if component unmounts or collision state changes early
        clearTimeout(hideTimeout);
        clearTimeout(resetTimeout);
      }
    }
  }, [collision]); // Depend only on the collision state object

  return (
    <>
      <motion.div
        key={beamKey} // Changing key forces component remount/reset
        ref={beamRef}
        animate="animate"
        initial={{
          translateY: beamOptions.initialY || "-200px", // Start above view
          translateX: beamOptions.initialX || "0px",
          rotate: beamOptions.rotate || 0,
        }}
        variants={{
          animate: {
            translateY: beamOptions.translateY || "1800px", // End far below view
            translateX: beamOptions.translateX || "0px",
            rotate: beamOptions.rotate || 0,
          },
        }}
        transition={{
          duration: beamOptions.duration || 8,
          repeat: Infinity,
          repeatType: "loop", // Use loop to restart from initial immediately
          ease: "linear",
          delay: beamOptions.delay || 0,
          repeatDelay: beamOptions.repeatDelay || 0,
        }}
        className={cn(
          "absolute left-0 top-0 m-auto h-14 w-px rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-transparent", // Removed top-20, initialY handles start
          beamOptions.className
        )}
      />
      {/* Render explosion on collision */}
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            // Key ensures new instance if coordinates change rapidly (unlikely here)
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            className=""
            style={{
              position: "absolute", // Ensure explosion is positioned correctly
              left: `${collision.coordinates.x}px`,
              top: `${collision.coordinates.y}px`,
              transform: "translate(-50%, -50%)", // Center explosion on collision point
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
});

CollisionMechanism.displayName = "CollisionMechanism";

const Explosion = ({ ...props }: React.HTMLProps<HTMLDivElement>) => {
  // Array for generating multiple particle spans
  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    // Random outward direction for each particle
    directionX: Math.floor(Math.random() * 80 - 40), // Random horizontal spread
    directionY: Math.floor(Math.random() * -60 - 20), // Random upward spread
  }));

  return (
    // Container for the explosion effect
    <div {...props} className={cn("absolute z-50 h-2 w-2 pointer-events-none", props.className)}>
      {/* Central flash effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }} // Faster flash fade
        className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm"
      ></motion.div>
      {/* Individual particles */}
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{
            x: span.directionX,
            y: span.directionY,
            opacity: 0,
          }}
          // Randomized duration for each particle's fade/movement
          transition={{ duration: Math.random() * 1.0 + 0.5, ease: "easeOut" }}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500"
        />
      ))}
    </div>
  );
};