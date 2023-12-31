(function () {
    "use strict";

    const timeAgo = {
        init() {
            timeAgo.update();
            setInterval(timeAgo.update.bind("second"), 1000);
            setInterval(timeAgo.update.bind("minute"), 60 * 1000);
            setInterval(timeAgo.update.bind("hour"), 60 * 60 * 1000);
        },
        update(step = "all") {
            let elements;

            if (step == "all") {
                elements = document.querySelectorAll(`time.js-time-ago`);
            } else {
                elements = document.querySelectorAll(`time.js-time-ago[data-step="${step}"]`);
            }

            elements.forEach((element) => {
                const date = new Date(element.getAttribute("data-time"));
                const label = ago(date);

                if (element._lastTimeLabel != label) {
                    element._lastTimeLabel = label;
                    element.innerText = label;
                    calculateStep(element);
                }
            });
        },
    };

    function calculateStep(element) {
        const date = new Date(element.getAttribute("data-time"));
        const distance = Date.now() - date;

        let step = "second";

        if (distance > 60_000) {
            step = "minute";
        }

        if (distance > 60_000 * 60) {
            step = "hour";
        }

        element.setAttribute("data-step", step);
    }

    window.timeAgo = timeAgo;

    function format(diff, divisor, unit, past, future, isInTheFuture) {
        var val = Math.round(Math.abs(diff) / divisor);
        if (isInTheFuture) return val <= 1 ? future : "in " + val + " " + unit + "s";
        return val <= 1 ? past : val + " " + unit + "s ago";
    }
    var units = [
        { max: 60000, value: 1000, name: "second", past: "a second ago", future: "in a second" },
        { max: 2760000, value: 60000, name: "minute", past: "a minute ago", future: "in a minute" },
        { max: 72000000, value: 3600000, name: "hour", past: "an hour ago", future: "in an hour" },
        { max: 518400000, value: 86400000, name: "day", past: "yesterday", future: "tomorrow" },
        { max: 2419200000, value: 604800000, name: "week", past: "last week", future: "in a week" },
        {
            max: 28512000000,
            value: 2592000000,
            name: "month",
            past: "last month",
            future: "in a month",
        }, // max: 11 months
    ];

    function ago(date, max) {
        var diff = Date.now() - date.getTime();
        // less than a second
        if (Math.abs(diff) < 1000) return "just now";
        for (var i = 0; i < units.length; i++) {
            if (Math.abs(diff) < units[i].max || (max && units[i].name === max)) {
                return format(
                    diff,
                    units[i].value,
                    units[i].name,
                    units[i].past,
                    units[i].future,
                    diff < 0
                );
            }
        }
        // `year` is the final unit.
        // same as:
        //  {
        //    max: Infinity,
        //    value: 31536000000,
        //    name: 'year',
        //    past: 'last year'
        //  }
        return format(diff, 31536000000, "year", "last year", "in a year", diff < 0);
    }
})();
