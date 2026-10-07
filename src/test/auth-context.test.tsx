import { describe, expect, it } from "vitest";
import { getFriendlyAuthError } from "@/context/AuthContext";

describe("getFriendlyAuthError", () => {
  it("explains when email signup is disabled in Supabase", () => {
    const result = getFriendlyAuthError({ message: "Auth Api error: email signups are disabled" }, "Unable to create your account. Please try again.");

    expect(result).toContain("Email sign-up is disabled");
  });

  it("explains when the browser cannot resolve the Supabase host", () => {
    const result = getFriendlyAuthError({ message: "Failed to fetch: net::ERR_NAME_NOT_RESOLVED" }, "Unable to create your account. Please try again.");

    expect(result).toContain("could not be reached from this browser");
  });
});
