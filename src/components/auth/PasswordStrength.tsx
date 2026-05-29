// src/components/auth/PasswordStrength.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Real-time password strength meter. Pure function + visual bar.
// Scoring is conservative — rejects common patterns and rewards entropy.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import { CheckCircle, XCircle } from "@phosphor-icons/react";

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;  // 0=very weak, 4=excellent
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
}

const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "monkey",
  "samsung", "samsung123", "admin", "letmein", "welcome", "passw0rd",
  "iloveyou", "trustno1", "dragon", "master", "shadow", "football",
]);

export function evaluatePassword(pwd: string): PasswordStrengthResult {
  const checks = [
    { label: "Al menos 8 caracteres", passed: pwd.length >= 8 },
    { label: "Una letra mayúscula", passed: /[A-Z]/.test(pwd) },
    { label: "Una letra minúscula", passed: /[a-z]/.test(pwd) },
    { label: "Un número", passed: /\d/.test(pwd) },
    { label: "Un símbolo (!@#$…)", passed: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pwd) },
  ];
  const passed = checks.filter((c) => c.passed).length;

  // Penalize common passwords regardless of complexity.
  const isCommon = COMMON_PASSWORDS.has(pwd.toLowerCase());
  // Penalize sequential / repeated patterns.
  const hasSequence = /(?:0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(pwd);
  const hasRepetition = /(.)\1{2,}/.test(pwd);

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  if (pwd.length === 0) {
    score = 0;
  } else if (isCommon || pwd.length < 6) {
    score = 0;
  } else if (passed <= 2 || hasSequence || hasRepetition) {
    score = 1;
  } else if (passed === 3) {
    score = 2;
  } else if (passed === 4) {
    score = 3;
  } else if (passed === 5 && pwd.length >= 12) {
    score = 4;
  } else {
    score = 3;
  }

  const meta = [
    { label: "Muy débil",  color: "bg-red-500" },
    { label: "Débil",      color: "bg-orange-500" },
    { label: "Regular",    color: "bg-yellow-500" },
    { label: "Fuerte",     color: "bg-lime-500" },
    { label: "Excelente",  color: "bg-emerald-500" },
  ];

  return { score, label: meta[score].label, color: meta[score].color, checks };
}

interface PasswordStrengthProps {
  password: string;
  /** Hide the requirements checklist (just show the bar). */
  hideChecks?: boolean;
  darkMode?: boolean;
}

export function PasswordStrength({ password, hideChecks = false, darkMode = false }: PasswordStrengthProps) {
  const result = useMemo(() => evaluatePassword(password), [password]);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-3">
        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
          <div
            className={`h-full transition-all duration-300 ${result.color}`}
            style={{ width: `${((result.score + 1) / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"} min-w-[70px] text-right`}>
          {result.label}
        </span>
      </div>

      {/* Requirements checklist */}
      {!hideChecks && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs">
          {result.checks.map((c, i) => (
            <li
              key={i}
              className={`flex items-center gap-1.5 ${
                c.passed
                  ? darkMode ? "text-emerald-400" : "text-emerald-600"
                  : darkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {c.passed ? (
                <CheckCircle size={14} weight="fill" />
              ) : (
                <XCircle size={14} weight="regular" />
              )}
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
