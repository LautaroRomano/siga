import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";
import { SearchXIcon } from "lucide-react";

// Pantalla neutra para cualquier URL inexistente: no invita a iniciar sesión porque no se sabe
// quién entró.
export function NeutralNotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>No encontramos esa página</EmptyTitle>
        <EmptyDescription>Revisá que el link esté completo.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
