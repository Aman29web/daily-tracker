import mongoose, { Model, Schema } from "mongoose";

/**
 * Guards model registration against `OverwriteModelError`, which fires
 * whenever a model's module is evaluated more than once against the same
 * mongoose connection - e.g. under vitest's per-file module isolation, or
 * a dev server hot-reload. Registering is idempotent everywhere else.
 */
export function getModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema);
}
