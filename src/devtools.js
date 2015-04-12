// add the new DW panel
chrome.devtools.panels.create("DW Request Log",
    null,
    "panels/request-log/index.html",
    function(panel) {
      // code invoked on panel creation
    }
);

