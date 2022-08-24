import * as fs from "fs/promises";
import cloneDeep from "lodash.clonedeep";
import * as path from "path";
import * as YAML from "yaml";

import { getAppAlias } from "./chart-utils.js";

export async function setSuspendedState(chartPath: string, suspended: boolean) {
  const appAlias = await getAppAlias(chartPath);
  const valuesFilePath = path.join(chartPath, "values.yaml");
  const valuesFieleData = await fs.readFile(valuesFilePath, "utf-8");

  const document = YAML.parseDocument(valuesFieleData);
  const appNode = document.get(appAlias);

  if (!(appNode instanceof YAML.YAMLMap)) {
    throw new Error(`Invalid values file ${valuesFilePath}: expected '${appAlias}' node to be a map`);
  }
  const newAppNode = setSuspendedStateInAppNode(appNode, suspended);
  document.set(appAlias, newAppNode);
  await fs.writeFile(valuesFilePath, document.toString());
}

export function setSuspendedStateInAppNode(appNode: YAML.YAMLMap, suspended: boolean): YAML.YAMLMap {
  const result = cloneDeep(appNode);

  if (result.has("suspended")) {
    result.set("suspended", suspended);
  } else {
    const pos = result.items.findIndex((elem) => YAML.isScalar(elem.key) && elem.key.value == "fullnameOverride");
    const pair = new YAML.Pair(new YAML.Scalar("suspended"), new YAML.Scalar(suspended));
    result.items.splice(pos + 1, 0, pair);
    if (pos >= 0) {
      pair.key.spaceBefore = true;
    } else {
      (result.items.at(pos + 2).key as YAML.Node).spaceBefore = true;
    }
  }

  if (suspended) {
    const compontents = result.get("components") as YAML.YAMLSeq;

    for (const item of compontents.items) {
      const component = (item as YAML.Pair<YAML.Scalar, YAML.YAMLMap>).value;

      if (component.has("appCodeRef")) {
        component.set("appCodeRef", "refs/heads/master");
      } else {
        const pos = component.items.findIndex(
          (elem: YAML.Pair) => YAML.isScalar(elem.key) && elem.key.value == "image",
        );
        component.items.splice(pos, 0, new YAML.Pair("appCodeRef", "refs/heads/master"));
      }

      if (component.has("appCodeCommit")) {
        component.set("appCodeCommit", "");
      } else {
        const pos = component.items.findIndex(
          (elem: YAML.Pair) => YAML.isScalar(elem.key) && elem.key.value == "appCodeRef",
        );
        component.items.splice(pos + 1, 0, new YAML.Pair("appCodeCommit", ""));
      }
    }
  }

  return result;
}
