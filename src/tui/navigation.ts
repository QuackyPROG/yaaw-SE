export type NavigationResult<T> =
  | { kind: "value"; value: T }
  | { kind: "back" }
  | { kind: "cancel" };

export function navigationValue<T>(value: T): NavigationResult<T> {
  return { kind: "value", value };
}

export function navigationBack<T = never>(): NavigationResult<T> {
  return { kind: "back" };
}

export function navigationCancel<T = never>(): NavigationResult<T> {
  return { kind: "cancel" };
}
