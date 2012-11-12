describe("thumbs.View subview", function () {
    var subTmpl = '<div id="test"><input id="test-input" value="" type="text"/></div>',
        errTmpl = '<div id="test"><div data-thumbs-view="foo"></div></div>',
        dotTmpl = '<div id="test"><div data-thumbs-view="App.SubView"></div></div>',
        argTmpl = '<div id="test"><div data-thumbs-view="App.SubView" data-thumbs-args="value:1"></div></div>',
        amdTmpl = '<div id="test"><div data-thumbs-view="./SubView"></div></div>',
        view = null,
        requireMock = null;
    window.App = {
        View: thumbs.View.extend({
            render: function (tmpl) {
                this.$el.html(tmpl);
                this._super('render', arguments);
                return this;
            }
        }),
        SubView: thumbs.View.extend({
            value: null,
            initialize: function (options) {
                options = options || {};
                this.value = options.value || 0;
                this._super('initialize', arguments);
            },
            render: function () {
                this.$el.html(subTmpl);
                this.$('#test-input').val(this.value);
                this._super('render', arguments);
                return this;
            }
        })
    };

    beforeEach(function () {
            view = new App.View();
    });

    afterEach(function () {
        view.remove();
        view = null;
    });

    it("allows the declaration of a subview with dot-notation", function () {
        view.render(dotTmpl);
        expect(view.$el).toContain('input#test-input');
    });

    it("allows arguments to be passed to the subview as json", function () {
        view.render(argTmpl);
        expect(+view.$('#test-input').val()).toBe(1);
    });

    it("allows the declaration of a subview with AMD notation", function () {
        // stub out require
        window.require = sinon.stub().callsArgWith(1, App.SubView);

        view.render(amdTmpl);
        expect(view.$el).toContain('input#test-input');
    });

    it("throws an error if the notation is not recognized", function () {
        expect(function () {
            view.render(errTmpl);
        }).toThrow(new Error("Unknown Subview Error"));
    });

    it("calls remove on the subviews when the parent is removed", function () {
        view.render(dotTmpl);
        expect(view._subviews.length).toBeGreaterThan(0);
        view.remove();
        expect(view._subviews.length).toBe(0);
    });
});
