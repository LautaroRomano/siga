import { describe, expect, it } from "vitest";

import { productDescription, productName } from "@/lib/product";

describe("product", () => {
  it("define el nombre y la descripción del producto sin espacios de más", () => {
    expect(productName).toBe(productName.trim());
    expect(productName.length).toBeGreaterThan(0);
    expect(productDescription.length).toBeGreaterThan(0);
  });
});
