(function () {
    const theme = window.localStorage.getItem('theme') || '';
    var darkThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');

    if (darkThemeMedia.matches && !theme) {
        $('html').addClass('dark');
    }

    if (theme) {
        $('html').addClass(theme);
    }

    $('.js-theme-toggle').on('click', () => {
        if ($('html').hasClass('dark')) {
            $('html').removeClass('dark');
            $('html').addClass('light');
            window.localStorage.setItem('theme', 'light');
        } else {
            $('html').addClass('dark');
            $('html').removeClass('light');
            window.localStorage.setItem('theme', 'dark');
        }
    });

})();
