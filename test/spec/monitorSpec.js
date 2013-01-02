describe("thumbs.View Monitor", function () {
    var View = thumbs.View.extend({
        template: null,

        initialize: function (options) {
            this._super("initialize", arguments);
            if (this.template) {
                this.template = _.template(this.template);
            }
        },

        _getData: function () {
            var data = this.model ? this.model.toJSON() : this.collection ? data = this.collection.toJSON() : {};
            return data;
        },

        // default render functionality is to set the el html to the
        // compiled template run with the model data
        // override if that's not what's needed
        render: function () {
            if (this.template) {
                this.$el.html(this.template(this._getData()));
            }
            this._super("render", arguments);
            return this;
        }

    });


    describe("should set monitor properties based on data-thumbs-bind", function () {

        var TestView = View.extend({
            template: '<p><div data-thumbs-bind="firstName"></div><div data-thumbs-bind="lastName"></div></p>'
        });


        var TestModel = thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({firstName: "Bob", lastName: "Yukon"});
            this.view = new TestView({ model: this.model });
        });

        it("should set initial values", function () {
            this.view.render();
            expect(this.view.$('[data-thumbs-bind="firstName"]')).toHaveText("Bob");
            expect(this.view.$('[data-thumbs-bind="lastName"]')).toHaveText("Yukon");
        });

        it("should detect changes values", function () {
            this.view.render();
            this.model.set("firstName", "Sally");
            expect(this.view.$('[data-thumbs-bind="firstName"]')).toHaveText("Sally");
            expect(this.view.$('[data-thumbs-bind="lastName"]')).toHaveText("Yukon");
        });

        it("should set to empty string if null", function () {
            this.view.render();
            this.model.set("lastName", null);
            expect(this.view.$('[data-thumbs-bind="firstName"]')).toHaveText("Bob");
            expect(this.view.$('[data-thumbs-bind="lastName"]')).toHaveText("");
        });

        it("should set to empty string if undefined", function () {
            this.view.render();
            this.model.set("lastName", undefined);
            expect(this.view.$('[data-thumbs-bind="firstName"]')).toHaveText("Bob");
            expect(this.view.$('[data-thumbs-bind="lastName"]')).toHaveText("");
        });

        it("should reset if set back to a defined value", function () {
            this.view.render();
            this.model.set({lastName: undefined, firstName: null});
            this.model.set({lastName: "Yukon", firstName: "Bob"});
            expect(this.view.$('[data-thumbs-bind="firstName"]')).toHaveText("Bob");
            expect(this.view.$('[data-thumbs-bind="lastName"]')).toHaveText("Yukon");
        });


    });

    describe("data-thumbs-bind with specified with form fields", function () {

        var TestView = View.extend({
            template: '<p><input type="radio" data-thumbs-bind="isChecked"/><input data-thumbs-bind="lastName"/></p>'
        });


        var TestModel = thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({isChecked: true, lastName: "Yukon"});
            this.view = new TestView({ model: this.model });
        });

        it("should set initial values", function () {
            this.view.render();
            expect(this.view.$('[data-thumbs-bind="isChecked"]')).toBeChecked();
            expect(this.view.$('[data-thumbs-bind="lastName"]')).toHaveValue("Yukon");
        });

        it("should update values", function () {
            this.view.render();
            this.model.set({isChecked: false, lastName: "YUKON"});
            expect(this.view.$('[data-thumbs-bind="isChecked"]')).toNotBeChecked();
            expect(this.view.$('[data-thumbs-bind="lastName"]')).toHaveValue("YUKON");
        });

        it("should update values", function () {
            this.view.render();
            this.model.set({isChecked: false, lastName: null});
            expect(this.view.$('[data-thumbs-bind="isChecked"]')).toNotBeChecked();
            expect(this.view.$('[data-thumbs-bind="lastName"]')).toHaveValue("");
        });

    });

    describe("should set monitor properties based on data-thumbs-bind with specified values", function () {

        var TestView = View.extend({
            template: '<p><input type="radio" data-thumbs-bind="checked:isChecked"/><input data-thumbs-bind="val:lastName"/></p>'
        });


        var TestModel = thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({isChecked: true, lastName: "Yukon"});
            this.view = new TestView({ model: this.model });
        });

        it("should set initial values", function () {
            this.view.render();
            expect(this.view.$('[data-thumbs-bind="checked:isChecked"]')).toBeChecked();
            expect(this.view.$('[data-thumbs-bind="val:lastName"]')).toHaveValue("Yukon");
        });

        it("should update values", function () {
            this.view.render();
            this.model.set({isChecked: false, lastName: "YUKON"});
            expect(this.view.$('[data-thumbs-bind="checked:isChecked"]')).toNotBeChecked();
            expect(this.view.$('[data-thumbs-bind="val:lastName"]')).toHaveValue("YUKON");
        });

        it("should update values", function () {
            this.view.render();
            this.model.set({isChecked: false, lastName: null});
            expect(this.view.$('[data-thumbs-bind="checked:isChecked"]')).toNotBeChecked();
            expect(this.view.$('[data-thumbs-bind="val:lastName"]')).toHaveValue("");
        });

    });

    describe("data-thumbs-bind-class", function () {

        var TestView = View.extend({
            template: '<p data-thumbs-bind-class="visible:isChecked"></p>'
        });


        var TestModel = thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({isChecked: true, lastName: "Yukon"});
            this.view = new TestView({ model: this.model });
        });

        it("should set initial values", function () {
            this.view.render();
            expect(this.view.$('[data-thumbs-bind-class="visible:isChecked"]')).toHaveClass("visible");
        });

    });

    describe("data-thumbs-bind-event", function () {
        var changeSpy = sinon.spy(),
            destroySpy = sinon.spy(),
            syncSpy = sinon.spy(),
            errorSpy = sinon.spy(),
            TestView = thumbs.View.extend({
                template: '<div data-thumbs-el data-thumbs-bind-event="change:modelChange destroy:modelDestroy sync:modelSync error:modelError">' +
                    '   <button data-thumbs-bind="val:lastName"></button>' +
                    '</div>',
                render: function () {
                    this.$el.html(this.template);
                    return this._super('render', arguments);
                },
                modelChange: changeSpy,
                modelDestroy: destroySpy,
                modelSync: syncSpy,
                modelError: errorSpy
            });


        var TestModel = thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({isChecked: true, lastName: "Yukon"});
            this.view = new TestView({ model: this.model });
        });

        it("should set initial values", function () {
            this.view.render();
            this.model.trigger("change");
            expect(changeSpy).toHaveBeenCalledOnce();
            expect(destroySpy).toHaveNotBeenCalled();
            expect(syncSpy).toHaveNotBeenCalled();
            expect(errorSpy).toHaveNotBeenCalled();

            this.model.trigger("sync");
            expect(changeSpy).toHaveBeenCalledOnce();
            expect(syncSpy).toHaveBeenCalledOnce();
            expect(errorSpy).toHaveNotBeenCalled();
            expect(destroySpy).toHaveNotBeenCalled();

            this.model.trigger("error");
            expect(changeSpy).toHaveBeenCalledOnce();
            expect(syncSpy).toHaveBeenCalledOnce();
            expect(errorSpy).toHaveBeenCalledOnce();
            expect(destroySpy).toHaveNotBeenCalled();

            this.model.trigger("destroy");
            expect(changeSpy).toHaveBeenCalledOnce();
            expect(syncSpy).toHaveBeenCalledOnce();
            expect(errorSpy).toHaveBeenCalledOnce();
            expect(destroySpy).toHaveBeenCalledOnce();


        });

    });


});
