import { describe, expect, it } from "vitest";

import {
  ErrorLogServiceClass,
  logActionFailure,
  logServerError,
} from "../src/components/logs/ErrorLogService.js";

// #122: the user message stored in the error log must be the message the user saw, built from
// the actual failure, not a generic text unrelated to it.

describe("error log user message (#122)", () => {
  it("records the Action2Error message of a client-side action failure, not a server error", () => {
    const service = new ErrorLogServiceClass();
    const entry = logActionFailure(
      "Commit",
      { status: "error", errorType: "FailedToHandleAction", errorMessage: "entity Book not found" },
      {},
      service,
    );
    expect(entry.userMessage).toBe("Error in Commit: entity Book not found");
    expect(entry.errorMessage).toBe("entity Book not found");
    expect(entry.category).toBe("client");
    expect(service.getAllErrors()[0].userMessage).toBe("Error in Commit: entity Book not found");
  });

  it("records the server's message for a server error", () => {
    const service = new ErrorLogServiceClass();
    const entry = logActionFailure(
      "Commit",
      { status: "error", isServerError: true, errorType: "FailedToHandleAction", errorMessage: "store is down" },
      {},
      service,
    );
    expect(entry.userMessage).toBe("Server error: store is down");
    expect(entry.category).toBe("server");
  });

  it("falls back to the error type when the Action2Error has no message", () => {
    const entry = logActionFailure("Load", { status: "error", errorType: "FailedToGetInstances" }, {}, new ErrorLogServiceClass());
    expect(entry.userMessage).toBe("Error in Load: FailedToGetInstances");
  });

  it("records the message of a thrown exception", () => {
    const entry = logActionFailure("Load", new Error("boom"), {}, new ErrorLogServiceClass());
    expect(entry.userMessage).toBe("Error in Load: boom");
    expect(entry.errorType).toBe("Error");
  });

  it("keeps the startup message for configuration actions", () => {
    const entry = logActionFailure("Load config", new Error("bad json"), {}, new ErrorLogServiceClass());
    expect(entry.userMessage).toBe("Application startup failed. Please check your configuration and try again.");
    expect(entry.category).toBe("startup");
  });

  it("logServerError carries the actual server message", () => {
    const entry = logServerError("store is down");
    expect(entry.userMessage).toBe("Server error: store is down");
  });
});
