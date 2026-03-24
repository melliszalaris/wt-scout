// Vercel Serverless Function — EA/EBA PDF Parser via Anthropic API
// Receives base64 PDF, sends to Claude with wage type schema prompt, returns structured JSON
// API key stored as Vercel environment variable: ANTHROPIC_API_KEY

export const config = { maxDuration: 60 }; // EA parsing can take time

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured. Set it in Vercel Environment Variables." });
  }

  const { pdfBase64, fileName } = req.body || {};
  if (!pdfBase64) {
    return res.status(400).json({ error: "Missing pdfBase64 in request body" });
  }

  const systemPrompt = `You are an expert Australian payroll consultant specialising in SAP ECP wage type configuration. 
You are analysing an Enterprise Agreement (EA) or Enterprise Bargaining Agreement (EBA) to extract all pay components that would need to be configured as SAP wage types.

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
  Use "NEW" + a descriptive suffix if the component doesn't match any standard code.
- name: descriptive pay component name
- category: one of: "Earnings - Base Pay", "Earnings - Allowance", "Earnings - Overtime", "Earnings - Penalty / Shift Loading", "Earnings - Bonus / Incentive", "Earnings - Commission", "Earnings - Leave Loading", "Earnings - Termination / ETP", "Earnings - Other", "Deductions - Pre-Tax", "Deductions - Post-Tax", "Deductions - Salary Sacrifice", "Deductions - Union / Association Fees", "Deductions - Child Support", "Deductions - Other", "Leave - Annual Leave", "Leave - Personal / Carer's Leave", "Leave - Long Service Leave", "Leave - Parental Leave", "Leave - Community Service Leave", "Leave - Other Leave", "Superannuation - SG Contribution", "Superannuation - Salary Sacrifice", "Superannuation - Additional Voluntary", "Employer Cost - Payroll Tax", "Employer Cost - Workers Compensation", "Informational / Memo Only"
- description: what the EA says about this component (clause reference, entitlement details)
- amountType: "Fixed Amount per Pay Period" | "Hourly Rate × Hours" | "Daily Rate × Days" | "Annual Amount (prorated)" | "Percentage of Base Pay" | "Percentage of OTE" | "Units × Rate" | "Lump Sum / One-Off" | "System Calculated"
- frequency: "Every Pay Run" | "Monthly" | "Quarterly" | "Annually" | "Ad Hoc / On Demand" | "On Termination Only"
- taxTreatment: "Subject to PAYG Withholding" | "PAYG Exempt" | "ETP - Life Benefit" | "Reportable Fringe Benefit" | "Salary Sacrifice (Pre-Tax)" | "Not Applicable"
- oteClassification: "OTE - Included" | "OTE - Excluded" | "Partially OTE (see notes)" | "Not Applicable"
- stp2PaymentType: best match from STP2 payment types
- legislativeRef: clause number(s) from the EA
- priority: "Must Have" | "Should Have" | "Nice to Have"
- notes: any additional configuration notes, especially around rates, thresholds, or conditions

IMPORTANT RULES:
- Extract EVERY pay component mentioned — earnings, allowances, overtime rates, penalty rates, shift loadings, leave types, deductions, superannuation provisions, termination entitlements
- Include the specific rates and percentages where stated (e.g. "Saturday penalty 150%", "Annual leave 5 weeks")
- Note any conditions or eligibility criteria
- Flag any components that differ from the National Employment Standards (NES) or applicable Modern Award
- Be thorough — an EA typically yields 30-80+ distinct wage type requirements

Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the JSON array.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
              },
              {
                type: "text",
                text: `Analyse this Enterprise Agreement "${fileName || "EA Document"}" and extract all pay components as structured wage type records. Return a JSON array only.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${response.status}`, detail: errBody.substring(0, 500) });
    }

    const data = await response.json();
    const textBlock = data.content?.find(b => b.type === "text");
    const rawText = textBlock?.text || "";

    // Parse JSON — strip any markdown fences if present
    const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(200).json({
        wageTypes: [],
        rawResponse: rawText.substring(0, 2000),
        parseError: `Failed to parse AI response as JSON: ${parseErr.message}`,
      });
    }

    return res.status(200).json({ wageTypes: Array.isArray(parsed) ? parsed : [], rawLength: rawText.length });
  } catch (err) {
    return res.status(502).json({ error: "Failed to call Anthropic API", message: err.message });
  }
}
