import { z } from "zod";

export function warnParse<T>(data: any, schema: z.ZodSchema<T>): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        console.warn(result.error);
        return data as T;
    }
    return result.data;
}

