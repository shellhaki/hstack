import { expect, test } from "bun:test";
import { splitBill } from "../src/split";

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

test("parts always add up to the total", () => {
  for (const [t, s] of [[1000, [1, 1, 1]], [101, [1, 1]], [1, [1, 1, 1]], [99999, [3, 7, 11, 13]]] as [number, number[]][]) {
    expect(sum(splitBill(t, s))).toBe(t);
  }
});
test("only whole cents", () => {
  expect(splitBill(1000, [1, 1, 1]).every(Number.isInteger)).toBe(true);
});
test("proportional to shares", () => {
  expect(splitBill(900, [2, 1])).toEqual([600, 300]);
});
test("leftover cents go to the largest remainders, never more than one each", () => {
  const r = splitBill(1000, [1, 1, 1]);
  expect(r.slice().sort()).toEqual([333, 333, 334]);
  expect(Math.max(...r) - Math.min(...r)).toBe(1);
});
test("deterministic: same input, same output", () => {
  expect(splitBill(1000, [1, 1, 1])).toEqual(splitBill(1000, [1, 1, 1]));
});
test("fractional shares work", () => {
  expect(sum(splitBill(1000, [0.5, 1.5]))).toBe(1000);
  expect(splitBill(1000, [0.5, 1.5])).toEqual([250, 750]);
});
test("a zero share pays nothing", () => {
  expect(splitBill(1000, [1, 0, 1])).toEqual([500, 0, 500]);
});
test("zero total", () => {
  expect(splitBill(0, [1, 2])).toEqual([0, 0]);
});
test("rejects invalid input", () => {
  expect(() => splitBill(1000, [])).toThrow();
  expect(() => splitBill(1000, [0, 0])).toThrow();
  expect(() => splitBill(1000, [1, -1])).toThrow();
  expect(() => splitBill(-5, [1])).toThrow();
  expect(() => splitBill(10.5, [1])).toThrow();
});
