import { z } from "zod";

// react-hook-form leaves untouched number inputs as "" rather than
// undefined, and z.coerce.number() turns "" into 0 (Number("") === 0).
// This preprocesses blank strings to undefined first so optional numeric
// fields stay unset instead of silently becoming 0.
export const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  z.coerce.number().optional()
);
