import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ValidationResult {
  ruleId: string;
  ruleName: string;
  fieldName: string;
  passed: boolean;
  severity: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, data } = body;

    if (!entityType || !data) {
      return NextResponse.json({ error: "entityType and data are required" }, { status: 400 });
    }

    const rules = await db.validationRule.findMany({
      where: {
        entityType,
        isActive: true,
      },
    });

    const results: ValidationResult[] = [];

    for (const rule of rules) {
      const config = JSON.parse(rule.ruleConfig);
      const fieldValue = data[rule.fieldName];
      let passed = true;
      let message = "";

      switch (rule.ruleType) {
        case "Required":
          passed = fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
          message = passed ? "Field is present" : `Field "${rule.fieldName}" is required`;
          break;
        case "Range": {
          const min = config.min ?? -Infinity;
          const max = config.max ?? Infinity;
          const numValue = Number(fieldValue);
          passed = !isNaN(numValue) && numValue >= min && numValue <= max;
          message = passed ? "Value within range" : `Value must be between ${min} and ${max}`;
          break;
        }
        case "Format": {
          const pattern = config.pattern ? new RegExp(config.pattern) : null;
          passed = pattern ? pattern.test(String(fieldValue)) : true;
          message = passed ? "Format valid" : `Value does not match required format: ${config.pattern}`;
          break;
        }
        case "Consistency":
          // Check if related fields are consistent
          if (config.requiredWith) {
            const relatedField = data[config.requiredWith];
            passed = !fieldValue || relatedField;
            message = passed ? "Consistent" : `"${rule.fieldName}" requires "${config.requiredWith}" to be set`;
          }
          break;
        case "BusinessLogic":
          if (config.customCheck === "confidenceThreshold") {
            const threshold = config.threshold ?? 0.70;
            passed = Number(fieldValue) >= threshold;
            message = passed ? "Above threshold" : `Confidence ${fieldValue} below threshold ${threshold}`;
          }
          break;
      }

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        fieldName: rule.fieldName,
        passed,
        severity: rule.severity,
        message,
      });
    }

    const allPassed = results.every((r) => r.passed);
    const failures = results.filter((r) => !r.passed);

    return NextResponse.json({
      valid: allPassed,
      totalRules: results.length,
      passedCount: results.length - failures.length,
      failedCount: failures.length,
      results,
      failures,
    });
  } catch (error) {
    console.error("Error running validation:", error);
    return NextResponse.json({ error: "Failed to run validation" }, { status: 500 });
  }
}
