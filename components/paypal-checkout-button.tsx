import { startPayPalCheckout } from "@/lib/actions";
import type { ProductSlug } from "@/lib/types";
import type { ReactNode } from "react";

type PayPalCheckoutButtonProps = {
  productSlug?: ProductSlug;
  sourcePage: string;
  children?: ReactNode;
  className?: string;
  buttonClassName?: string;
};

export function PayPalCheckoutButton({
  productSlug = "leadradar",
  sourcePage,
  children = "Request product access",
  className,
  buttonClassName = "button primary"
}: PayPalCheckoutButtonProps) {
  return (
    <form action={startPayPalCheckout} className={["checkout-button-form", className].filter(Boolean).join(" ")}>
      <input type="hidden" name="product_slug" value={productSlug} />
      <input type="hidden" name="source_page" value={sourcePage} />
      <button type="submit" className={buttonClassName}>
        {children}
      </button>
      <p className="paypal-country-note">中国大陆用户请邮件联系获取支付方式：soloclientlab.com@gmail.com</p>
    </form>
  );
}
