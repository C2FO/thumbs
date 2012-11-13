// An example thumbs application contributed by
// [Doug Martin](http://github.com/doug-martin). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist thumbs models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function () {
    var Todos;

    // Todo Model
    // ----------

    // Our basic **Todo** model has `title`, `order`, and `done` attributes.
    var Todo = thumbs.Model.extend({

        // Default attributes for the todo item.
        defaults: function () {
            return {
                title: "empty todo...",
                order: Todos.nextOrder(),
                done: false
            };
        },

        // Ensure that each todo created has `title`.
        initialize: function () {
            if (!this.get("title")) {
                this.set({"title": this.defaults().title});
            }
        },

        // Toggle the `done` state of this todo item.
        toggle: function () {
            this.save({done: !this.get("done")});
        }

    });

    // Todo Collection
    // ---------------

    // The collection of todos is backed by *localStorage* instead of a remote
    // server.
    var TodoList = thumbs.Collection.extend({

        // Reference to this collection's model.
        model: Todo,

        // Save all of the todo items under the `"todos-thumbs"` namespace.
        localStorage: new thumbs.LocalStorage("todos-thumbs"),

        // Filter down the list of all todo items that are finished.
        done: function () {
            return this.filter(function (todo) {
                return todo.get('done');
            });
        },

        // Filter down the list to only todo items that are still not finished.
        remaining: function () {
            return this.without.apply(this, this.done());
        },

        // We keep the Todos in sequential order, despite being saved by unordered
        // GUID in the database. This generates the next order number for new items.
        nextOrder: function () {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        },

        // Todos are sorted by their original insertion order.
        comparator: function (todo) {
            return todo.get('order');
        }

    });

    // Todo Item View
    // --------------

    // The DOM element for a todo item...
    var TodoView = thumbs.TemplateView.extend({

        template: $("#item-template").html(),

        // Toggle the `"done"` state of the model.
        toggleDone: function () {
            this.model.toggle();
        },

        // Switch this view into `"editing"` mode, displaying the input field.
        edit: function () {
            this.$el.addClass("editing");
            this.$input.focus();
        },

        // Close the `"editing"` mode, saving changes to the todo.
        close: function () {
            var value = this.$input.val();
            if (!value) {
                this.clear();
            } else {
                this.model.save({title: value});
                this.$el.removeClass("editing");
            }
        },

        // If you hit `enter`, we're through editing the item.
        updateOnEnter: function (e) {
            if (e.keyCode == 13) this.close();
        },

        // Remove the item, destroy the model.
        clear: function () {
            this.model.destroy();
        }

    });

    // The Application
    // ---------------

    // Our overall **AppView** is the top-level piece of UI.
    var AppView = thumbs.View.extend({

        initialize: function () {
            this._super("initialize", arguments);
            this.collection.fetch();
            this.render();
            this.updateStats();
        },

        //Update our statistics
        updateStats: function () {
            var collection = this.collection,
                length = collection.length,
                done = collection.done().length,
                remaining = collection.remaining().length;
            this.$main[length ? "show" : "hide"]();
            this.$footer[length ? "show" : "hide"]();
            this.$clearCompletedA.text("Clear " + done + " completed " + (done ? "item" : "items"));
            this.$todoCountDiv.html("<b>" + remaining + "</b> " + (remaining ? "items" : "item") + " left");
            this.allCheckbox.checked = !remaining;
            return this;
        },

        // Add a single todo item to the list by creating a view for it, and
        // appending its element to the `<ul>`.
        addOne: function (todo) {
            this.$todoList.append(new TodoView({model: todo}).render().el);
        },

        // Add all items in the **Todos** collection at once.
        addAll: function () {
            this.collection.each(this.addOne, this);
        },

        // If you hit return in the main input field, create new **Todo** model,
        // persisting it to *localStorage*.
        createOnEnter: function (e) {
            if (e.keyCode == 13 && this.$input.val()) {
                this.collection.create({title: this.$input.val()});
                this.$input.val('');
            }
        },

        // Clear all done todo items, destroying their models.
        clearCompleted: function () {
            _.invoke(this.collection.done(), 'destroy');
            return false;
        },

        toggleAllComplete: function () {
            var done = this.allCheckbox.checked;
            this.collection.invoke("save", {'done': done});
        }

    });

    // Finally, we kick things off by creating the **App**.
    new AppView({el: "#todoapp", collection: (Todos = new TodoList)}).render();

});