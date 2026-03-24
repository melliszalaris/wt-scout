import { useState, useRef, useMemo } from "react";

const CATEGORIES = [
  "Earnings - Base Pay",
  "Earnings - Allowance",
  "Earnings - Overtime",
  "Earnings - Penalty / Shift Loading",
  "Earnings - Bonus / Incentive",
  "Earnings - Commission",
  "Earnings - Leave Loading",
  "Earnings - Termination / ETP",
  "Earnings - Back Pay",
  "Earnings - Directors Fees",
  "Earnings - Other",
  "Deductions - Pre-Tax",
  "Deductions - Post-Tax",
  "Deductions - Salary Sacrifice",
  "Deductions - Union / Association Fees",
  "Deductions - Child Support",
  "Deductions - HELP / HECS",
  "Deductions - Other",
  "Leave - Annual Leave",
  "Leave - Personal / Carer's Leave",
  "Leave - Long Service Leave",
  "Leave - Parental Leave",
  "Leave - Community Service Leave",
  "Leave - Other Leave",
  "Superannuation - SG Contribution",
  "Superannuation - Salary Sacrifice",
  "Superannuation - Additional Voluntary",
  "Superannuation - Defined Benefit",
  "Employer Cost - Payroll Tax",
  "Employer Cost - Workers Compensation",
  "Employer Cost - Other",
  "Informational / Memo Only",
];

const AMOUNT_TYPES = [
  "Fixed Amount per Pay Period", "Hourly Rate × Hours", "Daily Rate × Days",
  "Annual Amount (prorated)", "Percentage of Base Pay", "Percentage of OTE",
  "Units × Rate", "Lump Sum / One-Off", "System Calculated", "Other (describe in notes)",
];
const FREQUENCIES = [
  "Every Pay Run", "Monthly", "Quarterly", "Annually",
  "Ad Hoc / On Demand", "On Termination Only", "Seasonal / Periodic",
];
const TAX_TREATMENTS = [
  "Subject to PAYG Withholding", "PAYG Exempt", "Exempt Foreign Employment Income",
  "ETP - Life Benefit", "ETP - Death Benefit", "Reportable Fringe Benefit",
  "Salary Sacrifice (Pre-Tax)", "Not Applicable",
];
const STP2_INCOME_TYPES = [
  "Salary and Wages", "Closely Held Payees", "Working Holiday Maker",
  "Foreign Employment", "Voluntary Agreement", "Labour Hire", "Not Applicable",
];
const STP2_PAYMENT_TYPES = [
  "Not Applicable", "Bonuses and Commissions", "Directors Fees", "Paid Leave", "Overtime",
  "Allowances - Car / Transport", "Allowances - Meals", "Allowances - Travel", "Allowances - Laundry",
  "Allowances - Tools / Equipment", "Allowances - Qualifications", "Allowances - Tasks", "Allowances - Other",
  "Lump Sum A", "Lump Sum B", "Lump Sum D", "Lump Sum E", "Return to Work", "Workers Compensation", "ETP",
  "Salary Sacrifice - Super", "Salary Sacrifice - Other", "Deduction - Fees", "Deduction - Workplace Giving",
  "Deduction - Union / Professional Assoc", "Deduction - Child Support (garnishee)",
  "Deduction - Child Support (deduction)", "Super - Employer SG", "Super - Salary Sacrifice", "Super - RESC",
];
const OTE_OPTIONS = ["OTE - Included", "OTE - Excluded", "Partially OTE (see notes)", "Not Applicable"];
const STATES = ["National","NSW","VIC","QLD","WA","SA","TAS","ACT","NT"];
const PRIORITIES = ["Must Have", "Should Have", "Nice to Have"];

// ─── SAP Processing Class Options ───────────────────────────────────────
const PRCL01_OPTIONS = [
  { value:"-",  label:"Not applicable",                              exportLabel:"PRCL01: N/A" },
  { value:"0",  label:"Not included in pay rate calculation",        exportLabel:"PRCL01=0 | Not incorporated in basis of valuation" },
  { value:"3",  label:"Included in pay rate calculation (standard)", exportLabel:"PRCL01=3 | Incorporated in basis /001 and /002" },
  { value:"1",  label:"Included in pay rate — /001 only",            exportLabel:"PRCL01=1 | Not incorporated in basis /001 only" },
  { value:"5",  label:"Hourly rate division of valuation bases",     exportLabel:"PRCL01=5 | Division of valuation bases for hourly rate" },
  { value:"8",  label:"Creates hourly rate /001 & /002",             exportLabel:"PRCL01=8 | Hourly rate to create /001 & /002" },
  { value:"A",  label:"Division of valuation bases — /003",          exportLabel:"PRCL01=A | Division of valuation bases for hourly rate /003" },
];

const PRCL20_OPTIONS = [
  { value:"-",  label:"Not applicable",                                      exportLabel:"PRCL20: N/A" },
  { value:"1",  label:"Stored as-is (no gross rollup)",                      exportLabel:"PRCL20=1 | RT storage unchanged" },
  { value:"3",  label:"Added to gross pay totals",                           exportLabel:"PRCL20=3 | RT storage and cumulation" },
  { value:"7",  label:"Summarised reference only",                           exportLabel:"PRCL20=7 | Summarised references" },
  { value:"8",  label:"Stored and added to deduction cumulations",           exportLabel:"PRCL20=8 | Unchanged references and cumulation" },
  { value:"9",  label:"Summarised storage with cumulation",                  exportLabel:"PRCL20=9 | Summarised RT storage and cumulation" },
  { value:"2",  label:"Eliminated after gross part",                         exportLabel:"PRCL20=2 | Eliminating wage types" },
  { value:"4",  label:"Stored without split indicators",                     exportLabel:"PRCL20=4 | RT storage without splits" },
  { value:"5",  label:"Stored with payroll type and A-split",                exportLabel:"PRCL20=5 | RT storage with payroll type and A-split" },
];

const PRCL21_OPTIONS = [
  { value:"-",  label:"No tax processing (unpaid leave, informational WTs)", exportLabel:"PRCL21: Not applicable — no tax processing" },
  { value:"0",  label:"Standard PAYG withholding",                           exportLabel:"PRCL21=0 | Standard taxation (1st envelope)" },
  { value:"S",  label:"Salary sacrifice — reduces taxable income before tax", exportLabel:"PRCL21=S | Salary sacrifice wage type (reduce taxable gross)" },
  { value:"L",  label:"Leave loading — standard tax rate",                   exportLabel:"PRCL21=L | Leave loading 1st envelope" },
  { value:"4",  label:"Leave loading — marginal tax rate",                   exportLabel:"PRCL21=4 | Marginal leave loading (1st envelope)" },
  { value:"6",  label:"Bonus or commission — marginal tax rate",             exportLabel:"PRCL21=6 | Marginal taxation bonuses and commissions (1st envelope)" },
  { value:"A",  label:"Termination — Lump Sum A",                            exportLabel:"PRCL21=A | Taxation calculated for Lump Sum A payments" },
  { value:"B",  label:"Termination — Lump Sum B (LSL post-1978)",            exportLabel:"PRCL21=B | Taxation calculated for Lump Sum B payments" },
  { value:"D",  label:"Termination — Lump Sum D (genuine redundancy, tax free)", exportLabel:"PRCL21=D | Lump Sum D payments — no tax" },
  { value:"E",  label:"Termination — Lump Sum C invalidity component",       exportLabel:"PRCL21=E | Taxation for Lump Sum C payments (percentage 2)" },
  { value:"F",  label:"Termination — leave at marginal tax rate",            exportLabel:"PRCL21=F | Marginal termination taxation" },
  { value:"G",  label:"Termination — Lump Sum A (pre-1978 LSL, tax free)",   exportLabel:"PRCL21=G | Lump Sum A payments — no tax" },
  { value:"H",  label:"Termination — Lump Sum C (tax free component)",       exportLabel:"PRCL21=H | Lump Sum C payments — no tax" },
  { value:"X",  label:"Additional tax withholding (employee ATO request)",   exportLabel:"PRCL21=X | Additional taxation" },
  { value:"Y",  label:"Termination — Lump Sum E (back pay for earlier years)", exportLabel:"PRCL21=Y | Lump Sum E" },
  { value:"J",  label:"Leave loading — Lump Sum calculation",                exportLabel:"PRCL21=J | Leave loading Lump Sum" },
  { value:"P",  label:"Leave loading — Lump Sum A",                          exportLabel:"PRCL21=P | Leave loading Lump Sum A" },
  { value:"R",  label:"Return to work payment",                              exportLabel:"PRCL21=R | Return to Work Payments" },
];

const PRCL32_OPTIONS = [
  { value:"-",  label:"Not applicable",                                               exportLabel:"PRCL32: N/A" },
  { value:"0",  label:"Not posted to Finance",                                        exportLabel:"PRCL32=0 | Wage type not posted" },
  { value:"1",  label:"Posted to Finance (employee pay account)",                     exportLabel:"PRCL32=1 | Financial accounting posting (+/- in S/H)" },
  { value:"2",  label:"Posted to Finance (reversed debit/credit)",                    exportLabel:"PRCL32=2 | Financial accounting posting (+/- in H/S)" },
  { value:"A",  label:"Posted to Finance as employer cost (e.g. payroll tax, WC)",    exportLabel:"PRCL32=A | Cost type posting (+/- in S/H)" },
  { value:"B",  label:"Posted to Finance as employer cost (reversed)",                exportLabel:"PRCL32=B | Cost type posting (+/- in H/S)" },
];

const prclLookup = (options, value, field) => {
  const opt = options.find(o => o.value === value);
  return opt ? opt[field] : (value || "—");
};

// ─── Cumulation Class Options ────────────────────────────────────────────
const CCLS_OPTIONS = [
  { key: "totalGross", label: "Included in total gross pay", exportLabel: "CCLS → /101 Total gross earnings", tip: "This payment is counted in the employee's total gross pay figure shown on the payslip and in payroll reports." },
  { key: "taxableGross", label: "Included in taxable gross (regular PAYG)", exportLabel: "CCLS → /110 Regular taxable gross", tip: "This payment is counted in the taxable income used to calculate PAYG withholding each pay run." },
  { key: "taxableBonus", label: "Included in taxable gross (bonus / commission — marginal rate)", exportLabel: "CCLS → /111 Irregular/bonus taxable gross", tip: "This payment is taxed at the marginal rate for bonuses and commissions, separately from regular PAYG." },
  { key: "superBase", label: "Counts toward superannuation base (OTE)", exportLabel: "CCLS → /131 Superannuation / OTE base", tip: "This payment is included in the Ordinary Time Earnings base used to calculate the employer SG contribution." },
  { key: "leaveLoadingBase", label: "Counts toward leave loading calculation", exportLabel: "CCLS → /141 Leave loading valuation basis", tip: "This payment is part of the base rate used when calculating annual leave loading (typically 17.5%)." },
  { key: "payrollTax", label: "Subject to payroll tax", exportLabel: "CCLS → /160 Payroll tax calculation base", tip: "This payment is included in the payroll tax liability calculation. State thresholds and exemptions may still apply." },
  { key: "workersComp", label: "Subject to workers compensation levy", exportLabel: "CCLS → /170 Workers compensation base", tip: "This payment is included in the workers compensation premium base reported to the insurer." },
  { key: "helpBase", label: "Counts toward HELP / HECS repayment income", exportLabel: "CCLS → /119 HELP (HECS) repayment income", tip: "This payment contributes to the employee's total income for HELP/HECS compulsory repayment threshold purposes." },
];

// ─── SAP Infotype Options ────────────────────────────────────────────────
const INFOTYPE_OPTIONS = [
  { key: "IT0008", label: "Basic Pay — ongoing pay rate set here", badge: "IT 0008", color: "bg-blue-100 text-blue-800 border-blue-300", exportLabel: "IT0008 — Basic Pay (T512Z: ongoing wage type assignment, pay scale)", tip: "The employee's base salary, hourly rate, or pay scale is configured here." },
  { key: "IT0014", label: "Standing Deductions & Allowances — recurring each pay run", badge: "IT 0014", color: "bg-teal-100 text-teal-800 border-teal-300", exportLabel: "IT0014 — Recurring Payments/Deductions (standing instructions, active every period)", tip: "Used for regular, repeating deductions or allowances that apply every pay run until cancelled." },
  { key: "IT0015", label: "One-Off Payments — entered manually per pay run", badge: "IT 0015", color: "bg-violet-100 text-violet-800 border-violet-300", exportLabel: "IT0015 — Additional Payments (ad hoc, one-off, or termination payments)", tip: "Used for payments that are not recurring — bonuses, termination payouts, back pay adjustments." },
  { key: "IT0267", label: "Off-Cycle Bonus — processed outside normal pay cycle", badge: "IT 0267", color: "bg-orange-100 text-orange-800 border-orange-300", exportLabel: "IT0267 — Additional Off-Cycle Payments (bonus payments run separately from regular payroll)", tip: "Used specifically for bonus payments that need to be processed in a separate, off-cycle payroll run." },
  { key: "IT2010", label: "Time & Attendance Entry — hours or units entered via timesheet", badge: "IT 2010", color: "bg-emerald-100 text-emerald-800 border-emerald-300", exportLabel: "IT2010 — Employee Remuneration Info (time-based wage type entry, hours/units driven)", tip: "Hours or units worked are entered here and SAP calculates the payment amount." },
  { key: "IT2001", label: "Leave Recording — entered as an absence, SAP generates the pay", badge: "IT 2001", color: "bg-amber-100 text-amber-800 border-amber-300", exportLabel: "IT2001 — Absences (leave is recorded here; payroll driver generates the wage type automatically)", tip: "The employee's leave is recorded as an absence. SAP automatically generates the corresponding pay wage type." },
  { key: "SYSTEM", label: "System Generated — created automatically, no manual entry", badge: "System", color: "bg-slate-100 text-slate-600 border-slate-300", exportLabel: "System Generated — wage type created automatically by payroll processing (no direct IT entry)", tip: "This wage type is generated by SAP payroll processing rules, schemas, or termination organiser." },
];

let _id = 1;
const mkId = () => `z-${_id++}`;

const wt = (code, name, cat, desc, amt, freq, tax, stp2i, stp2p, ote, legRef, pri, sts, notes, p01, p20, p21, p32, ccls = "", infotype = "") => ({
  id: mkId(), clientName: name, legacyCode: code, category: cat, description: desc,
  amountType: amt, frequency: freq, taxTreatment: tax, stp2IncomeType: stp2i,
  stp2PaymentType: stp2p, oteClassification: ote, applicableState: "National",
  legislativeRef: legRef, priority: pri, status: sts, notes: notes,
  prcl: { p01, p20, p21, p32 }, sapNote: "",
  ccls: ccls ? ccls.split(",").map(s => s.trim()).filter(Boolean) : [],
  infotype: infotype ? infotype.split(",").map(s => s.trim()).filter(Boolean) : [],
});

