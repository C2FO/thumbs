describe("thumbs.View event", function () {
    var spy = sinon.spy(), View = thumbs.View.extend({
        template: '<button data-thumbs-event="click:testFunc">Test Button</button>',
        render: function () {
            this.$el.html(this.template);
            return this._super('render', arguments);
        },
        testObj: 'hello',
        testFunc: spy
    });
    var view = null;

    beforeEach(function () {
        view = new View();
    });

    afterEach(function () {
        view = null;
        spy.reset();
    });

    it("allows events to be set directly on an element", function () {
        view.render();
        view.$('button').trigger('click');
        expect(spy).toHaveBeenCalledOnce();
    });
});
