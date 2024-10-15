# esTabs

## Overview

A Chrome extension is designed to improve your tab management and browsing efficiency by offering advanced features like workspaces, tab grouping, closed tab recovery, and more. The extension operates both on the UI and in the background, providing an intuitive user experience while keeping resource consumption low.

## Key Features

1. **Workspaces:** Organize your tabs into separate workspaces based on tasks or projects. Workspaces help you manage your browsing more effectively by allowing you to switch between different contexts with ease.
2. **Tab Grouping:** Auto-group tabs based on domain making it easy to track you tabs.
3. **Group Tab Management:** View all your tab groups in one place. Open any tab from a group directly from the Group Tab panel for easy access.
4. **Auto-Hibernation and Closing of Idle Tabs:** Tabs that haven’t been accessed for a while are automatically closed to free up memory and prevent browser slowdown.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/EphraimShikanga/es_tabs.git
```

2. Install dependencies using npm or yarn:

```bash
npm install
# or
yarn install
```

3. Build the project:

```bash
npm run build
# or
yarn build
```

4. Load the extension in Chrome:

- Open Chrome and go to `chrome://extensions/`.
- Enable Developer Mode in the top right corner.
- Click Load unpacked and select the `build/` directory of the project.

## Usage

### Workspaces

- **Create:** Click on the "New Workspace" button, give it a title, and start organizing your tabs.
- **Switch:** Click on any workspace to load its tabs and switch context.
- **Delete:** Click on the delete icon to delete a workspace.

### Group Tabs

- View all grouped tabs in one place.
- Open tabs directly from the Group Tab panel.

### Closed Tabs

- Recently auto-closed tabs are tracked and displayed in the Closed Tabs panel.
- Click on a tab to restore it.

### Settings

- Customize how tabs are hibernated, auto-grouped, or restored from session.
- Toggle the auto-hibernation feature on or off.
- Set the time interval for auto-hibernation.
- Set the time interval for auto-closing of tabs.
- Toggle the auto-grouping feature on or off.
- Set the number of tabs per group.

## Development

The project is built using Vite with TypeScript for fast and efficient development. The background script handles most of the heavy lifting, like managing workspaces and tracking closed tabs, ensuring that the extension runs smoothly even when handling large numbers of tabs.

### Core Files

- **App.tsx:** The main entry point for the extension’s UI components.
- **WorkContext.tsx:** Provides context and management for workspaces and tab groups.
- **background.ts:** The background script that handles tab and workspace management.

## Future Plans

- Add support for renaming workspaces.
- Improve session restoration functionality to handle complex browser sessions.
- Finalize and release the "Tabs per Group" feature.
- Optimize performance for users with hundreds of open tabs.

## Contributing

1. Fork the repository.
2. Create your feature branch:

```bash
git checkout -b feature/my-new-feature
```

3. Commit your changes:

```bash
git commit -am 'Add some feature'
```

4. Push to the branch:

```bash
git push origin feature/my-new-feature
```

5. Submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.