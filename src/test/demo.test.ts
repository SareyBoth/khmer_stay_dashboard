import { beforeEach, describe, expect, it } from "vitest";
import { authenticateDemo, canAccessPortal } from "@/src/lib/auth";
import { filterProperties } from "@/src/lib/filters";
import { properties as seedProperties } from "@/src/lib/mock-data";
import { useAppStore } from "@/src/stores/app-store";
import { useDemoStore } from "@/src/stores/demo-store";

describe("KhmerStay demo authentication", () => {
  it("authenticates the administrator demo account", () => {
    expect(authenticateDemo("admin@khmerstay.demo", "Demo123!")).toBe("admin");
  });

  it("authenticates the property owner demo account", () => {
    expect(authenticateDemo("owner@khmerstay.demo", "Demo123!")).toBe("owner");
  });

  it("keeps admin and owner portals separated", () => {
    expect(canAccessPortal("admin", "admin")).toBe(true);
    expect(canAccessPortal("admin", "owner")).toBe(false);
    expect(canAccessPortal("owner", "admin")).toBe(false);
  });
});

describe("KhmerStay local preference state", () => {
  beforeEach(() => {
    useAppStore.getState().resetDemo();
  });

  it("switches language and currency", () => {
    useAppStore.getState().setLanguage("en");
    useAppStore.getState().setCurrency("KHR");
    expect(useAppStore.getState().language).toBe("en");
    expect(useAppStore.getState().currency).toBe("KHR");
  });
});

describe("KhmerStay local record interactions", () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
  });

  it("creates an owner property draft", () => {
    const before = useDemoStore.getState().properties.length;
    useDemoStore.getState().addProperty({ ...seedProperties[0], id: "KS-TEST", name: "Test Stay", status: "Draft" });
    expect(useDemoStore.getState().properties).toHaveLength(before + 1);
    expect(useDemoStore.getState().properties[0].id).toBe("KS-TEST");
  });

  it("updates a booking status", () => {
    useDemoStore.getState().updateBookingStatus("KST-260900", "Confirmed");
    expect(useDemoStore.getState().bookingStatuses["KST-260900"]).toBe("Confirmed");
  });

  it("approves a property", () => {
    useDemoStore.getState().updatePropertyStatus("KS-P006", "Published");
    expect(useDemoStore.getState().propertyStatuses["KS-P006"]).toBe("Published");
  });

  it("records an owner verification decision", () => {
    useDemoStore.getState().setVerificationDecision("KS-O003", "Approved");
    expect(useDemoStore.getState().verificationDecisions["KS-O003"]).toBe("Approved");
  });

  it("filters properties by local text and status", () => {
    const result = filterProperties(seedProperties, "kampot", "Published", {});
    expect(result).toHaveLength(1);
    expect(result[0].name).toContain("Kampot");
  });

  it("resets changed local demo data", () => {
    useDemoStore.getState().updatePropertyStatus("KS-P001", "Paused");
    useDemoStore.getState().reset();
    expect(useDemoStore.getState().propertyStatuses["KS-P001"]).toBe("Published");
  });
});
