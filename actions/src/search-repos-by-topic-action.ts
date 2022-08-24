import * as core from "@actions/core";

import { searchReposByTopic } from "./search-repos-by-topic.js";

async function run() {
  const topic = core.getInput("topic", { required: true });
  const org = core.getInput("org", { required: true });
  const token = core.getInput("token", { required: true });
  await searchReposByTopic(topic, org, token);
}

async function runWrapper() {
  try {
    await run();
  } catch (error) {
    core.setFailed(`search-repos-by-topic action failed: ${error}`);
    console.log(error); // eslint-disable-line no-console
  }
}

void runWrapper();
