/**
 * fixDW.js
 * This script will insert a sidebar for the navigation menu in the DWRE BM layout.
 * @author Mihai Ionut Vilcu <ionutvmi@gmail.com>
 * Apr 2015
 */


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

    // if we are updateing the BM modules clear the session in order to
    // keep the navigation updated
    var path = location.pathname;
    if (path.indexOf("ViewACL-BM") > -1 || path.indexOf("ViewACL-Dispatch") > -1) {
        sessionStorage.clear();
    }


    var url = location.protocol + '//' + location.host;
    var siteID = $('#SelectedSiteID option[selected]:last').html();
    var key = 'dwre-sidebar-' + location.host + siteID;

    var searchData = [];

    var siteMenuURL = url + "/on/demandware.store/Sites-Site/default/SiteNavigationBar-SiteMenuBM";
    var adminMenuURL = url + "/on/demandware.store/Sites-Site/default/SiteNavigationBar-AdminMenuBM";

    var siteMenu = getData(siteMenuURL, key + 'site')
    var adminMenu = getData(adminMenuURL, key + 'admin');
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

    var $main = $('#bm_content_column').parent();
    var $sidebar = $(sidebarTemplate);
    var $form = $('<form />').appendTo('body');
    var $searchInput;


    // attach the site id to the sidebar
    $sidebar.find('.x-site-name').html(siteID);

    // add the sidebar on the page
    $main.prepend($sidebar);

    // add the search input in the header
    $('.menu.storelink').after(searchTemplate);

    $searchInput = $('.x-search-input');

    // attach the data grabed from the request to the sidebar
    // and remove the title attribute from all the elements
    siteMenu.then(function (data) {
        $sidebar.find('.x-site')
            .append(data)
            .find('[title]')
            .removeAttr('title');
    });

    adminMenu.then(function (data) {
        $sidebar.find('.x-admin')
            .append(data)
            .find('[title]')
            .removeAttr('title');
    });

    // when both the siteMenu and the adminMenu are loaded
    // enable the seach input and extract the search data for the
    // autocomplete plugin
    $.when(siteMenu, adminMenu).done(function () {
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


    // attach the xbm-x-dw class
    $('body').addClass('xbm-x-dw');

    makeStickyButtons();

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
    if ($('.header--Sandbox').length) {
        setInterval(function () {
            // dummy request
            $.get(adminMenuURL);
        }, 600000); // every 10 min
    }


    // fix the table layout
    $('#bm_content_column').removeAttr('colspan').removeAttr('width');

    // build the preview link for the current category
    buildPreviewLink();

    // Update the page title with something more useful
    $('title').html(getPageTitle());

    fixCustomObjectSelect();

    $('select:not(.dropdown,[onfocus],[onchange])').select2();

    initializeTextAreaDiff();


    /**
     * Helper functions
     */

    function fixCustomObjectSelect() {
        // append element to make the object search on submit
        $('#SimpleObjectTypeDefinitionSelectBox').after('<input type="hidden" name="find" value="">');
    }

    function makeStickyButtons() {
        if ($('#bm_content_column > table').height() < $(window).height()) {
            return;
        }

        if ($('[name="SelectedSeriesID"]').length) {
            return;
        }

        var $button = $('[name="update"], [name="apply"], [name="assign"]').last();
        if ($button.hasClass('dw-nc-button')) {
            return;
        }

        $button
            .closest('table')
            .addClass('x-dw-buttons-table');
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
                        <textarea class="js-bm-diff-text1" placeholder="Insert text 1"></textarea>
                    </div>
                    <div class="bm-diff-panel">
                        <textarea class="js-bm-diff-text2" placeholder="Insert text 2"></textarea>
                    </div>
                    <div class="bm-diff-panel">
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

        $('.bm-diff-window').on('input', 'textarea', processDiff);

        function processDiff() {
            var text1 = $('.js-bm-diff-text1').val();
            var text2 = $('.js-bm-diff-text2').val();
            var $fragment = $(document.createDocumentFragment());
            var diff = JsDiff.diffChars(text1, text2);

            diff.forEach(function(part){
                var action = part.added ? 'added' : (part.removed ? 'delete' : '');
                var $span = $('<span />').addClass(action).text(part.value);
                $fragment.append($span);
            });

            $('.js-bm-diff-result').html($fragment);
        }
    }


})(jQuery);