const PRELOADED = [
  // BASE PAY
  wt("1001","Annual Salary","Earnings - Base Pay","Annual salary for salaried employees — master rate for pay scale derivation.","Annual Amount (prorated)","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Must Have","Confirmed","Drives pay scale valuation basis /001 and /002. Required for correct factoring.","3","3","0","0","totalGross,taxableGross,superBase,leaveLoadingBase,payrollTax,workersComp,helpBase", "SYSTEM"),
  wt("1101","Basic Salary","Earnings - Base Pay","Basic salary component — primary earning wage type for salaried staff.","Annual Amount (prorated)","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Must Have","Confirmed","Included in valuation basis /001+/002. Standard taxation 1st envelope.","3","3","0","0","totalGross,taxableGross,superBase,leaveLoadingBase,payrollTax,workersComp,helpBase", "IT0008"),
  wt("1199","Basic Salary - Average","Earnings - Base Pay","Averaged basic salary for internal calculation purposes.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Must Have","Confirmed","Used for average rate calculations. In valuation basis.","3","3","0","0","totalGross,taxableGross,superBase,leaveLoadingBase,payrollTax,workersComp,helpBase", "IT0008"),
  wt("1401","Hourly Rate","Earnings - Base Pay","Hourly rate input — used as rate driver, not typically paid directly.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Must Have","Confirmed","System rate source. PRCL01=0 (not in basis directly). 1st envelope taxation.","0","3","0","0","totalGross,taxableGross,superBase,leaveLoadingBase,payrollTax,workersComp,helpBase", "IT0008"),
  wt("1402","Casual Loading","Earnings - Base Pay","Casual loading component — typically 25% above ordinary rate.","Percentage of Base Pay","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Must Have","Draft","Verify whether client uses 'all-in' casual rates (Schedule-based) or loading applied on top.","0","3","-","0","totalGross,taxableGross,superBase,leaveLoadingBase,payrollTax,workersComp,helpBase", "IT0008"),
  wt("1500","Higher Duties Rate","Earnings - Base Pay","Temporary higher duties allowance — acting in a higher classification.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Should Have","Confirmed","Standard PAYG. Superable salary treatment — confirm PRCL84 config.","0","3","0","0","totalGross,taxableGross,superBase,leaveLoadingBase,payrollTax,workersComp,helpBase", "SYSTEM"),
  wt("1013","Salary Sacrifice","Deductions - Salary Sacrifice","Pre-tax salary sacrifice deduction — reduces taxable gross.","Fixed Amount per Pay Period","Every Pay Run","Salary Sacrifice (Pre-Tax)","Salary and Wages","Salary Sacrifice - Other","OTE - Excluded","","Must Have","Confirmed","PRCL21=S reduces taxable gross before PAYG calculation. Written employee authorisation required.","0","3","S","0","", "IT0008"),
  wt("2000","Ordinary Pay","Earnings - Base Pay","Ordinary hours pay for wage employees at applicable classification rate.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Must Have","Confirmed","Rate from pay scale. Standard 1st envelope PAYG.","0","3","0","0","totalGross,taxableGross,superBase,leaveLoadingBase,payrollTax,workersComp,helpBase", "IT2010"),

  // OVERTIME
  wt("2110","Overtime @ 1.0","Earnings - Overtime","Overtime at ordinary rate (1.0x).","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Overtime","OTE - Excluded","","Should Have","Draft","Confirm business purpose. Not commonly prescribed as a payable OT rate.","0","3","0","0","totalGross,taxableGross,payrollTax,workersComp,helpBase", "IT2010"),
  wt("2115","Overtime @ 1.5","Earnings - Overtime","Overtime at 150% — first tier overtime rate.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Overtime","OTE - Excluded","","Must Have","Draft","Standard 1st envelope PAYG. Verify rate derivation against applicable award/agreement.","0","3","0","0","totalGross,taxableGross,payrollTax,workersComp,helpBase", "IT2010"),
  wt("2120","Overtime @ 2.0","Earnings - Overtime","Overtime at 200% — second tier overtime rate.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Overtime","OTE - Excluded","","Must Have","Draft","Verify configuration handles both weekday 2nd tier and Sunday ordinary OT scenarios.","0","3","0","0","totalGross,taxableGross,payrollTax,workersComp,helpBase", "IT2010"),
  wt("2125","Overtime @ 2.5","Earnings - Overtime","Overtime at 250% — public holiday overtime.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Overtime","OTE - Excluded","","Must Have","Draft","Maps specifically to public holiday overtime. Verify against applicable instrument.","0","3","0","0","totalGross,taxableGross,payrollTax,workersComp,helpBase", "IT2010"),
  wt("2130","Overtime @ 3.0","Earnings - Overtime","Overtime at 300% — review applicability for client.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Overtime","OTE - Excluded","","Nice to Have","Draft","Not commonly prescribed. Consider removing unless client requirement confirmed.","0","3","0","0","totalGross,taxableGross,payrollTax,workersComp,helpBase", "IT2010"),

  // PENALTIES / SHIFT LOADINGS
  wt("2200","Shift Allowance","Earnings - Penalty / Shift Loading","General shift allowance.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Should Have","Draft","Review applicability — some instruments use time-band penalty rates instead.","0","3","0","0","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2010"),
  wt("2203","15% Shift Allowance","Earnings - Penalty / Shift Loading","Shift loading at 15% of ordinary rate.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Should Have","Draft","Verify trigger conditions and applicable time bands per client instrument.","0","3","0","0","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2010"),
  wt("2237","17.5% Shift Allowance","Earnings - Penalty / Shift Loading","Shift loading at 17.5% of ordinary rate.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Should Have","Draft","Common afternoon shift loading rate. Confirm applicability.","0","3","0","0","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2010"),
  wt("2240","20% Shift Allowance","Earnings - Penalty / Shift Loading","Shift loading at 20% of ordinary rate.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Should Have","Draft","Typical night shift loading rate.","0","3","0","0","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2010"),
  wt("2245","25% Shift Allowance","Earnings - Penalty / Shift Loading","Shift loading at 25% of ordinary rate.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Should Have","Draft","Higher shift loading. Confirm trigger conditions per client instrument.","0","3","0","0","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2010"),
  wt("2405","Public Holiday Paid","Earnings - Penalty / Shift Loading","Public holiday ordinary hours rate — worked public holiday.","Hourly Rate × Hours","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Included","","Must Have","Draft","Verify rate against applicable award/agreement. Typically 225–250% of ordinary rate.","0","3","0","0","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2010"),

  // ALLOWANCES
  wt("2300","On-Call Allowance","Earnings - Allowance","On-call / stand-by allowance for availability outside ordinary hours.","Fixed Amount per Pay Period","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Allowances - Other","OTE - Included","","Should Have","Draft","Verify OTE status and STP2 classification against applicable instrument.","0","3","0","0","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2010"),
  wt("2100","Meal Allowance","Earnings - Allowance","Meal allowance when employee required to work overtime or travel.","Fixed Amount per Pay Period","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Allowances - Meals","OTE - Excluded","","Must Have","Confirmed","TG valuation class (T510 without). Verify current ATO-approved rates.","0","3","0","0","totalGross,taxableGross,payrollTax,helpBase", "IT2010"),
  wt("2401","Car Mileage","Earnings - Allowance","Motor vehicle allowance — per km reimbursement at ATO cents/km rate.","Units × Rate","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Allowances - Car / Transport","OTE - Excluded","","Must Have","Confirmed","","0","3","0","0","totalGross,taxableGross,payrollTax,helpBase", "IT2010"),
  wt("4200","Car Allowance","Earnings - Allowance","Motor vehicle allowance — fixed periodic amount.","Fixed Amount per Pay Period","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Allowances - Car / Transport","OTE - Excluded","","Should Have","Confirmed","","0","3","0","0","totalGross,taxableGross,payrollTax,workersComp,helpBase", "IT0014"),
  wt("4205","First Aid Allowance","Earnings - Allowance","Allowance for holding a current first aid certificate.","Percentage of Base Pay","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Allowances - Tasks","OTE - Included","","Must Have","Confirmed","Verify rate % against applicable award/agreement.","0","3","0","0","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT0014"),
  wt("4210","LAFHA","Earnings - Allowance","Living Away From Home Allowance — tax-exempt component per ATO conditions.","Fixed Amount per Pay Period","Every Pay Run","PAYG Exempt","Salary and Wages","Allowances - Other","OTE - Excluded","ATO","Should Have","Draft","Substantiation requirements apply. Confirm employee meets LAFHA eligibility criteria.","0","3","0","0","totalGross", "IT0014"),
  wt("4215","Housing Allowance","Earnings - Allowance","Housing/accommodation allowance.","Fixed Amount per Pay Period","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Allowances - Other","OTE - Excluded","","Should Have","Draft","Confirm taxable status and OTE treatment per applicable instrument.","0","3","0","0","totalGross,taxableGross,payrollTax,workersComp,helpBase", "IT0014"),
  wt("4220","Telephone Allowance","Earnings - Allowance","Telephone/mobile allowance.","Fixed Amount per Pay Period","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Allowances - Other","OTE - Excluded","","Should Have","Confirmed","PRCL22 ITWV flag — may be subject to variation for allowance threshold.","0","3","0","0","totalGross,taxableGross,payrollTax,helpBase", "IT0014"),
  wt("4225","Uniform Allowance","Earnings - Allowance","Uniform/clothing allowance.","Fixed Amount per Pay Period","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Allowances - Other","OTE - Excluded","","Should Have","Confirmed","","0","3","0","0","totalGross,taxableGross,payrollTax,helpBase", "IT0014"),
  wt("4230","Travel Allowance","Earnings - Allowance","Travelling time and excess fares allowance.","Hourly Rate × Hours","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Allowances - Travel","OTE - Excluded","","Must Have","Confirmed","","0","3","0","0","totalGross,taxableGross,payrollTax,helpBase", "IT0014"),
  wt("4235","Other Allowance (Non-Tax)","Earnings - Allowance","Catch-all non-taxable allowance.","Fixed Amount per Pay Period","Ad Hoc / On Demand","PAYG Exempt","Not Applicable","Allowances - Other","OTE - Excluded","","Should Have","Confirmed","Catch-all for non-taxable allowances. PRCL21 not set — verify ATO exempt status.","0","3","-","0","totalGross", "IT0015"),
  wt("4240","Other Allowance (Tax)","Earnings - Allowance","Catch-all taxable allowance.","Fixed Amount per Pay Period","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Allowances - Other","OTE - Excluded","","Should Have","Confirmed","Catch-all for taxable allowances. Standard 1st envelope PAYG.","0","3","0","0","totalGross,taxableGross,payrollTax,helpBase", "IT0015"),

  // BONUSES / INCENTIVES
  wt("3000","Bonus (Superable)","Earnings - Bonus / Incentive","Discretionary bonus — OTE-inclusive, employer SG applies.","Lump Sum / One-Off","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Bonuses and Commissions","OTE - Included","Employer discretion","Must Have","Confirmed","PRCL20=8. PRCL21=6 (marginal taxation for bonuses). Triggers higher-of marginal tax calculation.","0","8","6","0","totalGross,taxableBonus,superBase,payrollTax,helpBase", "IT0015"),
  wt("3001","Bonus Off-Cycle","Earnings - Bonus / Incentive","Off-cycle bonus payment — marginal taxation.","Lump Sum / One-Off","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Bonuses and Commissions","OTE - Included","Employer discretion","Should Have","Confirmed","PRCL20=1. PRCL21=6 (marginal bonus). Off-cycle processing.","0","1","6","0","totalGross,taxableBonus,superBase,payrollTax,helpBase", "IT0267"),
  wt("3050","Commission","Earnings - Commission","Commission payments — standard PAYG.","Lump Sum / One-Off","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Bonuses and Commissions","OTE - Included","","Should Have","Draft","Verify whether marginal taxation applies.","0","3","0","0","totalGross,taxableGross,superBase,payrollTax,helpBase", "IT0015"),
  wt("3500","Directors Fees","Earnings - Directors Fees","Directors fees payment.","Lump Sum / One-Off","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Directors Fees","OTE - Excluded","","Should Have","Draft","Confirm OTE status per applicable SGA rules.","0","3","0","0","totalGross,taxableGross,payrollTax,helpBase", "IT0015"),

  // PAY ADJUSTMENTS
  wt("3900","Pay Adjustment (Tax)","Earnings - Other","Pay adjustment — taxable.","Lump Sum / One-Off","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Not Applicable","Partially OTE (see notes)","","Must Have","Confirmed","OTE treatment depends on nature of underlying adjustment.","0","3","0","0","totalGross,taxableGross,payrollTax,helpBase", "IT0015"),
  wt("3901","Pay Adjustment (No Tax)","Earnings - Other","Pay adjustment — non-taxable.","Lump Sum / One-Off","Ad Hoc / On Demand","PAYG Exempt","Not Applicable","Not Applicable","OTE - Excluded","","Must Have","Confirmed","PRCL21 not set — no tax processing.","0","3","-","0","totalGross", "IT0015"),
  wt("4900","Fringe Benefit Tax","Informational / Memo Only","Reportable fringe benefit amount for STP2 reporting.","System Calculated","Annually","Reportable Fringe Benefit","Salary and Wages","Not Applicable","Not Applicable","ATO","Must Have","Confirmed","Memo/informational WT only.","0","3","-","0","", "IT0015"),

  // ANNUAL LEAVE
  wt("2500","Annual Leave","Leave - Annual Leave","Annual leave — 4 weeks FT minimum per NES.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","NES","Must Have","Confirmed","PRCL32=1. Standard 1st envelope.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2501","Annual Leave Half Pay","Leave - Annual Leave","Annual leave taken at half pay.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Should Have","Draft","Confirm if employer policy or prescribed.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2502","Leave Loading","Earnings - Leave Loading","Annual leave loading — 17.5% or actual penalty rate.","Percentage of Base Pay","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Must Have","Confirmed","PRCL21=L (leave loading 1st envelope). Higher-of calculation vs penalty rates.","0","3","L","1","totalGross,taxableGross,payrollTax,helpBase", "IT2001"),
  wt("2950","Annual Leave Encashment","Leave - Annual Leave","Annual leave cashing out — max 2 weeks/12 months.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","NES","Must Have","Confirmed","Written agreement required.","0","3","0","0","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),

  // PERSONAL / CARER'S LEAVE
  wt("2600","Personal Leave with Cert","Leave - Personal / Carer's Leave","Personal/carer's leave with medical certificate — 10 days FT per NES.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","NES","Must Have","Confirmed","PRCL32=1. PRCL64=1.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2605","Personal Leave Unpaid","Leave - Personal / Carer's Leave","Unpaid personal/carer's leave per NES.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","NES","Must Have","Confirmed","PRCL32=1. No tax.","0","3","-","1","", "IT2001"),
  wt("2610","Domestic Violence Leave","Leave - Other Leave","Family and domestic violence leave — 10 days paid per NES.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","NES","Must Have","Confirmed","Confidentiality requirements — pay slip description must not disclose leave type.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),

  // LONG SERVICE LEAVE
  wt("2700","Long Service Leave","Leave - Long Service Leave","Long service leave per applicable state legislation.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","State legislation","Must Have","Confirmed","State-specific via personnel subarea. PRF probability factors apply to provisioning.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2702","Long Service Leave Casual","Leave - Long Service Leave","Long service leave for casual employees per applicable state legislation.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","State legislation","Must Have","Confirmed","Casual LSL accrual rules vary by state legislation.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),

  // PARENTAL LEAVE
  wt("2821","Maternity Leave (Paid)","Leave - Parental Leave","Paid maternity leave — service-based entitlement tiers.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","NES","Must Have","Draft","Super must continue during paid parental leave.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2822","Maternity Leave (Unpaid)","Leave - Parental Leave","Unpaid maternity leave — up to 12 months per NES.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","NES","Must Have","Confirmed","No tax (unpaid).","0","3","-","1","", "IT2001"),
  wt("2823","Paternity Leave (Paid)","Leave - Parental Leave","Paid non-primary carer leave.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","NES","Must Have","Confirmed","PRCL32=1. PRCL64=1.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2824","Paternity Leave (Unpaid)","Leave - Parental Leave","Unpaid non-primary carer leave per NES.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","NES","Must Have","Confirmed","PRCL32=1. No tax.","0","3","-","1","", "IT2001"),
  wt("2870","Parental Leave Paid","Leave - Parental Leave","Generic paid parental leave WT.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","NES","Must Have","Confirmed","Use where a single paid parental leave WT is preferred.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2875","Parental Leave Unpaid","Leave - Parental Leave","Generic unpaid parental leave WT.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","NES","Must Have","Confirmed","No tax.","0","3","-","1","", "IT2001"),

  // OTHER LEAVE
  wt("2520","Time in Lieu","Leave - Other Leave","TOIL accrual and usage. Paid out on termination.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Excluded","","Must Have","Draft","Configure variable accrual rates: 1.5x weekdays, 2.0x Sundays, 2.5x public holidays.","0","3","0","1","totalGross,taxableGross,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2720","Defence Leave","Leave - Other Leave","Defence reserve leave.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Should Have","Confirmed","PRCL32=1. PRCL64=1.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2750","Rostered Day Off Taken","Leave - Other Leave","Rostered Day Off taken.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Should Have","Confirmed","RDO accrual driven by PRCL61/62 configuration.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2815","Study Leave","Leave - Other Leave","Paid study/education leave per client policy.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Should Have","Confirmed","PRCL32=1.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2828","Picnic Day","Leave - Other Leave","Annual picnic day leave (employer-specific policy or state variation).","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Should Have","Confirmed","PRCL32=1.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2830","Emergency Leave","Leave - Other Leave","Emergency/natural disaster leave — paid per client policy.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Must Have","Confirmed","PRCL32=1.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2833","Compassionate Leave","Leave - Other Leave","Compassionate/bereavement leave — NES minimum is 2 days.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","NES","Must Have","Draft","Configure tiered entitlement per client policy.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2850","Bereavement Leave","Leave - Other Leave","Bereavement leave — may overlap with compassionate leave.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Should Have","Confirmed","Verify if separate from or duplicate of 2833.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2855","Military Leave","Leave - Other Leave","Military/defence service leave.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Should Have","Confirmed","PRCL32=1.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2860","Jury Duty Leave","Leave - Community Service Leave","Jury duty leave — make-up pay per NES community service leave.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","NES","Must Have","Confirmed","PRCL32=1. PRCL64=1.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2865","Training","Leave - Other Leave","Paid training leave per client policy.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Should Have","Confirmed","PRCL32=1. PRCL64=1.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2890","Other Paid Leave","Leave - Other Leave","Catch-all paid leave.","System Calculated","Ad Hoc / On Demand","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Should Have","Confirmed","PRCL32=1.","0","3","0","1","totalGross,taxableGross,superBase,payrollTax,workersComp,helpBase", "IT2001"),
  wt("2910","LWOP","Leave - Other Leave","Leave without pay per client policy.","System Calculated","Ad Hoc / On Demand","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Must Have","Confirmed","PRCL32=1. No tax.","0","3","-","1","", "IT2001"),
  wt("2915","Absence without Leave","Leave - Other Leave","Absence without leave — unauthorised absence.","System Calculated","Ad Hoc / On Demand","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","No pay — deduction from ordinary pay.","0","3","-","1","", "IT2001"),

  // WORKERS COMPENSATION
  wt("1601","WC Refund Rate","Employer Cost - Workers Compensation","Workers compensation — recoverable rate per state legislation.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Workers Compensation","Not Applicable","State legislation","Must Have","Confirmed","State-specific via personnel subarea.","0","3","-","0","", "IT0008"),
  wt("1602","WC Non-Refund Rate","Employer Cost - Workers Compensation","Workers compensation — non-recoverable rate.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Workers Compensation","Not Applicable","State legislation","Must Have","Confirmed","Non-recoverable portion.","0","3","-","0","", "IT0008"),
  wt("2715","Workers Comp Recoverable","Employer Cost - Workers Compensation","Workers compensation recoverable payment.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Workers Compensation","Not Applicable","State legislation","Must Have","Confirmed","PRCL32=1. PRCL64=1.","0","3","0","1","totalGross,taxableGross,helpBase", "SYSTEM"),
  wt("2716","Workers Comp Non-Recoverable","Employer Cost - Workers Compensation","Workers compensation non-recoverable payment.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Workers Compensation","Not Applicable","State legislation","Must Have","Confirmed","PRCL32=1. PRCL64=1.","0","3","0","1","totalGross,taxableGross,helpBase", "SYSTEM"),
  wt("2717","Make-up (Workers Comp)","Employer Cost - Workers Compensation","Workers compensation make-up pay.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Workers Compensation","Not Applicable","State legislation","Must Have","Confirmed","PRCL32=1. PRCL64=1.","0","3","0","1","totalGross,taxableGross,helpBase", "SYSTEM"),

  // TERMINATION
  wt("5080","Severance Pay","Earnings - Termination / ETP","Redundancy/severance pay. NES schedule: 1–16 weeks based on service.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","NES","Must Have","Confirmed","PRCL20=1. PRCL82=1. ETP tax treatment driven by PRCL60/77.","","1","-","0","totalGross", "IT0015"),
  wt("5082","Payment in Lieu Notice","Earnings - Termination / ETP","Payment in lieu of notice per NES.","System Calculated","On Termination Only","Subject to PAYG Withholding","Salary and Wages","Not Applicable","OTE - Excluded","NES","Must Have","Confirmed","PRCL20=1. Standard PAYG.","","1","-","0","totalGross,taxableGross,helpBase", "IT0015"),
  wt("5001","Term A LSL","Earnings - Termination / ETP","Termination payout — LSL (Lump Sum A taxed component).","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","Lump Sum A","OTE - Excluded","","Must Have","Confirmed","PRCL21=A.","","-","A","0","totalGross", "IT0015"),
  wt("5002","Term A Annual Leave","Earnings - Termination / ETP","Termination payout — Annual Leave (Lump Sum A).","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","Lump Sum A","OTE - Excluded","","Must Have","Confirmed","PRCL21=A.","","-","A","0","totalGross", "IT0015"),
  wt("5003","Term A NoTax LSL","Earnings - Termination / ETP","Termination payout — LSL tax-free (pre-1978).","System Calculated","On Termination Only","Not Applicable","Not Applicable","Lump Sum A","OTE - Excluded","","Must Have","Confirmed","PRCL21=G.","","-","G","0","totalGross", "IT0015"),
  wt("5004","Term A NoTax AL","Earnings - Termination / ETP","Termination payout — Annual Leave tax-free.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Lump Sum A","OTE - Excluded","","Must Have","Confirmed","PRCL21=A.","","-","A","0","totalGross", "IT0015"),
  wt("5005","Leave Loading LSA","Earnings - Termination / ETP","Leave loading on termination — Lump Sum A.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","Lump Sum A","OTE - Excluded","","Must Have","Confirmed","PRCL21=A.","","-","A","0","totalGross", "IT0015"),
  wt("5006","Leave Loading Marginal","Earnings - Leave Loading","Leave loading — marginally taxed.","System Calculated","Every Pay Run","Subject to PAYG Withholding","Salary and Wages","Paid Leave","OTE - Included","","Must Have","Confirmed","PRCL21=4 (marginal leave loading).","0","3","4","0","totalGross,taxableGross,leaveLoadingBase,payrollTax,helpBase", "IT0015"),
  wt("5007","Leave Loading No Tax","Earnings - Termination / ETP","Leave loading — no tax component.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Lump Sum A","OTE - Excluded","","Must Have","Confirmed","PRCL21=G.","","-","G","0","totalGross", "IT0015"),
  wt("5011","Term B LSL","Earnings - Termination / ETP","Long Service Leave — Lump Sum B (post 1978).","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","Lump Sum B","OTE - Excluded","","Must Have","Confirmed","PRCL21=B.","","-","B","0","totalGross", "IT0015"),
  wt("5021","ETP NoTax Post-94","Earnings - Termination / ETP","ETP tax-free post-94 component.","System Calculated","On Termination Only","Not Applicable","Not Applicable","ETP","OTE - Excluded","","Must Have","Confirmed","PRCL21=H.","","-","H","0","totalGross", "IT0015"),
  wt("5031","Term D","Earnings - Termination / ETP","Lump Sum D — genuine redundancy tax-free.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Lump Sum D","OTE - Excluded","","Must Have","Confirmed","PRCL21=D.","","-","D","0","totalGross", "IT0015"),
  wt("5035","Lump Sum E","Earnings - Termination / ETP","Lump Sum E — back pay for earlier income years.","System Calculated","On Termination Only","Subject to PAYG Withholding","Salary and Wages","Lump Sum E","OTE - Excluded","","Must Have","Confirmed","PRCL21=Y.","","-","Y","0","totalGross,helpBase", "IT0015"),
  wt("5041","Term Marginal AL","Earnings - Termination / ETP","Termination — Annual Leave marginally taxed.","System Calculated","On Termination Only","Subject to PAYG Withholding","Salary and Wages","Lump Sum A","OTE - Excluded","","Must Have","Confirmed","PRCL21=F.","","-","F","0","totalGross,taxableGross", "IT0015"),
  wt("5042","Term Marginal LSL","Earnings - Termination / ETP","Termination — LSL marginally taxed.","System Calculated","On Termination Only","Subject to PAYG Withholding","Salary and Wages","Lump Sum A","OTE - Excluded","","Must Have","Confirmed","PRCL21=F.","","-","F","0","totalGross,taxableGross", "IT0015"),
  wt("5051","Termination Cheque Paymt","Earnings - Termination / ETP","Net termination cheque/off-cycle payment WT.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Must Have","Confirmed","PRCL77=K. Technical result WT.","","-","-","0","", "IT0015"),
  wt("5053","Lump Sum C Post 30/6/94","Earnings - Termination / ETP","Lump Sum C — post 30/6/1994 invalidity.","System Calculated","On Termination Only","Subject to PAYG Withholding","Salary and Wages","ETP","OTE - Excluded","","Must Have","Confirmed","PRCL21=E.","","-","E","0","totalGross,taxableGross", "IT0015"),
  wt("5083","ETP Payments (Other)","Earnings - Termination / ETP","ETP — other types.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Draft","Review applicable ETP type and PRCL60/77 configuration.","","-","-","0","totalGross", "IT0015"),
  wt("5085","ETP Payments in Death","Earnings - Termination / ETP","ETP payments on death of employee.","System Calculated","On Termination Only","ETP - Death Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Draft","PRCL77 death benefit configuration required.","","-","-","0","totalGross", "IT0015"),
  wt("5081","ETP Roll-Over","Earnings - Termination / ETP","ETP rollover to complying super fund.","System Calculated","On Termination Only","Not Applicable","Not Applicable","ETP","OTE - Excluded","","Should Have","Confirmed","Rollover amount — not taxed at payment.","","-","-","0","", "IT0015"),
  wt("5090","Average Taxable Gross","Earnings - Termination / ETP","Average taxable gross for marginal tax calculations.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Must Have","Confirmed","Technical WT. Used in marginal rate calculation.","","-","-","0","", "IT0015"),

  // ETP SPLIT WTs
  wt("5701","Life Benefit ETP 31.5%","Earnings - Termination / ETP","Life benefit ETP — 31.5% tax rate component.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Must Have","Confirmed","System-generated. PRCL60=M.","","-","-","0","totalGross", "IT0015"),
  wt("5702","Life Benefit ETP 16.5%","Earnings - Termination / ETP","Life benefit ETP — 16.5% tax rate component.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Must Have","Confirmed","PRCL60=N.","","-","-","0","totalGross", "IT0015"),
  wt("5703","Life Benefit ETP 46.5%","Earnings - Termination / ETP","Life benefit ETP — 46.5% tax rate component.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Must Have","Confirmed","PRCL60=O.","","-","-","0","totalGross", "IT0015"),
  wt("5710","ETP Tax Free","Earnings - Termination / ETP","ETP tax-free component.","System Calculated","On Termination Only","Not Applicable","Not Applicable","ETP","OTE - Excluded","","Must Have","Confirmed","Pre-1983 tax-free component.","","-","-","0","totalGross", "IT0015"),
  wt("5704","Trans ETP Below Cap 31.5%","Earnings - Termination / ETP","Transitional ETP below cap — 31.5%.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","Transitional ETP arrangements.","","-","-","0","totalGross", "IT0015"),
  wt("5705","Transitional ETP 16.5%","Earnings - Termination / ETP","Transitional ETP — 16.5%.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","","","-","-","0","totalGross", "IT0015"),
  wt("5706","Trans ETP Above Cap 31.5%","Earnings - Termination / ETP","Transitional ETP above cap — 31.5%.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","","","-","-","0","totalGross", "IT0015"),
  wt("5707","Transitional ETP 46.5%","Earnings - Termination / ETP","Transitional ETP — 46.5%.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","","","-","-","0","totalGross", "IT0015"),
  wt("5708","Death Benefit ND 31.5%","Earnings - Termination / ETP","Death benefit ETP (non-dependant) — 31.5%.","System Calculated","On Termination Only","ETP - Death Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=H.","","-","-","0","totalGross", "IT0015"),
  wt("5709","Death Benefit ND 46.5%","Earnings - Termination / ETP","Death benefit ETP (non-dependant) — 46.5%.","System Calculated","On Termination Only","ETP - Death Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=I.","","-","-","0","totalGross", "IT0015"),
  wt("5711","Death Benefit D 46.5%","Earnings - Termination / ETP","Death benefit ETP (dependant) — 46.5%.","System Calculated","On Termination Only","ETP - Death Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=K.","","-","-","0","totalGross", "IT0015"),
  wt("5712","Death Benefit - Trustee","Earnings - Termination / ETP","Death benefit ETP — trustee.","System Calculated","On Termination Only","ETP - Death Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=L.","","-","-","0","totalGross", "IT0015"),
  wt("5713","DB Dependent - No Tax","Earnings - Termination / ETP","Death benefit ETP (dependant) — no tax.","System Calculated","On Termination Only","Not Applicable","Not Applicable","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=J.","","-","-","0","totalGross", "IT0015"),
  wt("5714","Split LB ETP <age <cap","Earnings - Termination / ETP","Split life benefit ETP — below preservation age and cap.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=A.","","-","-","0","totalGross", "IT0015"),
  wt("5715","Split LB ETP >age <cap","Earnings - Termination / ETP","Split life benefit ETP — above preservation age, below cap.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=B.","","-","-","0","totalGross", "IT0015"),
  wt("5716","Split LB ETP >cap","Earnings - Termination / ETP","Split life benefit ETP — above cap.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=C.","","-","-","0","totalGross", "IT0015"),
  wt("5717","Split TR ETP <age <Lcap","Earnings - Termination / ETP","Split transitional ETP — below preservation age and lower cap.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=D.","","-","-","0","totalGross", "IT0015"),
  wt("5718","Split TR ETP >age <Lcap","Earnings - Termination / ETP","Split transitional ETP — above preservation age, below lower cap.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=E.","","-","-","0","totalGross", "IT0015"),
  wt("5719","Split TR ETP >Lcap <Ucap","Earnings - Termination / ETP","Split transitional ETP — between lower and upper cap.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=F.","","-","-","0","totalGross", "IT0015"),
  wt("5720","Split TR ETP >Ucap","Earnings - Termination / ETP","Split transitional ETP — above upper cap.","System Calculated","On Termination Only","ETP - Life Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=G.","","-","-","0","totalGross", "IT0015"),
  wt("5721","Split DB ETP ND <cap","Earnings - Termination / ETP","Split death benefit ETP (non-dependant) — below cap.","System Calculated","On Termination Only","ETP - Death Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=H.","","-","-","0","totalGross", "IT0015"),
  wt("5722","Split DB ETP ND >cap","Earnings - Termination / ETP","Split death benefit ETP (non-dependant) — above cap.","System Calculated","On Termination Only","ETP - Death Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=I.","","-","-","0","totalGross", "IT0015"),
  wt("5723","Split DB ETP D <cap","Earnings - Termination / ETP","Split death benefit ETP (dependant) — below cap.","System Calculated","On Termination Only","ETP - Death Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=J.","","-","-","0","totalGross", "IT0015"),
  wt("5724","Split DB ETP D >cap","Earnings - Termination / ETP","Split death benefit ETP (dependant) — above cap.","System Calculated","On Termination Only","ETP - Death Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=K.","","-","-","0","totalGross", "IT0015"),
  wt("5725","Split DB ETP - Trustee","Earnings - Termination / ETP","Split death benefit ETP — trustee.","System Calculated","On Termination Only","ETP - Death Benefit","Salary and Wages","ETP","OTE - Excluded","","Should Have","Confirmed","PRCL60=L.","","-","-","0","totalGross", "IT0015"),
  wt("5097","Override Post-83 Days ETP","Earnings - Termination / ETP","Override for post-83 days ETP calculation.","Lump Sum / One-Off","On Termination Only","Not Applicable","Not Applicable","ETP","OTE - Excluded","","Should Have","Confirmed","Technical override WT.","0","-","A","0","", "SYSTEM"),
  wt("5098","Override Pre-83 Days ETP","Earnings - Termination / ETP","Override for pre-83 days ETP calculation.","Lump Sum / One-Off","On Termination Only","Not Applicable","Not Applicable","ETP","OTE - Excluded","","Should Have","Confirmed","Technical override WT.","0","-","A","0","", "SYSTEM"),
  wt("5099","Override Start Date ETP","Earnings - Termination / ETP","Override for ETP start date calculation.","Lump Sum / One-Off","On Termination Only","Not Applicable","Not Applicable","ETP","OTE - Excluded","","Should Have","Confirmed","Technical override WT.","0","-","A","0","", "SYSTEM"),

  // DEDUCTIONS
  wt("7001","Extra Tax","Deductions - Post-Tax","Additional PAYG withholding per employee ATO request.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","ATO","Must Have","Confirmed","PRCL21=X. Reduces net pay.","","-","X","0","", "IT0014"),
  wt("7201","Health Fund 1","Deductions - Other","Health fund deduction — employee authorised.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL20=8. PRCL64=1.","","-","-","0","", "IT0014"),
  wt("7205","Health Fund 2","Deductions - Other","Second health fund deduction.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Nice to Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0014"),
  wt("7401","Advance Repayment","Deductions - Other","Salary advance repayment deduction.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0014"),
  wt("7650","Other Deduction","Deductions - Other","Catch-all post-tax deduction.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0014"),
  wt("7655","Social Club","Deductions - Other","Social club membership deduction.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Nice to Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0014"),
  wt("7670","Workplace Giving 1","Deductions - Other","Workplace giving / charitable donation 1.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Deduction - Workplace Giving","Not Applicable","","Should Have","Confirmed","PRCL21=S (pre-tax workplace giving).","","-","S","0","", "IT0014"),
  wt("7671","Workplace Giving 2","Deductions - Other","Workplace giving / charitable donation 2.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Deduction - Workplace Giving","Not Applicable","","Nice to Have","Confirmed","PRCL21=S.","","-","S","0","", "IT0014"),
  wt("7701","Union 1","Deductions - Union / Association Fees","Union deduction 1 — employee authorised.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Deduction - Union / Professional Assoc","Not Applicable","","Must Have","Confirmed","PRCL20=8. PRCL75=1. PRCL64=1.","","-","-","0","", "IT0014"),
  wt("7705","Union 2","Deductions - Union / Association Fees","Union deduction 2 — secondary.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Deduction - Union / Professional Assoc","Not Applicable","","Nice to Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0014"),
  wt("7710","Garnishment","Deductions - Post-Tax","Court-ordered garnishment deduction.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","Legislative","Must Have","Confirmed","PRCL20=8. Court order required.","","-","-","0","", "IT0014"),
  wt("7801","Child Support","Deductions - Child Support","Child support deduction per legislative requirement.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Deduction - Child Support (garnishee)","Not Applicable","Legislative","Must Have","Confirmed","PRCL20=7. PRCL64=1. Services Australia order required.","","-","-","0","", "IT0014"),
  wt("7810","Loan Repayment","Deductions - Other","Salary loan repayment deduction.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0014"),
  wt("7815","Novated Lease - Pre Tax","Deductions - Salary Sacrifice","Novated lease pre-tax deduction.","Fixed Amount per Pay Period","Every Pay Run","Salary Sacrifice (Pre-Tax)","Not Applicable","Salary Sacrifice - Other","OTE - Excluded","","Should Have","Confirmed","PRCL21=S. FBT may apply.","","-","S","0","", "SYSTEM"),

  // SUPERANNUATION
  wt("8200","Super - COF ER","Superannuation - SG Contribution","Employer SG contribution — employee choice of fund.","Percentage of OTE","Every Pay Run","Not Applicable","Not Applicable","Super - Employer SG","Not Applicable","SGA","Must Have","Confirmed","Payday Super compliance required from 1 July 2026. Configure default fund.","","-","-","0","", "IT0015"),
  wt("8210","Super - COF EE Post Tax","Superannuation - Additional Voluntary","Employee voluntary post-tax super contribution.","Fixed Amount per Pay Period","Every Pay Run","Not Applicable","Not Applicable","Super - RESC","Not Applicable","SGA","Must Have","Confirmed","RESC reporting required for STP2.","","-","-","0","", "IT0015"),
  wt("8211","Super - COF EE Pre Tax","Superannuation - Salary Sacrifice","Employee pre-tax salary sacrifice super.","Fixed Amount per Pay Period","Every Pay Run","Salary Sacrifice (Pre-Tax)","Not Applicable","Salary Sacrifice - Super","Not Applicable","SGA","Must Have","Confirmed","PRCL21=S. RESC reporting for STP2.","","-","S","0","", "IT0015"),

  // TAX OVERRIDES
  wt("9001","Tax Override","Informational / Memo Only","Override for total PAYG withholding.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL66=H. Overrides /401 total tax.","","-","-","0","", "IT0015"),
  wt("9002","Tax A - Override","Informational / Memo Only","Override for Lump Sum A tax.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL66=A. Overrides /420.","","-","-","0","", "IT0015"),
  wt("9003","Tax B - Override","Informational / Memo Only","Override for Lump Sum B tax.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL66=B. Overrides /421.","","-","-","0","", "IT0015"),
  wt("9004","Tax C 16.5% - Override","Informational / Memo Only","Override for Lump Sum C 16.5% tax.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL66=C. Overrides /422.","","-","-","0","", "IT0015"),
  wt("9005","Tax C 31.5% - Override","Informational / Memo Only","Override for Lump Sum C 31.5% tax.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL66=E. Overrides /423.","","-","-","0","", "IT0015"),
  wt("9006","Tax Marginal - Override","Informational / Memo Only","Override for marginal tax calculation.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL66=F. Overrides /424.","","-","-","0","", "IT0015"),
  wt("9007","Tax Refund - Override","Informational / Memo Only","Override for tax refund calculation.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Should Have","Confirmed","PRCL66=G.","","-","-","0","", "IT0015"),
  wt("9010","Tax Override - LifeB ETP","Informational / Memo Only","Override for Life Benefit ETP tax.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Nice to Have","Confirmed","","","-","-","0","", "IT0015"),
  wt("9011","Tax Override - Trans ETP","Informational / Memo Only","Override for Transitional ETP tax.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Nice to Have","Confirmed","","","-","-","0","", "IT0015"),
  wt("9012","Tax Override - DeathB ETP","Informational / Memo Only","Override for Death Benefit ETP tax.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Nice to Have","Confirmed","","","-","-","0","", "IT0015"),
  wt("9020","Tax Override /411-death","Informational / Memo Only","Override for /411 death benefit tax.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Nice to Have","Confirmed","","","-","-","0","", "IT0015"),
  wt("9021","Tax Override /420-death","Informational / Memo Only","Override for /420 death benefit Lump Sum A tax.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Nice to Have","Confirmed","","","-","-","0","", "IT0015"),

  // PROVISIONS
  wt("9201","Annual Leave Provision","Informational / Memo Only","Annual leave provision — AASB 119 accounting accrual.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","AASB 119","Must Have","Confirmed","PRCL80=1. Internal GL accrual only.","0","3","-","0","", "IT0015"),
  wt("9202","LSL Provision","Informational / Memo Only","Long service leave provision — AASB 119 with probability factor table.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","AASB 119","Must Have","Confirmed","PRF01–PRF11 probability factor config required.","","-","-","0","", "IT0015"),
  wt("9203","Sick Leave Provision","Informational / Memo Only","Personal leave provision — accounting accrual.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","AASB 119","Should Have","Confirmed","PRCL80=1.","0","3","-","0","", "IT0015"),
  wt("9210","Annual Leave Entl.","Informational / Memo Only","Annual leave entitlement accrual.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Must Have","Confirmed","PRCL20=8. PRCL73=1.","","-","-","0","", "IT0015,IT2010"),
  wt("9212","Annual Leave Acc","Informational / Memo Only","Annual leave accumulated.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Must Have","Confirmed","PRCL20=8. PRCL73=1.","","-","-","0","", "IT0015"),
  wt("9214","Personal Leave Entl.","Informational / Memo Only","Personal leave entitlement accrual.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Must Have","Confirmed","PRCL20=8. PRCL73=1.","","-","-","0","", "IT0015,IT2010"),
  wt("9216","Long Service Leave Entl.","Informational / Memo Only","Long service leave entitlement accrual.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","State legislation","Must Have","Confirmed","PRCL20=8. PRCL73=1.","","-","-","0","", "IT0015,IT2010"),
  wt("9218","Long Service Leave Acc.","Informational / Memo Only","Long service leave accumulated.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","State legislation","Must Have","Confirmed","PRCL20=8. PRCL73=1.","","-","-","0","", "IT0015,IT2010"),
  wt("9220","Annual Leave Entl. (Prov)","Informational / Memo Only","Annual leave entitlement provisioning.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","AASB 119","Must Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0015,IT2010"),
  wt("9224","Personal Leave Entl. (Prov)","Informational / Memo Only","Personal leave entitlement provisioning.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","AASB 119","Should Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0015,IT2010"),
  wt("9226","LSL Entl. (Prov)","Informational / Memo Only","LSL entitlement provisioning.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","AASB 119","Must Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0015,IT2010"),
  wt("9228","LSL (Prov)","Informational / Memo Only","LSL provision value.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","AASB 119","Must Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0015,IT2010"),
  wt("9250","Annual Leave Term Payout","Informational / Memo Only","Annual leave termination payout — informational.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Must Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0015"),
  wt("9260","LSL Term Payout","Informational / Memo Only","LSL termination payout — informational.","System Calculated","On Termination Only","Not Applicable","Not Applicable","Not Applicable","Not Applicable","","Must Have","Confirmed","PRCL20=8.","","-","-","0","", "IT0015"),

  // EMPLOYER COSTS
  wt("9900","Payroll Tax","Employer Cost - Payroll Tax","Payroll tax employer cost — state-based levy.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","State legislation","Must Have","Confirmed","PRCL32=A. State-specific thresholds and rates.","","-","-","A","", "SYSTEM"),
  wt("9901","Workers Comp","Employer Cost - Workers Compensation","Workers compensation insurance levy — employer cost.","System Calculated","Every Pay Run","Not Applicable","Not Applicable","Not Applicable","Not Applicable","State legislation","Must Have","Confirmed","PRCL32=A. State-specific rates.","","-","-","A","", "SYSTEM"),
];

// ═══════════════════════════════════════════════════════════════════════════
// ─── INDUSTRY PACK DEFINITIONS ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// Each industry defines which WT codes are in the Standard Pack (~80 WTs
// included in the base contract) vs Extended (full catalogue upsell).
// All WTs in PRELOADED are available; the pack just controls the default view.

// Core WTs included in EVERY industry's standard pack (~61 WTs)
const CORE_CODES = [
  "1001","1101","1401","1013",  // base pay essentials
  "2500","2502","2950",          // annual leave
  "2600","2605","2610",          // personal leave
  "2700",                        // LSL
  "2821","2822","2823","2824","2870","2875", // parental leave
  "2520","2830","2833","2860","2890","2910", // key other leave
  "5080","5082","5001","5002","5003","5004","5005","5011","5021","5031","5035","5041","5042","5051", // termination core
  "5701","5702","5703","5710",   // ETP split core
  "7001","7701","7710","7801","7650", // deductions core
  "8200","8210","8211",          // super
  "1601","1602","2715","2716","2717", // workers comp
  "9900","9901",                 // employer costs
  "9201","9202","9210","9214","9216", // provisions core
  "3900","3901","4900",          // adjustments
  "9001",                        // tax override
];

const INDUSTRY_PROFILES = {
  salaried: {
    key: "salaried",
    name: "Salaried (Default)",
    icon: "💼",
    color: "#004F9E",
    bgLight: "#EBF4FF",
    description: "Standard salaried workforce — professional office-based roles with minimal award complexity.",
    standardExtra: ["1199","1500","3000","3001","4200","4220","4225","4230","7201","7810","7815","9203","9218","9220","9224","9226","9228","9250","9260"],
  },
  fsi: {
    key: "fsi",
    name: "Financial Services & Insurance",
    icon: "🏦",
    color: "#0B6E4F",
    bgLight: "#ECFDF5",
    description: "Banking, insurance, wealth management — commission structures, directors fees, bonus schemes, regulatory complexity.",
    standardExtra: ["1199","3000","3001","3050","3500","4200","4220","7201","7670","7810","7815","9203","9218","9220","9224","9226","9228","9250","9260"],
  },
  retail: {
    key: "retail",
    name: "Retail & Hospitality",
    icon: "🛒",
    color: "#C2410C",
    bgLight: "#FFF7ED",
    description: "Award-heavy workforce — casual loading, penalty rates, shift loadings, public holiday premiums, high leave complexity.",
    standardExtra: ["1402","2000","2115","2120","2125","2200","2405","2100","4205","4225","2750","9203","9218","9220","9224","9226","9228","9250","9260"],
  },
  manufacturing: {
    key: "manufacturing",
    name: "Manufacturing & Industrial",
    icon: "🏭",
    color: "#6D28D9",
    bgLight: "#F5F3FF",
    description: "Shift-intensive operations — all overtime tiers, shift allowances, on-call, first aid, tool allowances, RDOs.",
    standardExtra: ["2000","2115","2120","2125","2200","2203","2240","2300","2100","4205","2750","1500","2865","9203","9218","9226","9228","9250","9260"],
  },
  health: {
    key: "health",
    name: "Health & Aged Care",
    icon: "🏥",
    color: "#BE185D",
    bgLight: "#FDF2F8",
    description: "24/7 rostered workforce — all shift loadings, overtime, on-call, uniform, higher duties, training leave, penalty rates.",
    standardExtra: ["2000","2115","2120","2200","2203","2237","2240","2300","4205","4225","1500","2815","2865","9203","9218","9226","9228","9250","9260"],
  },
  profserv: {
    key: "profserv",
    name: "Professional Services",
    icon: "⚖️",
    color: "#1D4ED8",
    bgLight: "#EFF6FF",
    description: "Consulting, legal, accounting — bonus schemes, commission, directors fees, novated leasing, LAFHA, travel.",
    standardExtra: ["1199","1500","3000","3001","3050","3500","4200","4210","4220","4230","7201","7670","7815","9203","9218","9226","9228","9250","9260"],
  },
};

// Build full standard code sets (core + industry extras)
Object.values(INDUSTRY_PROFILES).forEach(p => {
  p.standardCodes = new Set([...CORE_CODES, ...p.standardExtra]);
});

const ALL_CODES = new Set(PRELOADED.map(r => r.legacyCode));

const emptyRecord = () => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  clientName: "", legacyCode: "", category: "", description: "", amountType: "", frequency: "",
  taxTreatment: "", stp2IncomeType: "", stp2PaymentType: "", oteClassification: "",
  applicableState: "National", legislativeRef: "", priority: "Must Have", notes: "", status: "Draft",
  prcl: { p01: "-", p20: "-", p21: "-", p32: "-" }, sapNote: "", ccls: [], infotype: [],
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── FWC MAPD INTEGRATION ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const COMMON_AWARDS = [
  { code: "MA000002", title: "Clerks — Private Sector Award 2020", industry: "profserv" },
  { code: "MA000003", title: "Fast Food Industry Award 2010", industry: "retail" },
  { code: "MA000004", title: "General Retail Industry Award 2020", industry: "retail" },
  { code: "MA000009", title: "Health Professionals and Support Services Award 2020", industry: "health" },
  { code: "MA000010", title: "Manufacturing and Associated Industries Award 2020", industry: "manufacturing" },
  { code: "MA000011", title: "Hospitality Industry (General) Award 2020", industry: "retail" },
  { code: "MA000012", title: "Pharmacy Industry Award 2020", industry: "health" },
  { code: "MA000014", title: "Banking, Finance and Insurance Award 2020", industry: "fsi" },
  { code: "MA000018", title: "Aged Care Award 2010", industry: "health" },
  { code: "MA000020", title: "Building and Construction General On-site Award 2020", industry: "manufacturing" },
  { code: "MA000025", title: "Transport and Distribution Award 2020", industry: "manufacturing" },
  { code: "MA000034", title: "Security Services Industry Award 2020", industry: "profserv" },
  { code: "MA000036", title: "Food, Beverage and Tobacco Manufacturing Award 2020", industry: "manufacturing" },
  { code: "MA000055", title: "Nurses Award 2020", industry: "health" },
  { code: "MA000065", title: "Social, Community, Home Care and Disability Services Award 2010", industry: "health" },
  { code: "MA000076", title: "Mining Industry Award 2020", industry: "manufacturing" },
  { code: "MA000100", title: "Accountants Award 2020", industry: "profserv" },
  { code: "MA000119", title: "Restaurant Industry Award 2020", industry: "retail" },
  { code: "MA000120", title: "Children's Services Award 2010", industry: "health" },
];

// ─── MAPD → Wage Type Mapping ────────────────────────────────────────────

function mapPenaltyToWT(penalty) {
  const desc = (penalty.penalty_description || penalty.penaltyDescription || "").toLowerCase();
  const rate = parseFloat(penalty.rate || penalty.penaltyRate || 0);
  const pct = rate; // FWC returns rate as percentage already (e.g. 225 = 225%)
  const clause = penalty.clause_description || penalty.clauses || penalty.clauseNumber || "";

  // Overtime mapping
  if (desc.includes("overtime")) {
    if (pct <= 110) return { code: "2110", name: `Overtime @ 1.0 — ${clause}`, cat: "Earnings - Overtime", ote: "OTE - Excluded" };
    if (pct <= 160) return { code: "2115", name: `Overtime @ 1.5 — ${clause}`, cat: "Earnings - Overtime", ote: "OTE - Excluded" };
    if (pct <= 210) return { code: "2120", name: `Overtime @ 2.0 — ${clause}`, cat: "Earnings - Overtime", ote: "OTE - Excluded" };
    if (pct <= 260) return { code: "2125", name: `Overtime @ 2.5 — ${clause}`, cat: "Earnings - Overtime", ote: "OTE - Excluded" };
    return { code: "2130", name: `Overtime @ ${(pct/100).toFixed(1)} — ${clause}`, cat: "Earnings - Overtime", ote: "OTE - Excluded" };
  }

  // Public holiday
  if (desc.includes("public holiday") || desc.includes("public hol")) {
    return { code: "2405", name: `Public Holiday ${pct}% — ${clause}`, cat: "Earnings - Penalty / Shift Loading", ote: "OTE - Included" };
  }

  // Saturday / Sunday penalties
  if (desc.includes("saturday")) {
    return { code: "2200", name: `Saturday Penalty ${pct}% — ${clause}`, cat: "Earnings - Penalty / Shift Loading", ote: "OTE - Included" };
  }
  if (desc.includes("sunday")) {
    return { code: "2200", name: `Sunday Penalty ${pct}% — ${clause}`, cat: "Earnings - Penalty / Shift Loading", ote: "OTE - Included" };
  }

  // Shift loadings
  if (desc.includes("night") || desc.includes("evening") || desc.includes("afternoon") || desc.includes("shift")) {
    const loadingPct = Math.round(pct - 100);
    if (loadingPct > 0 && loadingPct <= 16) return { code: "2203", name: `${loadingPct}% Shift Loading — ${clause}`, cat: "Earnings - Penalty / Shift Loading", ote: "OTE - Included" };
    if (loadingPct > 16 && loadingPct <= 18) return { code: "2237", name: `${loadingPct}% Shift Loading — ${clause}`, cat: "Earnings - Penalty / Shift Loading", ote: "OTE - Included" };
    if (loadingPct > 18 && loadingPct <= 22) return { code: "2240", name: `${loadingPct}% Shift Loading — ${clause}`, cat: "Earnings - Penalty / Shift Loading", ote: "OTE - Included" };
    if (loadingPct > 22) return { code: "2245", name: `${loadingPct}% Shift Loading — ${clause}`, cat: "Earnings - Penalty / Shift Loading", ote: "OTE - Included" };
    return { code: "2200", name: `Shift Penalty ${pct}% — ${clause}`, cat: "Earnings - Penalty / Shift Loading", ote: "OTE - Included" };
  }

  // Catch-all penalty
  return { code: "2200", name: `Penalty ${pct}% — ${desc.substring(0,60) || clause}`, cat: "Earnings - Penalty / Shift Loading", ote: "OTE - Included" };
}

function mapAllowanceToWT(allowance, isExpense) {
  const desc = (allowance.allowance || allowance.allowance_description || allowance.allowanceDescription || "").toLowerCase();
  const amount = allowance.allowance_amount || allowance.allowanceAmount || "";
  const clause = allowance.clauses || allowance.clause_description || allowance.clauseNumber || "";
  const freq = allowance.payment_frequency || allowance.paymentFrequency || "";

  if (desc.includes("first aid")) return { code: "4205", name: `First Aid Allowance — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Included", stp2p: "Allowances - Tasks" };
  if (desc.includes("meal")) return { code: "2100", name: `Meal Allowance — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Excluded", stp2p: "Allowances - Meals" };
  if (desc.includes("travel") || desc.includes("fares")) return { code: "4230", name: `Travel Allowance — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Excluded", stp2p: "Allowances - Travel" };
  if (desc.includes("motor") || desc.includes("vehicle") || desc.includes("car") || desc.includes("mileage")) return { code: "2401", name: `Vehicle Allowance — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Excluded", stp2p: "Allowances - Car / Transport" };
  if (desc.includes("uniform") || desc.includes("laundry") || desc.includes("clothing")) return { code: "4225", name: `Uniform/Laundry Allowance — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Excluded", stp2p: "Allowances - Laundry" };
  if (desc.includes("tool") || desc.includes("equipment")) return { code: "4240", name: `Tool/Equipment Allowance — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Excluded", stp2p: "Allowances - Tools / Equipment" };
  if (desc.includes("on call") || desc.includes("on-call") || desc.includes("standby")) return { code: "2300", name: `On-Call Allowance — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Included", stp2p: "Allowances - Other" };
  if (desc.includes("higher dut")) return { code: "1500", name: `Higher Duties Allowance — cl ${clause}`, cat: "Earnings - Base Pay", ote: "OTE - Included", stp2p: "Not Applicable" };
  if (desc.includes("phone") || desc.includes("telephone") || desc.includes("mobile")) return { code: "4220", name: `Telephone Allowance — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Excluded", stp2p: "Allowances - Other" };
  if (desc.includes("housing") || desc.includes("accommodation") || desc.includes("living away")) return { code: "4215", name: `Housing/LAFHA — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Excluded", stp2p: "Allowances - Other" };
  if (desc.includes("cold") || desc.includes("heat") || desc.includes("disability") || desc.includes("dirty")) return { code: "4240", name: `${desc.substring(0,50)} — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Excluded", stp2p: "Allowances - Tasks" };

  // Catch-all
  const label = allowance.allowance || allowance.allowance_description || (isExpense ? "Expense Allowance" : "Wage Allowance");
  return { code: isExpense ? "4235" : "4240", name: `${label.substring(0,50)} — cl ${clause}`, cat: "Earnings - Allowance", ote: "OTE - Excluded", stp2p: "Allowances - Other" };
}

function buildWTFromMapd(mapped, awardCode, awardTitle, notes) {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
    clientName: mapped.name,
    legacyCode: mapped.code,
    category: mapped.cat,
    description: `Auto-imported from ${awardCode} (${awardTitle}). ${notes || ""}`.trim(),
    amountType: mapped.amountType || (mapped.cat.includes("Overtime") || mapped.cat.includes("Penalty") ? "Hourly Rate × Hours" : "Fixed Amount per Pay Period"),
    frequency: mapped.frequency || "Every Pay Run",
    taxTreatment: mapped.taxTreat || "Subject to PAYG Withholding",
    stp2IncomeType: "Salary and Wages",
    stp2PaymentType: mapped.stp2p || "Not Applicable",
    oteClassification: mapped.ote || "OTE - Excluded",
    applicableState: "National",
    legislativeRef: `${awardCode}`,
    priority: "Should Have",
    status: "Draft",
    notes: `MAPD Import — ${awardTitle}. Review and confirm SAP processing classes.`,
    prcl: { p01: "0", p20: "3", p21: "0", p32: "0" },
    sapNote: "Auto-imported from FWC MAPD. Consultant to verify PRCL configuration.",
    ccls: mapped.ote === "OTE - Included"
      ? ["totalGross", "taxableGross", "superBase", "payrollTax", "workersComp", "helpBase"]
      : ["totalGross", "taxableGross", "payrollTax", "helpBase"],
    infotype: mapped.cat.includes("Overtime") || mapped.cat.includes("Penalty") ? ["IT2010"] : ["IT0014"],
  };
}

// ─── MAPD API fetch helper ───
const MAPD_PROXY = "/api/mapd";

async function fetchMapd(path, params = {}) {
  const qs = new URLSearchParams({ path, ...params }).toString();
  const res = await fetch(`${MAPD_PROXY}?${qs}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const errMsg = data?.message || data?.error || data?.statusCode || res.statusText;
    const debugUrl = data?._debug?.requestedUrl || `${path} (status ${res.status})`;
    throw new Error(`${errMsg} — URL: ${debugUrl}`);
  }
  return data;
}

// ─── Utility Components ───
function Badge({ children, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-rose-50 text-rose-700 border border-rose-200",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    orange: "bg-orange-50 text-orange-700 border border-orange-200",
    violet: "bg-violet-50 text-violet-700 border border-violet-200",
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${colors[color] || colors.blue}`}>{children}</span>;
}

function Select({ value, onChange, options, placeholder, label, required }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition">
        <option value="">{placeholder || "Select..."}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Input({ value, onChange, label, placeholder, required, multiline }) {
  const cls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition";
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</span>
      {multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls + " resize-none"} /> : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />}
    </label>
  );
}

function PrclChip({ label, value, options }) {
  const opt = options?.find(o => o.value === value);
  const displayLabel = opt?.label || value || "—";
  const isNA = value === "-" || value === "" || !value;
  return (
    <div className="rounded-lg border bg-slate-50 border-slate-200 p-2 text-center">
      <p className="text-xs font-bold text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${isNA ? "text-slate-400" : "text-slate-800"}`}>{value || "—"}</p>
      <p className={`text-xs mt-0.5 leading-tight ${isNA ? "text-slate-400" : "text-slate-500"}`}>{displayLabel}</p>
    </div>
  );
}

function CclsCheckboxes({ value = [], onChange }) {
  const toggle = (key) => { const next = value.includes(key) ? value.filter(k => k !== key) : [...value, key]; onChange(next); };
  return (
    <div className="grid grid-cols-1 gap-2">
      {CCLS_OPTIONS.map(opt => (
        <label key={opt.key} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition ${value.includes(opt.key) ? "bg-blue-50 border-blue-300" : "bg-white border-slate-200 hover:border-slate-300"}`}>
          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition ${value.includes(opt.key) ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
            {value.includes(opt.key) && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <input type="checkbox" className="sr-only" checked={value.includes(opt.key)} onChange={() => toggle(opt.key)} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-tight ${value.includes(opt.key) ? "text-blue-900" : "text-slate-700"}`}>{opt.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{opt.tip}</p>
          </div>
        </label>
      ))}
    </div>
  );
}

function CclsBadges({ ccls = [] }) {
  if (!ccls.length) return <span className="text-xs text-slate-400 italic">None assigned</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {ccls.map(key => {
        const opt = CCLS_OPTIONS.find(o => o.key === key);
        if (!opt) return null;
        const colors = { totalGross: "bg-blue-50 text-blue-700 border-blue-200", taxableGross: "bg-violet-50 text-violet-700 border-violet-200", taxableBonus: "bg-orange-50 text-orange-700 border-orange-200", superBase: "bg-emerald-50 text-emerald-700 border-emerald-200", leaveLoadingBase: "bg-teal-50 text-teal-700 border-teal-200", payrollTax: "bg-amber-50 text-amber-700 border-amber-200", workersComp: "bg-rose-50 text-rose-700 border-rose-200", helpBase: "bg-slate-100 text-slate-600 border-slate-200" };
        return <span key={key} title={opt.tip} className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${colors[key] || "bg-slate-100 text-slate-600 border-slate-200"}`}>{opt.label.split("(")[0].trim()}</span>;
      })}
    </div>
  );
}

function InfotypeBadges({ infotype = [] }) {
  if (!infotype.length) return <span className="text-xs text-slate-400 italic">Not assigned</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {infotype.map(key => {
        const opt = INFOTYPE_OPTIONS.find(o => o.key === key);
        if (!opt) return null;
        return <span key={key} title={opt.tip} className={`text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${opt.color}`}>{opt.badge}</span>;
      })}
    </div>
  );
}

function InfotypeCheckboxes({ value = [], onChange }) {
  const toggle = (key) => { const next = value.includes(key) ? value.filter(k => k !== key) : [...value, key]; onChange(next); };
  return (
    <div className="grid grid-cols-1 gap-2">
      {INFOTYPE_OPTIONS.map(opt => (
        <label key={opt.key} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition ${value.includes(opt.key) ? "bg-slate-50 border-slate-400" : "bg-white border-slate-200 hover:border-slate-300"}`}>
          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition ${value.includes(opt.key) ? "bg-slate-700 border-slate-700" : "border-slate-300"}`}>
            {value.includes(opt.key) && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <input type="checkbox" className="sr-only" checked={value.includes(opt.key)} onChange={() => toggle(opt.key)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`text-xs font-bold px-1.5 py-0 rounded border ${opt.color}`}>{opt.badge}</span>
              <p className="text-sm font-medium text-slate-700 leading-tight">{opt.label}</p>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{opt.tip}</p>
          </div>
        </label>
      ))}
    </div>
  );
}

const PlusIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>;
const EditIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>;
const CopyIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const DownloadIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
const FilterIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>;
const ChevronDown = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>;
const CheckIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>;
const XIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const ListIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
const GridIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const LockIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const UnlockIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>;

// ─── localStorage helpers ───
const STORAGE_KEY = "wt-scout-clients";
const loadClients = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { console.warn("Failed to load saved clients:", e); }
  return null;
};
const saveClients = (clients) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clients)); } catch (e) { console.warn("Failed to save clients:", e); }
};
const ACTIVE_KEY = "wt-scout-active-client";
const loadActiveId = () => { try { return localStorage.getItem(ACTIVE_KEY) || null; } catch { return null; } };
const saveActiveId = (id) => { try { localStorage.setItem(ACTIVE_KEY, id); } catch {} };

const makeClientId = () => `cl-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

const defaultClient = () => ({
  id: makeClientId(),
  name: "Demo Client",
  industry: "salaried",
  records: PRELOADED.map(r => ({ ...r, id: mkId() })),
  createdAt: Date.now(),
});

const UsersIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;

// ─── Main App ───
export default function App() {
  // ─── Multi-Client State ───
  const [clients, setClients] = useState(() => loadClients() || [defaultClient()]);
  const [activeClientId, setActiveClientId] = useState(() => {
    const saved = loadActiveId();
    const initial = loadClients();
    if (initial && saved && initial.find(c => c.id === saved)) return saved;
    return (initial && initial[0]?.id) || clients[0]?.id;
  });
  const [showClientManager, setShowClientManager] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientIndustry, setNewClientIndustry] = useState("salaried");
  const [renamingClientId, setRenamingClientId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Active client derived state
  const activeClient = clients.find(c => c.id === activeClientId) || clients[0];
  const records = activeClient?.records || [];
  const setRecords = (updater) => {
    setClients(prev => {
      const next = prev.map(c => c.id === activeClientId ? { ...c, records: typeof updater === "function" ? updater(c.records) : updater } : c);
      saveClients(next);
      return next;
    });
  };

  // Persist active client selection
  const switchClient = (id) => { setActiveClientId(id); saveActiveId(id); setEditing(null); setShowForm(false); setForm(emptyRecord()); };
  const addClient = () => {
    if (!newClientName.trim()) return;
    const nc = { id: makeClientId(), name: newClientName.trim(), industry: newClientIndustry, records: PRELOADED.map(r => ({ ...r, id: mkId() })), createdAt: Date.now() };
    const next = [...clients, nc];
    setClients(next);
    saveClients(next);
    switchClient(nc.id);
    setNewClientName("");
    setNewClientIndustry("salaried");
  };
  const deleteClient = (id) => {
    if (clients.length <= 1) return;
    const next = clients.filter(c => c.id !== id);
    setClients(next);
    saveClients(next);
    if (activeClientId === id) switchClient(next[0].id);
  };
  const renameClient = (id) => {
    if (!renameValue.trim()) return;
    const next = clients.map(c => c.id === id ? { ...c, name: renameValue.trim() } : c);
    setClients(next);
    saveClients(next);
    setRenamingClientId(null);
    setRenameValue("");
  };
  const updateClientIndustry = (industry) => {
    const next = clients.map(c => c.id === activeClientId ? { ...c, industry } : c);
    setClients(next);
    saveClients(next);
  };

  // ─── MAPD Import State ───
  const [showImportAward, setShowImportAward] = useState(false);
  const [awardSearch, setAwardSearch] = useState("");
  const [selectedAward, setSelectedAward] = useState(null);
  const [mapdLoading, setMapdLoading] = useState(false);
  const [mapdError, setMapdError] = useState("");
  const [mapdResults, setMapdResults] = useState(null); // { penalties: [], wageAllowances: [], expenseAllowances: [], classifications: [] }
  const [mapdPreview, setMapdPreview] = useState([]); // mapped WT records ready to import (NEW only)
  const [mapdMatched, setMapdMatched] = useState({ standard: [], additional: [] }); // tiered matches
  const [mapdExtOptional, setMapdExtOptional] = useState([]); // remaining extended pack WTs not required by award
  const [importAdditional, setImportAdditional] = useState(true); // toggle: include additional in import
  const [importExtended, setImportExtended] = useState(false); // toggle: include optional extended pack
  const [mapdStep, setMapdStep] = useState("select"); // "select" | "loading" | "preview" | "done"

  const filteredAwards = awardSearch
    ? COMMON_AWARDS.filter(a => a.title.toLowerCase().includes(awardSearch.toLowerCase()) || a.code.toLowerCase().includes(awardSearch.toLowerCase()))
    : COMMON_AWARDS;

  const resetImport = () => {
    setShowImportAward(false);
    setSelectedAward(null);
    setMapdResults(null);
    setMapdPreview([]);
    setMapdMatched({ standard: [], additional: [] });
    setMapdExtOptional([]);
    setImportAdditional(true);
    setImportExtended(false);
    setMapdStep("select");
    setMapdError("");
    setAwardSearch("");
  };

  const fetchAwardData = async (award) => {
    setSelectedAward(award);
    setMapdStep("loading");
    setMapdLoading(true);
    setMapdError("");

    try {
      // Fetch all data types for this award in parallel
      // FWC MAPD API: https://api.fwc.gov.au/api/v1/awards/{code}/...
      const errors = [];
      const tryFetch = async (label, path, params) => {
        try {
          const data = await fetchMapd(path, params);
          return { label, data, ok: true };
        } catch (err) {
          errors.push(`${label}: ${err.message}`);
          return { label, data: [], ok: false };
        }
      };

      const [penRes, wageRes, expRes, classRes] = await Promise.all([
        tryFetch("Penalties", `/awards/${award.code}/penalties`, { page: "1", limit: "100" }),
        tryFetch("Wage Allowances", `/awards/${award.code}/wage-allowances`, { page: "1", limit: "100" }),
        tryFetch("Expense Allowances", `/awards/${award.code}/expense-allowances`, { page: "1", limit: "100" }),
        tryFetch("Classifications", `/awards/${award.code}/classifications`, { page: "1", limit: "100" }),
      ]);

      // The MAPD API may return data in .results, .data, .items, or as a top-level array
      const extractArr = (res) => {
        if (!res.ok) return [];
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (d?.results && Array.isArray(d.results)) return d.results;
        if (d?.data && Array.isArray(d.data)) return d.data;
        if (d?.items && Array.isArray(d.items)) return d.items;
        // If it's an object with numbered keys or other structure, try to find an array
        const vals = Object.values(d || {});
        const firstArr = vals.find(v => Array.isArray(v));
        if (firstArr) return firstArr;
        return [];
      };

      const penalties = extractArr(penRes);
      const wageAllowances = extractArr(wageRes);
      const expenseAllowances = extractArr(expRes);
      const classifications = extractArr(classRes);

      const results = { penalties, wageAllowances, expenseAllowances, classifications };
      setMapdResults(results);

      // Build pack-aware code sets for tiered matching
      const stdCodes = profile.standardCodes; // Set of codes in Standard Pack
      const allPreloadedCodes = new Set(PRELOADED.map(r => r.legacyCode)); // Full catalogue
      const extOnlyCodes = new Set([...allPreloadedCodes].filter(c => !stdCodes.has(c))); // Extended-only

      // Build mapped WTs — deduplicate, then split into tiers
      const allMapped = [];
      const seen = new Set();
      const addIfNew = (wt) => {
        const key = `${wt.legacyCode}|${wt.clientName}`;
        if (!seen.has(key)) { seen.add(key); allMapped.push(wt); }
      };

      // Map penalties — deduplicate by penalty_fixed_id to avoid one WT per classification
      const seenPenalties = new Set();
      penalties.forEach(p => {
        const penKey = p.penalty_fixed_id || p.penalty_description || JSON.stringify(p);
        if (seenPenalties.has(penKey)) return;
        seenPenalties.add(penKey);
        const m = mapPenaltyToWT(p);
        addIfNew(buildWTFromMapd(m, award.code, award.title, `${p.penalty_description || ""} — Rate: ${p.rate || ""}%`));
      });

      // Map wage allowances — deduplicate by wage_allowance_fixed_id
      const seenWageAllow = new Set();
      wageAllowances.forEach(a => {
        const key = a.wage_allowance_fixed_id || a.allowance || JSON.stringify(a);
        if (seenWageAllow.has(key)) return;
        seenWageAllow.add(key);
        const m = mapAllowanceToWT(a, false);
        addIfNew(buildWTFromMapd(m, award.code, award.title, `Wage allowance: $${a.allowance_amount || "TBD"} ${a.payment_frequency || ""}`));
      });

      // Map expense allowances — deduplicate by expense_allowance_fixed_id
      const seenExpAllow = new Set();
      expenseAllowances.forEach(a => {
        const key = a.expense_allowance_fixed_id || a.allowance || JSON.stringify(a);
        if (seenExpAllow.has(key)) return;
        seenExpAllow.add(key);
        const m = mapAllowanceToWT(a, true);
        addIfNew(buildWTFromMapd(m, award.code, award.title, `Expense allowance: $${a.allowance_amount || "TBD"} ${a.payment_frequency || ""}`));
      });

      // Four-tier split:
      // 1. Standard Pack — award component maps to a WT in the standard pack (included)
      // 2. Additional (Award-Required) — award component maps to a WT in extended pack (upsell)
      // 3. Extended Optional — remaining extended pack WTs NOT required by this award (optional upsell)
      // 4. New / Custom — not in any pack, needs custom SAP config
      const tierStd = [];
      const tierAdditional = [];
      const tierNew = [];
      const awardMappedExtCodes = new Set(); // track which extended codes the award uses

      allMapped.forEach(wt => {
        if (stdCodes.has(wt.legacyCode)) {
          const existingRec = PRELOADED.find(r => r.legacyCode === wt.legacyCode);
          tierStd.push({ ...wt, _matchedTo: existingRec?.clientName || wt.legacyCode, _tier: "standard" });
        } else if (extOnlyCodes.has(wt.legacyCode)) {
          awardMappedExtCodes.add(wt.legacyCode);
          const existingRec = PRELOADED.find(r => r.legacyCode === wt.legacyCode);
          tierAdditional.push({ ...wt, _matchedTo: existingRec?.clientName || wt.legacyCode, _tier: "additional" });
        } else {
          tierNew.push({ ...wt, _tier: "new" });
        }
      });

      // Build Extended Optional: all extended pack WTs NOT already required by this award
      const extOptional = PRELOADED
        .filter(r => extOnlyCodes.has(r.legacyCode) && !awardMappedExtCodes.has(r.legacyCode))
        .map(r => ({ ...r, id: Date.now().toString() + Math.random().toString(36).slice(2, 8), _tier: "ext-optional" }));

      setMapdMatched({ standard: tierStd, additional: tierAdditional });
      setMapdExtOptional(extOptional);
      setMapdPreview(tierNew);
      setMapdStep("preview");

      if (tierNew.length === 0 && tierStd.length === 0 && tierAdditional.length === 0 && penalties.length === 0 && wageAllowances.length === 0 && expenseAllowances.length === 0) {
        setMapdError(
          errors.length > 0
            ? `API returned errors for some endpoints:\n${errors.join("\n")}`
            : "No data returned from the MAPD API. Check the FWC developer portal for the correct paths."
        );
      } else if (errors.length > 0) {
        setMapdError(`Some endpoints had errors (data from others was used):\n${errors.join("\n")}`);
      }
    } catch (err) {
      setMapdError(err.message);
      setMapdStep("select");
    } finally {
      setMapdLoading(false);
    }
  };

  const importCount = mapdPreview.length + (importAdditional ? mapdMatched.additional.length : 0) + (importExtended ? mapdExtOptional.length : 0);

  const confirmImport = () => {
    if (importCount === 0) return;
    const toImport = [...mapdPreview]; // always import genuinely new
    if (importAdditional) {
      mapdMatched.additional.forEach(wt => {
        // Use the pre-configured PRELOADED version (full SAP config), not the MAPD-mapped stub
        const preloaded = PRELOADED.find(r => r.legacyCode === wt.legacyCode);
        if (preloaded) {
          toImport.push({ ...preloaded, id: Date.now().toString() + Math.random().toString(36).slice(2, 8), status: "Draft", notes: `Award-required (${selectedAward?.code}). ${preloaded.notes || ""}`.trim() });
        } else {
          toImport.push(wt);
        }
      });
    }
    if (importExtended) {
      mapdExtOptional.forEach(wt => {
        toImport.push({ ...wt, status: "Draft", notes: `Extended Pack optional (${selectedAward?.code}). ${wt.notes || ""}`.trim() });
      });
    }
    setRecords(prev => [...prev, ...toImport]);
    setMapdStep("done");
    setTimeout(() => resetImport(), 2000);
  };

  // ─── EA/EBA PDF Import State ───
  const [showImportEA, setShowImportEA] = useState(false);
  const [eaFile, setEaFile] = useState(null);
  const [eaLoading, setEaLoading] = useState(false);
  const [eaError, setEaError] = useState("");
  const [eaStep, setEaStep] = useState("upload"); // "upload" | "loading" | "preview" | "done"
  const [eaParsed, setEaParsed] = useState([]); // raw parsed wage types from AI
  const [eaTierStd, setEaTierStd] = useState([]);
  const [eaTierAdd, setEaTierAdd] = useState([]);
  const [eaTierExtOpt, setEaTierExtOpt] = useState([]);
  const [eaTierNew, setEaTierNew] = useState([]);
  const [eaImportAdd, setEaImportAdd] = useState(true);
  const [eaImportExt, setEaImportExt] = useState(false);
  const eaFileRef = useRef(null);

  const eaImportCount = eaTierNew.length + (eaImportAdd ? eaTierAdd.length : 0) + (eaImportExt ? eaTierExtOpt.length : 0);

  const resetEAImport = () => {
    setShowImportEA(false); setEaFile(null); setEaLoading(false); setEaError("");
    setEaStep("upload"); setEaParsed([]); setEaTierStd([]); setEaTierAdd([]);
    setEaTierExtOpt([]); setEaTierNew([]); setEaImportAdd(true); setEaImportExt(false);
  };

  const handleEAFile = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") { setEaFile(file); setEaError(""); }
    else { setEaError("Please select a PDF file."); setEaFile(null); }
  };

  const processEA = async () => {
    if (!eaFile) return;
    setEaStep("loading"); setEaLoading(true); setEaError("");

    try {
      // Step 1: Get API key from server (< 1 second, within Hobby timeout)
      const cfgRes = await fetch("/api/ea-config");
      const cfg = await cfgRes.json();
      if (cfg.error) { setEaError(cfg.error); setEaStep("upload"); return; }
      const anthropicKey = cfg.k;
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(eaFile);
      });

      const EA_SYSTEM_PROMPT = `You are an expert Australian payroll consultant specialising in SAP ECP wage type configuration. You are analysing an Enterprise Agreement (EA) or Enterprise Bargaining Agreement (EBA) to extract all pay components that would need to be configured as SAP wage types.

For each pay component you identify, return a JSON object with these fields:
- code: suggested SAP wage type code from this standard list where applicable:
  1001=Annual Salary, 1101=Basic Salary, 1401=Hourly Rate, 1402=Casual Loading, 1500=Higher Duties,
  2000=Ordinary Pay, 2100=Meal Allowance, 2110=OT@1.0, 2115=OT@1.5, 2120=OT@2.0, 2125=OT@2.5, 2130=OT@3.0,
  2200=Shift Allowance, 2203=15%Shift, 2237=17.5%Shift, 2240=20%Shift, 2245=25%Shift, 2300=On-Call,
  2401=Car Mileage, 2405=Public Holiday, 2500=Annual Leave, 2502=Leave Loading, 2520=TOIL,
  2600=Personal Leave, 2700=LSL, 2821=Maternity Paid, 2833=Compassionate, 2860=Jury Duty,
  2910=LWOP, 3000=Bonus, 3050=Commission, 3500=Directors Fees, 3900=Pay Adjustment,
  4200=Car Allowance, 4205=First Aid, 4210=LAFHA, 4215=Housing, 4220=Telephone, 4225=Uniform,
  4230=Travel, 5080=Severance, 5082=PILN, 7001=Extra Tax, 7701=Union, 7710=Garnishment, 7801=Child Support,
  7815=Novated Lease, 8200=Super ER, 8210=Super EE Post, 8211=Super EE Pre, 9900=Payroll Tax, 9901=Workers Comp.
  Use "NEW" + a descriptive suffix for components not matching any standard code.
- name: descriptive pay component name
- category: one of the standard SAP categories (Earnings - Base Pay, Earnings - Allowance, Earnings - Overtime, Earnings - Penalty / Shift Loading, Earnings - Leave Loading, Leave - Annual Leave, Leave - Personal / Carer's Leave, Leave - Long Service Leave, Leave - Parental Leave, Leave - Other Leave, Deductions - Post-Tax, Deductions - Salary Sacrifice, Deductions - Union / Association Fees, Superannuation - SG Contribution, Employer Cost - Payroll Tax, Employer Cost - Workers Compensation, Earnings - Termination / ETP, Earnings - Other, Informational / Memo Only)
- description: what the EA says about this component (clause reference, entitlement details)
- amountType: Fixed Amount per Pay Period | Hourly Rate × Hours | Annual Amount (prorated) | Percentage of Base Pay | Percentage of OTE | Units × Rate | Lump Sum / One-Off | System Calculated
- frequency: Every Pay Run | Ad Hoc / On Demand | On Termination Only | Annually
- taxTreatment: Subject to PAYG Withholding | PAYG Exempt | ETP - Life Benefit | Salary Sacrifice (Pre-Tax) | Not Applicable
- oteClassification: OTE - Included | OTE - Excluded | Partially OTE (see notes) | Not Applicable
- stp2PaymentType: best match from STP2 payment types
- legislativeRef: clause number(s) from the EA
- priority: Must Have | Should Have | Nice to Have
- notes: additional configuration notes, rates, thresholds, conditions

Extract EVERY pay component — earnings, allowances, overtime, penalties, shift loadings, leave, deductions, super, termination. Include specific rates and percentages. Flag anything differing from NES.

Return ONLY a valid JSON array. No markdown, no backticks, no explanation.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: EA_SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
              { type: "text", text: `Analyse this Enterprise Agreement "${eaFile.name}" and extract all pay components as structured wage type records. Return a JSON array only.` },
            ],
          }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 401) { setEaError("Anthropic API key is invalid or expired. Check ANTHROPIC_API_KEY in Vercel Environment Variables."); }
        else { setEaError(`API error (${res.status}): ${errText.substring(0, 300)}`); }
        setEaStep("upload"); return;
      }

      const data = await res.json();
      const textBlock = data.content?.find(b => b.type === "text");
      const rawText = textBlock?.text || "";
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      let wageTypes;
      try { wageTypes = JSON.parse(cleaned); }
      catch (parseErr) {
        // AI may have run out of tokens — try to recover truncated JSON array
        // Find the last complete object (ending with }) and close the array
        const lastBrace = cleaned.lastIndexOf("}");
        if (lastBrace > 0) {
          const truncated = cleaned.substring(0, lastBrace + 1);
          // Ensure it starts with [ and close with ]
          const candidate = truncated.trimStart().startsWith("[") ? truncated + "]" : "[" + truncated + "]";
          try {
            wageTypes = JSON.parse(candidate);
            setEaError(`Note: AI response was truncated — recovered ${wageTypes.length} wage types. Very large EAs may not capture every component in a single pass.`);
          } catch {
            setEaError(`AI response wasn't valid JSON. Try again.\n\nStart: ${cleaned.substring(0, 200)}...`);
            setEaStep("upload"); return;
          }
        } else {
          setEaError(`AI response wasn't valid JSON. Try again.\n\nStart: ${cleaned.substring(0, 200)}...`);
          setEaStep("upload"); return;
        }
      }
      if (!Array.isArray(wageTypes)) { wageTypes = []; }
      setEaParsed(wageTypes);

      // Tier split — same logic as MAPD import
      const stdCodes = profile.standardCodes;
      const allPreloadedCodes = new Set(PRELOADED.map(r => r.legacyCode));
      const extOnlyCodes = new Set([...allPreloadedCodes].filter(c => !stdCodes.has(c)));
      const awardMappedExtCodes = new Set();

      const tStd = [], tAdd = [], tNew = [];
      wageTypes.forEach(wt => {
        const code = wt.code || "";
        const record = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
          clientName: wt.name || "Unnamed",
          legacyCode: code,
          category: wt.category || "Earnings - Other",
          description: wt.description || "",
          amountType: wt.amountType || "",
          frequency: wt.frequency || "Every Pay Run",
          taxTreatment: wt.taxTreatment || "Subject to PAYG Withholding",
          stp2IncomeType: "Salary and Wages",
          stp2PaymentType: wt.stp2PaymentType || "Not Applicable",
          oteClassification: wt.oteClassification || "OTE - Excluded",
          applicableState: "National",
          legislativeRef: wt.legislativeRef || "",
          priority: wt.priority || "Should Have",
          status: "Draft",
          notes: `EA Import (${eaFile.name}). ${wt.notes || ""}`.trim(),
          prcl: { p01: "0", p20: "3", p21: "0", p32: "0" },
          sapNote: "AI-extracted from EA — consultant to verify SAP processing classes.",
          ccls: wt.oteClassification === "OTE - Included"
            ? ["totalGross", "taxableGross", "superBase", "payrollTax", "workersComp", "helpBase"]
            : ["totalGross", "taxableGross", "payrollTax", "helpBase"],
          infotype: [],
        };

        if (stdCodes.has(code)) {
          const existing = PRELOADED.find(r => r.legacyCode === code);
          tStd.push({ ...record, _matchedTo: existing?.clientName || code, _tier: "standard" });
        } else if (extOnlyCodes.has(code)) {
          awardMappedExtCodes.add(code);
          const existing = PRELOADED.find(r => r.legacyCode === code);
          tAdd.push({ ...record, _matchedTo: existing?.clientName || code, _tier: "additional" });
        } else {
          tNew.push({ ...record, _tier: "new" });
        }
      });

      const extOpt = PRELOADED
        .filter(r => extOnlyCodes.has(r.legacyCode) && !awardMappedExtCodes.has(r.legacyCode))
        .map(r => ({ ...r, id: Date.now().toString() + Math.random().toString(36).slice(2, 8), _tier: "ext-optional" }));

      setEaTierStd(tStd); setEaTierAdd(tAdd); setEaTierExtOpt(extOpt); setEaTierNew(tNew);
      setEaStep("preview");
    } catch (err) {
      setEaError(err.message);
      setEaStep("upload");
    } finally {
      setEaLoading(false);
    }
  };

  const confirmEAImport = () => {
    if (eaImportCount === 0) return;
    const toImport = [...eaTierNew];
    if (eaImportAdd) {
      eaTierAdd.forEach(wt => {
        const preloaded = PRELOADED.find(r => r.legacyCode === wt.legacyCode);
        if (preloaded) {
          toImport.push({ ...preloaded, id: Date.now().toString() + Math.random().toString(36).slice(2, 8), status: "Draft", notes: `EA-required (${eaFile?.name}). ${preloaded.notes || ""}`.trim() });
        } else { toImport.push(wt); }
      });
    }
    if (eaImportExt) {
      eaTierExtOpt.forEach(wt => {
        toImport.push({ ...wt, status: "Draft", notes: `Extended Pack optional (${eaFile?.name}). ${wt.notes || ""}`.trim() });
      });
    }
    setRecords(prev => [...prev, ...toImport]);
    setEaStep("done");
    setTimeout(() => resetEAImport(), 2000);
  };

  // ─── WT Form State ───
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPrcl21, setFilterPrcl21] = useState("");
  const [filterInfotype, setFilterInfotype] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("table");
  const [expandedCard, setExpandedCard] = useState(null);
  const formRef = useRef(null);
  const [form, setForm] = useState(emptyRecord());
  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updatePrcl = (key, value) => setForm((prev) => ({ ...prev, prcl: { ...prev.prcl, [key]: value } }));
  const isValid = form.clientName && form.category && form.description;

  // ─── Industry Pack State ───
  const selectedIndustry = activeClient?.industry || "salaried";
  const setSelectedIndustry = (ind) => updateClientIndustry(ind);
  const [packMode, setPackMode] = useState("standard");
  const profile = INDUSTRY_PROFILES[selectedIndustry];

  const packFiltered = useMemo(() => {
    const stdCodes = profile.standardCodes;
    if (packMode === "standard") return records.filter(r => stdCodes.has(r.legacyCode));
    // "extended" = standard + extras = full catalogue
    return records;
  }, [records, packMode, profile]);

  const packStats = useMemo(() => {
    const stdCodes = profile.standardCodes;
    const stdCount = records.filter(r => stdCodes.has(r.legacyCode)).length;
    const extCount = records.length - stdCount;
    return { stdCount, extCount, totalCount: records.length };
  }, [records, profile]);

  // Reset client's catalogue back to the default industry pack WTs (removes all imports)
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const resetToStandardPack = () => {
    const stdCodes = profile.standardCodes;
    const standardWTs = PRELOADED.filter(r => stdCodes.has(r.legacyCode));
    setRecords(standardWTs);
    setPackMode("standard");
    setShowResetConfirm(false);
  };

  const resetToExtendedPack = () => {
    setRecords([...PRELOADED]);
    setPackMode("standard");
    setShowResetConfirm(false);
  };

  // Full factory reset — clears all clients, all data, back to day one
  const factoryReset = () => {
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(ACTIVE_KEY); } catch {}
    const fresh = defaultClient();
    setClients([fresh]);
    setActiveClientId(fresh.id);
    setPackMode("standard");
    setShowResetConfirm(false);
  };

  // Count how many imported (non-preloaded) WTs exist
  const importedCount = useMemo(() => {
    const preloadedCodes = new Set(PRELOADED.map(r => r.legacyCode));
    return records.filter(r => !preloadedCodes.has(r.legacyCode)).length;
  }, [records]);

  const handleSave = () => {
    if (!isValid) return;
    if (editing) { setRecords((p) => p.map((r) => r.id === editing ? { ...form } : r)); setEditing(null); }
    else { setRecords((p) => [...p, { ...form }]); }
    setForm(emptyRecord()); setShowForm(false);
  };
  const handleEdit = (rec) => { setForm({ ...rec, prcl: rec.prcl || { p01:"-", p20:"-", p21:"-", p32:"-" } }); setEditing(rec.id); setShowForm(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); };
  const handleDuplicate = (rec) => { setRecords((p) => [...p, { ...rec, id: Date.now().toString() + Math.random().toString(36).slice(2), clientName: rec.clientName + " (copy)", status: "Draft" }]); };
  const handleDelete = (id) => { setRecords((p) => p.filter((r) => r.id !== id)); if (editing === id) { setEditing(null); setShowForm(false); setForm(emptyRecord()); } };
  const handleCancel = () => { setEditing(null); setShowForm(false); setForm(emptyRecord()); };
  const toggleStatus = (id) => { setRecords((p) => p.map((r) => r.id === id ? { ...r, status: r.status === "Draft" ? "Confirmed" : r.status === "Confirmed" ? "Query" : "Draft" } : r)); };

  const filtered = packFiltered.filter((r) => {
    if (filterCat && !r.category.startsWith(filterCat)) return false;
    if (filterPriority && r.priority !== filterPriority) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterPrcl21 && (r.prcl?.p21 || "-") !== filterPrcl21) return false;
    if (filterInfotype && !(r.infotype||[]).includes(filterInfotype)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return r.clientName.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) ||
        r.legacyCode.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q) || (r.legislativeRef||"").toLowerCase().includes(q) ||
        (r.sapNote||"").toLowerCase().includes(q);
    }
    return true;
  });

  // ─── CSV File Download ───
  const downloadCSV = () => {
    try {
      const h = [
        "Client","Industry Pack","Pack Tier","SAP WT Code","Pay Component Name","Category","Description","Amount Type","Frequency",
        "Tax Treatment","STP2 Income Type","STP2 Payment Type","OTE Classification",
        "State / Territory","Legislative Reference","Priority","Status",
        "PRCL 01 Code","PRCL 01 — SAP Configuration",
        "PRCL 20 Code","PRCL 20 — SAP Configuration",
        "PRCL 21 Code","PRCL 21 — SAP Configuration",
        "PRCL 32 Code","PRCL 32 — SAP Configuration",
        "Payroll Cumulations (Plain English)","Payroll Cumulations (SAP /1xx References)",
        "SAP Entry Point — Infotype (Plain English)","SAP Entry Point — Infotype (SAP Reference)",
        "SAP Config Note","Notes"
      ];
      const rows = [h.join(","), ...filtered.map((r) => {
        const cclsLabels = (r.ccls||[]).map(k => CCLS_OPTIONS.find(o=>o.key===k)?.label || k).join(" | ");
        const cclsExport = (r.ccls||[]).map(k => CCLS_OPTIONS.find(o=>o.key===k)?.exportLabel || k).join(" | ");
        const itLabels = (r.infotype||[]).map(k => INFOTYPE_OPTIONS.find(o=>o.key===k)?.label || k).join(" | ");
        const itExport = (r.infotype||[]).map(k => INFOTYPE_OPTIONS.find(o=>o.key===k)?.exportLabel || k).join(" | ");
        const tier = profile.standardCodes.has(r.legacyCode) ? "Standard" : "Extended";
        return [
          activeClient.name, profile.name, tier,
          r.legacyCode, r.clientName, r.category, r.description, r.amountType, r.frequency,
          r.taxTreatment, r.stp2IncomeType, r.stp2PaymentType, r.oteClassification,
          r.applicableState, r.legislativeRef, r.priority, r.status,
          r.prcl?.p01||"", prclLookup(PRCL01_OPTIONS, r.prcl?.p01||"", "exportLabel"),
          r.prcl?.p20||"", prclLookup(PRCL20_OPTIONS, r.prcl?.p20||"", "exportLabel"),
          r.prcl?.p21||"", prclLookup(PRCL21_OPTIONS, r.prcl?.p21||"", "exportLabel"),
          r.prcl?.p32||"", prclLookup(PRCL32_OPTIONS, r.prcl?.p32||"", "exportLabel"),
          cclsLabels, cclsExport, itLabels, itExport,
          r.sapNote||"", r.notes
        ].map((v) => `"${(v||"").replace(/"/g,'""')}"`).join(",");
      })];
      const csvString = rows.join("\n");
      // BOM prefix for Excel to detect UTF-8
      const bom = "\uFEFF";
      const blob = new Blob([bom + csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0,10);
      const packLabel = packMode === "standard" ? "Standard" : "Extended";
      const safeName = activeClient.name.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-");
      link.href = url;
      link.download = `${safeName}_WageTypes_${packLabel}_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) { console.error("Export error:", e); }
  };

  const catGroups = ["Earnings","Deductions","Leave","Superannuation","Employer Cost","Informational"];
  const stats = {
    total: filtered.length,
    confirmed: filtered.filter(r => r.status === "Confirmed").length,
    draft: filtered.filter(r => r.status === "Draft").length,
    query: filtered.filter(r => r.status === "Query").length,
    mustHave: filtered.filter(r => r.priority === "Must Have").length,
    withSapNotes: filtered.filter(r => r.sapNote && r.sapNote.length > 0).length,
  };
  const catColor = (c) => c.startsWith("Earnings") ? "blue" : c.startsWith("Deductions") ? "red" : c.startsWith("Leave") ? "green" : c.startsWith("Super") ? "indigo" : c.startsWith("Employer") ? "amber" : "slate";
  const statusColor = (s) => s === "Confirmed" ? "green" : s === "Query" ? "amber" : "slate";
  const priorityColor = (p) => p === "Must Have" ? "red" : p === "Should Have" ? "amber" : "slate";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #f5f0eb 100%)", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <header className="sticky top-0 z-30 border-b" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderColor: "#e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #004F9E, #0063DB)" }}>
                  <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v3l2 2"/></svg>
                </div>
                <h1 className="text-xl font-bold" style={{ color: "#17245F" }}>WT Scout</h1>
                <Badge color="blue">Activate · Explore</Badge>
              </div>
              <p className="text-sm text-slate-500 ml-11">Wage Type Requirements Capture · Zalaris Activate Methodology</p>
            </div>
            <div className="flex items-center gap-2 ml-11 sm:ml-0">
              <button onClick={() => setShowImportAward(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition" style={{ borderColor: "#059669", color: "#059669" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7"/><path d="M16 5V1m0 0l4 4m-4-4l-4 4"/></svg>
                Import Award
              </button>
              <button onClick={() => setShowImportEA(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition" style={{ borderColor: "#7c3aed", color: "#7c3aed" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6m-3 3l3-3 3 3"/></svg>
                Import EA
              </button>
              <button onClick={downloadCSV} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition disabled:opacity-40" style={{ borderColor: "#cbd5e1", color: "#475569" }}><DownloadIcon /> Download CSV</button>
              <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-rose-200 text-rose-500 hover:bg-rose-50 transition">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                Reset
              </button>
              <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyRecord()); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md hover:shadow-lg transition" style={{ background: "linear-gradient(135deg, #004F9E, #0063DB)" }}><PlusIcon /> Add WT</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ═══ CLIENT SELECTOR BAR ═══ */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100" style={{ background: "linear-gradient(135deg, #17245F, #004F9E)" }}>
            <UsersIcon />
            <span className="text-sm font-bold text-white">Client</span>
            <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar">
              {clients.map(c => (
                <button key={c.id} onClick={() => switchClient(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${c.id === activeClientId ? "bg-white text-slate-800 shadow-sm" : "bg-white/15 text-white/80 hover:bg-white/25"}`}>
                  <span>{INDUSTRY_PROFILES[c.industry]?.icon || "💼"}</span>
                  {c.name}
                  <span className={`ml-0.5 px-1.5 py-0 rounded-full text-xs ${c.id === activeClientId ? "bg-slate-200 text-slate-600" : "bg-white/20 text-white/70"}`}>{c.records.length}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowClientManager(!showClientManager)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/15 text-white hover:bg-white/25 transition whitespace-nowrap flex items-center gap-1">
              <PlusIcon /> Manage
            </button>
          </div>

          {/* Client Manager Panel */}
          {showClientManager && (
            <div className="p-4 border-b border-slate-100 space-y-4" style={{ background: "#f8fafc" }}>
              {/* Add new client */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-medium text-slate-600 mb-1">New Client Name</label>
                  <input type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="e.g. Acme Corp Australia" onKeyDown={e => e.key === "Enter" && addClient()}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition" />
                </div>
                <div className="min-w-[160px]">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Industry</label>
                  <select value={newClientIndustry} onChange={e => setNewClientIndustry(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition">
                    {Object.values(INDUSTRY_PROFILES).map(p => <option key={p.key} value={p.key}>{p.icon} {p.name}</option>)}
                  </select>
                </div>
                <button onClick={addClient} disabled={!newClientName.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm disabled:opacity-40 transition" style={{ background: "linear-gradient(135deg, #004F9E, #0063DB)" }}>
                  Create Client
                </button>
              </div>
              {/* Client list */}
              <div className="space-y-2">
                {clients.map(c => {
                  const cp = INDUSTRY_PROFILES[c.industry] || INDUSTRY_PROFILES.salaried;
                  return (
                    <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border transition ${c.id === activeClientId ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-white"}`}>
                      <span className="text-lg">{cp.icon}</span>
                      <div className="flex-1 min-w-0">
                        {renamingClientId === c.id ? (
                          <div className="flex items-center gap-2">
                            <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === "Enter" && renameClient(c.id)} autoFocus
                              className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none" />
                            <button onClick={() => renameClient(c.id)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Save</button>
                            <button onClick={() => setRenamingClientId(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                        )}
                        <p className="text-xs text-slate-400">{cp.name} · {c.records.length} WTs · Created {new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {c.id !== activeClientId && (
                          <button onClick={() => switchClient(c.id)} className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition">Switch</button>
                        )}
                        {c.id === activeClientId && <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-600 text-white">Active</span>}
                        <button onClick={() => { setRenamingClientId(c.id); setRenameValue(c.name); }} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition" title="Rename"><EditIcon /></button>
                        {clients.length > 1 && (
                          <button onClick={() => { if (window.confirm(`Delete "${c.name}" and all its wage types?`)) deleteClient(c.id); }}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition" title="Delete client"><TrashIcon /></button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ═══ INDUSTRY SELECTOR ═══ */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #f8fafc, #f0f4f8)" }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: "#17245F" }}>Industry Profile</span>
              <span className="text-xs text-slate-400">Select to pre-filter wage types for {activeClient.name}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {Object.values(INDUSTRY_PROFILES).map(p => (
                <button key={p.key} onClick={() => { setSelectedIndustry(p.key); setPackMode("standard"); }}

                  className={`p-3 rounded-xl border-2 text-left transition-all ${selectedIndustry === p.key ? "shadow-md" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                  style={selectedIndustry === p.key ? { borderColor: p.color, background: p.bgLight } : {}}>
                  <div className="text-xl mb-1">{p.icon}</div>
                  <p className="text-xs font-bold leading-tight" style={{ color: selectedIndustry === p.key ? p.color : "#334155" }}>{p.name}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3 px-1">{profile.description}</p>
          </div>
        </div>

        {/* ═══ PACK TIER SELECTOR ═══ */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1">
                {[
                  { key: "standard", label: "Standard Pack", icon: <LockIcon />, count: packStats.stdCount },
                  { key: "extended", label: "Extended Pack", icon: <UnlockIcon />, count: packStats.totalCount },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setPackMode(opt.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${packMode === opt.key ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
                    {opt.icon} {opt.label}
                    <span className={`ml-1 px-1.5 py-0 rounded-full text-xs ${packMode === opt.key ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-500"}`}>{opt.count}</span>
                  </button>
                ))}
              </div>
              <div className="flex-1 text-xs text-slate-500">
                {packMode === "standard" && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: profile.color }}>Included</span>
                    {packStats.stdCount} wage types included in standard contract scope · {profile.name}
                  </span>
                )}
                {packMode === "extended" && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Full Coverage</span>
                    {packStats.stdCount} standard + {packStats.extCount} additional = {packStats.totalCount} total wage types — upsell or pre-package into contract
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { l:"Showing",v:stats.total,a:profile.color },
            { l:"Confirmed",v:stats.confirmed,a:"#059669" },
            { l:"Draft",v:stats.draft,a:"#64748b" },
            { l:"Queries",v:stats.query,a:"#d97706" },
            { l:"Must Have",v:stats.mustHave,a:"#dc2626" },
            { l:"SAP Notes",v:stats.withSapNotes,a:"#7c3aed" },
          ].map(({ l,v,a }) => (
            <div key={l} className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: a }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm overflow-y-auto py-8 px-4" onClick={handleCancel}>
            <div ref={formRef} className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ background: "linear-gradient(135deg, #f8fafc, #f0f4f8)" }}>
                <h2 className="text-lg font-bold" style={{ color: "#17245F" }}>{editing ? "Edit Pay Component" : "New Pay Component"}</h2>
                <button onClick={handleCancel} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"><XIcon /></button>
              </div>
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <fieldset><legend className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: "#004F9E" }}>1</span> Identification</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Pay Component Name" value={form.clientName} onChange={(v) => updateField("clientName", v)} placeholder="e.g. Annual Salary" required />
                    <Input label="Legacy / SAP WT Code" value={form.legacyCode} onChange={(v) => updateField("legacyCode", v)} placeholder="e.g. 1001" />
                    <div className="sm:col-span-2"><Select label="Category" value={form.category} onChange={(v) => updateField("category", v)} options={CATEGORIES} placeholder="Choose category..." required /></div>
                    <div className="sm:col-span-2"><Input label="Description" value={form.description} onChange={(v) => updateField("description", v)} placeholder="Describe the pay component..." required multiline /></div>
                  </div>
                </fieldset>
                <fieldset><legend className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: "#004F9E" }}>2</span> Calculation & Payment</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Amount Type" value={form.amountType} onChange={(v) => updateField("amountType", v)} options={AMOUNT_TYPES} />
                    <Select label="Frequency" value={form.frequency} onChange={(v) => updateField("frequency", v)} options={FREQUENCIES} />
                  </div>
                </fieldset>
                <fieldset><legend className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: "#004F9E" }}>3</span> Tax & Compliance</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Tax Treatment" value={form.taxTreatment} onChange={(v) => updateField("taxTreatment", v)} options={TAX_TREATMENTS} />
                    <Select label="OTE Classification" value={form.oteClassification} onChange={(v) => updateField("oteClassification", v)} options={OTE_OPTIONS} />
                    <Select label="STP2 Income Type" value={form.stp2IncomeType} onChange={(v) => updateField("stp2IncomeType", v)} options={STP2_INCOME_TYPES} />
                    <Select label="STP2 Payment Type" value={form.stp2PaymentType} onChange={(v) => updateField("stp2PaymentType", v)} options={STP2_PAYMENT_TYPES} />
                    <Select label="State / Territory" value={form.applicableState} onChange={(v) => updateField("applicableState", v)} options={STATES} />
                    <Input label="Legislative Reference" value={form.legislativeRef} onChange={(v) => updateField("legislativeRef", v)} placeholder="e.g. NES, FW Act s90" />
                  </div>
                </fieldset>
                <fieldset><legend className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: "#7c3aed" }}>4</span> SAP Processing Classes</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key:"p01",label:"PRCL 01 — Pay Rate Basis",opts:PRCL01_OPTIONS },
                      { key:"p20",label:"PRCL 20 — Gross Totals",opts:PRCL20_OPTIONS },
                      { key:"p21",label:"PRCL 21 — Tax Calculation",opts:PRCL21_OPTIONS },
                      { key:"p32",label:"PRCL 32 — Finance Posting",opts:PRCL32_OPTIONS },
                    ].map(({key,label,opts}) => (
                      <label key={key} className="block">
                        <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
                        <select value={form.prcl?.[key]||"-"} onChange={(e) => updatePrcl(key, e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition">
                          {opts.map(o => <option key={o.value} value={o.value}>{o.value === "-" ? "— Not applicable" : `${o.value} — ${o.label}`}</option>)}
                        </select>
                      </label>
                    ))}
                    <div className="sm:col-span-2"><Input label="SAP Configuration Note" value={form.sapNote||""} onChange={(v) => updateField("sapNote", v)} placeholder="Additional SAP configuration notes..." multiline /></div>
                  </div>
                </fieldset>
                <fieldset><legend className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0ea5e9" }}>5</span> Payroll Totals & Cumulations</legend>
                  <CclsCheckboxes value={form.ccls||[]} onChange={(v) => updateField("ccls", v)} />
                </fieldset>
                <fieldset><legend className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: "#f59e0b" }}>6</span> SAP Entry Point (Infotype)</legend>
                  <InfotypeCheckboxes value={form.infotype||[]} onChange={(v) => updateField("infotype", v)} />
                </fieldset>
                <fieldset><legend className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: "#004F9E" }}>7</span> Status & Notes</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Priority" value={form.priority} onChange={(v) => updateField("priority", v)} options={PRIORITIES} />
                    <Select label="Status" value={form.status} onChange={(v) => updateField("status", v)} options={["Draft","Confirmed","Query"]} />
                    <div className="sm:col-span-2"><Input label="Notes" value={form.notes} onChange={(v) => updateField("notes", v)} placeholder="Any additional notes..." multiline /></div>
                  </div>
                </fieldset>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button onClick={handleCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                <button onClick={handleSave} disabled={!isValid} className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-md disabled:opacity-40 transition" style={{ background: "linear-gradient(135deg, #004F9E, #0063DB)" }}>{editing ? "Update" : "Save"} Pay Component</button>
              </div>
            </div>
          </div>
        )}



        {/* ═══ RESET CONFIRMATION MODAL ═══ */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={() => setShowResetConfirm(false)}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50">
                <div>
                  <h2 className="text-lg font-bold text-rose-800">Reset Wage Types</h2>
                  <p className="text-xs text-rose-600 mt-0.5">{activeClient?.name} · {profile.name}</p>
                </div>
                <button onClick={() => setShowResetConfirm(false)} className="p-1 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition"><XIcon /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-sm text-amber-800">This will remove all imported and manually added wage types and restore the catalogue to a clean pack.</p>
                  {importedCount > 0 && (
                    <p className="text-xs text-amber-600 mt-1">{importedCount} custom/imported WTs will be removed.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <button onClick={resetToStandardPack}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-blue-200 bg-blue-50 hover:border-blue-400 transition text-left">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#004F9E" }}>
                      <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#004F9E" }}>Reset to Standard Pack</p>
                      <p className="text-xs text-slate-500">{PRELOADED.filter(r => profile.standardCodes.has(r.legacyCode)).length} base wage types · Removes all imports and extended WTs</p>
                    </div>
                  </button>

                  <button onClick={resetToExtendedPack}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-violet-200 bg-violet-50 hover:border-violet-400 transition text-left">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-600">
                      <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-violet-700">Reset to Extended Pack</p>
                      <p className="text-xs text-slate-500">{PRELOADED.length} full catalogue wage types · Removes only custom imports</p>
                    </div>
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-3 mt-1">
                  <button onClick={factoryReset}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-rose-200 bg-rose-50 hover:border-rose-400 transition text-left">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-rose-600">
                      <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-700">Factory Reset — Clear Everything</p>
                      <p className="text-xs text-slate-500">Deletes all clients, all imports, all data. Returns to a fresh "Demo Client" with default Standard Pack.</p>
                    </div>
                  </button>
                </div>

                <button onClick={() => setShowResetConfirm(false)} className="w-full px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ IMPORT FROM AWARD MODAL ═══ */}
        {showImportAward && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm overflow-y-auto py-8 px-4" onClick={resetImport}>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)" }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "#065f46" }}>Import from Modern Award</h2>
                  <p className="text-xs text-emerald-600 mt-0.5">FWC Modern Awards Pay Database (MAPD API)</p>
                </div>
                <button onClick={resetImport} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"><XIcon /></button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Step 1: Select Award */}
                {mapdStep === "select" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Search Modern Awards</label>
                      <input type="text" value={awardSearch} onChange={e => setAwardSearch(e.target.value)} placeholder="e.g. Retail, Banking, Health, MA000004..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition" />
                    </div>
                    {mapdError && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 whitespace-pre-wrap">{mapdError}</div>
                    )}
                    <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                      {filteredAwards.map(a => (
                        <button key={a.code} onClick={() => fetchAwardData(a)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition text-left">
                          <span className="text-lg">{INDUSTRY_PROFILES[a.industry]?.icon || "📋"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                            <p className="text-xs text-slate-400 font-mono">{a.code}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{INDUSTRY_PROFILES[a.industry]?.name}</span>
                        </button>
                      ))}
                      {filteredAwards.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">No awards match your search. Try the award code (e.g. MA000004).</p>
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400">Or enter a custom award code:</p>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="text" id="customAwardCode" placeholder="MA000XXX" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono w-32 focus:border-emerald-500 focus:outline-none" />
                        <input type="text" id="customAwardTitle" placeholder="Award title" className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                        <button onClick={() => {
                          const code = document.getElementById("customAwardCode")?.value?.trim();
                          const title = document.getElementById("customAwardTitle")?.value?.trim() || code;
                          if (code) fetchAwardData({ code, title, industry: selectedIndustry });
                        }} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#059669" }}>Fetch</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Loading */}
                {mapdStep === "loading" && (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: "3px" }} />
                    <p className="text-sm font-semibold text-slate-700">Fetching award data from FWC...</p>
                    <p className="text-xs text-slate-400 mt-1">{selectedAward?.code} — {selectedAward?.title}</p>
                  </div>
                )}

                {/* Step 3: Preview */}
                {mapdStep === "preview" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                      <span className="text-2xl">{INDUSTRY_PROFILES[selectedAward?.industry]?.icon || "📋"}</span>
                      <div>
                        <p className="text-sm font-bold text-emerald-900">{selectedAward?.title}</p>
                        <p className="text-xs text-emerald-700 font-mono">{selectedAward?.code}</p>
                      </div>
                    </div>

                    {mapdResults && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {[
                          { l: "Standard Pack", v: mapdMatched.standard.length, c: "#004F9E" },
                          { l: "Additional", v: mapdMatched.additional.length, c: "#c2410c" },
                          { l: "Extended Opt.", v: mapdExtOptional.length, c: "#7c3aed" },
                          { l: "New (Custom)", v: mapdPreview.length, c: "#059669" },
                          { l: "Import Total", v: importCount, c: "#17245F" },
                        ].map(s => (
                          <div key={s.l} className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                            <p className="text-xs text-slate-500">{s.l}</p>
                            <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {mapdError && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700 whitespace-pre-wrap">{mapdError}</div>
                    )}

                    {/* ── TIER 1: Standard Pack — Included ── */}
                    {mapdMatched.standard.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg border" style={{ background: "#EBF4FF", borderColor: "#93c5fd" }}>
                          <CheckIcon />
                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: "#004F9E" }}>Standard Pack — {mapdMatched.standard.length} covered</p>
                            <p className="text-xs text-blue-600">Included in base contract · No additional cost</p>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#004F9E" }}>Included</span>
                        </div>
                        <div className="max-h-[10vh] overflow-y-auto border border-slate-200 rounded-lg opacity-75">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 sticky top-0"><tr className="text-left text-slate-400 uppercase font-semibold"><th className="px-2 py-1.5">Code</th><th className="px-2 py-1.5">Award Component</th><th className="px-2 py-1.5">Matched To</th></tr></thead>
                            <tbody className="divide-y divide-slate-50">
                              {mapdMatched.standard.map((wt, i) => (
                                <tr key={i} className="text-slate-500"><td className="px-2 py-1 font-mono">{wt.legacyCode}</td><td className="px-2 py-1 max-w-[170px] truncate">{wt.clientName}</td><td className="px-2 py-1 font-medium text-blue-700 max-w-[170px] truncate">{wt._matchedTo}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* ── TIER 2: Additional (Award-Required from Extended) — Upsell ── */}
                    {mapdMatched.additional.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg border" style={{ background: importAdditional ? "#FFF7ED" : "#f8fafc", borderColor: importAdditional ? "#fdba74" : "#e2e8f0" }}>
                          <button onClick={() => setImportAdditional(!importAdditional)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${importAdditional ? "bg-orange-500 border-orange-500" : "border-slate-300 bg-white"}`}>
                            {importAdditional && <svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </button>
                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: "#c2410c" }}>Additional (Award-Required) — {mapdMatched.additional.length} WTs</p>
                            <p className="text-xs text-orange-600">Required by award but beyond Standard Pack · Pre-configured in our catalogue</p>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#c2410c" }}>Upsell</span>
                        </div>
                        <div className={`max-h-[12vh] overflow-y-auto border border-slate-200 rounded-lg transition ${importAdditional ? "" : "opacity-40"}`}>
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 sticky top-0"><tr className="text-left text-slate-400 uppercase font-semibold"><th className="px-2 py-1.5">Code</th><th className="px-2 py-1.5">Award Component</th><th className="px-2 py-1.5">Pre-configured As</th></tr></thead>
                            <tbody className="divide-y divide-slate-50">
                              {mapdMatched.additional.map((wt, i) => (
                                <tr key={i} className="text-slate-600 hover:bg-orange-50/50"><td className="px-2 py-1 font-mono">{wt.legacyCode}</td><td className="px-2 py-1 max-w-[170px] truncate">{wt.clientName}</td><td className="px-2 py-1 font-medium text-orange-700 max-w-[170px] truncate">{wt._matchedTo}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* ── TIER 3: Extended Pack (Optional) — Full Pack Upsell ── */}
                    {mapdExtOptional.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg border" style={{ background: importExtended ? "#F5F3FF" : "#f8fafc", borderColor: importExtended ? "#c4b5fd" : "#e2e8f0" }}>
                          <button onClick={() => setImportExtended(!importExtended)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${importExtended ? "bg-violet-500 border-violet-500" : "border-slate-300 bg-white"}`}>
                            {importExtended && <svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </button>
                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: "#6d28d9" }}>Extended Pack (Optional) — {mapdExtOptional.length} more WTs</p>
                            <p className="text-xs text-violet-600">Not required by this award but available for full coverage · Pre-configured</p>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">Optional</span>
                        </div>
                        {importExtended && (
                          <div className="max-h-[10vh] overflow-y-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 sticky top-0"><tr className="text-left text-slate-400 uppercase font-semibold"><th className="px-2 py-1.5">Code</th><th className="px-2 py-1.5">Wage Type</th><th className="px-2 py-1.5">Category</th></tr></thead>
                              <tbody className="divide-y divide-slate-50">
                                {mapdExtOptional.map((wt, i) => (
                                  <tr key={i} className="text-slate-500 hover:bg-violet-50/50"><td className="px-2 py-1 font-mono">{wt.legacyCode}</td><td className="px-2 py-1 max-w-[170px] truncate">{wt.clientName}</td><td className="px-2 py-1 text-slate-400">{wt.category.split(" - ")[1] || wt.category}</td></tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── TIER 4: Genuinely New — Custom Config ── */}
                    {mapdPreview.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                          <svg width="16" height="16" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-emerald-800">New Wage Types — {mapdPreview.length} custom</p>
                            <p className="text-xs text-emerald-600">Not in any pack — needs custom SAP configuration</p>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">Custom</span>
                        </div>
                        <div className="max-h-[10vh] overflow-y-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 sticky top-0"><tr className="text-left text-slate-500 uppercase font-semibold"><th className="px-2 py-1.5">Code</th><th className="px-2 py-1.5">Name</th><th className="px-2 py-1.5">Category</th><th className="px-2 py-1.5">OTE</th></tr></thead>
                            <tbody className="divide-y divide-slate-50">
                              {mapdPreview.map((wt, i) => (
                                <tr key={i} className="hover:bg-emerald-50/50"><td className="px-2 py-1.5 font-mono font-medium text-emerald-700">{wt.legacyCode}</td><td className="px-2 py-1.5 font-medium text-slate-700 max-w-[200px] truncate">{wt.clientName}</td><td className="px-2 py-1.5 text-slate-500">{wt.category.split(" - ")[1] || wt.category}</td><td className="px-2 py-1.5 text-slate-400">{wt.oteClassification.replace("OTE - ","")}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* ── Coverage Summary ── */}
                    {mapdPreview.length === 0 && mapdMatched.additional.length === 0 && mapdMatched.standard.length > 0 && (
                      <div className="text-center py-3 px-6 rounded-lg border" style={{ background: "#EBF4FF", borderColor: "#93c5fd" }}>
                        <p className="text-sm font-bold" style={{ color: "#004F9E" }}>Full coverage with Standard Pack alone</p>
                        <p className="text-xs text-blue-600 mt-1">Every award component is already in the base contract.</p>
                      </div>
                    )}

                    {mapdPreview.length === 0 && mapdMatched.standard.length === 0 && mapdMatched.additional.length === 0 && !mapdError && (
                      <div className="text-center py-8">
                        <p className="text-sm text-slate-500">No mappable wage types found in this award's MAPD data.</p>
                        <p className="text-xs text-slate-400 mt-1">The MAPD API may use different field names. Check the Vercel function logs.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Done */}
                {mapdStep === "done" && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <CheckIcon />
                    </div>
                    <p className="text-sm font-semibold text-emerald-800">Imported {importCount} wage types</p>
                    <p className="text-xs text-slate-400 mt-1">{mapdMatched.standard.length} in Standard (included) · {importAdditional ? mapdMatched.additional.length : 0} Additional · {importExtended ? mapdExtOptional.length : 0} Extended · {mapdPreview.length} Custom · All added as Draft</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {mapdStep === "preview" && (mapdPreview.length > 0 || mapdMatched.standard.length > 0 || mapdMatched.additional.length > 0) && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <button onClick={() => { setMapdStep("select"); setSelectedAward(null); setMapdResults(null); setMapdPreview([]); setMapdMatched({ standard: [], additional: [] }); setMapdExtOptional([]); setImportAdditional(true); setImportExtended(false); }} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Back</button>
                  <div className="flex items-center gap-3">
                    {importCount > 0 && (
                      <span className="text-xs text-slate-500">
                        {[
                          mapdPreview.length > 0 && `${mapdPreview.length} custom`,
                          importAdditional && mapdMatched.additional.length > 0 && `${mapdMatched.additional.length} additional`,
                          importExtended && mapdExtOptional.length > 0 && `${mapdExtOptional.length} extended`,
                        ].filter(Boolean).join(" + ")}
                      </span>
                    )}
                    <button onClick={importCount > 0 ? confirmImport : resetImport} 
                      className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-md transition" style={{ background: importCount > 0 ? "#059669" : "#004F9E" }}>
                      {importCount > 0 ? `Import ${importCount} Wage Types` : "Done — Standard Covers All"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ IMPORT EA/EBA MODAL ═══ */}
        {showImportEA && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm overflow-y-auto py-8 px-4" onClick={resetEAImport}>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "#5b21b6" }}>Import from EA / EBA</h2>
                  <p className="text-xs text-violet-600 mt-0.5">Upload a PDF — AI extracts wage types and maps to SAP schema</p>
                </div>
                <button onClick={resetEAImport} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"><XIcon /></button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Step 1: Upload */}
                {eaStep === "upload" && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-violet-200 rounded-xl p-8 text-center hover:border-violet-400 transition cursor-pointer" onClick={() => eaFileRef.current?.click()}>
                      <input ref={eaFileRef} type="file" accept=".pdf" onChange={handleEAFile} className="hidden" />
                      <svg width="40" height="40" fill="none" stroke="#7c3aed" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6m-3 3l3-3 3 3"/></svg>
                      {eaFile ? (
                        <div>
                          <p className="text-sm font-semibold text-violet-800">{eaFile.name}</p>
                          <p className="text-xs text-violet-500 mt-1">{(eaFile.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-slate-600">Drop an EA/EBA PDF here or click to browse</p>
                          <p className="text-xs text-slate-400 mt-1">PDF files up to 20MB</p>
                        </div>
                      )}
                    </div>

                    {eaError && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 whitespace-pre-wrap">{eaError}</div>}

                    <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                      <p className="text-xs font-semibold text-violet-800 mb-1">How it works</p>
                      <p className="text-xs text-violet-600">The AI reads every clause of the EA and extracts pay components — earnings, allowances, overtime, penalties, leave, deductions, super. Each is mapped to the Zalaris SAP wage type schema with suggested WT codes, categories, OTE classification, and STP2 types. Results are then matched against your Standard and Extended packs.</p>
                    </div>

                    {eaFile && (
                      <button onClick={processEA} className="w-full px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-md transition" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                        Analyse EA — Extract Wage Types
                      </button>
                    )}
                  </div>
                )}

                {/* Step 2: Loading */}
                {eaStep === "loading" && (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: "3px" }} />
                    <p className="text-sm font-semibold text-slate-700">Analysing Enterprise Agreement...</p>
                    <p className="text-xs text-slate-400 mt-1">{eaFile?.name} · This typically takes 15–30 seconds</p>
                    <p className="text-xs text-slate-400 mt-3">Reading clauses, extracting pay components, mapping to SAP wage types</p>
                  </div>
                )}

                {/* Step 3: Preview */}
                {eaStep === "preview" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-violet-200 bg-violet-50">
                      <svg width="24" height="24" fill="none" stroke="#7c3aed" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                      <div>
                        <p className="text-sm font-bold text-violet-900">{eaFile?.name}</p>
                        <p className="text-xs text-violet-600">{eaParsed.length} pay components extracted by AI</p>
                      </div>
                    </div>

                    {eaError && <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700 whitespace-pre-wrap">{eaError}</div>}

                    {/* Stats */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {[
                        { l: "Standard Pack", v: eaTierStd.length, c: "#004F9E" },
                        { l: "Additional", v: eaTierAdd.length, c: "#c2410c" },
                        { l: "Extended Opt.", v: eaTierExtOpt.length, c: "#7c3aed" },
                        { l: "New (Custom)", v: eaTierNew.length, c: "#059669" },
                        { l: "Import Total", v: eaImportCount, c: "#17245F" },
                      ].map(s => (
                        <div key={s.l} className="bg-white rounded-lg p-2 border border-slate-200 text-center">
                          <p className="text-xs text-slate-500">{s.l}</p>
                          <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tier 1: Standard */}
                    {eaTierStd.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ background: "#EBF4FF", borderColor: "#93c5fd" }}>
                          <CheckIcon />
                          <p className="text-sm font-bold flex-1" style={{ color: "#004F9E" }}>Standard Pack — {eaTierStd.length} covered</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#004F9E" }}>Included</span>
                        </div>
                        <div className="max-h-[8vh] overflow-y-auto border border-slate-200 rounded-lg opacity-75">
                          <table className="w-full text-xs"><tbody className="divide-y divide-slate-50">
                            {eaTierStd.map((wt, i) => <tr key={i} className="text-slate-500"><td className="px-2 py-1 font-mono w-12">{wt.legacyCode}</td><td className="px-2 py-1 truncate">{wt.clientName}</td><td className="px-2 py-1 text-blue-700 font-medium truncate">{wt._matchedTo}</td></tr>)}
                          </tbody></table>
                        </div>
                      </>
                    )}

                    {/* Tier 2: Additional */}
                    {eaTierAdd.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ background: eaImportAdd ? "#FFF7ED" : "#f8fafc", borderColor: eaImportAdd ? "#fdba74" : "#e2e8f0" }}>
                          <button onClick={() => setEaImportAdd(!eaImportAdd)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${eaImportAdd ? "bg-orange-500 border-orange-500" : "border-slate-300 bg-white"}`}>
                            {eaImportAdd && <svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </button>
                          <p className="text-sm font-bold flex-1" style={{ color: "#c2410c" }}>Additional (EA-Required) — {eaTierAdd.length} WTs</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#c2410c" }}>Upsell</span>
                        </div>
                        <div className={`max-h-[10vh] overflow-y-auto border border-slate-200 rounded-lg transition ${eaImportAdd ? "" : "opacity-40"}`}>
                          <table className="w-full text-xs"><tbody className="divide-y divide-slate-50">
                            {eaTierAdd.map((wt, i) => <tr key={i} className="text-slate-600"><td className="px-2 py-1 font-mono w-12">{wt.legacyCode}</td><td className="px-2 py-1 truncate">{wt.clientName}</td><td className="px-2 py-1 text-orange-700 font-medium truncate">{wt._matchedTo}</td></tr>)}
                          </tbody></table>
                        </div>
                      </>
                    )}

                    {/* Tier 3: Extended Optional */}
                    {eaTierExtOpt.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ background: eaImportExt ? "#F5F3FF" : "#f8fafc", borderColor: eaImportExt ? "#c4b5fd" : "#e2e8f0" }}>
                          <button onClick={() => setEaImportExt(!eaImportExt)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${eaImportExt ? "bg-violet-500 border-violet-500" : "border-slate-300 bg-white"}`}>
                            {eaImportExt && <svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </button>
                          <p className="text-sm font-bold flex-1" style={{ color: "#6d28d9" }}>Extended Pack (Optional) — {eaTierExtOpt.length} more</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">Optional</span>
                        </div>
                      </>
                    )}

                    {/* Tier 4: New / Custom */}
                    {eaTierNew.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <svg width="16" height="16" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                          <p className="text-sm font-bold flex-1 text-emerald-800">New (Custom) — {eaTierNew.length} WTs</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">Custom</span>
                        </div>
                        <div className="max-h-[12vh] overflow-y-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs"><tbody className="divide-y divide-slate-50">
                            {eaTierNew.map((wt, i) => <tr key={i} className="hover:bg-emerald-50/50"><td className="px-2 py-1.5 font-mono text-emerald-700 w-16">{wt.legacyCode}</td><td className="px-2 py-1.5 font-medium text-slate-700 truncate max-w-[200px]">{wt.clientName}</td><td className="px-2 py-1.5 text-slate-400">{wt.category.split(" - ")[1] || wt.category}</td></tr>)}
                          </tbody></table>
                        </div>
                      </>
                    )}

                    {eaParsed.length === 0 && !eaError && (
                      <div className="text-center py-6">
                        <p className="text-sm text-slate-500">No pay components could be extracted. The document may not be a readable EA/EBA.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Done */}
                {eaStep === "done" && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3"><CheckIcon /></div>
                    <p className="text-sm font-semibold text-violet-800">Imported {eaImportCount} wage types from EA</p>
                    <p className="text-xs text-slate-400 mt-1">All added as Draft — review SAP processing classes</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {eaStep === "preview" && (eaImportCount > 0 || eaParsed.length > 0) && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <button onClick={() => { setEaStep("upload"); setEaParsed([]); setEaTierStd([]); setEaTierAdd([]); setEaTierExtOpt([]); setEaTierNew([]); }} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Back</button>
                  <div className="flex items-center gap-3">
                    {eaImportCount > 0 && (
                      <span className="text-xs text-slate-500">
                        {[
                          eaTierNew.length > 0 && `${eaTierNew.length} custom`,
                          eaImportAdd && eaTierAdd.length > 0 && `${eaTierAdd.length} additional`,
                          eaImportExt && eaTierExtOpt.length > 0 && `${eaTierExtOpt.length} extended`,
                        ].filter(Boolean).join(" + ")}
                      </span>
                    )}
                    <button onClick={eaImportCount > 0 ? confirmEAImport : resetEAImport}
                      className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-md transition" style={{ background: eaImportCount > 0 ? "#7c3aed" : "#004F9E" }}>
                      {eaImportCount > 0 ? `Import ${eaImportCount} Wage Types` : "Done — Standard Covers All"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search wage types..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition ${showFilters ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-300 text-slate-600"}`}><FilterIcon /> Filters</button>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setView("table")} className={`p-1.5 rounded-md transition ${view === "table" ? "bg-white shadow-sm text-slate-700" : "text-slate-400"}`}><ListIcon /></button>
            <button onClick={() => setView("cards")} className={`p-1.5 rounded-md transition ${view === "cards" ? "bg-white shadow-sm text-slate-700" : "text-slate-400"}`}><GridIcon /></button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
              <option value="">All Categories</option>
              {catGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
              <option value="">All Statuses</option>
              {["Draft","Confirmed","Query"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterPrcl21} onChange={e => setFilterPrcl21(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
              <option value="">All PRCL 21</option>
              {PRCL21_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.value} — {o.label.substring(0,30)}</option>)}
            </select>
            <select value={filterInfotype} onChange={e => setFilterInfotype(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
              <option value="">All Infotypes</option>
              {INFOTYPE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.badge} — {o.label.substring(0,25)}</option>)}
            </select>
          </div>
        )}

        {/* Table View */}
        {filtered.length > 0 && view === "table" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ background: "#f8fafc" }}>
                    <th className="px-3 py-2.5 w-16">Code</th>
                    <th className="px-3 py-2.5">Name</th>
                    <th className="px-3 py-2.5 w-48">Category</th>
                    <th className="px-3 py-2.5 w-20">Pack</th>
                    <th className="px-3 py-2.5 w-16">PRCL21</th>
                    <th className="px-3 py-2.5 w-32">Infotype</th>
                    <th className="px-3 py-2.5 w-24">Priority</th>
                    <th className="px-3 py-2.5 w-24">Status</th>
                    <th className="px-3 py-2.5 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((rec) => {
                    const isStd = profile.standardCodes.has(rec.legacyCode);
                    return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-3 py-2.5"><span className="font-mono text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{rec.legacyCode}</span></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {rec.sapNote && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" title="SAP config note exists" />}
                          <span className="font-medium text-slate-800">{rec.clientName}</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate max-w-xs">{rec.description}</p>
                      </td>
                      <td className="px-3 py-2.5"><Badge color={catColor(rec.category)}>{rec.category.split(" - ")[1] || rec.category}</Badge></td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isStd ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                          {isStd ? "Std" : "Ext"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5"><span className={`font-mono text-xs font-bold ${(rec.prcl?.p21||"-") === "-" ? "text-slate-300" : "text-slate-700"}`}>{rec.prcl?.p21 || "—"}</span></td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-0.5">
                          {(rec.infotype||[]).map(k => {
                            const opt = INFOTYPE_OPTIONS.find(o => o.key === k);
                            return opt ? <span key={k} title={opt.tip} className={`text-xs font-bold px-1 py-0 rounded border ${opt.color}`}>{opt.badge.replace("IT ","")}</span> : null;
                          })}
                          {!(rec.infotype||[]).length && <span className="text-xs text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><Badge color={priorityColor(rec.priority)}>{rec.priority}</Badge></td>
                      <td className="px-3 py-2.5"><button onClick={() => toggleStatus(rec.id)} title="Click to cycle status"><Badge color={statusColor(rec.status)}>{rec.status}</Badge></button></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => handleEdit(rec)} className="p-1.5 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition" title="Edit"><EditIcon /></button>
                          <button onClick={() => handleDuplicate(rec)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition" title="Duplicate"><CopyIcon /></button>
                          <button onClick={() => handleDelete(rec.id)} className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition" title="Delete"><TrashIcon /></button>
                        </div>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span>Showing {filtered.length} of {records.length} pay components · {activeClient.name} · {profile.name} · {packMode === "standard" ? "Standard Pack" : "Extended Pack"}</span>
              <span>● Violet dot = SAP config note · Std/Ext = pack tier</span>
            </div>
          </div>
        )}

        {/* Cards View */}
        {filtered.length > 0 && view === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((rec) => {
              const isStd = profile.standardCodes.has(rec.legacyCode);
              return (
              <div key={rec.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{rec.legacyCode}</span>
                      <h3 className="font-semibold text-slate-800">{rec.clientName}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isStd ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {isStd ? "Standard" : "Extended"}
                      </span>
                      <button onClick={() => toggleStatus(rec.id)}><Badge color={statusColor(rec.status)}>{rec.status}</Badge></button>
                      <Badge color={priorityColor(rec.priority)}>{rec.priority}</Badge>
                    </div>
                  </div>
                  <div className="mb-2"><Badge color={catColor(rec.category)}>{rec.category}</Badge></div>
                  <p className="text-sm text-slate-600 line-clamp-2">{rec.description}</p>

                  {expandedCard === rec.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      {rec.amountType && <div><span className="font-medium text-slate-700">Amount:</span> {rec.amountType}</div>}
                      {rec.frequency && <div><span className="font-medium text-slate-700">Frequency:</span> {rec.frequency}</div>}
                      {rec.taxTreatment && <div><span className="font-medium text-slate-700">Tax:</span> {rec.taxTreatment}</div>}
                      {rec.oteClassification && <div><span className="font-medium text-slate-700">OTE:</span> {rec.oteClassification}</div>}
                      {rec.stp2PaymentType && rec.stp2PaymentType !== "Not Applicable" && <div><span className="font-medium text-slate-700">STP2:</span> {rec.stp2PaymentType}</div>}
                      {rec.legislativeRef && <div><span className="font-medium text-slate-700">Leg. Ref:</span> {rec.legislativeRef}</div>}
                      {rec.notes && <div className="pt-1"><span className="font-medium text-slate-700">Notes:</span> {rec.notes}</div>}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">SAP Processing Classes</p>
                        <div className="grid grid-cols-2 gap-2">
                          <PrclChip label="Tax (PRCL 21)" value={rec.prcl?.p21||"-"} options={PRCL21_OPTIONS} />
                          <PrclChip label="Finance (PRCL 32)" value={rec.prcl?.p32||"-"} options={PRCL32_OPTIONS} />
                          <PrclChip label="Pay Rate (PRCL 01)" value={rec.prcl?.p01||"-"} options={PRCL01_OPTIONS} />
                          <PrclChip label="Gross (PRCL 20)" value={rec.prcl?.p20||"-"} options={PRCL20_OPTIONS} />
                        </div>
                        {rec.sapNote && <div className="mt-2 text-xs text-violet-700 bg-violet-50 rounded-lg p-2 border border-violet-200"><span className="font-semibold">⚙ Config Note:</span> {rec.sapNote}</div>}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Payroll Totals & Cumulations</p>
                        <CclsBadges ccls={rec.ccls} />
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">SAP Entry Point (Infotype)</p>
                        <InfotypeBadges infotype={rec.infotype} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                    <button onClick={() => setExpandedCard(expandedCard === rec.id ? null : rec.id)} className="text-xs text-blue-600 font-medium hover:text-blue-800 transition flex items-center gap-1">
                      {expandedCard === rec.id ? "Less" : "Details + SAP Chars"} <span className={`transform transition ${expandedCard === rec.id ? "rotate-180" : ""}`}><ChevronDown /></span>
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleEdit(rec)} className="p-1.5 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"><EditIcon /></button>
                      <button onClick={() => handleDuplicate(rec)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"><CopyIcon /></button>
                      <button onClick={() => handleDelete(rec.id)} className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"><TrashIcon /></button>
                    </div>
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}

        {filtered.length === 0 && packFiltered.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
            <p className="text-slate-500 text-sm">No components match your current filters.</p>
            <button onClick={() => { setFilterCat(""); setFilterPriority(""); setFilterStatus(""); setFilterPrcl21(""); setFilterInfotype(""); setSearchTerm(""); }} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800">Clear all filters</button>
          </div>
        )}


        <footer className="text-center py-4 text-xs text-slate-400 space-y-1">
          <p>WT Scout · Zalaris Activate — Explore Phase · {activeClient.name} · {records.length} pay components · Data persisted in browser localStorage</p>
          <p>Industry packs: Standard (~80 WTs, contract-included) · Extended (standard + additional WTs for full industry coverage) · Click status badges to cycle Draft → Confirmed → Query</p>
        </footer>
      </main>
    </div>
  );
}
