"use client";

import type { ReactNode } from "react";
import { requestBooking } from "@/lib/booking-store";

type Props = {
  serviceId?: string | null;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

/** Botão que leva ao fluxo de agendamento, opcionalmente com um serviço escolhido. */
export function BookingTrigger({ serviceId = null, className = "", children, ...rest }: Props) {
  return (
    <button type="button" onClick={() => requestBooking(serviceId)} className={className} {...rest}>
      {children}
    </button>
  );
}
