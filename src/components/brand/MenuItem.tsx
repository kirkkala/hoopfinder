"use client";

import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useContext } from "react";
import { AppLink } from "@/components/brand/AppLink";

const closeMenuContext = createContext<(() => void) | null>(null);

const itemClass =
  "flex w-full items-center gap-2 px-4 py-3.5 text-left text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60";

type MenuItemBase = {
  children: ReactNode;
  /** Extra content above the control, inside the same list item. */
  note?: ReactNode;
};

type MenuLinkItem = MenuItemBase & {
  href: string;
  prefetch?: boolean;
  onClick?: () => void;
};

type MenuButtonItem = MenuItemBase & {
  href?: undefined;
  onClick: () => void;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "dialog";
};

export function MenuItemList({
  onNavigate,
  children,
}: {
  onNavigate: () => void;
  children: ReactNode;
}) {
  return (
    <closeMenuContext.Provider value={onNavigate}>
      <ul className="border-y border-white/10">{children}</ul>
    </closeMenuContext.Provider>
  );
}

export function MenuItem(props: MenuLinkItem | MenuButtonItem) {
  const pathname = usePathname();
  const closeMenu = useContext(closeMenuContext);
  const current = props.href != null && pathname === props.href;
  const className = `${itemClass} ${
    current ? "bg-white/10 text-gold" : "text-white hover:bg-white/5 focus-visible:bg-white/5"
  }`;

  function activate(action?: () => void) {
    closeMenu?.();
    action?.();
  }

  const control =
    props.href != null ? (
      <AppLink
        href={props.href}
        prefetch={props.prefetch}
        aria-current={current ? "page" : undefined}
        className={className}
        onClick={() => activate(props.onClick)}
      >
        {props.children}
      </AppLink>
    ) : (
      <button
        type="button"
        className={className}
        aria-expanded={props["aria-expanded"]}
        aria-haspopup={props["aria-haspopup"]}
        onClick={() => activate(props.onClick)}
      >
        {props.children}
      </button>
    );

  return (
    <li>
      {props.note}
      {control}
    </li>
  );
}
