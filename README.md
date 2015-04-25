# Demandware Sidebar

A chrome extension that adds a helper sidebar for the new demandware BM.

## Caching
In order for the sidebar to load faster we cache the menu received via ajax
in LocalStorage.  
**If something changes in the menu and you want to update the sidebar
you will need to delete the LocalStorage from your DevTools**  
The LocalStorage are prefixed with `dwre-sidebar-`.

## Install
**For usage**

- In Chrome go to -> [chrome://extensions/](chrome://extensions/) -> check the developer
mode -> Load unpacked extension -> select the `src/` folder for this repo  

**For development**

- In Chrome go to -> [chrome://extensions/](chrome://extensions/) -> check the developer
mode -> Load unpacked extension -> select the `src/` folder for this repo  
- Change the code and test it in the browser.
- run `npm install`
- run `grunt` to pack the extension

## License
MIT (c)Mihai Ionut Vilcu 
