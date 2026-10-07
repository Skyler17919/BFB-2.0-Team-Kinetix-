import { describe, expect, it } from "vitest";

import {
  analyticsMarketSummary,
  dataScienceMarketSummary,
  trendTraitSummary,
} from "@/services/marketData";

describe("marketData integration", () => {
  it("loads a real data-science market summary from the uploaded dataset", () => {
    expect(dataScienceMarketSummary.totalJobs).toBe(1602);
    expect(dataScienceMarketSummary.averageSalaryLpa).toBe(13.23);
    expect(dataScienceMarketSummary.topCompanies[0]?.company).toBe("TCS");
    expect(dataScienceMarketSummary.topCompanies[0]?.jobs).toBe(9064);
  });

  it("loads real analytics market ranges and top skills", () => {
    const totalBucketCount = Object.values(analyticsMarketSummary.salaryBuckets).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(totalBucketCount).toBe(analyticsMarketSummary.totalRows);
    expect(analyticsMarketSummary.salaryBuckets["10to15"]).toBe(3608);
    expect(analyticsMarketSummary.topSkills[0]?.skill).toBe("sql");
    expect(analyticsMarketSummary.topSkills[0]?.demand).toBe(1008);
  });

  it("includes real trait patterns and success signals from the uploaded trait files", () => {
    expect(trendTraitSummary.jds.aiAndMlSkills).toBe(4.57);
    expect(trendTraitSummary.sds.conscientiousness).toBe(45.21);
    expect(trendTraitSummary.sds.successRate).toBeCloseTo(0.52795);
    expect(trendTraitSummary.successSignals.highSalaryHikeRate).toBeCloseTo(0.4269);
  });
});
