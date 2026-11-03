"use node";
import { action } from "./_generated/server";

export const hello = action({ args: {}, handler: async () => "ok" });
