describe("thumbs.View subview", function () {
    var subTmpl = '<div id="test"><div id="test-subview"></div></div>',
        errTmpl = '<div id="test"><div data-thumbs-view="foo"></div></div>',
        dotTmpl = '<div id="test"><div data-thumbs-view="App.SubView"></div></div>',
        amdTmpl = '<div id="test"><div data-thumbs-view="./SubView"></div></div>',
        view = null;

    beforeEach(function () {
            window.App = {
                View: thumbs.View.extend({
                    render: function (tmpl) {
                        this.$el.html(tmpl);
                        this._super('render', arguments);
                        return this;
                    }
                }),
                SubView: thumbs.View.extend({
                    render: function () {
                        this.$el.html(subTmpl);
                        this._super('render', arguments);
                        return this;
                    }
                })
            };

            view = new App.View();
    });

    afterEach(function () {
        view.remove();
        view = null;
        delete window['App'];
    });

    it("allows the declaration of a subview with dot-notation", function () {
        view = new App.View().render(dotTmpl);
        expect(view.$el).toContain('div#test-subview');
    });

    it("allows the declaration of a subview with AMD notation", function () {
        view = new App.View().render(amdTmpl);
        expect(view.$el).toContain('div#test-subview');
    });

    it("throws an error if the notation is not recognized", function () {
        view = new App.View();
        expect(function () {
            view.render(errTmpl);
        }).toThrow(new Error("Unknown Subview Error"));
    });
});
