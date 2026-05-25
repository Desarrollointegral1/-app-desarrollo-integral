"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import RippleButton from "./RippleButton";

interface CTAFormProps {
  onSubmit?: (data: FormData) => void;
}

export interface FormData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

export function CTAForm({ onSubmit }: CTAFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", phone: "", message: "" });
        setTimeout(() => setSubmitStatus("idle"), 5000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }

    onSubmit?.(formData);
  };

  return (
    <div className="cta-form-wrapper">
      <motion.form
        onSubmit={handleSubmit}
        className="cta-form fade-in"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 90 }}
        viewport={{ once: true, margin: "-80px" }}
      >
        <p className="section-eyebrow" style={{ marginBottom: 12 }}>Evaluación inicial</p>
        <h3 className="form-title mask-reveal">Comencemos</h3>
        <p className="form-desc">
          Cuéntanos sobre ti y te contactaremos para una evaluación inicial sin costo.
        </p>

        {/* Name */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Nombre *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Tu nombre"
            className={`form-input ${errors.name ? "error" : ""}`}
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <span id="name-error" className="form-error" role="alert">
              {errors.name}
            </span>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            className={`form-input ${errors.email ? "error" : ""}`}
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            autoComplete="email"
          />
          {errors.email && (
            <span id="email-error" className="form-error" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Phone */}
        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Teléfono (opcional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+54 11 2000-0000"
            className="form-input"
            disabled={isSubmitting}
            autoComplete="tel"
          />
        </div>

        {/* Message */}
        <div className="form-group">
          <label htmlFor="message" className="form-label">
            Mensaje (opcional)
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Cuéntanos sobre tu objetivo..."
            rows={4}
            className="form-input form-textarea"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <RippleButton
          type="submit"
          className="form-submit"
          disabled={isSubmitting || submitStatus === "success"}
          aria-live="polite"
        >
          {isSubmitting && (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              style={{ display: "inline-block" }}
              aria-hidden="true"
            >
              ↻
            </motion.span>
          )}
          {submitStatus === "success"
            ? "✓ Enviado correctamente"
            : isSubmitting
              ? "Enviando…"
              : "Solicitar Evaluación"}
        </RippleButton>

        {/* Status Messages */}
        {submitStatus === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="form-success"
            role="status"
          >
            ¡Gracias! Nos pondremos en contacto pronto.
          </motion.div>
        )}
        {submitStatus === "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="form-error-message"
            role="alert"
          >
            Hubo un error. Intenta nuevamente.
          </motion.div>
        )}
      </motion.form>
    </div>
  );
}

export default CTAForm;
