import * as vscode from 'vscode';
import callSN from './sn';
import { JsonTreeDataProvider } from './treeview';
import { run } from './test/suite/index';

interface Result {
	name: string;
	type: string;
	string: string;
}

interface Message {
	date: number;
	type: string;
	is_json: boolean;
	message: string;
}

interface Options {
	debug_mode: boolean;
	target: string;
	scope: string;
	user_data: string;
	user_data_type: string;
	breadcrumb: string;
	no_quotes: boolean;
	show_props: boolean;
	show_strings: boolean;
	html_messages: boolean;
	fix_gslog: boolean;
	support_hoisting: boolean;
	id: string;
	dotwalk: string;
}

interface ScriptOutput {
	type: string;
	string: string;
	results: Result[];
	messages: Message[];
	logs: any[];
	status: string;
	node_log_url: string;
	start_time: string;
	end_time: string;
	options: Options;
}

function extractScope(script: string): string {
	const regex = /\/\/\s*@scope:\s*(\w+)/;
	const match = script.match(regex);
	return match ? match[1] : 'global';
}



function formatOutput(output: ScriptOutput): [string, boolean] {
	let isAbbreviated = false;

	// Function to abbreviate long strings or strings with line breaks
	const abbreviate = (str: string) => {
		let inQuotes = false;
		let isAbbreviated = false;
		const cleanedStr = str.replace(/[\r\n" ]+|[\s\t]+/g, (match, offset, string) => {
			if (match === '"') {
				return '';
			}
			if (/\r|\n/.test(match)) {
				return '';
			}
			return inQuotes ? match : ' ';
		}).trim();

		const maxLength = 16;
		let result = cleanedStr;
		if (cleanedStr.length > maxLength) {
			result = cleanedStr.substring(0, maxLength - 3) + '...';
			isAbbreviated = true;
		}
		return { text: result, isAbbreviated };
	};

	// Create ASCII Art table header for 'results'
	const resultsHeader = '+------------------+------------------+------------------+';
	const resultsTitle = '| Name             | Type             | String           |';

	// Format the 'results' array as an ASCII Art table
	const resultsTable = [resultsHeader, resultsTitle, resultsHeader];
	output.results.forEach((result) => {
		const abbreviated = abbreviate(result.string);
		let row = `| ${result.name.padEnd(16)} | ${result.type.padEnd(16)} | ${abbreviated.text.padEnd(16)} |`;
		if (abbreviated.isAbbreviated) {
			row += " [See SNREPL Results for details]";
			isAbbreviated = true;
		}
		resultsTable.push(row);
	});
	resultsTable.push(resultsHeader);

	// Create ASCII Art table header for initial part
	const initialHeader = '+--------+------------------+';
	const initialTitle = '| Key    | Value            |';
	const initialTable = [initialHeader, initialTitle, initialHeader];

	const abbreviatedType = abbreviate(output.type);
	const abbreviatedString = abbreviate(output.string);

	let typeRow = `| Type   | ${abbreviatedType.text.padEnd(16)} |`;
	let stringRow = `| String | ${abbreviatedString.text.padEnd(16)} |`;

	if (abbreviatedType.isAbbreviated || abbreviatedString.isAbbreviated) {
		stringRow += " [See raw outputs below for details]";
		isAbbreviated = true;
	}

	initialTable.push(typeRow, stringRow, initialHeader);

	// Format the 'messages' array with separators and indentation
	const messages = output.messages.map((message) => {
		return `Message: ${message.message}`;
	}).join('\n');

	// Horizontal line for separating messages header
	const messageSeparator = '-----------------------------';

	// Combine all formatted parts
	const formattedOutput = [
		`${initialTable.join('\n')}`,
		`Results:\n${resultsTable.join('\n')}`,
		`Messages:\n${messageSeparator}\n${messages}`,
		`Status: ${output.status}`,
		`Start Time: ${output.start_time}`,
		`End Time: ${output.end_time}`,
		`-----------------------------`, // Separator
		`Raw Result:\n${output.string}`, // Raw output
		`-----------------------------`, // Separator
		`Raw Output (All):\n${JSON.stringify(output, null, 2)}` // Raw output
	].join('\n\n');

	return [formattedOutput, isAbbreviated];
}



export function activate(context: vscode.ExtensionContext) {
	const outputChannel = vscode.window.createOutputChannel("SNREPL");
	outputChannel.show(true);  // This line makes the output panel visible.

	const treeDataProvider = new JsonTreeDataProvider({});
	// Keep a reference to the TreeView
	const myTreeView = vscode.window.createTreeView('snrepl_resulttree', { treeDataProvider });
	treeDataProvider.refresh();

	// Register a command to reveal the TreeView
	vscode.commands.registerCommand('snrepl.revealTreeView', async () => {
		// Switch to the explorer
		await vscode.commands.executeCommand('workbench.view.explorer');
	});

	// Create a Status Bar item
	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBar.command = 'snrepl.revealTreeView';
	statusBar.text = 'SNREPL Results';
	statusBar.tooltip = 'Click to see more details in the TreeView';

	let disposable =
		vscode.commands.registerCommand('snrepl.runScript',
			() => {


				// Get the active text editor
				let editor = vscode.window.activeTextEditor;
				if (editor) {
					// Get credentials
					const config = vscode.workspace.getConfiguration('snrepl');
					const username = config.get('username', '');
					const password = config.get('password', '');
					const instance = config.get('instance', '');
					const cookie = config.get('cookie', '');

					if (!instance) {
						vscode.window.showErrorMessage('ServiceNow instance not configured.', 'Open Settings').then(selection => {
							if (selection === 'Open Settings') {
								vscode.commands.executeCommand('workbench.action.openSettings', '@ext:julian.hoch.snrepl');
							}
						});
						return;
					}

					if (!cookie && (!username || !password)) {
						vscode.window.showErrorMessage('ServiceNow credentials not configured.', 'Open Settings').then(selection => {
							if (selection === 'Open Settings') {
								vscode.commands.executeCommand('workbench.action.openSettings', '@ext:julian.hoch.snrepl');
							}
						});
						return;
					}

					// Get the code from the active editor
					let code = editor.document.getText();

					// Get the scope from the active editor
					const scope = extractScope(code);

					// Execute the code
					callSN(code, instance, cookie, username, password, scope).then((result) => {
						// Clear the output channel
						outputChannel.clear();

						// Format the output
						const [formattedOutput, wasAbbreviated] = formatOutput(result);
						outputChannel.appendLine(formattedOutput);
						const clipBoardText = result.string;
						vscode.env.clipboard.writeText(clipBoardText);

						// Show the output channel and take focus
						outputChannel.show(true);

						if (wasAbbreviated) {
							statusBar.show();
						} else {
							statusBar.hide();
						}

						const resultData = Array.isArray(result.results) ? result.results : [];

						// Update Tree Data
						treeDataProvider.updateData(resultData);

						// Refresh Tree View
						treeDataProvider.refresh();

						vscode.window.showInformationMessage('Script executed (scope: ' + scope + '). Results copied to clipboard.');
					}).catch((error) => {
						outputChannel.appendLine(error);
						vscode.window.showInformationMessage('Script executed (scope: ' + scope + '). Error: ' + error);
					});
				}
			});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
