import { readCommand } from "./read.js";
import { searchCommand } from "./search.js";
import { randomCommand } from "./random.js";
import { todayCommand } from "./today.js";
import { configCommand } from "./config.js";

export const COMMANDS = Object.freeze({
  read: readCommand,
  search: searchCommand,
  random: randomCommand,
  today: todayCommand,
  config: configCommand
});

export { readCommand, searchCommand, randomCommand, todayCommand, configCommand };
