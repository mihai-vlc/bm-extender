# BM Extender

A chrome extension that adds custom functionality to the DW BM.

## Features

![menu](http://puu.sh/hItCr/56155b7460.png)
![search](http://puu.sh/hItOQ/6ed8eb62ec.png)
![](http://puu.sh/hIu1Z/126f0137dc.png)

### BM functionality
- sidebar menu
- search functionality in the sidebar 
- fill the export input with some default value
- action buttons with position fixed
- highlight the current row in a table
- keep the session active
- small layout fixes
- update the page title with more useful information


### Popup functionality
- Links to common places
- Logs from today

## Caching
In order for the sidebar to load faster we cache the menu received via ajax
in SessionStorage.  
**If something changes in the menu and you want to update the sidebar
you will need to delete the SessionStorage from your DevTools**  
The SessionStorage are prefixed with `dwre-sidebar-`.

## Install
**For usage**

- In Chrome go to -> [chrome://extensions/](chrome://extensions/) -> check the developer
mode -> Load unpacked extension -> select the `src/` folder for this repo  

**For development**

- In Chrome go to -> [chrome://extensions/](chrome://extensions/) -> check the developer
mode -> Load unpacked extension -> select the `src/` folder for this repo  
- Change the code and test it in the browser.

## Contributions
Please open an [issue](https://github.com/ionutvmi/bm-extender/issues) if you find any problems.  
Pull requests are welcomed.

## License
MIT (c)Mihai Ionut Vilcu 
