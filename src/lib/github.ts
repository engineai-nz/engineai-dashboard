/**
 * GitHub MCP Wrapper Utility
 */

export const sanitizeForGit = (input: string) => 
  input.toLowerCase().replace(/[^a-z0-9._/-]/g, '-');

const STATUS_ORDER = ['backlog', 'ready-for-dev', 'in-progress', 'review', 'done'];

function getStatusWeight(status: string): number {
  return STATUS_ORDER.indexOf(status);
}

/**
 * resolveConflict
 * Generic conflict resolution. Defaults to preferring the HEAD (local) change
 * but ensures that we don't accidentally corrupt the file structure.
 */
export function resolveConflict(content: string): string {
  // Matches standard Git conflict markers
  const conflictRegex = /<<<<<<< [^\n]*\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> [^\n]*/g;
  
  const resolved = content.replace(conflictRegex, (match, head, branch) => {
    console.log(`GITHUB: Automated conflict resolution applied. Strategy: Prefers-Head.`);
    return head;
  });

  return resolved;
}

/**
 * resolveSprintStatusConflict
 * Specific strategy for merging development_status keys in sprint-status.yaml.
 * Robustified to preserve non-status lines (comments, metadata) while 
 * synchronising story statuses to the most advanced lifecycle state.
 */
export function resolveSprintStatusConflict(content: string): string {
  const conflictRegex = /<<<<<<< [^\n]*\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> [^\n]*/g;
  
  return content.replace(conflictRegex, (match, head, branch) => {
    const lineRegex = /^(\s+)([\w.-]+):\s+(\w+)\s*$/;
    const mergedMap = new Map<string, { status: string, indent: string, originalLine: string }>();
    const otherLines: string[] = [];
    
    const processBlock = (text: string) => {
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        const m = line.match(lineRegex);
        if (m) {
          const [_, indent, key, status] = m;
          const existing = mergedMap.get(key);
          // Only update if the new status is further along in the lifecycle
          if (!existing || getStatusWeight(status) > getStatusWeight(existing.status)) {
            mergedMap.set(key, { status, indent, originalLine: line });
          }
        } else if (line.trim() !== "" && !otherLines.includes(line)) {
          // Preserve unique non-status lines (like comments or metadata)
          otherLines.push(line);
        }
      }
    };

    processBlock(head);
    processBlock(branch);

    // Reconstruct the block: status lines followed by preserved metadata
    const resolvedLines = Array.from(mergedMap.values()).map(item => item.originalLine);
    return [...resolvedLines, ...otherLines].join('\n');
  });
}

/**
 * simulateConflictResolution
 * Mimics the asynchronous process of an agent identifying and resolving a git conflict.
 */
export async function simulateConflictResolution(repoName: string, fileName: string) {
  console.log(`GITHUB: Conflict detected in ${repoName}/${fileName}. Initialising autonomous resolution...`);
  
  // Simulation delay for "thought loop"
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const success = Math.random() > 0.05; // 95% success rate for automated fixes
  
  return {
    success,
    resolution_type: "Lifecycle-Aware Merge",
    timestamp: new Date().toISOString()
  };
}

export async function createRefactorBranch(repoName: string, projectId: string) {
  const sanitizedRepo = sanitizeForGit(repoName);
  const sanitizedId = sanitizeForGit(projectId);
  const branchName = `feat/refactor-${sanitizedId}`;
  
  console.log(`GITHUB: Initialising branch ${branchName} for repo ${sanitizedRepo}`);
  
  const simulatedMetadata = {
    branch: branchName,
    commit: "7f3a2b1c",
    status: "Authorised",
    url: `https://github.com/engine-ai/${repoName}/tree/${branchName}`
  };

  return simulatedMetadata;
}

/**
 * createPullRequest (Simulated for Phase 1)
 * 
 * Generates an automated pull request for the refactor branch.
 * Uses NZ English for title and descriptions.
 */
export async function createPullRequest(repoName: string, branchName: string, projectName: string) {
  const title = `[EngineAI OS] Refactor: ${projectName}`;
  const description = `Initialising automated refactor for ${projectName}. Optimising organisation constants and synchronising blueprint-to-instance mappings.`;
  
  // Simulation: Check for mergeability (90% success probability)
  const isMergeable = Math.random() > 0.1;

  const simulatedPR = {
    url: `https://github.com/engine-ai/${repoName}/pull/${Math.floor(Math.random() * 1000)}`,
    number: Math.floor(Math.random() * 1000),
    title,
    description,
    mergeable: isMergeable,
    status: isMergeable ? "Ready for Review" : "Conflict Detected"
  };

  console.log(`GITHUB: PR ${simulatedPR.number} created for ${projectName}. Mergeable: ${isMergeable}`);
  
  return simulatedPR;
}

/**
 * getRepoStatus
 */
export async function getRepoStatus(repoName: string) {
  return {
    name: repoName,
    status: "Synchronised",
    active_branch: "main",
    last_sync: new Date().toISOString()
  };
}
