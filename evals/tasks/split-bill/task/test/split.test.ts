import { expect, test } from "bun:test";
import { splitBill } from "../src/split";

test("splits evenly", () => {
  expect(splitBill(1000, [1, 1])).toEqual([500, 500]);
});
