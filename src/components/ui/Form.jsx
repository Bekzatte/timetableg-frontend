import React from "react";
import { useTranslation } from "../../hooks/useTranslation";

export const Form = ({
  fields,
  onSubmit,
  submitText,
  isLoading = false,
  isSubmitDisabled = false,
  submitHint = "",
  initialValues = {},
  resetKey = "default",
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const previousResetKeyRef = React.useRef(resetKey);

  React.useEffect(() => {
    if (previousResetKeyRef.current !== resetKey) {
      previousResetKeyRef.current = resetKey;
      setFormData(initialValues);
      setErrors({});
    }
  }, [resetKey, initialValues]);

  const clearFieldError = React.useCallback((fieldName) => {
    if (!errors[fieldName]) {
      return;
    }
    setErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  }, [errors]);

  const validate = React.useCallback(() => {
    const nextErrors = {};

    fields.forEach((field) => {
      if (!field.required) {
        return;
      }

      const value = formData[field.name];

      if (field.type === "checkbox-group") {
        if (!Array.isArray(value) || value.length === 0) {
          nextErrors[field.name] = t("fillAllFields");
        }
        return;
      }

      if (field.type === "toggle") {
        return;
      }

      if (value === undefined || value === null || String(value).trim() === "") {
        nextErrors[field.name] = t("fillAllFields");
      }
    });

    return nextErrors;
  }, [fields, formData, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const field = fields.find((item) => item.name === name);
    setFormData((prev) => {
      let next = {
        ...prev,
        [name]: value,
      };
      if (field?.onChange) {
        next = {
          ...next,
          ...(field.onChange(value, next, prev) || {}),
        };
      }
      return next;
    });
    clearFieldError(name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(formData, setErrors);
  };

  const finalSubmitText = submitText || t("save");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.error}
        </div>
      )}
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.type === "computed" ? (
            <div className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">
              {field.render ? field.render(formData) : formData[field.name] || "-"}
            </div>
          ) : field.type === "textarea" ? (
            <textarea
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              placeholder={field.placeholder}
              required={field.required}
              rows={field.rows || 4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-gray-900 border-gray-300 ${errors[field.name] ? "border-red-500" : ""}`}
            />
          ) : field.type === "select" ? (
            <select
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              required={field.required}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-gray-900 border-gray-300 ${errors[field.name] ? "border-red-500" : ""}`}
            >
              <option value="">{field.placeholder || t("selectOption")}</option>
              {(typeof field.options === "function" ? field.options(formData) : field.options)?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === "toggle" ? (
            <label className="flex items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-3">
              <span className="text-sm font-medium text-gray-700">
                {formData[field.name] ? field.trueLabel || t("yes") : field.falseLabel || t("no")}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => {
                    clearFieldError(field.name);
                    return {
                      ...prev,
                      [field.name]: prev[field.name] ? 0 : 1,
                    };
                  })
                }
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                  formData[field.name] ? "bg-[#014531]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    formData[field.name] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          ) : field.type === "checkbox-group" ? (
            <div className="grid gap-2">
              {(typeof field.options === "function" ? field.options(formData) : field.options)?.map((opt) => {
                const currentValues = Array.isArray(formData[field.name]) ? formData[field.name] : [];
                const checked = currentValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const nextValues = event.target.checked
                          ? [...currentValues, opt.value]
                          : currentValues.filter((value) => value !== opt.value);
                        setFormData((prev) => {
                          clearFieldError(field.name);
                          return {
                            ...prev,
                            [field.name]: nextValues,
                          };
                        });
                      }}
                      className="h-4 w-4"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <input
              type={field.type || "text"}
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              placeholder={field.placeholder}
              required={field.required}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-gray-900 border-gray-300 ${errors[field.name] ? "border-red-500" : ""}`}
            />
          )}
          {errors[field.name] && (
            <p className="text-sm mt-1 text-red-600">{errors[field.name]}</p>
          )}
        </div>
      ))}
      {submitHint ? (
        <p className="text-sm text-amber-700">{submitHint}</p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading || isSubmitDisabled}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium transition"
      >
        {isLoading ? t("loading") : finalSubmitText}
      </button>
    </form>
  );
};

export default Form;
