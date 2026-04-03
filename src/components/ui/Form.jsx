import React from "react";
import { useTranslation } from "../../hooks/useTranslation";

export const Form = ({
  fields,
  onSubmit,
  submitText,
  isLoading = false,
  initialValues = {},
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error on input
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
          {field.type === "textarea" ? (
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
              <option value="">{t("filter")}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium transition"
      >
        {isLoading ? t("loading") : finalSubmitText}
      </button>
    </form>
  );
};

export default Form;
