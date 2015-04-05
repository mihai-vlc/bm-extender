# Demandware Sidebar

A chrome extension that adds a helper sidebar for the new demandware BM.

## Cacheing
In order for the sidebar to load faster we cache the menu received via ajax
in localStorage. **If something changes in the menu and you want to update the sidebar
you will need to delete the localstorage from your devtools**

## Install
**For usage**

- Download the /dist/dwre-sidebar.crx file.
- Go to Menu -> More tools -> Extensions
- Drag and drop the crx file in chrome

**For development**

- In Chrome go to -> [chrome://extensions/](chrome://extensions/) -> check the developer
mode -> Load unpacked extension -> select the folder for this repo  
- Change the code and test it in the browser.
- run `npm install`
- run `grunt` to pack the extension

## Licence
MIT (c)Mihai Ionut Vilcu 
