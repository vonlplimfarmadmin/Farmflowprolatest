import { StandardBodyWeightItem, BodyWeightRecord } from '../../types';

export interface WeeklyStandardCurve {
  ageWeek: number;
  phase: 'Brooding' | 'Rearing' | 'Pre-Lay Transition' | 'Peak Production' | 'Post-Peak';
  femaleStandardGrams: number;
  maleStandardGrams: number;
  femaleToleranceMin: number;
  femaleToleranceMax: number;
  maleToleranceMin: number;
  maleToleranceMax: number;
  femaleTargetWeeklyGain: number;
  maleTargetWeeklyGain: number;
}

// Full weekly standard growth curve benchmarks (Cobb 500 / Ross 308 standards)
export const BASE_WEEKLY_STANDARDS: WeeklyStandardCurve[] = [
  { ageWeek: 1, phase: 'Brooding', femaleStandardGrams: 140, maleStandardGrams: 155, femaleToleranceMin: 133, femaleToleranceMax: 147, maleToleranceMin: 147, maleToleranceMax: 163, femaleTargetWeeklyGain: 95, maleTargetWeeklyGain: 115 },
  { ageWeek: 2, phase: 'Brooding', femaleStandardGrams: 235, maleStandardGrams: 270, femaleToleranceMin: 223, femaleToleranceMax: 247, maleToleranceMin: 256, maleToleranceMax: 284, femaleTargetWeeklyGain: 115, maleTargetWeeklyGain: 145 },
  { ageWeek: 3, phase: 'Brooding', femaleStandardGrams: 350, maleStandardGrams: 415, femaleToleranceMin: 332, femaleToleranceMax: 368, maleToleranceMin: 394, maleToleranceMax: 436, femaleTargetWeeklyGain: 140, maleTargetWeeklyGain: 165 },
  { ageWeek: 4, phase: 'Brooding', femaleStandardGrams: 490, maleStandardGrams: 580, femaleToleranceMin: 465, femaleToleranceMax: 515, maleToleranceMin: 551, maleToleranceMax: 609, femaleTargetWeeklyGain: 125, maleTargetWeeklyGain: 160 },
  { ageWeek: 5, phase: 'Rearing', femaleStandardGrams: 615, maleStandardGrams: 740, femaleToleranceMin: 584, femaleToleranceMax: 646, maleToleranceMin: 703, maleToleranceMax: 777, femaleTargetWeeklyGain: 130, maleTargetWeeklyGain: 160 },
  { ageWeek: 6, phase: 'Rearing', femaleStandardGrams: 745, maleStandardGrams: 900, femaleToleranceMin: 708, femaleToleranceMax: 782, maleToleranceMin: 855, maleToleranceMax: 945, femaleTargetWeeklyGain: 135, maleTargetWeeklyGain: 170 },
  { ageWeek: 7, phase: 'Rearing', femaleStandardGrams: 880, maleStandardGrams: 1070, femaleToleranceMin: 836, femaleToleranceMax: 924, maleToleranceMin: 1016, maleToleranceMax: 1124, femaleTargetWeeklyGain: 140, maleTargetWeeklyGain: 180 },
  { ageWeek: 8, phase: 'Rearing', femaleStandardGrams: 1020, maleStandardGrams: 1250, femaleToleranceMin: 969, femaleToleranceMax: 1071, maleToleranceMin: 1188, maleToleranceMax: 1312, femaleTargetWeeklyGain: 105, maleTargetWeeklyGain: 150 },
  { ageWeek: 9, phase: 'Rearing', femaleStandardGrams: 1125, maleStandardGrams: 1400, femaleToleranceMin: 1069, femaleToleranceMax: 1181, maleToleranceMin: 1330, maleToleranceMax: 1470, femaleTargetWeeklyGain: 105, maleTargetWeeklyGain: 150 },
  { ageWeek: 10, phase: 'Rearing', femaleStandardGrams: 1230, maleStandardGrams: 1550, femaleToleranceMin: 1168, femaleToleranceMax: 1292, maleToleranceMin: 1472, maleToleranceMax: 1628, femaleTargetWeeklyGain: 110, maleTargetWeeklyGain: 150 },
  { ageWeek: 11, phase: 'Rearing', femaleStandardGrams: 1340, maleStandardGrams: 1700, femaleToleranceMin: 1273, femaleToleranceMax: 1407, maleToleranceMin: 1615, maleToleranceMax: 1785, femaleTargetWeeklyGain: 110, maleTargetWeeklyGain: 150 },
  { ageWeek: 12, phase: 'Rearing', femaleStandardGrams: 1450, maleStandardGrams: 1850, femaleToleranceMin: 1378, femaleToleranceMax: 1522, maleToleranceMin: 1758, maleToleranceMax: 1942, femaleTargetWeeklyGain: 105, maleTargetWeeklyGain: 150 },
  { ageWeek: 13, phase: 'Rearing', femaleStandardGrams: 1555, maleStandardGrams: 2000, femaleToleranceMin: 1477, femaleToleranceMax: 1633, maleToleranceMin: 1900, maleToleranceMax: 2100, femaleTargetWeeklyGain: 105, maleTargetWeeklyGain: 150 },
  { ageWeek: 14, phase: 'Rearing', femaleStandardGrams: 1660, maleStandardGrams: 2150, femaleToleranceMin: 1577, femaleToleranceMax: 1743, maleToleranceMin: 2042, maleToleranceMax: 2258, femaleTargetWeeklyGain: 110, maleTargetWeeklyGain: 150 },
  { ageWeek: 15, phase: 'Rearing', femaleStandardGrams: 1770, maleStandardGrams: 2300, femaleToleranceMin: 1681, femaleToleranceMax: 1859, maleToleranceMin: 2185, maleToleranceMax: 2415, femaleTargetWeeklyGain: 110, maleTargetWeeklyGain: 150 },
  { ageWeek: 16, phase: 'Rearing', femaleStandardGrams: 1880, maleStandardGrams: 2450, femaleToleranceMin: 1786, femaleToleranceMax: 1974, maleToleranceMin: 2328, maleToleranceMax: 2572, femaleTargetWeeklyGain: 100, maleTargetWeeklyGain: 150 },
  { ageWeek: 17, phase: 'Rearing', femaleStandardGrams: 1980, maleStandardGrams: 2600, femaleToleranceMin: 1881, femaleToleranceMax: 2079, maleToleranceMin: 2470, maleToleranceMax: 2730, femaleTargetWeeklyGain: 100, maleTargetWeeklyGain: 150 },
  { ageWeek: 18, phase: 'Rearing', femaleStandardGrams: 2080, maleStandardGrams: 2750, femaleToleranceMin: 1976, femaleToleranceMax: 2184, maleToleranceMin: 2612, maleToleranceMax: 2888, femaleTargetWeeklyGain: 100, maleTargetWeeklyGain: 150 },
  { ageWeek: 19, phase: 'Pre-Lay Transition', femaleStandardGrams: 2180, maleStandardGrams: 2900, femaleToleranceMin: 2071, femaleToleranceMax: 2289, maleToleranceMin: 2755, maleToleranceMax: 3045, femaleTargetWeeklyGain: 100, maleTargetWeeklyGain: 150 },
  { ageWeek: 20, phase: 'Pre-Lay Transition', femaleStandardGrams: 2280, maleStandardGrams: 3050, femaleToleranceMin: 2166, femaleToleranceMax: 2394, maleToleranceMin: 2898, maleToleranceMax: 3202, femaleTargetWeeklyGain: 110, maleTargetWeeklyGain: 140 },
  { ageWeek: 21, phase: 'Pre-Lay Transition', femaleStandardGrams: 2390, maleStandardGrams: 3190, femaleToleranceMin: 2270, femaleToleranceMax: 2510, maleToleranceMin: 3030, maleToleranceMax: 3350, femaleTargetWeeklyGain: 120, maleTargetWeeklyGain: 140 },
  { ageWeek: 22, phase: 'Pre-Lay Transition', femaleStandardGrams: 2510, maleStandardGrams: 3330, femaleToleranceMin: 2384, femaleToleranceMax: 2636, maleToleranceMin: 3164, maleToleranceMax: 3496, femaleTargetWeeklyGain: 120, maleTargetWeeklyGain: 140 },
  { ageWeek: 23, phase: 'Pre-Lay Transition', femaleStandardGrams: 2630, maleStandardGrams: 3470, femaleToleranceMin: 2498, femaleToleranceMax: 2762, maleToleranceMin: 3296, maleToleranceMax: 3644, femaleTargetWeeklyGain: 120, maleTargetWeeklyGain: 130 },
  { ageWeek: 24, phase: 'Pre-Lay Transition', femaleStandardGrams: 2750, maleStandardGrams: 3600, femaleToleranceMin: 2612, femaleToleranceMax: 2888, maleToleranceMin: 3420, maleToleranceMax: 3780, femaleTargetWeeklyGain: 130, maleTargetWeeklyGain: 120 },
  { ageWeek: 25, phase: 'Peak Production', femaleStandardGrams: 2880, maleStandardGrams: 3720, femaleToleranceMin: 2736, femaleToleranceMax: 3024, maleToleranceMin: 3534, maleToleranceMax: 3906, femaleTargetWeeklyGain: 130, maleTargetWeeklyGain: 120 },
  { ageWeek: 26, phase: 'Peak Production', femaleStandardGrams: 3010, maleStandardGrams: 3840, femaleToleranceMin: 2860, femaleToleranceMax: 3160, maleToleranceMin: 3648, maleToleranceMax: 4032, femaleTargetWeeklyGain: 120, maleTargetWeeklyGain: 110 },
  { ageWeek: 27, phase: 'Peak Production', femaleStandardGrams: 3130, maleStandardGrams: 3950, femaleToleranceMin: 2974, femaleToleranceMax: 3286, maleToleranceMin: 3752, maleToleranceMax: 4148, femaleTargetWeeklyGain: 120, maleTargetWeeklyGain: 100 },
  { ageWeek: 28, phase: 'Peak Production', femaleStandardGrams: 3250, maleStandardGrams: 4050, femaleToleranceMin: 3088, femaleToleranceMax: 3412, maleToleranceMin: 3848, maleToleranceMax: 4252, femaleTargetWeeklyGain: 70, maleTargetWeeklyGain: 70 },
  { ageWeek: 29, phase: 'Peak Production', femaleStandardGrams: 3320, maleStandardGrams: 4120, femaleToleranceMin: 3154, femaleToleranceMax: 3486, maleToleranceMin: 3914, maleToleranceMax: 4326, femaleTargetWeeklyGain: 60, maleTargetWeeklyGain: 60 },
  { ageWeek: 30, phase: 'Peak Production', femaleStandardGrams: 3380, maleStandardGrams: 4180, femaleToleranceMin: 3211, femaleToleranceMax: 3549, maleToleranceMin: 3971, maleToleranceMax: 4389, femaleTargetWeeklyGain: 60, maleTargetWeeklyGain: 60 },
  { ageWeek: 31, phase: 'Peak Production', femaleStandardGrams: 3440, maleStandardGrams: 4240, femaleToleranceMin: 3268, femaleToleranceMax: 3612, maleToleranceMin: 4028, maleToleranceMax: 4452, femaleTargetWeeklyGain: 60, maleTargetWeeklyGain: 60 },
  { ageWeek: 32, phase: 'Peak Production', femaleStandardGrams: 3500, maleStandardGrams: 4300, femaleToleranceMin: 3325, femaleToleranceMax: 3675, maleToleranceMin: 4085, maleToleranceMax: 4515, femaleTargetWeeklyGain: 40, maleTargetWeeklyGain: 50 },
  { ageWeek: 33, phase: 'Peak Production', femaleStandardGrams: 3540, maleStandardGrams: 4350, femaleToleranceMin: 3363, femaleToleranceMax: 3717, maleToleranceMin: 4132, maleToleranceMax: 4568, femaleTargetWeeklyGain: 40, maleTargetWeeklyGain: 40 },
  { ageWeek: 34, phase: 'Peak Production', femaleStandardGrams: 3580, maleStandardGrams: 4390, femaleToleranceMin: 3401, femaleToleranceMax: 3759, maleToleranceMin: 4170, maleToleranceMax: 4610, femaleTargetWeeklyGain: 30, maleTargetWeeklyGain: 40 },
  { ageWeek: 35, phase: 'Peak Production', femaleStandardGrams: 3610, maleStandardGrams: 4430, femaleToleranceMin: 3430, femaleToleranceMax: 3790, maleToleranceMin: 4208, maleToleranceMax: 4652, femaleTargetWeeklyGain: 30, maleTargetWeeklyGain: 40 },
  { ageWeek: 36, phase: 'Peak Production', femaleStandardGrams: 3640, maleStandardGrams: 4470, femaleToleranceMin: 3458, femaleToleranceMax: 3822, maleToleranceMin: 4246, maleToleranceMax: 4694, femaleTargetWeeklyGain: 30, maleTargetWeeklyGain: 30 },
  { ageWeek: 37, phase: 'Peak Production', femaleStandardGrams: 3670, maleStandardGrams: 4500, femaleToleranceMin: 3486, femaleToleranceMax: 3854, maleToleranceMin: 4275, maleToleranceMax: 4725, femaleTargetWeeklyGain: 30, maleTargetWeeklyGain: 20 },
  { ageWeek: 38, phase: 'Peak Production', femaleStandardGrams: 3700, maleStandardGrams: 4520, femaleToleranceMin: 3515, femaleToleranceMax: 3885, maleToleranceMin: 4294, maleToleranceMax: 4746, femaleTargetWeeklyGain: 30, maleTargetWeeklyGain: 20 },
  { ageWeek: 39, phase: 'Peak Production', femaleStandardGrams: 3730, maleStandardGrams: 4540, femaleToleranceMin: 3544, femaleToleranceMax: 3916, maleToleranceMin: 4313, maleToleranceMax: 4767, femaleTargetWeeklyGain: 20, maleTargetWeeklyGain: 10 },
  { ageWeek: 40, phase: 'Peak Production', femaleStandardGrams: 3750, maleStandardGrams: 4550, femaleToleranceMin: 3562, femaleToleranceMax: 3938, maleToleranceMin: 4322, maleToleranceMax: 4778, femaleTargetWeeklyGain: 20, maleTargetWeeklyGain: 20 },
  { ageWeek: 42, phase: 'Post-Peak', femaleStandardGrams: 3790, maleStandardGrams: 4590, femaleToleranceMin: 3600, femaleToleranceMax: 3980, maleToleranceMin: 4360, maleToleranceMax: 4820, femaleTargetWeeklyGain: 20, maleTargetWeeklyGain: 20 },
  { ageWeek: 44, phase: 'Post-Peak', femaleStandardGrams: 3830, maleStandardGrams: 4630, femaleToleranceMin: 3638, femaleToleranceMax: 4022, maleToleranceMin: 4398, maleToleranceMax: 4862, femaleTargetWeeklyGain: 20, maleTargetWeeklyGain: 20 },
  { ageWeek: 46, phase: 'Post-Peak', femaleStandardGrams: 3870, maleStandardGrams: 4670, femaleToleranceMin: 3676, femaleToleranceMax: 4064, maleToleranceMin: 4436, maleToleranceMax: 4904, femaleTargetWeeklyGain: 20, maleTargetWeeklyGain: 20 },
  { ageWeek: 48, phase: 'Post-Peak', femaleStandardGrams: 3910, maleStandardGrams: 4710, femaleToleranceMin: 3714, femaleToleranceMax: 4106, maleToleranceMin: 4474, maleToleranceMax: 4946, femaleTargetWeeklyGain: 20, maleTargetWeeklyGain: 20 },
  { ageWeek: 50, phase: 'Post-Peak', femaleStandardGrams: 3950, maleStandardGrams: 4750, femaleToleranceMin: 3752, femaleToleranceMax: 4148, maleToleranceMin: 4512, maleToleranceMax: 4988, femaleTargetWeeklyGain: 15, maleTargetWeeklyGain: 15 },
  { ageWeek: 52, phase: 'Post-Peak', femaleStandardGrams: 3980, maleStandardGrams: 4780, femaleToleranceMin: 3781, femaleToleranceMax: 4179, maleToleranceMin: 4541, maleToleranceMax: 5019, femaleTargetWeeklyGain: 15, maleTargetWeeklyGain: 15 },
  { ageWeek: 54, phase: 'Post-Peak', femaleStandardGrams: 4010, maleStandardGrams: 4810, femaleToleranceMin: 3810, femaleToleranceMax: 4210, maleToleranceMin: 4570, maleToleranceMax: 5050, femaleTargetWeeklyGain: 15, maleTargetWeeklyGain: 15 },
  { ageWeek: 56, phase: 'Post-Peak', femaleStandardGrams: 4040, maleStandardGrams: 4840, femaleToleranceMin: 3838, femaleToleranceMax: 4242, maleToleranceMin: 4598, maleToleranceMax: 5082, femaleTargetWeeklyGain: 15, maleTargetWeeklyGain: 15 },
  { ageWeek: 58, phase: 'Post-Peak', femaleStandardGrams: 4070, maleStandardGrams: 4870, femaleToleranceMin: 3866, femaleToleranceMax: 4274, maleToleranceMin: 4626, maleToleranceMax: 5114, femaleTargetWeeklyGain: 15, maleTargetWeeklyGain: 15 },
  { ageWeek: 60, phase: 'Post-Peak', femaleStandardGrams: 4100, maleStandardGrams: 4900, femaleToleranceMin: 3895, femaleToleranceMax: 4305, maleToleranceMin: 4655, maleToleranceMax: 5145, femaleTargetWeeklyGain: 12, maleTargetWeeklyGain: 12 },
  { ageWeek: 62, phase: 'Post-Peak', femaleStandardGrams: 4125, maleStandardGrams: 4930, femaleToleranceMin: 3918, femaleToleranceMax: 4332, maleToleranceMin: 4683, maleToleranceMax: 5177, femaleTargetWeeklyGain: 12, maleTargetWeeklyGain: 12 },
  { ageWeek: 64, phase: 'Post-Peak', femaleStandardGrams: 4150, maleStandardGrams: 4960, femaleToleranceMin: 3942, femaleToleranceMax: 4358, maleToleranceMin: 4712, maleToleranceMax: 5208, femaleTargetWeeklyGain: 10, maleTargetWeeklyGain: 10 },
  { ageWeek: 65, phase: 'Post-Peak', femaleStandardGrams: 4160, maleStandardGrams: 4975, femaleToleranceMin: 3952, femaleToleranceMax: 4368, maleToleranceMin: 4726, maleToleranceMax: 5224, femaleTargetWeeklyGain: 10, maleTargetWeeklyGain: 10 }
];

