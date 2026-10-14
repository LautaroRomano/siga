import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NeutralNotFound } from "@/components/errors/not-found";

describe("NeutralNotFound", () => {
  it("muestra el mensaje neutro sin ninguna vía para entrar a la app", () => {
    render(<NeutralNotFound />);
    expect(screen.getByText("No encontramos esa página")).toBeInTheDocument();
    expect(screen.getByText("Revisá que el link esté completo.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
