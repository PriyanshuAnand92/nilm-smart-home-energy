export type Language = 'en' | 'hi';

export interface Translations {
  appTitle: string;
  demoMode: string;
  dashboard: string;
  appliances: string;
  analytics: string;
  costsAndBudget: string;
  modelLab: string;
  settingsAndUpload: string;
  energyToday: string;
  estimatedCost: string;
  peakPower: string;
  budgetProgress: string;
  forecastTitle: string;
  forecastDesc: string;
  historicalComparison: string;
  vsLastWeek: string;
  vsLastMonth: string;
  pastMonthUsage: string;
  applianceBreakdown: string;
  roomProfiles: string;
  kitchen: string;
  utilityRoom: string;
  livingRoom: string;
  unusualAlert: string;
  savingSuggestions: string;
  exportReport: string;
  exportPdf: string;
  exportCsv: string;
  measured: string;
  calculated: string;
  estimate: string;
  sampleData: string;
  disclaimerText: string;
  whatIfTitle: string;
  carbonFootprint: string;
  standbyBaseline: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appTitle: 'VoltDisagg NILM',
    demoMode: 'Start Demo Mode',
    dashboard: 'Dashboard',
    appliances: 'Appliances',
    analytics: 'Analytics',
    costsAndBudget: 'Costs & Budget',
    modelLab: 'Model Lab',
    settingsAndUpload: 'Settings & Upload',
    energyToday: 'Energy Today',
    estimatedCost: 'Estimated Cost',
    peakPower: 'Peak Aggregate Power',
    budgetProgress: 'Budget Progress',
    forecastTitle: '4–6 Hour Energy Forecast',
    forecastDesc: 'Short-term projection based on diurnal historical patterns and active cycle states',
    historicalComparison: 'Historical Comparison',
    vsLastWeek: 'vs. Previous Week',
    vsLastMonth: 'vs. Previous Month',
    pastMonthUsage: 'Past Month Energy Usage',
    applianceBreakdown: 'Appliance Breakdown (NILM Disaggregation)',
    roomProfiles: 'Room / Zone Grouping',
    kitchen: 'Kitchen Zone',
    utilityRoom: 'Utility Room',
    livingRoom: 'Living Room',
    unusualAlert: 'Unusual Consumption Alert',
    savingSuggestions: 'Practical Energy-Saving Recommendations',
    exportReport: 'Export Report',
    exportPdf: 'Download PDF / Print',
    exportCsv: 'Download CSV Summary',
    measured: 'Measured',
    calculated: 'Calculated',
    estimate: '≈ Est.',
    sampleData: 'Sample data',
    disclaimerText: 'Recorded data. All appliance values are model estimates derived from aggregate load, not billing measurements.',
    whatIfTitle: 'What-If Savings Calculator',
    carbonFootprint: 'Grid Carbon Emissions Impact',
    standbyBaseline: 'Standby Baseline Load',
  },
  hi: {
    appTitle: 'वोल्ट-डिसेग (NILM)',
    demoMode: 'डेमो मोड शुरू करें',
    dashboard: 'डैशबोर्ड',
    appliances: 'उपकरण (Appliances)',
    analytics: 'एनालिटिक्स',
    costsAndBudget: 'लागत और बजट',
    modelLab: 'मॉडल लैब',
    settingsAndUpload: 'सेटिंग्स और अपलोड',
    energyToday: 'आज की बिजली खपत',
    estimatedCost: 'अनुमानित बिल लागत',
    peakPower: 'अधिकतम लोड (Peak)',
    budgetProgress: 'मासिक बजट स्थिति',
    forecastTitle: '4–6 घंटे का ऊर्जा पूर्वानुमान (Forecast)',
    forecastDesc: 'हाल के उपयोग और दैनिक पैटर्न के आधार पर आगामी 4-6 घंटों का सटीक अनुमान',
    historicalComparison: 'ऐतिहासिक तुलना (Comparison)',
    vsLastWeek: 'पिछले सप्ताह की तुलना में',
    vsLastMonth: 'पिछले महीने की तुलना में',
    pastMonthUsage: 'पिछले महीने की कुल खपत',
    applianceBreakdown: 'उपकरण-वार खपत (NILM AI Disaggregation)',
    roomProfiles: 'कमरे / ज़ोन के अनुसार वर्गीकरण',
    kitchen: 'रसोईघर (Kitchen)',
    utilityRoom: 'यूटिलिटी रूम (लॉन्ड्री)',
    livingRoom: 'लिविंग रूम',
    unusualAlert: 'असामान्य खपत चेतावनी',
    savingSuggestions: 'व्यावहारिक बिजली बचत सुझाव',
    exportReport: 'रिपोर्ट डाउनलोड करें',
    exportPdf: 'PDF / प्रिंट डाउनलोड',
    exportCsv: 'CSV डेटा डाउनलोड',
    measured: 'मापा गया (Measured)',
    calculated: 'गणना की गई',
    estimate: '≈ अनुमानित (Est.)',
    sampleData: 'नमूना डेटा',
    disclaimerText: 'रिकॉर्डेड डेटा: उपकरण मान केवल मॉडल अनुमान हैं, सीधे मीटर रीडिंग नहीं।',
    whatIfTitle: 'बचत कैलकुलेटर (What-If)',
    carbonFootprint: 'कार्बन उत्सर्जन प्रभाव (CO₂e)',
    standbyBaseline: 'स्टैंडबाय बेसलाइन लोड',
  },
};
