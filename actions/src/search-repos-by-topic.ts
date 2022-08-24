import * as core from "@actions/core";
import * as github from "@actions/github";

export async function searchReposByTopic(topic: string, org: string, token: string) {
  const octokit = github.getOctokit(token);
  const search = await octokit.rest.search.repos({
    q: `org:${org} topic:${topic}`,
    per_page: 100,
  });
  if (search.data.incomplete_results) {
    throw new Error("Incomplete search results, not implemented");
  }

  core.setOutput("result", JSON.stringify(search.data.items.map((item) => item.full_name)));
}
