import { describe, expect, it } from "vitest";

import {
  CITIES,
  generateTransitionRoadmap,
  parseGithubHandle,
  predictSkillRisk,
  SKILLS,
  verifySkillIntegrity,
} from "@/services/mockEngine";

describe("mockEngine integrity", () => {
  it("keeps city catalogs aligned", () => {
    expect(CITIES).toContain("Ahmedabad");
    expect(CITIES).toContain("Bengaluru");
    const prediction = predictSkillRisk("Manual QA", "Bengaluru", 3);
    const regions = prediction.regionalDemand.map((r) => r.region);
    for (const city of CITIES) {
      expect(regions).toContain(city);
    }
  });

  it("treats Mainframe COBOL as high-risk, matching the skill catalog", () => {
    const cobol = predictSkillRisk("Mainframe COBOL", "Jaipur", 2);
    const prompt = predictSkillRisk("Prompt Engineering", "Jaipur", 2);
    expect(cobol.exposureBand).toBe("High");
    expect(cobol.exposureScore).toBeGreaterThan(prompt.exposureScore);
  });

  it("parses GitHub handles and rejects empty org roots", () => {
    expect(parseGithubHandle("https://github.com/")).toBeNull();
    expect(parseGithubHandle("https://github.com/octocat")).toBe("octocat");
    expect(parseGithubHandle("github.com/octocat/hello-world")).toBe("octocat");
  });

  it("scores integrity from the username, not the github.com host", () => {
    const empty = verifySkillIntegrity("https://github.com/", ["React Development"]);
    const user = verifySkillIntegrity("https://github.com/octocat", ["React Development"]);
    expect(empty.signals[2]?.value).toMatch(/1\/1 verified/);
    expect(user.githubUrl).toContain("octocat");
    expect(user.authenticityScore).not.toBe(empty.authenticityScore);
  });

  it("bridges catalog skills to target roles", () => {
    const roadmap = generateTransitionRoadmap("Manual QA", "SDET");
    expect(roadmap.bridgeSkills[0]?.via).toContain("Playwright");
    expect(roadmap.phases).toHaveLength(3);
    expect(SKILLS).toContain("React Development");
  });
});
