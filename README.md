# Trulioo extension
A Chrome extension built with **JavaScript** (for content scripts) and **React.js** (for the popup UI).  
This extension automates form filling using [Faker-js](https://fakerjs.dev/) and integrates seamlessly with Trulioo workflows.

# How to install:

####   1. Clone main branch to your directory
####   2. Run command `npm install` to install packages
####   3. Run command `node build` and `npm run build` to build `.jsx` file and bundle `content.js`
####   4. Open your browser extension management page. Choose developer mode, click `Load unpacked`
####   5. Select the directory which contain the project and choose `build` directory to load

<br>

# How to run app in the development mode

####   1. Clone main branch to your directory
####   2. Run command `npm install` to install packages
####   3. Un-comment `chrome.action.onClicked.addListener` function in file `background.js`
####   4. Run command `node build` and `npm run build` to build `.jsx` file and bundle `content.js`
####   5. Open your browser extension management page. Choose developer mode, click `Load unpacked`
####   6. Select the directory which contain the project and choose `build` directory to load
####   7. Run command `npm start` to start popup as a ReactJs App and you can open popup as a window when click extension icon in browser
