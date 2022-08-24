import * as core from "@actions/core";

import { setSuspendedState } from "./modify-chart-values.js";

async function run() {
  const chartPath = core.getInput("chart-path", { required: true });
  if (core.getInput("set-suspended", { required: false })) {
    const setSuspended = core.getBooleanInput("set-suspended", { required: false });
    await setSuspendedState(chartPath, setSuspended);
  }
}

async function runWrapper() {
  try {
    await run();
  } catch (error) {
    core.setFailed(`modify-chart-values action failed: ${error}`);
    console.log(error); // eslint-disable-line no-console
  }
}

void runWrapper();
