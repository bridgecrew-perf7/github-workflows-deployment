import * as core from "@actions/core";
import * as github from "@actions/github";
import memoize from "fast-memoize";
import fs from "fs/promises";
import { globby } from "globby";
import path from "path";
import YAML from "yaml";

import { getAppAlias } from "./chart-utils.js";
import { setSuspendedStateInAppNode } from "./modify-chart-values.js";
import { getOwnerAndRepoFromUrl } from "./utils.js";

export async function suspendUnusedStagings(token: string) {
  const stagingPaths = await globby("**/staging-*/Chart.yaml", { onlyFiles: true });

  for (const stagingPath of stagingPaths) {
    await suspendUnusedStaging(path.dirname(stagingPath), token);
  }
}

async function suspendUnusedStaging(chartPath: string, token: string) {
  const stagingName = path.basename(chartPath);
  const appAlias = await getAppAlias(chartPath);
  const valuesFilePath = path.join(chartPath, "values.yaml");
  const valuesFieleData = await fs.readFile(valuesFilePath, "utf-8");

  const document = YAML.parseDocument(valuesFieleData);
  const appNode = document.get(appAlias);

  if (!(appNode instanceof YAML.YAMLMap)) {
    throw new Error(`Invalid values file ${valuesFilePath}: expected '${appAlias}' node to be a map`);
  }

  if (appNode.get("suspended")) {
    core.info(`Skipping ${stagingName} - already suspended`);
    return;
  }

  const { suspend, reason } = await shouldSuspendStaging(appNode, token);

  if (suspend) {
    core.info(`Suspending ${stagingName}`);
    const newAppNode = setSuspendedStateInAppNode(appNode, true);
    document.set(appAlias, newAppNode);
    await fs.writeFile(valuesFilePath, document.toString());
  } else {
    core.warning(`Cannot suspend ${stagingName} environment. ${reason}`);
  }
}

async function shouldSuspendStaging(
  appNode: YAML.YAMLMap,
  token: string,
): Promise<{ suspend: boolean; reason: string }> {
  const codeRepoUrl = appNode.get("appCodeRepo") as string;
  const compontents = appNode.get("components") as YAML.YAMLMap;
  for (const item of compontents.items) {
    const component = item.value as YAML.YAMLMap;

    const appCodeRef = component.get("appCodeRef") as string;
    if (!appCodeRef) {
      return {
        suspend: false,
        reason: `No appCodeRef for component ${item.key} is defined`,
      };
    }
    const branch = appCodeRef.replace(/^refs\/heads\//g, "");

    const componentCodeRepoUrl = (component.get("appCodeRepo") as string) || codeRepoUrl;
    if (!componentCodeRepoUrl) {
      return {
        suspend: false,
        reason: `No appCodeRepo for component ${item.key} is defined`,
      };
    }

    if (["main", "master"].includes(branch)) {
      continue;
    }

    const activeBranches = await getActiveBranchesForRepoUrl(componentCodeRepoUrl, token);
    if (activeBranches.includes(branch)) {
      return {
        suspend: false,
        reason: `Deployed ${item.key} component branch ${branch} is still active in the app code repository`,
      };
    }
  }
  return { suspend: true, reason: null };
}

async function _getActiveBranchesForRepoUrl(repoUrl: string, token: string): Promise<string[]> {
  const { owner, repo } = getOwnerAndRepoFromUrl(repoUrl);
  const octokit = github.getOctokit(token);
  const branchesData = await octokit.rest.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return branchesData.data.map((branch) => branch.name);
}

const getActiveBranchesForRepoUrl = memoize(_getActiveBranchesForRepoUrl);
