import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

describe("GET /api/v1/health", () => {
  it("returns the service health payload", async () => {
    const response = await request(createApp())
      .get("/api/v1/health")
      .expect(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "i-share-api",
    });
  });
});
