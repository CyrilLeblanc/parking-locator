"use client";

import React, { useState } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useMapSelection } from "@/contexts/map-selection";
import { ParkingContent } from "@/components/parking/ParkingContent";

const SNAP_PARTIAL = 0.5;
const SNAP_FULL = 1;

export default function ParkingBottomSheet() {
  const { selectedParking, clearSelection } = useMapSelection();
  const isMobile = useIsMobile();
  const [snap, setSnap] = useState<number | string | null>(SNAP_PARTIAL);
  const handleOpenChange = (open: boolean) => { if (!open) clearSelection(); };

  // Réinitialise le snap à chaque nouvelle sélection
  const parkingId = selectedParking?.id;
  React.useEffect(() => { setSnap(SNAP_PARTIAL); }, [parkingId]);

  if (isMobile) {
    return (
      <Drawer
        open={selectedParking !== null}
        onOpenChange={handleOpenChange}
        snapPoints={[SNAP_PARTIAL, SNAP_FULL]}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
      >
        <DrawerContent className="z-[2000] max-h-[100dvh]">
          {selectedParking && (
            <>
              <DrawerTitle className="sr-only">{selectedParking.name}</DrawerTitle>
              <DrawerDescription className="sr-only">{selectedParking.address}</DrawerDescription>
              <div className={snap === SNAP_FULL ? "overflow-y-auto" : "overflow-hidden"}>
                <ParkingContent parking={selectedParking} onClose={clearSelection} />
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={selectedParking !== null} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="z-[2000] w-[400px] sm:max-w-[400px] p-0 flex flex-col gap-0"
      >
        {selectedParking && (
          <>
            <SheetTitle className="sr-only">{selectedParking.name}</SheetTitle>
            <SheetDescription className="sr-only">{selectedParking.address}</SheetDescription>
            <ScrollArea className="flex-1 min-h-0">
              <ParkingContent parking={selectedParking} onClose={clearSelection} />
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
