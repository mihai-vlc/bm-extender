/**
 * fixDW.js
 * This script will insert a sidebar for the navigation menu in the DWRE BM layout.
 * @author Mihai Ionut Vilcu <ionutvmi@gmail.com>
 * Apr 2015
 */

/*jshint esversion: 6 */

(function ($) {

    var Storage = {
        setItem: function (key, value) {
            sessionStorage.setItem(key, value);
        },
        getItem: function (key) {
            return sessionStorage.getItem(key);
        }
    };


    // perform the requests for the navigation only
    // if the user is logged in
    if ( ! $('.loggedin').length) {
        return;
    }

    var appOptions = $('#bm-extender-app-options').data('options');

    // if we are updating the BM modules clear the session in order to
    // keep the navigation updated
    var path = location.pathname;
    if (path.indexOf("ViewACL-BM") > -1 || path.indexOf("ViewACL-Dispatch") > -1) {
        sessionStorage.clear();
    }


    var url = location.protocol + '//' + location.host;
    var siteID = $('#SelectedSiteID option[selected]:last').html();
    var key = 'dwre-sidebar-' + location.host + siteID;
    var isSidebarDisabled = (appOptions.disableSidebar == 'true');

    var searchData = [];

    var siteMenuURL = url + "/on/demandware.store/Sites-Site/default/SiteNavigationBar-SiteMenuBM";
    var adminMenuURL = url + "/on/demandware.store/Sites-Site/default/SiteNavigationBar-AdminMenuBM";

    var siteMenu = getData(siteMenuURL, key + 'site');
    var adminMenu = getData(adminMenuURL, key + 'admin');
    var catalogsMenu = getCatalogsList();

    var searchTemplate = [
        '<div class="x-search">',
            '<input disabled type="text" class="x-search-input perm_not_disabled" ng-model="xIgnore" placeholder=" Search">',
        '</div>'].join('');

    var sidebarTemplate = [
        '<td class="x-sidebar">',
            searchTemplate,
            '<h4>Site - <b class="x-site-name"></b></h4>',
            '<div class="x-site"></div>',
            '<h4>Administration</h4>',
            '<div class="x-admin"></div>',
        '</td>'].join('');

    var $uiWrapper = $('.bm-ui-wrapper');
    var $main = $('#bm_content_column').parent();
    var $sidebar = $(sidebarTemplate);
    var $form = $('<form />').appendTo('body');
    var $searchInput;


    // attach the site id to the sidebar
    $sidebar.find('.x-site-name').html(siteID);

    // add the sidebar on the page
    if (!isSidebarDisabled) {
        if ($uiWrapper.length > 0) {
            // page has a full width agular application on it
            $uiWrapper.prepend($sidebar);
        } else {
            $main.prepend($sidebar);
        }
    }

    // add the search input in the header
    $('.menu.storelink').last().after(searchTemplate);

    $searchInput = $('.x-search-input');

    // attach the data grabbed from the request to the sidebar
    // and remove the title attribute from all the elements
    siteMenu.then(function (data) {
        $sidebar.find('.x-site')
            .append(data)
            .find('[title]')
                .removeAttr('title')
            .end()
            // clear the csrf token so it will be reloaded automatically by the BM code
            .find('[href*="csrf_token"]')
            .each(function() {
                this.href = removeURLParameter(this.href, 'csrf_token');
            });

        // append the list of catalogs
        catalogsMenu.then(function (catalogs) {
            var subItems = [
                {
                    url: '/on/demandware.store/Sites-Site/default/ViewChannelCatalogList_52-SearchStart',
                    name: 'Search Catalogs'
                }
            ];

            if (catalogs && catalogs.length) {
                subItems = subItems.concat(catalogs);
            }

            subItems.push({
                url: '/on/demandware.store/Sites-Site/default/ViewCatalogImport_52-SelectFile',
                name: 'Import Catalogs'
            });
            subItems.push({
                url: '/on/demandware.store/Sites-Site/default/ViewCatalogExport_52-SelectCatalog',
                name: 'Export Catalogs'
            });
            subItems.push({
                url: '/on/demandware.store/Sites-Site/default/ViewCatalogImpex_52-BrowseImportFiles',
                name: 'Upload Catalogs'
            });

            var subItemsHtml = subItems.map(function (item) {
                var { name, url } = item;
                return (`<div class="overview_item_bm">
                    <div class="overview_subtitle_bm">
                        <a href="${url}" class="overview_subtitle_bm bm-menu-item">
                            ${name}
                        </a>
                    </div>
                </div>`);
            }).join('\n');
            $sidebar.find('.x-site').find('[data-automation="prod-cat_catalogs"]').append(`
                <div class="menu_items_bm">${subItemsHtml}</div>
            `);
        });
    });

    adminMenu.then(function (data) {
        $sidebar.find('.x-admin')
            .append(data)
            .find('[title]')
                .removeAttr('title')
            .end()
            // clear the csrf token so it will be reloaded automatically by the BM code
            .find('[href*="csrf_token"]')
            .each(function() {
                this.href = removeURLParameter(this.href, 'csrf_token');
            });
    });

    // when both the siteMenu and the adminMenu are loaded
    // enable the seach input and extract the search data for the
    // autocomplete plugin
    $.when(siteMenu, adminMenu, catalogsMenu).done(function () {
        $sidebar.find('a').each(function(i) {
            var $t = $(this);
            var cat = '';
            var $parent = $t.closest('.menu_items_bm');
            if ($parent.length) {
                cat = $parent.parent().find('.bm-menu-head a').text();
            }

            searchData.push({
                value: $(this).text().trim(),
                url: $(this).attr('href'),
                data: {
                    category: cat
                }
            });
        });

        searchData.push.apply(searchData, getSpecialSearchData());
        $searchInput.removeAttr('disabled');

        trackRecentlyViewedSections(searchData);
        renderRecentlyViewedSections();
    });

    // load the autocomplete plugin
    $searchInput.autocomplete({
        lookup: searchData,
        preserveInput: true,
        groupBy: 'category',
        autoSelectFirst: true,
        onSelect: function (suggestion) {

            if ($.isFunction(suggestion.onSelect)) {
                suggestion.onSelect.call(this);
                return;
            }

            window.location.href = suggestion.url;
        },
        lookupFilter: function (suggestion, originalQuery, queryLowerCase) {
            return suggestion.special ||
                suggestion.value.toLowerCase().indexOf(queryLowerCase) !== -1;
        }
    });

    fillExportField();


    // This css class is used for activating the CSS styles on the
    // custom elements on the page (sidebar and search box)
    $('body').addClass('xbm-x-dw');

    makeStickyButtons();
    addLockButton();

    $('.table_detail, .table_detail4').each(function () {
        var $t = $(this);
        // avoid nested tables
        if ( ! $t.find('.table_detail, .table_detail4').length) {
            $t.closest('table').addClass('x-dw-table-detail');
        }

    });

    $('td input[type="checkbox"]').on('change', function () {
        var method = this.checked ? 'addClass' : 'removeClass';
        $(this).closest('tr')[method]('x-dw-active-row');
    });

    // keep the session active
    setInterval(function () {
        // dummy request
        $.get(adminMenuURL);
    }, 600000); // every 10 min


    // fix the table layout
    $('#bm_content_column').removeAttr('colspan').removeAttr('width');

    // build the preview link for the current category
    buildPreviewLink();

    // Update the page title with something more useful
    $('title').html(getPageTitle());

    fixCustomObjectSelect();

    $('select:not(.dropdown,.dropwown,[onfocus],[onchange])').select2();

    initializeTextAreaDiff();

    if (!appOptions.disableBackgroundSiteChange) {
        initializeBackgroundSiteChange();
    }

    /**
     * Helper functions
     */

    function fixCustomObjectSelect() {
        // append element to make the object search on submit
        $('#SimpleObjectTypeDefinitionSelectBox').after('<input type="hidden" name="find" value="">');
    }

    function makeStickyButtons() {
        var wrapperSelector = 'table';

        if ($('#bm_content_column > table').height() < $(window).height()) {
            return;
        }

        if ($('[name="SelectedSeriesID"], [name="BasketPrefs_BasketLifetime"]').length) {
            return;
        }

        // order preferences page
        if ($('[name="GenerateCustomerNumberEnabled"]').length) {
            wrapperSelector = 'div';
        }

        var $button = $('[name="update"], [name="apply"], [name="assign"]').last();
        if ($button.hasClass('dw-nc-button')) {
            return;
        }

        $button
            .closest(wrapperSelector)
            .addClass('x-dw-buttons-table');
    }

    function addLockButton() {
        var $lockLink = $('table.confirm_box .table_detail_link');

        if (!$lockLink.length) {
            return;
        }

        var lockLink = $lockLink.attr('href');
        var lockText = $lockLink.text();

        if (!lockLink.match(/(lock=lock|unlock=unlock)/)) {
            return;
        }

        $('.x-dw-buttons-table').find('tr:first').append(`<td>
            <a class="button" href="${lockLink}">${lockText}</a>
        </td>`);
    }

    // grab the data from the ajax request and cache it
    // in the storage
    function getData(url, key) {
        var d = new $.Deferred();
        if ( ! key || ! Storage.getItem(key)) {
            return $.get(url).then(function (data) {
                Storage.setItem(key, data);
                return data;
            });
        }

        d.resolve(Storage.getItem(key));
        return d.promise();
    }


    function getCatalogsList() {
        var catalogsListURL = "/on/demandware.store/Sites-Site/default/ViewChannelCatalogList_52-Start";
        return getData(catalogsListURL, key + 'catalogs').then(function(data) {
            var $catalogs = $(data).find('form[name="MasterCatalogForm"]').find('a.catalog');
            if (!$catalogs.length) {
                return [];
            }
            return $catalogs.map(function() {
                return {
                    name: this.innerText,
                    url: removeURLParameter(this.href, 'csrf_token')
                };
            }).toArray();
        });
    }

    function searchProducts(query) {
        var $hidden = $('<input type="hidden" />');
        $hidden.attr('name', 'WFSimpleSearch_NameOrID');
        $hidden.val(query);

        // build and submit the form
        $form.empty();
        $form.attr('action', '/on/demandware.store/Sites-Site/default/ViewProductList_52-Dispatch');
        $form.attr('method', 'post');

        $form.append($hidden);
        $form.append('<input type="hidden" name="SearchType" value="simple" />');
        $form.append('<input type="hidden" name="DefaultButton" value="simple" />');
        $form.append('<input type="hidden" name="findSimple" value="" />');
        $form.submit();
    }

    function searchCustomers(query) {
        var $hidden = $('<input type="hidden" />');
        $hidden.attr('name', 'WFCustomerSimpleSearch_SearchTerm');
        $hidden.val(query);

        // build and submit the form
        $form.empty();
        $form.attr('action', '/on/demandware.store/Sites-Site/default/ViewCustomers-Dispatch');
        $form.attr('method', 'post');

        $form.append($hidden);
        $form.submit();
    }

    function searchContent(query) {
        var $hidden = $('<input type="hidden" />');
        $hidden.attr('name', 'SearchTerm');
        $hidden.val(query);

        // build and submit the form
        $form.empty();
        $form.attr('action', '/on/demandware.store/Sites-Site/default/ViewLibraryContentList_52-Dispatch');
        $form.attr('method', 'post');

        $form.append($hidden);
        $form.submit();
    }

    function searchOrders(query) {
        var $hidden = $('<input type="hidden" />');
        $hidden.attr('name', 'OrderSearchForm2_SimpleSearchTerm');
        $hidden.val(query);

        // build and submit the form
        $form.empty();
        $form.attr('action', '/on/demandware.store/Sites-Site/default/ViewOrderList_52-Dispatch');
        $form.attr('method', 'get');

        $form.append($hidden);
        $form.append('<input type="hidden" name="simpleSearch" value="" />');

        $form.submit();
    }


    function fillExportField() {
        // auto complete the name field for export
        var d = new Date();
        var exportName = 'export_' + (d.getMonth()+1) + '_' + d.getDate();
        var pageName = $('a.breadcrumb').last().text().split(' ')[0];

        if (pageName) {
            exportName += '_' + pageName.toLowerCase();
        }
        $("input[name$=File][type=text]").val(exportName);

    }

    function getSpecialSearchData() {
        return [
            {
                value: "Search product",
                special: true,
                onSelect: function () {
                    var val = $(this).val().trim();
                    searchProducts(val);
                },
                data: {
                    category: "Default"
                }
            },
            {
                value: "Search customer",
                special: true,
                onSelect: function () {
                    var val = $(this).val().trim();
                    searchCustomers(val);
                },
                data: {
                    category: "Default"
                }
            },
            {
                value: "Search content",
                special: true,
                onSelect: function () {
                    var val = $(this).val().trim();
                    searchContent(val);
                },
                data: {
                    category: "Default"
                }
            },
            {
                value: "Search orders",
                special: true,
                onSelect: function () {
                    var val = $(this).val().trim();
                    searchOrders(val);
                },
                data: {
                    category: "Default"
                }
            }
        ];

    }

    function getCurrentCategory() {
        var $el = $('.button.bm-category-gridview');

        if ($el.length) {
            return $el.attr('href').split('!').pop();
        }

        return null;
    }

    function buildPreviewLink() {
        var catId = getCurrentCategory();

        if (! catId) {
            return;
        }

        var html =
            '<a href="/on/demandware.store/Sites-Site/default/ViewStorefront-Catalog?cgid='+ catId +'" target="_blank">' +
                '<img src="/on/demandware.static/Sites-Site/-/default/v1441242768498/images/preview_ico.gif" title="Preview category in the storefront." alt="Preview" border="0">' +
            '</a>';

        $('#bm-breadcrumb td').first().append(html);

    }

    function getPageTitle() {
        var $title = $('.overview_title');

        if ( ! $title.length) {
            $title = $('#bm-breadcrumb')
        }

        if ( ! $title.length) {
            $title = $('.library-breadcrumb')
        }

        if ( ! $title.length) {
            $title = $('title')
        }

        return $title.text();
    }

    function initializeTextAreaDiff() {
        var $textareas = $('textarea');
        var $body = $('body');

        if (!$textareas.length) {
            return;
        }

        $textareas.each(function() {
            $(this).after('<a href="#" class="js-bm-diff-open">diff</a>');
        });


        var diffTemplate = `
            <div class="bm-diff-window" hidden>
                <button class="bm-diff-close js-bm-diff-close">x</button>
                <div class="bm-diff-bar">BM Extender Diff</div>
                <div class="bm-diff-body">
                    <div class="bm-diff-panel">
                        <textarea class="js-bm-diff-text1 js-bm-synch-scroll" placeholder="Insert text 1"></textarea>
                    </div>
                    <div class="bm-diff-panel">
                        <textarea class="js-bm-diff-text2 js-bm-synch-scroll" placeholder="Insert text 2"></textarea>
                    </div>
                    <div class="bm-diff-panel js-bm-synch-scroll">
                        <pre class="js-bm-diff-result"></pre>
                    </div>
                </div>
            </div>
        `;

        $body.append(diffTemplate);

        $body.on('click', '.js-bm-diff-close', function(event) {
            event.preventDefault();
            $('.bm-diff-window').attr('hidden', true);
        });

        $body.on('click', '.js-bm-diff-open', function() {
            event.preventDefault();
            $('.bm-diff-window')
                .removeAttr('hidden')
                .find('textarea').removeAttr('disabled');

            var inputText = $(this).prev('textarea').val();
            $('.js-bm-diff-text1').val(inputText);
        });

        var timeout;
        $('.js-bm-synch-scroll').on('scroll', function() {
            var scrollTop = $(this).scrollTop();
            var scrollLeft = $(this).scrollLeft();

            if (timeout) {
                clearTimeout(timeout);
            }

            timeout = setTimeout(function() {
                $('.js-bm-synch-scroll').not(this)
                    .scrollTop(scrollTop)
                    .scrollLeft(scrollLeft);
            }, 150);
        });

        $('.bm-diff-window').on('input', 'textarea', processDiff);

        function processDiff() {
            var text1 = $('.js-bm-diff-text1').val();
            var text2 = $('.js-bm-diff-text2').val();
            var $fragment = $(document.createDocumentFragment());
            var diff = Diff.diffLines(text1, text2);

            diff.forEach(function(part){
                var action = part.added ? 'added' : (part.removed ? 'delete' : '');
                var $part = $('<span />').addClass(action).text(part.value);
                $fragment.append($part);
            });

            $('.js-bm-diff-result').html($fragment);
        }
    }

    function removeURLParameter(url, parameter) {
        //prefer to use l.search if you have a location/link object
        var urlparts= url.split('?');
        if (urlparts.length>=2) {

            var prefix= encodeURIComponent(parameter)+'=';
            var pars= urlparts[1].split(/[&;]/g);

            //reverse iteration as may be destructive
            for (var i= pars.length; i-- > 0;) {
                //idiom for string.startsWith
                if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                    pars.splice(i, 1);
                }
            }

            url= urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : "");
            return url;
        } else {
            return url;
        }
    }

    /**
     * Performs the site change via an ajax request and reloads the current page
     * in order to stay on the same page and avoid unecessary clicks.
     */
    function initializeBackgroundSiteChange() {
        var $siteSelect = $('#SelectedSiteID');
        $siteSelect.attr('onchange', '');

        $siteSelect.on('change', function (e) {
            var $form = $siteSelect.closest('form');
            $.post($form.attr('action'), $form.serialize()).then(function() {
                relaodAsGet();
            });
        });
    }

    // reload as a GET request
    function relaodAsGet() {
        // angular UI keeps the current page in the URL hash
        // we know that that inial page load was a get
        if (window.location.href.indexOf('#')) {
            window.location.reload();
        } else {
            // avoid resubmitting the forms
            window.location.href = window.location.href;
        }
    }

    /**
     * Keeps track of the BM sections visited recently.
     */
    function trackRecentlyViewedSections() {
        var currentPage = window.location.href;
        var lastSections = getLastVisitedSections();

        searchData.filter(x => x.url).forEach(function (page) {
            if (currentPage.indexOf(page.url) > -1) {
                if (lastSections.filter(x => x.url == page.url).length) {
                    return;
                }

                lastSections.push({
                    label: $.trim(page.value),
                    url: page.url
                });
            }
        });

        lastSections = lastSections.slice(-5);

        // becuase on standard old BM pages `toJSON` is defined
        // on the array protorype which causes the data to be
        // stirngified twice
        if (lastSections.toJSON) {
            jsonSections = lastSections.toJSON();
        } else {
            jsonSections = JSON.stringify(lastSections);
        }

        localStorage.setItem('bm_extender_last_pages', jsonSections);
    }

    /**
     * Renders a navigation links at the top of the page with the visited links
     */
    function renderRecentlyViewedSections() {
        var lastSections = getLastVisitedSections();

        if (lastSections.length) {
            var linksHtml = lastSections.map(page => {
                return `<a href="${page.url}">${page.label}</a>`;
            }).join(' | ');


            if ($('#bm_header_row').length) {
                $('#bm_header_row').after(`
                    <tr class="bm-recent-links">
                        <td colspan="9">${linksHtml}</td>
                    </tr>
                `);
            } else {
                $uiWrapper.before(`
                    <div class="bm-recent-links">
                        ${linksHtml}
                    </div>
                `);
            }
        }

    }

    function getLastVisitedSections() {
        var lastSections = [];
        try {
            lastSections = JSON.parse(localStorage.getItem('bm_extender_last_pages') || '[]');
        } catch (e) {
            console.error(e);
            localStorage.setItem('bm_extender_last_pages', '[]');
        }

        return lastSections;
    }

})(jQuery);

