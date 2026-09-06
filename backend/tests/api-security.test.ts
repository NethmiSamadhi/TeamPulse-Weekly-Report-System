import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("TeamPulse API", () => {
  it("returns a successful health response", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("TeamPulse API is running");
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  it("returns 404 for an unknown API endpoint", async () => {
    const response = await request(app).get("/api/not-a-real-route");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "API endpoint not found",
    });
  });

  it.each([
    ["reports", "/api/reports"],
    ["projects", "/api/projects"],
    ["dashboard", "/api/dashboard"],
  ])(
    "rejects unauthenticated access to %s",
    async (_name, endpoint) => {
      const response = await request(app).get(endpoint);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    },
  );
});
