import { useTranslation } from "react-i18next"

// errors obyektining birinchi xabarlarini { fieldPath: rawMessage } ko'rinishiga tekislaydi.
export function flattenApiErrors(
  errors: Record<string, string[]> | undefined
): Record<string, string> {
  if (!errors) return {}

  return Object.fromEntries(
    Object.entries(errors)
      .filter(([, messages]) => messages?.[0])
      .map(([field, messages]) => [field, messages[0]])
  )
}

const RULE_ORDER = [
  "required",
  "confirmed",
  "unique",
  "taken",
  "email",
  "url",
  "date",
  "numeric",
  "integer",
  "boolean",
  "string",
  "between",
  "min",
  "max",
  "size",
  "in",
  "alpha",
  "exists",
] as const

// "validation.location_address_line1_required" kabi xom xabardan
// qoida turini (required, unique, min, ...) aniqlaydi.
function detectRule(rawMessage: string): string {
  const normalized = rawMessage.toLowerCase()

  for (const rule of RULE_ORDER) {
    if (normalized.includes(`_${rule}`) || normalized.includes(`.${rule}`)) {
      return rule
    }
  }

  return "invalid"
}

// API field path'ni (masalan "location.address_line1") "fields" resursidagi
// flat kalitga aylantiradi ("location__address_line1") — chunki i18next
// kalit ichidagi "." belgisini nested-path deb tushunadi.
function toFieldsKey(fieldPath: string): string {
  return `fields.${fieldPath.replace(/\./g, "__")}`
}

/**
 * Ishlatilishi:
 *   const translateError = useFieldErrorTranslator()
 *   translateError("location.address_line1", "validation.location_address_line1_required")
 *   // -> "Manzil (1-qator) to'ldirilishi shart" (joriy tilga qarab)
 */
export function useFieldErrorTranslator() {
  const { t } = useTranslation()

  return function translateFieldError(
    fieldPath: string,
    rawMessage: string
  ): string {
    const field = t(toFieldsKey(fieldPath), { defaultValue: fieldPath })
    const rule = detectRule(rawMessage)
    return t(`validation.${rule}`, { field })
  }
}

export function useErrorCountSummary() {
  const { t } = useTranslation()
  return (count: number) => t("validation.errors_found", { count })
}