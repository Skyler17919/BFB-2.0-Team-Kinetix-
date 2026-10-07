export type SalaryBucketKey = "0to3" | "3to6" | "6to10" | "10to15" | "15to25" | "25to50";

export type SkillDemand = {
  skill: string;
  demand: number;
};

export type CompanyDemand = {
  company: string;
  jobs: number;
  avgSalaryLpa?: number;
};

export type DataScienceMarketSummary = {
  totalJobs: number;
  averageSalaryLpa: number;
  averageOpenRoles: number;
  topCompanies: CompanyDemand[];
};

export type AnalyticsMarketSummary = {
  totalRows: number;
  salaryBuckets: Record<SalaryBucketKey, number>;
  topSkills: SkillDemand[];
};

export type TraitSummary = {
  bigData: number;
  mathsStats: number;
  coding: number;
  aiAndMlSkills: number;
  dashboardStorytelling: number;
};

export type PersonalitySummary = {
  conscientiousness: number;
  openness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  successRate: number;
};

export type TrendTraitSummary = {
  jds: TraitSummary;
  sds: PersonalitySummary;
  successSignals: {
    highSalaryHikeRate: number;
    bestFitRole: string;
  };
};

export const dataScienceMarketSummary: DataScienceMarketSummary = {
  totalJobs: 1602,
  averageSalaryLpa: 13.23,
  averageOpenRoles: 58.06,
  topCompanies: [
    { company: "TCS", jobs: 9064, avgSalaryLpa: 9.46 },
    { company: "Accenture", jobs: 5425, avgSalaryLpa: 12.19 },
    { company: "Cognizant", jobs: 3813, avgSalaryLpa: 11.21 },
    { company: "Wipro", jobs: 2566, avgSalaryLpa: 10.49 },
    { company: "IBM", jobs: 2480, avgSalaryLpa: 13.34 },
  ],
};

export const analyticsMarketSummary: AnalyticsMarketSummary = {
  totalRows: 15841,
  salaryBuckets: {
    "0to3": 2592,
    "3to6": 2239,
    "6to10": 2876,
    "10to15": 3608,
    "15to25": 3281,
    "25to50": 1245,
  },
  topSkills: [
    { skill: "sql", demand: 1008 },
    { skill: "python", demand: 938 },
    { skill: "finance", demand: 811 },
    { skill: "java", demand: 752 },
    { skill: "business analysis", demand: 730 },
  ],
};

export const trendTraitSummary: TrendTraitSummary = {
  jds: {
    bigData: 3.85,
    mathsStats: 4.29,
    coding: 4.27,
    aiAndMlSkills: 4.57,
    dashboardStorytelling: 4.36,
  },
  sds: {
    conscientiousness: 45.21,
    openness: 41.33,
    extraversion: 43.2,
    agreeableness: 44.6,
    neuroticism: 36.19,
    successRate: 0.52795,
  },
  successSignals: {
    highSalaryHikeRate: 0.4269,
    bestFitRole: "Not inferred from the provided aggregates",
  },
};

export function getMarketPulse() {
  return {
    analyticsTotalJobs: analyticsMarketSummary.totalRows,
    dataScienceAverageSalary: dataScienceMarketSummary.averageSalaryLpa,
    topAnalyticsSkill: analyticsMarketSummary.topSkills[0],
    highClassificationRate: trendTraitSummary.sds.successRate,
  };
}

export function getDatasetAvailability() {
  return {
    dataScienceJobs: true,
    analyticsJobs: true,
    skillTraits: true,
    personalityTraits: true,
    source: "uploaded dataset snapshot aggregates",
  };
}
