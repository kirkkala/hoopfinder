import { BUY_ME_A_COFFEE_URL } from "@/lib/constants";

const BMC_IMAGE = "https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png";

export function BuyMeCoffeeButton({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const sizeClass =
    size === "md" ? "h-[2.25rem] wide:h-[2.5rem]" : "h-[2rem]";

  return (
    <a
      href={BUY_ME_A_COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex shrink-0 rounded-[0.4em] outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${className ?? ""}`}
    >
      <img
        src={BMC_IMAGE}
        alt="Buy Me a Coffee"
        width={217}
        height={60}
        className={`w-auto ${sizeClass}`}
      />
    </a>
  );
}
