import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Common = { label: string; hint?: string; children?: ReactNode };

export function InputField({ label, hint, ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return <label className="field"><span>{label}</span><input {...props}/>{hint && <small>{hint}</small>}</label>;
}
export function SelectField({ label, hint, children, ...props }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return <label className="field"><span>{label}</span><select {...props}>{children}</select>{hint && <small>{hint}</small>}</label>;
}
export function TextareaField({ label, hint, ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <label className="field span-2"><span>{label}</span><textarea {...props}/>{hint && <small>{hint}</small>}</label>;
}
