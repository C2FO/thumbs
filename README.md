[![Build Status](https://travis-ci.org/C2FO/thumbs.png?branch=master)](https://travis-ci.org/C2FO/thumbs)

# Thumbs

`thumbs` is a library built on top of [`backbone`](http://backbonejs.org/) that provides many new features to help reduce the amount of "boiler-plate" required when building backbone applications.

## Installation

`npm install thumbs`

Or [download the source](https://raw.github.com/C2FO/thumbs/master/thumbs.js) ([minified](https://raw.github.com/doug-martin/thumbs/master/thumbs.min.js))

**Note** `thumbs` depends on [`backbone`](http://backbonejs.org/)

## Usage

`thumbs` exposes all backbone functionality so you can use it in place of `backbone` when creating your application.

### thumbs.Class

`thumbs` exposes a `Class` constructor that enables the creation of objects that are not a `View` or `Model`.

For example you could use `thumbs.Class` to create a `Poller`.


```javascript

 var Poller = thumbs.Class.extend({

    initialize : function(model){
        this.model = model;
        this.__polling = false;
        this.__pollTimer = null;
        _.bindAll(this);
    },

    sync : function(){
        this.model.fetch().done(this.poll);
    },

    poll : function () {
        if (this.__polling) {
            this.__pollTimer = setTimeout(this.sync, this.interval);
        }
        return this;
    },

    start : function () {
        if (!this.__polling) {
            this.__polling = true;
            this.poll();
        }
        return this;
    },

    stop : function () {
        if (this.__polling) {
            this.__polling = false;
            clearTimeout(this.__pollTimer);
        }
        return this;
    }

});


```

###`_super(methodName, arguments)`

`thumbs` provides a `_super` method that allows you to call the inherited methods. This makes building subclassing easier.

The `_super` method is added to

 * `thumbs.Collection`
 * `thumbs.Model`
 * `thumbs.View`
 * `thumbs.TemplateView`
 * `thumbs.Router`
 * `thumbs.History`
 * `thumbs.Class`

```javascript
var myView = thumbs.View.extend({

    render : function(){
        this._super("render", arguments);
        //do our render code
        return this;
    }

});
```

###`thumbs.View`

`thumbs` builds on top of `bacbone.View` by providing new functionality while still maintiaing full compatibilty with normal `backbone.View`s.

### `data-thumbs-*`

Many of the features that `thumbs.View` implements is the ability to add `data` attributes to your `el` to specify different behavior reducing the amount of boiler plate required to create a view.

**`data-thumbs-id`**

The `data-thumbs-id` attribute allows you to specify elements that you want as a property on a view.

Assume you have the following in your views dom.


```html
<div>
    <div data-thumbs-id='firstName'>
</div>

```

You could then reference that div by either the `$firstName` to get the wrapped element or by `firstName` to get the actual dom node.

```javascript
var MyView = thumbs.View.extend({

    render : function(){
        this._super("render", arguments);
        this.$firstName.text(this.model.get("firstName");
    }

})

```

**`data-thumbs-delegate`**

The `data-thumbs-delegate` attribute allows you to specify event handlers in your DOM Node.

```html
<div>
    <button data-thumbs-delegate="click:buttonClicked">Test Button</button>
</div>

```

```javascript
var MyView = thumbs.View.extend(function(){

    buttonClicked : function(){
        alert("Button Clicked!");
    }

});

```

To bind to multiple events you can separate your events by a space.


```html
<div>
    <button data-thumbs-delegate="click:buttonClicked focus:buttonFocused">Test Button</button>
</div>

```

```javascript
var MyView = thumbs.View.extend(function(){

    buttonClicked : function(){
        alert("Button Clicked!");
    },

    buttonFocused : function(){
        alert("Button Focused!");
    }

});

```

**`data-thumbs-bind`**

The `data-thumbs-bind` attribute allows you to specify `model` attributes that should be bound to a DOM element.

The `data-thumbs-bind` event will automatically try to determine how to apply the attribute to the dom node based off what type of dom node it is.

If the dom element is an `input` element then it will first check if it is a `radio` or `checkbox` it will aet the `checked` attribute if otherwise it will set the `value` of the element.

```html
<form>
    <input type="radio" data-thumbs-bind="isChecked"/>
    <input data-thumbs-bind="lastName"/>
</form>
```


If the dom element is not an `input` (i.e. a `div`) then it will set the `text` of the element.

```html
<form>
    <div data-thumbs-bind="firstName"></div>
    <span data-thumbs-bind="lastName"></span>
</form>
```

`data-thumbs-bind` will also listen for changes on any bound property and automatically update the element.

If you wish to specify what property/attribute to set on an element you can also use the `<attribute|function>:<modelProperty>` syntax

```html
<form>
    <input type="radio" data-thumbs-bind="checked:isChecked"/>
    <input data-thumbs-bind="val:lastName"/>
</form>
```

As with `data-thumbs-delegate` you can specify multiple attributes to be set by seperating with a space.

```html
<form>
    <input type="radio" data-thumbs-bind="checked:isChecked data-model-isChecked:isChecked"/>
</form>
```

**`data-thumbs-bind-event`**

The `data-thumbs-bind-event` allows you to listen for model changes at the view level rather than at the element level.

```html
<div data-thumbs-bind-event="change:modelChange destroy:modelDestroy sync:modelSync error:modelError">
    <form>
        <input type="radio" data-thumbs-bind="isChecked"/>
    </form>
</div>
```

```javascript

var MyView = thumbs.View.extend({

    modelChange : function(){
        alert("Model Changed!");
    },

    modelDestroy : function(){
        alert("Model Destroyed!");
    },

    modelSync : function(){
        alert("Model Synced!");
    },

    modelError : function(){
        alert("Model Error!");
    }

});

```

**`data-thumbs-bind-class`**

The `data-thumbs-bind-class` attribute allows you to toggle classes based on a truthy value.

In this example the class "visible" added/removed based on the model attribute `isChecked`

```html
<p data-thumbs-bind-class="visible:isChecked"></p>
```

**`data-thumbs-format`**

The `data-thumbs-format` attribute allows the specification of a formatting function this is typically used in tandem with `data-thumbs-bind`.

The `data-thumbs-format` will look a function matching the name given to `data-thumbs-format`

For example suppose you had a value that is a currency.

```html
<div>
    <span data-thumbs-bind="income" data-thumbs-format="formatCurrency"></span>
</div>
```

In your view add a function matching the `data-thumbs-format` value.

```javascript
var MyView = thumbs.View.extend({
    formatCurrency:function(value){
        return "$" + value;
    }
});
```

`data-thumbs-el`

The `data-thumbs-el` attribute allows you to specify what your el should be when creating your views.

For example suppose you have a view, if you use the default backbone then you element will be wrapped in a div.

**Note** If you pass in an `el` to your view and you use `data-thumbs-el` then that element will be replaced.

```html
<li data-thumbs-el>
  <span data-thumbs-bind="value">
<li>
```

### Subviews


**`data-thumbs-view`**

The `data-thumbs-view` attribute allows you to specify subviews that should be rendered.

To use the `data-thumbs-view` you must first expose a constructor on your view that can be used to create your view.

```javascript
var MyView = thumbs.View.extend({
    MySubView : MySubView
});
```

And your DOM Element would look like the following

```html

<div>
    <div data-thumbs-view="MySubView"></div>
</div>

```

**`data-thumbs-args`**

When creating a subview you may have options you wish to pass to the constructor of that subview to do that use `data-thumbs-args`

`data-thumbs-args` takes a syntax very similar to a `javascript` object.

```html

<div>
    <div data-thumbs-view="MySubView" data-thumbs-args="option1 : 'hello', option2 : true"></div>
</div>

```

To reference properties on the parent view you may just reference them as you normally would.

```html

<div>
    <div data-thumbs-view="MySubView" data-thumbs-args="model:model"></div>
</div>

```

**Note** how model is reference with out the `this` keyword.

**`data-thumbs-id`**

When using `data-thumbs-id` with a subview the `$` representation of the id will be a reference to the view instead of the wrapped DOM element.

```html
<div>
    <input data-thumbs-id="firstName" data-thumbs-view="InputBox"></div>
</div>
```

```javascript
var MyView = thumbs.View.extend({

    InputBox : InputBox,

    render : function(){
        this._super("render", arguments);
        //assume InputBox has a method val();
        this.$firstName.val(model.get("firstName"));
        return this;
    }

});
```

**`data-thumbs-bind`**

When using `data-thumbs-bind` with a subview it will look for the following functions to set the value.

* `val` : If your subview contains a `val` function then the value will be passed to that function.

```html
<div>
    <input data-thumbs-bind="firstName" data-thumbs-view="InputBox"></div>
</div>
```

```javascript
var InputBox = thumbs.View.extend({
    val : function(val){
        this.$input.val(val);
        this.value = val;
        return this;
    }
});

var MyView = thumbs.View.extend({
    InputBox : InputBox
});

```

* `text` : If your subview contains a `text` function then the value will be passed to that function.

```html
<div>
    <div data-thumbs-bind="firstName" data-thumbs-view="TextView"></div>
</div>
```

```javascript
var TextView = thumbs.View.extend({
    text : function(val){
        this.$el.text(val);
        return this;
    }
});

var MyView = thumbs.View.extend({
    TextView : TextView
});

```

If you wish to specify a custom setter then you may specify it through the `<functionName>:<boundValue>` format


```html
<div>
    <div data-thumbs-bind="textValue:firstName" data-thumbs-view="TextView"></div>
</div>
```

```javascript
var TextView = thumbs.View.extend({
    textValue : function(val){
        this.$el.text(val);
        return this;
    }
});

var MyView = thumbs.View.extend({
    TextView : TextView
});

```

###`thumbs.TemplateView`

Thumbs provides a view that will parse templates and add it to the `el` of the view.

```html
<script type="text/template" id="li-template">
    <li data-thumbs-el=true>
       <span data-thumbs-bind="label"></span>
    </li>
</script>
```

```javascript

var MyView = thumbs.TemplateView.extend({
    template : $("#li-template").text()
});

```

By default `thumbs.TemplateView` will use the `_.template` function. If you wish to use your own templater such as [`handlebars`](http://handlebarsjs.com/) you can set it through `thumbs.templater`

```
thumbs.templater(function(tmpl){
    return Handlebars.compile(tmpl);
});
```

###`thumbs.viewByNode`

This function allow you to look up a view by a DOM Node.

```
var view = thumbs.viewByNode(domNode);
```

###`thumbs.viewById`

This function allows you to look up a view by the `thumbsId` of a view.

```javascript
thumbs.viewById($node.attr("thumbs-id"));
```

###`thumbs.VERSION`

The current version of `thumbs`.

###`thumbs.MULTI_ARG_TOKEN`

By default thumbs splits attributes that accept multiple arguments by the following `RegExp` `/ +/` you can change that functionality by setting this property.

```javascript
//split multiple arguments by a '|' character
thumbs.MULTI_ARG_TOKEN = /\|/;
```

```html
<div>
    <button data-thumbs-delegate="click:onClick|focus:onFocus"></button>
</div>
```

###`thumbs.KEY_VALUE_TOKEN`

If you wish to change how key values in data attrbutes are split you can set this property.

```javascript
//split multiple arguments by a '~' character
thumbs.KEY_VALUE_TOKEN = '~';
```

```html
<div>
    <button data-thumbs-delegate="click~onClick focus~onFocus"></button>
</div>
```



