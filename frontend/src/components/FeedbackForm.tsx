"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/lib/locale-context";

const labelClass = "block text-sm font-medium text-charcoal/70";
const inputClass =
  "mt-1 w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/35 focus:border-green focus:outline-none focus:ring-1 focus:ring-green/30";
const sectionClass = "space-y-4 border-t border-charcoal/10 pt-4 mt-4";

export default function FeedbackForm() {
  const { t } = useLocale();
  const [reportType, setReportType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const showBug = reportType === "bug";
  const showFeedback = reportType === "feedback" || reportType === "suggestion";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setDone(true);
        return;
      }
      setError(typeof data.error === "string" ? data.error : t("feedback.errorFailed"));
    } catch {
      setError(t("feedback.errorFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green/20 bg-green/10 px-4 py-4 text-sm text-charcoal">
        {t("feedback.success")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>{t("feedback.reportType")}</label>
        <select
          name="report_type"
          required
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className={inputClass}
        >
          <option value="">{t("feedback.selectPlaceholder")}</option>
          <option value="bug">{t("feedback.typeBug")}</option>
          <option value="feedback">{t("feedback.typeFeedback")}</option>
          <option value="suggestion">{t("feedback.typeSuggestion")}</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>{t("feedback.emailOptional")}</label>
        <input
          type="email"
          name="email"
          className={inputClass}
          placeholder={t("feedback.emailFollowupPlaceholder")}
          autoComplete="email"
        />
      </div>

      {showBug && (
        <div className={sectionClass}>
          <div>
            <label className={labelClass}>{t("feedback.shortTitle")}</label>
            <input
              type="text"
              name="title"
              className={inputClass}
              required={showBug}
              placeholder={t("feedback.titleExamplePlaceholder")}
            />
          </div>
          <div>
            <label className={labelClass}>{t("feedback.whatDoing")}</label>
            <textarea name="what_you_were_doing" className={`${inputClass} min-h-[80px]`} required={showBug} />
          </div>
          <div>
            <label className={labelClass}>{t("feedback.whatExpected")}</label>
            <textarea name="expected_behavior" className={`${inputClass} min-h-[64px]`} />
          </div>
          <div>
            <label className={labelClass}>{t("feedback.whatHappened")}</label>
            <textarea name="actual_behavior" className={`${inputClass} min-h-[80px]`} required={showBug} />
          </div>
          <div>
            <label className={labelClass}>{t("feedback.pageUrl")}</label>
            <input type="text" name="url" className={inputClass} placeholder={t("feedback.urlHttpsPlaceholder")} />
          </div>
          <div>
            <label className={labelClass}>{t("feedback.severity")}</label>
            <select name="severity" className={inputClass}>
              <option value="blocking">{t("feedback.sevBlocking")}</option>
              <option value="major">{t("feedback.sevMajor")}</option>
              <option value="minor">{t("feedback.sevMinor")}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("feedback.browserLabel")}</label>
            <select name="browser" className={inputClass}>
              <option value="chrome">Chrome</option>
              <option value="edge">Edge</option>
              <option value="firefox">Firefox</option>
              <option value="safari">Safari</option>
              <option value="other">{t("feedback.browserOther")}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("feedback.deviceLabel")}</label>
            <input
              type="text"
              name="device"
              className={inputClass}
              placeholder={t("feedback.deviceExamplePlaceholder")}
            />
          </div>
        </div>
      )}

      {showFeedback && (
        <div className={sectionClass}>
          <div>
            <label className={labelClass}>{t("feedback.liked")}</label>
            <textarea name="what_you_liked" className={`${inputClass} min-h-[64px]`} />
          </div>
          <div>
            <label className={labelClass}>{t("feedback.confusing")}</label>
            <textarea name="what_was_confusing" className={`${inputClass} min-h-[64px]`} />
          </div>
          <div>
            <label className={labelClass}>{t("feedback.suggestionsLabel")}</label>
            <textarea name="suggestions" className={`${inputClass} min-h-[64px]`} />
          </div>
          <div>
            <label className={labelClass}>{t("feedback.easeLabel")}</label>
            <select name="ease_of_use" className={inputClass}>
              <option value="">{t("feedback.easeDash")}</option>
              <option value="1">{t("feedback.ease1")}</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">{t("feedback.ease5")}</option>
            </select>
          </div>
        </div>
      )}

      <div className={sectionClass}>
        <label className={labelClass}>{t("feedback.commentLabel")}</label>
        <textarea
          name="comment"
          className={`${inputClass} min-h-[80px]`}
          placeholder={t("feedback.commentPlaceholder")}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p>{error}</p>
          <p className="mt-2 text-xs text-red-700/90">
            {t("feedback.errorTryEmail")}{" "}
            <span className="font-mono font-medium select-all">{t("footer.supportEmail")}</span>
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-green px-6 py-3 text-sm font-semibold text-white shadow-md shadow-green/25 hover:bg-green-dark disabled:opacity-50 disabled:pointer-events-none transition-colors sm:w-auto"
      >
        {submitting ? t("feedback.submitting") : t("feedback.submit")}
      </button>
    </form>
  );
}
