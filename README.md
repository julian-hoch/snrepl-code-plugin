# snrepl - ServiceNow REPL for VSCode

## Description

`snrepl` is a VSCode extension that allows you to execute ServiceNow background scripts directly from your editor.

## Features

- Execute JavaScript code on a remote ServiceNow instance.
- View execution results and logs within VSCode.
- Securely manage ServiceNow credentials.

## Installation

This extension is not yet available on the VSCode Marketplace. To install it, package it into a `.vsix` file and then install it manually via the Extensions view in VSCode.

## Usage

1. Configure your ServiceNow credentials by going to the extension settings (`Ctrl+,` or `Cmd+,` on macOS, then search for `snrepl`).
2. Open a JavaScript file and write your ServiceNow script.
3. Run the command `Run script on instance` to execute the script.

## Configuration

- `snrepl.username`: ServiceNow Username
- `snrepl.password`: ServiceNow Password
- `snrepl.instance`: ServiceNow Instance hostname

## Prerequisites

This extension requires the Xplore toolkit utility to be installed on the target ServiceNow instance. You can find more information and download Xplore from [xploretoolkit.com](https://xploretoolkit.com/).

## Credits

This extension utilizes the Xplore toolkit, created by James Neale. Xplore is a powerful utility for exploring and testing ServiceNow instances.

- Website: [xploretoolkit.com](https://xploretoolkit.com/)
- GitHub: [Xplore GitHub](https://github.com/your-link-here)
- Twitter: [Xplore Twitter](https://twitter.com/your-link-here)

Xplore uses various open-source libraries including Bootstrap, JQuery, CodeMirror, Bootstrap Toggle, Google Code-Prettify, and jQuery Plugin: Are-You-Sure. It is licensed under the MIT License.

## License

This project is licensed under the MIT License.
