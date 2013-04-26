beforeEach(function () {
    "use strict";

    // set up custom matchers
    this.addMatchers({
        toBeAFunction: function () {
            return typeof this.actual === 'function';
        },

        toBeABoolean: function () {
            return typeof this.actual === 'boolean';
        },

        toNotBeChecked: function () {
            return !this.actual.is(':checked')
        },

        toHaveNotBeenCalled: function (spy) {
            return this.actual.notCalled;
        }
    });

    this.validResponse = function (responseText) {
        return [
            200,
            { "Content-Type": "application/json" },
            JSON.stringify(responseText)
        ];
    };

    this.invalidResponse = function (responseText, code) {
        if (!code) {
            code = 401;
        }
        return [
            code,
            { "Content-Type": "application/json" },
            JSON.stringify(responseText)
        ];
    };
});