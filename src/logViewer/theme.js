(function () {
    const theme = window.localStorage.getItem("theme") || "";
    const darkThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const $html = $("html");

    if (darkThemeMedia.matches && !theme) {
        $html.addClass("dark");
    }

    if (theme) {
        $html.addClass(theme);
    }

    $(".js-theme-toggle").on("click", () => {
        if ($html.hasClass("dark")) {
            $html.removeClass("dark");
            $html.addClass("light");
            window.localStorage.setItem("theme", "light");
        } else {
            $html.addClass("dark");
            $html.removeClass("light");
            window.localStorage.setItem("theme", "dark");
        }
    });
})();
