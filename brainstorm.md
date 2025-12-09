# Brainstorming: Grid Under Image Issue

Here are three potential solutions to fix the issue of the interactive grid being rendered underneath the tree image.

## Solution 1: Z-Index

The most straightforward solution is to use the `z-index` CSS property. By giving the `grid-container` a higher `z-index` than the `canvas` element, we can control the stacking order of these elements and ensure that the grid is rendered on top of the canvas.

### Pros:
*   Simple to implement.
*   Keeps the HTML structure as it is.

### Cons:
*   Might lead to `z-index` wars if the CSS becomes more complex.

## Solution 2: Background Image

Instead of having two separate elements for the image and the grid, we can set the tree image as the `background-image` of the `grid-container` div. This would simplify the DOM structure and eliminate the layering problem altogether.

### Pros:
*   Simpler DOM structure.
*   No need to worry about `z-index`.

### Cons:
*   Might be less flexible if we want to apply complex effects to the image.

## Solution 3: Canvas Composition

We can draw the tree image onto the *same* canvas as the interactive grid. We would first draw the tree image, and then draw the grid and the highlights on top of it. This would require more complex canvas manipulation, but it would be the most efficient solution in terms of rendering performance.

### Pros:
*   Most performant solution.
*   All visual elements are contained within a single canvas.

### Cons:
*   More complex to implement.
*   Requires more canvas manipulation logic.
