import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

const execAsync = promisify(exec);

/**
 * sanitizeForGit
 */
export const sanitizeForGit = (input: string) => 
  input.toLowerCase().replace(/[^a-z0-9._/-]/g, '-');

/**
 * getWorkingDir
 * 
 * Returns a unique working directory for a project refactor.
 */
export function getWorkingDir(projectId: string) {
  const sanitizedId = sanitizeForGit(projectId);
  return path.join(os.tmpdir(), `engineai-refactor-${sanitizedId}`);
}

/**
 * createNewRepoFromTemplate
 * 
 * Uses GitHub API (via fetch) to create a new repository from a template.
 */
export async function createNewRepoFromTemplate(templateOwner: string, templateRepo: string, newRepoName: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  console.log(`GITHUB: Creating new repository ${newRepoName} from template ${templateOwner}/${templateRepo}`);

  const url = `https://api.github.com/repos/${templateOwner}/${templateRepo}/generate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: newRepoName,
      description: `Automated EngineAI project: ${newRepoName}`,
      include_all_branches: false,
      private: true
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`GitHub API Error: ${data.message || response.statusText}`);
  }

  return data.html_url as string;
}

/**
 * cloneRepository
 * 
 * Clones a repository into a target directory using child_process.
 */
export async function cloneRepository(repoUrl: string, targetPath: string) {
  const token = process.env.GITHUB_TOKEN;
  let authenticatedUrl = repoUrl;
  
  // Inject token for authentication
  if (token && repoUrl.startsWith('https://github.com/')) {
    authenticatedUrl = repoUrl.replace('https://github.com/', `https://x-access-token:${token}@github.com/`);
  }

  console.log(`GITHUB: Cloning ${repoUrl} into ${targetPath}`);
  
  try {
    // Ensure parent directory exists
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    
    // Clean up target path if it exists
    try {
      await fs.rm(targetPath, { recursive: true, force: true });
    } catch {}

    const { stdout, stderr } = await execAsync(`git clone ${authenticatedUrl} ${targetPath}`);
    console.log(`GIT CLONE OUTPUT: ${stdout}`);
    if (stderr) console.error(`GIT CLONE ERROR: ${stderr}`);
    return true;
  } catch (error) {
    console.error(`GITHUB: Failed to clone repository:`, error);
    throw error;
  }
}

/**
 * createRefactorBranch
 * 
 * Legacy/Wrapper signature to maintain compatibility with current Sagas.
 * 
 * @param repoName - Used as targetPath (for simplicity/compatibility)
 * @param projectId - Used for branch naming
 */
export async function createRefactorBranch(repoName: string, projectId: string) {
  const workingDir = getWorkingDir(projectId);
  const branchName = `feat/refactor-${sanitizeForGit(projectId)}`;
  
  console.log(`GITHUB: Initialising branch ${branchName} in ${workingDir}`);
  
  try {
    // Check if directory exists, if not, we might need to clone first.
    // In a real saga, cloneRepository would be called before this.
    // For now, we'll try to checkout the branch if the dir exists.
    
    await execAsync(`git -C ${workingDir} checkout -b ${branchName}`);
    
    // Get latest commit hash
    const { stdout: commitHash } = await execAsync(`git -C ${workingDir} rev-parse --short HEAD`);
    
    const simulatedMetadata = {
      branch: branchName,
      commit: commitHash.trim(),
      status: "Authorised",
      url: `https://github.com/engine-ai/${repoName}/tree/${branchName}`
    };

    return simulatedMetadata;
  } catch (error) {
    console.warn(`GITHUB: Failed to create refactor branch (dir may not exist):`, error);
    // Return simulated for now if dir doesn't exist to avoid breaking unprovisioned sagas
    return {
      branch: branchName,
      commit: "7f3a2b1c",
      status: "Authorised (Simulated)",
      url: `https://github.com/engine-ai/${repoName}/tree/${branchName}`
    };
  }
}

/**
 * createPullRequest
 * 
 * Generates an automated pull request via GitHub API.
 */
export async function createPullRequest(repoName: string, branchName: string, projectName: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn("GITHUB_TOKEN not configured. Returning simulated PR.");
    return {
      url: `https://github.com/engine-ai/${repoName}/pull/000`,
      number: 0,
      title: `[Simulated] ${projectName}`,
      description: "Simulation mode active.",
      mergeable: true,
      status: "Simulation"
    };
  }

  const repoOwner = "engine-ai"; // Default owner
  const title = `[EngineAI OS] Refactor: ${projectName}`;
  const description = `Initialising automated refactor for ${projectName}. Optimising organisation constants and synchronising blueprint-to-instance mappings.`;
  
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        body: description,
        head: branchName,
        base: 'main'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`GITHUB: API Error:`, data);
      throw new Error(`GitHub API Error: ${data.message || response.statusText}`);
    }

    return {
      url: data.html_url,
      number: data.number,
      title,
      description,
      mergeable: data.mergeable ?? true,
      status: "Ready for Review"
    };
  } catch (error) {
    console.error(`GITHUB: PR creation failed:`, error);
    // Fallback to simulation if API fails (to allow dev testing)
    return {
      url: `https://github.com/engine-ai/${repoName}/pull/err`,
      number: 0,
      title: `[FAILED] ${projectName}`,
      description: `PR creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      mergeable: false,
      status: "API Error"
    };
  }
}

/**
 * gitLifecycle
 * 
 * Performs add, commit, and push operations using child_process.
 */
export async function gitLifecycle(targetPath: string, branchName: string, commitMessage: string) {
  console.log(`GITHUB: Committing and pushing changes in ${targetPath} to ${branchName}`);
  
  try {
    await execAsync(`git -C ${targetPath} add .`);
    
    // Check if there are changes before committing
    try {
      await execAsync(`git -C ${targetPath} diff --staged --quiet`);
      console.log(`GITHUB: No changes to commit.`);
      return { success: true, commit: "no-changes" };
    } catch (diffError) {
      // If diff returns non-zero, there are changes
      await execAsync(`git -C ${targetPath} commit -m "${commitMessage}"`);
    }
    
    await execAsync(`git -C ${targetPath} push origin ${branchName}`);
    
    const { stdout: commitHash } = await execAsync(`git -C ${targetPath} rev-parse --short HEAD`);
    
    return {
      success: true,
      commit: commitHash.trim()
    };
  } catch (error) {
    console.error(`GITHUB: Git lifecycle failure:`, error);
    throw error;
  }
}

/**
 * getRepoStatus
 */
export async function getRepoStatus(repoName: string) {
  // In a real scenario, we'd need a targetPath.
  // We'll try to find it in tmp based on sanitizeForGit(repoName)
  const targetPath = path.join(os.tmpdir(), `engineai-refactor-${sanitizeForGit(repoName)}`);

  try {
    const { stdout: branch } = await execAsync(`git -C ${targetPath} rev-parse --abbrev-ref HEAD`);
    const { stdout: status } = await execAsync(`git -C ${targetPath} status --short`);
    
    return {
      name: repoName,
      status: status.trim() === "" ? "Synchronised" : "Modified",
      active_branch: branch.trim(),
      last_sync: new Date().toISOString()
    };
  } catch (error) {
    // Fallback if directory doesn't exist
    return {
      name: repoName,
      status: "Not Initialised",
      active_branch: "unknown",
      last_sync: new Date().toISOString()
    };
  }
}
