import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function svg(props: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    width: 18,
    height: 18,
    "aria-hidden": true,
    ...props,
  };
}

export function IconGrid(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a3 3 0 0 1 0 5.74" />
    </svg>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10" />
      <path d="M8 7h4M8 11h4M8 15h4" />
      <path d="M3 21h18" />
    </svg>
  );
}

export function IconTag(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M20 13.5 12.5 21a2 2 0 0 1-2.8 0L3 14.3V4h10.3z" />
      <circle cx="7.5" cy="8.5" r="1" />
    </svg>
  );
}

export function IconBed(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
      <path d="M3 18h18M6 10V8a2 2 0 0 1 2-2h2" />
      <path d="M3 18v2M21 18v2" />
    </svg>
  );
}

export function IconCard(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15v-3M12 15V8M16 15v-5" />
    </svg>
  );
}

export function IconPortal(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.2 2.4 3.3 5.1 3.3 8s-1.1 5.6-3.3 8c-2.2-2.4-3.3-5.1-3.3-8s1.1-5.6 3.3-8z" />
    </svg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M9 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
      <path d="M14 16l4-4-4-4M18 12H9" />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export const deskIcons = {
  "/admin": IconGrid,
  "/admin/property": IconBuilding,
  "/admin/categories": IconTag,
  "/admin/extras": IconBed,
  "/admin/pricing": IconCard,
  "/admin/availability": IconCalendar,
  "/admin/bookings": IconCalendar,
  "/admin/guests": IconUsers,
  "/admin/subscription": IconCard,
  "/admin/widget": IconChart,
  "/admin/activity": IconClock,
  "/admin/users": IconUsers,
} as const;
