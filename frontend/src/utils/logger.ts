// This file has logger helpers.

export function reportError(error: unknown) {
  if (import.meta.env.DEV) {
    console.error(error);
  }
}
