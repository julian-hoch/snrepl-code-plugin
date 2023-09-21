import * as vscode from 'vscode';

export class JsonTreeDataProvider implements vscode.TreeDataProvider<JsonTreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<JsonTreeItem | undefined> = new vscode.EventEmitter<JsonTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<JsonTreeItem | undefined> = this._onDidChangeTreeData.event;

    constructor(private jsonData: any) {
        this._data = astToTreeItems(jsonData);
    }

    private _data: JsonTreeItem[];

    updateData(newData: any): void {
        this._data = astToTreeItems(newData);
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: JsonTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: JsonTreeItem): vscode.ProviderResult<JsonTreeItem[]> {
        if (element) {
            return element.children;
        } else {
            return this._data;
        }
    }
}

class JsonTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly children?: JsonTreeItem[]
    ) {
        super(label, collapsibleState);
    }
}

function astToTreeItems(results: any[]): JsonTreeItem[] {
    if (!Array.isArray(results)) { return []; }
    const items: JsonTreeItem[] = [];

    results.forEach(result => {
        const { name, type, string } = result;
        if (type === 'Array') {
            const arrayData = JSON.parse(string);
            const children = arrayData.map((item: any, index: any) => {
                if (typeof item === 'object') {
                    const objectChildren = Object.entries(item).map(([key, value]) =>
                        new JsonTreeItem(`${key} = ${value}`, vscode.TreeItemCollapsibleState.None)
                    );
                    return new JsonTreeItem(`[${index}]`, vscode.TreeItemCollapsibleState.Collapsed, objectChildren);
                } else {
                    return new JsonTreeItem(`[${index}] = ${item}`, vscode.TreeItemCollapsibleState.None);
                }
            });
            items.push(new JsonTreeItem(`${name}: ${type}`, vscode.TreeItemCollapsibleState.Collapsed, children));
        } else if (type === 'Object') {
            // Assuming string is a serialized object
            let objectData;
            try {
                objectData = JSON.parse(string);
            } catch {
                objectData = {};
            }
            const children = Object.entries(objectData).map(([key, value]) =>
                new JsonTreeItem(`${key} = ${value}`, vscode.TreeItemCollapsibleState.None)
            );
            items.push(new JsonTreeItem(`${name}: ${type}`, vscode.TreeItemCollapsibleState.Collapsed, children));
        } else {
            items.push(new JsonTreeItem(`${name}: ${type} = ${string}`, vscode.TreeItemCollapsibleState.None));
        }
    });

    return items;
}






