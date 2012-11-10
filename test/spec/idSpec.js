describe("thumbs.View identifier", function () {
    var tmpl, View;
    beforeEach(function () {
        tmpl = '<input type="text" data-thumbs-id="foo" val="Test Input"/>';
        View = thumbs.View.extend({
            render: function () {
                this.$el.append($(tmpl));
                this._super('render', arguments);
                return this;
            }
        });
    });

    afterEach(function () {
        View = null;
        tmpl = null;
    });

    it("provides a named property on the model object as defined in the data-id attribute", function () {
        var view = new View();
        view.render();
        expect(view.foo).toBeDefined();
    });

    it("shold provide a named property on the model with an appended '$' containing the jQuery wrapped element", function () {
        var view = new View();
        view.render();
        expect(view.$foo).toBe('input');
    });

    it("should not provide the new template properties until render is called", function () {
        var view = new View();
        expect(view.foo).not.toBeDefined();
        view.render();
        expect(view.foo).toBeDefined();
    });
});
