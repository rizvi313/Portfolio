import React, { useState, useEffect, useRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { MdClose as X } from 'react-icons/md';
import { FaQuoteLeft as Quote } from 'react-icons/fa';
import { useLanguage } from '@/context/LanguageContext';
// import { motion, AnimatePresence } from 'framer-motion'; 
// NOTE: We avoid Framer Motion for the continuous physics loop to prevent excessive re-renders,
// utilizing pure refs for extreme performance.
import SectionWrapper from '@/components/SectionWrapper';
import { testimonials as testimonialsData } from '@/data/testimonials';

// --- DATA ---
const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// --- STYLES ---

const InteractiveArea = styled.div`
  position: relative;
  width: 100%;
  height: 600px;
  background-color: transparent; // using Canvas behind
  overflow: hidden;
  border-image: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.text}10, transparent) 1;
  border-top: 1px solid;
  border-bottom: 1px solid;
  cursor: none; /* Hide default cursor everywhere inside */
  
  * { cursor: none !important; } /* Force hide cursor on children to use custom ring/dot */
`;

const CanvasWrapper = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
`;

// Fixed HTML Cursors matching user's Canvas cursor design
const CursorRing = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 140px; /* 70 * 2 = 140 base REPEL_RADIUS diameter */
  height: 140px;
  border: 1px solid #0EA5E9;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  will-change: transform, opacity;
  opacity: 0;
`;

const CursorDot = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  background-color: #0EA5E9;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  will-change: transform, opacity;
  opacity: 0;
`;

const BlobsWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
`;

const BlobObj = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  will-change: transform;
`;

const InactiveTitleWrap = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 10px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  white-space: nowrap;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text};
  font-family: 'Space Grotesk', sans-serif;
  text-align: center;
  pointer-events: none;
`;

const BubbleContent = styled.div`
  position: relative;
  border-radius: ${({ $isActive }) => $isActive ? '16px' : '50%'};
  width: ${({ $isActive }) => $isActive ? '350px' : '80px'};
  height: ${({ $isActive }) => $isActive ? 'auto' : '80px'};
  min-height: ${({ $isActive }) => $isActive ? '250px' : '80px'};
  background: ${({ theme, $isActive }) => 
    $isActive ? `${theme.colors.background}cc` : `rgba(255,255,255,0.03)`};
  backdrop-filter: ${({ $isActive }) => $isActive ? 'blur(12px)' : 'blur(4px)'};
  border: 1px solid ${({ theme, $isActive, $color }) => 
    $isActive ? ($color || theme.colors.accentLight) : `${theme.colors.text}20`};
  box-shadow: ${({ theme, $isActive, $color }) => 
    $isActive ? `0 0 30px ${$color || theme.colors.accentLight}40` : `0 4px 15px rgba(0,0,0,0.1)`};
  display: flex;
  flex-direction: ${({ $isActive }) => $isActive ? 'column' : 'row'};
  align-items: center;
  justify-content: ${({ $isActive }) => $isActive ? 'flex-start' : 'center'};
  padding: ${({ $isActive }) => $isActive ? '30px' : '0'};
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  z-index: ${({ $isActive }) => ($isActive ? 100 : 1)};
  
  &:hover ${InactiveTitleWrap} {
    opacity: 1;
    visibility: visible;
  }
`;

const InitialsCircle = styled.div`
  width: ${({ $isActive }) => $isActive ? '60px' : '80px'};
  height: ${({ $isActive }) => $isActive ? '60px' : '80px'};
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ $color, theme }) => $color || theme.colors.accent}, ${({ $color, theme }) => $color ? `${$color}80` : theme.colors.accentLight});
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: ${({ $isActive }) => $isActive ? '1.2rem' : '1.2rem'};
  font-family: 'Space Grotesk', sans-serif;
  flex-shrink: 0;
  transition: all 0.5s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  
  ${({ $isActive }) => $isActive && `
    margin-bottom: 20px;
  `}
`;

const QuoteIcon = styled(Quote)`
  color: ${({ $color, theme }) => $color || theme.colors.accentLight};
  opacity: 0.3;
  margin-bottom: 10px;
  width: 24px;
  height: 24px;
`;

const TextContent = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.95rem;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 20px;
`;

const AuthorInfo = styled.div`
  text-align: center;
  margin-top: auto;
`;

const AuthorName = styled.h4`
  margin: 0 0 5px 0;
  color: ${({ $color, theme }) => $color || theme.colors.accentLight};
  font-size: 1.1rem;
`;

const AuthorRole = styled.div`
  color: ${({ theme }) => theme.colors.text}a0;
  font-size: 0.85rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: ${({ theme }) => theme.colors.text};
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s ease;
  z-index: 10;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const BLOB_COLORS = [
  '#0ea5e9', // sky blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#14b8a6', // teal
  '#3b82f6', // blue
];

// Default physics constants
const BASE_SPEED_LIMIT = 2;

const Testimonials = () => {
  const { t, language } = useLanguage();
  const theme = useTheme();
  const [activeId, setActiveId] = useState(null);
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const cursorRingRef = useRef(null);
  const cursorDotRef = useRef(null);
  
  const bubbleRefs = useRef([]);
  const requestRef = useRef();

  // Mouse tracking logic via pure Refs to avoid React renders
  const mouseRef = useRef({ x: -1000, y: -1000 }); // global client coords for HTML cursors
  const canvasMouseRef = useRef({ x: -1000, y: -1000 }); // local coords for canvas drawing
  const isHovering = useRef(false);

  // Load correct translations
  const localizedData = testimonialsData.map((item, index) => {
    const locArr = t('testimonials.items') || [];
    const translation = locArr[index] || {};
    return { ...item, ...translation };
  });

  // State to hold dimensions/physics per item
  const physicsData = useRef(localizedData.map(() => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * 600,
    vx: (Math.random() - 0.5) * BASE_SPEED_LIMIT,
    vy: (Math.random() - 0.5) * BASE_SPEED_LIMIT,
  })));

  // === CANVAS PARTICLES BACKGROUND ===
  // === CANVAS PARTICLES BACKGROUND ===
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = containerRef.current?.clientWidth || window.innerWidth;
      canvas.height = 600;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animId;
    let particles = [];

    const img = new Image();
    img.src = `${process.env.NODE_ENV === 'production' ? '/Portfolio' : ''}/logo-fnl-trs-grn.png`;
    img.onload = () => {
      const svgW = img.naturalWidth;
      const svgH = img.naturalHeight;
      const logoSize = Math.min(window.innerWidth * 0.9, 1000);
      const scale = logoSize / Math.max(svgW, svgH);

      const offW = Math.ceil(svgW * scale) + 100;
      const offH = Math.ceil(svgH * scale) + 100;

      const off = document.createElement('canvas');
      off.width = offW;
      off.height = offH;
      const octx = off.getContext('2d');

      const offX = 50;
      const offY = 50;

      octx.save();
      octx.translate(offX, offY);
      octx.scale(scale, scale);
      octx.drawImage(img, 0, 0, svgW, svgH);
      octx.restore();

      const imgData = octx.getImageData(0, 0, offW, offH);
      const STEP = 5;

      for (let y = 0; y < offH; y += STEP) {
        for (let x = 0; x < offW; x += STEP) {
          const idx = (y * offW + x) * 4;
          if (imgData.data[idx + 3] > 128) {
            const isAccent = Math.random() > 0.5;
            particles.push({
              x, y,
              homeX: x, homeY: y,
              vx: 0, vy: 0,
              r: 2.2 + Math.random() * 1.2,
              color: isAccent ? '#0EA5E9' : '#3B82F6', // same blue theme as before
            });
          }
        }
      }

      const REPEL_RADIUS = 70;
      const REPEL_FORCE = 6;
      const SPRING = 0.1;
      const DAMPING = 0.75;

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerOffsetX = (canvas.width - offW) / 2;
        const centerOffsetY = (canvas.height - offH) / 2;
        const isMobile = window.innerWidth <= 768;

        for (const p of particles) {
          const mouseCanvasX = canvasMouseRef.current.x;
          const mouseCanvasY = canvasMouseRef.current.y;

          const dx = p.x + centerOffsetX - mouseCanvasX;
          const dy = p.y + centerOffsetY - mouseCanvasY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (!isMobile && dist < REPEL_RADIUS && mouseCanvasX > 0) {
            const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
            p.vx += (dx / dist) * force * REPEL_FORCE;
            p.vy += (dy / dist) * force * REPEL_FORCE;
          } else if (isMobile) {
            p.vx += (Math.random() - 0.5) * 0.4;
            p.vy += (Math.random() - 0.5) * 0.4;
          }

          p.vx += (p.homeX - p.x) * SPRING;
          p.vy += (p.homeY - p.y) * SPRING;
          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.x += p.vx;
          p.y += p.vy;

          ctx.beginPath();
          ctx.arc(p.x + centerOffsetX, p.y + centerOffsetY, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;

          if (!isMobile && dist < REPEL_RADIUS && mouseCanvasX > 0) {
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8 * ((REPEL_RADIUS - dist) / REPEL_RADIUS);
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        animId = requestAnimationFrame(draw);
      };

      draw();
    };

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, [theme]);


  // === HTML PHYSICS: Floating Testimonials Bubbles ===
  // Entirely powered by direct refs to prevent DOM re-renders causing FPS drops
  
  const tickPhysics = () => {
    const container = containerRef.current;
    if (!container) {
      requestRef.current = requestAnimationFrame(tickPhysics);
      return;
    }
    
    const width = container.clientWidth;
    const height = 600;

    const mouseCanvasX = canvasMouseRef.current.x;
    const mouseCanvasY = canvasMouseRef.current.y;

    // 1. Find the SINGLE closest blob to apply magnetic effect
    let closestBlobIndex = -1;
    let minMouseDist = Infinity;

    if (mouseCanvasX > 0 && !activeId) {
      physicsData.current.forEach((obj, idx) => {
          if (activeId === localizedData[idx].id) return;
          const dist = Math.hypot(mouseCanvasX - (obj.x + 40), mouseCanvasY - (obj.y + 40));
          if (dist < 200 && dist < minMouseDist) {
              minMouseDist = dist;
              closestBlobIndex = idx;
          }
      });
    }

    // 2. Resolve collisions and update positions
    bubbleRefs.current.forEach((blob, index) => {
      if (!blob) return;

      const obj = physicsData.current[index];
      const isCurrentlyActive = activeId === localizedData[index].id;
      
      blob.style.zIndex = isCurrentlyActive ? '1000' : '10';

      if (isCurrentlyActive) {
        obj.x += (width / 2 - 175 - obj.x) * 0.1;
        obj.y += (height / 2 - 125 - obj.y) * 0.1;
      } else {
        // Basic bounce boundaries
        if (obj.x <= 0 || obj.x >= width - 80) obj.vx *= -1;
        if (obj.y <= 0 || obj.y >= height - 80) obj.vy *= -1;

        // Force bounds
        obj.x = Math.max(0, Math.min(obj.x, width - 80));
        obj.y = Math.max(0, Math.min(obj.y, height - 80));

        // Magnetic attraction to mouse (only if it's the closest one)
        if (index === closestBlobIndex) {
            const targetX = obj.x + 40;
            const targetY = obj.y + 40;
            const dx = mouseCanvasX - targetX;
            const dy = mouseCanvasY - targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const force = (200 - dist) / 200;
            obj.vx += dx * force * 0.03; // Attract towards mouse gracefully
            obj.vy += dy * force * 0.03;
        }

        // Apply velocities
        obj.x += obj.vx;
        obj.y += obj.vy;

        // Friction to cap speed
        const speed = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy);
        if (speed > BASE_SPEED_LIMIT) {
          obj.vx = (obj.vx / speed) * BASE_SPEED_LIMIT;
          obj.vy = (obj.vy / speed) * BASE_SPEED_LIMIT;
        }
      }
    });

    // 3. Simple Iterative Collision Resolution among all non-active blobs
    for (let i = 0; i < physicsData.current.length; i++) {
        if (activeId === localizedData[i].id) continue;
        const obj1 = physicsData.current[i];
        
        for (let j = i + 1; j < physicsData.current.length; j++) {
            if (activeId === localizedData[j].id) continue;
            const obj2 = physicsData.current[j];
            
            const dx = obj2.x - obj1.x;
            const dy = obj2.y - obj1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 80; // Bubble diameter is 80px
            
            if (dist > 0 && dist < maxDist) {
                const overlap = (maxDist - dist) / 2;
                const pushForce = overlap * 0.1; // Smooth repulsion force
                const forceX = (dx / dist) * pushForce;
                const forceY = (dy / dist) * pushForce;
                
                // Nudge position directly and adjust velocity slightly
                obj1.x -= forceX;
                obj1.y -= forceY;
                obj2.x += forceX;
                obj2.y += forceY;
                
                obj1.vx -= forceX * 0.5;
                obj1.vy -= forceY * 0.5;
                obj2.vx += forceX * 0.5;
                obj2.vy += forceY * 0.5;
            }
        }
    }

    // 4. Update styling (EX: transform)
    bubbleRefs.current.forEach((blob, index) => {
        if (!blob) return;
        const obj = physicsData.current[index];
        blob.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
    });

    // Update absolute HTML custom cursors tracking the canvas coordinates directly
    if (cursorRingRef.current && cursorDotRef.current) {
      const localX = mouseCanvasX;
      const localY = mouseCanvasY;
      
      if (localX > 0 && localY > 0) {
        cursorRingRef.current.style.opacity = '0.3';
        cursorDotRef.current.style.opacity = '0.6';

        // Offset positions by half their absolute dimensions (140px -> -70px, 10px -> -5px)
        cursorRingRef.current.style.transform = `translate3d(${localX - 70}px, ${localY - 70}px, 0)`;
        cursorDotRef.current.style.transform = `translate3d(${localX - 5}px, ${localY - 5}px, 0)`;
        
        // When active dialog is open, we can expand ring
        if (activeId || isHovering.current) {
             cursorRingRef.current.style.transform = `translate3d(${localX - 70}px, ${localY - 70}px, 0) scale(1.5)`;
        } 
      } else {
        cursorRingRef.current.style.opacity = '0';
        cursorDotRef.current.style.opacity = '0';
      }
    }

    requestRef.current = requestAnimationFrame(tickPhysics);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tickPhysics);
    return () => cancelAnimationFrame(requestRef.current);
  });

  // Track global mouse
  const handleMouseMove = (e) => {
    // 1. Used for fixed HTML Cursors
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;

    // 2. Used for Container relative bounds (Physics & Canvas)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (containerRef.current.clientWidth / rect.width);
      const y = (e.clientY - rect.top) * (600 / rect.height);
      
      // We only care about mouse inside the container for the physics interactions
      if (e.clientY >= rect.top && e.clientY <= rect.bottom && e.clientX >= rect.left && e.clientX <= rect.right) {
          canvasMouseRef.current.x = x;
          canvasMouseRef.current.y = y;
      } else {
          canvasMouseRef.current.x = -1000;
          canvasMouseRef.current.y = -1000;
      }
    }
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000 };
    canvasMouseRef.current = { x: -1000, y: -1000 };
  };

  useEffect(() => {
    // Track global mouse exclusively for the cursor fixed layer
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <SectionWrapper 
      id="testimonials" 
      fullWidth={true}
      title={t('testimonials.title')}
      description={t('testimonials.description')}
    >
      <InteractiveArea 
        ref={containerRef} 
        onMouseLeave={handleMouseLeave}
        onClick={() => { if (activeId) setActiveId(null); }}
      >
        <CanvasWrapper ref={canvasRef} />

        <CursorRing ref={cursorRingRef} />
        <CursorDot ref={cursorDotRef} />

        <BlobsWrapper>
          {localizedData.map((item, index) => {
            const isActive = activeId === item.id;
            const blobColor = BLOB_COLORS[index % BLOB_COLORS.length];
            // The styled component relies on isActive. When clicked, activeId changes => forces ONE re-render
            // which safely triggers the massive CSS transition safely. 
            // All other positioning uses pure `ref` transformations every frame! (60fps guaranteed)

            return (
              <BlobObj 
                key={item.id} 
                ref={el => bubbleRefs.current[index] = el}
                onMouseEnter={() => { isHovering.current = true; }}
                onMouseLeave={() => { isHovering.current = false; }}
              >
                <BubbleContent 
                  $isActive={isActive} 
                  $color={blobColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isActive) setActiveId(item.id);
                  }}
                >
                  {isActive && (
                    <CloseButton onClick={(e) => { e.stopPropagation(); setActiveId(null); }}>
                      <X size={18} />
                    </CloseButton>
                  )}
                  
                  <InitialsCircle $isActive={isActive} $color={blobColor}>
                    {getInitials(item.name)}
                  </InitialsCircle>

                  {isActive ? (
                    <div style={{ marginLeft: language === 'ar' ? '0' : '20px', marginRight: language === 'ar' ? '20px' : '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <QuoteIcon $color={blobColor} />
                      <TextContent>"{item.content}"</TextContent>
                      <AuthorInfo>
                        <AuthorName $color={blobColor}>{item.name}</AuthorName>
                        <AuthorRole>{item.role}</AuthorRole>
                      </AuthorInfo>
                    </div>
                  ) : (
                    <InactiveTitleWrap>
                      {item.role}
                    </InactiveTitleWrap>
                  )}
                </BubbleContent>
              </BlobObj>
            );
          })}
        </BlobsWrapper>

      </InteractiveArea>
    </SectionWrapper>
  );
};

export default Testimonials;
