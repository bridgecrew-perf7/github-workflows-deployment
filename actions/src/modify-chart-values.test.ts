import test from "ava";
import * as fs from "fs/promises";
import * as path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

import { setSuspendedState } from "./modify-chart-values.js";
import * as util from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("resumeApplication", async (t) => {
  await util.withTmpDir(async (tmpDir) => {
    const testDataPath = "testdata/chart-suspended";
    const valuesFilePath = path.join(tmpDir, "values.yaml");
    await fs.copyFile(path.join(__dirname, testDataPath, "values.yaml"), valuesFilePath);
    await fs.copyFile(path.join(__dirname, testDataPath, "Chart.yaml"), path.join(tmpDir, "Chart.yaml"));

    await setSuspendedState(tmpDir, false);

    const valuesFileData = await fs.readFile(valuesFilePath, "utf-8");
    const toCompareValuesFileData = await fs.readFile(
      path.join(__dirname, testDataPath, "values.toCompare.yaml"),
      "utf-8",
    );

    t.deepEqual(valuesFileData, toCompareValuesFileData);
  });
});

test("suspendApplication", async (t) => {
  await util.withTmpDir(async (tmpDir) => {
    const testDataPath = "testdata/chart-resumed";
    const valuesFilePath = path.join(tmpDir, "values.yaml");
    await fs.copyFile(path.join(__dirname, testDataPath, "values.yaml"), valuesFilePath);
    await fs.copyFile(path.join(__dirname, testDataPath, "Chart.yaml"), path.join(tmpDir, "Chart.yaml"));

    await setSuspendedState(tmpDir, true);

    const valuesFileData = await fs.readFile(valuesFilePath, "utf-8");
    const toCompareValuesFileData = await fs.readFile(
      path.join(__dirname, testDataPath, "values.toCompare.yaml"),
      "utf-8",
    );

    t.deepEqual(valuesFileData, toCompareValuesFileData);
  });
});

test("suspendApplicationNoSuspendField", async (t) => {
  await util.withTmpDir(async (tmpDir) => {
    const testDataPath = "testdata/chart-no-suspend-field";
    const valuesFilePath = path.join(tmpDir, "values.yaml");
    await fs.copyFile(path.join(__dirname, testDataPath, "values.yaml"), valuesFilePath);
    await fs.copyFile(path.join(__dirname, testDataPath, "Chart.yaml"), path.join(tmpDir, "Chart.yaml"));

    await setSuspendedState(tmpDir, true);

    const valuesFileData = await fs.readFile(valuesFilePath, "utf-8");
    const toCompareValuesFileData = await fs.readFile(
      path.join(__dirname, testDataPath, "values.toCompare.yaml"),
      "utf-8",
    );

    t.deepEqual(valuesFileData, toCompareValuesFileData);
  });
});

test("suspendApplicationNoSuspendAndNameFields", async (t) => {
  await util.withTmpDir(async (tmpDir) => {
    const testDataPath = "testdata/chart-no-suspend-and-name-fields";
    const valuesFilePath = path.join(tmpDir, "values.yaml");
    await fs.copyFile(path.join(__dirname, testDataPath, "values.yaml"), valuesFilePath);
    await fs.copyFile(path.join(__dirname, testDataPath, "Chart.yaml"), path.join(tmpDir, "Chart.yaml"));

    await setSuspendedState(tmpDir, true);

    const valuesFileData = await fs.readFile(valuesFilePath, "utf-8");
    const toCompareValuesFileData = await fs.readFile(
      path.join(__dirname, testDataPath, "values.toCompare.yaml"),
      "utf-8",
    );

    t.deepEqual(valuesFileData, toCompareValuesFileData);
  });
});

test("suspendApplicationInvalidChartNoDependencies", async (t) => {
  await util.withTmpDir(async (tmpDir) => {
    const testDataPath = "testdata/chart-invalid-no-dependencies";
    await fs.copyFile(path.join(__dirname, testDataPath, "Chart.yaml"), path.join(tmpDir, "Chart.yaml"));

    t.throwsAsync(setSuspendedState(tmpDir, true), {
      message: new RegExp("^Invalid chart file .+: no 'app' dependency$"),
    });
  });
});

test("suspendApplicationInvalidChartNoAppNode", async (t) => {
  await util.withTmpDir(async (tmpDir) => {
    const testDataPath = "testdata/chart-invalid-no-app-node";
    await fs.copyFile(path.join(__dirname, testDataPath, "Chart.yaml"), path.join(tmpDir, "Chart.yaml"));
    await fs.copyFile(path.join(__dirname, testDataPath, "values.yaml"), path.join(tmpDir, "values.yaml"));

    t.throwsAsync(setSuspendedState(tmpDir, true), {
      message: new RegExp("^Invalid values file .+: expected 'app' node to be a map$"),
    });
  });
});
