import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as core from '@actions/core';
import { cosmiconfig } from 'cosmiconfig';
import semanticRelease from 'semantic-release';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultConfigPath = join(scriptDir, 'default.releaserc.json');

/**
 * Use the repository's own semantic-release config when it has one; otherwise
 * write the default config to `.releaserc.json` in the working directory.
 * The lookup is the same one semantic-release performs, so any config it would
 * pick up (package.json "release" key, .releaserc*, release.config.*) counts.
 */
const ensureReleaseConfig = async (cwd) => {
	const existing = await cosmiconfig('release').search(cwd);

	if (existing && !existing.isEmpty) {
		core.info(`Using existing semantic-release config: ${existing.filepath}`);
		return;
	}

	const target = join(cwd, '.releaserc.json');
	copyFileSync(defaultConfigPath, target);
	core.info(`No semantic-release config found; created ${target} from the default config.`);
};

async function run() {
	const cwd = process.cwd();

	await ensureReleaseConfig(cwd);

	const result = await semanticRelease({}, { cwd, env: process.env });

	if (!result || !result.nextRelease) {
		core.info('No release published.');

		core.exportVariable('NEW_RELEASE_PUBLISHED', 'false');
		core.setOutput('new-release-published', 'false');
		return;
	}

	const { lastRelease, nextRelease, commits } = result;

	core.info(
		`Published ${nextRelease.type} release version ${nextRelease.version} containing ${commits.length} commits.`,
	);

	if (lastRelease.version) {
		core.info(`The last release was "${lastRelease.version}".`);
	}

	const { version, notes, type, channel, gitHead, gitTag, name } = nextRelease;
	const [major, minor, patch] = version.split(/[.-]/, 3);

	// Export environment variables
	core.exportVariable('NEW_RELEASE_PUBLISHED', 'true');
	core.exportVariable('RELEASE_VERSION', version);
	core.exportVariable('RELEASE_MAJOR', major);
	core.exportVariable('RELEASE_MINOR', minor);
	core.exportVariable('RELEASE_PATCH', patch);
	core.exportVariable('RELEASE_NOTES', notes);
	core.exportVariable('RELEASE_TYPE', type);
	core.exportVariable('RELEASE_CHANNEL', channel);
	core.exportVariable('RELEASE_GIT_HEAD', gitHead);
	core.exportVariable('RELEASE_GIT_TAG', gitTag);
	core.exportVariable('RELEASE_NAME', name);

	// Export step outputs
	core.setOutput('new-release-published', 'true');
	core.setOutput('release-version', version);
	core.setOutput('release-major', major);
	core.setOutput('release-minor', minor);
	core.setOutput('release-patch', patch);
	core.setOutput('release-notes', notes);
	core.setOutput('release-type', type);
	core.setOutput('release-channel', channel);
	core.setOutput('release-git-head', gitHead);
	core.setOutput('release-git-tag', gitTag);
	core.setOutput('release-name', name);
}

run().catch(core.setFailed);
