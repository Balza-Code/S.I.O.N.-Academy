export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string }
  | { success: false; errors: Record<string, string[] | undefined> };