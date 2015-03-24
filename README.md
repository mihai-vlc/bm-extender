# ~/.js

[dotjs-universal](https://github.com/p3lim/dotjs-universal) is a Chrome/Chromium browser extension that executes JavaScript and CSS files on websites based on their filename.

If you navigate to `www.google.com`, dotjs will execute `/scripts/google.com.js` and/or `/styles/google.com.css` if either of those files exist.

This makes it super easy to spruce up your favorite pages using JavaScript or CSS.

jQuery 2.1 is included and you'll be able to use that in your scripts, and, two default files `/scripts/default.js` and `/styles/default.css` will load on every page, so you'll have a place to put helper functions, libraries or style sheets in.

By going to the extension options (Settings > Extensions > dotjs universal > Options), you can get the path where your files are located.

## Warning

Unlike the original, this version does not run it's own local file server, all the files are located within the extension's own directory instead.

While this lets the extension work as a standalone extension and will work on every operating system, it has one major drawback:

When you update this extension (and by default, Chrome will do that automatically), it will delete all your existing scripts.
Because of this, I *highly* suggest you replace the directories with a symbolic link to a safe place on your drive.

See [this document](https://github.com/p3lim/dotjs-universal/blob/master/SYMLINKS.md) on how to make a symbolic link on for your system.

## Example

By adding the following to `/scripts/google.com.js`

    // swap google logo with trollface
    $('#hplogo').css({
        background: 'url(//bit.ly/ghD24e) no-repeat',
        backgroundSize: 'auto 95px'
    });

You will achieve this result upon every visit to `www.google.com`

![](http://i.imgur.com/vZ3aIT5.png)

# Install

[<img src='https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_206x58.png'>](http://bit.ly/dotjs-universal)

## Credits

- Icon: <http://raphaeljs.com/icons/>
- jQuery: <http://jquery.com/>
- Original: [Chris Wanstrath](https://github.com/defunkt)
- Ryan Tomayko for:

> "I almost wish you could just stick JavaScript in ~/.js. Do you know what I'm saying?"

## Other versions

- [dotjs-ubuntu](https://github.com/glenbot/dotjs-ubuntu)
- [dotjs](https://github.com/defunkt/dotjs)

## Other browsers

- [Firefox Add-on](https://github.com/rlr/dotjs-addon)
- [Safari Extension](https://github.com/wfarr/dotjs.safariextension)
- [Fluid UserScript](https://github.com/sj26/dotjs-fluid)
