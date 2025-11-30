import { assertEquals, assertThrows } from "@std/assert";
import { SqlRows } from "./rows.ts";

Deno.test("SqlRows", async (t) => {
  await t.step("creates from array", () => {
    const rows = new SqlRows([{ id: 1 }, { id: 2 }]);
    assertEquals(rows.length, 2);
    assertEquals(rows[0], { id: 1 });
    assertEquals(rows[1], { id: 2 });
  });

  await t.step("is iterable", () => {
    const rows = new SqlRows([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const result: { id: number }[] = [];
    for (const row of rows) {
      result.push(row);
    }
    assertEquals(result, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  await t.step("supports spread operator", () => {
    const rows = new SqlRows([{ id: 1 }, { id: 2 }]);
    const spread = [...rows];
    assertEquals(spread, [{ id: 1 }, { id: 2 }]);
  });

  await t.step("supports find method", () => {
    const rows = new SqlRows([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const found = rows.find((r) => r.id === 2);
    assertEquals(found, { id: 2 });
  });

  await t.step("supports forEach method", () => {
    const rows = new SqlRows([{ id: 1 }, { id: 2 }]);
    const result: number[] = [];
    rows.forEach((r) => result.push(r.id));
    assertEquals(result, [1, 2]);
  });

  await t.step("supports Array.from()", () => {
    const rows = new SqlRows([{ id: 1 }, { id: 2 }]);
    const arr = Array.from(rows);
    assertEquals(arr, [{ id: 1 }, { id: 2 }]);
  });

  await t.step("first() returns first element", () => {
    const rows = new SqlRows([{ id: 1 }, { id: 2 }]);
    assertEquals(rows.first(), { id: 1 });
  });

  await t.step("first() returns undefined for empty array", () => {
    const rows = new SqlRows<{ id: number }>([]);
    assertEquals(rows.first(), undefined);
  });

  await t.step("firstOrThrow() returns first element", () => {
    const rows = new SqlRows([{ id: 1 }, { id: 2 }]);
    assertEquals(rows.firstOrThrow(), { id: 1 });
  });

  await t.step("firstOrThrow() throws for empty array", () => {
    const rows = new SqlRows<{ id: number }>([]);
    assertThrows(
      () => rows.firstOrThrow(),
      Error,
      "No rows found",
    );
  });

  await t.step("last() returns last element", () => {
    const rows = new SqlRows([{ id: 1 }, { id: 2 }, { id: 3 }]);
    assertEquals(rows.last(), { id: 3 });
  });

  await t.step("last() returns undefined for empty array", () => {
    const rows = new SqlRows<{ id: number }>([]);
    assertEquals(rows.last(), undefined);
  });

  await t.step("lastOrThrow() returns last element", () => {
    const rows = new SqlRows([{ id: 1 }, { id: 2 }]);
    assertEquals(rows.lastOrThrow(), { id: 2 });
  });

  await t.step("lastOrThrow() throws for empty array", () => {
    const rows = new SqlRows<{ id: number }>([]);
    assertThrows(
      () => rows.lastOrThrow(),
      Error,
      "No rows found",
    );
  });
});
