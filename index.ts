#!/usr/bin/env node

import path from 'path'
import { Terminal, ConsoleTerminalProvider } from '@rushstack/node-core-library'

import { RushConfiguration } from '@rushstack/rush-sdk'
import { commitAnalyzer } from '@semantic-release/commit-analyzer'
import chalk from 'chalk'
// import buildCommit from 'cz-customizable/buildCommit'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()

export const terminal: Terminal = new Terminal(new ConsoleTerminalProvider())

const cwd2RushConfiguration: Record<string, RushConfiguration> = {}

export const loadRushConfiguration = (cwd: string = process.cwd()): RushConfiguration => {
	let rushConfiguration: RushConfiguration = cwd2RushConfiguration[cwd]
	if (!rushConfiguration) {
		try {
			rushConfiguration = RushConfiguration.loadFromDefaultLocation({
				startingFolder: cwd,
			})
			if (!rushConfiguration) {
				throw new Error('Rush configuration not found')
			}
			cwd2RushConfiguration[cwd] = rushConfiguration
		} catch (e) {
			throw new Error('Load rush configuration failed')
		}
	}
	return rushConfiguration
}

function getCommitTypeMessage(type) {
	if (!type) {
		return 'This commit does not indicate any release'
	}
	return {
		patch: '🛠  This commit indicates a patch release (0.0.X)',
		minor: '✨  This commit indicates a minor release (0.X.0)',
		major: '💥  This commit indicates a major release (X.0.0)',
	}[type]
}

async function main(): Promise<void> {
	try {
		const rushConfig: RushConfiguration = loadRushConfiguration()
		for (const project of rushConfig.projects) {
			const packageJsonFilePath: string = path.resolve(rushConfig.rushJsonFolder, project.projectFolder)
			commitAnalyzer
				.analyzeCommits({}, { cwd: String, commits: [{ hash: '', message }], logger: console })
				.then(type => {
					/* eslint-disable no-console */
					console.info(chalk.green(`\n${getCommitTypeMessage(type)}\n`))
					console.info('\n\nCommit message:')
					console.info(chalk.blue(`\n\n${message}\n`))
					/* eslint-enable no-console */
					commit(message)
				})
				.catch(error => {
					console.error(error)
				})
		}
		terminal.writeLine('commits analyzed')
	} catch (error: any) {
		if (error.message) {
			terminal.writeErrorLine(error.message)
		} else {
			throw error
		}
		process.exit(1)
	}
}
