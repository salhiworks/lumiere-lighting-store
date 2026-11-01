"use client";

import * as React from "react";
import { cartStore } from "@/lib/cart";

/* Rendered only once the server has confirmed the payment: the saved cart has become an order. */
export function ClearCart() {
  React.useEffect(() => cartStore.clear(), []);
  return null;
}
