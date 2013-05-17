describe("Thumbs.View elFinder", function () {
    var tmpl, View;
    beforeEach(function () {
        tmpl = '<li data-thumbs-el><input type="text" data-thumbs-id="foo" val="Test Input"/></li>';
        View = Thumbs.View.extend({
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

    it("should set the el on the View", function () {
        var view = new View();
        view.render();
        expect(view.el).toBe("li");
    });
});
