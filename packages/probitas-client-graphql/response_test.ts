import { assertEquals, assertInstanceOf } from "@std/assert";
import { createGraphqlResponse } from "./response.ts";
import { GraphqlExecutionError } from "./errors.ts";

Deno.test("createGraphqlResponse", async (t) => {
  await t.step("creates response with data and no errors", () => {
    const response = createGraphqlResponse({
      data: { user: { id: 1, name: "John" } },
      error: null,
      extensions: undefined,
      duration: 100,
      status: 200,
      raw: new Response(),
    });

    assertEquals(response.ok, true);
    assertEquals(response.data(), { user: { id: 1, name: "John" } });
    assertEquals(response.error, null);
    assertEquals(response.duration, 100);
    assertEquals(response.status, 200);
  });

  await t.step("creates response with error", () => {
    const error = new GraphqlExecutionError([{ message: "Not found" }]);
    const response = createGraphqlResponse({
      data: null,
      error,
      extensions: undefined,
      duration: 50,
      status: 200,
      raw: new Response(),
    });

    assertEquals(response.ok, false);
    assertEquals(response.data(), null);
    assertEquals(response.error, error);
  });

  await t.step("ok is false when error present even with partial data", () => {
    const error = new GraphqlExecutionError([{ message: "Field error" }]);
    const response = createGraphqlResponse({
      data: { user: null },
      error,
      extensions: undefined,
      duration: 50,
      status: 200,
      raw: new Response(),
    });

    assertEquals(response.ok, false);
    assertEquals(response.data(), { user: null });
  });

  await t.step("includes extensions", () => {
    const response = createGraphqlResponse({
      data: { test: true },
      error: null,
      extensions: { tracing: { duration: 123 } },
      duration: 50,
      status: 200,
      raw: new Response(),
    });

    assertEquals(response.extensions, { tracing: { duration: 123 } });
  });

  await t.step("includes raw response", () => {
    const rawResponse = new Response();
    const response = createGraphqlResponse({
      data: null,
      error: null,
      extensions: undefined,
      duration: 10,
      status: 200,
      raw: rawResponse,
    });

    assertEquals(response.raw(), rawResponse);
  });

  await t.step("includes headers from raw response", () => {
    const rawResponse = new Response(null, {
      headers: { "X-Custom-Header": "test-value" },
    });
    const response = createGraphqlResponse({
      data: null,
      error: null,
      extensions: undefined,
      duration: 10,
      status: 200,
      raw: rawResponse,
    });

    assertInstanceOf(response.headers, Headers);
    assertEquals(response.headers.get("X-Custom-Header"), "test-value");
  });

  await t.step("data() method returns typed data", () => {
    interface User {
      id: number;
      name: string;
    }
    const response = createGraphqlResponse({
      data: { user: { id: 1, name: "John" } },
      error: null,
      extensions: undefined,
      duration: 100,
      status: 200,
      raw: new Response(),
    });

    const result = response.data<{ user: User }>();
    assertEquals(result?.user.id, 1);
    assertEquals(result?.user.name, "John");
  });
});
