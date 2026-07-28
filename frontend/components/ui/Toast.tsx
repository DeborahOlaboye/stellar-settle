export function Toast({ message, href }: { message: string | null; href?: string | null }) {
  if (!message) return null;
  return (
    <div
      className="fixed left-1/2 bottom-7 -translate-x-1/2 flex items-center gap-3 bg-border-soft border border-border-strong text-text px-5 py-3 rounded-lg text-sm shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-[60]"
      style={{ animation: "toastIn .25s ease" }}
    >
      <div>{message}</div>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-none text-accent hover:text-accent-hover font-semibold whitespace-nowrap"
        >
          View tx &rarr;
        </a>
      )}
    </div>
  );
}
