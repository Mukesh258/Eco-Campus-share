import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "./Shuffle.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const Shuffle = ({
  text,
  className = "",
  style = {},
  shuffleDirection = "right",
  duration = 0.35,
  maxDelay = 0,
  ease = "power3.out",
  threshold = 0.1,
  rootMargin = "-100px",
  tag = "p",
  textAlign = "center",
  onShuffleComplete,
  shuffleTimes = 1,
  animationMode = "evenodd",
  loop = false,
  loopDelay = 0,
  stagger = 0.03,
  scrambleCharset = DEFAULT_CHARSET,
  colorFrom,
  colorTo,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true,
}) => {
  const ref = useRef(null);
  const letterRefs = useRef([]);
  const hoverHandlerRef = useRef(null);
  const tlRef = useRef(null);
  const playingRef = useRef(false);
  const [ready, setReady] = useState(false);

  const letters = useMemo(() => Array.from(text || ""), [text]);

  const shouldRunVertical = shuffleDirection === "up" || shuffleDirection === "down";

  const scrollTriggerStart = useMemo(() => {
    const startPct = (1 - threshold) * 100;
    const match = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin || "");
    const value = match ? parseFloat(match[1]) : 0;
    const unit = match ? match[2] || "px" : "px";
    const sign = value === 0 ? "" : value < 0 ? `-=${Math.abs(value)}${unit}` : `+=${value}${unit}`;
    return `top ${startPct}%${sign}`;
  }, [threshold, rootMargin]);

  useEffect(() => {
    letterRefs.current = letterRefs.current.slice(0, letters.length);
  }, [letters.length]);

  useGSAP(
    () => {
      if (!ref.current || !letters.length) return;

      if (respectReducedMotion && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        setReady(true);
        onShuffleComplete?.();
        return;
      }

      const randomChar = () => {
        if (!scrambleCharset) return "";
        return scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length)) || "";
      };

      const cleanup = () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
        playingRef.current = false;
      };

      const resetLetters = () => {
        letterRefs.current.forEach((el, index) => {
          if (!el) return;
          el.textContent = letters[index] === " " ? "\u00A0" : letters[index];
        });
      };

      const play = () => {
        const targets = letterRefs.current.filter(Boolean);
        if (!targets.length) return;

        cleanup();
        playingRef.current = true;

        const tl = gsap.timeline({
          repeat: loop ? -1 : 0,
          repeatDelay: loop ? loopDelay : 0,
          onRepeat: () => {
            targets.forEach((el, index) => {
              if (letters[index] !== " " && scrambleCharset) {
                el.textContent = randomChar();
              }
            });
          },
          onComplete: () => {
            playingRef.current = false;
            if (!loop) {
              resetLetters();
              if (colorTo && ref.current) {
                gsap.set(targets, { color: colorTo });
              }
              onShuffleComplete?.();
              armHover();
            }
          },
        });

        targets.forEach((el, index) => {
          const finalChar = letters[index];
          const isSpace = finalChar === " ";
          const offset = (index % 2 === 0 ? 1 : -1) * (24 + Math.random() * 28);
          const direction = shuffleDirection;
          const startX = direction === "left" ? -offset : direction === "right" ? offset : 0;
          const startY = direction === "up" ? -offset : direction === "down" ? offset : 0;

          const vars = {
            duration,
            ease,
            opacity: 1,
            delay: animationMode === "random" ? Math.random() * maxDelay : 0,
            stagger: animationMode === "evenodd" ? stagger : 0,
            x: 0,
            y: 0,
            onStart: () => {
              if (!isSpace && scrambleCharset) {
                el.textContent = randomChar();
              }
            },
            onUpdate: () => {
              if (!isSpace && scrambleCharset && Math.random() < 0.14) {
                el.textContent = randomChar();
              }
            },
            onComplete: () => {
              el.textContent = isSpace ? "\u00A0" : finalChar;
              if (index === targets.length - 1 && !loop) {
                onShuffleComplete?.();
              }
            },
          };

          if (shouldRunVertical) {
            gsap.set(el, { y: startY, x: 0, opacity: 0 });
          } else {
            gsap.set(el, { x: startX, y: 0, opacity: 0 });
          }

          tl.to(el, vars, animationMode === "evenodd" ? index * stagger * 0.55 : Math.random() * maxDelay);
        });

        tlRef.current = tl;
      };

      const removeHover = () => {
        if (hoverHandlerRef.current && ref.current) {
          ref.current.removeEventListener("mouseenter", hoverHandlerRef.current);
          hoverHandlerRef.current = null;
        }
      };

      const armHover = () => {
        if (!triggerOnHover || !ref.current) return;
        removeHover();
        const handler = () => {
          if (playingRef.current) return;
          play();
        };
        hoverHandlerRef.current = handler;
        ref.current.addEventListener("mouseenter", handler);
      };

      const st = ScrollTrigger.create({
        trigger: ref.current,
        start: scrollTriggerStart,
        once: triggerOnce,
        onEnter: () => {
          resetLetters();
          play();
          setReady(true);
        },
      });

      if (!triggerOnce) {
        setReady(true);
      }

      return () => {
        st.kill();
        removeHover();
        cleanup();
        setReady(false);
      };
    },
    {
      dependencies: [
        text,
        duration,
        maxDelay,
        ease,
        threshold,
        rootMargin,
        shuffleDirection,
        shuffleTimes,
        animationMode,
        loop,
        loopDelay,
        stagger,
        scrambleCharset,
        colorFrom,
        colorTo,
        triggerOnce,
        respectReducedMotion,
        triggerOnHover,
        scrollTriggerStart,
      ],
      scope: ref,
    }
  );

  const Tag = tag || "p";

  return (
    <Tag
      ref={ref}
      className={`shuffle-parent ${ready ? "is-ready" : ""} ${className}`}
      style={{ textAlign, ...style }}
      aria-label={text}
    >
      {letters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          ref={(node) => {
            letterRefs.current[index] = node;
          }}
          className="shuffle-char"
          aria-hidden="true"
        >
          {letter === " " ? "\u00A0" : letter}
        </span>
      ))}
    </Tag>
  );
};

export default Shuffle;