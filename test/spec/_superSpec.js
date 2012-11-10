describe('_super', function () {
    var Model = Thumbs.Model.extend({
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