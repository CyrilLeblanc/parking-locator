"use client";

import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigateButtonProps {
  lat: number;
  lng: number;
}

export function NavigateButton({ lat, lng }: NavigateButtonProps) {
  const href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <Button variant="ghost" size="icon-sm" aria-label="Y aller" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Navigation />
      </a>
    </Button>
  );
}
