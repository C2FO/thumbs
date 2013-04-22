describe("Thumbs.core", function () {
    describe('Thumbs._super', function () {
        var Model = Thumbs.Model.extend(Thumbs._super).extend({
                greet: function (name) {
                    return "Hello, " + name;
                }
            }),

            Animal = Model.extend({
                greet: function (name) {
                    return this._super('greet', arguments) + " animal";
                }
            }),

            Dog = Animal.extend({
                greet: function (name) {
                    return this._super('greet', arguments) + " dog";
                }
            });

        it('should run the parent instance of a method', function () {
            var animal = new Animal();
            expect(animal.greet('test')).toBe("Hello, test animal");
        });

        it('should be able to inherit all the way up the chain', function () {
            var dog = new Dog();
            expect(dog.greet('test')).toBe("Hello, test animal dog");
        });

        it("should continue to work when _.bind is used", function () {
            var Cat = Animal.extend({
                initialize: function () {
                    _.bindAll(this);
                },

                greet: function (name) {
                    return this._super('greet', arguments) + " cat";
                }
            });

            var Kitten = Cat.extend({
                greet: function () {
                    return this._super('greet', arguments) + " kitten";
                }
            });

            var cat = new Cat();
            expect(cat.greet('test')).toBe('Hello, test animal cat');

            var kitten = new Kitten();
            expect(kitten.greet('test')).toBe('Hello, test animal cat kitten');
        });
    });

    describe("View Registry", function () {


        var View = Thumbs.View.extend({});


        var TestView = View.extend({
            template: '<p>Hello</p>'
        });

        var TestModel = Thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({firstName: "Bob", lastName: "Yukon"})
            this.view = new TestView({ model: this.model });
        });

        describe("Thumbs.viewById", function () {

            it("should find a view by id", function () {
                expect(Thumbs.viewById(this.view.thumbsId)).toEqual(this.view);
            });

            it("should return undefinded if the view does not exist", function () {
                expect(Thumbs.viewById("hello")).toBeUndefined();
            });

            it("should return the view if it is passed in", function(){
                expect(Thumbs.viewById(this.view)).toEqual(this.view);
            });

        });

        describe("Thumbs.viewByNode", function () {

            it("should find a view by id", function () {
                expect(Thumbs.viewByNode(this.view.el)).toEqual(this.view);
            });

            it("should return undefined if the view does not exist", function () {
                this.view.remove().setElement(null);
                expect(Thumbs.viewByNode(this.view.el)).toBeUndefined();
            });

            it("should return the view if it is passed in", function(){
                expect(Thumbs.viewByNode(this.view)).toEqual(this.view);
            });

        });


    });
});
