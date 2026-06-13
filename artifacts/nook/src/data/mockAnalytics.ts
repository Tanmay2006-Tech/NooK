export const mockAnalytics = {
  todayOccupancy: [10, 15, 30, 45, 60, 85, 95, 90, 80, 75, 60, 40, 20, 10], // 8AM to 10PM
  weekAvgOccupancy: [8, 12, 25, 40, 50, 75, 80, 78, 65, 60, 50, 35, 15, 5],
  heatScores: {
    W1: 85, W2: 90, W3: 95, W4: 92, W5: 88, W6: 85, W7: 82, W8: 80, W9: 78,
    Q1: 75, Q2: 80, Q3: 85, Q4: 82, Q5: 78, Q6: 75, Q7: 72, Q8: 70, Q9: 68,
    S1: 65, S2: 70, S3: 75, S4: 72, S5: 68, S6: 65, S7: 62, S8: 60, S9: 58,
    C1: 55, C2: 60, C3: 65, C4: 62, C5: 58, C6: 55, C7: 52, C8: 50, C9: 48,
  } as Record<string, number>
};
