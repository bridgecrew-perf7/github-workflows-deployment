import test from "ava";
import * as path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

import { getAppAlias } from "./chart-utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("getAppAlias", async (t) => {
  const appAlias = await getAppAlias(path.join(__dirname, "testdata/chart-valid-with-alias"));

  t.is(appAlias, "apka");
});

test("getAppAliasDefault", async (t) => {
  const appAlias = await getAppAlias(path.join(__dirname, "testdata/chart-valid-no-alias"));

  t.is(appAlias, "app");
});

test("getAppAliasInvalidChart", async (t) => {
  await t.throwsAsync(getAppAlias(path.join(__dirname, "testdata/chart-invalid-no-dependencies")), {
    message: new RegExp("^Invalid chart file .+: no 'app' dependency$"),
  });
});
