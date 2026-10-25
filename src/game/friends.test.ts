import { describe, expect, it } from "vitest";
import {
  activeParty,
  addRescuedFriend,
  clampCompleted,
  createPartyMember,
  hasRescuedFriend,
  inferRescuedFriends,
  isFriendId,
  normalizeRescuedFriends,
} from "./friends";

const ALL_FRIENDS = ["mira", "bo", "pico", "roku", "taro", "nova", "kiko"];

describe("friend roster inference", () => {
  it("infers the rescued roster from completed floors", () => {
    expect(inferRescuedFriends(0)).toEqual([]);
    expect(inferRescuedFriends(1)).toEqual(["mira"]);
    expect(inferRescuedFriends(3)).toEqual(["mira", "bo", "pico"]);
    expect(inferRescuedFriends(99)).toEqual(ALL_FRIENDS);
  });

  it("clamps completed floors", () => {
    expect(clampCompleted(-4)).toBe(0);
    expect(clampCompleted(2.9)).toBe(2);
    expect(clampCompleted("3")).toBe(3);
    expect(clampCompleted(Number.NaN)).toBe(0);
    expect(clampCompleted(99)).toBe(7);
  });
});

describe("normalizeRescuedFriends", () => {
  it("uses inferred friends when the stored roster is missing", () => {
    expect(normalizeRescuedFriends(undefined, ["mira", "bo"])).toEqual(["mira", "bo"]);
  });

  it("unions stored and inferred friends in canonical rescue order", () => {
    expect(
      normalizeRescuedFriends(["roku", "mira", "mira", "zoe"], ["mira", "bo", "pico"]),
    ).toEqual(["mira", "bo", "pico", "roku"]);
  });

  it("drops unknown friend ids", () => {
    expect(normalizeRescuedFriends(["mira", "sora", "zoe"], [])).toEqual(["mira"]);
  });

  it("keeps a valid stored friend who is not inferred yet", () => {
    expect(normalizeRescuedFriends(["mira", "bo"], ["mira"])).toEqual(["mira", "bo"]);
  });
});

describe("addRescuedFriend", () => {
  it("appends a new friend once", () => {
    expect(addRescuedFriend(["mira"], "bo")).toEqual(["mira", "bo"]);
    expect(addRescuedFriend(["mira", "bo"], "bo")).toEqual(["mira", "bo"]);
  });

  it("ignores unknown ids", () => {
    expect(addRescuedFriend(["mira"], "sora")).toEqual(["mira"]);
  });

  it("detects whether a friend is already rescued", () => {
    expect(hasRescuedFriend(["mira"], "mira")).toBe(true);
    expect(hasRescuedFriend(["mira"], "bo")).toBe(false);
  });
});

describe("activeParty", () => {
  it("keeps the three most recently rescued friends", () => {
    expect(activeParty(["mira", "bo", "pico", "roku", "taro"])).toEqual([
      "pico",
      "roku",
      "taro",
    ]);
  });

  it("includes the current friend only when passed in", () => {
    expect(activeParty(["mira", "bo", "pico", "roku", "taro"], "nova")).toEqual([
      "roku",
      "taro",
      "nova",
    ]);
    expect(activeParty(["mira", "bo"], "mira")).toEqual(["mira", "bo"]);
  });

  it("respects a custom party size", () => {
    expect(activeParty(["mira", "bo", "pico"], undefined, 2)).toEqual(["bo", "pico"]);
    expect(activeParty(["mira"], undefined, 0)).toEqual([]);
  });
});

describe("party members", () => {
  it("starts a rescued friend following with one charge", () => {
    expect(createPartyMember("mira", 4, 0)).toEqual({
      characterId: "mira",
      cellId: 4,
      slot: 0,
      mode: "follow",
      hasCharge: true,
      scoutPath: [],
      scoutIndex: 0,
    });
  });

  it("recognizes only rescued-friend ids", () => {
    expect(isFriendId("mira")).toBe(true);
    expect(isFriendId("sora")).toBe(false);
    expect(isFriendId("zoe")).toBe(false);
  });
});
