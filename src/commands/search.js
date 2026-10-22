import { search } from "../api/resolver.js";
import { UsageError } from "../errors.js";
import { paint } from "../theme.js";
import { printResult } from "../logger.js";
import { printVerse } from "./output.js";

export async function searchCommand(context) {
  const query = context.positionals.join(" ").trim();

  if (!query) {
    throw new UsageError(`Usage: Jesus search <query>  (e.g. Jesus search "love one another")`);
  }

  const results = await search(query, context.translation, context.options);

  if (results.length === 0) {
    printResult(
      paint(`No results for "${query}"`, "muted", {
        theme: context.theme,
        enabled: context.colorEnabled,
      }),
    );
    return;
  }

  for (const verse of results) {
    printVerse(verse, context);
  }
}
