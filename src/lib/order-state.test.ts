import { describe, expect, it } from "vitest";
import { canTransition, csvEscape, maskName } from "./order-state";

describe("订单状态机", () => {
  it("允许合法正向流转", () => {
    expect(canTransition("PENDING", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "IN_TRANSIT")).toBe(true);
    expect(canTransition("IN_TRANSIT", "COMPLETED")).toBe(true);
  });

  it("允许任意非终态退款", () => {
    for (const from of ["PENDING", "PROCESSING", "SHIPPED", "IN_TRANSIT", "COMPLETED"] as const) {
      expect(canTransition(from, "REFUNDED")).toBe(true);
    }
  });

  it("拒绝跳步", () => {
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
    expect(canTransition("PENDING", "IN_TRANSIT")).toBe(false);
  });

  it("REFUNDED 是终态", () => {
    expect(canTransition("REFUNDED", "PENDING")).toBe(false);
    expect(canTransition("REFUNDED", "COMPLETED")).toBe(false);
  });
});

describe("脱敏与 CSV", () => {
  it("买家姓名脱敏只保留首字母", () => {
    expect(maskName("James Smith")).toBe("J***");
    expect(maskName("王")).toBe("王***");
    expect(maskName("")).toBe("");
  });

  it("CSV 转义逗号与引号", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape(123)).toBe("123");
    expect(csvEscape(null)).toBe("");
  });
});
