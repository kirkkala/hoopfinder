import type { ReactNode } from "react";

const MAP_CHROME_OFFSET =
  "calc(max(0.75rem, env(safe-area-inset-top)) + 4.25rem)";

/** Fill the map under the chrome, leaving the same inset used at the sides. */
const MAP_PANEL_MAX_HEIGHT =
  "calc(100dvh - max(0.75rem, env(safe-area-inset-top)) - 4.25rem - max(0.75rem, env(safe-area-inset-bottom)))";

export function AddCourtFormPanel({
  title,
  header,
  collapsed,
  inert = false,
  footer,
  children,
}: {
  title: string;
  header: ReactNode;
  collapsed: boolean;
  inert?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      inert={inert}
      className="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-3 sm:px-4"
      style={{ top: MAP_CHROME_OFFSET }}
    >
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="add-court-form-title"
        onClick={(event) => event.stopPropagation()}
        className="pointer-events-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel/95 shadow-[0_12px_32px_rgb(0_0_0_/_0.45)]"
        style={{ maxHeight: MAP_PANEL_MAX_HEIGHT }}
      >
        <div
          className={`shrink-0 px-3 pt-3 ${collapsed ? "" : "border-b border-white/10"}`}
        >
          <p
            id="add-court-form-title"
            className="font-display text-lg tracking-wide text-gold"
          >
            {title}
          </p>
          {header}
        </div>
        {collapsed ? null : (
          <>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-3 py-2">
              {children}
            </div>
            {footer ? (
              <div className="shrink-0 border-t border-white/10 px-3 py-2.5">
                {footer}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
