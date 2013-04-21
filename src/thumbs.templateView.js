Thumbs.TemplateView = (function (Thumbs) {

    Thumbs.templater = (function () {
        var templater = _.template;
        return function (tmplr) {
            if (tmplr) {
                templater = tmplr;
            }
            return templater;
        };
    })();

    var TemplateView = Thumbs.View.extend({
        templater: null,
        template: null,
        constructor: function () {
            if (!this.templater) {
                this.templater = Thumbs.templater;
            }
            if (this.template) {
                this._template = this.templater(this.template);
            }
        },

        getTemplateData: function () {
            return (this.model || this.collection) ? (this.model || this.collection)["toJSON"]() : {};
        },

        fillTemplate: function (data) {
            if (this._template) {
                return this._template(data || this.getTemplateData());
            } else {
                return null;
            }
        },

        renderTemplate: function () {
            if (this._template) {
                var template = this.fillTemplate();
                if (template) {
                    this.$el.html(template);
                }
            }

            return  this;
        },

        render: function () {
            return this.renderTemplate()._super("render", arguments);
        }
    });

    return TemplateView;
})(Thumbs);
