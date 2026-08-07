import { startMonthlySubscriptionCheckout } from "@/lib/actions";
import type { ProductSlug } from "@/lib/types";
import type { ReactNode } from "react";

type MonthlySubscriptionCheckoutButtonProps = {
  productSlug?: ProductSlug;
  sourcePage: string;
  children?: ReactNode;
  className?: string;
  buttonClassName?: string;
};

export function MonthlySubscriptionCheckoutButton({
  productSlug = "leadradar",
  sourcePage,
  children = "Request product access",
  className,
  buttonClassName = "button primary"
}: MonthlySubscriptionCheckoutButtonProps) {
  return (
    <form action={startMonthlySubscriptionCheckout} className={["checkout-button-form", className].filter(Boolean).join(" ")}>
      <input type="hidden" name="product_slug" value={productSlug} />
      <input type="hidden" name="source_page" value={sourcePage} />
      <button type="submit" className={buttonClassName}>
        {children}
      </button>
    </form>
  );
}
