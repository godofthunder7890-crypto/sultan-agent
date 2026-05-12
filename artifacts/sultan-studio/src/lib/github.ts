export interface GitHubFile {
  path: string;
  content: string;
  sha?: string;
}

function getToken(): string {
  return localStorage.getItem("githubToken") || "";
}

export function isGitHubConfigured(): boolean {
  return getToken().length > 0;
}

export async function getFileSha(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const token = getToken();
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub error: ${res.status}`);
  const data = await res.json();
  return data.sha || null;
}

export async function pushFileToGitHub(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string | null
): Promise<void> {
  const token = getToken();
  const encoded = btoa(unescape(encodeURIComponent(content)));

  const body: Record<string, unknown> = {
    message,
    content: encoded,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub push failed: ${res.status}`);
  }
}

export async function pushProjectToGitHub(
  repoFullName: string,
  files: GitHubFile[],
  commitMessage: string,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) throw new Error("Invalid repo format (use owner/repo)");

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const sha = await getFileSha(owner, repo, file.path);
    await pushFileToGitHub(owner, repo, file.path, file.content, commitMessage, sha);
    onProgress?.(i + 1, files.length);
  }
}

export async function getRepoInfo(repoFullName: string): Promise<{ name: string; description: string; url: string } | null> {
  const token = getToken();
  const res = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    name: data.full_name,
    description: data.description || "",
    url: data.html_url,
  };
}
