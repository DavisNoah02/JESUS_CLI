import { searchPage } from "../api/resolver.js";
import { UsageError } from "../errors.js";
import { paint } from "../theme.js";
import { printResult } from "../logger.js";
import { printJson, printVerse } from "./output.js";

export async function searchCommand(context) {
  const query = context.positionals.join(" ").trim();

  if (!query) {
    throw new UsageError(
      `Usage: jesuschrist search <query>  (e.g. jesuschrist search "love one another")`,
    );
  }

  const page = await searchPage(query, context.translation, context.options);

  if (context.flags.json) {
    printJson("search", {
      query,
      translation: context.translation,
      limit: page.limit,
      offset: page.offset,
      total: page.total,
      source: page.source,
      verses: page.results,
    });
    return;
  }

  if (page.results.length === 0) {
    printResult(
      paint(`No results for "${query}"`, "muted", {
        theme: context.theme,
        enabled: context.colorEnabled,
      }),
    );
    return;
  }

  for (const verse of page.results) {
    printVerse(verse, context);
  }
}
