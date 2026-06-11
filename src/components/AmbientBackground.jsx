import { useEffect, useRef } from "react";

export default function AmbientBackground() {
  const glowRef = useRef(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    let raf = null;
    const move = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        glow.style.left = `${e.clientX}px`;
        glow.style.top  = `${e.clientY}px`;
        raf = null;
      });
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const particles = [
    { left: "7%",  dur: "22s", delay: "0s"    },
    { left: "18%", dur: "29s", delay: "3.5s"  },
    { left: "29%", dur: "36s", delay: "7s"    },
    { left: "40%", dur: "25s", delay: "10.5s" },
    { left: "51%", dur: "32s", delay: "14s"   },
    { left: "62%", dur: "27s", delay: "5s"    },
    { left: "73%", dur: "38s", delay: "1.5s"  },
    { left: "84%", dur: "23s", delay: "9s"    },
    { left: "92%", dur: "31s", delay: "12s"   },
  ];

  return (
    <>
      <div className="ambient-bg">
        <div className="ambient-blob-a" />
        <div className="ambient-blob-b" />
        <div className="ambient-ember" />
        {particles.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={{ left: p.left, animationDuration: p.dur, animationDelay: p.delay }}
          />
        ))}
      </div>
      <div
        ref={glowRef}
        className="cursor-glow"
        style={{ left: "50%", top: "30%" }}
      />
    </>
  );
}