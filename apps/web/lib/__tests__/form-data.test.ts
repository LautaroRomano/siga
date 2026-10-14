import { describe, expect, it } from "vitest";

import { formValue } from "../form-data";

describe("formValue", () => {
  it("devuelve el string o vacío", () => {
    const form = new FormData();
    form.set("email", "a@b.co");
    form.set("file", new Blob(["x"]));
    expect(formValue(form, "email")).toBe("a@b.co");
    expect(formValue(form, "file")).toBe("");
    expect(formValue(form, "missing")).toBe("");
  });
});
