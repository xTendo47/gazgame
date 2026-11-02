// Значки казино для экранов игр «Тусовки»: один цвет (currentColor), SVG вместо эмодзи.
// <GIcon name="fire" /> — значок по имени; <Glyph emoji="🔪" /> — значок для эмодзи из данных (роли, ранги, колоды):
// так тексты в JSON остаются как есть, а на экране рисуется SVG. Незнакомое эмодзи → золотая фишка с буквой.
import { MORE_ICONS } from "./GIconsMore";
import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ICONS = {
  fire: <path d="M12 3c1 3.500 5 5.500 5 10.500a5 5 0 0 1-10 0c0-2 1-3.500 2-4.500.2 1.500.8 2.300 1.700 2.800C10.500 9 10.800 5.500 12 3z" fill="currentColor" />,
  next: <path d="M5 6l6 6-6 6M12 6l6 6-6 6" {...S} />,
  snowflake: <path d="M12 2v20M4 7l16 10M20 7L4 17M9 4l3 2 3-2M9 20l3-2 3 2" {...S} strokeWidth="1.700" />,
  swords: <path d="M4 4l9 9M3 5l2 2M13 13l-2 2M9 17l-4 4M20 4l-9 9M21 5l-2 2M11 13l2 2M15 17l4 4M6 13l5 5" {...S} strokeWidth="1.700" />,
  bubble: <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 10h8M8 13h5" {...S} strokeWidth="1.700" />,
  clock: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3.500 2" {...S} />,
  gear: <path d="M12 8.500a3.500 3.500 0 1 0 0 7 3.500 3.500 0 0 0 0-7zM12 2.500l1.500 2.500 2.800-.7.7 2.800 2.500 1.500-1.500 2.400 1.500 2.400-2.500 1.500-.7 2.800-2.800-.7L12 21.500l-1.500-2.500-2.800.7-.7-2.800-2.500-1.500 1.500-2.400-1.500-2.400 2.500-1.500.7-2.800 2.800.7z" {...S} strokeWidth="1.500" />,
  smile: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.500 14c1 1.800 2.200 2.500 3.500 2.500s2.500-.7 3.500-2.500M9 9.500h.1M15 9.500h.1" {...S} />,
  user: <path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.500 21c.5-4.500 3.500-7 7.500-7s7 2.500 7.500 7" {...S} />,
  headphones: <path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z" {...S} />,
  speaker: <path d="M4 9v6h4l5 4V5L8 9zM16.500 9c1.500 1.500 1.500 4.500 0 6M19 6.500c3 3 3 8 0 11" {...S} />,
  play: <path d="M7 4.500v15a1 1 0 0 0 1.500.9l12-7.500a1 1 0 0 0 0-1.800l-12-7.500A1 1 0 0 0 7 4.500z" fill="currentColor" />,
  pause: <path d="M7 4h3.500v16H7zM13.500 4H17v16h-3.500z" fill="currentColor" />,
  back: <path d="M19 6l-6 6 6 6M12 6l-6 6 6 6" {...S} />,
  arrow: <path d="M4 12h15M13 6l6 6-6 6" {...S} />,
  arrowBack: <path d="M20 12H5M11 6l-6 6 6 6" {...S} />,
  flag: (
    <>
      <path d="M5 21V4" {...S} />
      <path d="M5 4h13l-2.500 4L18 12H5z" fill="currentColor" />
    </>
  ),
  refresh: <path d="M20 12a8 8 0 1 1-2.400-5.700M20 4v5h-5" {...S} />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4c0 3 1.500 5 3.500 5M17 6h3c0 3-1.500 5-3.500 5M12 14v4M8 20h8" {...S} />
    </>
  ),
  crown: <path d="M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5zM5 21h14" fill="currentColor" stroke="currentColor" strokeWidth="1.400" strokeLinejoin="round" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.500" fill="currentColor" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" {...S} />
    </>
  ),
  diamond: <path d="M7 4h10l4 5-9 11L3 9zM3 9h18M9 4l-2 5 5 11 5-11-2-5" {...S} strokeWidth="1.600" />,
  timer: (
    <>
      <circle cx="12" cy="13.500" r="7.500" {...S} />
      <path d="M12 9.500v4l2.500 2M9.500 3h5M12 3v3" {...S} />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.500" {...S} />
      <circle cx="8.800" cy="8.800" r="1.400" fill="currentColor" />
      <circle cx="15.200" cy="8.800" r="1.400" fill="currentColor" />
      <circle cx="12" cy="12" r="1.400" fill="currentColor" />
      <circle cx="8.800" cy="15.200" r="1.400" fill="currentColor" />
      <circle cx="15.200" cy="15.200" r="1.400" fill="currentColor" />
    </>
  ),
  knife: <path d="M5 20l3-3M7 15l9.500-10c1.500-.5 3 0 3.500.5-.5 3.500-3 7-6 9l-3.500 1.500z" fill="currentColor" stroke="currentColor" strokeWidth="1.400" strokeLinejoin="round" />,
  moon: <path d="M19 14.500A8 8 0 0 1 9.500 5 8 8 0 1 0 19 14.500z" fill="currentColor" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.200" fill="currentColor" />
      <path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800" {...S} />
    </>
  ),
  skull: (
    <>
      <path d="M12 3C7.500 3 5 6 5 9.500c0 2.500 1 4 2.500 5V18h9v-3.500c1.500-1 2.500-2.500 2.500-5C19 6 16.500 3 12 3z" fill="currentColor" />
      <circle cx="9.300" cy="10.200" r="1.700" fill="#0b2a1c" />
      <circle cx="14.700" cy="10.200" r="1.700" fill="#0b2a1c" />
      <path d="M10 21v-3M12 21v-3M14 21v-3" stroke="currentColor" strokeWidth="1.700" strokeLinecap="round" />
    </>
  ),
  hide: (
    <>
      <path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" {...S} />
      <circle cx="12" cy="12" r="2.800" {...S} />
      <path d="M4 4l16 16" {...S} />
    </>
  ),
  eyes: (
    <>
      <circle cx="7.500" cy="12" r="4.300" {...S} />
      <circle cx="16.500" cy="12" r="4.300" {...S} />
      <circle cx="8.300" cy="12.400" r="1.600" fill="currentColor" />
      <circle cx="17.300" cy="12.400" r="1.600" fill="currentColor" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5.500 11a6.500 6.500 0 0 0 13 0M12 17.500V21M8.500 21h7" {...S} />
    </>
  ),
  cards: (
    <>
      <rect x="3.500" y="6" width="10" height="14" rx="2" transform="rotate(-12 8.500 13)" {...S} />
      <rect x="10.500" y="4.500" width="10" height="14" rx="2" fill="currentColor" transform="rotate(10 15.500 11.500)" />
    </>
  ),
  spy: (
    <>
      <path d="M3 11h18M6 11l1.500-6h9L18 11" {...S} />
      <circle cx="8" cy="16" r="3" {...S} />
      <circle cx="16" cy="16" r="3" {...S} />
      <path d="M11 16h2" {...S} />
    </>
  ),
  thumbUp: <path d="M7 11v9H4v-9zM7 11l4-8c1.700 0 2.500 1 2.200 2.600L12.700 9H19a2 2 0 0 1 2 2.300l-1.200 6.500A2.500 2.500 0 0 1 17.300 20H7" {...S} />,
  thumbDown: <path d="M7 13V4H4v9zM7 13l4 8c1.700 0 2.500-1 2.200-2.600L12.700 15H19a2 2 0 0 0 2-2.300l-1.200-6.500A2.500 2.500 0 0 0 17.300 4H7" {...S} />,
  phone: (
    <>
      <rect x="6.500" y="2.500" width="11" height="19" rx="2.500" {...S} />
      <path d="M10.500 18.500h3" {...S} />
    </>
  ),
  link: <path d="M10 14a4 4 0 0 0 5.700 0l3-3A4 4 0 0 0 13 5.300l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3A4 4 0 0 0 11 18.700l1-1" {...S} />,
  key: (
    <>
      <circle cx="8" cy="12" r="4.500" {...S} />
      <path d="M12.500 12H21M18 12v3.500M15 12v2.500" {...S} />
    </>
  ),
  check: <path d="M4.500 12.500l5 5L19.500 7" {...S} strokeWidth="2.600" />,
  cross: <path d="M6 6l12 12M18 6L6 18" {...S} strokeWidth="2.600" />,
  star: <path d="M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z" fill="currentColor" />,
  horse: <path d="M7 21h11M9 21c0-4 1.500-5 1.500-7.500C8.500 13 7 11 7 9c0-3 2.500-5.500 6-5.500l1.500 2.500c2 .5 3.500 2.500 3.500 5 0 3-1 5-1 10" fill="currentColor" stroke="currentColor" strokeWidth="1.400" strokeLinejoin="round" />,
  lips: <path d="M3 12c3-4 6-4.500 9-2.500 3-2 6-1.500 9 2.500-3 5-6 6-9 6s-6-1-9-6zM3 12h18" {...S} />,
  city: <path d="M3 21V10h6v11M9 21V4h6v17M15 21v-8h6v8M2 21h20M11.500 8h1M11.500 12h1M11.500 16h1" {...S} />,
  pin: (
    <>
      <path d="M12 21s-6.500-6-6.500-11a6.500 6.500 0 0 1 13 0c0 5-6.500 11-6.500 11z" {...S} />
      <circle cx="12" cy="10" r="2.300" fill="currentColor" />
    </>
  ),
  hand: <path d="M8 12V5.500a1.500 1.500 0 0 1 3 0V11M11 10V4a1.500 1.500 0 0 1 3 0v6M14 10V5.500a1.500 1.500 0 0 1 3 0V13M17 9.500a1.500 1.500 0 0 1 3 0V14c0 4-3 7-7 7-3 0-4.500-1.500-6.500-4.500L4 12.500c-.5-1 .5-2.200 1.700-1.700L8 12.500" {...S} strokeWidth="1.700" />,
  heart: <path d="M12 20S3.500 14.500 3.500 8.800A4.600 4.600 0 0 1 12 6.500a4.600 4.600 0 0 1 8.500 2.300C20.500 14.500 12 20 12 20z" fill="currentColor" />,
  bulb: (
    <>
      <path d="M9 17c0-2-3-3.500-3-7a6 6 0 0 1 12 0c0 3.500-3 5-3 7z" {...S} />
      <path d="M9.500 20.500h5M10.500 17.500v3" {...S} />
    </>
  ),
  puzzle: <path d="M4 9h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v4H4v-4a2 2 0 1 0 0-4zM14 12h6v8h-6" {...S} strokeWidth="1.700" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.500" {...S} />
      <circle cx="12" cy="12" r="4.500" {...S} />
      <circle cx="12" cy="12" r="1.500" fill="currentColor" />
    </>
  ),
  chat: <path d="M4 5h16v11H11l-5 4v-4H4z" {...S} />,
  cup: <path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 9.500h1.500a2.500 2.500 0 0 1 0 5H16M8 3.500v2M11 3.500v2M14 3.500v2" {...S} />,
  wave: <path d="M2 9c2.500-3 4.500-3 7 0s4.500 3 7 0 3-2.500 6 0M2 15c2.500-3 4.500-3 7 0s4.500 3 7 0 3-2.500 6 0" {...S} />,
  rocket: <path d="M12 2.500c3.500 2 5 6 4.500 10l-2 3h-5l-2-3c-.5-4 1-8 4.500-10zM9.500 15.500L7 20l3-1M14.500 15.500L17 20l-3-1M12 8.500v.1" {...S} />,
  brain: <path d="M12 5v15M12 5a3.500 3.500 0 0 0-6.500 1.500A3.500 3.500 0 0 0 4 12a3.500 3.500 0 0 0 2 5 3.500 3.500 0 0 0 6 1.500M12 5a3.500 3.500 0 0 1 6.500 1.500A3.500 3.500 0 0 1 20 12a3.500 3.500 0 0 1-2 5 3.500 3.500 0 0 1-6 1.500" {...S} strokeWidth="1.700" />,
  bolt: <path d="M13.500 2.500L5 13.500h6l-1 8 8.500-11h-6z" fill="currentColor" />,
  magnet: <path d="M5 4v9a7 7 0 0 0 14 0V4h-4v9a3 3 0 0 1-6 0V4zM5 8h4M15 8h4" {...S} />,
  turtle: <path d="M4 16c0-5 3.500-8 8-8s8 3 8 8zM3 16h18M6 19l1.500-3M17.500 16L19 19M20 12.500l2-1.500" {...S} />,
  sign: (
    <>
      <path d="M12 21V12" {...S} />
      <path d="M4 4h16v8H4z" fill="currentColor" stroke="currentColor" strokeWidth="1.400" strokeLinejoin="round" />
    </>
  ),
  question: <path d="M8.500 9a3.500 3.500 0 1 1 5 3.200c-1.200.7-1.500 1.300-1.500 2.800M12 19v.5" {...S} strokeWidth="2.400" />,
  home: <path d="M3.500 11.500L12 4l8.500 7.500M6 10v10h12V10M10 20v-5h4v5" {...S} />,
  mask: <path d="M4 5c5 2 11 2 16 0 1 7-1 14-8 15C5 19 3 12 4 5zM8 10c1-.8 2.500-.8 3 0M13 10c1-.8 2.500-.8 3 0M9 15c2 1.500 4 1.500 6 0" {...S} strokeWidth="1.700" />,
  megaphone: <path d="M4 10v4h3l8 4V6L7 10zM18 9.500c1.500 1 1.500 4 0 5M7 14l1 5h3l-1-4" {...S} strokeWidth="1.700" />,
  pepper: <path d="M13 6c1-2 3-3 5-2-1 1-1 2-2 3 3 3 2 8-3 11-4 2-8 1-9-1 3 0 6-2 7-5 1-2 1-4 2-6z" fill="currentColor" />,
  ghost: <path d="M5 21V11a7 7 0 0 1 14 0v10l-3-2-2 2-2-2-2 2-2-2z" fill="currentColor" />,
  spade: <path d="M12 3C9 8 4 10.500 4 14.500c0 2.500 2 4 4 4 1.500 0 2.500-.5 3.200-1.500-.2 2-.8 3.500-2.200 4.500h6c-1.400-1-2-2.500-2.200-4.500.7 1 1.700 1.500 3.200 1.500 2 0 4-1.500 4-4C20 10.500 15 8 12 3z" fill="currentColor" />,
  book: <path d="M4 5.500C7 4.500 10 5 12 7c2-2 5-2.500 8-1.500V19c-3-1-6-.5-8 1.500C10 18.500 7 18 4 19z M12 7v13" {...S} strokeWidth="1.700" />,
  music: <path d="M9 18V6l11-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z" {...S} strokeWidth="1.700" />,
  camera: (
    <>
      <path d="M4 8h3l1.500-2.500h7L17 8h3v11H4z" {...S} />
      <circle cx="12" cy="13.500" r="3.500" {...S} />
    </>
  ),
  sparkle: <path d="M12 3l1.800 6.200L20 11l-6.200 1.800L12 19l-1.800-6.200L4 11l6.200-1.800z" fill="currentColor" />,
  // ---- значки «Романтики» ----
  jar: <path d="M8 3h8v3H8zM7 6h10l1 3v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9zM9.500 13c1-1.500 2-1.500 2.500 0 .5-1.500 1.500-1.500 2.500 0-.5 2-2.500 3.500-2.500 3.500s-2-1.500-2.500-3.500z" {...S} strokeWidth="1.700" />,
  kite: <path d="M12 2l6 8-6 9-6-9zM12 2v17M6 10h12M12 19c-2 1.500-1 3 1 2.500s1 2 3 1.500" {...S} strokeWidth="1.700" />,
  loveLetter: (
    <>
      <path d="M3 6h18v13H3zM3 7l9 7 9-7" {...S} />
      <path d="M12 12.500S9 11 9 9.300A1.500 1.500 0 0 1 12 8.800a1.500 1.500 0 0 1 3 .5c0 1.700-3 3.200-3 3.200z" fill="currentColor" />
    </>
  ),
  trafficLight: (
    <>
      <rect x="7" y="2.500" width="10" height="19" rx="3" {...S} />
      <circle cx="12" cy="7.500" r="1.800" fill="currentColor" />
      <circle cx="12" cy="12" r="1.800" {...S} />
      <circle cx="12" cy="16.500" r="1.800" {...S} />
    </>
  ),
  heartHands: <path d="M12 20.500c-5-3.500-8-6-8-10A4.200 4.200 0 0 1 12 8a4.200 4.200 0 0 1 8 2.500c0 4-3 6.500-8 10zM12 8v5" {...S} />,
  rose: <path d="M12 21v-7M12 14c-2 0-3.500 1-4.500 2.500M12 17c2 0 3.500-1 4.500-2.500M12 14c-4 0-6-3-6-6l2.500 1L9 5l3 2 3-2 .5 4 2.500-1c0 3-2 6-6 6z" {...S} strokeWidth="1.700" />,
  brokenHeart: <path d="M12 20S4 14.500 4 9.200A4.200 4.200 0 0 1 12 7a4.200 4.200 0 0 1 8 2.200C20 14.500 12 20 12 20zM12 7l-2 4 3 2-2 4" {...S} />,
  idCard: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.500" {...S} />
      <circle cx="9" cy="11" r="2.200" {...S} />
      <path d="M5.500 16c.6-2 1.800-3 3.500-3s2.900 1 3.500 3M14.500 10h4M14.500 13.500h3" {...S} />
    </>
  ),
  hug: <path d="M8 4a2.500 2.500 0 1 0 0-.1zM16 4a2.500 2.500 0 1 0 0-.1zM4 20v-6c0-2.500 1.500-4 4-4M20 20v-6c0-2.500-1.500-4-4-4M8 10c2 1 6 1 8 0M8 13l4 3 4-3M6 20h12" {...S} strokeWidth="1.700" />,
  twoHearts: (
    <>
      <path d="M9 18C4 14.500 2.500 12 2.500 9.500A3.500 3.500 0 0 1 9 8a3.500 3.500 0 0 1 6.500 1.500c0 2.500-1.500 5-6.500 8.500z" {...S} />
      <path d="M16 21c-3-2-4.500-3.500-4.500-5.500A2.600 2.600 0 0 1 16 14a2.600 2.600 0 0 1 4.500 1.500c0 2-1.500 3.500-4.500 5.500z" fill="currentColor" />
    </>
  ),
  // ---- значки «Дневника» ----
  battery: <path d="M3 8h15v8H3zM18 10.500h2.500v3H18M6 10.500v3M9 10.500v3" {...S} />,
  cake: <path d="M4 21h16v-7H4zM6 14v-3h12v3M12 11V8M12 8a1.500 1.500 0 0 0 0-3c-1.500 1.500-1.500 1.500 0 3zM4 17c2 1.500 3 1.500 4 0s3-1.500 4 0 3 1.500 4 0 3-1.500 4 0" {...S} />,
  zombie: <path d="M12 21V11M12 11c0-2-1-3-2-3M9 8V4.500a1.200 1.200 0 0 1 2.400 0V8M11.400 7.500V3.500a1.200 1.200 0 0 1 2.400 0v4M13.800 7.500V5a1.200 1.200 0 0 1 2.400 0v5c0 3-1 4-2.500 4.500M5 21h14M7 17l2-3" {...S} />,
  hero: <path d="M12 4l8 3-1.500 6c-1 3-3.500 5.500-6.500 7-3-1.500-5.500-4-6.500-7L4 7zM12 8l1.500 3 3 .3-2.300 2 .7 3-2.900-1.600-2.900 1.600.7-3-2.300-2 3-.3z" {...S} strokeWidth="1.600" />,
  laugh: <path d="M12 3.500a8.500 8.500 0 1 0 0 17 8.500 8.500 0 0 0 0-17zM8.500 10h.1M15.500 10h.1M8 14c1.500 2.500 6.500 2.500 8 0M14 16.500l2.500 1.500M11 17.500l2.500 2" {...S} />,
  mirror: <path d="M12 2.500c-3 0-5 2.500-5 6.500s2 7.500 5 7.500 5-3.500 5-7.500-2-6.500-5-6.500zM12 16.500V21M8 21h8M9.500 7c.5-1 1.500-1.500 2.500-1.500" {...S} />,
  thermometer: <path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0zM12 8v8M17 6h3M17 9h2M17 12h3" {...S} />,
  tremble: <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9 10h.1M15 10h.1M9 15c1 1 5 1 6 0M2.500 8l-1.500 2 1.500 2M21.500 8l1.500 2-1.500 2" {...S} />,
  boomerang: <path d="M3 18C3 9 9 4 20 4c-4 2-6 5-6 8 0 3-1 5-4 6-2 .8-5 .5-7 0z" {...S} />,
  dna: <path d="M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9M8.500 6.500h7M8.500 17.500h7M7 12h10" {...S} strokeWidth="1.700" />,
  devil: <path d="M5 8l2.500-4 2.500 3M19 8l-2.500-4L14 7M12 7c-4 0-7 2.500-7 6.500S8 20 12 20s7-2.500 7-6.500S16 7 12 7zM9 12.500l2 1M15 12.500l-2 1M9.500 16.500c1.500-1 3.500-1 5 0" {...S} />,
  spiral: <path d="M12 12c0-1.500 2-1.500 2 0s-3 3-5 1c-2.500-2.500 0-7 4-7 5 0 8 5 5 9-3 4-10 3-12-2" {...S} />,
  // ---- места, профессии и страны «Шпиона» ----
  metro: <path d="M6 3h12a1 1 0 0 1 1 1v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V4a1 1 0 0 1 1-1zM5 11h14M8 21l2-3M16 21l-2-3M9 15h.1M15 15h.1" {...S} />,
  shawarma: <path d="M6 19L14.500 4 19 7.500 13 20zM9.500 13l6 3M12 9l5.500 3" {...S} />,
  cart: (
    <>
      <path d="M3 4h3l2.500 11h10.500L21 7H6.500" {...S} />
      <circle cx="10" cy="19.500" r="1.400" fill="currentColor" />
      <circle cx="17" cy="19.500" r="1.400" fill="currentColor" />
    </>
  ),
  barber: <path d="M8 3h8v3H8zM8 18h8v3H8zM8 6h8v12H8zM8 9l8-2M8 13l8-3M8 17l8-3" {...S} strokeWidth="1.600" />,
  nailPolish: (
    <>
      <rect x="7" y="10" width="10" height="11" rx="3" {...S} />
      <path d="M10 10V6h4v4M11 6V3h2v3" {...S} />
    </>
  ),
  bank: <path d="M3 9l9-5 9 5zM5 11v7M9.500 11v7M14.500 11v7M19 11v7M3 21h18M3 18h18" {...S} />,
  policeCar: (
    <>
      <path d="M4 17v-4l2-4.500h12l2 4.500v4zM4 17h16M3 17v2.500h4V17M17 17v2.500h4V17M10.500 4.500h3M7 13h2M15 13h2" {...S} />
    </>
  ),
  taxi: <path d="M4 17v-4l2-4.500h12l2 4.500v4zM9.500 5.500h5v3h-5zM3 17v2.500h4V17M17 17v2.500h4V17M7 13h2M15 13h2" {...S} />,
  fuel: <path d="M5 21V5a1.500 1.500 0 0 1 1.500-1.500h6A1.500 1.500 0 0 1 14 5v16M4 21h11M5 9h9M14 8h2.500a1.500 1.500 0 0 1 1.500 1.500V16a1.500 1.500 0 0 0 3 0V8l-2.500-2.500" {...S} />,
  wrench: <path d="M14.500 3.500a4.500 4.500 0 0 0-4.200 6L3.500 16.300a2 2 0 0 0 2.800 2.800l6.800-6.800a4.500 4.500 0 0 0 6-4.200l-2.800 2.800-2.700-.6-.6-2.700z" {...S} />,
  barrier: <path d="M3 8h18v6H3zM3 14l6-6M9 14l6-6M15 14l6-6M6 14v7M18 14v7" {...S} />,
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.500" {...S} />
      <path d="M9 7V5a1.500 1.500 0 0 1 1.500-1.500h3A1.500 1.500 0 0 1 15 5v2M3 13h18M11 13v2h2v-2" {...S} />
    </>
  ),
  melon: <path d="M3 10h18a9 9 0 0 1-18 0zM3 10h18M8 14h.1M12 16h.1M16 14h.1" {...S} />,
  penNib: <path d="M12 21l-3-6 3-12 3 12zM12 15v-3M9 15h6M12 21v-0.100" {...S} />,
  school: <path d="M3 10l9-6 9 6M5 10v10h14V10M10 20v-5h4v5M12 7v.1M2.500 20h19" {...S} />,
  hospital: (
    <>
      <path d="M4 21V6h16v15M2.500 21h19" {...S} />
      <path d="M12 9v6M9 12h6" {...S} strokeWidth="2.400" />
    </>
  ),
  tooth: <path d="M7 3.500c2-1 3.500 0 5 0s3-1 5 0c2 1.500 1.500 5-.5 8-1 1.500-1 3-1.500 6-.3 1.800-2.200 1.800-2.500 0-.4-2.200-.6-3.500-1-3.500s-.6 1.300-1 3.500c-.3 1.800-2.200 1.800-2.500 0-.5-3-.5-4.500-1.500-6-2-3-2.500-6.500-.5-8z" {...S} />,
  dog: <path d="M5 5l-2 6 3 2M19 5l2 6-3 2M6 7c2-2 10-2 12 0v7c0 4-3 7-6 7s-6-3-6-7zM9.500 11h.1M14.500 11h.1M10.500 16c1 1 2 1 3 0M12 14v1" {...S} />,
  football: (
    <>
      <circle cx="12" cy="12" r="9" {...S} />
      <path d="M12 8.500l3.300 2.400-1.300 3.800h-4l-1.300-3.800zM12 8.500V3M15.300 10.900l5-1.500M14 14.700l3 4M10 14.700l-3 4M8.700 10.900l-5-1.500" {...S} strokeWidth="1.500" />
    </>
  ),
  dumbbell: <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" {...S} strokeWidth="2.200" />,
  waterDrops: <path d="M8 3S4 8 4 11a4 4 0 0 0 8 0c0-3-4-8-4-8zM17 10s-3 4-3 6.500a3 3 0 0 0 6 0C20 14 17 10 17 10zM3 20c2-1.500 3.500-1.500 5.500 0s3.500 1.500 5.500 0 3.500-1.500 5 0" {...S} strokeWidth="1.700" />,
  coaster: <path d="M2.500 19c2 0 3-1 3.500-4 .6-3.500 1.500-9 4-9s3 5 3.500 8 1.500 4 3 4 2.500-1.500 3-4M2.500 21h19M7 15v6M11 12v9M16 13v8" {...S} strokeWidth="1.700" />,
  iceSkate: <path d="M7 3h5v9l7 3c1 .4 1.500 1 1.500 2v1.500H5.500V15L7 12zM3 20.500h18M9 18v2.500M14 18v2.500" {...S} />,
  gamepad: (
    <>
      <path d="M7 7h10a5 5 0 0 1 5 5l-1 5a2.500 2.500 0 0 1-4.500 1L15 16.500H9L7.500 18A2.500 2.500 0 0 1 3 17l-1-5a5 5 0 0 1 5-5z" {...S} />
      <path d="M7.500 10.500v3M6 12h3M15.500 11h.1M17.500 13h.1" {...S} strokeWidth="2" />
    </>
  ),
  lockKey: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2.500" {...S} />
      <path d="M8 10V7.500a4 4 0 0 1 8 0V10M12 14v3" {...S} />
    </>
  ),
  bowling: (
    <>
      <path d="M8 3c-1.500 3 0 4 0 6 0 2-2 3-2 6 0 3 1 5 3 5h1c2 0 3-2 3-5 0-3-2-4-2-6 0-2 1.500-3 0-6z" {...S} />
      <circle cx="18" cy="17" r="3.500" {...S} />
      <path d="M17 16h.1M19 16h.1M18 18h.1" {...S} />
    </>
  ),
  picture: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.500" {...S} />
      <path d="M6 17l4-5 3 3 2-2 3 4M8.500 8.500h.1" {...S} />
    </>
  ),
  lion: <path d="M12 3.500c3 0 4 1.500 5.500 2.500 2 .5 3.500 2.500 3 5.500-.3 2-1.500 3-2 4.500-1 3-3.500 5-6.500 5s-5.500-2-6.500-5c-.5-1.500-1.700-2.500-2-4.500-.5-3 1-5 3-5.500C8 5 9 3.500 12 3.500zM9.500 11h.1M14.500 11h.1M10.500 15c1 .8 2 .8 3 0M12 12.500v1.500" {...S} strokeWidth="1.700" />,
  circusTent: <path d="M12 2v3M12 5l9 6H3zM4 11v9h16v-9M9 20c0-4 1.500-6 3-6s3 2 3 6M12 5l-4 6M12 5l4 6" {...S} />,
  plane: <path d="M21 4s-1.500-1-3 .5L14 8.500 5.500 6.500 4 8l7 4.500-3 3-3-.5L4 16.500l3 1.500 1.500 3 1-1-.5-3 3-3L17 18l1.500-1.500-2-8.500 4-4c1.500-1.500.5-3-.5-4z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" transform="translate(0 1)" />,
  trainCar: <path d="M7 3h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM5 11h14M8.500 14.500h.1M15.500 14.500h.1M8 21l2-3M16 21l-2-3M9 6.500h6" {...S} />,
  hotel: <path d="M4 21V4h12v17M16 9h4v12M2.500 21h19M7 8h2M11 8h2M7 12h2M11 12h2M7 16h2M11 16h2" {...S} />,
  beachUmbrella: <path d="M3 12a9 9 0 0 1 18 0zM12 3v18M12 12c-1 0-3 1-3 0M12 12c1 0 3 1 3 0M6 21h12" {...S} />,
  ski: <path d="M3 20l16-5M3 17l16-5M13 3l-3 10M17 5l-3 10M12 3h2M16 5h2" {...S} />,
  cruise: <path d="M3 14h18l-2.500 6h-13zM6 14V9h12v5M9 9V6h6v3M9.500 11.500h.1M12 11.500h.1M14.500 11.500h.1" {...S} />,
  cottage: <path d="M3 12l9-8 9 8M5.500 10.500V20h13v-9.500M10 20v-5h4v5M16 4v3.500" {...S} />,
  campTent: <path d="M2 20h20M12 4L3.500 20M12 4l8.500 16M12 4v16M9 20l3-7 3 7" {...S} />,
  ring: (
    <>
      <circle cx="12" cy="15" r="6" {...S} />
      <path d="M9 6.500l1.500-2.500h3L15 6.500l-3 2.500z" {...S} />
    </>
  ),
  fir: <path d="M12 2.500l-5 6h3l-4.500 5h4L5 18.500h14l-4.500-5h4l-4.500-5h3zM12 18.500v3" {...S} />,
  pirateFlag: (
    <>
      <path d="M5 21V3" {...S} />
      <path d="M5 4h14v11H5z" fill="currentColor" />
      <circle cx="12" cy="8.500" r="2" fill="#0b2a1c" />
      <path d="M8.500 13l7-2.500M8.500 10.500l7 2.500" stroke="#0b2a1c" strokeWidth="1.300" strokeLinecap="round" />
    </>
  ),
  anchor: <path d="M12 8v13M8 12h8M4 14c0 4 3.500 7 8 7s8-3 8-7M4 14l-1.500 2.500M20 14l1.500 2.500M12 8a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z" {...S} />,
  penguin: <path d="M12 3c-3 0-5 2.500-5 6v6c0 3 2 6 5 6s5-3 5-6V9c0-3.500-2-6-5-6zM9.500 9h.1M14.500 9h.1M10.500 11.500h3L12 13zM7 14l-3 3M17 14l3 3M9 21h2M13 21h2" {...S} strokeWidth="1.700" />,
  stethoscope: <path d="M6 3v6a4 4 0 0 0 8 0V3M4.500 3H8M12 3h3.500M10 13v2a5 5 0 0 0 10 0v-3M20 12a2 2 0 1 0 0-.1z" {...S} />,
  notepad: <path d="M5 4h11v16H5zM8 8h5M8 11h5M8 14h3M14 15l5.500-5.500 2 2L16 17l-2.500.5z" {...S} />,
  fireTruck: <path d="M2 17V9h11v8M13 11h4l3 3v3M2 17h20M5.500 20h.1M17.500 20h.1M5 5l9 2M4 7l10 2" {...S} />,
  fryingPan: <path d="M12 7a6.500 6.500 0 1 0 0 13 6.500 6.500 0 0 0 0-13zM17.500 9l4.500-4M9 13h.1M13 15h.1" {...S} />,
  parcel: <path d="M3 8l9-5 9 5v9l-9 5-9-5zM3 8l9 5 9-5M12 13v9M7.500 5.500L16.500 10.500" {...S} strokeWidth="1.700" />,
  laptop: <path d="M5 5h14v10H5zM2.500 19h19l-1.500-4H4zM10 17h4" {...S} />,
  selfie: (
    <>
      <rect x="6.500" y="2.500" width="11" height="19" rx="2.500" {...S} />
      <circle cx="12" cy="10" r="2.300" {...S} />
      <path d="M8.500 17c.5-2 1.800-3 3.500-3s3 1 3.500 3" {...S} />
    </>
  ),
  scissors: <path d="M6 7a2.500 2.500 0 1 0 0-.1zM6 17a2.500 2.500 0 1 0 0-.1zM8 8.500L20 18M8 15.500L20 6" {...S} />,
  suitcase: <path d="M5 7h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM9 7V4h6v3M8 7v12M16 7v12M7 21v-2M17 21v-2" {...S} />,
  crane: <path d="M5 21V8M5 21h5M3 8h18M7 4l-4 4M7 4h13v4M17 8v6M15.500 14h3v3h-3zM5 8l5-4" {...S} strokeWidth="1.700" />,
  shower: <path d="M4 20V8a4 4 0 0 1 8 0M8 6l11 6-2 3-11-6zM17 17.500v.1M14.500 19v.1M19 20v.1M16.500 21.500v.1" {...S} />,
  truck: <path d="M2 6h12v11H2zM14 10h4.500l3 3.500V17H14M5.500 20a2 2 0 1 0 0-.1zM17.500 20a2 2 0 1 0 0-.1z" {...S} />,
  tractor: <path d="M3 17a3.500 3.500 0 1 0 0-.1zM16 16a4.500 4.500 0 1 0 0-.1zM11 17H7M7 13V7h5l1 4h6l1 4M12 11V7" {...S} />,
  paws: <path d="M7 12a2 2 0 1 0 0-.1zM12 8a2 2 0 1 0 0-.1zM17 12a2 2 0 1 0 0-.1zM12 19c-3 0-4-1.500-4-3 0-2 2-3 4-3s4 1 4 3c0 1.500-1 3-4 3z" fill="currentColor" />,
  ambulance: <path d="M2 17V8h12v9M14 11h4l3 3v3M2 17h20M7.500 20h.1M17.500 20h.1M8 10v4M6 12h4" {...S} />,
  palette: <path d="M12 3a9 9 0 1 0 0 18c1.500 0 2-1 1.500-2s-.5-2 1-2h2.500a3 3 0 0 0 3-3C20 8 16.500 3 12 3zM7.500 11h.1M10 7.500h.1M14.500 7.500h.1" {...S} />,
  scales: <path d="M12 4v16M7 20h10M5 7h14M5 7l-2.500 6a3 3 0 0 0 5 0zM19 7l-2.500 6a3 3 0 0 0 5 0z" {...S} />,
  gavel: <path d="M13.500 3.500l5.500 5.500-3 3L10.500 6.500zM11.500 10.500L4 18M3 21h9M14 14l4 4" {...S} />,
  abacus: <path d="M3 4h18v16H3zM3 9.500h18M3 14.500h18M7 6.700h.1M10 6.700h.1M7 12h.1M11 12h.1M14 12h.1M8 17h.1M13 17h.1M16 17h.1" {...S} strokeWidth="2.200" />,
  shield: <path d="M12 3l8 3v6c0 4.500-3.500 8-8 9-4.500-1-8-4.500-8-9V6zM12 8v8M8.500 11.500h7" {...S} />,
  envelope: <path d="M3 6h18v13H3zM3 7l9 7 9-7" {...S} />,
  newspaper: <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5M19 8h2v9a2 2 0 0 1-2 2" {...S} />,
  microscope: <path d="M9 3l4 1-2.500 8-4-1zM4 21h14M7 21c4 0 9-1 9-6 0-2-1-3-2-4M11 12.500L8 15" {...S} />,
  bone: <path d="M6 4a2.200 2.200 0 0 0-2.500 3 2.200 2.200 0 0 0 3 2.500L14.500 17.500a2.200 2.200 0 0 0 3 3 2.200 2.200 0 0 0 3-3 2.200 2.200 0 0 0-3-2.500L9.500 6.500A2.200 2.200 0 0 0 6 4z" {...S} strokeWidth="1.700" />,
  magnifier: (
    <>
      <circle cx="10.500" cy="10.500" r="6.500" {...S} />
      <path d="M15.500 15.500L21 21M7.500 9a3.500 3.500 0 0 1 3-2" {...S} />
    </>
  ),
  fishing: <path d="M4 3l14 14M18 3v10a3 3 0 1 1-3 3" {...S} />,
  heel: <path d="M4 4h5v6c0 2 2 3 4 4l7 2c1 .4 1.500 1 1.500 2v1H11l-2-4-3 2H4zM5 21h2" {...S} />,
  lipstick: <path d="M9 21v-8h6v8zM9 13h6M10 13V8l4-5v10M8 21h8" {...S} />,
  platter: (
    <>
      <path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 8.500V7" {...S} />
      <circle cx="12" cy="6" r="1.200" fill="currentColor" />
      <path d="M4 20h16" {...S} />
    </>
  ),
  balloon: (
    <>
      <path d="M12 3c-3.500 0-6 2.500-6 6 0 3.500 3 6.500 6 8 3-1.500 6-4.500 6-8 0-3.500-2.500-6-6-6z" {...S} />
      <path d="M12 17l-1 1.500h2zM12 18.500c-1.500 1.500 1.500 2 0 3" {...S} />
    </>
  ),
  couch: <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 11a2 2 0 0 1 2 2v2h14v-2a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5H1v-5a2 2 0 0 1 2-2zM5 18v2M19 18v2" {...S} strokeWidth="1.700" />,
  bear: <path d="M6 4.500a2.500 2.500 0 1 0 0 .1zM18 4.500a2.500 2.500 0 1 0 0 .1zM12 6c-4 0-7 2.500-7 7s3 8 7 8 7-3.500 7-8-3-7-7-7zM9.500 11h.1M14.500 11h.1M10 15.500h4l-2 1.500z" {...S} strokeWidth="1.700" />,
  sushi: (
    <>
      <ellipse cx="12" cy="14" rx="8.500" ry="5" {...S} />
      <path d="M5 13c1-3 4-5 7-5s6 2 7 5" {...S} />
      <path d="M9 9.500l1 7M13 9l1 8" {...S} strokeWidth="1.300" />
    </>
  ),
  pizza: <path d="M3 5c6-2 12-2 18 0L12 21zM8 8.500h.1M13 9h.1M11 13h.1M15 12.500h.1" {...S} />,
  croissant: <path d="M2.500 15c1-5 4-8 9.500-8s8.500 3 9.500 8c-2 1.500-4 2-6 1.500-1.200 1.500-2.500 2-3.500 2s-2.300-.5-3.500-2c-2 .5-4-.2-6-1.500zM9 8l1.500 8M15 8l-1.500 8" {...S} strokeWidth="1.700" />,
  liberty: <path d="M12 21v-9M9 21h6M10 12h4l1 3H9zM9.500 9a2.500 2.500 0 1 1 5 0M9 5L7 2.500M12 4V1.500M15 5l2-2.500M16 9l3-6M18.500 3h-3" {...S} />,
  panda: <path d="M5 5a2.500 2.500 0 1 0 0 .1zM19 5a2.500 2.500 0 1 0 0 .1zM12 6c-4 0-7 2.500-7 7s3 8 7 8 7-3.500 7-8-3-7-7-7zM8.500 11.500l2 2M15.500 11.500l-2 2M12 15.500h.1" {...S} strokeWidth="1.700" />,
  camel: <path d="M3 21V12c0-2 1-3 2.500-3h1C8 9 8 6 9.500 6S11 9 13 9s2 2 4 2l1-4 2.500-.5L20 11l-1 3v7M8 21v-5M15 21v-5M3 16h16" {...S} strokeWidth="1.600" />,
  evilEye: (
    <>
      <path d="M2.500 12S6 6 12 6s9.500 6 9.500 6-3.500 6-9.500 6S2.500 12 2.500 12z" {...S} />
      <circle cx="12" cy="12" r="3.500" {...S} />
      <circle cx="12" cy="12" r="1.300" fill="currentColor" />
    </>
  ),
  elephant: <path d="M4 12c0-4 3-7 8-7s8 3 8 7v6h-3v-4M4 12v6h3v-3M10 9h.1M12 15c0 3-1 5-3 5s-2-1.500 0-2M4.500 9.500L2.500 8" {...S} />,
  temple: <path d="M12 2.500c2 2 3 4 3 5.500H9c0-1.500 1-3.500 3-5.500zM9 8c-3 1-4 3-4 6h14c0-3-1-5-4-6M3 14h18M4 14v7h16v-7M10 21v-4h4v4" {...S} />,
  parrot: <path d="M15 3c3 0 5 2 5 5 0 2-1 3-2 4 1 4-1 9-6 9-3 0-5-2-5-5 0-1 1-2 2-2-2-2-1-5 1-7 1-2 3-4 5-4zM15 7.500h.1M18 8c2 .5 3 1.500 3 3M10 18l-2 3M13 20l-1 1.500" {...S} />,
  taco: <path d="M3 18a9 9 0 0 1 18 0zM6 15c1-1 2-2 3-1.500M11 12.500c1-1 2-1 3 .5M14 16c1-1 2-1 3 0" {...S} />,
  dancer: <path d="M13 4a2 2 0 1 0 0-.1zM12 8c-2 0-3.500 1.500-4 4l3 1-2 7M12 8l4 2-1 3 4 7M16 10l3-2" {...S} />,
  pretzel: <path d="M12 20c-4 0-7-2-7-6 0-3 2-5 4-5s3 2 3 3.500M12 20c4 0 7-2 7-6 0-3-2-5-4-5s-3 2-3 3.500M9 9c0-3 1.500-5 3-5s3 2 3 5M9.500 13.500l5 4M14.500 13.500l-5 4" {...S} strokeWidth="1.700" />,
  guard: <path d="M7 4c0-1.500 2-2 5-2s5 .5 5 2l1 7H6zM5 11h14M7 11v9h10v-9M12 11v9M7 15h10" {...S} />,
  maple: <path d="M12 21v-5M12 16l-4 .5.5-3-4-1 3-3-1-2.500 3 .5 2-3 1.500 3 1.500-3 2 3 3-.5-1 2.500 3 3-4 1 .5 3z" fill="currentColor" stroke="currentColor" strokeWidth="1.200" strokeLinejoin="round" />,
  kangaroo: <path d="M6 20h4l2-4-3-4 2-6c0-2 2-3 3-1l1 2h2l-1 2-2 .5 2 6c1.500 1 2 2 2 4h-4l-3-3M4 12l4 3M12 4.500h.1" {...S} strokeWidth="1.600" />,
  columns: <path d="M12 3l10 5H2zM4 10v8M9 10v8M15 10v8M20 10v8M2 21h20M3 18h18" {...S} />,
  grapes: <path d="M12 8a2.200 2.200 0 1 0 0-.1zM8 11a2.200 2.200 0 1 0 0-.1zM16 11a2.200 2.200 0 1 0 0-.1zM10 15a2.200 2.200 0 1 0 0-.1zM14 15a2.200 2.200 0 1 0 0-.1zM12 20a2.200 2.200 0 1 0 0-.1zM12 6V3c2 0 3.500 1 4 2" {...S} strokeWidth="1.700" />,
  eagle: <path d="M2 8c3 0 5 1 7 3 1-1 2-1 3-1s2 0 3 1c2-2 4-3 7-3-1 3-3 5-5 6l-2 2 1 4-4-2-4 2 1-4-2-2c-2-1-4-3-5-6zM12 10v4" {...S} strokeWidth="1.700" />,
  mountain: <path d="M2 20L9 6l4 7 2.500-4L22 20zM7 11.500l2 2 2-2" {...S} />,
  riceBowl: <path d="M3 11h18a9 9 0 0 1-18 0zM7 11c0-3 2-5 5-5s5 2 5 5M10 7.500h.1M13 8h.1M15 5l5-2" {...S} />,
  potato: <path d="M6 7c3-3 9-3 12 0 3 3 2 9-2 12-3 2-8 2-10-1-3-3-2-8 0-11zM9 10h.1M14 9h.1M13 15h.1M8 15h.1" {...S} />,
  aurora: <path d="M3 20c2-6 3-10 3-15M9 20c1-5 2-9 2-14M15 20c0-5 1-9 3-13M21 20c-1-4-1-7 0-10M2 21h20" {...S} strokeWidth="1.800" />,
  santaHat: <path d="M4 18c0-7 4-12 10-12 1.500 0 3 1 3 2.500S16 11 17 14c.5 1.500 1.500 2.500 3 4zM3 19h18v2.500H3zM18.500 4a2 2 0 1 0 0-.1z" {...S} />,
  cheese: <path d="M3 10l8-6 10 4v10L3 17zM3 10l18 0M8 13.500h.1M14 14.500h.1M17 12.500h.1" {...S} />,
  tulip: <path d="M7 5c0 6 2 9 5 9s5-3 5-9l-3 2-2-3-2 3zM12 14v8M12 19c-3 0-5-1.500-5-4M12 17.500c2.500 0 4-1 4-3" {...S} />,
  volcano: <path d="M3 21l6-12h6l6 12zM9 9l-1-3M12 8V4M15 9l1-3M9 13l2 1.500 2-1.500 2 1.500" {...S} />,
  noodles: <path d="M3 11h18a9 9 0 0 1-18 0zM7 11c0-2 1-3 2-3s1 1 3 1 2-1 3-1 2 1 2 3M18 3l-5 7M20 5l-5 6" {...S} />,
  palm: <path d="M12 21c0-5 .5-8 1.500-11M13.500 10C11 7.500 7 8 4 11c3-.5 5 0 7 1M13.500 10c0-3 2-6 6-7-1 3-2.500 5-4.500 6M13.500 10c2.500 0 5 1.500 6 4-2.500-1-4.500-1.500-6.500-1M13.500 10C11 6 8 5 5 5.500 7 5 9 6 11 8" {...S} strokeWidth="1.700" />,
  island: <path d="M3 17c2-1 3.500-1 5.500 0s3.500 1 5.500 0 3.500-1 5.500 0M3 21c2-1 3.500-1 5.500 0s3.500 1 5.500 0 3.500-1 5.500 0M7 14c2-.5 7-.5 10 0-1-2-3-3-5-3s-4 1-5 3zM12 11V6c1.500-2 4-2 5.500-1M12 6c-1.500-2-4-2-5.500-1" {...S} strokeWidth="1.700" />,
  steak: <path d="M4 12c0-4 3-7 8-7 6 0 9 3 8 7-1 4-4 7-9 7-4 0-7-3-7-7zM14 9.500a3 3 0 1 0 0 .1z" {...S} />,
  clover: <path d="M12 11c-3-1-5-3-4-5.500 1.500-2 3.500-1 4 1 .5-2 2.500-3 4-1 1 2.500-1 4.500-4 5.500zM12 11c-3 1-5 3-4 5.500 1.500 2 3.500 1 4-1 .5 2 2.500 3 4 1 1-2.500-1-4.500-4-5.500zM12 13l1 8" {...S} strokeWidth="1.500" />,
  surfer: <path d="M2 19c2-1.500 3.500-1.500 5.500 0s3.500 1.500 5.500 0 3.500-1.500 5.500 0M14 3a2 2 0 1 0 0-.1zM12 7l-3 4 3 3-1 4M12 7l4 2 3 .5M9 11l-4-1" {...S} />,
  castle: <path d="M3 21V8h3v3h3V8h2v-.1M3 8h3M9 11V8M3 21h18M21 21V8h-3v3h-3V8M9 8h6v13H9zM12 21v-4M5 14h.1M18.500 14h.1M12 12h.1" {...S} />,
  dumpling: <path d="M3 16c0-5 4-9 9-9s9 4 9 9c0 1-1 2-2 2H5c-1 0-2-1-2-2zM8 8l1 3M12 7v4M16 8l-1 3M6 12c1-.5 2-.5 3 0M15 12c1-.5 2-.5 3 0" {...S} />,
  sailboat: <path d="M12 3v13M12 4l7 11h-7M11 6L5 15h6M3 18h18l-2.500 3h-13z" {...S} />,
  giraffe: <path d="M8 21l1-7-1-2V8l2-1V4l2-1.500 1 2.500 1-1M10 7l6 1 1 8-1 5M10 12h6M13.500 5h.1" {...S} strokeWidth="1.600" />,
  llama: <path d="M8 21V12c0-2-.5-3-1.500-4C6 6 7 4 9 4l1-2 1 2c2 0 3 1 3 3l-1 2c3 0 6 1 6 5v7M12 12v9M17 21v-5M8 15h9M10.500 6h.1" {...S} strokeWidth="1.600" />,
  kiwi: (
    <>
      <circle cx="12" cy="12" r="9" {...S} />
      <circle cx="12" cy="12" r="3" {...S} />
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.500 6.500l3 3M14.500 14.500l3 3M17.500 6.500l-3 3M9.500 14.500l-3 3" {...S} strokeWidth="1.300" />
    </>
  ),
  horseHead: <path d="M6 21c0-5 1-8 3-10L8 4l3 2c3 0 6 2 7 5l2 4-3 1-2-2c-1 2-1 5 0 7M13.500 8.500h.1" {...S} />,
  church: <path d="M12 2v5M10 4h4M12 7l6 4v10H6V11zM10 21v-5h4v5M3 21h18M2 14l4-2M22 14l-4-2" {...S} />,
  skyline: <path d="M2 21h20M4 21V12h4v9M8 21V6l3-2 3 2v15M14 21v-8h3v8M17 21v-5h3v5M10 9h2M10 13h2M10 17h2" {...S} />,
  mosque: <path d="M12 3c-3.500 2-5 4-5 6.500h10C17 7 15.500 5 12 3zM5 21V12h14v9M9 21v-4a3 3 0 0 1 6 0v4M3 21h18M3 21V9M21 21V9M3 6.500l.1-.1M21 6.500l.1-.1" {...S} />,
  violin: <path d="M12 3v4M9.500 3h5M8 12c-2 1-3 2.500-3 4.500C5 19 8 21 12 21s7-2 7-4.500c0-2-1-3.500-3-4.500 1-2 0-4-4-4s-5 2-4 4zM12 12v6M10 16h4" {...S} />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" {...S} />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" {...S} />
    </>
  ),
  tv: <path d="M3 7h18v12H3zM9 3l3 4 3-4M6 11v4M18 11v.1" {...S} />,
  ...MORE_ICONS,
} satisfies Record<string, ReactNode>;