export interface DeviationResult {
  diffGrams: number;
  pctDiff: number;
  status: 'optimal' | 'mild_divergence' | 'critical_divergence';
  statusLabel: string;
  direction: 'on_target' | 'overweight' | 'underweight';
  colorHex: string;
  badgeClass: string;
}

export function calculateDeviation(actualGrams: number, standardGrams: number): DeviationResult {
  if (!standardGrams || standardGrams <= 0) {
    return {
      diffGrams: 0,
      pctDiff: 0,
      status: 'optimal',
      statusLabel: 'Normal',
      direction: 'on_target',
      colorHex: '#10b981',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }

  const diffGrams = Math.round(actualGrams - standardGrams);
  const pctDiff = Number(((diffGrams / standardGrams) * 100).toFixed(1));
  const absPct = Math.abs(pctDiff);

  let status: 'optimal' | 'mild_divergence' | 'critical_divergence' = 'optimal';
  let statusLabel = 'On Target (±2.5%)';
  let colorHex = '#10b981'; // green
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (absPct > 5.0) {
    status = 'critical_divergence';
    statusLabel = pctDiff > 0 ? 'Critically Overweight (>+5%)' : 'Critically Underweight (<-5%)';
    colorHex = '#ef4444'; // red
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (absPct > 2.5) {
    status = 'mild_divergence';
    statusLabel = pctDiff > 0 ? 'Slightly Heavy (+2.5 to +5%)' : 'Slightly Light (-2.5 to -5%)';
    colorHex = '#f59e0b'; // amber
    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  const direction = absPct <= 1.0 ? 'on_target' : pctDiff > 0 ? 'overweight' : 'underweight';

  return {
    diffGrams,
    pctDiff,
    status,
    statusLabel,
    direction,
    colorHex,
    badgeClass
  };
}

export interface GrowthTrajectoryAssessment {
  currentWeek: number;
  femaleActual: number;
  femaleStandard: number;
  femaleDeviation: DeviationResult;
  maleActual: number;
  maleStandard: number;
  maleDeviation: DeviationResult;
  uniformityPct: number;
  uniformityStatus: 'optimal' | 'acceptable' | 'poor';
  maleToFemaleRatio: number;
  ratioStatus: 'optimal' | 'male_heavy' | 'male_light';
  riskAlerts: string[];
  recommendations: string[];
}

export function analyzeGrowthTrajectory(
  latestRecord: BodyWeightRecord | undefined,
  previousRecord: BodyWeightRecord | undefined,
  customStandards: StandardBodyWeightItem[]
): GrowthTrajectoryAssessment | null {
  if (!latestRecord) return null;

  // Find standard for current week
  const customStd = customStandards?.find(s => s.ageWeek === latestRecord.week);
  const baseStd = BASE_WEEKLY_STANDARDS.find(s => s.ageWeek === latestRecord.week);

  const femaleStandard = customStd?.femaleStandardGrams || baseStd?.femaleStandardGrams || 3500;
  const maleStandard = customStd?.maleStandardGrams || baseStd?.maleStandardGrams || 4300;

  const femaleDeviation = calculateDeviation(latestRecord.femaleAvgWeightGrams, femaleStandard);
  const maleDeviation = calculateDeviation(latestRecord.maleAvgWeightGrams, maleStandard);

  const uniformity = latestRecord.uniformityPct || 85;
  let uniformityStatus: 'optimal' | 'acceptable' | 'poor' = 'optimal';
  if (uniformity < 80) uniformityStatus = 'poor';
  else if (uniformity < 85) uniformityStatus = 'acceptable';

  const maleToFemaleRatio = latestRecord.femaleAvgWeightGrams > 0
    ? Number((latestRecord.maleAvgWeightGrams / latestRecord.femaleAvgWeightGrams).toFixed(2))
    : 1.23;

  let ratioStatus: 'optimal' | 'male_heavy' | 'male_light' = 'optimal';
  if (maleToFemaleRatio > 1.28) ratioStatus = 'male_heavy';
  else if (maleToFemaleRatio < 1.18) ratioStatus = 'male_light';

  const riskAlerts: string[] = [];
  const recommendations: string[] = [];

  // Evaluate female developmental risk
  if (femaleDeviation.status === 'critical_divergence') {
    if (femaleDeviation.direction === 'overweight') {
      riskAlerts.push(`Females are +${femaleDeviation.pctDiff}% above target curve. Overweight hens face higher prolapse incidence, reduced shell quality, and early post-peak drop.`);
      recommendations.push('Cap daily feed allocation and avoid further feed increments until weight aligns with target standard curve.');
    } else {
      riskAlerts.push(`Females are ${femaleDeviation.pctDiff}% below target curve. Underweight hens risk delayed onset of lay, smaller initial egg size, and poor peak persistence.`);
      recommendations.push('Increase daily energy and protein intake by +2 to +4g/bird. Check water flow rate and feeder run speed.');
    }
  } else if (femaleDeviation.status === 'mild_divergence') {
    if (femaleDeviation.direction === 'overweight') {
      recommendations.push('Hold current feed level steady for 7 days to gently stabilize female growth velocity.');
    } else {
      recommendations.push('Provide a +2g/bird feed bump on next scheduled allocation to bring females back on curve.');
    }
  }

  // Evaluate male developmental & mating synchrony risk
  if (maleDeviation.status === 'critical_divergence') {
    if (maleDeviation.direction === 'overweight') {
      riskAlerts.push(`Males are +${maleDeviation.pctDiff}% above target. Heavy cockerels suffer leg issues, clumsy mating behavior, and rapid fertility decline.`);
      recommendations.push('Inspect male feeder exclusion grills in female track/pan lines to ensure males cannot steal hen feed. Reduce male feed ration.');
    } else {
      riskAlerts.push(`Males are ${maleDeviation.pctDiff}% below target. Underdeveloped males lack libido and become socially subordinate.`);
      recommendations.push('Ensure male feed line distribution completes under 3 minutes so all males eat simultaneously.');
    }
  }

  // Uniformity alerts
  if (uniformityStatus === 'poor') {
    riskAlerts.push(`Flock uniformity is low (${uniformity}% vs ≥85% target). High CV causes uneven sexual maturity and erratic feeding.`);
    recommendations.push('Perform 2-way or 3-way flock weight grading. Segregate light birds to dedicated pens with +10% feed boost.');
  }

  // Male-to-Female synchrony
  if (ratioStatus === 'male_heavy') {
    riskAlerts.push(`Male-to-Female ratio is high (${maleToFemaleRatio}x vs ideal 1.20-1.25x). Males may intimidate females and damage back feathers.`);
    recommendations.push('Adjust male-only feed allocation immediately; verify exclusion grill width is strictly 43-45mm.');
  } else if (ratioStatus === 'male_light') {
    riskAlerts.push(`Male-to-Female ratio is low (${maleToFemaleRatio}x). Males may be outcompeted or undernourished.`);
    recommendations.push('Check male feeder height to ensure females cannot access male feeders, and increase male BMCC/BMCR ration.');
  }

  if (riskAlerts.length === 0) {
    recommendations.push('Flock growth curve is tracking within optimal tolerance limits. Maintain current feed management and environmental ventilation program.');
  }

  return {
    currentWeek: latestRecord.week,
    femaleActual: latestRecord.femaleAvgWeightGrams,
    femaleStandard,
    femaleDeviation,
    maleActual: latestRecord.maleAvgWeightGrams,
    maleStandard,
    maleDeviation,
    uniformityPct: uniformity,
    uniformityStatus,
    maleToFemaleRatio,
    ratioStatus,
    riskAlerts,
    recommendations
  };
}
