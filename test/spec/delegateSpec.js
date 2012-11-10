describe("thumbs.View event", function () {
    describe("single events", function () {
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

        it("adds events set in the template to the events object", function () {
            expect(view.events).not.toBeDefined();
            view.render();
            expect(view.events).toBeDefined();
        });

        it("allows events to be set directly on an element", function () {
            view.render();
            view.$('button').trigger('click');
            expect(spy).toHaveBeenCalledOnce();
        });
    });

    describe("multiple events", function () {
        var spy = sinon.spy(), View = thumbs.View.extend({
            template: '<button data-thumbs-event="click:testFunc focus:testFunc">Test Button</button>',
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

        it("adds events set in the template to the events object", function () {
            expect(view.events).not.toBeDefined();
            view.render();
            expect(view.events).toBeDefined();
        });

        it("allows events to be set directly on an element", function () {
            view.render();
            view.$('button').trigger('click');
            expect(spy).toHaveBeenCalledOnce();
            view.$('button').trigger('focus');
            expect(spy).toHaveBeenCalledTwice();
        });
    });
});
