"use client";

import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigateButtonProps {
  address: string;
  city: string;
}

export function NavigateButton({ address, city }: NavigateButtonProps) {
  const destination = encodeURIComponent(`${address}, ${city}`);
  const href = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

  return (
    <Button variant="ghost" size="icon-sm" aria-label="Y aller" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Navigation />
      </a>
    </Button>
  );
}
