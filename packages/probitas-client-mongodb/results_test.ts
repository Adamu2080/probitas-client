import { assertEquals, assertThrows } from "@std/assert";
import {
  createMongoCountFailure,
  createMongoDeleteFailure,
  createMongoDocs,
  createMongoFindFailure,
  createMongoFindOneFailure,
  createMongoInsertManyFailure,
  createMongoInsertOneFailure,
  createMongoUpdateFailure,
} from "./results.ts";
import { MongoNotFoundError, MongoQueryError } from "./errors.ts";

Deno.test("createMongoDocs", async (t) => {
  await t.step("creates array with first/last methods", () => {
    const docs = createMongoDocs([{ id: 1 }, { id: 2 }, { id: 3 }]);
    assertEquals(docs.length, 3);
    assertEquals(docs[0], { id: 1 });
    assertEquals(docs[1], { id: 2 });
    assertEquals(docs[2], { id: 3 });
  });

  await t.step("first() returns first element", () => {
    const docs = createMongoDocs([{ id: 1 }, { id: 2 }]);
    assertEquals(docs.first(), { id: 1 });
  });

  await t.step("first() returns undefined for empty array", () => {
    const docs = createMongoDocs<{ id: number }>([]);
    assertEquals(docs.first(), undefined);
  });

  await t.step("firstOrThrow() returns first element", () => {
    const docs = createMongoDocs([{ id: 1 }, { id: 2 }]);
    assertEquals(docs.firstOrThrow(), { id: 1 });
  });

  await t.step("firstOrThrow() throws for empty array", () => {
    const docs = createMongoDocs<{ id: number }>([]);
    assertThrows(
      () => docs.firstOrThrow(),
      MongoNotFoundError,
      "No documents found",
    );
  });

  await t.step("last() returns last element", () => {
    const docs = createMongoDocs([{ id: 1 }, { id: 2 }, { id: 3 }]);
    assertEquals(docs.last(), { id: 3 });
  });

  await t.step("last() returns undefined for empty array", () => {
    const docs = createMongoDocs<{ id: number }>([]);
    assertEquals(docs.last(), undefined);
  });

  await t.step("lastOrThrow() returns last element", () => {
    const docs = createMongoDocs([{ id: 1 }, { id: 2 }]);
    assertEquals(docs.lastOrThrow(), { id: 2 });
  });

  await t.step("lastOrThrow() throws for empty array", () => {
    const docs = createMongoDocs<{ id: number }>([]);
    assertThrows(
      () => docs.lastOrThrow(),
      MongoNotFoundError,
      "No documents found",
    );
  });

  await t.step("supports iteration", () => {
    const docs = createMongoDocs([{ id: 1 }, { id: 2 }]);
    const result: { id: number }[] = [];
    for (const doc of docs) {
      result.push(doc);
    }
    assertEquals(result, [{ id: 1 }, { id: 2 }]);
  });

  await t.step("supports array methods", () => {
    const docs = createMongoDocs([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const mapped = docs.map((d) => d.id);
    assertEquals(mapped, [1, 2, 3]);

    const filtered = docs.filter((d) => d.id > 1);
    assertEquals(filtered, [{ id: 2 }, { id: 3 }]);

    const found = docs.find((d) => d.id === 2);
    assertEquals(found, { id: 2 });
  });
});

Deno.test("Failure result factory functions", async (t) => {
  const testError = new MongoQueryError("Test error", "test_collection");
  const testDuration = 123.45;

  await t.step("createMongoFindFailure creates correct result", () => {
    const result = createMongoFindFailure(testError, testDuration);
    assertEquals(result.kind, "mongo:find");
    assertEquals(result.ok, false);
    assertEquals(result.error, testError);
    assertEquals(result.duration, testDuration);
  });

  await t.step("createMongoFindOneFailure creates correct result", () => {
    const result = createMongoFindOneFailure(testError, testDuration);
    assertEquals(result.kind, "mongo:find-one");
    assertEquals(result.ok, false);
    assertEquals(result.error, testError);
    assertEquals(result.duration, testDuration);
  });

  await t.step("createMongoInsertOneFailure creates correct result", () => {
    const result = createMongoInsertOneFailure(testError, testDuration);
    assertEquals(result.kind, "mongo:insert-one");
    assertEquals(result.ok, false);
    assertEquals(result.error, testError);
    assertEquals(result.duration, testDuration);
  });

  await t.step("createMongoInsertManyFailure creates correct result", () => {
    const result = createMongoInsertManyFailure(testError, testDuration);
    assertEquals(result.kind, "mongo:insert-many");
    assertEquals(result.ok, false);
    assertEquals(result.error, testError);
    assertEquals(result.duration, testDuration);
  });

  await t.step("createMongoUpdateFailure creates correct result", () => {
    const result = createMongoUpdateFailure(testError, testDuration);
    assertEquals(result.kind, "mongo:update");
    assertEquals(result.ok, false);
    assertEquals(result.error, testError);
    assertEquals(result.duration, testDuration);
  });

  await t.step("createMongoDeleteFailure creates correct result", () => {
    const result = createMongoDeleteFailure(testError, testDuration);
    assertEquals(result.kind, "mongo:delete");
    assertEquals(result.ok, false);
    assertEquals(result.error, testError);
    assertEquals(result.duration, testDuration);
  });

  await t.step("createMongoCountFailure creates correct result", () => {
    const result = createMongoCountFailure(testError, testDuration);
    assertEquals(result.kind, "mongo:count");
    assertEquals(result.ok, false);
    assertEquals(result.error, testError);
    assertEquals(result.duration, testDuration);
  });
});