export type GIconName = keyof typeof ICONS;

/** Убирает обёртки-фрагменты: Satori (картинки для сторис) принимает внутри <svg> только настоящие теги. */
function unwrap(node: ReactNode): ReactNode[] {
  return Children.toArray(node).flatMap((child) => (isValidElement(child) && child.type === Fragment ? unwrap((child as ReactElement<{ children?: ReactNode }>).props.children) : [child]));
}

export function GIcon({ name, size = "1.15em", className, plain }: { name: GIconName; size?: number | string; className?: string; plain?: boolean }) {
  // plain: без стилей и aria — для картинок next/og (Satori не знает display: inline-block)
  if (plain) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        {unwrap(ICONS[name])}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className={className} style={{ display: "inline-block", verticalAlign: "-0.16em", flexShrink: 0 }}>
      {ICONS[name]}
    </svg>
  );
}

// Какое эмодзи из данных каким значком рисуется (остальное — фишка с буквой)
const BY_EMOJI: Record<string, GIconName> = {
  // эмодзи из данных, добавленные позже (значки — в GIconsMore.tsx)
  "🙅": "noNo",
  "🧊": "ice",
  "🧸": "teddy",
  "🌪": "tornado",
  "🗓": "calendar",
  "😂": "laugh",
  "⏳": "hourglass",
  "😉": "wink",
  "😅": "sweat",
  "🍀": "clover",
  "🕊": "dove",
  "🤗": "hug",
  "🎒": "backpack",
  "🌤": "partlySunny",
  "🖤": "heart",
  "⏰": "alarm",
  "🎁": "gift",
  "🧭": "compass",
  "🐈": "cat",
  "🐕": "dog",
  "🍼": "bottle",
  "🧪": "flask",
  "💿": "disc",
  "🦉": "owl",
  "🎞": "filmStrip",
  "🦊": "fox",
  "🏘": "houses",
  "🌸": "flower",
  "🕶": "sunglasses",
  "📊": "chart",
  "💸": "moneyFly",
  "🚫": "banned",
  "🤷": "shrug",
  "🧱": "bricks",
  "🏃": "runner",
  "🐺": "wolf",
  "🪫": "lowBattery",
  "☄": "comet",
  "🌅": "sunrise",
  "📞": "phoneCall",
  "👋": "waveHand",
  "🚶": "walker",
  "🤐": "zip",
  "💥": "boom",
  "💰": "moneyBag",
  "🧺": "basket",
  "🗂": "files",
  "🛹": "skateboard",
  "🍊": "orange",
  "🦹": "villain",
  "🔦": "flashlight",
  "🤡": "clown",
  "💯": "hundred",
  "❌": "cross",
  "🛏": "bed",
  "😴": "sleepy",
  "👻": "ghost",
  "🙃": "upside",
  "👂": "ear",
  "🚪": "door",
  "👪": "family",
  "📵": "noPhone",
  "🔔": "bell",
  "🧘": "yoga",
  "🧶": "yarn",
  "🧙": "wizard",
  "🛠": "tools",
  "📈": "trendUp",
  "📡": "antenna",
  "♟": "pawn",
  "🫀": "organHeart",
  "👥": "family",
  "🤥": "liar",
  "👁": "eyes",
  "👌": "okHand",
  "📢": "loudspeaker",
  "🛍": "shopping",
  "🚗": "car",
  "💤": "zzz",
  "🤪": "crazy",
  "🧗": "climber",
  "🛌": "bed",
  "💇": "haircut",
  "😤": "huff",
  "🙊": "monkey",
  "🥳": "party",
  "😬": "grimace",
  "🌫": "fog",
  "🏔": "mountain",
  "🛵": "scooter",
  "🆕": "newTag",
  "💳": "card",
  "🔓": "unlock",
  "🗒": "note",
  "😄": "grin",
  "✏": "pencil",
  "🎥": "movieCamera",
  "🪙": "coin",
  "🌃": "nightCity",
  "🗼": "tower",
  "🚲": "bike",
  "🌳": "tree",
  "🗿": "moai",
  "🛸": "ufo",
  "🐚": "shell",
  "🦎": "lizard",
  "😌": "relieved",
  "🧾": "receipt",
  "🌧": "rain",
  "♠": "spade",
  "👸": "queen",
  "💀": "skull",
  "🍔": "burger",
  "📩": "mailIn",
  "🤣": "laugh",
  "🍞": "bread",
  "📻": "radio",
  "🐌": "snail",
  "🌐": "globe",
  "💛": "heart",
  "💣": "boom",
  "😔": "sad",
  "❓": "question",
  "♾": "infinity",
  "😊": "smile",
  "🙄": "eyeroll",
  "🍃": "leaf",
  "🐦": "bird",
  "🍵": "tea",
  "🐱": "cat",
  "🍫": "chocolate",
  "🍟": "fries",
  "🌲": "tree",
  "🛴": "scooter",
  "🌬": "wind",
  "🍰": "cupcake",
  "🍝": "pasta",
  "📄": "note",
  "📲": "phoneIn",
  "📅": "calendar",
  "😍": "heartEyes",
  "🕰": "clockOld",
  "🧹": "broom",
  "👫": "family",
  "🐷": "pig",
  "👶": "baby",
  "👵": "grandma",
  "🥊": "boxing",
  "🏢": "building",
  "⛔": "banned",
  "🌿": "leaf",
  "🎆": "fireworks",
  "📜": "scroll",
  "😱": "scream",
  "✍": "pencil",
  "🖊": "pencil",
  "🪟": "window",
  "🌱": "leaf",
  "🫁": "lungs",
  "🗯": "speechBurst",
  "🧃": "juice",
  "🫡": "salute",
  "🚌": "bus",
  "🎟": "ticket",
  "🥾": "boot",
  "📷": "camera",
  "🍦": "iceCream",
  "🧁": "cupcake",
  "🥤": "softDrink",
  "🏀": "basketball",
  "🍲": "bowl",
  "🛶": "canoe",
  "🛗": "elevator",
  "💧": "waterDrops",
  "🙏": "pray",
  "🫥": "dotted",
  "🪐": "planet",
  "↔": "arrowsLR",
  "🔴": "redDot",
  "📋": "note",
  "🎾": "tennis",
  "🦋": "butterfly",
  "📟": "pager",
  "🥀": "wilted",
  "🍪": "cookie",
  "🐓": "bird",
  "🧽": "basket",
  "🍿": "popcorn",
  "🪽": "feather",
  "⌨": "keyboard",
  "🍩": "donut",
  "⏪": "rewind",
  "⏩": "forward",
  "🌈": "rainbow",
  "🍥": "fishcake",
  "🎵": "music",
  "🔱": "trident",
  "🌇": "nightCity",
  "🔥": "fire", "👉": "next", "🏁": "flag", "🔄": "refresh", "🏆": "trophy", "👑": "crown", "🔒": "lock", "💎": "diamond",
  "⏱": "timer", "🎲": "dice", "🔪": "knife", "🌙": "moon", "☀": "sun", "☠": "skull", "🙈": "hide", "🎙": "mic",
  "🃏": "cards", "🕵": "spy", "👍": "thumbUp", "👎": "thumbDown", "📱": "phone", "🔗": "link", "🗝": "key", "🔑": "key",
  "👀": "eyes", "✓": "check", "✅": "check", "✕": "cross", "✗": "cross", "⭐": "star", "🐴": "horse", "🤫": "lips",
  "🏙": "city", "🏠": "home", "📍": "pin", "✋": "hand", "🙌": "hand", "💞": "twoHearts", "💡": "bulb", "🧩": "puzzle",
  "🎯": "target", "💬": "chat", "🗣": "chat", "☕": "cup", "🌊": "wave", "🚀": "rocket", "🧠": "brain", "⚡": "bolt",
  "🧲": "magnet", "🐢": "turtle", "🪧": "sign", "🫷": "hand", "🫢": "hide", "🤔": "question", "🤨": "question",
  "🎬": "mask", "🎭": "mask", "🎤": "mic", "👯": "twoHearts", "🤝": "link", "🫵": "target", "🫣": "hide", "🫂": "hug",
  "🌶": "pepper", "👽": "ghost", "🔮": "sparkle", "🫧": "sparkle", "🤜": "hand", "🤿": "wave", "📚": "book",
  "📖": "book", "📸": "camera", "🫙": "jar", "🔋": "battery", "🎂": "cake", "🧟": "zombie", "🦸": "hero", "✨": "sparkle", "🤭": "laugh", "🪞": "mirror", "🌡": "thermometer", "🫨": "tremble", "🪃": "boomerang", "🧬": "dna", "😈": "devil", "🌀": "spiral", "🪁": "kite", "💌": "loveLetter", "🚦": "trafficLight", "🫶": "heartHands", "💚": "heart", "🌹": "rose", "🚩": "flag", "💔": "brokenHeart", "🪪": "idCard", "🎶": "music", "🎸": "music", "🎧": "music", "🪩": "sparkle", "🕯": "sparkle", "😏": "mask",
  "😇": "sparkle", "🎉": "sparkle", "🙂": "sparkle", "😜": "mask", "🟢": "check", "🟡": "bolt", "🪓": "knife",
  "📰": "book", "🐉": "ghost", "💉": "bolt", "🎺": "megaphone", "📣": "megaphone",
  // места, профессии и страны «Шпиона»
  "🚇": "metro",
  "🌯": "shawarma",
  "🛒": "cart",
  "💈": "barber",
  "💅": "nailPolish",
  "🏦": "bank",
  "🚓": "policeCar",
  "🚕": "taxi",
  "⛽": "fuel",
  "🔧": "wrench",
  "🚧": "barrier",
  "💼": "briefcase",
  "🍉": "melon",
  "🖋": "penNib",
  "🏫": "school",
  "🏥": "hospital",
  "🦷": "tooth",
  "🐶": "dog",
  "⚽": "football",
  "🏋": "dumbbell",
  "💦": "waterDrops",
  "🎢": "coaster",
  "⛸": "iceSkate",
  "🎮": "gamepad",
  "🔐": "lockKey",
  "🎳": "bowling",
  "🖼": "picture",
  "🦁": "lion",
  "🎪": "circusTent",
  "✈": "plane",
  "🚆": "trainCar",
  "🏨": "hotel",
  "🏖": "beachUmbrella",
  "🎿": "ski",
  "🛳": "cruise",
  "🏡": "cottage",
  "🏕": "campTent",
  "💍": "ring",
  "🎄": "fir",
  "🏴☠": "pirateFlag",
  "⚓": "anchor",
  "🐧": "penguin",
  "🩺": "stethoscope",
  "📝": "notepad",
  "🚒": "fireTruck",
  "🍳": "fryingPan",
  "📦": "parcel",
  "💻": "laptop",
  "🤳": "selfie",
  "✂": "scissors",
  "🧳": "suitcase",
  "🏗": "crane",
  "🚿": "shower",
  "🚛": "truck",
  "🚜": "tractor",
  "🐾": "paws",
  "🚑": "ambulance",
  "🎨": "palette",
  "⚖": "scales",
  "🔨": "gavel",
  "🧮": "abacus",
  "🛡": "shield",
  "✉": "envelope",
  "🗞": "newspaper",
  "🔬": "microscope",
  "🦴": "bone",
  "🔍": "magnifier",
  "🎣": "fishing",
  "👠": "heel",
  "💄": "lipstick",
  "🍽": "platter",
  "🎈": "balloon",
  "🛋": "couch",
  "🐻": "bear",
  "🍣": "sushi",
  "🍕": "pizza",
  "🥐": "croissant",
  "🗽": "liberty",
  "🐼": "panda",
  "🐫": "camel",
  "🧿": "evilEye",
  "🐘": "elephant",
  "🛕": "temple",
  "🦜": "parrot",
  "🌮": "taco",
  "💃": "dancer",
  "🥨": "pretzel",
  "💂": "guard",
  "🍁": "maple",
  "🦘": "kangaroo",
  "🏛": "columns",
  "🍇": "grapes",
  "🦅": "eagle",
  "⛰": "mountain",
  "🍚": "riceBowl",
  "🥔": "potato",
  "🌌": "aurora",
  "🎅": "santaHat",
  "🧀": "cheese",
  "🌷": "tulip",
  "🌋": "volcano",
  "🍜": "noodles",
  "🌴": "palm",
  "🏝": "island",
  "🥩": "steak",
  "☘": "clover",
  "🏄": "surfer",
  "🏰": "castle",
  "🥟": "dumpling",
  "⛵": "sailboat",
  "🦒": "giraffe",
  "🦙": "llama",
  "🥝": "kiwi",
  "🐎": "horseHead",
  "⛪": "church",
  "🌆": "skyline",
  "🕌": "mosque",
  "🎻": "violin",
  "🌍": "globe",
  "📺": "tv",
};

