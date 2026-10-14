import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WifiOff />
          </EmptyMedia>
          <EmptyTitle>Sin conexión</EmptyTitle>
          <EmptyDescription>
            No hay conexión a Internet. Las páginas que ya visitaste siguen disponibles.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  );
}
