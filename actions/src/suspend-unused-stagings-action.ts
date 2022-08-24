import * as core from "@actions/core";

import { suspendUnusedStagings } from "./suspend-unused-stagings.js";

async function run() {
  const token = core.getInput("token", { required: true });
  await suspendUnusedStagings(token);
}

async function runWrapper() {
  try {
    await run();
  } catch (error) {
    core.setFailed(`suspend-unused-stagings action failed: ${error}`);
    console.log(error); // eslint-disable-line no-console
  }
}

void runWrapper();
