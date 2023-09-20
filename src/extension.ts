import * as vscode from 'vscode';
import callSN from './sn';

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


function formatOutput(output: ScriptOutput): string {
	// Create ASCII Art table header for 'results'
	const resultsHeader = '+------------------+------------------+------------------+';
	const resultsTitle = '| Name             | Type             | String           |';

	// Format the 'results' array as an ASCII Art table
	const resultsTable = [resultsHeader, resultsTitle, resultsHeader];
	output.results.forEach((result) => {
		const row = `| ${result.name.padEnd(16)} | ${result.type.padEnd(16)} | ${result.string.padEnd(16)} |`;
		resultsTable.push(row);
	});
	resultsTable.push(resultsHeader);

	// Create ASCII Art table header for initial part
	const initialHeader = '+--------+------------------+';
	const initialTitle = '| Key    | Value            |';
	const initialTable = [
		initialHeader,
		initialTitle,
		initialHeader,
		`| Type   | ${output.type.padEnd(16)} |`,
		`| String | ${output.string.padEnd(16)} |`,
		initialHeader
	];

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
		`End Time: ${output.end_time}`
	].join('\n\n');

	return formattedOutput;
}



export function activate(context: vscode.ExtensionContext) {
	const outputChannel = vscode.window.createOutputChannel("SNREPL");
	outputChannel.show(true);  // This line makes the output panel visible.

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

					if (!instance) {
						vscode.window.showErrorMessage('ServiceNow instance not configured.', 'Open Settings').then(selection => {
							if (selection === 'Open Settings') {
								vscode.commands.executeCommand('workbench.action.openSettings', '@ext:julian.hoch.snrepl');
							}
						});
						return;
					}

					if (!username || !password) {
						vscode.window.showErrorMessage('ServiceNow credentials not configured.', 'Open Settings').then(selection => {
							if (selection === 'Open Settings') {
								vscode.commands.executeCommand('workbench.action.openSettings', '@ext:julian.hoch.snrepl');
							}
						});
						return;
					}

					// Get the code from the active editor
					let code = editor.document.getText();
					// Execute the code
					callSN(code, instance, username, password).then((result) => {
						// Format the output
						let formattedOutput = formatOutput(result);
						outputChannel.appendLine(formattedOutput);
					}).catch((error) => {
						outputChannel.appendLine(error);
					});
					vscode.window.showInformationMessage('Script executed.');
				}
			});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