const CLEAN = /[️‍\u{1F3FB}-\u{1F3FF}]/gu;

/** Значок для эмодзи из данных. Если пары нет — золотая фишка с первой буквой подписи (или пиками). */
export function Glyph({ emoji, label, size = "1.15em", className }: { emoji: string; label?: string; size?: number | string; className?: string }) {
  const key = emoji.replace(CLEAN, "");
  const name = BY_EMOJI[key] ?? BY_EMOJI[[...key][0] ?? ""];
  if (name) return <GIcon name={name} size={size} className={className} />;
  const letter = label?.trim().charAt(0).toUpperCase();
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className={className} style={{ display: "inline-block", verticalAlign: "-0.16em", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9.500" fill="none" stroke="currentColor" strokeWidth="1.800" />
      {letter ? (
        <text x="12" y="16.400" textAnchor="middle" fontSize="12" fontWeight="900" fill="currentColor" fontFamily="Georgia, serif">
          {letter}
        </text>
      ) : (
        <path d="M12 6.500c-1.500 2.500-4 3.500-4 5.500 0 1.200 1 2 2 2 .7 0 1.300-.3 1.600-.8-.1 1-.4 1.700-1.100 2.300h3c-.7-.6-1-1.300-1.100-2.300.3.500.9.800 1.600.8 1 0 2-.8 2-2 0-2-2.500-3-4-5.500z" fill="currentColor" />
      )}
    </svg>
  );
}

/** Имя значка для эмодзи из данных, если пара есть (без запасной «фишки с буквой»). */
export function glyphName(emoji: string): GIconName | undefined {
  const key = emoji.replace(CLEAN, "");
  return BY_EMOJI[key] ?? BY_EMOJI[[...key][0] ?? ""];
}
