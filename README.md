# sectionResizer

This minimalistic JavaScript library can be used to make children of a container resizable in a simple and predictable way using only one line of code. A single sectionResizer() function has to be called with a single mandatory argument, the HTML element of a container, and voilà, the container's children can be resized!

Check out [this page](https://ivanheriver.github.io/sectionResizer/) which shows the example located in the `example/` folder of this repo.

# How to install

Install the library using npm:

```bash
npm install @ivanheriver/section-resizer
```

And then you can import the `sectionResizer()` function

```js
import sectionResizer from "@ivanheriver/section-resizer";
```

Alternatively, you can download the section-resizer.min.js file located in the dist folder and use a script tag to load the the `sectionResizer()` function in you project.

# How to use

Let's say you have an HTML document containing a div with the id "resizer-container". To make the children resizable you only need the following JavaScript:

```js
import sectionResizer from "@ivanheriver/section-resizer";

const resizer = sectionResizer(document.getElementById("resizer-container"));
```

You can make the children be organized verically or horizontally (default):

```js
sectionResizer(document.getElementById("resizer-container"), {
  mode: "vertical",
});
```

You can add data attributes on the children elements to specify their initial, minimum and maximum sizes with the `[data-init]`, `[data-min]` and `[data-max]`. These attributes expects pixels values (without the unit px!). Default minimum sizes for the children is 100px. It is better to specify an initial value only for some of the children (not all).

```html
<div id="resizer-container">
  <div data-min="500" data-max="1000" data-init="500">...</div>
  <div data-min="500">...</div>
  <div>...</div>
</div>
```

You can play around and do many cool things with the object returned by the sectionResizer() function which has several methods attached to it.

The following methods are made available:

- `resize()`
- `configure()`

The `resize()` method can be used to resize specific sections. An array of objects is expected as argument. The objects must be of the form `{index: number, size: number}` where `index` is the index of the section to resize and `size` the new size to apply in pixels.

The `configure()` can be used to (re)set the minimum and maximum size of all sections or specific sections.

- If an array is provided, each element of the array must be in the form `{index: number, min?: number, max?: number}` where `index` is the index of the section to which `min` and/or `max`, the new minimum and maximum values (in pixels), are to be applied.

These 2 methods return promises that resolve at the next animation frame.

Instead of specifying the initial size in the HTML, you can do everything in JavaScript:

```js
import sectionResizer from "@ivanheriver/section-resizer";

const resizer = sectionResizer(document.getElementById("resizer-container"));
resizer.configure([
  { index: 0, min: 500 },
  { index: 1, min: 500 },
]);
resizer.configure({ max: 900 });
resizer.resizer([{ index: 0, size: 500 }]);
```

Future development may include `on()` and `off()` methods to setup listeners for specific events occuring within the sectionResizer. The events may include the following

- resize: whenever resizing is occuring due to user interaction
  `(initial_sizes, current_sizes, index) => {}`
- resizeend: whenever resizing due to user interaction terminates
  `(previous_sizes, new_sizes, index) => {}`
- resizewish: whenever resizing is occuring due to user interaction even if the resizing actually doesn't occure due to
  min or max size conditions preventing any change.
  `(initial_sizes, current_sizes, wished_sizes, index) => {}`
- sizechange: whenever one or more of the children size changes due
  to any reason (e. g. user interaction, addition/deletion of children, window resizing, ...)
  `(sizes) => {}`
- highlight: whenever a separator highlight status is changed
  `(index, highlighted) => {}`

# Licence

This is released under the MIT licence.
