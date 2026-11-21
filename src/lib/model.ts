import type { ModelOption } from './types';

/** claude-opus-5-5 → Opus 5.5; anything else is shown as is. */
export function formatModel(m: string) {
  const x = /^claude-([a-z]+)-(\d+)(?:-(\d+))?/.exec(m);
  if (!x) return m;
  return `${x[1][0].toUpperCase()}${x[1].slice(1)} ${x[2]}${x[3] && x[3].length <= 2 ? `.${x[3]}` : ''}`;
}

/** The option a model id belongs to: same `value`, or an alias whose `resolved_model` is that id. */
export function findModel(model: string | null | undefined, models?: ModelOption[]) {
  if (!model || !models) return undefined;
  return models.find((o) => o.value === model) ?? models.find((o) => o.resolved_model === model);
}

/** Human label for a session's model; null means the engine default. */
export function modelLabel(model: string | null | undefined, models?: ModelOption[]) {
  if (!model) return 'Default';
  return findModel(model, models)?.display_name ?? formatModel(model);
}
